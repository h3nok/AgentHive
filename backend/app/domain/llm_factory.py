"""
Factory for creating LLM adapters.
"""

from typing import Optional
from app.core.settings import settings
from app.adapters.llm_ollama import OllamaAdapter
from app.adapters.llm_openai import OpenAIAdapter


def create_llm_adapter() -> Optional[OllamaAdapter | OpenAIAdapter]:
    """
    Create an LLM adapter based on the configured provider.
    
    Returns:
        An instance of the appropriate LLM adapter
    """
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "ollama":
        return OllamaAdapter()
    elif provider == "azure":
        return OpenAIAdapter()
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}") 