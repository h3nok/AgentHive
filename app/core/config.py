import logging
import os
from typing import List, Literal

from dotenv import load_dotenv
from pydantic import BaseModel

# Configure logger
logger = logging.getLogger(__name__)

# Explicitly load .env file and print debug information
load_dotenv(override=True)  # Override existing environment variables

# Determine if debug mode is enabled globally
DEBUG_MODE = os.environ.get("LEASE_AGENT_DEBUG", "").lower() in ("true", "1", "yes")


class Settings(BaseModel):
    # Application Settings
    APP_NAME: str = "AgentHive"
    DEBUG: bool = DEBUG_MODE
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    LOG_LEVEL: str = "DEBUG" if DEBUG_MODE else "INFO"

    # LLM Provider
    LLM_PROVIDER: Literal["azure", "ollama", "coretex"] = os.getenv(
        "LLM_PROVIDER", "azure"
    ).lower()

    # Azure OpenAI Settings
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_API_VERSION: str = os.getenv("AZURE_OPENAI_API_VERSION", "2023-05-15")
    AZURE_OPENAI_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "")
    AZURE_OPENAI_MODEL: str = os.getenv("AZURE_OPENAI_MODEL", "gpt-4")
    AZURE_OPENAI_NUM_CONCURRENT_CONNECTIONS: int = int(
        os.getenv("AZURE_OPENAI_NUM_CONCURRENT_CONNECTIONS", "10")
    )

    # Ollama Settings (Fallback LLM)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")

    # Coretex LLM API Settings
    CORETEX_API_URL: str = os.getenv("CORETEX_API_URL", "")
    CORETEX_API_KEY: str = os.getenv("CORETEX_API_KEY", "")
    CORETEX_MODEL: str = os.getenv("CORETEX_MODEL", "gpt-4")

    # Snowflake Settings
    SNOWFLAKE_USER: str = os.getenv("SNOWFLAKE_USER", "")
    SNOWFLAKE_PASSWORD: str = os.getenv("SNOWFLAKE_PASSWORD", "")
    SNOWFLAKE_ACCOUNT: str = os.getenv("SNOWFLAKE_ACCOUNT", "")
    SNOWFLAKE_WAREHOUSE: str = os.getenv("SNOWFLAKE_WAREHOUSE", "")
    SNOWFLAKE_DATABASE: str = os.getenv("SNOWFLAKE_DATABASE", "")
    SNOWFLAKE_SCHEMA: str = os.getenv("SNOWFLAKE_SCHEMA", "")

    # Snowflake Cortex Settings
    USE_SNOWFLAKE_CORTEX: bool = (
        os.getenv("USE_SNOWFLAKE_CORTEX", "False").lower() == "true"
    )
    CORTEX_CONFIDENCE_THRESHOLD: float = float(
        os.getenv("CORTEX_CONFIDENCE_THRESHOLD", "0.7")
    )
    CORTEX_STORED_PROC_NAME: str = os.getenv(
        "CORTEX_STORED_PROC_NAME", "CORTEX_NLQ_TO_SQL"
    )

    # Database Selection
    # Options: "mongodb", "redis", "couchbase"
    # Validate and log database backend selection
    _db_backend = os.getenv("DATABASE_BACKEND", "mongodb").lower()
    if _db_backend not in ["mongodb", "redis", "couchbase"]:
        logger.warning(
            f"Invalid DATABASE_BACKEND '{_db_backend}'. Defaulting to 'mongodb'."
        )
    DATABASE_BACKEND: str = _db_backend

    # MongoDB Settings
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "lease_agent")
    MONGODB_SESSION_TTL_HOURS: int = int(os.getenv("MONGODB_SESSION_TTL_HOURS", "24"))

    # Redis Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("REDIS_DB", "0"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    REDIS_TTL_SECONDS: int = int(
        os.getenv("REDIS_TTL_SECONDS", "1800")
    )  # 30 minutes by default

    # Couchbase Settings
    COUCHBASE_CONNECTION_STRING: str = os.getenv("COUCHBASE_CONNECTION_STRING", "")
    COUCHBASE_USERNAME: str = os.getenv("COUCHBASE_USERNAME", "")
    COUCHBASE_PASSWORD: str = os.getenv("COUCHBASE_PASSWORD", "")
    COUCHBASE_BUCKET: str = os.getenv("COUCHBASE_BUCKET", "lease_agent")
    COUCHBASE_SCOPE: str = os.getenv("COUCHBASE_SCOPE", "_default")
    COUCHBASE_SSL: bool = os.getenv("COUCHBASE_SSL", "True").lower() == "true"
    COUCHBASE_CERT_PATH: str = os.getenv("COUCHBASE_CERT_PATH", "")
    COUCHBASE_KV_TIMEOUT: int = int(
        os.getenv("COUCHBASE_KV_TIMEOUT", "2500")
    )  # milliseconds
    COUCHBASE_CONNECT_TIMEOUT: int = int(
        os.getenv("COUCHBASE_CONNECT_TIMEOUT", "10000")
    )  # milliseconds

    # Background Task Settings
    # TASK_MAX_RETRIES: int = int(os.getenv("TASK_MAX_RETRIES", "3"))
    # TASK_RETRY_DELAY: int = int(os.getenv("TASK_RETRY_DELAY", "5"))  # seconds
    # TASK_TIMEOUT: int = int(os.getenv("TASK_TIMEOUT", "300"))  # seconds

    # Cache Settings
    ENABLE_RESPONSE_CACHE: bool = (
        os.getenv("ENABLE_RESPONSE_CACHE", "True").lower() == "true"
    )
    CACHE_TTL_SECONDS: int = int(
        os.getenv("CACHE_TTL_SECONDS", "1800")
    )  # 30 minutes by default

    # ------------------------------------------------------------------
    # Security & CORS
    # ------------------------------------------------------------------
    ALLOWED_ORIGINS_RAW: str = os.getenv("ALLOWED_ORIGINS", "*")
    # Convert comma-separated origins to list, trim whitespace
    CORS_ORIGINS: List[str] = (
        [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]
        if ALLOWED_ORIGINS_RAW != "*"
        else ["*"]
    )

    # Authentication (Azure AD / JWT)
    AUTH_ENABLED: bool = os.getenv("AUTH_ENABLED", "true").lower() == "true"
    AZURE_AD_TENANT_ID: str = os.getenv("AZURE_AD_TENANT_ID", "")
    AZURE_AD_CLIENT_ID: str = os.getenv("AZURE_AD_CLIENT_ID", "")

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_DEFAULT: str = os.getenv("RATE_LIMIT_DEFAULT", "100/minute")

settings = Settings()
