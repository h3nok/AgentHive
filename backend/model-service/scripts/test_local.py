#!/usr/bin/env python3
"""
Local testing script for the model service.

This script provides a simple way to test the model service locally
without having to use curl or another HTTP client.
"""
import asyncio
import json
import httpx
import argparse
from typing import Dict, Any, Optional

# Default configuration
DEFAULT_BASE_URL = "http://localhost:8001"
DEFAULT_MODEL = "llama3"

async def test_completion(
    base_url: str,
    prompt: str,
    model: str,
    temperature: float = 0.7,
    max_tokens: int = 100,
    stream: bool = False,
    api_key: Optional[str] = None
) -> None:
    """Test the completion endpoint."""
    url = f"{base_url}/api/v1/completions"
    headers = {"Content-Type": "application/json"}
    
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    data = {
        "prompt": prompt,
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": stream
    }
    
    print(f"\n{'='*50}")
    print(f"Testing completion endpoint: {url}")
    print(f"Prompt: {prompt}")
    print(f"Model: {model}")
    print(f"Stream: {stream}")
    print("-" * 50)
    
    async with httpx.AsyncClient() as client:
        try:
            if stream:
                # Handle streaming response
                print("Response (streaming):")
                async with client.stream(
                    "POST",
                    url,
                    headers=headers,
                    json=data,
                    timeout=60.0
                ) as response:
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            chunk = line[6:]  # Remove 'data: ' prefix
                            if chunk == "[DONE]":
                                break
                            try:
                                data = json.loads(chunk)
                                content = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if content:
                                    print(content, end="", flush=True)
                            except json.JSONDecodeError:
                                print(f"\nError decoding chunk: {chunk}")
                print("\n")
            else:
                # Handle non-streaming response
                response = await client.post(
                    url,
                    headers=headers,
                    json=data,
                    timeout=60.0
                )
                response.raise_for_status()
                
                result = response.json()
                print("Response:")
                print(json.dumps(result, indent=2))
                
        except httpx.HTTPStatusError as e:
            print(f"\nError: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            print(f"\nError: {str(e)}")

async def test_models(base_url: str, api_key: Optional[str] = None) -> None:
    """Test the models endpoint."""
    url = f"{base_url}/api/v1/models"
    headers = {}
    
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    print(f"\n{'='*50}")
    print(f"Testing models endpoint: {url}")
    print("-" * 50)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            response.raise_for_status()
            
            models = response.json()
            print("Available models:")
            for model in models.get("data", []):
                print(f"- {model.get('id')} (owned by {model.get('owned_by', 'unknown')})")
                
        except Exception as e:
            print(f"Error: {str(e)}")

async def main() -> None:
    """Main function."""
    parser = argparse.ArgumentParser(description="Test the Model Service API")
    
    # Global arguments
    parser.add_argument(
        "--base-url",
        type=str,
        default=DEFAULT_BASE_URL,
        help=f"Base URL of the model service (default: {DEFAULT_BASE_URL})"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="API key for authentication (if required)"
    )
    
    # Subcommands
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    # Completion command
    completion_parser = subparsers.add_parser("completion", help="Test completion endpoint")
    completion_parser.add_argument(
        "--prompt",
        type=str,
        required=True,
        help="Prompt to send to the model"
    )
    completion_parser.add_argument(
        "--model",
        type=str,
        default=DEFAULT_MODEL,
        help=f"Model to use (default: {DEFAULT_MODEL})"
    )
    completion_parser.add_argument(
        "--temperature",
        type=float,
        default=0.7,
        help="Sampling temperature (default: 0.7)"
    )
    completion_parser.add_argument(
        "--max-tokens",
        type=int,
        default=100,
        help="Maximum number of tokens to generate (default: 100)"
    )
    completion_parser.add_argument(
        "--stream",
        action="store_true",
        help="Stream the response"
    )
    
    # Models command
    models_parser = subparsers.add_parser("models", help="List available models")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Run the appropriate test
    if args.command == "completion":
        await test_completion(
            base_url=args.base_url,
            prompt=args.prompt,
            model=args.model,
            temperature=args.temperature,
            max_tokens=args.max_tokens,
            stream=args.stream,
            api_key=args.api_key
        )
    elif args.command == "models":
        await test_models(
            base_url=args.base_url,
            api_key=args.api_key
        )

if __name__ == "__main__":
    asyncio.run(main())
