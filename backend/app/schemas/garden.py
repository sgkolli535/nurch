import uuid
from datetime import datetime

from pydantic import BaseModel


class ZoneCreate(BaseModel):
    name: str
    light_type: str | None = None
    zone_type: str | None = None
    sort_order: int = 0
    position_x: float = 0.0
    position_y: float = 0.0
    width: float = 0.3
    height: float = 0.3
    grid_cols: int = 3
    grid_rows: int = 3


class ZoneUpdate(BaseModel):
    name: str | None = None
    light_type: str | None = None
    zone_type: str | None = None
    sort_order: int | None = None
    position_x: float | None = None
    position_y: float | None = None
    width: float | None = None
    height: float | None = None
    grid_cols: int | None = None
    grid_rows: int | None = None


class ZoneResponse(BaseModel):
    id: uuid.UUID
    garden_id: uuid.UUID
    name: str
    light_type: str | None
    zone_type: str | None
    sort_order: int
    position_x: float
    position_y: float
    width: float
    height: float
    grid_cols: int
    grid_rows: int
    created_at: datetime

    model_config = {"from_attributes": True}


class GardenCreate(BaseModel):
    name: str
    description: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None


class GardenUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    privacy: str | None = None


class GardenResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None
    location_lat: float | None
    location_lng: float | None
    hardiness_zone: str | None
    soil_type: str | None
    privacy: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GardenDetailResponse(GardenResponse):
    zones: list[ZoneResponse] = []
    plant_count: int = 0
