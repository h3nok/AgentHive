#!/usr/bin/env python3
"""Debug Redis configuration."""

import os
from app.core.settings import settings

print("Environment variables:")
print(f"REDIS_URL={os.getenv('REDIS_URL')}")
print(f"REDIS_HOST={os.getenv('REDIS_HOST')}")
print(f"REDIS_PORT={os.getenv('REDIS_PORT')}")
print(f"REDIS_DB={os.getenv('REDIS_DB')}")
print(f"REDIS_PASSWORD={os.getenv('REDIS_PASSWORD')}")

print("\nSettings values:")
print(f"settings.redis_url={settings.redis_url}")
print(f"settings.redis_host={settings.redis_host}")
print(f"settings.redis_port={settings.redis_port}")
print(f"settings.redis_db={settings.redis_db}")
print(f"settings.redis_password={settings.redis_password}")

print(f"\nType of settings.redis_url: {type(settings.redis_url)}")
print(f"String representation: '{str(settings.redis_url)}'")
