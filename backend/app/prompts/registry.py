"""
Prompt version management. Prompts are loaded from code by default,
with optional DB override for A/B testing.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.prompt_version import PromptVersion

# In-memory registry of code-defined prompts
_CODE_PROMPTS: dict[str, dict[str, str]] = {}


def register_prompt(name: str, version: str, text: str, changelog: str = ""):
    """Register a prompt version in the code-level registry."""
    _CODE_PROMPTS.setdefault(name, {})[version] = text


def get_code_prompt(name: str, version: str | None = None) -> str:
    """Get a prompt from the code registry. Latest version if none specified."""
    versions = _CODE_PROMPTS.get(name, {})
    if not versions:
        raise ValueError(f"No prompt registered with name '{name}'")
    if version:
        if version not in versions:
            raise ValueError(f"No version '{version}' for prompt '{name}'")
        return versions[version]
    latest = sorted(versions.keys())[-1]
    return versions[latest]


async def get_active_prompt(name: str, db: AsyncSession | None = None) -> str:
    """
    Get the active prompt. Checks DB first (for A/B override), falls back to code.
    This allows live prompt changes without deploys.
    """
    if db:
        result = await db.execute(
            select(PromptVersion)
            .where(PromptVersion.prompt_name == name, PromptVersion.is_active == True)
            .order_by(PromptVersion.created_at.desc())
            .limit(1)
        )
        db_prompt = result.scalar_one_or_none()
        if db_prompt:
            return db_prompt.prompt_text
    return get_code_prompt(name)


def list_registered_prompts() -> dict[str, list[str]]:
    """List all registered prompt names and their versions."""
    return {name: sorted(versions.keys()) for name, versions in _CODE_PROMPTS.items()}
