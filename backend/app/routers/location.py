from datetime import date

from fastapi import APIRouter, Query

from app.services.location_intelligence import (
    determine_season,
    get_hardiness_zone,
    get_soil_data,
    get_sun_patterns,
    get_weather_forecast,
)

router = APIRouter(prefix="/api/v1/location", tags=["location"])


@router.get("/resolve")
async def resolve_location(
    lat: float = Query(...),
    lng: float = Query(...),
):
    """Given lat/lng, return hardiness zone, weather summary, and soil characteristics."""
    hardiness_zone = get_hardiness_zone(lat, lng)
    weather = await get_weather_forecast(lat, lng)
    soil = await get_soil_data(lat, lng)
    sun = get_sun_patterns(lat, lng)
    season = determine_season(lat)

    return {
        "hardiness_zone": hardiness_zone,
        "season": season,
        "weather": {
            "current": weather.get("current_weather"),
            "daily": weather.get("daily"),
        },
        "soil": soil,
        "sun_patterns": sun,
    }


@router.get("/weather")
async def get_weather(
    lat: float = Query(...),
    lng: float = Query(...),
):
    return await get_weather_forecast(lat, lng)


@router.get("/soil")
async def get_soil(
    lat: float = Query(...),
    lng: float = Query(...),
):
    return await get_soil_data(lat, lng)


@router.get("/sun-patterns")
async def get_sun(
    lat: float = Query(...),
    lng: float = Query(...),
    for_date: date | None = Query(None),
):
    return get_sun_patterns(lat, lng, for_date)
