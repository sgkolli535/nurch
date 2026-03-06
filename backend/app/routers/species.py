import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.species import Species
from app.schemas.species import SpeciesDetailResponse, SpeciesResponse

router = APIRouter(prefix="/api/v1/species", tags=["species"])


@router.get("", response_model=list[SpeciesResponse])
async def search_species(
    q: str | None = Query(None, min_length=1),
    category: str | None = Query(None),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
):
    query = select(Species)
    if q:
        pattern = f"%{q}%"
        query = query.where(
            or_(
                Species.common_name.ilike(pattern),
                Species.scientific_name.ilike(pattern),
            )
        )
    if category:
        query = query.where(Species.category == category)
    query = query.order_by(Species.common_name).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/popular", response_model=list[SpeciesResponse])
async def popular_species(db: AsyncSession = Depends(get_db)):
    # Return a curated set of popular species for onboarding
    popular_names = [
        "Tomato", "Basil", "Mint", "Rosemary", "Lavender",
        "Pothos", "Snake Plant", "Monstera", "Spider Plant",
        "Rose", "Sunflower", "Pepper", "Cucumber", "Lettuce",
        "Fiddle Leaf Fig", "Aloe Vera", "Strawberry", "Thyme",
    ]
    result = await db.execute(
        select(Species)
        .where(Species.common_name.in_(popular_names))
        .order_by(Species.common_name)
    )
    return result.scalars().all()


@router.get("/{species_id}", response_model=SpeciesDetailResponse)
async def get_species(species_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Species).where(Species.id == species_id))
    species = result.scalar_one_or_none()
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    return species
