from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr


class Settings(BaseSettings):
    max_upload_size_mb: int = 5
    database_url: str = "sqlite:///storage/cv_rank.db"
    ai_provider: str = "openrouter"
    ai_model: str = "openai/gpt-4o-mini"
    ai_api_key: SecretStr | None = None
    ai_base_url: str = "https://openrouter.ai/api/v1"
    ai_http_referer: str | None = None
    ai_app_title: str = "CV-Rank"
    ai_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()