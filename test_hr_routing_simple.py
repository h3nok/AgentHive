#!/usr/bin/env python3
"""
Simplified HR routing integration test.
Tests HR agent routing without importing Prometheus metrics modules.
"""

import sys
import os
sys.path.insert(0, '/Users/henokghebrechristos/Repo/TSC/chattsc/backend')

import asyncio
import httpx
from backend.app.core.settings import settings

class SimpleHRRoutingTest:
    """Simple HR routing test using direct API calls."""
    
    def __init__(self):
        self.base_url = "http://localhost:8000"
        
    async def test_hr_agent_availability(self):
        """Test if HR agent is available in the system."""
        print("\n=== Testing HR Agent Availability ===")
        
        try:
            async with httpx.AsyncClient() as client:
                # Test agents endpoint to see if HR agent is listed
                response = await client.get(f"{self.base_url}/api/v1/agents")
                
                if response.status_code == 200:
                    agents = response.json()
                    agent_types = [agent.get('type', agent.get('agent_type', 'unknown')) for agent in agents]
                    print(f"Available agents: {agent_types}")
                    
                    if 'hr' in agent_types or 'HR' in agent_types:
                        print("✅ HR agent found in available agents")
                        return True
                    else:
                        print("❌ HR agent not found in available agents")
                        return False
                else:
                    print(f"❌ Failed to fetch agents: {response.status_code}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error testing HR agent availability: {e}")
            return False
    
    async def test_hr_routing_queries(self):
        """Test HR-specific queries to see if they route to HR agent."""
        print("\n=== Testing HR Query Routing ===")
        
        hr_test_queries = [
            "How many vacation days do I have remaining?",
            "What is the company's remote work policy?",
            "I need help with my benefits enrollment",
            "Can you explain the healthcare plan options?",
            "How do I submit a PTO request?",
            "What are the employee handbook guidelines?",
            "I have questions about payroll deductions",
            "Tell me about the company retirement plan"
        ]
        
        successful_routes = 0
        
        try:
            async with httpx.AsyncClient() as client:
                for i, query in enumerate(hr_test_queries, 1):
                    print(f"\nTest {i}: {query}")
                    
                    # Send chat request
                    payload = {
                        "message": query,
                        "session_id": f"test_session_hr_{i}",
                        "max_tokens": 150,
                        "temperature": 0.7
                    }
                    
                    response = await client.post(
                        f"{self.base_url}/api/v1/chat",
                        json=payload,
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        # Check if response indicates HR agent was used
                        agent_type = data.get('agent_type', 'unknown')
                        response_text = data.get('response', '').lower()
                        
                        print(f"   Agent used: {agent_type}")
                        print(f"   Response preview: {data.get('response', '')[:100]}...")
                        
                        # Consider it successful if agent_type is 'hr' or response mentions HR-related terms
                        if (agent_type.lower() == 'hr' or 
                            any(term in response_text for term in ['hr', 'human resources', 'benefits', 'pto', 'vacation', 'policy'])):
                            print("   ✅ Successfully routed to HR agent or HR-related response")
                            successful_routes += 1
                        else:
                            print("   ⚠️  Routing unclear - may not have reached HR agent")
                    else:
                        print(f"   ❌ Request failed: {response.status_code}")
                        if response.status_code == 422:
                            print(f"   Error details: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing HR routing: {e}")
        
        print(f"\n=== HR Routing Summary ===")
        print(f"Successful HR routes: {successful_routes}/{len(hr_test_queries)}")
        success_rate = (successful_routes / len(hr_test_queries)) * 100
        print(f"Success rate: {success_rate:.1f}%")
        
        return success_rate >= 50  # Consider 50%+ success rate as passing
    
    async def test_backend_connectivity(self):
        """Test basic backend connectivity."""
        print("\n=== Testing Backend Connectivity ===")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/health", timeout=10.0)
                
                if response.status_code == 200:
                    print("✅ Backend is running and responsive")
                    return True
                else:
                    print(f"❌ Backend health check failed: {response.status_code}")
                    return False
                    
        except httpx.ConnectError:
            print("❌ Cannot connect to backend - make sure it's running on localhost:8000")
            return False
        except Exception as e:
            print(f"❌ Backend connectivity error: {e}")
            return False
    
    async def run_all_tests(self):
        """Run all HR routing tests."""
        print("🔍 Starting HR Agent Routing Integration Tests")
        print("=" * 60)
        
        # Test backend connectivity first
        if not await self.test_backend_connectivity():
            print("\n❌ Cannot proceed with tests - backend not available")
            return False
        
        # Test HR agent availability
        hr_available = await self.test_hr_agent_availability()
        
        # Test HR routing regardless of agent availability (may work through fallback)
        routing_success = await self.test_hr_routing_queries()
        
        print("\n" + "=" * 60)
        print("🏁 HR Routing Integration Test Results:")
        print(f"   Backend connectivity: ✅")
        print(f"   HR agent available: {'✅' if hr_available else '❌'}")
        print(f"   HR routing functional: {'✅' if routing_success else '❌'}")
        
        overall_success = hr_available and routing_success
        print(f"\n🎯 Overall test result: {'✅ PASS' if overall_success else '❌ FAIL'}")
        
        if not overall_success:
            print("\n💡 Next steps:")
            if not hr_available:
                print("   - Ensure HR agent plugin is properly enabled in settings")
                print("   - Check that HR agent is registered in the agent factory")
            if not routing_success:
                print("   - Verify HR routing patterns are configured")
                print("   - Check router logs for routing decisions")
                print("   - Ensure LLM intent classifier recognizes HR queries")
        
        return overall_success

async def main():
    """Run the HR routing integration test."""
    test = SimpleHRRoutingTest()
    success = await test.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
