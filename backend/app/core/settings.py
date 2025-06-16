"""
Application configuration using Pydantic BaseSettings.

This module provides centralized configuration management with environment variable support.
"""

from typing import List, Optional, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, PostgresDsn, RedisDsn, field_validator
import os
from pathlib import Path
import secrets


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )
    
    # Application
    APP_NAME: str = "AgentHive"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"
    
    # API Configuration
    api_v1_prefix: str = "/v1"
    api_key: str = Field(default="", description="API Key for authentication")
    cors_origins: List[str] = Field(default=["*"], description="CORS allowed origins")
    
    # Server
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    workers: int = Field(default=4, description="Number of worker processes")
    
    # Database
    DATABASE_BACKEND: str = "mongodb"
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "agent_hive"
    MONGODB_SESSION_TTL_HOURS: int = 24
    postgres_user: str = Field(default="postgres", description="PostgreSQL user")
    postgres_password: str = Field(default="postgres", description="PostgreSQL password")
    postgres_db: str = Field(default="intelligent_router", description="PostgreSQL database name")
    postgres_host: str = Field(default="localhost", description="PostgreSQL host")
    postgres_port: int = Field(default=5432, description="PostgreSQL port")
    database_url: Optional[PostgresDsn] = None
    db_echo: bool = Field(default=False, description="Enable database SQL echo")
    
    @field_validator("database_url", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info) -> Any:
        if isinstance(v, str):
            return v
        values = info.data if hasattr(info, 'data') else {}
        db_name = values.get('postgres_db') or ''
        path = db_name if db_name else ""
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("postgres_user"),
            password=values.get("postgres_password"),
            host=values.get("postgres_host"),
            port=values.get("postgres_port"),
            path=path,
        )
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None
    
    # LLM Configuration
    LLM_PROVIDER: str = "openai"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_API_VERSION: str = "2023-05-15"
    AZURE_OPENAI_DEPLOYMENT: Optional[str] = None
    AZURE_OPENAI_MODEL: str = "gpt-4"
    
    # Regular OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_ORGANIZATION: Optional[str] = None
    
    # Snowflake Settings
    SNOWFLAKE_USER: Optional[str] = None
    SNOWFLAKE_PASSWORD: Optional[str] = None
    SNOWFLAKE_ACCOUNT: Optional[str] = None
    SNOWFLAKE_WAREHOUSE: Optional[str] = None
    SNOWFLAKE_DATABASE: Optional[str] = None
    SNOWFLAKE_SCHEMA: Optional[str] = None
    
    # Observability
    otel_exporter_endpoint: str = Field(default="http://localhost:4318", description="OpenTelemetry exporter endpoint")
    otel_service_name: str = Field(default="agent-hive", description="Service name for tracing")
    otel_enabled: bool = Field(default=False, description="Enable OpenTelemetry")
    metrics_enabled: bool = Field(default=False, description="Enable Prometheus metrics")
    
    # Celery
    celery_broker_url: Optional[str] = None
    celery_result_backend: Optional[str] = None
    
    @field_validator("celery_broker_url", mode="before")
    @classmethod
    def get_celery_broker(cls, v: Optional[str], info) -> str:
        if v:
            return v
        values = info.data if hasattr(info, 'data') else {}
        return str(values.get("redis_url", "redis://localhost:6379/0"))
    
    @field_validator("celery_result_backend", mode="before")
    @classmethod
    def get_celery_backend(cls, v: Optional[str], info) -> str:
        if v:
            return v
        values = info.data if hasattr(info, 'data') else {}
        return str(values.get("redis_url", "redis://localhost:6379/0"))
    
    # Security
    access_token_expire_minutes: int = Field(default=30, description="Access token expiration time")
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    
    # Rate Limiting
    rate_limit_enabled: bool = Field(default=True, description="Enable rate limiting")
    rate_limit_requests: int = Field(default=100, description="Number of requests per window")
    rate_limit_window: int = Field(default=60, description="Rate limit window in seconds")
    
    # Plugins
    plugins_dir: Path = Field(default=Path("app/plugins"), description="Plugins directory")
    plugins_enabled: List[str] = Field(default=["lease_agent", "hr_agent"], description="Enabled plugins")
    
    # Circuit Breaker
    circuit_breaker_failure_threshold: int = Field(default=5, description="Failure threshold for circuit breaker")
    circuit_breaker_recovery_timeout: int = Field(default=60, description="Recovery timeout in seconds")
    circuit_breaker_expected_exception: type = Field(default=Exception, description="Expected exception type")
    
    @field_validator("OPENAI_API_KEY")
    @classmethod
    def validate_openai_key(cls, v: str) -> str:
        if not v and os.getenv("OPENAI_API_KEY"):
            return os.getenv("OPENAI_API_KEY", "")
        return v


# Global settings instance
settings = Settings()