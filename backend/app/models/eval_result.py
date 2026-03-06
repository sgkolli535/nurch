import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Numeric, String, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class EvalResult(Base):
    __tablename__ = "eval_results"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    diagnosis_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("diagnoses.id", ondelete="CASCADE"), index=True
    )
    eval_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # "diagnosis_accuracy", "recommendation_safety", "confidence_calibration"
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    score: Mapped[float | None] = mapped_column(Numeric(5, 3))
    details: Mapped[dict | None] = mapped_column(JSONB)
    # e.g., {"flags": ["sun_mismatch"], "expected": "shade", "ai_said": "more sun"}
    prompt_version_used: Mapped[str | None] = mapped_column(String(100))
    model_used: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
