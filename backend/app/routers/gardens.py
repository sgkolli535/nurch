import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.garden import Garden
from app.models.plant import Plant
from app.models.user import User
from app.models.zone import Zone
from app.schemas.garden import (
    GardenCreate,
    GardenDetailResponse,
    GardenResponse,
    GardenUpdate,
    ZoneCreate,
    ZoneResponse,
    ZoneUpdate,
)

router = APIRouter(prefix="/api/v1/gardens", tags=["gardens"])


@router.post("", response_model=GardenResponse, status_code=status.HTTP_201_CREATED)
async def create_garden(
    data: GardenCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    garden = Garden(
        user_id=user.id,
        name=data.name,
        description=data.description,
        location_lat=data.location_lat,
        location_lng=data.location_lng,
    )
    db.add(garden)
    await db.commit()
    await db.refresh(garden)
    return garden


@router.get("", response_model=list[GardenResponse])
async def list_gardens(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Garden).where(Garden.user_id == user.id).order_by(Garden.created_at)
    )
    return result.scalars().all()


@router.get("/{garden_id}", response_model=GardenDetailResponse)
async def get_garden(
    garden_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Garden)
        .options(selectinload(Garden.zones))
        .where(Garden.id == garden_id, Garden.user_id == user.id)
    )
    garden = result.scalar_one_or_none()
    if not garden:
        raise HTTPException(status_code=404, detail="Garden not found")

    count_result = await db.execute(
        select(func.count()).select_from(Plant).where(Plant.garden_id == garden_id, Plant.is_active == True)
    )
    plant_count = count_result.scalar() or 0

    return GardenDetailResponse(
        **{c.key: getattr(garden, c.key) for c in Garden.__table__.columns},
        zones=[ZoneResponse.model_validate(z) for z in garden.zones],
        plant_count=plant_count,
    )


@router.patch("/{garden_id}", response_model=GardenResponse)
async def update_garden(
    garden_id: uuid.UUID,
    data: GardenUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Garden).where(Garden.id == garden_id, Garden.user_id == user.id)
    )
    garden = result.scalar_one_or_none()
    if not garden:
        raise HTTPException(status_code=404, detail="Garden not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(garden, key, value)
    await db.commit()
    await db.refresh(garden)
    return garden


@router.delete("/{garden_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_garden(
    garden_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Garden).where(Garden.id == garden_id, Garden.user_id == user.id)
    )
    garden = result.scalar_one_or_none()
    if not garden:
        raise HTTPException(status_code=404, detail="Garden not found")
    await db.delete(garden)
    await db.commit()


# ---- Zones ----

@router.post("/{garden_id}/zones", response_model=ZoneResponse, status_code=status.HTTP_201_CREATED)
async def create_zone(
    garden_id: uuid.UUID,
    data: ZoneCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Garden).where(Garden.id == garden_id, Garden.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Garden not found")

    zone = Zone(garden_id=garden_id, **data.model_dump())
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return zone


@router.get("/{garden_id}/zones", response_model=list[ZoneResponse])
async def list_zones(
    garden_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Garden).where(Garden.id == garden_id, Garden.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Garden not found")

    zones = await db.execute(
        select(Zone).where(Zone.garden_id == garden_id).order_by(Zone.sort_order)
    )
    return zones.scalars().all()


@router.patch("/{garden_id}/zones/{zone_id}", response_model=ZoneResponse)
async def update_zone(
    garden_id: uuid.UUID,
    zone_id: uuid.UUID,
    data: ZoneUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Garden).where(Garden.id == garden_id, Garden.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Garden not found")

    zone_result = await db.execute(
        select(Zone).where(Zone.id == zone_id, Zone.garden_id == garden_id)
    )
    zone = zone_result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(zone, key, value)
    await db.commit()
    await db.refresh(zone)
    return zone


@router.delete("/{garden_id}/zones/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_zone(
    garden_id: uuid.UUID,
    zone_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Garden).where(Garden.id == garden_id, Garden.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Garden not found")

    zone_result = await db.execute(
        select(Zone).where(Zone.id == zone_id, Zone.garden_id == garden_id)
    )
    zone = zone_result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    await db.delete(zone)
    await db.commit()
