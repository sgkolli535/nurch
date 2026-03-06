import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Numeric, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(100))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    location_lat: Mapped[float | None] = mapped_column(Numeric(9, 6))
    location_lng: Mapped[float | None] = mapped_column(Numeric(9, 6))
    hardiness_zone: Mapped[str | None] = mapped_column(String(10))
    timezone: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    settings: Mapped["UserSettings"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    gardens: Mapped[list["Garden"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    notification_critical: Mapped[bool] = mapped_column(Boolean, default=True)
    notification_advisory: Mapped[bool] = mapped_column(Boolean, default=True)
    notification_info: Mapped[bool] = mapped_column(Boolean, default=True)
    photo_reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    photo_reminder_frequency: Mapped[str] = mapped_column(String(20), default="weekly")
    privacy_default: Mapped[str] = mapped_column(String(20), default="private")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="settings")
