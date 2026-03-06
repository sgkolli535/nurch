"""
Core AI diagnostic engine — assembles context payload and runs diagnosis.
"""
import json
from datetime import date, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.diagnosis import Diagnosis
from app.models.garden import Garden
from app.models.photo import Photo
from app.models.plant import Plant
from app.models.species import Species
from app.prompts.registry import get_code_prompt
from app.services.ai_provider import get_ai_provider
from app.services.location_intelligence import (
    determine_season,
    get_hardiness_zone,
    get_soil_data,
    get_sun_patterns,
    get_weather_forecast,
)

# Import prompts module to register prompt versions
import app.prompts.diagnosis  # noqa: F401


# Diagnosis system prompt is now loaded via the prompt registry.
# See backend/app/prompts/diagnosis.py for versioned prompts (v1, v2).
# The registry supports live A/B testing via DB override.


def _estimate_growth_stage(plant: Plant, species: Species | None) -> str | None:
    if not species or not plant.planting_date:
        return None
    days = (date.today() - plant.planting_date).days
    maturity = species.days_to_maturity
    if not maturity:
        return "established"
    if days < maturity * 0.2:
        return "seedling"
    elif days < maturity * 0.5:
        return "vegetative"
    elif days < maturity * 0.8:
        return "flowering"
    elif days < maturity:
        return "fruiting"
    else:
        return "mature"


async def build_context_payload(
    plant: Plant,
    photo: Photo,
    species: Species | None,
    garden: Garden,
    recent_diagnoses: list[Diagnosis],
    previous_photo: Photo | None,
) -> dict:
    """Assemble the full context payload for the AI provider."""
    # Fetch location data
    weather = {}
    soil = {}
    sun = {}
    if garden.location_lat and garden.location_lng:
        try:
            weather = await get_weather_forecast(float(garden.location_lat), float(garden.location_lng))
            soil = await get_soil_data(float(garden.location_lat), float(garden.location_lng))
            sun = get_sun_patterns(float(garden.location_lat), float(garden.location_lng))
        except Exception:
            pass

    return {
        "plant": {
            "name": plant.custom_name,
            "species": species.common_name if species else None,
            "scientific_name": species.scientific_name if species else None,
            "planting_date": str(plant.planting_date) if plant.planting_date else None,
            "location_detail": plant.location_detail,
            "container_type": plant.container_type,
            "user_notes": plant.notes,
            "current_health_status": plant.health_status,
            "growth_stage": _estimate_growth_stage(plant, species),
        },
        "species_profile": {
            "sun_requirement": species.sun_requirement,
            "water_needs": species.water_needs,
            "soil_ph_range": f"{species.soil_ph_low}-{species.soil_ph_high}" if species.soil_ph_low else None,
            "temp_ideal_f": f"{species.temp_ideal_low_f}-{species.temp_ideal_high_f}" if species.temp_ideal_low_f else None,
            "common_pests": species.common_pests,
            "common_diseases": species.common_diseases,
            "healthy_appearance": species.healthy_description,
            "known_symptoms": species.symptom_guide,
        } if species else None,
        "environment": {
            "hardiness_zone": garden.hardiness_zone,
            "current_weather": weather.get("current_weather"),
            "forecast_7day": weather.get("daily"),
            "soil_type": garden.soil_type or soil.get("soil_type"),
            "soil_ph": soil.get("ph"),
            "day_length_hours": sun.get("day_length_hours"),
            "season": determine_season(float(garden.location_lat)) if garden.location_lat else None,
        },
        "history": {
            "previous_diagnoses": [
                {
                    "date": str(d.created_at),
                    "overall_health": d.overall_health,
                    "summary": d.summary,
                }
                for d in recent_diagnoses[-5:]
            ],
            "has_previous_photo": previous_photo is not None,
            "days_since_last_photo": (
                (photo.uploaded_at - previous_photo.uploaded_at).days
                if previous_photo and photo.uploaded_at and previous_photo.uploaded_at
                else None
            ),
        },
    }


async def run_diagnosis(
    plant: Plant,
    photo: Photo,
    species: Species | None,
    garden: Garden,
    recent_diagnoses: list[Diagnosis],
    previous_photo: Photo | None,
    photo_bytes: bytes,
    previous_photo_bytes: bytes | None,
    db: AsyncSession | None = None,
) -> Diagnosis:
    """Run the full AI diagnosis pipeline and return a Diagnosis object."""
    context = await build_context_payload(plant, photo, species, garden, recent_diagnoses, previous_photo)
    provider = get_ai_provider()

    # Load active prompt from registry (supports A/B testing via DB override)
    from app.prompts.registry import get_active_prompt
    system_prompt = await get_active_prompt("diagnosis", db)
    prompt_version = "v2"  # Track which version was used

    result = provider.analyze_photo(
        photo_bytes=photo_bytes,
        context_payload=context,
        system_prompt=system_prompt,
        previous_photo_bytes=previous_photo_bytes,
    )
    # Handle both sync and async
    if hasattr(result, '__await__'):
        result = await result

    categories = result.get("categories", {})

    # Determine confidence_level from score if not provided by AI
    confidence_score = result.get("confidence_score", 0.0)
    confidence_level = result.get("confidence_level")
    if not confidence_level:
        if confidence_score >= 0.75:
            confidence_level = "high"
        elif confidence_score >= 0.5:
            confidence_level = "moderate"
        else:
            confidence_level = "low"

    diagnosis = Diagnosis(
        plant_id=plant.id,
        photo_id=photo.id,
        previous_photo_id=previous_photo.id if previous_photo else None,
        model_used=result.get("_model_used", "unknown"),
        overall_health=result.get("overall_health", "unknown"),
        confidence_score=confidence_score,
        confidence_level=confidence_level,
        summary=result.get("summary"),
        # Trust fields
        reasoning_chain=result.get("reasoning_chain"),
        citations=result.get("citations"),
        uncertainty_notes=result.get("uncertainty_notes"),
        prompt_version_used=prompt_version,
        # Category statuses
        hydration_status=categories.get("hydration"),
        nutrient_status=categories.get("nutrients"),
        pest_status=categories.get("pests"),
        disease_status=categories.get("disease"),
        environmental_status=categories.get("environmental_stress"),
        growth_assessment=categories.get("growth"),
        changes_detected=result.get("changes_detected"),
        predictions=result.get("predictions"),
        raw_response=result,
        context_payload=context,
        processing_time_ms=result.get("_processing_time_ms"),
    )

    return diagnosis
