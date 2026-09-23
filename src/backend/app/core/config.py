from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    max_upload_size_mb: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()