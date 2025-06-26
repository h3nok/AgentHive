"""Dependencies for the model service API."""
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.providers import ModelProviderFactory, BaseModelProvider
from app.config import settings

security = HTTPBearer()

async def get_model_provider() -> AsyncGenerator[BaseModelProvider, None]:
    """Get the model provider instance."""
    provider = None
    try:
        provider = ModelProviderFactory.create_provider(
            provider_name=settings.PROVIDER,
            base_url=settings.OLLAMA_BASE_URL
        )
        yield provider
    finally:
        if provider:
            await provider.close()

async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> None:
    """Verify the API token.
    
    In production, this would validate the token against your auth service.
    For development, we'll just check if a token is present.
    """
    if not credentials.scheme == "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme",
        )
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API token",
        )
    # In production, you would validate the token here
    # For now, we'll just log that we received a token
    print(f"Received token: {credentials.credentials}")  # Remove in production
