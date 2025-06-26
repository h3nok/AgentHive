#!/usr/bin/env python3
"""
Script to initialize Ollama models.

This script ensures that the required Ollama models are pulled and available
before the model service starts up.
"""
import asyncio
import os
import sys
import httpx
from typing import List, Optional

# Default configuration
DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODELS = ["llama3"]

class ModelInitializer:
    """Helper class to initialize Ollama models."""
    
    def __init__(self, base_url: str = DEFAULT_OLLAMA_BASE_URL):
        """Initialize the model initializer."""
        self.base_url = base_url.rstrip("/")
        self.client = httpx.AsyncClient(base_url=base_url)
    
    async def check_model_exists(self, model_name: str) -> bool:
        """Check if a model exists locally."""
        try:
            response = await self.client.get(f"/api/tags")
            response.raise_for_status()
            models = response.json().get("models", [])
            return any(m.get("name") == model_name for m in models)
        except Exception as e:
            print(f"Error checking if model exists: {e}")
            return False
    
    async def pull_model(self, model_name: str) -> bool:
        """Pull a model from the Ollama registry."""
        print(f"Pulling model: {model_name}")
        try:
            async with self.client.stream(
                "POST",
                "/api/pull",
                json={"name": model_name, "stream": True}
            ) as response:
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            data = response.json()
                            if "status" in data:
                                print(f"  {data['status']}")
                        except:
                            pass
            return True
        except Exception as e:
            print(f"Error pulling model {model_name}: {e}")
            return False
    
    async def ensure_models(self, model_names: List[str]) -> None:
        """Ensure that the specified models are available."""
        print("Checking for required models...")
        
        for model in model_names:
            print(f"\nChecking model: {model}")
            if await self.check_model_exists(model):
                print(f"  ✓ {model} already exists")
            else:
                print(f"  - {model} not found, pulling...")
                success = await self.pull_model(model)
                if success:
                    print(f"  ✓ Successfully pulled {model}")
                else:
                    print(f"  ✗ Failed to pull {model}")
    
    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()

async def main():
    """Main function."""
    # Get configuration from environment variables
    ollama_url = os.getenv("OLLAMA_BASE_URL", DEFAULT_OLLAMA_BASE_URL)
    models_str = os.getenv("REQUIRED_MODELS", "")
    models = models_str.split(",") if models_str else DEFAULT_MODELS
    
    # Filter out empty strings
    models = [m.strip() for m in models if m.strip()]
    
    if not models:
        print("No models specified. Set the REQUIRED_MODELS environment variable.")
        sys.exit(1)
    
    print(f"Initializing models at {ollama_url}")
    print(f"Required models: {', '.join(models)}\n")
    
    # Initialize the model initializer
    initializer = ModelInitializer(base_url=ollama_url)
    
    try:
        # Ensure all required models are available
        await initializer.ensure_models(models)
        print("\nModel initialization complete!")
    except Exception as e:
        print(f"\nError initializing models: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        # Clean up
        await initializer.close()

if __name__ == "__main__":
    asyncio.run(main())
