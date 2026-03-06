import uuid
from datetime import datetime

from sqlalchemy import DateTime, Numeric, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Garden(Base):
    __tablename__ = "gardens"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000))
    location_lat: Mapped[float | None] = mapped_column(Numeric(9, 6))
    location_lng: Mapped[float | None] = mapped_column(Numeric(9, 6))
    hardiness_zone: Mapped[str | None] = mapped_column(String(10))
    soil_type: Mapped[str | None] = mapped_column(String(100))
    soil_ph_low: Mapped[float | None] = mapped_column(Numeric(3, 1))
    soil_ph_high: Mapped[float | None] = mapped_column(Numeric(3, 1))
    soil_drainage: Mapped[str | None] = mapped_column(String(50))
    privacy: Mapped[str] = mapped_column(String(20), default="private")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="gardens")
    zones: Mapped[list["Zone"]] = relationship(back_populates="garden", cascade="all, delete-orphan")
    plants: Mapped[list["Plant"]] = relationship(back_populates="garden", cascade="all, delete-orphan")
