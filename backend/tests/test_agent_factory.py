"""
Unit tests for agent factory and registry functionality.

Ensures all registered agent types can be created successfully and that
the Support agent plugin is properly loaded and functional.
"""
import pytest
from unittest.mock import AsyncMock, patch

from app.domain.agent_factory import agent_registry, AgentRegistry
from app.domain.schemas import AgentType
from app.domain.exceptions import AgentNotFoundException


class TestAgentFactory:
    """Test suite for agent factory and registry."""

    @pytest.mark.asyncio
    async def test_all_agent_types_have_registered_classes(self):
        """Verify every AgentType enum value has a corresponding registered agent class."""
        # Get all agent types from the enum
        all_agent_types = [agent_type.value for agent_type in AgentType]
        
        # Check that each agent type can be created (has a registered class)
        missing_agents = []
        for agent_type in all_agent_types:
            try:
                agent = await agent_registry.create_agent(agent_type)
                assert agent is not None, f"Agent creation returned None for type: {agent_type}"
            except AgentNotFoundException:
                missing_agents.append(agent_type)
        
        # Fail if any agent types are missing implementations
        assert not missing_agents, f"Missing agent implementations for types: {missing_agents}"

    @pytest.mark.asyncio
    async def test_support_agent_creation(self):
        """Specifically test that the Support agent can be created successfully."""
        agent = await agent_registry.create_agent("support")
        assert agent is not None
        assert hasattr(agent, 'process_request'), "Support agent should have process_request method"

    @pytest.mark.asyncio
    async def test_agent_registry_caching(self):
        """Test that agent registry properly caches agent instances."""
        # Create the same agent type twice
        agent1 = await agent_registry.create_agent("support")
        agent2 = await agent_registry.create_agent("support")
        
        # Should be the same cached instance
        assert agent1 is agent2, "Agent registry should return cached instances"

    @pytest.mark.asyncio
    async def test_invalid_agent_type_raises_exception(self):
        """Test that requesting an invalid agent type raises AgentNotFoundException."""
        with pytest.raises(AgentNotFoundException):
            await agent_registry.create_agent("nonexistent_agent_type")

    @pytest.mark.asyncio
    async def test_agent_registry_list_agents(self):
        """Test that registry can list all available agent types."""
        available_agents = agent_registry.list_available_agents()
        
        # Should include at least the support agent
        assert "support" in available_agents
        
        # Should match the number of AgentType enum values
        all_agent_types = [agent_type.value for agent_type in AgentType]
        assert len(available_agents) == len(all_agent_types)

    @pytest.mark.asyncio
    async def test_agent_has_required_interface(self):
        """Test that created agents implement the required BaseAgent interface."""
        agent = await agent_registry.create_agent("support")
        
        # Check for required methods
        required_methods = ['process_request', 'get_capabilities', 'get_agent_type']
        for method in required_methods:
            assert hasattr(agent, method), f"Agent should implement {method} method"
            assert callable(getattr(agent, method)), f"{method} should be callable"

    def test_agent_registry_singleton(self):
        """Test that agent_registry is a singleton instance."""
        # Import should return the same instance
        from app.domain.agent_factory import agent_registry as registry2
        assert agent_registry is registry2, "agent_registry should be a singleton"


class TestAgentRegistryEdgeCases:
    """Test edge cases and error conditions for agent registry."""

    @pytest.mark.asyncio
    async def test_registry_handles_plugin_loading_errors(self):
        """Test that registry gracefully handles plugin loading errors."""
        registry = AgentRegistry()
        
        # Mock a plugin directory that doesn't exist
        with patch('pathlib.Path.exists', return_value=False):
            result = await registry.load_plugin("/fake/path")
            assert result is None, "Should return None for non-existent plugin"

    @pytest.mark.asyncio
    async def test_registry_cleanup_on_shutdown(self):
        """Test that registry properly cleans up agents on shutdown."""
        registry = AgentRegistry()
        
        # Create an agent
        agent = await registry.create_agent("support")
        assert agent is not None
        
        # Unload the agent
        await registry.unload_agent("support")
        
        # Should no longer be in the registry
        assert "support" not in registry._agents
