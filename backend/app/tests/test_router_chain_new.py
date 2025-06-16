"""
Tests for the router chain implementation.

This module tests the Chain of Responsibility routing logic.
"""

import pytest
from unittest.mock import Mock, AsyncMock
from app.domain.router_chain import (
    RouterChain, RegexNode, LLMRouterNode, FallbackNode,
    RoutingRule, DEFAULT_ROUTING_RULES, DEFAULT_AGENT_DESCRIPTIONS
)
from app.domain.schemas import RequestContext, PromptIn, AgentType, RoutingMethod
from app.adapters.llm_openai import OpenAIAdapter, CompletionResponse


@pytest.fixture
def request_context():
    """Create a test request context."""
    prompt_in = PromptIn(
        prompt="I need help with buying a house",
        session_id="test-session"
    )
    return RequestContext(
        prompt=prompt_in,
        user_id="test-user",
        request_id="test-request"
    )


@pytest.fixture
def mock_llm_adapter():
    """Create a mock LLM adapter."""
    adapter = Mock(spec=OpenAIAdapter)
    adapter.complete = AsyncMock()
    return adapter


@pytest.mark.asyncio
async def test_fallback_node_functionality(request_context):
    """Test that fallback node always handles requests."""
    node = FallbackNode(default_agent=AgentType.GENERAL)
    
    assert await node.can_handle(request_context)
    result = await node.handle(request_context)
    
    assert result is not None
    assert result.intent == "general_query"
    assert result.confidence == 0.5
    assert result.routing_method == RoutingMethod.FALLBACK
    assert result.metadata["agent_type"] == AgentType.GENERAL.value


@pytest.mark.asyncio
async def test_chain_final_fallback(request_context, mock_llm_adapter):
    """Test chain uses final fallback when all else fails."""
    # Mock LLM to fail
    mock_llm_adapter.complete.side_effect = Exception("LLM error")
    
    chain = RouterChain()
    chain.build_default_chain(
        regex_rules=[],  # No regex rules
        llm_adapter=mock_llm_adapter,
        agent_descriptions=DEFAULT_AGENT_DESCRIPTIONS
    )
    
    # Use a query that won't match any regex patterns
    request_context.prompt.prompt = "What is the meaning of life?"
    result = await chain.route(request_context)
    
    assert result.routing_method == RoutingMethod.FALLBACK
    assert result.metadata["agent_type"] == AgentType.GENERAL.value
