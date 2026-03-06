"""
Notification service — creates alerts and sends push notifications via Firebase Cloud Messaging.
"""
import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.alert import Alert, NotificationLog
from app.models.fcm_token import FCMToken
from app.models.user import UserSettings

logger = logging.getLogger(__name__)

# Throttle rules per tier
THROTTLE = {
    "critical": {"max_per_plant_per_day": 2, "max_per_user_per_day": 5, "cooldown_minutes": 60},
    "advisory": {"max_per_user_per_day": 10},
    "informational": {"max_per_user_per_day": 20},
}

_firebase_initialized = False


def _init_firebase():
    """Initialize Firebase Admin SDK (lazy, once)."""
    global _firebase_initialized
    if _firebase_initialized:
        return True

    if not settings.firebase_credentials_path:
        logger.warning("Firebase credentials not configured — push notifications disabled")
        return False

    try:
        import firebase_admin
        from firebase_admin import credentials

        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.firebase_credentials_path)
            firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        logger.info("Firebase Admin SDK initialized")
        return True
    except Exception as e:
        logger.error(f"Firebase init failed: {e}")
        return False


async def register_device_token(user_id: UUID, token: str, device_os: str | None, db: AsyncSession) -> FCMToken:
    """Register or update a device's FCM push token."""
    result = await db.execute(
        select(FCMToken).where(FCMToken.user_id == user_id, FCMToken.token == token)
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.device_os = device_os
        await db.commit()
        return existing

    fcm_token = FCMToken(user_id=user_id, token=token, device_os=device_os)
    db.add(fcm_token)
    await db.commit()
    await db.refresh(fcm_token)
    return fcm_token


async def unregister_device_token(user_id: UUID, token: str, db: AsyncSession):
    """Remove a device's FCM push token."""
    result = await db.execute(
        select(FCMToken).where(FCMToken.user_id == user_id, FCMToken.token == token)
    )
    existing = result.scalar_one_or_none()
    if existing:
        await db.delete(existing)
        await db.commit()


async def is_throttled(user_id: UUID, tier: str, plant_id: UUID | None, db: AsyncSession) -> bool:
    """Check if notifications for this user/plant/tier should be throttled."""
    rules = THROTTLE.get(tier, {})
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(days=1)

    max_per_day = rules.get("max_per_user_per_day")
    if max_per_day:
        result = await db.execute(
            select(func.count())
            .select_from(NotificationLog)
            .where(NotificationLog.user_id == user_id, NotificationLog.tier == tier, NotificationLog.sent_at >= day_ago)
        )
        if (result.scalar() or 0) >= max_per_day:
            return True

    if plant_id and "max_per_plant_per_day" in rules:
        result = await db.execute(
            select(func.count())
            .select_from(NotificationLog)
            .where(
                NotificationLog.user_id == user_id, NotificationLog.plant_id == plant_id,
                NotificationLog.tier == tier, NotificationLog.sent_at >= day_ago,
            )
        )
        if (result.scalar() or 0) >= rules["max_per_plant_per_day"]:
            return True

    cooldown = rules.get("cooldown_minutes")
    if cooldown and plant_id:
        cooldown_since = now - timedelta(minutes=cooldown)
        result = await db.execute(
            select(func.count())
            .select_from(NotificationLog)
            .where(
                NotificationLog.user_id == user_id, NotificationLog.plant_id == plant_id,
                NotificationLog.tier == tier, NotificationLog.sent_at >= cooldown_since,
            )
        )
        if (result.scalar() or 0) > 0:
            return True

    return False


async def send_push(user_id: UUID, title: str, body: str, data: dict | None = None, db: AsyncSession | None = None):
    """Send push notification to all of a user's registered devices via FCM."""
    if not _init_firebase():
        logger.debug(f"FCM not available — skipping push to {user_id}: {title}")
        return 0

    if not db:
        return 0

    result = await db.execute(select(FCMToken).where(FCMToken.user_id == user_id))
    tokens = result.scalars().all()

    if not tokens:
        logger.debug(f"No FCM tokens for user {user_id} — skipping push")
        return 0

    from firebase_admin import messaging

    token_strings = [t.token for t in tokens]
    message_data = {k: str(v) for k, v in (data or {}).items()}

    message = messaging.MulticastMessage(
        tokens=token_strings,
        notification=messaging.Notification(title=title, body=body),
        data=message_data,
        android=messaging.AndroidConfig(
            priority="high" if message_data.get("tier") == "critical" else "normal",
        ),
        apns=messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    sound="default" if message_data.get("tier") == "critical" else None,
                ),
            ),
        ),
    )

    try:
        response = messaging.send_each_for_multicast(message)
        logger.info(f"FCM push to {user_id}: {response.success_count} success, {response.failure_count} failed")

        # Clean up invalid tokens
        for i, send_response in enumerate(response.responses):
            if send_response.exception and "UNREGISTERED" in str(send_response.exception):
                await db.delete(tokens[i])
                logger.info(f"Removed invalid FCM token for user {user_id}")

        if response.failure_count > 0:
            await db.commit()

        return response.success_count
    except Exception as e:
        logger.error(f"FCM send failed for user {user_id}: {e}")
        return 0


async def create_and_push_alert(
    user_id: UUID,
    tier: str,
    category: str,
    title: str,
    body: str,
    plant_id: UUID | None = None,
    garden_id: UUID | None = None,
    db: AsyncSession | None = None,
) -> Alert:
    """Create an Alert record and push it based on user preferences and throttling."""
    alert = Alert(
        user_id=user_id, tier=tier, category=category,
        title=title, body=body, plant_id=plant_id, garden_id=garden_id,
    )

    if db:
        db.add(alert)

        settings_result = await db.execute(
            select(UserSettings).where(UserSettings.user_id == user_id)
        )
        user_settings = settings_result.scalar_one_or_none()

        should_push = True
        if user_settings:
            if tier == "critical" and not user_settings.notification_critical:
                should_push = False
            elif tier == "advisory" and not user_settings.notification_advisory:
                should_push = False
            elif tier == "informational" and not user_settings.notification_info:
                should_push = False

        if should_push and await is_throttled(user_id, tier, plant_id, db):
            should_push = False

        if should_push:
            sent = await send_push(
                user_id, title, body,
                data={"alert_id": str(alert.id), "tier": tier, "category": category, "plant_id": str(plant_id or "")},
                db=db,
            )
            if sent > 0:
                alert.is_pushed = True
                alert.pushed_at = datetime.now(timezone.utc)

            log = NotificationLog(user_id=user_id, plant_id=plant_id, tier=tier, channel="push")
            db.add(log)

        await db.commit()

    return alert
