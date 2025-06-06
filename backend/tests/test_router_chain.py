"""
Tests for the router chain implementation.

This module tests the Chain of Responsibility routing logic.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
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
        prompt="I need help with my lease agreement",
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


class TestRegexNode:
    """Test regex-based routing node."""
    
    @pytest.mark.asyncio
    async def test_regex_matching_lease(self, request_context):
        """Test regex matching for lease-related queries."""
        node = RegexNode(DEFAULT_ROUTING_RULES)
        
        # Test lease query
        request_context.prompt.prompt = "I have a question about my apartment lease"
        assert await node.can_handle(request_context)
        
        result = await node.handle(request_context)
        assert result is not None
        assert result.routing_method == RoutingMethod.REGEX
        assert result.metadata["selected_agent"] == AgentType.LEASE.value
    
    @pytest.mark.asyncio
    async def test_regex_no_match(self, request_context):
        """Test regex when no patterns match."""
        node = RegexNode(DEFAULT_ROUTING_RULES)
        
        # Test non-matching query
        request_context.prompt.prompt = "What's the weather like?"
        result = await node.handle(request_context)
        
        assert result is None  # Should return None when no match
    
    @pytest.mark.asyncio
    async def test_regex_priority(self):
        """Test that higher priority rules are matched first."""
        # Create rules with different priorities
        rules = [
            RoutingRule(
                pattern=r"\b(lease)\b",
                agent_type=AgentType.GENERAL,
                intent="general_help",
                priority=5
            ),
            RoutingRule(
                pattern=r"\b(lease)\b",
                agent_type=AgentType.LEASE,
                intent="lease_help",
                priority=10
            )
        ]
        
        node = RegexNode(rules)
        prompt_in = PromptIn(prompt="I need help with my lease")
        context = RequestContext(prompt=prompt_in)
        
        result = await node.handle(context)
        assert result.intent == "lease_help"  # Higher priority rule wins


class TestLLMRouterNode:
    """Test LLM-based routing node."""
    
    @pytest.mark.asyncio
    async def test_llm_routing_success(self, request_context, mock_llm_adapter):
        """Test successful LLM routing."""
        # Mock LLM response
        mock_response = CompletionResponse(
            content='{"agent_type": "lease", "intent": "lease_inquiry", "confidence": 0.9, "reasoning": "User asking about lease"}',
            model="gpt-4"
        )
        mock_llm_adapter.complete.return_value = mock_response
        
        node = LLMRouterNode(mock_llm_adapter, DEFAULT_AGENT_DESCRIPTIONS)
        
        assert await node.can_handle(request_context)
        result = await node.handle(request_context)
        
        assert result is not None
        assert result.intent == "lease_inquiry"
        assert result.confidence == 0.9
        assert result.routing_method == RoutingMethod.LLM_ROUTER
        assert result.metadata["agent_type"] == "lease"
    
    @pytest.mark.asyncio
    async def test_llm_routing_invalid_json(self, request_context, mock_llm_adapter):
        """Test LLM routing with invalid JSON response."""
        # Mock invalid JSON response
        mock_response = CompletionResponse(
            content='Invalid JSON response',
            model="gpt-4"
        )
        mock_llm_adapter.complete.return_value = mock_response
        
        node = LLMRouterNode(mock_llm_adapter, DEFAULT_AGENT_DESCRIPTIONS)
        result = await node.handle(request_context)
        
        assert result is None  # Should return None on error


class TestFallbackNode:
    """Test fallback routing node."""
    
    @pytest.mark.asyncio
    async def test_fallback_always_handles(self, request_context):
        """Test that fallback node always handles requests."""
        node = FallbackNode(default_agent=AgentType.GENERAL)
        
        assert await node.can_handle(request_context)
        result = await node.handle(request_context)
        
        assert result is not None
        assert result.intent == "general_query"
        assert result.confidence == 0.5
        assert result.routing_method == RoutingMethod.FALLBACK
        assert result.metadata["agent_type"] == AgentType.GENERAL.value


class TestRouterChain:
    """Test the complete router chain."""
    
    @pytest.mark.asyncio
    async def test_chain_regex_match(self, request_context, mock_llm_adapter):
        """Test chain when regex matches."""
        chain = RouterChain()
        chain.build_default_chain(
            regex_rules=DEFAULT_ROUTING_RULES,
            llm_adapter=mock_llm_adapter,
            agent_descriptions=DEFAULT_AGENT_DESCRIPTIONS
        )
        
        request_context.prompt.prompt = "I need help with my apartment lease"
        result = await chain.route(request_context)
        
        assert result.routing_method == RoutingMethod.REGEX
        assert result.metadata["selected_agent"] == AgentType.LEASE.value
    
    @pytest.mark.asyncio
    async def test_chain_llm_fallback(self, request_context, mock_llm_adapter):
        """Test chain falls back to LLM when regex doesn't match."""
        # Mock LLM response
        mock_response = CompletionResponse(
            content='{"agent_type": "general", "intent": "general_query", "confidence": 0.8}',
            model="gpt-4"
        )
        mock_llm_adapter.complete.return_value = mock_response
        
        chain = RouterChain()
        chain.build_default_chain(
            regex_rules=DEFAULT_ROUTING_RULES,
            llm_adapter=mock_llm_adapter,
            agent_descriptions=DEFAULT_AGENT_DESCRIPTIONS
        )
        
        request_context.prompt.prompt = "What's the meaning of life?"
        result = await chain.route(request_context)
        
        assert result.routing_method == RoutingMethod.LLM_ROUTER
        assert result.metadata["selected_agent"] == AgentType.GENERAL.value
    
    @pytest.mark.asyncio
    async def test_chain_final_fallback(self, request_context, mock_llm_adapter):
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