import uuid
from datetime import datetime

from pydantic import BaseModel


class PhotoResponse(BaseModel):
    id: uuid.UUID
    plant_id: uuid.UUID
    original_url: str
    thumbnail_url: str | None
    width: int | None
    height: int | None
    file_size_bytes: int | None
    captured_at: datetime | None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class PhotoUploadRequest(BaseModel):
    plant_id: uuid.UUID
    content_type: str = "image/jpeg"
    file_size_bytes: int | None = None


class PresignedUrlResponse(BaseModel):
    upload_url: str
    photo_id: uuid.UUID
    storage_key: str


class PhotoConfirm(BaseModel):
    width: int | None = None
    height: int | None = None
    captured_at: datetime | None = None
