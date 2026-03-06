import uuid
from datetime import datetime

from pydantic import BaseModel


class SpeciesResponse(BaseModel):
    id: uuid.UUID
    common_name: str
    scientific_name: str | None
    family: str | None
    category: str | None
    hardiness_zones: str | None
    sun_requirement: str | None
    water_needs: str | None
    soil_ph_low: float | None
    soil_ph_high: float | None
    humidity_preference: str | None
    temp_ideal_low_f: int | None
    temp_ideal_high_f: int | None
    frost_tolerant: bool
    growth_rate: str | None
    mature_height: str | None
    days_to_maturity: int | None
    lifespan_type: str | None
    icon_emoji: str | None
    cover_image_url: str | None

    model_config = {"from_attributes": True}


class SpeciesDetailResponse(SpeciesResponse):
    soil_type_preferred: str | None
    temp_min_f: int | None
    temp_max_f: int | None
    mature_spread: str | None
    care_calendar: dict | None
    common_pests: list | None
    common_diseases: list | None
    healthy_description: str | None
    symptom_guide: list | None
    companions: list | None
    antagonists: list | None
    search_tags: list | None

    model_config = {"from_attributes": True}
