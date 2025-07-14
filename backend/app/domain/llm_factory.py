"""
Factory for creating LLM adapters with fallback support.
"""

from typing import Optional
import httpx
from app.core.settings import settings
from app.adapters.llm_ollama import OllamaAdapter
from app.adapters.llm_openai import OpenAIAdapter
from app.core.observability import get_logger

logger = get_logger(__name__)


async def check_ollama_availability() -> bool:
    """Check if Ollama is available and responsive."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            return response.status_code == 200
    except Exception as e:
        logger.debug(f"Ollama availability check failed: {e}")
        return False


def is_openai_configured() -> bool:
    """Check if OpenAI/Azure OpenAI is properly configured."""
    # Check for Azure OpenAI configuration
    if (hasattr(settings, 'LLM_PROVIDER') and settings.LLM_PROVIDER.lower() == 'azure' and
        hasattr(settings, 'AZURE_OPENAI_API_KEY') and settings.AZURE_OPENAI_API_KEY and 
        settings.AZURE_OPENAI_API_KEY.strip() and
        hasattr(settings, 'AZURE_OPENAI_ENDPOINT') and settings.AZURE_OPENAI_ENDPOINT):
        return True
    
    # Check for regular OpenAI configuration
    if (hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY and 
        settings.OPENAI_API_KEY.strip() and 
        not settings.OPENAI_API_KEY.startswith('sk-test') and
        settings.OPENAI_API_KEY != 'sk-test-key-placeholder'):
        return True
    
    return False


def create_llm_adapter() -> Optional[OllamaAdapter | OpenAIAdapter]:
    """
    Create an LLM adapter based on the configured provider with fallback support.
    
    Priority order:
    1. Use explicitly configured provider if properly set up
    2. Fall back to Ollama if OpenAI is not configured or has placeholder keys
    3. Fall back to OpenAI if Ollama is not available
    
    Returns:
        An instance of the appropriate LLM adapter
    """
    provider = getattr(settings, 'LLM_PROVIDER', 'openai').lower()
    
    # Try the configured provider first
    if provider == "ollama":
        try:
            logger.info("Using Ollama as the LLM provider")
            return OllamaAdapter()
        except Exception as e:
            logger.warning(f"Failed to create Ollama adapter: {e}")
            # Fall back to OpenAI if available
            if is_openai_configured():
                logger.info("Falling back to OpenAI")
                return OpenAIAdapter()
            else:
                logger.error("No LLM provider available")
                raise ValueError("Both Ollama and OpenAI are unavailable")
    
    elif provider in ["azure", "openai"]:
        # Check if OpenAI is properly configured
        if is_openai_configured():
            try:
                logger.info(f"Using {provider.upper()} as the LLM provider")
                return OpenAIAdapter()
            except Exception as e:
                logger.warning(f"Failed to create OpenAI adapter: {e}")
                # Fall back to Ollama
                try:
                    logger.info("Falling back to Ollama")
                    return OllamaAdapter()
                except Exception as ollama_error:
                    logger.error(f"Ollama fallback also failed: {ollama_error}")
                    raise ValueError("Both OpenAI and Ollama are unavailable")
        else:
            # OpenAI not configured, try Ollama
            logger.warning("OpenAI not properly configured, trying Ollama")
            try:
                logger.info("Using Ollama as fallback LLM provider")
                return OllamaAdapter()
            except Exception as e:
                logger.error(f"Failed to create Ollama adapter: {e}")
                raise ValueError("OpenAI not configured and Ollama unavailable")
    
    else:
        # Unknown provider, try both
        logger.warning(f"Unknown LLM provider '{provider}', trying available options")
        
        # Try OpenAI first if configured
        if is_openai_configured():
            try:
                logger.info("Using OpenAI as fallback")
                return OpenAIAdapter()
            except Exception:
                pass
        
        # Try Ollama
        try:
            logger.info("Using Ollama as fallback")
            return OllamaAdapter()
        except Exception:
            pass
        
        raise ValueError(f"Unsupported LLM provider: {provider}")


async def create_llm_adapter_async() -> Optional[OllamaAdapter | OpenAIAdapter]:
    """
    Async version that can check Ollama availability before creating adapters.
    """
    provider = getattr(settings, 'LLM_PROVIDER', 'openai').lower()
    
    # Check Ollama availability if it's the configured provider or fallback
    ollama_available = await check_ollama_availability()
    openai_configured = is_openai_configured()
    
    if provider == "ollama":
        if ollama_available:
            logger.info("Using Ollama as the LLM provider")
            return OllamaAdapter()
        elif openai_configured:
            logger.info("Ollama unavailable, falling back to OpenAI")
            return OpenAIAdapter()
        else:
            raise ValueError("Ollama unavailable and OpenAI not configured")
    
    elif provider in ["azure", "openai"]:
        if openai_configured:
            try:
                logger.info(f"Using {provider.upper()} as the LLM provider")
                return OpenAIAdapter()
            except Exception as e:
                logger.warning(f"OpenAI failed: {e}")
                if ollama_available:
                    logger.info("Falling back to Ollama")
                    return OllamaAdapter()
                else:
                    raise ValueError("OpenAI failed and Ollama unavailable")
        elif ollama_available:
            logger.info("OpenAI not configured, using Ollama")
            return OllamaAdapter()
        else:
            raise ValueError("OpenAI not configured and Ollama unavailable")
    
    else:
        # Try best available option
        if openai_configured:
            logger.info("Using OpenAI as fallback")
            return OpenAIAdapter()
        elif ollama_available:
            logger.info("Using Ollama as fallback")
            return OllamaAdapter()
        else:
            raise ValueError("No LLM provider available") 