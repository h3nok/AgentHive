#!/usr/bin/env python3
"""
Test script specifically for HR agent routing integration.
This script tests the end-to-end HR query routing to ensure HR queries 
are automatically directed to the HR agent through the intelligent routing system.
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.domain.router_chain import ContextAwareRouter
from backend.app.domain.schemas import PromptIn, RequestContext
from backend.app.core.factory import create_agent_factory
from backend.app.core.settings import settings

async def test_hr_routing_integration():
    """Test HR agent routing integration end-to-end."""
    print("🏥 Starting HR Agent Routing Integration Test")
    print("=" * 60)
    
    # Initialize settings and factory
    agent_factory = create_agent_factory(settings)
    
    # Initialize the context-aware router
    router = ContextAwareRouter(agent_factory)
    
    # HR-specific test queries
    hr_test_queries = [
        {
            "query": "I need to check my benefits",
            "expected_agent": "hr",
            "description": "Benefits inquiry"
        },
        {
            "query": "What is my PTO balance?",
            "expected_agent": "hr",
            "description": "PTO/vacation inquiry"
        },
        {
            "query": "HR policy question about remote work",
            "expected_agent": "hr",
            "description": "HR policy inquiry"
        },
        {
            "query": "Employee handbook inquiry",
            "expected_agent": "hr",
            "description": "Employee handbook access"
        },
        {
            "query": "I have a payroll question",
            "expected_agent": "hr",
            "description": "Payroll inquiry"
        },
        {
            "query": "Can you help me with HR forms?",
            "expected_agent": "hr",
            "description": "HR forms assistance"
        },
        {
            "query": "Benefits enrollment deadline",
            "expected_agent": "hr",
            "description": "Benefits enrollment"
        },
        {
            "query": "performance review schedule",
            "expected_agent": "hr",
            "description": "Performance review inquiry"
        },
    ]
    
    # Test each HR query
    success_count = 0
    total_count = len(hr_test_queries)
    
    for i, test_case in enumerate(hr_test_queries, 1):
        print(f"\n🧪 Test {i}/{total_count}: {test_case['description']}")
        print(f"   Query: '{test_case['query']}'")
        print(f"   Expected Agent: {test_case['expected_agent']}")
        
        try:
            # Create prompt input
            prompt_input = PromptIn(
                prompt=test_case['query'],
                session_id=f"hr_test_session_{i}",
                max_tokens=2000,
                temperature=0.7,
                stream=False
            )
            
            # Create request context
            context = RequestContext(prompt=prompt_input)
            
            # Route the query
            routing_result = await router.handle(context)
            
            # Check results
            actual_agent = routing_result.agent_type
            routing_method = getattr(routing_result, 'routing_method', 'unknown')
            confidence = getattr(routing_result, 'confidence', 'unknown')
            
            print(f"   Actual Agent: {actual_agent}")
            print(f"   Routing Method: {routing_method}")
            print(f"   Confidence: {confidence}")
            
            # Validate routing
            if actual_agent == test_case['expected_agent']:
                print(f"   ✅ SUCCESS: Correctly routed to HR agent")
                success_count += 1
            else:
                print(f"   ❌ FAILED: Expected '{test_case['expected_agent']}', got '{actual_agent}'")
                
                # Try to get additional debug info
                if hasattr(routing_result, 'debug_info'):
                    print(f"   Debug Info: {routing_result.debug_info}")
                    
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 HR Routing Integration Test Results")
    print("=" * 60)
    print(f"Total Tests: {total_count}")
    print(f"Successful: {success_count}")
    print(f"Failed: {total_count - success_count}")
    print(f"Success Rate: {(success_count/total_count)*100:.1f}%")
    
    if success_count == total_count:
        print("🎉 All HR queries routed correctly!")
    else:
        print("⚠️  Some HR queries failed to route correctly")
        print("\nDebugging suggestions:")
        print("- Check HR agent patterns in regex routing")
        print("- Verify LLM intent classifier descriptions")
        print("- Review learning router training data")
        print("- Ensure HR agent is properly registered")
    
    return success_count == total_count

async def test_hr_agent_availability():
    """Test that HR agent is available in the factory."""
    print("\n🔍 Testing HR Agent Availability")
    print("-" * 40)
    
    try:
        agent_factory = create_agent_factory(settings)
        
        # Check if HR agent is available
        available_agents = agent_factory.get_available_agent_types()
        print(f"Available agents: {available_agents}")
        
        if "hr" in available_agents:
            print("✅ HR agent is available in factory")
            
            # Try to create HR agent
            hr_agent = agent_factory.create_agent("hr")
            print(f"✅ HR agent created successfully: {type(hr_agent).__name__}")
            return True
        else:
            print("❌ HR agent not available in factory")
            print("   Check settings.plugins_enabled includes 'hr_agent'")
            return False
            
    except Exception as e:
        print(f"❌ Error testing HR agent availability: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_hr_routing_patterns():
    """Test HR routing patterns in isolation."""
    print("\n🎯 Testing HR Routing Patterns")
    print("-" * 40)
    
    try:
        # Note: Importing specific routing nodes is complex due to dependencies
        # This test would check individual regex patterns for HR
        print("   ℹ️  HR pattern testing requires running backend server")
        print("   ✅ Use the full integration test for comprehensive validation")
        
    except Exception as e:
        print(f"❌ Error testing HR routing patterns: {e}")
        import traceback
        traceback.print_exc()

async def main():
    """Main test function."""
    print("🚀 HR Agent Integration Test Suite")
    print("=" * 60)
    
    # Test 1: HR agent availability
    hr_available = await test_hr_agent_availability()
    
    if not hr_available:
        print("\n❌ HR agent not available. Cannot proceed with routing tests.")
        return False
    
    # Test 2: HR routing patterns
    await test_hr_routing_patterns()
    
    # Test 3: End-to-end HR routing
    routing_success = await test_hr_routing_integration()
    
    print(f"\n🏁 Overall Test Result: {'✅ PASS' if routing_success else '❌ FAIL'}")
    return routing_success

if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)
