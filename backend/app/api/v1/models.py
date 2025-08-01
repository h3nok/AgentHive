"""
Models API router for managing available AI models.

This module provides endpoints for listing and managing AI models.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

from app.core.observability import get_logger
from app.core.settings import settings

logger = get_logger(__name__)

router = APIRouter(prefix="/models", tags=["models"])

class ModelInfo(BaseModel):
    """Model information schema"""
    id: str
    name: str
    description: str
    provider: str  # azure, ollama, coretex
    capabilities: List[str]
    context_length: int
    is_available: bool
    is_default: bool
    pricing_tier: str  # free, standard, premium
    specialties: List[str]  # chat, code, analysis, etc.

class ModelsResponse(BaseModel):
    """Response schema for models endpoint"""
    models: List[ModelInfo]
    default_model: str
    total_count: int

# Available models configuration
AVAILABLE_MODELS = [
    {
        "id": "gpt-4",
        "name": "GPT-4",
        "description": "Most capable model for complex reasoning and analysis",
        "provider": "azure",
        "capabilities": ["chat", "analysis", "code", "reasoning"],
        "context_length": 8192,
        "is_available": True,
        "is_default": True,
        "pricing_tier": "premium",
        "specialties": ["complex reasoning", "detailed analysis", "code review"]
    },
    {
        "id": "gpt-4-turbo",
        "name": "GPT-4 Turbo",
        "description": "Faster GPT-4 with larger context window",
        "provider": "azure",
        "capabilities": ["chat", "analysis", "code", "reasoning", "long-context"],
        "context_length": 128000,
        "is_available": True,
        "is_default": False,
        "pricing_tier": "premium",
        "specialties": ["long documents", "complex analysis", "multi-step reasoning"]
    },
    {
        "id": "gpt-35-turbo",
        "name": "GPT-3.5 Turbo",
        "description": "Fast and efficient model for general tasks",
        "provider": "azure",
        "capabilities": ["chat", "basic-analysis", "code"],
        "context_length": 4096,
        "is_available": True,
        "is_default": False,
        "pricing_tier": "standard",
        "specialties": ["quick responses", "general chat", "basic coding"]
    },
    {
        "id": "llama3-8b",
        "name": "Llama 3 8B",
        "description": "Open-source model for privacy-focused deployments",
        "provider": "ollama",
        "capabilities": ["chat", "analysis", "code", "reasoning"],
        "context_length": 8192,
        "is_available": True,
        "is_default": True,
        "pricing_tier": "free",
        "specialties": ["privacy", "local deployment", "general purpose"]
    },
    {
        "id": "claude-3-sonnet",
        "name": "Claude 3 Sonnet",
        "description": "Anthropic's balanced model for analysis and conversation",
        "provider": "anthropic",
        "capabilities": ["chat", "analysis", "code", "reasoning"],
        "context_length": 200000,
        "is_available": False,  # Future integration
        "is_default": False,
        "pricing_tier": "premium",
        "specialties": ["safety", "nuanced reasoning", "long context"]
    }
]

def get_model_availability() -> Dict[str, bool]:
    """Check which models are actually available based on configuration"""
    availability = {}
    provider = settings.LLM_PROVIDER.lower()
    
    # Check provider-specific availability
    if provider in ['openai', 'azure']:
        azure_available = bool(
            hasattr(settings, 'AZURE_OPENAI_ENDPOINT') and settings.AZURE_OPENAI_ENDPOINT and
            hasattr(settings, 'AZURE_OPENAI_API_KEY') and settings.AZURE_OPENAI_API_KEY
        )
        # For direct OpenAI, also check for the API key
        openai_available = bool(
            provider == 'openai' and 
            hasattr(settings, 'OPENAI_API_KEY') and 
            settings.OPENAI_API_KEY
        )
        azure_available = azure_available or openai_available
    
    # Check Ollama availability if it's the selected provider
    ollama_available = False
    if provider == 'ollama':
        ollama_available = bool(
            hasattr(settings, 'OLLAMA_BASE_URL') and settings.OLLAMA_BASE_URL
        )
    
    # Check Anthropic availability if it's the selected provider
    anthropic_available = False
    if provider == 'anthropic':
        anthropic_available = bool(
            hasattr(settings, 'ANTHROPIC_API_KEY') and settings.ANTHROPIC_API_KEY
        )
    
    # Map provider names to their availability
    provider_availability = {
        'azure': azure_available,
        'openai': azure_available,  # Same as azure for this check
        'ollama': ollama_available,
        'anthropic': anthropic_available
    }
    
    # Only check models for the current provider
    target_provider = 'azure' if provider == 'openai' else provider
    
    for model in AVAILABLE_MODELS:
        model_id = model["id"]
        model_provider = model["provider"]
        
        # Only include models from the current provider
        if model_provider == target_provider:
            availability[model_id] = provider_availability.get(model_provider, False)
    
    return availability

@router.get("/", response_model=ModelsResponse)
async def list_models() -> ModelsResponse:
    """
    Get list of available AI models with their capabilities.
    
    Returns comprehensive information about each model including:
    - Capabilities and specialties
    - Context length and pricing
    - Availability status
    - Provider information
    """
    try:
        # Get real-time availability
        availability = get_model_availability()
        
        # Update model availability
        models = []
        default_model = None
        
        for model_config in AVAILABLE_MODELS:
            # Create a copy of the config and update availability
            model_data = model_config.copy()
            model_data["is_available"] = availability.get(model_config["id"], False)
            
            model_info = ModelInfo(**model_data)
            models.append(model_info)
            
            # Set default model
            if model_config["is_default"] and model_info.is_available:
                default_model = model_config["id"]
        
        # If no default is available, use the first available model
        if not default_model:
            available_models = [m for m in models if m.is_available]
            if available_models:
                default_model = available_models[0].id
            else:
                default_model = "gpt-4"  # Fallback
        
        return ModelsResponse(
            models=models,
            default_model=default_model,
            total_count=len(models)
        )
        
    except Exception as e:
        logger.error(f"Error fetching models: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch available models: {str(e)}"
        )

@router.get("/{model_id}")
async def get_model_details(model_id: str) -> ModelInfo:
    """
    Get detailed information about a specific model.
    
    Args:
        model_id: The unique identifier of the model
        
    Returns:
        Detailed model information including capabilities and availability
    """
    try:
        # Find the model in our configuration
        model_config = next(
            (model for model in AVAILABLE_MODELS if model["id"] == model_id),
            None
        )
        
        if not model_config:
            raise HTTPException(
                status_code=404,
                detail=f"Model '{model_id}' not found"
            )
        
        # Check availability
        availability = get_model_availability()
        is_available = availability.get(model_id, False)
        
        # Create a copy and update availability
        model_data = model_config.copy()
        model_data["is_available"] = is_available
        
        return ModelInfo(**model_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching model {model_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch model details: {str(e)}"
        )

@router.get("/health/check")
async def models_health_check():
    """
    Health check for the models service.
    
    Returns the status of model providers and available models count.
    """
    try:
        availability = get_model_availability()
        available_count = sum(1 for available in availability.values() if available)
        
        return {
            "status": "healthy",
            "total_models": len(AVAILABLE_MODELS),
            "available_models": available_count,
            "providers": {
                "azure": bool(
                    hasattr(settings, 'AZURE_OPENAI_ENDPOINT') and settings.AZURE_OPENAI_ENDPOINT and
                    hasattr(settings, 'AZURE_OPENAI_API_KEY') and settings.AZURE_OPENAI_API_KEY
                ),
                "ollama": bool(hasattr(settings, 'OLLAMA_BASE_URL') and settings.OLLAMA_BASE_URL),
                "coretex": bool(
                    hasattr(settings, 'coretex_api_url') and settings.coretex_api_url and
                    hasattr(settings, 'coretex_api_key') and settings.coretex_api_key
                )
            },
            "current_provider": getattr(settings, 'LLM_PROVIDER', 'azure'),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Models health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
