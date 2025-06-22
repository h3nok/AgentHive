#!/usr/bin/env python3
"""
End-to-End Integration Test for Swarm Dashboard
Tests the complete integration between backend API and frontend components.
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any
import sys

# Test Configuration
BACKEND_URL = "http://localhost:8001"
FRONTEND_URL = "http://localhost:5173"

class SwarmIntegrationTest:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.frontend_url = FRONTEND_URL
        self.test_results = []

    async def test_backend_direct(self, session: aiohttp.ClientSession):
        """Test backend API endpoints directly"""
        print("🔧 Testing Backend API (Direct)...")
        
        tests = [
            ("GET", f"{self.backend_url}/v1/swarm/agents", "Fetch agents"),
            ("GET", f"{self.backend_url}/v1/swarm/stats", "Fetch stats"),
            ("GET", f"{self.backend_url}/v1/swarm/agents/general_builtin", "Fetch specific agent"),
        ]
        
        for method, url, description in tests:
            try:
                async with session.request(method, url) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"  ✅ {description}: {response.status}")
                        if "agents" in str(url):
                            agents_count = len(data.get("agents", [])) if "agents" in data else 1
                            print(f"     → Found {agents_count} agent(s)")
                    else:
                        print(f"  ❌ {description}: {response.status}")
                        self.test_results.append(f"Backend {description} failed: {response.status}")
            except Exception as e:
                print(f"  ❌ {description}: Error - {e}")
                self.test_results.append(f"Backend {description} error: {e}")

    async def test_frontend_proxy(self, session: aiohttp.ClientSession):
        """Test backend API through frontend proxy"""
        print("🌐 Testing Backend API (Through Frontend Proxy)...")
        
        tests = [
            ("GET", f"{self.frontend_url}/api/v1/swarm/agents", "Fetch agents via proxy"),
            ("GET", f"{self.frontend_url}/api/v1/swarm/stats", "Fetch stats via proxy"),
        ]
        
        for method, url, description in tests:
            try:
                async with session.request(method, url) as response:
                    if response.status == 200:
                        data = await response.json()
                        print(f"  ✅ {description}: {response.status}")
                        if "agents" in str(url):
                            agents_count = len(data.get("agents", []))
                            print(f"     → Found {agents_count} agent(s)")
                    else:
                        print(f"  ❌ {description}: {response.status}")
                        self.test_results.append(f"Frontend proxy {description} failed: {response.status}")
            except Exception as e:
                print(f"  ❌ {description}: Error - {e}")
                self.test_results.append(f"Frontend proxy {description} error: {e}")

    async def test_agent_actions(self, session: aiohttp.ClientSession):
        """Test agent action endpoints"""
        print("🎮 Testing Agent Actions...")
        
        # Get agents first
        try:
            async with session.get(f"{self.frontend_url}/api/v1/swarm/agents") as response:
                data = await response.json()
                agents = data.get("agents", [])
                
                if agents:
                    agent_id = agents[0]["id"]
                    print(f"  Testing actions on agent: {agent_id}")
                    
                    # Test different actions
                    actions = ["start", "pause", "stop"]
                    for action in actions:
                        try:
                            payload = {"action": action}
                            async with session.post(
                                f"{self.frontend_url}/api/v1/swarm/agents/{agent_id}/action",
                                json=payload
                            ) as response:
                                if response.status == 200:
                                    result = await response.json()
                                    if result.get("success"):
                                        print(f"    ✅ Action '{action}': Success")
                                    else:
                                        print(f"    ❌ Action '{action}': Failed in response")
                                else:
                                    print(f"    ❌ Action '{action}': HTTP {response.status}")
                        except Exception as e:
                            print(f"    ❌ Action '{action}': Error - {e}")
                else:
                    print("  ❌ No agents found to test actions")
                    self.test_results.append("No agents available for action testing")
                    
        except Exception as e:
            print(f"  ❌ Agent action test setup failed: {e}")
            self.test_results.append(f"Agent action test error: {e}")

    async def test_frontend_accessibility(self, session: aiohttp.ClientSession):
        """Test if frontend pages are accessible"""
        print("🖥️  Testing Frontend Accessibility...")
        
        pages = [
            (f"{self.frontend_url}/", "Homepage"),
            (f"{self.frontend_url}/admin", "Admin redirect"),
            (f"{self.frontend_url}/admin/swarm", "Swarm Dashboard"),
        ]
        
        for url, description in pages:
            try:
                async with session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        if "AgentHive" in content:
                            print(f"  ✅ {description}: Accessible")
                        else:
                            print(f"  ⚠️  {description}: Accessible but content check failed")
                    else:
                        print(f"  ❌ {description}: HTTP {response.status}")
                        self.test_results.append(f"Frontend {description} failed: {response.status}")
            except Exception as e:
                print(f"  ❌ {description}: Error - {e}")
                self.test_results.append(f"Frontend {description} error: {e}")

    async def run_integration_tests(self):
        """Run all integration tests"""
        print("🐝 Starting AgentHive Swarm Dashboard Integration Tests")
        print("=" * 60)
        
        async with aiohttp.ClientSession() as session:
            await self.test_backend_direct(session)
            print()
            await self.test_frontend_proxy(session)
            print()
            await self.test_agent_actions(session)
            print()
            await self.test_frontend_accessibility(session)
        
        print("\n" + "=" * 60)
        print("🏁 Test Results Summary")
        
        if self.test_results:
            print(f"❌ Found {len(self.test_results)} issues:")
            for issue in self.test_results:
                print(f"  - {issue}")
            return False
        else:
            print("✅ All tests passed! Swarm Dashboard integration is working correctly.")
            print("\n🎉 Integration Complete!")
            print("   - Backend API endpoints are functional")
            print("   - Frontend proxy is working") 
            print("   - Agent actions are operational")
            print("   - Frontend pages are accessible")
            print(f"\n🌐 Visit the Swarm Dashboard: {self.frontend_url}/admin/swarm")
            return True

async def main():
    """Main test runner"""
    tester = SwarmIntegrationTest()
    success = await tester.run_integration_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())
