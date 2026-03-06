import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    plant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("plants.id", ondelete="CASCADE"), nullable=False, index=True)
    photo_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("photos.id", ondelete="SET NULL"))
    previous_photo_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("photos.id"))
    model_used: Mapped[str] = mapped_column(String(50), nullable=False)

    # Structured diagnosis
    overall_health: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)
    summary: Mapped[str | None] = mapped_column(String(1000))

    # Six diagnostic categories (nullable JSONB)
    hydration_status: Mapped[dict | None] = mapped_column(JSONB)
    nutrient_status: Mapped[dict | None] = mapped_column(JSONB)
    pest_status: Mapped[dict | None] = mapped_column(JSONB)
    disease_status: Mapped[dict | None] = mapped_column(JSONB)
    environmental_status: Mapped[dict | None] = mapped_column(JSONB)
    growth_assessment: Mapped[dict | None] = mapped_column(JSONB)

    # Change detection and predictions
    changes_detected: Mapped[list | None] = mapped_column(JSONB)
    predictions: Mapped[list | None] = mapped_column(JSONB)

    # Trust & credibility fields
    reasoning_chain: Mapped[list | None] = mapped_column(JSONB)
    citations: Mapped[list | None] = mapped_column(JSONB)
    # [{"source": "UC_DAVIS", "claim": "tomato blight identification guide"}]
    confidence_level: Mapped[str | None] = mapped_column(String(20))
    # "high", "moderate", "low"
    uncertainty_notes: Mapped[str | None] = mapped_column(String(2000))
    prompt_version_used: Mapped[str | None] = mapped_column(String(100))

    # Raw AI data
    raw_response: Mapped[dict | None] = mapped_column(JSONB)
    context_payload: Mapped[dict | None] = mapped_column(JSONB)

    processing_time_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    plant: Mapped["Plant"] = relationship(back_populates="diagnoses")
    photo: Mapped["Photo | None"] = relationship(foreign_keys=[photo_id])
    previous_photo: Mapped["Photo | None"] = relationship(foreign_keys=[previous_photo_id])
