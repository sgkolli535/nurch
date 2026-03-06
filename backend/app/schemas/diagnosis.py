import uuid
from datetime import datetime

from pydantic import BaseModel


class DiagnosisRequest(BaseModel):
    photo_id: uuid.UUID


class DiagnosisCategoryResponse(BaseModel):
    status: str | None = None
    deficiency: str | None = None
    identified: str | None = None
    stressor: str | None = None
    stage: str | None = None
    assessment: str | None = None
    confidence: float | None = None
    severity: str | None = None
    description: str | None = None
    action: str | None = None


class ChangeDetected(BaseModel):
    area: str
    change_type: str
    severity: str
    description: str


class Prediction(BaseModel):
    timeframe: str
    risk: str
    description: str
    preventive_action: str


class CitationResponse(BaseModel):
    source: str
    claim: str
    url: str | None = None


class DiagnosisResponse(BaseModel):
    id: uuid.UUID
    plant_id: uuid.UUID
    photo_id: uuid.UUID | None
    model_used: str
    overall_health: str
    confidence_score: float
    confidence_level: str | None
    summary: str | None
    reasoning_chain: list[str] | None
    citations: list[dict] | None
    uncertainty_notes: str | None
    hydration_status: dict | None
    nutrient_status: dict | None
    pest_status: dict | None
    disease_status: dict | None
    environmental_status: dict | None
    growth_assessment: dict | None
    changes_detected: list | None
    predictions: list | None
    processing_time_ms: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DiagnosisSummaryResponse(BaseModel):
    id: uuid.UUID
    plant_id: uuid.UUID
    overall_health: str
    confidence_score: float
    confidence_level: str | None
    summary: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
