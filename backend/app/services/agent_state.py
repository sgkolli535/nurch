"""
LangGraph agent state definition.
This TypedDict flows through every node in the garden agent graph.
"""
from typing import Annotated, Sequence, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class GardenAgentState(TypedDict):
    """State that flows through the LangGraph garden agent."""

    # Core conversation — LangGraph manages message history via add_messages reducer
    messages: Annotated[Sequence[BaseMessage], add_messages]

    # Context gathered for this turn
    garden_context: dict | None
    tool_results: list[dict]

    # Trust & credibility outputs
    reasoning_chain: list[str]
    citations: list[dict]  # [{"source": "UC_DAVIS", "claim": "..."}]
    confidence_scores: dict  # {"overall": 0.85}
    confidence_level: str  # "high" | "moderate" | "low"

    # Final output
    final_response: str | None

    # Metadata
    user_id: str
    conversation_id: str | None
