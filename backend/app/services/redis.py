"""
Redis adapter.

This module provides Redis adapter for caching and session management.
"""

import json
from typing import Any, Optional

import redis.asyncio as redis
from redis.asyncio import Redis

from app.core.settings import settings


class RedisAdapter:
    """Redis adapter for caching and session management."""

    def __init__(self) -> None:
        """Initialize Redis adapter."""
        self.redis: Optional[Redis] = None

    async def init(self) -> None:
        """Initialize Redis connection."""
        self.redis = await redis.from_url(
            settings.assemble_redis_connection(),
            encoding="utf-8",
            decode_responses=True,
        )

    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis:
            await self.redis.close()

    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis.

        Args:
            key: Redis key

        Returns:
            Optional[str]: Value if found
        """
        if not self.redis:
            raise RuntimeError("Redis not initialized")
        return await self.redis.get(key)

    async def set(
        self, key: str, value: str, expire: Optional[int] = None
    ) -> None:
        """Set value in Redis.

        Args:
            key: Redis key
            value: Value to set
            expire: Expiration time in seconds
        """
        if not self.redis:
            raise RuntimeError("Redis not initialized")
        await self.redis.set(key, value, ex=expire)

    async def delete(self, key: str) -> None:
        """Delete value from Redis.

        Args:
            key: Redis key
        """
        if not self.redis:
            raise RuntimeError("Redis not initialized")
        await self.redis.delete(key)

    async def get_json(self, key: str) -> Optional[Any]:
        """Get JSON value from Redis.

        Args:
            key: Redis key

        Returns:
            Optional[Any]: JSON value if found
        """
        value = await self.get(key)
        if value:
            return json.loads(value)
        return None

    async def set_json(
        self, key: str, value: Any, expire: Optional[int] = None
    ) -> None:
        """Set JSON value in Redis.

        Args:
            key: Redis key
            value: JSON value to set
            expire: Expiration time in seconds
        """
        await self.set(key, json.dumps(value), expire=expire)


# Create global Redis adapter instance
redis_adapter = RedisAdapter() 