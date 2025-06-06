#!/usr/bin/env python3
"""
Test script to validate HR agent loading and integration.
This script tests the HR agent without Prometheus metrics conflicts.
"""

import asyncio
import sys
from pathlib import Path

# Add the backend app to Python path for imports
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.domain.agent_factory import AgentRegistry
from app.domain.schemas import AgentType, RequestContext, PromptIn
from app.core.settings import settings

async def test_hr_agent_loading():
    """Test HR agent loading and basic functionality."""
    print("=== HR Agent Loading Test ===")
    
    # Initialize the agent registry
    registry = AgentRegistry()
    
    # Load the HR agent plugin
    hr_plugin_path = Path(__file__).parent / "app" / "plugins" / "hr_agent"
    print(f"Loading HR agent from: {hr_plugin_path}")
    
    if not hr_plugin_path.exists():
        print(f"ERROR: HR agent plugin directory not found at {hr_plugin_path}")
        return False
    
    agent_id = await registry.load_plugin(hr_plugin_path)
    if not agent_id:
        print("ERROR: Failed to load HR agent plugin")
        return False
    
    print(f"✅ Successfully loaded HR agent with ID: {agent_id}")
    
    # List all registered agents
    registrations = registry.list_agents()
    print(f"✅ Total registered agents: {len(registrations)}")
    for reg in registrations:
        print(f"  - {reg.agent_id} ({reg.agent_type.value})")
    
    # Test creating an HR agent instance
    try:
        hr_agent = await registry.create_agent(AgentType.HR)
        print(f"✅ Successfully created HR agent instance: {hr_agent.agent_id}")
        
        # Test basic agent properties
        capabilities = hr_agent.get_capabilities()
        print(f"✅ HR agent capabilities: {capabilities}")
        
        # Test cost estimation
        prompt_in = PromptIn(prompt="What are the company benefits?")
        context = RequestContext(
            prompt=prompt_in,
            user_id="test-user",
            metadata={}
        )
        cost = hr_agent.get_cost_estimate(context)
        print(f"✅ HR agent cost estimate: ${cost:.4f}")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Failed to create HR agent instance: {str(e)}")
        return False

async def test_prometheus_metrics_separation():
    """Test that Prometheus metrics don't conflict."""
    print("\n=== Prometheus Metrics Separation Test ===")
    
    try:
        # Import both modules that had conflicting metrics
        from app.core.observability import get_logger
        from app.core.metrics import MetricsCollector
        
        print("✅ Successfully imported observability and metrics modules")
        
        # Try to create metrics collector (this would fail if there were conflicts)
        metrics_collector = MetricsCollector()
        print("✅ Successfully created MetricsCollector")
        
        # Test logger from observability
        logger = get_logger("test")
        logger.info("Test log message")
        print("✅ Successfully created logger from observability")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Prometheus metrics conflict detected: {str(e)}")
        return False

async def main():
    """Run all tests."""
    print("Starting HR Agent Integration Tests...\n")
    
    # Test Prometheus metrics separation first
    metrics_ok = await test_prometheus_metrics_separation()
    
    # Test HR agent loading
    agent_ok = await test_hr_agent_loading()
    
    # Final summary
    print(f"\n=== Test Results ===")
    print(f"Prometheus Metrics: {'✅ PASS' if metrics_ok else '❌ FAIL'}")
    print(f"HR Agent Loading: {'✅ PASS' if agent_ok else '❌ FAIL'}")
    
    if metrics_ok and agent_ok:
        print("\n🎉 All tests passed! HR agent is ready for integration.")
        return 0
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
