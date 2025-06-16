"""
OpenAI LLM adapter for language model operations.

This module provides integration with OpenAI's API for text generation.
"""

from typing import List, Dict, Any, Optional, AsyncIterator
from dataclasses import dataclass
import time
from openai import AsyncOpenAI, OpenAI, AsyncAzureOpenAI, AzureOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from ..core.settings import settings
from ..core.observability import get_logger, with_tracing, measure_tokens, llm_request_duration

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


class OpenAIAdapter:
    """Adapter for OpenAI API integration."""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        organization: Optional[str] = None,
        model: Optional[str] = None
    ):
        """Initialize OpenAI adapter."""
        # Check if using Azure OpenAI
        if (hasattr(settings, 'LLM_PROVIDER') and settings.LLM_PROVIDER == 'azure' and
            hasattr(settings, 'AZURE_OPENAI_API_KEY') and settings.AZURE_OPENAI_API_KEY):
            
            # Use Azure OpenAI configuration
            self.api_key = api_key or settings.AZURE_OPENAI_API_KEY
            self.model = model or getattr(settings, 'AZURE_OPENAI_MODEL', 'gpt-4')
            self.is_azure = True
            self.azure_endpoint = getattr(settings, 'AZURE_OPENAI_ENDPOINT', '')
            self.azure_deployment = getattr(settings, 'AZURE_OPENAI_DEPLOYMENT', self.model)
            self.azure_api_version = getattr(settings, 'AZURE_OPENAI_API_VERSION', '2023-12-01-preview')
            
            if not self.azure_endpoint:
                raise ValueError("Azure OpenAI endpoint not provided. Set AZURE_OPENAI_ENDPOINT environment variable.")
            
            # Initialize Azure OpenAI clients
            self.async_client = AsyncAzureOpenAI(
                api_key=self.api_key,
                azure_endpoint=self.azure_endpoint,
                api_version=self.azure_api_version
            )
            
            self.sync_client = AzureOpenAI(
                api_key=self.api_key,
                azure_endpoint=self.azure_endpoint,
                api_version=self.azure_api_version
            )
            
            logger.info(f"Azure OpenAI adapter initialized with deployment: {self.azure_deployment}")
            
        else:
            # Use regular OpenAI configuration
            self.api_key = api_key or settings.OPENAI_API_KEY
            self.model = model or settings.OPENAI_MODEL
            self.organization = organization or settings.OPENAI_ORGANIZATION
            self.is_azure = False
            
            if not self.api_key:
                raise ValueError("OpenAI API key not provided. Set OPENAI_API_KEY environment variable.")
            
            # Initialize regular OpenAI clients
            self.async_client = AsyncOpenAI(
                api_key=self.api_key,
                organization=self.organization
            )
            
            self.sync_client = OpenAI(
                api_key=self.api_key,
                organization=self.organization
            )
            
            logger.info(f"OpenAI adapter initialized with model: {self.model}")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    @with_tracing("openai_complete")
    # @measure_tokens  # Temporarily disabled due to observability issues
    async def complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        messages: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        model: Optional[str] = None,
        response_format: Optional[str] = None,
        **kwargs
    ) -> CompletionResponse:
        """Generate completion from OpenAI."""
        start_time = time.time()
        model = model or self.model or "gpt-4"
        
        # Ensure tables are formatted with the 'table' fenced code block
        table_instruction = (
            "When outputting tables, wrap them in a fenced code block labeled 'table', for example:\n``table\n| col1 | col2 | ... |\n```"
        )
        if system_prompt:
            system_prompt += "\n" + table_instruction
        else:
            system_prompt = table_instruction
        
        # Build messages
        if messages is None:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
        
        try:
            # For Azure OpenAI, use deployment name as model
            model_param = self.azure_deployment if self.is_azure else model
            
            # Prepare request parameters
            request_params = {
                "model": model_param,
                "messages": messages,  # type: ignore
                **kwargs
            }
            
            # Handle model-specific parameters
            model_str = str(self.azure_deployment).lower() if self.is_azure else str(model).lower()
            
            # o3 models have specific parameter restrictions
            if "o3" in model_str:
                # o3 models use max_completion_tokens instead of max_tokens
                request_params["max_completion_tokens"] = max_tokens
                # o3 models don't support temperature parameter
                # Skip adding temperature for o3 models
            else:
                # Other models support temperature and use max_tokens
                request_params["temperature"] = temperature
                request_params["max_tokens"] = max_tokens
            
            # Add response format if specified
            if response_format == "json":
                request_params["response_format"] = {"type": "json_object"}
            
            # Make API call
            response = await self.async_client.chat.completions.create(**request_params)
            
            # Extract response
            content = response.choices[0].message.content
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            } if response.usage else None
            
            # Calculate latency
            latency_ms = (time.time() - start_time) * 1000
            
            # Record metrics
            if usage:
                llm_request_duration.labels(
                    model=model or "unknown",
                    operation="complete"
                ).observe(latency_ms / 1000)
            
            logger.info(
                "OpenAI completion successful",
                model=model,
                tokens=usage.get("total_tokens") if usage else None,
                latency_ms=latency_ms
            )
            
            return CompletionResponse(
                content=content,
                model=model or "unknown",
                usage=usage,
                metadata={
                    "latency_ms": latency_ms,
                    "finish_reason": response.choices[0].finish_reason
                }
            )
            
        except Exception as e:
            logger.error(f"OpenAI completion failed: {str(e)}")
            raise
    
    @with_tracing("openai_stream_complete")
    async def stream_complete(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        messages: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        model: Optional[str] = None,
        **kwargs
    ) -> AsyncIterator[StreamChunk]:
        """Stream completion from OpenAI."""
        model = model or self.model or "gpt-4"
        assert model is not None, "Model should never be None at this point"
        
        # Build messages
        if messages is None:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
        
        try:
            # For Azure OpenAI, use deployment name as model
            model_param = self.azure_deployment if self.is_azure else model
            
            # Prepare request parameters
            request_params = {
                "model": model_param,
                "messages": messages,  # type: ignore
                "stream": True,
                **kwargs
            }
            
            # Handle model-specific parameters
            model_str = str(self.azure_deployment).lower() if self.is_azure else str(model).lower()
            
            # o3 models have specific parameter restrictions
            if "o3" in model_str:
                # o3 models use max_completion_tokens instead of max_tokens
                request_params["max_completion_tokens"] = max_tokens
                # o3 models don't support temperature parameter in streaming mode
                # Skip adding temperature for o3 models
            else:
                # Other models support temperature and use max_tokens
                request_params["temperature"] = temperature
                request_params["max_tokens"] = max_tokens
            
            # Create streaming response
            stream = await self.async_client.chat.completions.create(**request_params)
            
            # Stream chunks
            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        yield StreamChunk(
                            content=delta.content,
                            finish_reason=chunk.choices[0].finish_reason
                        )
            
            logger.info("OpenAI streaming completed", model=model)
            
        except Exception as e:
            logger.error(f"OpenAI streaming failed: {str(e)}")
            raise
    
    async def get_embeddings(
        self,
        text: str,
        model: str = "text-embedding-ada-002"
    ) -> List[float]:
        """Get embeddings for text."""
        try:
            response = await self.async_client.embeddings.create(
                model=model,
                input=text
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Failed to get embeddings: {str(e)}")
            raise
    
    async def moderate_content(self, text: str) -> Dict[str, Any]:
        """Check content for policy violations."""
        try:
            response = await self.async_client.moderations.create(input=text)
            
            result = response.results[0]
            
            return {
                "flagged": result.flagged,
                "categories": {
                    category: getattr(result.categories, category)
                    for category in dir(result.categories)
                    if not category.startswith('_')
                },
                "scores": {
                    category: getattr(result.category_scores, category)
                    for category in dir(result.category_scores)
                    if not category.startswith('_')
                }
            }
            
        except Exception as e:
            logger.error(f"Content moderation failed: {str(e)}")
            raise
    
    def estimate_tokens(self, text: str, model: Optional[str] = None) -> int:
        """Estimate token count for text."""
        # Simple estimation: ~4 characters per token
        # For more accurate counting, use tiktoken
        # Note: model parameter kept for interface compatibility
        _ = model  # Suppress unused parameter warning
        return len(text) // 4
    
    def calculate_cost(
        self,
        prompt_tokens: int,
        completion_tokens: int,
        model: Optional[str] = None
    ) -> float:
        """Calculate cost for token usage."""
        model = model or self.model or "gpt-4"
        assert model is not None, "Model should never be None at this point"
        
        # Pricing as of 2024 (in USD per 1K tokens)
        pricing = {
            "gpt-4-turbo-preview": {"prompt": 0.01, "completion": 0.03},
            "gpt-4": {"prompt": 0.03, "completion": 0.06},
            "gpt-3.5-turbo": {"prompt": 0.0005, "completion": 0.0015},
        }
        
        # Default pricing if model not found
        model_pricing = pricing.get(model, {"prompt": 0.01, "completion": 0.03})
        
        prompt_cost = (prompt_tokens / 1000) * model_pricing["prompt"]
        completion_cost = (completion_tokens / 1000) * model_pricing["completion"]
        
        return prompt_cost + completion_cost