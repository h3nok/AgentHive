"""Simple test for router chain components."""

import pytest


def test_imports():
    """Test that router chain imports work."""
    from app.domain.router_chain import RouterChain, RegexNode, FallbackNode
    assert RouterChain is not None
    assert RegexNode is not None
    assert FallbackNode is not None


@pytest.mark.asyncio
async def test_fallback_node():
    """Test basic fallback node functionality."""
    from app.domain.router_chain import FallbackNode
    from app.domain.schemas import RequestContext, PromptIn, AgentType
    
    node = FallbackNode()
    prompt = PromptIn(prompt="test", session_id="test")
    context = RequestContext(prompt=prompt)
    
    assert await node.can_handle(context)
    result = await node.handle(context)
    assert result is not None
    assert result.metadata["agent_type"] == AgentType.GENERAL.value
