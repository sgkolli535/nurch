import uuid
from datetime import datetime

from sqlalchemy import ARRAY, Boolean, DateTime, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class Species(Base):
    __tablename__ = "species"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    common_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    scientific_name: Mapped[str | None] = mapped_column(String(200))
    family: Mapped[str | None] = mapped_column(String(100))
    category: Mapped[str | None] = mapped_column(String(50), index=True)

    # Environmental requirements
    hardiness_zones: Mapped[str | None] = mapped_column(String(50))
    sun_requirement: Mapped[str | None] = mapped_column(String(50))
    water_needs: Mapped[str | None] = mapped_column(String(50))
    soil_ph_low: Mapped[float | None] = mapped_column(Numeric(3, 1))
    soil_ph_high: Mapped[float | None] = mapped_column(Numeric(3, 1))
    soil_type_preferred: Mapped[str | None] = mapped_column(String(100))
    humidity_preference: Mapped[str | None] = mapped_column(String(50))

    # Temperature ranges (Fahrenheit)
    temp_min_f: Mapped[int | None] = mapped_column(Integer)
    temp_max_f: Mapped[int | None] = mapped_column(Integer)
    temp_ideal_low_f: Mapped[int | None] = mapped_column(Integer)
    temp_ideal_high_f: Mapped[int | None] = mapped_column(Integer)
    frost_tolerant: Mapped[bool] = mapped_column(Boolean, default=False)

    # Growth info
    growth_rate: Mapped[str | None] = mapped_column(String(50))
    mature_height: Mapped[str | None] = mapped_column(String(50))
    mature_spread: Mapped[str | None] = mapped_column(String(50))
    days_to_maturity: Mapped[int | None] = mapped_column(Integer)
    lifespan_type: Mapped[str | None] = mapped_column(String(20))

    # Care calendar template (JSONB with monthly tasks)
    care_calendar: Mapped[dict | None] = mapped_column(JSONB)
    common_pests: Mapped[list | None] = mapped_column(JSONB)
    common_diseases: Mapped[list | None] = mapped_column(JSONB)

    # Visual references
    healthy_description: Mapped[str | None] = mapped_column(String(1000))
    symptom_guide: Mapped[list | None] = mapped_column(JSONB)

    # Companion planting
    companions: Mapped[list | None] = mapped_column(JSONB)
    antagonists: Mapped[list | None] = mapped_column(JSONB)

    # Metadata
    icon_emoji: Mapped[str | None] = mapped_column(String(10))
    cover_image_url: Mapped[str | None] = mapped_column(String(500))
    search_tags: Mapped[list | None] = mapped_column(ARRAY(String))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
