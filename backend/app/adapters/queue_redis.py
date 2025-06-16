"""
Redis adapter for queue and pub/sub operations.

This module provides integration with Redis for caching, queuing, and pub/sub.
"""

from typing import Any, Dict, List, Optional, AsyncIterator
import json
import asyncio
from redis import asyncio as aioredis
from redis.exceptions import RedisError

from ..core.settings import settings
from ..core.observability import get_logger, with_tracing

logger = get_logger(__name__)


class RedisAdapter:
    """Adapter for Redis operations."""
    
    def __init__(self, redis_url: Optional[str] = None):
        """Initialize Redis adapter."""
        if redis_url:
            self.redis_url = redis_url
        elif settings.REDIS_URL:
            self.redis_url = str(settings.REDIS_URL)
        else:
            # Construct Redis URL from individual settings
            password_part = f":{settings.REDIS_PASSWORD}@" if settings.REDIS_PASSWORD else ""
            self.redis_url = f"redis://{password_part}{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
        
        self.redis: Optional[aioredis.Redis] = None
        self.pubsub: Optional[aioredis.client.PubSub] = None
        self._connected = False
    
    async def connect(self) -> None:
        """Connect to Redis."""
        if self._connected:
            return
        
        try:
            self.redis = await aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            
            # Test connection
            await self.redis.ping()
            
            self._connected = True
            logger.info("Connected to Redis")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            raise
    
    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self.pubsub:
            await self.pubsub.close()
            self.pubsub = None
        
        if self.redis:
            await self.redis.close()
            self.redis = None
        
        self._connected = False
        logger.info("Disconnected from Redis")
    
    async def ensure_connected(self) -> None:
        """Ensure Redis is connected."""
        if not self._connected:
            await self.connect()
    
    @with_tracing("redis_get")
    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis."""
        await self.ensure_connected()
        
        try:
            value = await self.redis.get(key)
            return value
        except RedisError as e:
            logger.error(f"Redis GET error: {str(e)}")
            return None
    
    @with_tracing("redis_set")
    async def set(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None
    ) -> bool:
        """Set value in Redis."""
        await self.ensure_connected()
        
        try:
            # Convert to JSON if not string
            if not isinstance(value, str):
                value = json.dumps(value)
            
            result = await self.redis.set(key, value, ex=expire)
            return bool(result)
        except RedisError as e:
            logger.error(f"Redis SET error: {str(e)}")
            return False
    
    @with_tracing("redis_delete")
    async def delete(self, *keys: str) -> int:
        """Delete keys from Redis."""
        await self.ensure_connected()
        
        try:
            return await self.redis.delete(*keys)
        except RedisError as e:
            logger.error(f"Redis DELETE error: {str(e)}")
            return 0
    
    @with_tracing("redis_exists")
    async def exists(self, *keys: str) -> int:
        """Check if keys exist."""
        await self.ensure_connected()
        
        try:
            return await self.redis.exists(*keys)
        except RedisError as e:
            logger.error(f"Redis EXISTS error: {str(e)}")
            return 0
    
    @with_tracing("redis_expire")
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on key."""
        await self.ensure_connected()
        
        try:
            return await self.redis.expire(key, seconds)
        except RedisError as e:
            logger.error(f"Redis EXPIRE error: {str(e)}")
            return False
    
    # Hash operations
    async def hget(self, name: str, key: str) -> Optional[str]:
        """Get value from hash."""
        await self.ensure_connected()
        
        try:
            return await self.redis.hget(name, key)
        except RedisError as e:
            logger.error(f"Redis HGET error: {str(e)}")
            return None
    
    async def hset(self, name: str, key: Optional[str] = None, value: Any = None, mapping: Optional[Dict[str, Any]] = None) -> int:
        """Set value(s) in hash."""
        await self.ensure_connected()
        
        try:
            if mapping:
                # Convert mapping values to strings
                str_mapping = {}
                for k, v in mapping.items():
                    if not isinstance(v, str):
                        v = json.dumps(v) if not isinstance(v, (int, float, bool)) else str(v)
                    str_mapping[k] = v
                return await self.redis.hset(name, mapping=str_mapping)
            elif key is not None and value is not None:
                # Single key-value pair
                if not isinstance(value, str):
                    value = json.dumps(value)
                return await self.redis.hset(name, key, value)
            else:
                raise ValueError("Either provide key/value pair or mapping")
        except RedisError as e:
            logger.error(f"Redis HSET error: {str(e)}")
            return 0
    
    async def hgetall(self, name: str) -> Dict[str, str]:
        """Get all values from hash."""
        await self.ensure_connected()
        
        try:
            return await self.redis.hgetall(name)
        except RedisError as e:
            logger.error(f"Redis HGETALL error: {str(e)}")
            return {}
    
    # List operations
    async def lpush(self, key: str, *values: Any) -> int:
        """Push values to left of list."""
        await self.ensure_connected()
        
        try:
            # Convert values to strings
            str_values = [
                v if isinstance(v, str) else json.dumps(v)
                for v in values
            ]
            return await self.redis.lpush(key, *str_values)
        except RedisError as e:
            logger.error(f"Redis LPUSH error: {str(e)}")
            return 0
    
    async def rpop(self, key: str) -> Optional[str]:
        """Pop value from right of list."""
        await self.ensure_connected()
        
        try:
            return await self.redis.rpop(key)
        except RedisError as e:
            logger.error(f"Redis RPOP error: {str(e)}")
            return None
    
    async def lrange(self, key: str, start: int, stop: int) -> List[str]:
        """Get range of values from list."""
        await self.ensure_connected()
        
        try:
            return await self.redis.lrange(key, start, stop)
        except RedisError as e:
            logger.error(f"Redis LRANGE error: {str(e)}")
            return []
    
    # Pub/Sub operations
    async def publish(self, channel: str, message: Any) -> int:
        """Publish message to channel."""
        await self.ensure_connected()
        
        try:
            if not isinstance(message, str):
                message = json.dumps(message)
            return await self.redis.publish(channel, message)
        except RedisError as e:
            logger.error(f"Redis PUBLISH error: {str(e)}")
            return 0
    
    async def subscribe(self, *channels: str) -> AsyncIterator[Dict[str, Any]]:
        """Subscribe to channels and yield messages."""
        await self.ensure_connected()
        
        if not self.pubsub:
            self.pubsub = self.redis.pubsub()
        
        try:
            await self.pubsub.subscribe(*channels)
            
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    yield message
                    
        except RedisError as e:
            logger.error(f"Redis SUBSCRIBE error: {str(e)}")
        finally:
            if self.pubsub:
                await self.pubsub.unsubscribe(*channels)
    
    async def subscribe_pattern(self, patterns: List[str]) -> AsyncIterator[Dict[str, Any]]:
        """Subscribe to patterns and yield messages."""
        await self.ensure_connected()
        
        if not self.pubsub:
            self.pubsub = self.redis.pubsub()
        
        try:
            for pattern in patterns:
                await self.pubsub.psubscribe(pattern)
            
            async for message in self.pubsub.listen():
                if message["type"] == "pmessage":
                    yield message
                    
        except RedisError as e:
            logger.error(f"Redis PSUBSCRIBE error: {str(e)}")
        finally:
            if self.pubsub:
                for pattern in patterns:
                    await self.pubsub.punsubscribe(pattern)
    
    # Atomic operations
    async def incr(self, key: str) -> int:
        """Increment value."""
        await self.ensure_connected()
        
        try:
            return await self.redis.incr(key)
        except RedisError as e:
            logger.error(f"Redis INCR error: {str(e)}")
            return 0
    
    async def decr(self, key: str) -> int:
        """Decrement value."""
        await self.ensure_connected()
        
        try:
            return await self.redis.decr(key)
        except RedisError as e:
            logger.error(f"Redis DECR error: {str(e)}")
            return 0
    
    # Set operations
    async def sadd(self, key: str, *members: Any) -> int:
        """Add members to set."""
        await self.ensure_connected()
        
        try:
            str_members = [
                m if isinstance(m, str) else json.dumps(m)
                for m in members
            ]
            return await self.redis.sadd(key, *str_members)
        except RedisError as e:
            logger.error(f"Redis SADD error: {str(e)}")
            return 0
    
    async def srem(self, key: str, *members: Any) -> int:
        """Remove members from set."""
        await self.ensure_connected()
        
        try:
            str_members = [
                m if isinstance(m, str) else json.dumps(m)
                for m in members
            ]
            return await self.redis.srem(key, *str_members)
        except RedisError as e:
            logger.error(f"Redis SREM error: {str(e)}")
            return 0
    
    async def smembers(self, key: str) -> set:
        """Get all members of set."""
        await self.ensure_connected()
        
        try:
            return await self.redis.smembers(key)
        except RedisError as e:
            logger.error(f"Redis SMEMBERS error: {str(e)}")
            return set()
    
    async def sismember(self, key: str, member: Any) -> bool:
        """Check if member is in set."""
        await self.ensure_connected()
        
        try:
            if not isinstance(member, str):
                member = json.dumps(member)
            return await self.redis.sismember(key, member)
        except RedisError as e:
            logger.error(f"Redis SISMEMBER error: {str(e)}")
            return False
    
    # Utility methods
    async def health_check(self) -> bool:
        """Check Redis health."""
        try:
            await self.ensure_connected()
            return await self.redis.ping()
        except Exception:
            return False
    
    async def flush_all(self) -> None:
        """Flush all keys (use with caution)."""
        await self.ensure_connected()
        
        try:
            await self.redis.flushall()
            logger.warning("Flushed all Redis keys")
        except RedisError as e:
            logger.error(f"Redis FLUSHALL error: {str(e)}")


# Global Redis adapter instance
redis_adapter = RedisAdapter() 