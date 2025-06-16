"""
Ollama adapter for LLM operations.
"""

import httpx
from typing import AsyncGenerator, Optional, Dict, Any
from app.core.settings import settings
from app.domain.llm import LLMResponse, LLMStreamResponse


class OllamaAdapter:
    """Adapter for Ollama LLM operations."""
    
    def __init__(self):
        """Initialize the Ollama adapter."""
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)
    
    async def complete(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Get a completion from Ollama.
        
        Args:
            prompt: The prompt to send to the model
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            **kwargs: Additional parameters to pass to the model
            
        Returns:
            LLMResponse object containing the model's response
        """
        try:
            response = await self.client.post(
                "/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    **kwargs
                }
            )
            response.raise_for_status()
            data = response.json()
            
            return LLMResponse(
                content=data["response"],
                model=self.model,
                usage={
                    "prompt_tokens": len(prompt.split()),
                    "completion_tokens": len(data["response"].split()),
                    "total_tokens": len(prompt.split()) + len(data["response"].split())
                },
                metadata={
                    "context": data.get("context", []),
                    "total_duration": data.get("total_duration", 0),
                    "load_duration": data.get("load_duration", 0),
                    "prompt_eval_duration": data.get("prompt_eval_duration", 0),
                    "eval_duration": data.get("eval_duration", 0),
                    "eval_count": data.get("eval_count", 0)
                }
            )
        except Exception as e:
            raise Exception(f"Error getting completion from Ollama: {str(e)}")
    
    async def stream(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncGenerator[LLMStreamResponse, None]:
        """
        Stream a completion from Ollama.
        
        Args:
            prompt: The prompt to send to the model
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            **kwargs: Additional parameters to pass to the model
            
        Yields:
            LLMStreamResponse objects containing chunks of the model's response
        """
        try:
            async with self.client.stream(
                "POST",
                "/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                    **kwargs
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        data = eval(line)  # Ollama returns Python dict as string
                        yield LLMStreamResponse(
                            content=data["response"],
                            model=self.model,
                            metadata={
                                "context": data.get("context", []),
                                "total_duration": data.get("total_duration", 0),
                                "load_duration": data.get("load_duration", 0),
                                "prompt_eval_duration": data.get("prompt_eval_duration", 0),
                                "eval_duration": data.get("eval_duration", 0),
                                "eval_count": data.get("eval_count", 0)
                            }
                        )
        except Exception as e:
            raise Exception(f"Error streaming completion from Ollama: {str(e)}")
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose() 