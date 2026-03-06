"""
Agent router — LangGraph-powered garden assistant with tool calling,
citations, confidence scoring, and SSE streaming.
"""
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.agent import AgentConversation, AgentMessage
from app.models.user import User
from app.services.agent_graph import build_graph

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])


class ChatMessage(BaseModel):
    message: str
    conversation_id: uuid.UUID | None = None


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message: str
    citations: list[dict] = []
    confidence_level: str = "moderate"


# ---------------------------------------------------------------------------
# POST /chat — standard request-response using LangGraph
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatMessage,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get or create conversation
    if data.conversation_id:
        conv_result = await db.execute(
            select(AgentConversation).where(
                AgentConversation.id == data.conversation_id,
                AgentConversation.user_id == user.id,
            )
        )
        conversation = conv_result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = AgentConversation(user_id=user.id)
        db.add(conversation)
        await db.flush()

    # Save user message
    user_msg = AgentMessage(
        conversation_id=conversation.id,
        role="user",
        content=data.message,
    )
    db.add(user_msg)

    # Load conversation history as LangChain messages
    msgs_result = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.conversation_id == conversation.id)
        .order_by(AgentMessage.created_at)
    )
    messages = []
    for m in msgs_result.scalars().all():
        if m.role == "user":
            messages.append(HumanMessage(content=m.content))
        # Assistant messages are managed by the graph via checkpointing

    # Build initial state
    initial_state = {
        "messages": messages,
        "garden_context": None,
        "tool_results": [],
        "reasoning_chain": [],
        "citations": [],
        "confidence_scores": {},
        "confidence_level": "moderate",
        "final_response": None,
        "user_id": str(user.id),
        "conversation_id": str(conversation.id),
    }

    # Run the graph
    graph = build_graph()
    config = {"configurable": {"thread_id": str(conversation.id)}}
    result = await graph.ainvoke(initial_state, config=config)

    response_text = result.get("final_response", "I'm sorry, I couldn't generate a response.")
    citations = result.get("citations", [])
    confidence_level = result.get("confidence_level", "moderate")

    # Save assistant message with metadata
    assistant_msg = AgentMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=response_text,
        extra_data={"citations": citations, "confidence_level": confidence_level},
    )
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        message=response_text,
        citations=citations,
        confidence_level=confidence_level,
    )


# ---------------------------------------------------------------------------
# POST /chat/stream — Server-Sent Events streaming endpoint
# ---------------------------------------------------------------------------

@router.post("/chat/stream")
async def chat_stream(
    data: ChatMessage,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get or create conversation
    if data.conversation_id:
        conv_result = await db.execute(
            select(AgentConversation).where(
                AgentConversation.id == data.conversation_id,
                AgentConversation.user_id == user.id,
            )
        )
        conversation = conv_result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = AgentConversation(user_id=user.id)
        db.add(conversation)
        await db.flush()

    # Save user message
    user_msg = AgentMessage(
        conversation_id=conversation.id,
        role="user",
        content=data.message,
    )
    db.add(user_msg)
    await db.commit()

    # Build initial state
    initial_state = {
        "messages": [HumanMessage(content=data.message)],
        "garden_context": None,
        "tool_results": [],
        "reasoning_chain": [],
        "citations": [],
        "confidence_scores": {},
        "confidence_level": "moderate",
        "final_response": None,
        "user_id": str(user.id),
        "conversation_id": str(conversation.id),
    }

    graph = build_graph()
    config = {"configurable": {"thread_id": str(conversation.id)}}

    async def event_generator():
        final_response = ""
        final_citations = []
        final_confidence = "moderate"

        try:
            async for event in graph.astream_events(initial_state, config=config, version="v2"):
                event_type = event.get("event", "")

                # Stream LLM tokens as they arrive
                if event_type == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if chunk and hasattr(chunk, "content") and chunk.content:
                        yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"

                # Send progress updates when nodes complete
                elif event_type == "on_chain_end":
                    name = event.get("name", "")
                    if name == "gather_context":
                        yield f"data: {json.dumps({'type': 'status', 'node': 'gather_context', 'message': 'Reviewing your garden...'})}\n\n"
                    elif name == "cite_sources":
                        output = event.get("data", {}).get("output", {})
                        final_citations = output.get("citations", [])
                    elif name == "score_confidence":
                        output = event.get("data", {}).get("output", {})
                        final_confidence = output.get("confidence_level", "moderate")
                    elif name == "format_response":
                        output = event.get("data", {}).get("output", {})
                        final_response = output.get("final_response", "")

            # Send final metadata
            yield f"data: {json.dumps({'type': 'metadata', 'citations': final_citations, 'confidence_level': final_confidence})}\n\n"
            yield "data: [DONE]\n\n"

            # Persist assistant message
            async with db.begin():
                assistant_msg = AgentMessage(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=final_response,
                    extra_data={"citations": final_citations, "confidence_level": final_confidence},
                )
                db.add(assistant_msg)

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Conversation-ID": str(conversation.id),
        },
    )


# ---------------------------------------------------------------------------
# Conversation management endpoints (unchanged)
# ---------------------------------------------------------------------------

@router.get("/conversations")
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentConversation)
        .where(AgentConversation.user_id == user.id)
        .order_by(AgentConversation.created_at.desc())
        .limit(20)
    )
    return [
        {"id": str(c.id), "created_at": c.created_at.isoformat()}
        for c in result.scalars().all()
    ]


@router.get("/conversations/{conv_id}/messages")
async def get_conversation_messages(
    conv_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv_result = await db.execute(
        select(AgentConversation).where(
            AgentConversation.id == conv_id,
            AgentConversation.user_id == user.id,
        )
    )
    if not conv_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs_result = await db.execute(
        select(AgentMessage)
        .where(AgentMessage.conversation_id == conv_id)
        .order_by(AgentMessage.created_at)
    )
    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "metadata": m.extra_data,
            "created_at": m.created_at.isoformat(),
        }
        for m in msgs_result.scalars().all()
    ]
