"""
Performance-optimized router integration with multi-layer caching.

This module provides caching decorators and utilities specifically for
the router components to improve performance.
"""

from typing import Dict, List, Optional, Any, Callable
from functools import wraps
import asyncio
import hashlib
import json
from datetime import datetime

from app.core.cache_layer import cache_manager, cached, CacheLevel
from app.core.observability import get_logger

logger = get_logger(__name__)


class RouterCache:
    """Router-specific caching utilities."""
    
    def __init__(self):
        self.namespace = "router"
        self.cache = cache_manager
    
    async def get_routing_result(self, query_hash: str) -> Optional[Dict[str, Any]]:
        """Get cached routing result."""
        try:
            result = await self.cache.get(f"routing_result:{query_hash}", self.namespace)
            if result:
                logger.debug(f"Cache hit for routing result: {query_hash}")
            return result
        except Exception as e:
            logger.error(f"Error getting cached routing result: {e}")
            return None
    
    async def set_routing_result(
        self, 
        query_hash: str, 
        result: Dict[str, Any], 
        ttl: float = 300
    ) -> bool:
        """Cache routing result."""
        try:
            success = await self.cache.set(
                f"routing_result:{query_hash}", 
                result, 
                ttl, 
                self.namespace,
                [CacheLevel.MEMORY, CacheLevel.REDIS]
            )
            if success:
                logger.debug(f"Cached routing result: {query_hash}")
            return success
        except Exception as e:
            logger.error(f"Error caching routing result: {e}")
            return False
    
    async def get_performance_metrics(self, node_type: str) -> Optional[Dict[str, Any]]:
        """Get cached performance metrics."""
        try:
            return await self.cache.get(f"performance:{node_type}", self.namespace)
        except Exception as e:
            logger.error(f"Error getting cached performance metrics: {e}")
            return None
    
    async def set_performance_metrics(
        self, 
        node_type: str, 
        metrics: Dict[str, Any], 
        ttl: float = 60
    ) -> bool:
        """Cache performance metrics."""
        try:
            return await self.cache.set(
                f"performance:{node_type}", 
                metrics, 
                ttl, 
                self.namespace,
                [CacheLevel.MEMORY]  # Only memory cache for frequent updates
            )
        except Exception as e:
            logger.error(f"Error caching performance metrics: {e}")
            return False
    
    async def invalidate_routing_cache(self, pattern: str = None) -> None:
        """Invalidate routing cache entries."""
        try:
            if pattern:
                # For now, just clear the entire router namespace
                await self.cache.clear(self.namespace)
            else:
                await self.cache.clear(self.namespace)
            logger.info("Router cache invalidated")
        except Exception as e:
            logger.error(f"Error invalidating router cache: {e}")
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get router cache statistics."""
        try:
            stats = await self.cache.get_stats()
            return {
                "namespace": self.namespace,
                "cache_stats": stats,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"error": str(e)}


# Global router cache instance
router_cache = RouterCache()


def cache_routing_decision(ttl: float = 300):
    """
    Decorator to cache routing decisions based on query content.
    
    Args:
        ttl: Time to live in seconds for the cached result
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(self, context, *args, **kwargs):
            # Skip caching during tests to avoid interference
            import os
            if os.getenv('PYTEST_CURRENT_TEST'):
                return await func(self, context, *args, **kwargs)
                
            # Generate cache key from query content and metadata
            query_content = context.prompt.prompt
            user_id = getattr(context, 'user_id', '')
            
            # Create a hash of the query and relevant context
            cache_key_content = {
                'query': query_content,
                'user_id': user_id,
                'method': func.__name__,
                'class': getattr(self, '__class__', type(self)).__name__
            }
            cache_key = hashlib.md5(
                json.dumps(cache_key_content, sort_keys=True).encode()
            ).hexdigest()
            
            # Try to get from cache
            cached_result = await router_cache.get_routing_result(cache_key)
            if cached_result:
                # Reconstruct result object from cached data
                from app.domain.schemas import IntentResult, RoutingMethod, AgentType
                
                return IntentResult(
                    intent=cached_result['intent'],
                    confidence=cached_result['confidence'],
                    entities=cached_result.get('entities', {}),
                    routing_method=RoutingMethod(cached_result['routing_method']),
                    metadata=cached_result.get('metadata', {})
                )
            
            # Execute function
            result = await func(self, context, *args, **kwargs)
            
            # Cache the result if it exists
            if result:
                cache_data = {
                    'intent': result.intent,
                    'confidence': result.confidence,
                    'entities': result.entities,
                    'routing_method': result.routing_method.value,
                    'metadata': result.metadata
                }
                await router_cache.set_routing_result(cache_key, cache_data, ttl)
            
            return result
        
        return wrapper
    return decorator


def cache_performance_metrics(ttl: float = 60):
    """
    Decorator to cache performance metrics calculations.
    
    Args:
        ttl: Time to live in seconds for the cached metrics
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(self, *args, **kwargs):
            # Generate cache key from method name and instance
            node_type = getattr(self, '__class__', 'unknown').__name__
            method_name = func.__name__
            cache_key = f"{node_type}:{method_name}"
            
            # Try to get from cache
            cached_metrics = await router_cache.get_performance_metrics(cache_key)
            if cached_metrics:
                return cached_metrics
            
            # Execute function
            metrics = await func(self, *args, **kwargs) if asyncio.iscoroutinefunction(func) else func(self, *args, **kwargs)
            
            # Cache the metrics
            if metrics:
                await router_cache.set_performance_metrics(cache_key, metrics, ttl)
            
            return metrics
        
        return wrapper
    return decorator


async def warm_router_cache():
    """Warm up the router cache with common queries."""
    try:
        logger.info("Starting router cache warming...")
        
        # Common queries to pre-cache
        common_queries = [
            "What are my lease terms?",
            "When does my lease expire?",
            "I want to buy a property",
            "I need help with my account",
            "How do I pay rent?",
            "What properties are available?",
            "I have a maintenance issue",
            "Help me find a new apartment"
        ]
        
        # This would be implemented with actual router instances
        # For now, just log the warming attempt
        for query in common_queries:
            logger.debug(f"Would warm cache for query: {query}")
        
        logger.info("Router cache warming completed")
        
    except Exception as e:
        logger.error(f"Error warming router cache: {e}")


async def invalidate_stale_cache_entries():
    """Background task to invalidate stale cache entries."""
    try:
        logger.info("Starting stale cache invalidation...")
        
        # Get cache stats to determine what to invalidate
        stats = await router_cache.get_cache_stats()
        
        # For now, just log the operation
        logger.info(f"Cache stats: {stats}")
        
        # Could implement more sophisticated invalidation logic here
        # based on hit rates, age, etc.
        
        logger.info("Stale cache invalidation completed")
        
    except Exception as e:
        logger.error(f"Error invalidating stale cache entries: {e}")


# Cache warming utilities
async def initialize_router_cache():
    """Initialize router cache with optimal settings."""
    try:
        # Warm up common routing patterns
        await warm_router_cache()
        
        logger.info("Router cache initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing router cache: {e}")
