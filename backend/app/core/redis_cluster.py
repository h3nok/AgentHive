"""
Enhanced Redis Cluster Adapter with Connection Pooling and Scaling

This module provides production-ready Redis clustering support with:
- Connection pooling for high-performance scaling
- Health monitoring and failover
- Distributed caching strategies
- Circuit breaker patterns
- Performance optimization
"""

import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Set, Union
from dataclasses import dataclass
from enum import Enum

import redis.asyncio as aioredis
from redis.asyncio import Redis, ConnectionPool
from redis.exceptions import RedisError, ConnectionError, TimeoutError
from redis.asyncio.sentinel import Sentinel

from .settings import settings
from .observability import get_logger, with_tracing

logger = get_logger(__name__)


class NodeStatus(Enum):
    """Redis node status enumeration."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"
    UNKNOWN = "unknown"


@dataclass
class RedisNode:
    """Redis node configuration."""
    host: str
    port: int
    password: Optional[str] = None
    db: int = 0
    ssl: bool = False
    status: NodeStatus = NodeStatus.UNKNOWN
    last_health_check: float = 0
    failure_count: int = 0
    response_time: float = 0


@dataclass
class ConnectionPoolStats:
    """Connection pool statistics."""
    total_connections: int = 0
    active_connections: int = 0
    idle_connections: int = 0
    failed_connections: int = 0
    pool_hits: int = 0
    pool_misses: int = 0
    avg_response_time: float = 0


class CircuitBreakerState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """Circuit breaker for Redis operations."""
    
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 60.0,
        success_threshold: int = 3
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = 0
        self.state = CircuitBreakerState.CLOSED
        self._lock = asyncio.Lock()
    
    async def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection."""
        async with self._lock:
            if self.state == CircuitBreakerState.OPEN:
                if time.time() - self.last_failure_time > self.recovery_timeout:
                    self.state = CircuitBreakerState.HALF_OPEN
                    self.success_count = 0
                    logger.info("Circuit breaker transitioning to HALF_OPEN")
                else:
                    raise RedisError("Circuit breaker is OPEN")
        
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception as e:
            await self._on_failure()
            raise e
    
    async def _on_success(self):
        """Handle successful operation."""
        async with self._lock:
            if self.state == CircuitBreakerState.HALF_OPEN:
                self.success_count += 1
                if self.success_count >= self.success_threshold:
                    self.state = CircuitBreakerState.CLOSED
                    self.failure_count = 0
                    logger.info("Circuit breaker reset to CLOSED")
            elif self.state == CircuitBreakerState.CLOSED:
                self.failure_count = 0
    
    async def _on_failure(self):
        """Handle failed operation."""
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitBreakerState.OPEN
                logger.warning(f"Circuit breaker opened due to {self.failure_count} failures")


