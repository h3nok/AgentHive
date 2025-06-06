#!/usr/bin/env python3
"""Test settings loading with debug info."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Manually load .env for testing
env_path = Path("/Users/henokghebrechristos/Repo/TSC/chattsc/backend/.env")
print(f"Loading .env from: {env_path}")
print(f"File exists: {env_path.exists()}")

result = load_dotenv(env_path, verbose=True)
print(f"Load result: {result}")

print(f"REDIS_URL from os.getenv: {repr(os.getenv('REDIS_URL'))}")

# Test settings
print("\n--- Testing Settings ---")
from app.core.settings import Settings

# Test with explicit env file
settings = Settings(_env_file=str(env_path))
print(f"Settings redis_url: {settings.redis_url}")
print(f"Settings redis_host: {settings.redis_host}")
print(f"Settings redis_port: {settings.redis_port}")
