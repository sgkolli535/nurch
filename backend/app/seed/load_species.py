"""
Seed species data from JSON files into the database.
Usage: python -m app.seed.load_species
"""
import asyncio
import json
from pathlib import Path

from sqlalchemy import select

from app.database import async_session
from app.models.species import Species

SPECIES_DIR = Path(__file__).parent / "species"


async def load_all_species():
    json_files = sorted(SPECIES_DIR.glob("*.json"))
    if not json_files:
        print("No species JSON files found.")
        return

    async with async_session() as session:
        loaded = 0
        updated = 0
        for json_file in json_files:
            data = json.loads(json_file.read_text())

            result = await session.execute(
                select(Species).where(Species.scientific_name == data.get("scientific_name"))
            )
            existing = result.scalar_one_or_none()

            if existing:
                for key, value in data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                updated += 1
            else:
                species = Species(**{k: v for k, v in data.items() if hasattr(Species, k)})
                session.add(species)
                loaded += 1

        await session.commit()
        print(f"Species seed complete: {loaded} added, {updated} updated, {loaded + updated} total.")


if __name__ == "__main__":
    asyncio.run(load_all_species())
