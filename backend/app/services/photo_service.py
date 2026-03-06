"""
Photo storage service using Supabase Storage.
Handles upload URL generation and public URL resolution.
"""
import httpx

from app.config import settings


def _storage_api_url() -> str:
    """Base URL for Supabase Storage REST API."""
    return f"{settings.supabase_url}/storage/v1"


def _headers() -> dict:
    """Auth headers using the service role key."""
    return {
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "apikey": settings.supabase_service_key,
    }


async def generate_presigned_upload(storage_key: str, content_type: str, expires_in: int = 3600) -> str:
    """
    Generate a signed upload URL via Supabase Storage.
    The client PUTs the file directly to this URL.
    """
    if not settings.supabase_url or not settings.supabase_service_key:
        # Dev mode fallback
        return f"http://localhost:8000/dev-upload/{storage_key}"

    url = f"{_storage_api_url()}/object/upload/sign/{settings.storage_bucket_name}/{storage_key}"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            url,
            headers=_headers(),
            json={"expiresIn": expires_in},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        # Supabase returns a relative signed URL — prepend the base
        signed_path = data.get("signedURL") or data.get("url", "")
        if signed_path.startswith("/"):
            return f"{_storage_api_url()}{signed_path}"
        return signed_path


def get_public_url(storage_key: str) -> str:
    """Get the public URL for a stored file."""
    if not settings.supabase_url:
        return f"http://localhost:8000/dev-photos/{storage_key}"
    return f"{settings.supabase_url}/storage/v1/object/public/{settings.storage_bucket_name}/{storage_key}"


async def ensure_bucket_exists():
    """Create the storage bucket if it doesn't exist (idempotent)."""
    if not settings.supabase_url or not settings.supabase_service_key:
        return

    url = f"{_storage_api_url()}/bucket"
    async with httpx.AsyncClient() as client:
        # Check if bucket exists
        resp = await client.get(
            f"{url}/{settings.storage_bucket_name}",
            headers=_headers(),
            timeout=10,
        )
        if resp.status_code == 200:
            return  # Already exists

        # Create bucket
        await client.post(
            url,
            headers=_headers(),
            json={
                "id": settings.storage_bucket_name,
                "name": settings.storage_bucket_name,
                "public": True,
            },
            timeout=10,
        )


async def delete_file(storage_key: str):
    """Delete a file from Supabase Storage."""
    if not settings.supabase_url or not settings.supabase_service_key:
        return

    url = f"{_storage_api_url()}/object/{settings.storage_bucket_name}/{storage_key}"
    async with httpx.AsyncClient() as client:
        await client.delete(url, headers=_headers(), timeout=10)
