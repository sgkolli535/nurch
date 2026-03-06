"""
Background task: Check weather forecasts and create frost alerts.
Runs every 6 hours via APScheduler.
"""
import logging

from sqlalchemy import select

from app.database import async_session
from app.models.garden import Garden
from app.models.plant import Plant
from app.services.location_intelligence import get_weather_forecast
from app.services.notification_service import create_and_push_alert

logger = logging.getLogger(__name__)


async def check_frost_alerts():
    """Check weather forecast for all gardens and create frost alerts for at-risk plants."""
    async with async_session() as db:
        result = await db.execute(
            select(Garden).where(Garden.location_lat.isnot(None), Garden.location_lng.isnot(None))
        )
        gardens = result.scalars().all()

        alerts_created = 0
        for garden in gardens:
            try:
                weather = await get_weather_forecast(float(garden.location_lat), float(garden.location_lng))
                daily = weather.get("daily", {})
                temps_min = daily.get("temperature_2m_min", [])
                dates = daily.get("time", [])

                for i, temp in enumerate(temps_min[:3]):
                    if temp is not None and temp <= 32:
                        # Check if garden has non-frost-tolerant plants
                        plants_result = await db.execute(
                            select(Plant).where(Plant.garden_id == garden.id, Plant.is_active == True)
                        )
                        plant_count = len(plants_result.scalars().all())
                        if plant_count == 0:
                            continue

                        date_str = dates[i] if i < len(dates) else f"in {i+1} day(s)"
                        await create_and_push_alert(
                            user_id=garden.user_id,
                            tier="critical",
                            category="frost_warning",
                            title=f"Frost Warning — {garden.name}",
                            body=f"Temperature expected to drop to {temp}°F on {date_str}. "
                                 f"Consider covering or bringing tender plants indoors.",
                            garden_id=garden.id,
                            db=db,
                        )
                        alerts_created += 1
                        break  # One alert per garden per check

            except Exception as e:
                logger.error(f"Frost check failed for garden {garden.id}: {e}")

        logger.info(f"Frost check complete: {alerts_created} alerts created for {len(gardens)} gardens")
