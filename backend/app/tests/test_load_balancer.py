import pytest
import asyncio
from app.core.load_balancer import RouterLoadBalancer, CircuitBreakerConfig, LoadBalancingStrategy, ConnectionPool
from app.core.metrics import load_balancer_requests_total, load_balancer_request_duration_seconds

@pytest.mark.asyncio
async def test_successful_call_metrics(monkeypatch):
    # Enable metrics for this test by monkeypatching the metrics collector
    from app.core.metrics import metrics_collector
    monkeypatch.setattr(metrics_collector, 'enabled', True)
    
    # Initialize load balancer with default config
    lb = RouterLoadBalancer(strategy=LoadBalancingStrategy.ADAPTIVE, circuit_breaker_config=CircuitBreakerConfig())

    # Define a dummy async function
    async def dummy(x):
        return x * 2

    # Call the dummy function through the load balancer
    result = await lb.call(dummy, 5)
    assert result == 10

    # Verify metrics for the default endpoint
    # We expect at least one sample for load_balancer_requests_total with endpoint_id='default'
    total_samples = [
        s for metric in load_balancer_requests_total.collect()
        for s in metric.samples
        if s.labels.get('endpoint_id') == 'default'
    ]
    assert total_samples, "No load_balancer_requests_total sample recorded"

    # Verify duration histogram recorded
    duration_samples = [
        s for metric in load_balancer_request_duration_seconds.collect()
        for s in metric.samples
        if s.labels.get('endpoint_id') == 'default'
    ]
    assert duration_samples, "No load_balancer_request_duration_seconds sample recorded"

@pytest.mark.asyncio
async def test_connection_pool_exhausted():
    # Initialize load balancer with a pool that has zero capacity
    lb = RouterLoadBalancer()
    # Create a mock connection pool that always returns False for acquire
    mock_pool = ConnectionPool(max_size=0)
    lb.connection_pools['default'] = mock_pool

    async def dummy():
        return 'ok'

    with pytest.raises(RuntimeError) as excinfo:
        await lb.call(dummy)
    assert 'Connection pool exhausted' in str(excinfo.value)
