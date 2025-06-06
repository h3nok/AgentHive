import pytest
import asyncio
from app.core.router_cache import cache_routing_decision, router_cache
from app.domain.schemas import IntentResult, RoutingMethod
from app.domain.schemas import RequestContext, PromptIn
from app.domain.schemas import AgentType

class DummyRouter:
    @cache_routing_decision(ttl=2)
    async def handle(self, context: RequestContext) -> IntentResult:
        """Simulate routing decision logic."""
        return IntentResult(
            intent="dummy_intent",
            confidence=0.5,
            entities={},
            routing_method=RoutingMethod.REGEX,
            metadata={"test_key": "test_value"}
        )

@pytest.mark.asyncio
async def test_cache_decorator_sets_cache(monkeypatch):
    # Temporarily disable test detection to allow caching
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    
    dummy = DummyRouter()
    prompt_in = PromptIn(prompt="hello world", session_id="session1")
    context = RequestContext(prompt=prompt_in, user_id="user123", request_id="req1")
    # Ensure cache is clear
    await router_cache.invalidate_routing_cache()

    # First call should populate cache
    result1 = await dummy.handle(context)
    assert isinstance(result1, IntentResult)
    assert result1.intent == "dummy_intent"

    # Mock the cache to verify it gets called on second request
    called = False
    original_get = router_cache.get_routing_result
    
    async def mock_get(query_hash: str):
        nonlocal called
        called = True
        # Return None to simulate cache miss and test the logic
        return None
    
    monkeypatch.setattr(router_cache, 'get_routing_result', mock_get)

    # Second call should check cache (even if it misses)
    result2 = await dummy.handle(context)
    assert called, "Expected get_routing_result to be called"
    assert isinstance(result2, IntentResult)
    assert result2.intent == "dummy_intent"

@pytest.mark.asyncio
async def test_cache_decorator_ttl(monkeypatch):
    # Temporarily disable test detection to allow caching
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    
    # Create a class with method to track calls
    call_count = 0

    class TestRouter:
        @cache_routing_decision(ttl=2)
        async def handle(self, context):
            nonlocal call_count
            call_count += 1
            return IntentResult(
                intent="dummy_intent",
                confidence=0.9,
                entities={},
                routing_method=RoutingMethod.REGEX,
                metadata={"test_key": "test_value"}
            )

    test_router = TestRouter()
    prompt_in = PromptIn(prompt="hello TTL", session_id="sessionTTL")
    context = RequestContext(prompt=prompt_in, user_id="userTTL", request_id="reqTTL")

    # Clear cache
    await router_cache.invalidate_routing_cache()

    # First call - should execute function
    result1 = await test_router.handle(context)
    assert call_count == 1
    assert isinstance(result1, IntentResult)
    assert result1.intent == "dummy_intent"

    # Second call immediately - should use cache
    result2 = await test_router.handle(context)
    assert call_count == 1  # Should not have incremented
    assert result2.intent == "dummy_intent"

    # Wait beyond TTL
    await asyncio.sleep(2.5)

    # Third call after TTL expiry - should execute function again
    result3 = await test_router.handle(context)
    assert call_count == 2  # Should have incremented
    assert result3.intent == "dummy_intent"
