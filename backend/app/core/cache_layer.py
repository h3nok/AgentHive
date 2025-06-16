"""
Multi-layer caching strategy for enhanced performance.

This module implements a sophisticated caching system with multiple layers:
1. Memory cache (L1) - Fastest access, limited size
2. Redis cache (L2) - Shared across instances, persistent
3. Database cache (L3) - Fallback with TTL
"""

import asyncio
import json
import time
import logging
from typing import Any, Dict, Optional, Union, List, Callable, TypeVar
from dataclasses import dataclass, field
from enum import Enum
import hashlib
from collections import OrderedDict
import redis.asyncio as redis
from app.core.settings import settings

logger = logging.getLogger(__name__)

T = TypeVar('T')

class CacheLevel(Enum):
    """Cache level enumeration."""
    MEMORY = "memory"
    REDIS = "redis"
    DATABASE = "database"

@dataclass
class CacheEntry:
    """Cache entry with metadata."""
    value: Any
    timestamp: float
    ttl: float
    access_count: int = 0
    last_access: float = field(default_factory=time.time)
    size_bytes: int = 0
    
    @property
    def is_expired(self) -> bool:
        """Check if entry is expired."""
        return time.time() - self.timestamp > self.ttl
    
    @property
    def age_seconds(self) -> float:
        """Get entry age in seconds."""
        return time.time() - self.timestamp

@dataclass
class CacheStats:
    """Cache statistics."""
    hits: int = 0
    misses: int = 0
    evictions: int = 0
    size: int = 0
    memory_usage_bytes: int = 0
    
    @property
    def hit_rate(self) -> float:
        """Calculate hit rate percentage."""
        total = self.hits + self.misses
        return (self.hits / total * 100) if total > 0 else 0.0

