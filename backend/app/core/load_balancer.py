"""
Advanced load balancing for router components with circuit breaker patterns.

This module implements sophisticated load balancing algorithms and
resilience patterns for the router system.
"""

from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import random
import time
from collections import defaultdict, deque

from app.core.observability import get_logger
from app.core.metrics import metrics_collector

logger = get_logger(__name__)


class LoadBalancingStrategy(str, Enum):
    """Load balancing strategies."""
    ROUND_ROBIN = "round_robin"
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin"
    LEAST_CONNECTIONS = "least_connections"
    RESPONSE_TIME = "response_time"
    ADAPTIVE = "adaptive"


class CircuitBreakerState(str, Enum):
    """Circuit breaker states."""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class ServiceEndpoint:
    """Service endpoint configuration."""
    id: str
    url: str
    weight: int = 1
    max_connections: int = 100
    timeout: float = 30.0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Runtime metrics
    active_connections: int = 0
    total_requests: int = 0
    success_count: int = 0
    failure_count: int = 0
    last_request_time: Optional[datetime] = None
    avg_response_time: float = 0.0
    response_times: deque = field(default_factory=lambda: deque(maxlen=100))


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration."""
    failure_threshold: int = 5
    success_threshold: int = 3
    timeout: float = 60.0
    half_open_max_calls: int = 3


class CircuitBreaker:
    """Circuit breaker implementation for resilience."""
    
    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.half_open_calls = 0
    
    def can_call(self) -> bool:
        """Check if calls are allowed through the circuit breaker."""
        if self.state == CircuitBreakerState.CLOSED:
            return True
        
        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
                self.half_open_calls = 0
                return True
            return False
        
        if self.state == CircuitBreakerState.HALF_OPEN:
            return self.half_open_calls < self.config.half_open_max_calls
        
        return False
    
    def record_success(self):
        """Record a successful call."""
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self._reset()
        elif self.state == CircuitBreakerState.CLOSED:
            self.failure_count = 0
    
    def record_failure(self):
        """Record a failed call."""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.state == CircuitBreakerState.HALF_OPEN:
            self._trip()
        elif (self.state == CircuitBreakerState.CLOSED and 
              self.failure_count >= self.config.failure_threshold):
            self._trip()
    
    def _should_attempt_reset(self) -> bool:
        """Check if circuit breaker should attempt reset."""
        if not self.last_failure_time:
            return True
        
        return (datetime.utcnow() - self.last_failure_time).total_seconds() >= self.config.timeout
    
    def _trip(self):
        """Trip the circuit breaker to open state."""
        self.state = CircuitBreakerState.OPEN
        self.last_failure_time = datetime.utcnow()
        self.half_open_calls = 0
        
        logger.warning("Circuit breaker tripped to OPEN state")
    
    def _reset(self):
        """Reset circuit breaker to closed state."""
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.half_open_calls = 0
        
        logger.info("Circuit breaker reset to CLOSED state")


class ConnectionPool:
    """Connection pool with limits and monitoring."""
    
    def __init__(self, max_size: int = 100):
        self.max_size = max_size
        self.active_connections = 0
        self.total_created = 0
        self.wait_queue = asyncio.Queue()
        self._lock = asyncio.Lock()
    
    async def acquire(self) -> bool:
        """Acquire a connection from the pool."""
        async with self._lock:
            if self.active_connections < self.max_size:
                self.active_connections += 1
                self.total_created += 1
                return True
            return False
    
    async def release(self):
        """Release a connection back to the pool."""
        async with self._lock:
            if self.active_connections > 0:
                self.active_connections -= 1
    
    @property
    def usage_ratio(self) -> float:
        """Get current pool usage ratio."""
        return self.active_connections / self.max_size if self.max_size > 0 else 0.0


class RouterLoadBalancer:
    """Advanced load balancer for router components."""
    
    def __init__(
        self,
        strategy: LoadBalancingStrategy = LoadBalancingStrategy.ADAPTIVE,
        circuit_breaker_config: Optional[CircuitBreakerConfig] = None
    ):
        self.strategy = strategy
        self.endpoints: Dict[str, ServiceEndpoint] = {}
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.connection_pools: Dict[str, ConnectionPool] = {}
        
        # Load balancing state
        self.round_robin_index = 0
        self.request_counts = defaultdict(int)
        
        # Configuration
        self.circuit_breaker_config = circuit_breaker_config or CircuitBreakerConfig()
        
        # Metrics
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        
        # Initialize default connection pool for local calls
        self.connection_pools['default'] = ConnectionPool()
        logger.info(f"Router load balancer initialized with strategy: {strategy}")
    
    def add_endpoint(self, endpoint: ServiceEndpoint):
        """Add a service endpoint to the load balancer."""
        self.endpoints[endpoint.id] = endpoint
        self.circuit_breakers[endpoint.id] = CircuitBreaker(self.circuit_breaker_config)
        self.connection_pools[endpoint.id] = ConnectionPool(endpoint.max_connections)
        
        logger.info(f"Added endpoint: {endpoint.id} with weight {endpoint.weight}")
    
    def remove_endpoint(self, endpoint_id: str):
        """Remove a service endpoint."""
        if endpoint_id in self.endpoints:
            del self.endpoints[endpoint_id]
            del self.circuit_breakers[endpoint_id]
            del self.connection_pools[endpoint_id]
            logger.info(f"Removed endpoint: {endpoint_id}")
    
    async def select_endpoint(self, context: Optional[Dict[str, Any]] = None) -> Optional[ServiceEndpoint]:
        """Select the best endpoint based on the load balancing strategy."""
        available_endpoints = await self._get_available_endpoints()
        
        if not available_endpoints:
            logger.warning("No available endpoints for load balancing")
            return None
        
        if self.strategy == LoadBalancingStrategy.ROUND_ROBIN:
            return self._round_robin_select(available_endpoints)
        elif self.strategy == LoadBalancingStrategy.WEIGHTED_ROUND_ROBIN:
            return self._weighted_round_robin_select(available_endpoints)
        elif self.strategy == LoadBalancingStrategy.LEAST_CONNECTIONS:
            return self._least_connections_select(available_endpoints)
        elif self.strategy == LoadBalancingStrategy.RESPONSE_TIME:
            return self._response_time_select(available_endpoints)
        elif self.strategy == LoadBalancingStrategy.ADAPTIVE:
            return self._adaptive_select(available_endpoints, context)
        
        # Fallback to round robin
        return self._round_robin_select(available_endpoints)
    
    async def execute_request(
        self,
        endpoint_id: str,
        request_func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """Execute a request with load balancing and circuit breaker protection."""
        endpoint = self.endpoints.get(endpoint_id)
        if not endpoint:
            raise ValueError(f"Endpoint {endpoint_id} not found")
        
        circuit_breaker = self.circuit_breakers[endpoint_id]
        connection_pool = self.connection_pools[endpoint_id]
        
        # Check circuit breaker
        if not circuit_breaker.can_call():
            raise RuntimeError(f"Circuit breaker is OPEN for endpoint {endpoint_id}")
        
        # Acquire connection
        if not await connection_pool.acquire():
            raise RuntimeError(f"Connection pool exhausted for endpoint {endpoint_id}")
        
        start_time = time.time()
        self.total_requests += 1
        endpoint.total_requests += 1
        endpoint.active_connections += 1
        endpoint.last_request_time = datetime.utcnow()
        
        try:
            # Execute the request
            result = await request_func(*args, **kwargs)
            
            # Record success
            response_time = time.time() - start_time
            self._record_success(endpoint, circuit_breaker, response_time)
            
            return result
            
        except Exception as e:
            # Record failure
            self._record_failure(endpoint, circuit_breaker)
            raise e
            
        finally:
            # Release connection
            endpoint.active_connections -= 1
            await connection_pool.release()
    
    def _record_success(self, endpoint: ServiceEndpoint, circuit_breaker: CircuitBreaker, response_time: float):
        """Record a successful request."""
        self.successful_requests += 1
        endpoint.success_count += 1
        
        # Update response time metrics
        endpoint.response_times.append(response_time)
        endpoint.avg_response_time = sum(endpoint.response_times) / len(endpoint.response_times)
        
        # Update circuit breaker
        circuit_breaker.record_success()
        
        # Update metrics
        metrics_collector.record_load_balancer_request(
            endpoint_id=endpoint.id,
            success=True,
            response_time=response_time
        )
    
    def _record_failure(self, endpoint: ServiceEndpoint, circuit_breaker: CircuitBreaker):
        """Record a failed request."""
        self.failed_requests += 1
        endpoint.failure_count += 1
        
        # Update circuit breaker
        circuit_breaker.record_failure()
        
        # Update metrics
        metrics_collector.record_load_balancer_request(
            endpoint_id=endpoint.id,
            success=False,
            response_time=0.0
        )
        
        logger.warning(f"Request failed for endpoint {endpoint.id}")
    
    async def _get_available_endpoints(self) -> List[ServiceEndpoint]:
        """Get list of available endpoints (circuit breaker check)."""
        available = []
        
        for endpoint_id, endpoint in self.endpoints.items():
            circuit_breaker = self.circuit_breakers[endpoint_id]
            if circuit_breaker.can_call():
                available.append(endpoint)
        
        return available
    
    def _round_robin_select(self, endpoints: List[ServiceEndpoint]) -> ServiceEndpoint:
        """Round robin selection."""
        if not endpoints:
            raise ValueError("No endpoints available")
        
        endpoint = endpoints[self.round_robin_index % len(endpoints)]
        self.round_robin_index += 1
        return endpoint
    
    def _weighted_round_robin_select(self, endpoints: List[ServiceEndpoint]) -> ServiceEndpoint:
        """Weighted round robin selection."""
        if not endpoints:
            raise ValueError("No endpoints available")
        
        # Build weighted list
        weighted_endpoints = []
        for endpoint in endpoints:
            weighted_endpoints.extend([endpoint] * endpoint.weight)
        
        if not weighted_endpoints:
            return endpoints[0]
        
        endpoint = weighted_endpoints[self.round_robin_index % len(weighted_endpoints)]
        self.round_robin_index += 1
        return endpoint
    
    def _least_connections_select(self, endpoints: List[ServiceEndpoint]) -> ServiceEndpoint:
        """Select endpoint with least active connections."""
        return min(endpoints, key=lambda e: e.active_connections)
    
    def _response_time_select(self, endpoints: List[ServiceEndpoint]) -> ServiceEndpoint:
        """Select endpoint with best average response time."""
        # Filter endpoints with response time data
        endpoints_with_data = [e for e in endpoints if e.response_times]
        
        if not endpoints_with_data:
            # Fallback to round robin for new endpoints
            return self._round_robin_select(endpoints)
        
        return min(endpoints_with_data, key=lambda e: e.avg_response_time)
    
    def _adaptive_select(
        self, 
        endpoints: List[ServiceEndpoint], 
        context: Optional[Dict[str, Any]] = None
    ) -> ServiceEndpoint:
        """Adaptive selection based on multiple factors."""
        if not endpoints:
            raise ValueError("No endpoints available")
        
        # Score each endpoint
        scores = {}
        
        for endpoint in endpoints:
            score = 0.0
            
            # Connection load factor (30%)
            connection_pool = self.connection_pools[endpoint.id]
            load_factor = 1.0 - connection_pool.usage_ratio
            score += load_factor * 0.3
            
            # Response time factor (40%)
            if endpoint.response_times:
                # Normalize response time (lower is better)
                max_response_time = max(e.avg_response_time for e in endpoints if e.response_times) or 1.0
                response_factor = 1.0 - (endpoint.avg_response_time / max_response_time)
                score += response_factor * 0.4
            else:
                score += 0.4  # New endpoint bonus
            
            # Success rate factor (20%)
            total_requests = endpoint.success_count + endpoint.failure_count
            if total_requests > 0:
                success_rate = endpoint.success_count / total_requests
                score += success_rate * 0.2
            else:
                score += 0.2  # New endpoint bonus
            
            # Weight factor (10%)
            max_weight = max(e.weight for e in endpoints) or 1
            weight_factor = endpoint.weight / max_weight
            score += weight_factor * 0.1
            
            scores[endpoint.id] = score
        
        # Select endpoint with highest score
        best_endpoint_id = max(scores, key=scores.get)
        return next(e for e in endpoints if e.id == best_endpoint_id)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get load balancer statistics."""
        endpoint_stats = {}
        
        for endpoint_id, endpoint in self.endpoints.items():
            circuit_breaker = self.circuit_breakers[endpoint_id]
            connection_pool = self.connection_pools[endpoint_id]
            
            total_requests = endpoint.success_count + endpoint.failure_count
            success_rate = endpoint.success_count / total_requests if total_requests > 0 else 0.0
            
            endpoint_stats[endpoint_id] = {
                'total_requests': total_requests,
                'success_rate': success_rate,
                'avg_response_time': endpoint.avg_response_time,
                'active_connections': endpoint.active_connections,
                'connection_pool_usage': connection_pool.usage_ratio,
                'circuit_breaker_state': circuit_breaker.state.value,
                'weight': endpoint.weight
            }
        
        return {
            'strategy': self.strategy.value,
            'total_requests': self.total_requests,
            'success_rate': self.successful_requests / self.total_requests if self.total_requests > 0 else 0.0,
            'endpoints': endpoint_stats,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Invoke a function with circuit breaker and connection pooling.
        """
        import time
        from app.core.metrics import metrics_collector
        
        start_time = time.time()
        endpoint_id = 'default'
        
        # Initialize circuit breaker for this call
        cb = CircuitBreaker(self.circuit_breaker_config)
        # Acquire connection
        pool = self.connection_pools.get(endpoint_id)
        if pool and not await pool.acquire():
            raise RuntimeError("Connection pool exhausted")
        
        # Update counters
        self.total_requests += 1
        
        try:
            # Execute the function (async or sync)
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            
            # Record successful call
            cb.record_success()
            self.successful_requests += 1
            
            # Record metrics
            response_time = time.time() - start_time
            metrics_collector.record_load_balancer_request(
                endpoint_id=endpoint_id,
                success=True,
                response_time=response_time
            )
            
            return result
        except Exception as e:
            # Record failure in circuit breaker
            cb.record_failure()
            self.failed_requests += 1
            
            # Record failure metrics
            response_time = time.time() - start_time
            metrics_collector.record_load_balancer_request(
                endpoint_id=endpoint_id,
                success=False,
                response_time=response_time
            )
            
            raise
        finally:
            # Release connection
            if pool:
                await pool.release()


# Global load balancer instance
router_load_balancer = RouterLoadBalancer()
