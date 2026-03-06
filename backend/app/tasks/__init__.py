"""
Background task scheduler using APScheduler.
Tasks run on cron/interval schedules for proactive garden monitoring.
"""
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def start_scheduler():
    """Register all background tasks and start the scheduler."""
    from app.tasks.weather_refresh import check_frost_alerts
    from app.tasks.photo_reminders import send_photo_reminders
    from app.tasks.weekly_summary import send_weekly_summaries

    scheduler.add_job(check_frost_alerts, "interval", hours=6, id="frost_check", replace_existing=True)
    scheduler.add_job(send_photo_reminders, "cron", hour=9, id="photo_reminders", replace_existing=True)
    scheduler.add_job(send_weekly_summaries, "cron", day_of_week="sun", hour=9, id="weekly_summary", replace_existing=True)

    scheduler.start()
    logger.info("Background task scheduler started")
