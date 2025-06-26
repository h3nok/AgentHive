"""Base model provider interface."""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, Optional
from pydantic import BaseModel

class ModelResponse(BaseModel):
    """Standardized model response."""
    content: str
    model: str
    usage: Dict[str, int]
    metadata: Dict[str, Any] = {}

class BaseModelProvider(ABC):
    """Abstract base class for model providers."""
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs: Any
    ) -> ModelResponse:
        """Generate a completion from the model.
        
        Args:
            prompt: The input prompt
            model: The model to use
            temperature: Sampling temperature
            max_tokens: Maximum number of tokens to generate
            **kwargs: Additional provider-specific parameters
            
        Returns:
            ModelResponse with the generated content and metadata
        """
        pass
    
    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs: Any
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream a completion from the model.
        
        Args:
            prompt: The input prompt
            model: The model to use
            temperature: Sampling temperature
            max_tokens: Maximum number of tokens to generate
            **kwargs: Additional provider-specific parameters
            
        Yields:
            Dictionary with response chunks
        """
        pass
    
    async def close(self) -> None:
        """Clean up resources."""
        pass
