"""
Background task: Send photo reminders for plants without recent photos.
Frequency adapts to plant health status:
  - Critical: every 2 days
  - Warning: every 4 days
  - Healthy/Unknown: every 7 days

Runs daily at 9am local via APScheduler.
"""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.garden import Garden
from app.models.photo import Photo
from app.models.plant import Plant
from app.services.notification_service import create_and_push_alert

logger = logging.getLogger(__name__)

REMINDER_INTERVALS = {
    "critical": 2,
    "warning": 4,
    "healthy": 7,
    "unknown": 7,
}


async def send_photo_reminders():
    """Check plants for stale photos and send reminder alerts."""
    async with async_session() as db:
        now = datetime.now(timezone.utc)
        reminders_sent = 0

        # Get all active plants with their gardens
        result = await db.execute(
            select(Plant, Garden)
            .join(Garden, Plant.garden_id == Garden.id)
            .where(Plant.is_active == True)
        )

        for plant, garden in result.all():
            interval_days = REMINDER_INTERVALS.get(plant.health_status, 7)
            threshold = now - timedelta(days=interval_days)

            # Check most recent photo
            photo_result = await db.execute(
                select(func.max(Photo.uploaded_at)).where(Photo.plant_id == plant.id)
            )
            last_photo_at = photo_result.scalar()

            if last_photo_at is None or last_photo_at < threshold:
                days_since = (now - last_photo_at).days if last_photo_at else None
                body = (
                    f"It's been {days_since} days since you last photographed {plant.custom_name}. "
                    f"A new photo helps track its health over time."
                    if days_since
                    else f"You haven't taken a photo of {plant.custom_name} yet. "
                    f"Take one to get an AI health assessment!"
                )

                await create_and_push_alert(
                    user_id=garden.user_id,
                    tier="informational",
                    category="photo_reminder",
                    title=f"Photo time — {plant.custom_name}",
                    body=body,
                    plant_id=plant.id,
                    garden_id=garden.id,
                    db=db,
                )
                reminders_sent += 1

        logger.info(f"Photo reminders: {reminders_sent} sent")
