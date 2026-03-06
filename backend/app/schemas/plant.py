import uuid
from datetime import date, datetime

from pydantic import BaseModel


class PlantCreate(BaseModel):
    custom_name: str
    species_id: uuid.UUID | None = None
    zone_id: uuid.UUID | None = None
    planting_date: date | None = None
    acquired_date: date | None = None
    location_detail: str | None = None
    container_type: str | None = None
    notes: str | None = None
    position_x: float = 0.5
    position_y: float = 0.5
    grid_col: int | None = None
    grid_row: int | None = None


class PlantUpdate(BaseModel):
    custom_name: str | None = None
    species_id: uuid.UUID | None = None
    zone_id: uuid.UUID | None = None
    planting_date: date | None = None
    acquired_date: date | None = None
    location_detail: str | None = None
    container_type: str | None = None
    notes: str | None = None
    health_status: str | None = None
    position_x: float | None = None
    position_y: float | None = None
    grid_col: int | None = None
    grid_row: int | None = None


class PlantResponse(BaseModel):
    id: uuid.UUID
    garden_id: uuid.UUID
    zone_id: uuid.UUID | None
    species_id: uuid.UUID | None
    custom_name: str
    planting_date: date | None
    acquired_date: date | None
    location_detail: str | None
    container_type: str | None
    notes: str | None
    health_status: str
    is_active: bool
    position_x: float
    position_y: float
    grid_col: int
    grid_row: int
    cover_photo_url: str | None = None
    species_name: str | None = None
    icon_emoji: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
