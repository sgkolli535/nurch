import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.garden import Garden
from app.models.photo import Photo
from app.models.plant import Plant
from app.models.user import User
from app.schemas.photo import PhotoConfirm, PhotoResponse, PhotoUploadRequest, PresignedUrlResponse
from app.services.photo_service import generate_presigned_upload, get_public_url

router = APIRouter(tags=["photos"])


@router.post("/api/v1/photos/upload-url", response_model=PresignedUrlResponse)
async def get_upload_url(
    data: PhotoUploadRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify plant belongs to user
    result = await db.execute(
        select(Plant)
        .join(Garden, Plant.garden_id == Garden.id)
        .where(Plant.id == data.plant_id, Garden.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plant not found")

    photo_id = uuid.uuid4()
    ext = "jpg" if "jpeg" in data.content_type else data.content_type.split("/")[-1]
    storage_key = f"photos/{user.id}/{data.plant_id}/{photo_id}.{ext}"

    upload_url = await generate_presigned_upload(storage_key, data.content_type)
    public_url = get_public_url(storage_key)

    # Create photo record
    photo = Photo(
        id=photo_id,
        plant_id=data.plant_id,
        storage_key=storage_key,
        original_url=public_url,
        file_size_bytes=data.file_size_bytes,
    )
    db.add(photo)
    await db.commit()

    return PresignedUrlResponse(upload_url=upload_url, photo_id=photo_id, storage_key=storage_key)


@router.patch("/api/v1/photos/{photo_id}/confirm", response_model=PhotoResponse)
async def confirm_upload(
    photo_id: uuid.UUID,
    data: PhotoConfirm,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Photo)
        .join(Plant, Photo.plant_id == Plant.id)
        .join(Garden, Plant.garden_id == Garden.id)
        .where(Photo.id == photo_id, Garden.user_id == user.id)
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    if data.width:
        photo.width = data.width
    if data.height:
        photo.height = data.height
    if data.captured_at:
        photo.captured_at = data.captured_at

    # Set as cover photo if plant has none
    plant_result = await db.execute(select(Plant).where(Plant.id == photo.plant_id))
    plant = plant_result.scalar_one()
    if not plant.cover_photo_id:
        plant.cover_photo_id = photo.id

    await db.commit()
    await db.refresh(photo)
    return photo


@router.get("/api/v1/plants/{plant_id}/photos", response_model=list[PhotoResponse])
async def list_photos(
    plant_id: uuid.UUID,
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Plant)
        .join(Garden, Plant.garden_id == Garden.id)
        .where(Plant.id == plant_id, Garden.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Plant not found")

    photos = await db.execute(
        select(Photo)
        .where(Photo.plant_id == plant_id)
        .order_by(Photo.uploaded_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return photos.scalars().all()


@router.delete("/api/v1/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    photo_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Photo)
        .join(Plant, Photo.plant_id == Plant.id)
        .join(Garden, Plant.garden_id == Garden.id)
        .where(Photo.id == photo_id, Garden.user_id == user.id)
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    await db.delete(photo)
    await db.commit()
