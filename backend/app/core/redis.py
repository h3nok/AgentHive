"""
Redis adapter for caching and rate limiting.

This module provides a Redis client for caching and rate limiting functionality.
"""

import json
from typing import Any, Optional, Union
from datetime import datetime, timedelta

import redis
from redis.exceptions import RedisError

from .settings import settings


class RedisAdapter:
    """Redis adapter for caching and rate limiting."""
    
    def __init__(self):
        """Initialize Redis client."""
        self.client = redis.Redis.from_url(
            settings.assemble_redis_connection(),
            decode_responses=True
        )
    
    def get(self, key: str) -> Optional[str]:
        """Get value from Redis.
        
        Args:
            key: Redis key
            
        Returns:
            Optional[str]: Value if exists, None otherwise
        """
        try:
            return self.client.get(key)
        except RedisError:
            return None
    
    def set(
        self,
        key: str,
        value: Union[str, dict],
        expire: Optional[int] = None
    ) -> bool:
        """Set value in Redis.
        
        Args:
            key: Redis key
            value: Value to store
            expire: Expiration time in seconds
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if isinstance(value, dict):
                value = json.dumps(value)
            return self.client.set(key, value, ex=expire)
        except RedisError:
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from Redis.
        
        Args:
            key: Redis key
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            return bool(self.client.delete(key))
        except RedisError:
            return False
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment counter in Redis.
        
        Args:
            key: Redis key
            amount: Amount to increment
            
        Returns:
            Optional[int]: New value if successful, None otherwise
        """
        try:
            return self.client.incr(key, amount)
        except RedisError:
            return None
    
    def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> tuple[bool, Optional[int]]:
        """Check if request is within rate limit.
        
        Args:
            key: Rate limit key
            max_requests: Maximum number of requests allowed
            window_seconds: Time window in seconds
            
        Returns:
            tuple[bool, Optional[int]]: (is_allowed, remaining_requests)
        """
        try:
            # Get current count
            current = self.client.get(key)
            if current is None:
                # First request in window
                self.client.setex(key, window_seconds, 1)
                return True, max_requests - 1
            
            current = int(current)
            if current >= max_requests:
                return False, 0
            
            # Increment counter
            remaining = max_requests - self.increment(key)
            return True, remaining
            
        except RedisError:
            return True, None  # Allow request on error
    
    def cache_response(
        self,
        key: str,
        response: Any,
        expire: Optional[int] = None
    ) -> bool:
        """Cache API response.
        
        Args:
            key: Cache key
            response: Response to cache
            expire: Expiration time in seconds
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            return self.set(key, response, expire)
        except RedisError:
            return False
    
    def get_cached_response(self, key: str) -> Optional[Any]:
        """Get cached API response.
        
        Args:
            key: Cache key
            
        Returns:
            Optional[Any]: Cached response if exists, None otherwise
        """
        try:
            value = self.get(key)
            if value:
                return json.loads(value)
            return None
        except RedisError:
            return None
    
    def clear_cache(self, pattern: str = "*") -> bool:
        """Clear cache entries matching pattern.
        
        Args:
            pattern: Key pattern to match
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            keys = self.client.keys(pattern)
            if keys:
                return bool(self.client.delete(*keys))
            return True
        except RedisError:
            return False


# Create global Redis adapter instance
redis_adapter = RedisAdapter() 