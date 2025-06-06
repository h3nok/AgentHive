"""
Application configuration using Pydantic BaseSettings.

This module provides centralized configuration management with environment variable support.
"""

from typing import List, Optional, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, PostgresDsn, RedisDsn, field_validator
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow"
    )
    
    # Application
    app_name: str = "Intelligent Router API"
    app_version: str = "0.1.0"
    debug: bool = Field(default=False, description="Debug mode")
    environment: str = Field(default="development", description="Environment (development, staging, production)")
    
    # API Configuration
    api_v1_prefix: str = "/v1"
    api_key: str = Field(default="", description="API Key for authentication")
    cors_origins: List[str] = Field(default=["*"], description="CORS allowed origins")
    
    # Server
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    workers: int = Field(default=4, description="Number of worker processes")
    
    # Database
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
    redis_host: str = Field(default="localhost", description="Redis host")
    redis_port: int = Field(default=6379, description="Redis port")
    redis_password: Optional[str] = Field(default=None, description="Redis password")
    redis_db: int = Field(default=0, description="Redis database number")
    redis_url: Optional[RedisDsn] = None
    
    @field_validator("redis_url", mode="before")
    @classmethod
    def assemble_redis_connection(cls, v: Optional[str], info) -> Any:
        if isinstance(v, str) and v:  # Only process non-empty strings
            return v
        if isinstance(v, str) and not v:  # Return None for empty strings
            return None
        values = info.data if hasattr(info, 'data') else {}
        password = values.get("redis_password")
        host = values.get("redis_host", "localhost")
        port = values.get("redis_port", 6379)
        db = values.get("redis_db", 0)
        return RedisDsn.build(
            scheme="redis",
            username="" if not password else None,
            password=password,
            host=host,
            port=port,
            path=f"/{db}",
        )
    
    # LLM Configuration
    openai_api_key: str = Field(default="", description="OpenAI API key")
    openai_organization: Optional[str] = Field(default=None, description="OpenAI organization ID")
    openai_model: str = Field(default="gpt-4-turbo-preview", description="Default OpenAI model")
    openai_temperature: float = Field(default=0.7, description="Default temperature for OpenAI models")
    openai_max_tokens: int = Field(default=2000, description="Default max tokens for OpenAI models")
    
    # Azure OpenAI Configuration
    azure_openai_endpoint: str = Field(default="", description="Azure OpenAI endpoint")
    azure_openai_api_key: str = Field(default="", description="Azure OpenAI API key")
    azure_openai_deployment: str = Field(default="", description="Azure OpenAI deployment name")
    azure_openai_api_version: str = Field(default="2023-05-15", description="Azure OpenAI API version")
    azure_openai_model: str = Field(default="gpt-4", description="Azure OpenAI model name")
    
    # Ollama Configuration
    ollama_base_url: str = Field(default="http://localhost:11434", description="Ollama base URL")
    ollama_model: str = Field(default="llama3", description="Ollama model name")
    
    # Coretex Configuration
    coretex_api_url: str = Field(default="", description="Coretex API URL")
    coretex_api_key: str = Field(default="", description="Coretex API key")
    coretex_model: str = Field(default="gpt-4", description="Coretex model name")
    
    # LLM Provider Selection
    llm_provider: str = Field(default="azure", description="LLM provider (azure, ollama, coretex)")
    
    # Observability
    otel_exporter_endpoint: str = Field(default="http://localhost:4318", description="OpenTelemetry exporter endpoint")
    otel_service_name: str = Field(default="intelligent-router", description="Service name for tracing")
    otel_enabled: bool = Field(default=True, description="Enable OpenTelemetry")
    metrics_enabled: bool = Field(default=True, description="Enable Prometheus metrics")
    
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
    secret_key: str = Field(default="", description="Secret key for JWT encoding")
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
    
    @field_validator("secret_key", mode="before")
    @classmethod
    def get_secret_key(cls, v: str) -> str:
        if not v:
            # Generate a random secret key if not provided
            import secrets
            return secrets.token_urlsafe(32)
        return v
    
    @field_validator("openai_api_key")
    @classmethod
    def validate_openai_key(cls, v: str) -> str:
        if not v and os.getenv("OPENAI_API_KEY"):
            return os.getenv("OPENAI_API_KEY", "")
        return v
    
# Global settings instance
settings = Settings()