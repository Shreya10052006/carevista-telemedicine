"""
CareVista Backend Configuration
===============================
Loads environment variables and provides centralized configuration.

SECURITY:
- API keys loaded from environment variables only
- Never hardcoded, never logged
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Firebase
    firebase_service_account_path: str = "./firebase-service-account.json"
    
    # AI LLMs
    groq_api_key: str = ""
    gemini_api_key: str = ""
    
    # Agora WebRTC
    agora_app_id: str = ""
    agora_app_certificate: str = ""
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # CORS
    allowed_origins: str = "http://localhost:3000"
    
    # Whisper
    whisper_model: str = "small"
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated CORS origins."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
