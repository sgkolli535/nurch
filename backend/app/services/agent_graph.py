"""
LangGraph agent graph for the Nurch garden assistant.

Graph flow:
  START → gather_context → agent_reasoning ⟷ tools → cite_sources
    → score_confidence → format_response → END

The agent uses tool-calling to look up the user's garden data, weather,
species info, and care calendars. Every response includes reasoning,
citations, and confidence scoring.
"""
import re

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode

from app.config import settings
from app.prompts.registry import get_code_prompt
from app.services.agent_state import GardenAgentState
from app.services.agent_tools import (
    get_care_calendar,
    get_garden_overview,
    get_plant_detail,
    get_species_info,
    get_weather,
)

# Import prompts to register them
import app.prompts.agent  # noqa: F401

TOOLS = [get_garden_overview, get_plant_detail, get_weather, get_care_calendar, get_species_info]


def _get_llm():
    """Return the LLM based on AI_PROVIDER config."""
    if settings.ai_provider == "claude":
        return ChatAnthropic(
            model="claude-sonnet-4-20250514",
            api_key=settings.anthropic_api_key,
            max_tokens=1500,
        )
    if settings.ai_provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model="gpt-4o",
            api_key=settings.openai_api_key,
            max_tokens=1500,
        )
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=settings.gemini_api_key,
    )


# ---------------------------------------------------------------------------
# Graph nodes
# ---------------------------------------------------------------------------

async def gather_context(state: GardenAgentState) -> dict:
    """Automatically fetch garden overview before the LLM reasons."""
    user_id = state.get("user_id", "")
    if not user_id:
        return {"garden_context": {}}

    overview = await get_garden_overview.ainvoke({"user_id": user_id})
    return {"garden_context": overview}


async def agent_reasoning(state: GardenAgentState) -> dict:
    """LLM decides: respond directly or call tools for more info."""
    llm = _get_llm().bind_tools(TOOLS)

    system_prompt = get_code_prompt("agent_system")
    garden_ctx = state.get("garden_context") or {}
    system_text = system_prompt.format(garden_context=str(garden_ctx))

    messages = [SystemMessage(content=system_text)] + list(state["messages"])
    response = await llm.ainvoke(messages)
    return {"messages": [response]}


async def cite_sources(state: GardenAgentState) -> dict:
    """Extract source citations from the agent's response."""
    last_msg = state["messages"][-1]
    content = last_msg.content if hasattr(last_msg, "content") else str(last_msg)

    # Extract (Source: XYZ) patterns
    found = re.findall(r'\(Source:\s*(\w+)\)', content)
    citations = [{"source": s, "claim": "referenced in response"} for s in sorted(set(found))]

    # Also check for inline "According to X" patterns
    inline_sources = re.findall(
        r'(?:According to|Based on|Per)\s+(UC Davis|USDA|Cooperative Extension|Cornell|RHS|our (?:species )?database)',
        content, re.IGNORECASE,
    )
    source_map = {
        "uc davis": "UC_DAVIS",
        "usda": "USDA",
        "cooperative extension": "COOP_EXT",
        "cornell": "CORNELL",
        "rhs": "RHS",
        "our database": "SPECIES_DB",
        "our species database": "SPECIES_DB",
    }
    for src in inline_sources:
        abbr = source_map.get(src.lower(), src.upper())
        if not any(c["source"] == abbr for c in citations):
            citations.append({"source": abbr, "claim": "inline reference"})

    return {"citations": citations}


async def score_confidence(state: GardenAgentState) -> dict:
    """Heuristic confidence scoring based on context quality and response traits."""
    citations = state.get("citations", [])
    garden_ctx = state.get("garden_context")
    last_msg = state["messages"][-1]
    content = str(last_msg.content) if hasattr(last_msg, "content") else str(last_msg)

    score = 0.5

    # Boost: has garden context
    if garden_ctx and garden_ctx.get("gardens"):
        score += 0.1

    # Boost: has citations (each citation adds credibility, capped)
    score += min(0.2, len(citations) * 0.05)

    # Boost: used tools (tool_results accumulated)
    tool_results = state.get("tool_results", [])
    if tool_results:
        score += 0.1

    # Penalty: hedging language suggests lower confidence
    hedging = ["i'm not sure", "might be", "possibly", "i think", "it could be", "hard to tell"]
    hedge_count = sum(1 for h in hedging if h in content.lower())
    score -= hedge_count * 0.05

    # Penalty: very short response likely lacks detail
    if len(content) < 100:
        score -= 0.1

    score = max(0.1, min(1.0, score))
    level = "high" if score >= 0.75 else "moderate" if score >= 0.5 else "low"

    return {
        "confidence_scores": {"overall": round(score, 2)},
        "confidence_level": level,
    }


async def format_response(state: GardenAgentState) -> dict:
    """Assemble the final response from the last message."""
    last_msg = state["messages"][-1]
    content = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
    return {"final_response": content}


# ---------------------------------------------------------------------------
# Conditional edges
# ---------------------------------------------------------------------------

def should_use_tools(state: GardenAgentState) -> str:
    """Route: if the LLM requested tool calls, execute them; otherwise proceed to citations."""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "cite_sources"


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

def build_graph() -> StateGraph:
    """Build the LangGraph garden agent (without checkpointing)."""
    tool_node = ToolNode(TOOLS)

    builder = StateGraph(GardenAgentState)
    builder.add_node("gather_context", gather_context)
    builder.add_node("agent_reasoning", agent_reasoning)
    builder.add_node("tools", tool_node)
    builder.add_node("cite_sources", cite_sources)
    builder.add_node("score_confidence", score_confidence)
    builder.add_node("format_response", format_response)

    builder.set_entry_point("gather_context")
    builder.add_edge("gather_context", "agent_reasoning")
    builder.add_conditional_edges("agent_reasoning", should_use_tools, {
        "tools": "tools",
        "cite_sources": "cite_sources",
    })
    builder.add_edge("tools", "agent_reasoning")  # loop back after tool execution
    builder.add_edge("cite_sources", "score_confidence")
    builder.add_edge("score_confidence", "format_response")
    builder.add_edge("format_response", END)

    return builder.compile()


async def build_checkpointed_graph():
    """Build the graph with PostgreSQL checkpointing for conversation persistence."""
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

    # langgraph-checkpoint-postgres needs a plain psycopg connection string
    # Convert from asyncpg format if needed
    db_url = settings.database_url
    if "asyncpg" in db_url:
        db_url = db_url.replace("+asyncpg", "")

    checkpointer = AsyncPostgresSaver.from_conn_string(db_url)
    await checkpointer.setup()

    tool_node = ToolNode(TOOLS)

    builder = StateGraph(GardenAgentState)
    builder.add_node("gather_context", gather_context)
    builder.add_node("agent_reasoning", agent_reasoning)
    builder.add_node("tools", tool_node)
    builder.add_node("cite_sources", cite_sources)
    builder.add_node("score_confidence", score_confidence)
    builder.add_node("format_response", format_response)

    builder.set_entry_point("gather_context")
    builder.add_edge("gather_context", "agent_reasoning")
    builder.add_conditional_edges("agent_reasoning", should_use_tools, {
        "tools": "tools",
        "cite_sources": "cite_sources",
    })
    builder.add_edge("tools", "agent_reasoning")
    builder.add_edge("cite_sources", "score_confidence")
    builder.add_edge("score_confidence", "format_response")
    builder.add_edge("format_response", END)

    return builder.compile(checkpointer=checkpointer)
