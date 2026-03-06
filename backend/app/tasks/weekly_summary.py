"""
Background task: Generate weekly garden health summaries.
Runs Sunday at 9am via APScheduler.
"""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.database import async_session
from app.models.diagnosis import Diagnosis
from app.models.garden import Garden
from app.models.plant import Plant
from app.models.user import User
from app.services.notification_service import create_and_push_alert

logger = logging.getLogger(__name__)


async def send_weekly_summaries():
    """Generate and send a weekly garden health summary for each user."""
    async with async_session() as db:
        users_result = await db.execute(select(User))
        users = users_result.scalars().all()
        summaries_sent = 0

        for user in users:
            # Get user's gardens and plants
            gardens_result = await db.execute(
                select(Garden).where(Garden.user_id == user.id)
            )
            gardens = gardens_result.scalars().all()
            if not gardens:
                continue

            garden_ids = [g.id for g in gardens]

            # Count plants by health status
            status_result = await db.execute(
                select(Plant.health_status, func.count())
                .where(Plant.garden_id.in_(garden_ids), Plant.is_active == True)
                .group_by(Plant.health_status)
            )
            status_counts = {row[0]: row[1] for row in status_result.all()}
            total = sum(status_counts.values())
            if total == 0:
                continue

            healthy = status_counts.get("healthy", 0)
            warning = status_counts.get("warning", 0)
            critical = status_counts.get("critical", 0)

            # Count diagnoses this week
            week_ago = datetime.now(timezone.utc) - timedelta(days=7)
            diag_result = await db.execute(
                select(func.count())
                .select_from(Diagnosis)
                .join(Plant, Diagnosis.plant_id == Plant.id)
                .where(Plant.garden_id.in_(garden_ids), Diagnosis.created_at >= week_ago)
            )
            diagnoses_this_week = diag_result.scalar() or 0

            # Build summary
            parts = [f"You have {total} plants across {len(gardens)} garden{'s' if len(gardens) > 1 else ''}."]
            if healthy:
                parts.append(f"{healthy} healthy")
            if warning:
                parts.append(f"{warning} need attention")
            if critical:
                parts.append(f"{critical} critical")
            if diagnoses_this_week:
                parts.append(f"{diagnoses_this_week} diagnosis{'es' if diagnoses_this_week > 1 else ''} this week.")

            body = " ".join(parts)
            title = "Weekly Garden Report"
            if critical > 0:
                title = f"Weekly Report — {critical} plant{'s' if critical > 1 else ''} need{'s' if critical == 1 else ''} help"

            await create_and_push_alert(
                user_id=user.id,
                tier="informational",
                category="weekly_summary",
                title=title,
                body=body,
                db=db,
            )
            summaries_sent += 1

        logger.info(f"Weekly summaries: {summaries_sent} sent")
