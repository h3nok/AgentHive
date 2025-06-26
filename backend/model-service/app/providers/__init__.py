"""Model provider implementations."""
from typing import Type, Dict, Any
from .base import BaseModelProvider
from .ollama import OllamaProvider

class ModelProviderFactory:
    """Factory for creating model providers."""
    
    _providers: Dict[str, Type[BaseModelProvider]] = {
        "ollama": OllamaProvider,
        # Add other providers here (e.g., "openai": OpenAIProvider)
    }
    
    @classmethod
    def create_provider(
        cls,
        provider_name: str,
        **kwargs: Any
    ) -> BaseModelProvider:
        """Create a model provider instance."""
        provider_class = cls._providers.get(provider_name.lower())
        if not provider_class:
            raise ValueError(f"Unsupported provider: {provider_name}")
            
        return provider_class(**kwargs)
    
    @classmethod
    def register_provider(
        cls,
        name: str,
        provider_class: Type[BaseModelProvider]
    ) -> None:
        """Register a new provider type."""
        if not issubclass(provider_class, BaseModelProvider):
            raise TypeError("Provider must be a subclass of BaseModelProvider")
        cls._providers[name.lower()] = provider_class
