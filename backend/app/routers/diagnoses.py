import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.diagnosis import Diagnosis
from app.models.garden import Garden
from app.models.photo import Photo
from app.models.plant import Plant
from app.models.species import Species
from app.models.user import User
from app.schemas.diagnosis import DiagnosisRequest, DiagnosisResponse, DiagnosisSummaryResponse
from app.services.ai_diagnostic import run_diagnosis

router = APIRouter(tags=["diagnoses"])


@router.post(
    "/api/v1/plants/{plant_id}/diagnoses",
    response_model=DiagnosisResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_diagnosis(
    plant_id: uuid.UUID,
    data: DiagnosisRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Load plant and verify ownership
    result = await db.execute(
        select(Plant)
        .join(Garden, Plant.garden_id == Garden.id)
        .where(Plant.id == plant_id, Garden.user_id == user.id)
    )
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Load garden
    garden_result = await db.execute(select(Garden).where(Garden.id == plant.garden_id))
    garden = garden_result.scalar_one()

    # Load photo
    photo_result = await db.execute(select(Photo).where(Photo.id == data.photo_id, Photo.plant_id == plant_id))
    photo = photo_result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Load species (optional)
    species = None
    if plant.species_id:
        species_result = await db.execute(select(Species).where(Species.id == plant.species_id))
        species = species_result.scalar_one_or_none()

    # Load recent diagnoses for context
    recent_result = await db.execute(
        select(Diagnosis)
        .where(Diagnosis.plant_id == plant_id)
        .order_by(Diagnosis.created_at.desc())
        .limit(5)
    )
    recent_diagnoses = list(reversed(recent_result.scalars().all()))

    # Find previous photo for change detection
    prev_photo_result = await db.execute(
        select(Photo)
        .where(Photo.plant_id == plant_id, Photo.id != photo.id)
        .order_by(Photo.uploaded_at.desc())
        .limit(1)
    )
    previous_photo = prev_photo_result.scalar_one_or_none()

    # Fetch photo bytes
    photo_bytes = await _fetch_photo_bytes(photo.original_url)
    previous_photo_bytes = None
    if previous_photo:
        try:
            previous_photo_bytes = await _fetch_photo_bytes(previous_photo.original_url)
        except Exception:
            previous_photo = None

    # Run AI diagnosis
    diagnosis = await run_diagnosis(
        plant=plant,
        photo=photo,
        species=species,
        garden=garden,
        recent_diagnoses=recent_diagnoses,
        previous_photo=previous_photo,
        photo_bytes=photo_bytes,
        previous_photo_bytes=previous_photo_bytes,
    )

    # Update plant health status
    plant.health_status = diagnosis.overall_health

    db.add(diagnosis)
    await db.commit()
    await db.refresh(diagnosis)
    return diagnosis


@router.get("/api/v1/plants/{plant_id}/diagnoses", response_model=list[DiagnosisSummaryResponse])
async def list_diagnoses(
    plant_id: uuid.UUID,
    limit: int = Query(20, le=50),
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

    diagnoses = await db.execute(
        select(Diagnosis)
        .where(Diagnosis.plant_id == plant_id)
        .order_by(Diagnosis.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return diagnoses.scalars().all()


@router.get("/api/v1/diagnoses/{diagnosis_id}", response_model=DiagnosisResponse)
async def get_diagnosis(
    diagnosis_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Diagnosis)
        .join(Plant, Diagnosis.plant_id == Plant.id)
        .join(Garden, Plant.garden_id == Garden.id)
        .where(Diagnosis.id == diagnosis_id, Garden.user_id == user.id)
    )
    diagnosis = result.scalar_one_or_none()
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Diagnosis not found")
    return diagnosis


@router.get("/api/v1/plants/{plant_id}/diagnoses/latest", response_model=DiagnosisResponse)
async def get_latest_diagnosis(
    plant_id: uuid.UUID,
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

    diag_result = await db.execute(
        select(Diagnosis)
        .where(Diagnosis.plant_id == plant_id)
        .order_by(Diagnosis.created_at.desc())
        .limit(1)
    )
    diagnosis = diag_result.scalar_one_or_none()
    if not diagnosis:
        raise HTTPException(status_code=404, detail="No diagnoses found")
    return diagnosis


async def _fetch_photo_bytes(url: str) -> bytes:
    """Fetch photo bytes from storage URL."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=30)
        resp.raise_for_status()
        return resp.content
