from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "Nurch API"
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nurch"

    # JWT
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 30

    # Storage (Supabase Storage)
    supabase_url: str = ""  # e.g., https://xxxxx.supabase.co
    supabase_service_key: str = ""  # service_role key (not anon key)
    storage_bucket_name: str = "nurch-photos"

    # AI Provider: "gemini", "openai", or "claude"
    ai_provider: str = "gemini"
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    # LangGraph
    langgraph_api_key: str = ""

    # Firebase (push notifications)
    firebase_credentials_path: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
