import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Plant(Base):
    __tablename__ = "plants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    garden_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("gardens.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("zones.id", ondelete="SET NULL"), index=True)
    species_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("species.id"), index=True)
    custom_name: Mapped[str] = mapped_column(String(200), nullable=False)
    planting_date: Mapped[date | None] = mapped_column(Date)
    acquired_date: Mapped[date | None] = mapped_column(Date)
    location_detail: Mapped[str | None] = mapped_column(String(50))
    container_type: Mapped[str | None] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(String(2000))
    health_status: Mapped[str] = mapped_column(String(20), default="unknown")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    cover_photo_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("photos.id", ondelete="SET NULL", use_alter=True))
    # Isometric map placement within zone
    position_x: Mapped[float] = mapped_column(Float, default=0.5)
    position_y: Mapped[float] = mapped_column(Float, default=0.5)
    # Grid cell within zone (0-indexed)
    grid_col: Mapped[int] = mapped_column(Integer, default=0)
    grid_row: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    garden: Mapped["Garden"] = relationship(back_populates="plants")
    zone: Mapped["Zone | None"] = relationship(back_populates="plants")
    species: Mapped["Species | None"] = relationship()
    photos: Mapped[list["Photo"]] = relationship(back_populates="plant", cascade="all, delete-orphan", foreign_keys="Photo.plant_id")
    diagnoses: Mapped[list["Diagnosis"]] = relationship(back_populates="plant", cascade="all, delete-orphan")