class RedisClusterAdapter:
    """Enhanced Redis adapter with clustering and connection pooling."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize Redis cluster adapter."""
        self.config = config or self._load_config()
        self.nodes: List[RedisNode] = []
        self.connection_pools: Dict[str, ConnectionPool] = {}
        self.clients: Dict[str, Redis] = {}
        self.sentinel: Optional[Sentinel] = None
        self.circuit_breaker = CircuitBreaker()
        self.stats = ConnectionPoolStats()
        self._health_check_task: Optional[asyncio.Task] = None
        self._performance_monitor_task: Optional[asyncio.Task] = None
        self._initialized = False
        self._lock = asyncio.Lock()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load Redis configuration from settings."""
        return {
            'nodes': [
                {
                    'host': settings.redis_host,
                    'port': settings.redis_port,
                    'password': settings.redis_password,
                    'db': settings.redis_db,
                    'ssl': getattr(settings, 'redis_ssl', False)
                }
            ],
            'sentinel_hosts': getattr(settings, 'redis_sentinel_hosts', []),
            'sentinel_service': getattr(settings, 'redis_sentinel_service', 'mymaster'),
            'pool_config': {
                'max_connections': getattr(settings, 'redis_max_connections', 100),
                'min_connections': getattr(settings, 'redis_min_connections', 10),
                'retry_on_timeout': True,
                'retry_on_error': [ConnectionError, TimeoutError],
                'health_check_interval': 30,
                'connection_timeout': 10,
                'socket_timeout': 5,
                'socket_keepalive': True,
                'socket_keepalive_options': {}
            }
        }
    
    async def initialize(self):
        """Initialize Redis cluster connections."""
        if self._initialized:
            return
        
        async with self._lock:
            if self._initialized:
                return
            
            try:
                # Initialize nodes
                await self._initialize_nodes()
                
                # Initialize connection pools
                await self._initialize_connection_pools()
                
                # Initialize clients
                await self._initialize_clients()
                
                # Start background tasks
                await self._start_background_tasks()
                
                self._initialized = True
                logger.info("Redis cluster adapter initialized successfully")
                
            except Exception as e:
                logger.error(f"Failed to initialize Redis cluster: {e}")
                raise
    
    async def _initialize_nodes(self):
        """Initialize Redis nodes from configuration."""
        self.nodes = []
        
        # Add configured nodes
        for node_config in self.config['nodes']:
            node = RedisNode(
                host=node_config['host'],
                port=node_config['port'],
                password=node_config.get('password'),
                db=node_config.get('db', 0),
                ssl=node_config.get('ssl', False)
            )
            self.nodes.append(node)
        
        # Initialize Sentinel if configured
        if self.config.get('sentinel_hosts'):
            self.sentinel = Sentinel(
                [(host, port) for host, port in self.config['sentinel_hosts']],
                password=self.config['nodes'][0].get('password')
            )
    
    async def _initialize_connection_pools(self):
        """Initialize connection pools for each node."""
        pool_config = self.config['pool_config']
        
        for node in self.nodes:
            pool_key = f"{node.host}:{node.port}"
            
            # Create connection pool with optimized settings
            pool = ConnectionPool(
                host=node.host,
                port=node.port,
                password=node.password,
                db=node.db,
                ssl=node.ssl,
                max_connections=pool_config['max_connections'],
                retry_on_timeout=pool_config['retry_on_timeout'],
                retry_on_error=pool_config['retry_on_error'],
                connection_class=aioredis.Connection,
                socket_timeout=pool_config['socket_timeout'],
                socket_connect_timeout=pool_config['connection_timeout'],
                socket_keepalive=pool_config['socket_keepalive'],
                socket_keepalive_options=pool_config['socket_keepalive_options']
            )
            
            self.connection_pools[pool_key] = pool
            logger.info(f"Created connection pool for {pool_key}")
    
    async def _initialize_clients(self):
        """Initialize Redis clients for each pool."""
        for pool_key, pool in self.connection_pools.items():
            client = Redis(connection_pool=pool)
            self.clients[pool_key] = client
            
            # Test connection
            try:
                await client.ping()
                # Update node status
                node = next(n for n in self.nodes if f"{n.host}:{n.port}" == pool_key)
                node.status = NodeStatus.HEALTHY
                logger.info(f"Redis client {pool_key} is healthy")
            except Exception as e:
                logger.error(f"Failed to connect to Redis node {pool_key}: {e}")
                node = next(n for n in self.nodes if f"{n.host}:{n.port}" == pool_key)
                node.status = NodeStatus.FAILED
    
    async def _start_background_tasks(self):
        """Start background monitoring tasks."""
        self._health_check_task = asyncio.create_task(self._health_check_loop())
        self._performance_monitor_task = asyncio.create_task(self._performance_monitor_loop())
    
    async def _health_check_loop(self):
        """Periodic health check for all nodes."""
        while True:
            try:
                await asyncio.sleep(self.config['pool_config']['health_check_interval'])
                await self._perform_health_checks()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in health check loop: {e}")
    
    async def _perform_health_checks(self):
        """Perform health checks on all nodes."""
        for node in self.nodes:
            pool_key = f"{node.host}:{node.port}"
            client = self.clients.get(pool_key)
            
            if not client:
                continue
            
            start_time = time.time()
            try:
                await client.ping()
                response_time = time.time() - start_time
                
                # Update node status
                node.status = NodeStatus.HEALTHY
                node.response_time = response_time
                node.last_health_check = time.time()
                node.failure_count = 0
                
            except Exception as e:
                node.failure_count += 1
                node.last_health_check = time.time()
                
                if node.failure_count >= 3:
                    node.status = NodeStatus.FAILED
                    logger.error(f"Node {pool_key} marked as failed: {e}")
                else:
                    node.status = NodeStatus.DEGRADED
                    logger.warning(f"Node {pool_key} degraded: {e}")
    
    async def _performance_monitor_loop(self):
        """Monitor performance metrics."""
        while True:
            try:
                await asyncio.sleep(60)  # Monitor every minute
                await self._collect_performance_metrics()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in performance monitor loop: {e}")
    
    async def _collect_performance_metrics(self):
        """Collect performance metrics from connection pools."""
        total_connections = 0
        active_connections = 0
        
        for pool in self.connection_pools.values():
            pool_stats = pool.connection_kwargs
            total_connections += pool.created_connections
            active_connections += len(pool._in_use_connections) if hasattr(pool, '_in_use_connections') else 0
        
        self.stats.total_connections = total_connections
        self.stats.active_connections = active_connections
        self.stats.idle_connections = total_connections - active_connections
        
        logger.debug(f"Pool stats - Total: {total_connections}, Active: {active_connections}")
    
    def _get_healthy_client(self) -> Optional[Redis]:
        """Get a healthy Redis client using load balancing."""
        healthy_nodes = [n for n in self.nodes if n.status == NodeStatus.HEALTHY]
        
        if not healthy_nodes:
            # Fallback to degraded nodes
            healthy_nodes = [n for n in self.nodes if n.status == NodeStatus.DEGRADED]
        
        if not healthy_nodes:
            logger.error("No healthy Redis nodes available")
            return None
        
        # Simple round-robin for now (can be enhanced with weighted load balancing)
        node = min(healthy_nodes, key=lambda n: n.response_time)
        pool_key = f"{node.host}:{node.port}"
        return self.clients.get(pool_key)
    
    @with_tracing("redis_get")
    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis with automatic failover."""
        return await self.circuit_breaker.call(self._get_internal, key)
    
    async def _get_internal(self, key: str) -> Optional[str]:
        """Internal get implementation."""
        client = self._get_healthy_client()
        if not client:
            raise RedisError("No healthy Redis nodes available")
        
        try:
            start_time = time.time()
            result = await client.get(key)
            self.stats.avg_response_time = time.time() - start_time
            self.stats.pool_hits += 1
            return result
        except Exception as e:
            self.stats.pool_misses += 1
            logger.error(f"Redis GET error: {e}")
            raise
    
    @with_tracing("redis_set")
    async def set(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None
    ) -> bool:
        """Set value in Redis with automatic failover."""
        return await self.circuit_breaker.call(self._set_internal, key, value, expire)
    
    async def _set_internal(
        self,
        key: str,
        value: Any,
        expire: Optional[int] = None
    ) -> bool:
        """Internal set implementation."""
        client = self._get_healthy_client()
        if not client:
            raise RedisError("No healthy Redis nodes available")
        
        try:
            if not isinstance(value, str):
                value = json.dumps(value)
            
            result = await client.set(key, value, ex=expire)
            return bool(result)
        except Exception as e:
            logger.error(f"Redis SET error: {e}")
            raise
    
    @asynccontextmanager
    async def pipeline(self):
        """Get Redis pipeline for batch operations."""
        client = self._get_healthy_client()
        if not client:
            raise RedisError("No healthy Redis nodes available")
        
        pipe = client.pipeline()
        try:
            yield pipe
        finally:
            await pipe.reset()
    
    async def health_check(self) -> Dict[str, Any]:
        """Get health status of all nodes."""
        return {
            'nodes': [
                {
                    'host': node.host,
                    'port': node.port,
                    'status': node.status.value,
                    'response_time': node.response_time,
                    'failure_count': node.failure_count,
                    'last_check': node.last_health_check
                }
                for node in self.nodes
            ],
            'stats': {
                'total_connections': self.stats.total_connections,
                'active_connections': self.stats.active_connections,
                'idle_connections': self.stats.idle_connections,
                'pool_hits': self.stats.pool_hits,
                'pool_misses': self.stats.pool_misses,
                'avg_response_time': self.stats.avg_response_time
            },
            'circuit_breaker': {
                'state': self.circuit_breaker.state.value,
                'failure_count': self.circuit_breaker.failure_count
            }
        }
    
    async def close(self):
        """Close all connections and cleanup."""
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
        
        if self._performance_monitor_task:
            self._performance_monitor_task.cancel()
            try:
                await self._performance_monitor_task
            except asyncio.CancelledError:
                pass
        
        for client in self.clients.values():
            await client.close()
        
        for pool in self.connection_pools.values():
            await pool.disconnect()
        
        logger.info("Redis cluster adapter closed")


# Global Redis cluster adapter instance
redis_cluster = RedisClusterAdapter()


async def get_redis_cluster() -> RedisClusterAdapter:
    """Get the global Redis cluster adapter."""
    if not redis_cluster._initialized:
        await redis_cluster.initialize()
    return redis_cluster
