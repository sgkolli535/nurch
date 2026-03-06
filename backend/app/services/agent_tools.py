"""
LangGraph tool definitions for the garden agent.
Each tool wraps existing services/DB queries and is callable by the LLM.
"""
from datetime import datetime

from langchain_core.tools import tool
from sqlalchemy import func, select

from app.database import async_session
from app.models.diagnosis import Diagnosis
from app.models.garden import Garden
from app.models.plant import Plant
from app.models.species import Species
from app.models.zone import Zone
from app.services.location_intelligence import get_weather_forecast


@tool
async def get_garden_overview(user_id: str) -> dict:
    """Get an overview of all gardens, zones, and plants for a user.
    Returns garden names, plant counts per zone, health statuses, and hardiness zones.
    Use this first to understand what the user is growing."""
    async with async_session() as db:
        gardens_result = await db.execute(
            select(Garden).where(Garden.user_id == user_id)
        )
        gardens = gardens_result.scalars().all()

        overview = {"gardens": [], "total_plants": 0, "at_risk_count": 0}
        for garden in gardens:
            plants_result = await db.execute(
                select(Plant).where(Plant.garden_id == garden.id, Plant.is_active == True)
            )
            plants = plants_result.scalars().all()

            plant_summaries = []
            for p in plants:
                plant_summaries.append({
                    "id": str(p.id),
                    "name": p.custom_name,
                    "health_status": p.health_status,
                    "zone_id": str(p.zone_id) if p.zone_id else None,
                })
                overview["total_plants"] += 1
                if p.health_status in ("warning", "critical"):
                    overview["at_risk_count"] += 1

            zones_result = await db.execute(
                select(Zone).where(Zone.garden_id == garden.id).order_by(Zone.sort_order)
            )
            zones = [{"id": str(z.id), "name": z.name, "type": z.zone_type} for z in zones_result.scalars().all()]

            overview["gardens"].append({
                "id": str(garden.id),
                "name": garden.name,
                "hardiness_zone": garden.hardiness_zone,
                "location_lat": float(garden.location_lat) if garden.location_lat else None,
                "location_lng": float(garden.location_lng) if garden.location_lng else None,
                "zones": zones,
                "plants": plant_summaries,
            })

        return overview


@tool
async def get_plant_detail(plant_id: str, user_id: str) -> dict:
    """Get detailed information about a specific plant including species data,
    latest diagnosis summary, and care notes. Use this when the user asks
    about a specific plant."""
    async with async_session() as db:
        result = await db.execute(
            select(Plant)
            .join(Garden, Plant.garden_id == Garden.id)
            .where(Plant.id == plant_id, Garden.user_id == user_id)
        )
        plant = result.scalar_one_or_none()
        if not plant:
            return {"error": "Plant not found"}

        # Get species info
        species_info = None
        if plant.species_id:
            species_result = await db.execute(select(Species).where(Species.id == plant.species_id))
            species = species_result.scalar_one_or_none()
            if species:
                species_info = {
                    "common_name": species.common_name,
                    "scientific_name": species.scientific_name,
                    "sun_requirement": species.sun_requirement,
                    "water_needs": species.water_needs,
                    "hardiness_zones": species.hardiness_zones,
                    "common_pests": species.common_pests,
                    "common_diseases": species.common_diseases,
                    "healthy_description": species.healthy_description,
                }

        # Get latest diagnosis
        diag_result = await db.execute(
            select(Diagnosis)
            .where(Diagnosis.plant_id == plant.id)
            .order_by(Diagnosis.created_at.desc())
            .limit(1)
        )
        latest_diag = diag_result.scalar_one_or_none()
        diag_summary = None
        if latest_diag:
            diag_summary = {
                "date": latest_diag.created_at.isoformat(),
                "overall_health": latest_diag.overall_health,
                "confidence_level": latest_diag.confidence_level,
                "summary": latest_diag.summary,
            }

        return {
            "id": str(plant.id),
            "name": plant.custom_name,
            "health_status": plant.health_status,
            "planting_date": str(plant.planting_date) if plant.planting_date else None,
            "location_detail": plant.location_detail,
            "container_type": plant.container_type,
            "notes": plant.notes,
            "species": species_info,
            "latest_diagnosis": diag_summary,
        }


