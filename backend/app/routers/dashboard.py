from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.alert import Alert
from app.models.diagnosis import Diagnosis
from app.models.garden import Garden
from app.models.plant import Plant
from app.models.user import User
from app.services.location_intelligence import get_weather_forecast

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get all user's gardens
    gardens_result = await db.execute(
        select(Garden).where(Garden.user_id == user.id)
    )
    gardens = gardens_result.scalars().all()
    garden_ids = [g.id for g in gardens]

    if not garden_ids:
        return {"gardens": [], "plant_summary": {}, "recent_alerts": []}

    # Plant health summary
    plants_result = await db.execute(
        select(Plant.health_status, func.count())
        .where(Plant.garden_id.in_(garden_ids), Plant.is_active == True)
        .group_by(Plant.health_status)
    )
    health_counts = {row[0]: row[1] for row in plants_result.all()}

    # Total plants
    total_plants = sum(health_counts.values())

    # Recent alerts
    alerts_result = await db.execute(
        select(Alert)
        .where(Alert.user_id == user.id)
        .order_by(Alert.created_at.desc())
        .limit(5)
    )
    alerts = alerts_result.scalars().all()

    return {
        "gardens": [
            {"id": str(g.id), "name": g.name, "hardiness_zone": g.hardiness_zone}
            for g in gardens
        ],
        "plant_summary": {
            "total": total_plants,
            "healthy": health_counts.get("healthy", 0),
            "warning": health_counts.get("warning", 0),
            "critical": health_counts.get("critical", 0),
            "unknown": health_counts.get("unknown", 0),
        },
        "recent_alerts": [
            {
                "id": str(a.id),
                "tier": a.tier,
                "category": a.category,
                "title": a.title,
                "body": a.body,
                "is_read": a.is_read,
                "created_at": a.created_at.isoformat(),
            }
            for a in alerts
        ],
    }


@router.get("/weather")
async def get_dashboard_weather(
    user: User = Depends(get_current_user),
):
    if not user.location_lat or not user.location_lng:
        return {"error": "Location not set. Update your profile with a location."}

    weather = await get_weather_forecast(float(user.location_lat), float(user.location_lng))
    return weather


@router.get("/calendar")
async def get_dashboard_calendar(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get all user's plants with species data
    gardens_result = await db.execute(
        select(Garden).where(Garden.user_id == user.id)
    )
    gardens = gardens_result.scalars().all()
    garden_ids = [g.id for g in gardens]

    if not garden_ids:
        return {"tasks": []}

    from app.models.species import Species

    plants_result = await db.execute(
        select(Plant, Species)
        .outerjoin(Species, Plant.species_id == Species.id)
        .where(Plant.garden_id.in_(garden_ids), Plant.is_active == True)
    )

    from datetime import datetime

    current_month = str(datetime.now().month)
    tasks = []

    for plant, species in plants_result.all():
        if species and species.care_calendar:
            month_tasks = species.care_calendar.get(current_month, [])
            for task in month_tasks:
                tasks.append({
                    "plant_id": str(plant.id),
                    "plant_name": plant.custom_name,
                    "species_name": species.common_name if species else None,
                    "task": task,
                    "month": int(current_month),
                    "icon_emoji": species.icon_emoji if species else None,
                })

    return {"tasks": tasks, "month": int(current_month)}
