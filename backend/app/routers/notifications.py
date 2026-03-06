import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.database import get_db
from app.dependencies import get_current_user
from app.models.alert import Alert
from app.models.user import User, UserSettings

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


class DeviceRegister(BaseModel):
    token: str
    device_os: str | None = None


class DeviceUnregister(BaseModel):
    token: str


class NotificationSettingsUpdate(BaseModel):
    notification_critical: bool | None = None
    notification_advisory: bool | None = None
    notification_info: bool | None = None
    photo_reminder_enabled: bool | None = None
    photo_reminder_frequency: str | None = None


@router.post("/register-device")
async def register_device(
    data: DeviceRegister,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register a device's FCM push token for receiving notifications."""
    from app.services.notification_service import register_device_token
    token = await register_device_token(user.id, data.token, data.device_os, db)
    return {"status": "ok", "token_id": str(token.id)}


@router.delete("/register-device")
async def unregister_device(
    data: DeviceUnregister,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unregister a device's FCM push token."""
    from app.services.notification_service import unregister_device_token
    await unregister_device_token(user.id, data.token, db)
    return {"status": "ok"}


@router.get("")
async def list_notifications(
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    unread_only: bool = Query(False),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Alert).where(Alert.user_id == user.id)
    if unread_only:
        query = query.where(Alert.is_read == False)
    query = query.order_by(Alert.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    alerts = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "tier": a.tier,
            "category": a.category,
            "title": a.title,
            "body": a.body,
            "is_read": a.is_read,
            "plant_id": str(a.plant_id) if a.plant_id else None,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


@router.patch("/{alert_id}/read")
async def mark_read(
    alert_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    alert.read_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "ok"}


@router.patch("/read-all")
async def mark_all_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    await db.execute(
        update(Alert)
        .where(Alert.user_id == user.id, Alert.is_read == False)
        .values(is_read=True, read_at=now)
    )
    await db.commit()
    return {"status": "ok"}


@router.get("/settings")
async def get_notification_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user.id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        return {
            "notification_critical": True,
            "notification_advisory": True,
            "notification_info": True,
            "photo_reminder_enabled": True,
            "photo_reminder_frequency": "weekly",
        }
    return {
        "notification_critical": settings.notification_critical,
        "notification_advisory": settings.notification_advisory,
        "notification_info": settings.notification_info,
        "photo_reminder_enabled": settings.photo_reminder_enabled,
        "photo_reminder_frequency": settings.photo_reminder_frequency,
    }


@router.patch("/settings")
async def update_notification_settings(
    data: NotificationSettingsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user.id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, key, value)
    await db.commit()
    return {"status": "ok"}
