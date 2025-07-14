"""
Ollama adapter for LLM operations.
"""

import httpx
from typing import AsyncGenerator, Optional, Dict, Any
from dataclasses import dataclass
from app.core.settings import settings
from app.core.observability import get_logger

logger = get_logger(__name__)

@dataclass
class CompletionResponse:
    """Response from LLM completion."""
    content: str
    model: str
    usage: Optional[Dict[str, int]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class StreamChunk:
    """Single chunk from streaming response."""
    content: str
    finish_reason: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class OllamaAdapter:
    """Adapter for Ollama LLM operations."""
    
    def __init__(self):
        """Initialize the Ollama adapter."""
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=120.0)
    
    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        messages: Optional[list] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None,
        **kwargs
    ) -> CompletionResponse:
        """
        Get a completion from Ollama.
        
        Args:
            prompt: The prompt to send to the model
            system_prompt: System prompt (will be prepended to messages)
            messages: List of conversation messages
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            model: Model to use (overrides default)
            **kwargs: Additional parameters to pass to the model
            
        Returns:
            LLMResponse object containing the model's response
        """
        try:
            # Build the final prompt from messages if provided
            if messages:
                final_prompt = self._build_prompt_from_messages(messages, system_prompt)
            else:
                final_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

            used_model = model or self.model
            
            response = await self.client.post(
                "/api/generate",
                json={
                    "model": used_model,
                    "prompt": final_prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": False,
                    **kwargs
                }
            )
            response.raise_for_status()
            data = response.json()
            
            return CompletionResponse(
                content=data["response"],
                model=used_model,
                usage={
                    "prompt_tokens": len(final_prompt.split()),
                    "completion_tokens": len(data["response"].split()),
                    "total_tokens": len(final_prompt.split()) + len(data["response"].split())
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

    def _build_prompt_from_messages(self, messages: list, system_prompt: Optional[str] = None) -> str:
        """Build a single prompt string from conversation messages."""
        prompt_parts = []
        
        if system_prompt:
            prompt_parts.append(f"System: {system_prompt}")
        
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            if role == "system" and not system_prompt:
                prompt_parts.append(f"System: {content}")
            elif role == "user":
                prompt_parts.append(f"Human: {content}")
            elif role == "assistant":
                prompt_parts.append(f"Assistant: {content}")
        
        return "\n\n".join(prompt_parts)

    async def stream_complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        messages: Optional[list] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        model: Optional[str] = None,
        **kwargs
    ) -> AsyncGenerator[StreamChunk, None]:
        """
        Stream completion from Ollama (compatible with OpenAI interface).
        
        Args:
            prompt: The prompt to send to the model
            system_prompt: System prompt (will be prepended to messages)
            messages: List of conversation messages
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            model: Model to use (overrides default)
            **kwargs: Additional parameters to pass to the model
            
        Yields:
            StreamChunk objects containing chunks of the model's response
        """
        try:
            # Build the final prompt from messages if provided
            if messages:
                final_prompt = self._build_prompt_from_messages(messages, system_prompt)
            else:
                final_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

            used_model = model or self.model
            
            async with self.client.stream(
                "POST",
                "/api/generate",
                json={
                    "model": used_model,
                    "prompt": final_prompt,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                    **kwargs
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            import json
                            data = json.loads(line)
                            if data.get("response"):
                                yield StreamChunk(
                                    content=data["response"],
                                    metadata={
                                        "context": data.get("context", []),
                                        "done": data.get("done", False),
                                        "model": used_model
                                    }
                                )
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            raise Exception(f"Error streaming completion from Ollama: {str(e)}")
    
    async def stream(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> AsyncGenerator[StreamChunk, None]:
        """
        Stream a completion from Ollama.
        
        Args:
            prompt: The prompt to send to the model
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            **kwargs: Additional parameters to pass to the model
            
        Yields:
            StreamChunk objects containing chunks of the model's response
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
                        yield StreamChunk(
                            content=data["response"],
                            metadata={
                                "context": data.get("context", []),
                                "total_duration": data.get("total_duration", 0),
                                "load_duration": data.get("load_duration", 0),
                                "prompt_eval_duration": data.get("prompt_eval_duration", 0),
                                "eval_duration": data.get("eval_duration", 0),
                                "eval_count": data.get("eval_count", 0),
                                "model": self.model
                            }
                        )
        except Exception as e:
            raise Exception(f"Error streaming completion from Ollama: {str(e)}")
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose() 