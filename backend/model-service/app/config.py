"""Configuration settings for the model service."""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings."""
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    RELOAD: bool = True
    LOG_LEVEL: str = "info"
    
    # Provider configuration
    PROVIDER: str = "ollama"
    OLLAMA_BASE_URL: str = "http://ollama:11434"
    
    # Model defaults
    DEFAULT_MODEL: str = "llama3"
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_MAX_TOKENS: Optional[int] = None
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()
