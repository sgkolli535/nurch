import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    garden_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("gardens.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    light_type: Mapped[str | None] = mapped_column(String(50))
    zone_type: Mapped[str | None] = mapped_column(String(50))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    # Isometric map placement
    position_x: Mapped[float] = mapped_column(Float, default=0.0)
    position_y: Mapped[float] = mapped_column(Float, default=0.0)
    width: Mapped[float] = mapped_column(Float, default=0.3)
    height: Mapped[float] = mapped_column(Float, default=0.3)
    # Grid layout for plants within the zone
    grid_cols: Mapped[int] = mapped_column(Integer, default=3)
    grid_rows: Mapped[int] = mapped_column(Integer, default=3)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    garden: Mapped["Garden"] = relationship(back_populates="zones")
    plants: Mapped[list["Plant"]] = relationship(back_populates="zone")