class MemoryCache:
    """L1 Memory cache with LRU eviction."""
    
    def __init__(self, max_size: int = 1000, max_memory_mb: int = 100):
        self.max_size = max_size
        self.max_memory_bytes = max_memory_mb * 1024 * 1024
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self.stats = CacheStats()
        self._lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from memory cache."""
        async with self._lock:
            if key not in self.cache:
                self.stats.misses += 1
                return None
            
            entry = self.cache[key]
            if entry.is_expired:
                del self.cache[key]
                self.stats.misses += 1
                self.stats.evictions += 1
                return None
            
            # Move to end (most recently used)
            self.cache.move_to_end(key)
            entry.access_count += 1
            entry.last_access = time.time()
            self.stats.hits += 1
            
            return entry.value
    
    async def set(self, key: str, value: Any, ttl: float = 3600) -> bool:
        """Set value in memory cache."""
        async with self._lock:
            # Calculate size
            try:
                size_bytes = len(json.dumps(value, default=str).encode('utf-8'))
            except (TypeError, ValueError):
                size_bytes = 1024  # Fallback estimate
            
            # Check memory limits
            if size_bytes > self.max_memory_bytes:
                logger.warning(f"Cache entry too large: {size_bytes} bytes")
                return False
            
            # Evict if necessary
            await self._evict_if_needed(size_bytes)
            
            entry = CacheEntry(
                value=value,
                timestamp=time.time(),
                ttl=ttl,
                size_bytes=size_bytes
            )
            
            self.cache[key] = entry
            self.cache.move_to_end(key)
            self.stats.size += 1
            self.stats.memory_usage_bytes += size_bytes
            
            return True
    
    async def delete(self, key: str) -> bool:
        """Delete key from memory cache."""
        async with self._lock:
            if key in self.cache:
                entry = self.cache[key]
                del self.cache[key]
                self.stats.size -= 1
                self.stats.memory_usage_bytes -= entry.size_bytes
                return True
            return False
    
    async def clear(self) -> None:
        """Clear all cache entries."""
        async with self._lock:
            self.cache.clear()
            self.stats = CacheStats()
    
    async def _evict_if_needed(self, new_size: int) -> None:
        """Evict entries if cache limits exceeded."""
        # Size-based eviction
        while len(self.cache) >= self.max_size:
            oldest_key = next(iter(self.cache))
            entry = self.cache[oldest_key]
            del self.cache[oldest_key]
            self.stats.evictions += 1
            self.stats.size -= 1
            self.stats.memory_usage_bytes -= entry.size_bytes
        
        # Memory-based eviction
        while (self.stats.memory_usage_bytes + new_size) > self.max_memory_bytes and self.cache:
            oldest_key = next(iter(self.cache))
            entry = self.cache[oldest_key]
            del self.cache[oldest_key]
            self.stats.evictions += 1
            self.stats.size -= 1
            self.stats.memory_usage_bytes -= entry.size_bytes

class RedisCache:
    """L2 Redis cache for shared access."""
    
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or settings.REDIS_URL
        self.redis_client: Optional[redis.Redis] = None
        self.stats = CacheStats()
        self._connection_lock = asyncio.Lock()
    
    async def connect(self) -> None:
        """Connect to Redis."""
        if not self.redis_client:
            async with self._connection_lock:
                if not self.redis_client:
                    self.redis_client = redis.from_url(self.redis_url)
                    await self.redis_client.ping()
                    logger.info("Connected to Redis cache")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache."""
        await self.connect()
        try:
            data = await self.redis_client.get(f"cache:{key}")
            if data:
                entry_data = json.loads(data)
                entry = CacheEntry(
                    value=entry_data['value'],
                    timestamp=entry_data['timestamp'],
                    ttl=entry_data['ttl'],
                    access_count=entry_data.get('access_count', 0),
                    last_access=entry_data.get('last_access', time.time()),
                    size_bytes=entry_data.get('size_bytes', 0)
                )
                
                if entry.is_expired:
                    await self.delete(key)
                    self.stats.misses += 1
                    return None
                
                # Update access stats
                entry.access_count += 1
                entry.last_access = time.time()
                await self._update_entry_stats(key, entry)
                
                self.stats.hits += 1
                return entry.value
            else:
                self.stats.misses += 1
                return None
                
        except Exception as e:
            logger.error(f"Redis cache get error: {e}")
            self.stats.misses += 1
            return None
    
    async def set(self, key: str, value: Any, ttl: float = 3600) -> bool:
        """Set value in Redis cache."""
        await self.connect()
        try:
            entry = CacheEntry(
                value=value,
                timestamp=time.time(),
                ttl=ttl,
                size_bytes=len(json.dumps(value, default=str).encode('utf-8'))
            )
            
            entry_data = {
                'value': value,
                'timestamp': entry.timestamp,
                'ttl': entry.ttl,
                'access_count': entry.access_count,
                'last_access': entry.last_access,
                'size_bytes': entry.size_bytes
            }
            
            # Set with Redis TTL as backup
            redis_ttl = int(ttl * 1.1)  # Add 10% buffer
            await self.redis_client.setex(
                f"cache:{key}",
                redis_ttl,
                json.dumps(entry_data, default=str)
            )
            
            self.stats.size += 1
            return True
            
        except Exception as e:
            logger.error(f"Redis cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from Redis cache."""
        await self.connect()
        try:
            result = await self.redis_client.delete(f"cache:{key}")
            if result > 0:
                self.stats.size = max(0, self.stats.size - 1)
            return result > 0
        except Exception as e:
            logger.error(f"Redis cache delete error: {e}")
            return False
    
    async def clear(self) -> None:
        """Clear all cache entries."""
        await self.connect()
        try:
            keys = await self.redis_client.keys("cache:*")
            if keys:
                await self.redis_client.delete(*keys)
            self.stats = CacheStats()
        except Exception as e:
            logger.error(f"Redis cache clear error: {e}")
    
    async def _update_entry_stats(self, key: str, entry: CacheEntry) -> None:
        """Update entry access statistics."""
        try:
            entry_data = {
                'value': entry.value,
                'timestamp': entry.timestamp,
                'ttl': entry.ttl,
                'access_count': entry.access_count,
                'last_access': entry.last_access,
                'size_bytes': entry.size_bytes
            }
            
            # Get remaining TTL from Redis
            redis_ttl = await self.redis_client.ttl(f"cache:{key}")
            if redis_ttl > 0:
                await self.redis_client.setex(
                    f"cache:{key}",
                    redis_ttl,
                    json.dumps(entry_data, default=str)
                )
        except Exception as e:
            logger.error(f"Error updating entry stats: {e}")
    
    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.close()

class MultiLayerCache:
    """Multi-layer cache system with L1 (Memory) and L2 (Redis) layers."""
    
    def __init__(
        self,
        memory_max_size: int = 1000,
        memory_max_mb: int = 100,
        redis_url: str = None,
        default_ttl: float = 3600
    ):
        self.memory_cache = MemoryCache(memory_max_size, memory_max_mb)
        self.redis_cache = RedisCache(redis_url)
        self.default_ttl = default_ttl
        self.global_stats = CacheStats()
    
    def _generate_key(self, key: str, namespace: str = "default") -> str:
        """Generate cache key with namespace."""
        return f"{namespace}:{hashlib.md5(key.encode()).hexdigest()}"
    
    async def get(self, key: str, namespace: str = "default") -> Optional[Any]:
        """Get value from cache (L1 → L2 → None)."""
        cache_key = self._generate_key(key, namespace)
        
        # Try L1 (Memory) first
        value = await self.memory_cache.get(cache_key)
        if value is not None:
            self.global_stats.hits += 1
            logger.debug(f"Cache hit (L1): {cache_key}")
            return value
        
        # Try L2 (Redis)
        value = await self.redis_cache.get(cache_key)
        if value is not None:
            # Populate L1 cache
            await self.memory_cache.set(cache_key, value, self.default_ttl)
            self.global_stats.hits += 1
            logger.debug(f"Cache hit (L2): {cache_key}")
            return value
        
        self.global_stats.misses += 1
        logger.debug(f"Cache miss: {cache_key}")
        return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: float = None,
        namespace: str = "default",
        levels: List[CacheLevel] = None
    ) -> bool:
        """Set value in cache layers."""
        cache_key = self._generate_key(key, namespace)
        ttl = ttl or self.default_ttl
        levels = levels or [CacheLevel.MEMORY, CacheLevel.REDIS]
        
        success = True
        
        # Set in specified levels
        if CacheLevel.MEMORY in levels:
            success &= await self.memory_cache.set(cache_key, value, ttl)
        
        if CacheLevel.REDIS in levels:
            success &= await self.redis_cache.set(cache_key, value, ttl)
        
        if success:
            logger.debug(f"Cache set: {cache_key} (levels: {[l.value for l in levels]})")
        
        return success
    
    async def delete(self, key: str, namespace: str = "default") -> bool:
        """Delete key from all cache layers."""
        cache_key = self._generate_key(key, namespace)
        
        memory_result = await self.memory_cache.delete(cache_key)
        redis_result = await self.redis_cache.delete(cache_key)
        
        return memory_result or redis_result
    
    async def clear(self, namespace: str = None) -> None:
        """Clear cache entries."""
        if namespace is None:
            # Clear all
            await self.memory_cache.clear()
            await self.redis_cache.clear()
        else:
            # Clear specific namespace (Redis only supports pattern deletion)
            try:
                await self.redis_cache.connect()
                keys = await self.redis_cache.redis_client.keys(f"cache:{namespace}:*")
                if keys:
                    await self.redis_cache.redis_client.delete(*keys)
            except Exception as e:
                logger.error(f"Error clearing namespace {namespace}: {e}")
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics."""
        return {
            "global": {
                "hits": self.global_stats.hits,
                "misses": self.global_stats.misses,
                "hit_rate": self.global_stats.hit_rate
            },
            "memory": {
                "hits": self.memory_cache.stats.hits,
                "misses": self.memory_cache.stats.misses,
                "hit_rate": self.memory_cache.stats.hit_rate,
                "size": self.memory_cache.stats.size,
                "memory_usage_mb": self.memory_cache.stats.memory_usage_bytes / 1024 / 1024,
                "evictions": self.memory_cache.stats.evictions
            },
            "redis": {
                "hits": self.redis_cache.stats.hits,
                "misses": self.redis_cache.stats.misses,
                "hit_rate": self.redis_cache.stats.hit_rate,
                "size": self.redis_cache.stats.size
            }
        }
    
    async def close(self) -> None:
        """Close all cache connections."""
        await self.redis_cache.close()

# Cache decorators
def cached(
    ttl: float = 3600,
    namespace: str = "default",
    key_func: Optional[Callable] = None,
    levels: List[CacheLevel] = None
):
    """Decorator for caching function results."""
    def decorator(func: Callable) -> Callable:
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                cache_key = f"{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Try to get from cache
            cached_result = await cache_manager.get(cache_key, namespace)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            await cache_manager.set(cache_key, result, ttl, namespace, levels)
            
            return result
        return wrapper
    return decorator

# Global cache manager instance
cache_manager = MultiLayerCache(
    memory_max_size=getattr(settings, 'cache_memory_max_size', 1000),
    memory_max_mb=getattr(settings, 'cache_memory_max_mb', 100),
    redis_url=getattr(settings, 'REDIS_URL', None),
    default_ttl=getattr(settings, 'cache_default_ttl', 3600)
)
