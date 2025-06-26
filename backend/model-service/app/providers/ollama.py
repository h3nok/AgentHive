"""Ollama model provider implementation."""
import json
import logging
from typing import AsyncGenerator, Dict, Any, Optional
import httpx

from .base import BaseModelProvider, ModelResponse

logger = logging.getLogger(__name__)

class OllamaProvider(BaseModelProvider):
    """Provider for Ollama models."""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        """Initialize the Ollama provider.
        
        Args:
            base_url: Base URL for the Ollama API
        """
        self.base_url = base_url.rstrip('/')
        self.client = httpx.AsyncClient(
            base_url=base_url,
            timeout=60.0,
            headers={"Content-Type": "application/json"}
        )
        logger.info(f"Initialized Ollama provider with base URL: {base_url}")
    
    async def generate(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs: Any
    ) -> ModelResponse:
        """Generate a completion using Ollama."""
        logger.debug(
            f"Generating completion with model={model}, "
            f"temperature={temperature}, max_tokens={max_tokens}"
        )
        
        try:
            response = await self.client.post(
                "/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": False,
                    **kwargs
                }
            )
            response.raise_for_status()
            data = response.json()
            
            return ModelResponse(
                content=data["response"],
                model=model,
                usage={
                    "prompt_tokens": data.get("prompt_eval_count", 0),
                    "completion_tokens": data.get("eval_count", 0),
                    "total_tokens": (data.get("prompt_eval_count", 0) + 
                                     data.get("eval_count", 0))
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
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama API error (HTTP {e.response.status_code}): {e}")
            raise Exception(f"Ollama API error: {e}") from e
        except Exception as e:
            logger.error(f"Error generating completion: {e}")
            raise
    
    async def generate_stream(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs: Any
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream a completion from Ollama."""
        logger.debug(
            f"Streaming completion with model={model}, "
            f"temperature={temperature}, max_tokens={max_tokens}"
        )
        
        try:
            async with self.client.stream(
                "POST",
                "/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                    **kwargs
                }
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                        
                    try:
                        chunk = json.loads(line)
                        yield {
                            "object": "chat.completion.chunk",
                            "model": model,
                            "choices": [{
                                "delta": {"content": chunk.get("response", "")},
                                "index": 0,
                                "finish_reason": "stop" if chunk.get("done") else None
                            }],
                            "created": chunk.get("created_at", 0),
                            "id": f"cmpl-{chunk.get('id', '')}",
                            "usage": None
                        }
                        
                        if chunk.get("done"):
                            break
                            
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse chunk: {line}")
                        continue
                        
        except Exception as e:
            logger.error(f"Error in streaming: {e}")
            raise
    
    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()
