import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    prompt_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # "diagnosis", "agent_system", "safety_check"
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    # "v1", "v2", etc.
    prompt_text: Mapped[str] = mapped_column(String(50000), nullable=False)
    changelog: Mapped[str | None] = mapped_column(String(2000))
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    eval_metrics: Mapped[dict | None] = mapped_column(JSONB)
    # e.g., {"accuracy": 0.87, "hallucination_rate": 0.03}
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
