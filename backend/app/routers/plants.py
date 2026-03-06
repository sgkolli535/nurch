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
from app.schemas.plant import PlantCreate, PlantResponse, PlantUpdate

router = APIRouter(tags=["plants"])


@router.post(
    "/api/v1/gardens/{garden_id}/plants",
    response_model=PlantResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_plant(
    garden_id: uuid.UUID,
    data: PlantCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Garden).where(Garden.id == garden_id, Garden.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Garden not found")

    plant_data = data.model_dump()

    # Auto-assign grid cell if not specified and zone is set
    if plant_data.get("grid_col") is None and plant_data.get("zone_id"):
        from app.models.zone import Zone
        zone_result = await db.execute(select(Zone).where(Zone.id == plant_data["zone_id"]))
        zone = zone_result.scalar_one_or_none()
        grid_cols = zone.grid_cols if zone else 3
        grid_rows = zone.grid_rows if zone else 3

        # Find occupied cells
        existing = await db.execute(
            select(Plant.grid_col, Plant.grid_row)
            .where(Plant.zone_id == plant_data["zone_id"], Plant.is_active == True)
        )
        occupied = {(r[0], r[1]) for r in existing.all()}

        # Find first empty cell (left-to-right, top-to-bottom)
        placed = False
        for row in range(grid_rows):
            for col in range(grid_cols):
                if (col, row) not in occupied:
                    plant_data["grid_col"] = col
                    plant_data["grid_row"] = row
                    placed = True
                    break
            if placed:
                break
        if not placed:
            plant_data["grid_col"] = 0
            plant_data["grid_row"] = 0

    plant = Plant(garden_id=garden_id, **plant_data)
    db.add(plant)
    await db.commit()
    await db.refresh(plant)
    return await _plant_response(plant, db)


@router.get("/api/v1/gardens/{garden_id}/plants", response_model=list[PlantResponse])
async def list_plants(
    garden_id: uuid.UUID,
    zone_id: uuid.UUID | None = Query(None),
    health_status: str | None = Query(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Garden).where(Garden.id == garden_id, Garden.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Garden not found")

    query = select(Plant).where(Plant.garden_id == garden_id, Plant.is_active == True)
    if zone_id:
        query = query.where(Plant.zone_id == zone_id)
    if health_status:
        query = query.where(Plant.health_status == health_status)
    query = query.order_by(Plant.created_at)

    plants = await db.execute(query)
    return [await _plant_response(p, db) for p in plants.scalars().all()]


@router.get("/api/v1/plants/{plant_id}", response_model=PlantResponse)
async def get_plant(
    plant_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plant = await _get_user_plant(plant_id, user.id, db)
    return await _plant_response(plant, db)


@router.patch("/api/v1/plants/{plant_id}", response_model=PlantResponse)
async def update_plant(
    plant_id: uuid.UUID,
    data: PlantUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plant = await _get_user_plant(plant_id, user.id, db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(plant, key, value)
    await db.commit()
    await db.refresh(plant)
    return await _plant_response(plant, db)


@router.delete("/api/v1/plants/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plant(
    plant_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plant = await _get_user_plant(plant_id, user.id, db)
    plant.is_active = False
    await db.commit()


async def _get_user_plant(plant_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Plant:
    result = await db.execute(
        select(Plant)
        .join(Garden, Plant.garden_id == Garden.id)
        .where(Plant.id == plant_id, Garden.user_id == user_id)
    )
    plant = result.scalar_one_or_none()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


async def _plant_response(plant: Plant, db: AsyncSession) -> PlantResponse:
    # Look up species emoji and name if species is linked
    species_name = None
    icon_emoji = None
    if plant.species_id:
        from app.models.species import Species
        species_result = await db.execute(select(Species).where(Species.id == plant.species_id))
        species = species_result.scalar_one_or_none()
        if species:
            species_name = species.common_name
            icon_emoji = species.icon_emoji

    return PlantResponse(
        id=plant.id,
        garden_id=plant.garden_id,
        zone_id=plant.zone_id,
        species_id=plant.species_id,
        custom_name=plant.custom_name,
        planting_date=plant.planting_date,
        acquired_date=plant.acquired_date,
        location_detail=plant.location_detail,
        container_type=plant.container_type,
        notes=plant.notes,
        health_status=plant.health_status,
        is_active=plant.is_active,
        position_x=plant.position_x,
        position_y=plant.position_y,
        grid_col=plant.grid_col,
        grid_row=plant.grid_row,
        cover_photo_url=None,
        species_name=species_name,
        icon_emoji=icon_emoji,
        created_at=plant.created_at,
        updated_at=plant.updated_at,
    )
