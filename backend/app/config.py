from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Gemini API Configuration
    gemini_api_key: str
    gemini_model: str = "gemini-1.5-pro"

    # CORS Configuration
    allowed_origins: str = "http://localhost:3000"

    # File Upload Configuration
    max_file_size_mb: int = 10
    upload_dir: str = "./uploads"

    # API Configuration
    api_v1_prefix: str = "/api/v1"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated origins to list."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB to bytes."""
        return self.max_file_size_mb * 1024 * 1024


settings = Settings()
