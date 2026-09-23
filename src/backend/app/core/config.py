from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import SecretStr


class Settings(BaseSettings):
    max_upload_size_mb: int = 5
    database_url: str = "sqlite:///storage/cv_rank.db"
    ai_provider: str = "mock"
    ai_model: str = "gpt-4o-mini"
    ai_api_key: SecretStr | None = None
    ai_base_url: str = "https://api.openai.com/v1"
    ai_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()