@tool
async def get_weather(lat: float, lng: float) -> dict:
    """Get current weather and 7-day forecast for a location.
    Includes temperature (Fahrenheit), precipitation, UV index, and wind.
    Use this when giving weather-dependent care advice."""
    try:
        data = await get_weather_forecast(lat, lng)
        # Slim down the response to save tokens
        current = data.get("current_weather", {})
        daily = data.get("daily", {})
        return {
            "current": {
                "temperature_f": current.get("temperature"),
                "windspeed_mph": current.get("windspeed"),
                "weathercode": current.get("weathercode"),
            },
            "forecast_3day": {
                "dates": daily.get("time", [])[:3],
                "temp_max": daily.get("temperature_2m_max", [])[:3],
                "temp_min": daily.get("temperature_2m_min", [])[:3],
                "precipitation": daily.get("precipitation_sum", [])[:3],
            },
        }
    except Exception as e:
        return {"error": f"Weather fetch failed: {str(e)}"}


@tool
async def get_care_calendar(plant_id: str, user_id: str) -> dict:
    """Get the care calendar for a plant based on its species and the current month.
    Returns tasks like watering schedule, fertilizing, pruning, pest monitoring.
    Use this when the user asks what they should do for a plant."""
    async with async_session() as db:
        result = await db.execute(
            select(Plant, Species)
            .outerjoin(Species, Plant.species_id == Species.id)
            .join(Garden, Plant.garden_id == Garden.id)
            .where(Plant.id == plant_id, Garden.user_id == user_id)
        )
        row = result.one_or_none()
        if not row:
            return {"error": "Plant not found"}

        plant, species = row
        if not species or not species.care_calendar:
            return {
                "plant_name": plant.custom_name,
                "message": "No species-specific care calendar available. Consider identifying the species first.",
            }

        current_month = str(datetime.now().month)
        tasks_this_month = species.care_calendar.get(current_month, [])

        # Also get next month for planning
        next_month = str((datetime.now().month % 12) + 1)
        tasks_next_month = species.care_calendar.get(next_month, [])

        return {
            "plant_name": plant.custom_name,
            "species": species.common_name,
            "current_month": int(current_month),
            "tasks_this_month": tasks_this_month,
            "tasks_next_month": tasks_next_month,
            "water_needs": species.water_needs,
            "sun_requirement": species.sun_requirement,
            "frost_tolerant": species.frost_tolerant,
        }


@tool
async def get_species_info(species_name: str) -> dict:
    """Look up species information by common or scientific name.
    Returns care requirements, common pests/diseases, temperature ranges,
    and growing tips. Use this for general gardening questions about a species."""
    async with async_session() as db:
        pattern = f"%{species_name}%"
        result = await db.execute(
            select(Species).where(
                Species.common_name.ilike(pattern) | Species.scientific_name.ilike(pattern)
            ).limit(1)
        )
        species = result.scalar_one_or_none()
        if not species:
            return {"error": f"Species '{species_name}' not found in our database."}

        return {
            "common_name": species.common_name,
            "scientific_name": species.scientific_name,
            "family": species.family,
            "category": species.category,
            "sun_requirement": species.sun_requirement,
            "water_needs": species.water_needs,
            "soil_ph_range": f"{species.soil_ph_low}-{species.soil_ph_high}" if species.soil_ph_low else None,
            "temp_ideal_f": f"{species.temp_ideal_low_f}-{species.temp_ideal_high_f}" if species.temp_ideal_low_f else None,
            "frost_tolerant": species.frost_tolerant,
            "hardiness_zones": species.hardiness_zones,
            "growth_rate": species.growth_rate,
            "days_to_maturity": species.days_to_maturity,
            "common_pests": species.common_pests,
            "common_diseases": species.common_diseases,
            "healthy_description": species.healthy_description,
            "companions": species.companions,
            "antagonists": species.antagonists,
            "source": "SPECIES_DB",
        }
