"""API routes for the model service."""
from typing import Optional, AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.providers import BaseModelProvider
from .dependencies import get_model_provider, verify_token

router = APIRouter()

class CompletionRequest(BaseModel):
    """Request model for completion generation."""
    prompt: str = Field(..., description="The prompt to generate a response for")
    model: str = Field(..., description="The model to use for generation")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, 
                             description="Sampling temperature (0.0 to 2.0)")
    max_tokens: Optional[int] = Field(
        default=None, 
        ge=1, 
        description="Maximum number of tokens to generate"
    )
    stream: bool = Field(
        default=False, 
        description="Whether to stream the response"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "prompt": "Explain quantum computing in simple terms",
                "model": "llama3",
                "temperature": 0.7,
                "max_tokens": 100,
                "stream": False
            }
        }

@router.post("/v1/completions")
async def create_completion(
    request: Request,
    completion_request: CompletionRequest,
    provider: BaseModelProvider = Depends(get_model_provider),
    _: None = Depends(verify_token)
):
    """Generate a completion for the given prompt."""
    try:
        if completion_request.stream:
            return StreamingResponse(
                generate_stream(provider, completion_request),
                media_type="text/event-stream"
            )
        
        response = await provider.generate(
            prompt=completion_request.prompt,
            model=completion_request.model,
            temperature=completion_request.temperature,
            max_tokens=completion_request.max_tokens
        )
        return response.dict()
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating completion: {str(e)}"
        )

async def generate_stream(
    provider: BaseModelProvider,
    request: CompletionRequest
) -> AsyncGenerator[bytes, None]:
    """Generate a streaming response."""
    try:
        async for chunk in provider.generate_stream(
            prompt=request.prompt,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        ):
            # Format as Server-Sent Events
            yield f"data: {chunk}\n\n".encode()
            
    except Exception as e:
        error_msg = f"data: {{\"error\": \"{str(e)}\"}}\n\n".encode()
        yield error_msg
    
    # Send the final done message
    yield "data: [DONE]\n\n".encode()

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@router.get("/models")
async def list_models(
    provider: BaseModelProvider = Depends(get_model_provider),
    _: None = Depends(verify_token)
):
    """List available models."""
    # In a real implementation, this would return the actual list of models
    # For now, we'll return a default list
    return {
        "object": "list",
        "data": [
            {
                "id": "llama3",
                "object": "model",
                "created": 1677610602,
                "owned_by": "meta"
            },
            {
                "id": "llama2",
                "object": "model",
                "created": 1677610602,
                "owned_by": "meta"
            },
            {
                "id": "mistral",
                "object": "model",
                "created": 1677610602,
                "owned_by": "mistral"
            }
        ]
    }
