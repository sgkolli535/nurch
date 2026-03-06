import math
from datetime import date, datetime

import httpx


async def get_weather_forecast(lat: float, lng: float) -> dict:
    """Fetch 7-day weather forecast from Open-Meteo (free, no API key)."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lng,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,uv_index_max,windspeed_10m_max",
                "current_weather": "true",
                "hourly": "relative_humidity_2m",
                "temperature_unit": "fahrenheit",
                "windspeed_unit": "mph",
                "precipitation_unit": "inch",
                "timezone": "auto",
                "forecast_days": 7,
            },
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()


async def get_soil_data(lat: float, lng: float) -> dict:
    """
    Fetch soil characteristics from USDA SSURGO via SoilGrids API.
    Falls back to reasonable defaults if the API is unavailable.
    """
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://rest.isric.org/soilgrids/v2.0/properties/query",
                params={
                    "lon": lng,
                    "lat": lat,
                    "property": "phh2o,clay,sand,silt",
                    "depth": "0-5cm",
                    "value": "mean",
                },
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                layers = {layer["name"]: layer for layer in data.get("properties", {}).get("layers", [])}
                ph_layer = layers.get("phh2o", {})
                ph_depths = ph_layer.get("depths", [{}])
                ph_value = ph_depths[0].get("values", {}).get("mean") if ph_depths else None

                clay_layer = layers.get("clay", {})
                sand_layer = layers.get("sand", {})
                clay_val = clay_layer.get("depths", [{}])[0].get("values", {}).get("mean") if clay_layer.get("depths") else None
                sand_val = sand_layer.get("depths", [{}])[0].get("values", {}).get("mean") if sand_layer.get("depths") else None

                soil_type = _classify_soil(clay_val, sand_val)
                drainage = _estimate_drainage(soil_type)

                return {
                    "ph": round(ph_value / 10, 1) if ph_value else None,
                    "soil_type": soil_type,
                    "drainage": drainage,
                    "clay_pct": round(clay_val / 10, 1) if clay_val else None,
                    "sand_pct": round(sand_val / 10, 1) if sand_val else None,
                }
    except Exception:
        pass

    return {
        "ph": None,
        "soil_type": "unknown",
        "drainage": "unknown",
        "clay_pct": None,
        "sand_pct": None,
    }


def get_hardiness_zone(lat: float, lng: float) -> str:
    """
    Estimate USDA hardiness zone from latitude.
    This is a simplified approximation — a full implementation would use the USDA zone shapefile.
    """
    # Rough approximation based on latitude for continental US
    if lat >= 48:
        return "3a"
    elif lat >= 46:
        return "4a"
    elif lat >= 44:
        return "4b"
    elif lat >= 42:
        return "5a"
    elif lat >= 40:
        return "5b"
    elif lat >= 38:
        return "6a"
    elif lat >= 36:
        return "6b"
    elif lat >= 34:
        return "7a"
    elif lat >= 32:
        return "7b"
    elif lat >= 30:
        return "8a"
    elif lat >= 28:
        return "8b"
    elif lat >= 26:
        return "9a"
    elif lat >= 24:
        return "9b"
    elif lat >= 22:
        return "10a"
    else:
        return "10b"


def get_sun_patterns(lat: float, lng: float, for_date: date | None = None) -> dict:
    """Calculate day length and solar noon altitude from coordinates and date."""
    d = for_date or date.today()
    day_of_year = d.timetuple().tm_yday

    # Solar declination (simplified)
    declination = 23.45 * math.sin(math.radians(360 / 365 * (day_of_year - 81)))

    lat_rad = math.radians(lat)
    dec_rad = math.radians(declination)

    # Hour angle at sunrise/sunset
    cos_hour = -math.tan(lat_rad) * math.tan(dec_rad)
    cos_hour = max(-1, min(1, cos_hour))  # Clamp for polar regions

    if cos_hour <= -1:
        day_length = 24.0  # Midnight sun
    elif cos_hour >= 1:
        day_length = 0.0  # Polar night
    else:
        hour_angle = math.degrees(math.acos(cos_hour))
        day_length = round(2 * hour_angle / 15, 1)

    # Solar noon altitude
    solar_noon_altitude = round(90 - abs(lat - declination), 1)

    return {
        "day_length_hours": day_length,
        "solar_noon_altitude": solar_noon_altitude,
        "declination": round(declination, 1),
        "date": d.isoformat(),
    }


def determine_season(lat: float) -> str:
    """Determine current season based on hemisphere and month."""
    month = datetime.now().month
    northern = lat >= 0
    if month in (3, 4, 5):
        return "spring" if northern else "fall"
    elif month in (6, 7, 8):
        return "summer" if northern else "winter"
    elif month in (9, 10, 11):
        return "fall" if northern else "spring"
    else:
        return "winter" if northern else "summer"


def _classify_soil(clay_pct: float | None, sand_pct: float | None) -> str:
    if clay_pct is None or sand_pct is None:
        return "unknown"
    clay = clay_pct / 10
    sand = sand_pct / 10
    if sand > 70:
        return "sandy"
    elif clay > 40:
        return "clay"
    elif clay > 25:
        return "clay_loam"
    elif sand > 50:
        return "sandy_loam"
    else:
        return "loam"


def _estimate_drainage(soil_type: str) -> str:
    drainage_map = {
        "sandy": "well_drained",
        "sandy_loam": "well_drained",
        "loam": "moderate",
        "clay_loam": "moderate",
        "clay": "poor",
        "unknown": "unknown",
    }
    return drainage_map.get(soil_type, "unknown")
