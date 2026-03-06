import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class AIFailure(Base):
    __tablename__ = "ai_failures"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    diagnosis_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("diagnoses.id", ondelete="SET NULL"))
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("agent_conversations.id", ondelete="SET NULL")
    )
    failure_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # "hallucination", "confidence_miscalibration", "harmful_recommendation",
    # "species_misidentification", "tool_failure", "parse_failure"
    severity: Mapped[str] = mapped_column(String(20), default="medium")
    # "low", "medium", "high", "critical"
    input_summary: Mapped[str | None] = mapped_column(String(2000))
    expected_output: Mapped[str | None] = mapped_column(String(2000))
    actual_output: Mapped[str | None] = mapped_column(String(2000))
    resolution: Mapped[str | None] = mapped_column(String(2000))
    extra_data: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
