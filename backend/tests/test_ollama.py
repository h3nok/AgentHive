"""
Test script for Ollama integration.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.adapters.llm_ollama import OllamaAdapter
from app.core.settings import settings


async def test_ollama_completion():
    """Test basic completion with Ollama."""
    adapter = OllamaAdapter()
    
    try:
        response = await adapter.complete(
            prompt="What is the capital of France?",
            temperature=0.7
        )
        print("\nCompletion Response:")
        print(f"Content: {response.content}")
        print(f"Model: {response.model}")
        print(f"Usage: {response.usage}")
        print(f"Metadata: {response.metadata}")
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        await adapter.close()


async def test_ollama_streaming():
    """Test streaming completion with Ollama."""
    adapter = OllamaAdapter()
    
    try:
        print("\nStreaming Response:")
        async for chunk in adapter.stream(
            prompt="Write a short poem about AI.",
            temperature=0.7
        ):
            print(chunk.content, end="", flush=True)
        print("\n")
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        await adapter.close()


async def main():
    """Run all tests."""
    print("Testing Ollama Integration")
    print("=" * 50)
    
    print("\n1. Testing Basic Completion")
    print("-" * 30)
    await test_ollama_completion()
    
    print("\n2. Testing Streaming")
    print("-" * 30)
    await test_ollama_streaming()


if __name__ == "__main__":
    asyncio.run(main()) 