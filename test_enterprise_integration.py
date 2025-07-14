#!/usr/bin/env python3
"""
AgentHive Enterprise Integration Test.

This script tests the complete enterprise copilot integration including:
1. MCP servers startup
2. Backend agent registration  
3. Enterprise tool integration
4. Agent-to-tool communication

Run this after setting up both backend and MCP servers.
"""

import asyncio
import json
import logging
import requests
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, Any, List

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test configuration
BACKEND_URL = "http://localhost:8000"
MCP_SERVERS = [
    {"name": "Active Directory", "port": 3001, "endpoint": "/mcp"},
    {"name": "JIRA ITSM", "port": 3002, "endpoint": "/mcp"},
    {"name": "Concur Expense", "port": 3011, "endpoint": "/mcp"}
]

class AgentHiveIntegrationTest:
    """Complete integration test for AgentHive enterprise features."""
    
    def __init__(self):
        self.test_results = []
        self.mcp_processes = []
    
    def run_all_tests(self):
        """Run complete integration test suite."""
        logger.info("🚀 Starting AgentHive Enterprise Integration Test")
        
        try:
            # 1. Test MCP servers
            self.test_mcp_servers()
            
            # 2. Test backend health
            self.test_backend_health()
            
            # 3. Test agent registration
            self.test_agent_registration()
            
            # 4. Test enterprise tool integration
            self.test_enterprise_tools()
            
            # 5. Test end-to-end agent workflows
            self.test_agent_workflows()
            
            # Print results summary
            self.print_test_summary()
            
        except Exception as e:
            logger.error(f"Integration test failed: {e}")
            return False
        finally:
            self.cleanup()
        
        return all(result["passed"] for result in self.test_results)
    
    def test_mcp_servers(self):
        """Test that all MCP servers are running and responsive."""
        logger.info("📡 Testing MCP Servers...")
        
        for server in MCP_SERVERS:
            try:
                url = f"http://localhost:{server['port']}{server['endpoint']}"
                
                # Test initialize request
                init_payload = {
                    "jsonrpc": "2.0",
                    "id": "test",
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {"tools": {}},
                        "clientInfo": {"name": "test", "version": "1.0"}
                    }
                }
                
                response = requests.post(url, json=init_payload, timeout=5)
                response.raise_for_status()
                
                result = response.json()
                if result.get("result", {}).get("serverInfo"):
                    self.test_results.append({
                        "test": f"MCP Server: {server['name']}",
                        "passed": True,
                        "message": f"Server running on port {server['port']}"
                    })
                    logger.info(f"✅ {server['name']} - OK")
                else:
                    raise Exception("Invalid response format")
                    
            except Exception as e:
                self.test_results.append({
                    "test": f"MCP Server: {server['name']}",
                    "passed": False, 
                    "message": f"Failed: {e}"
                })
                logger.error(f"❌ {server['name']} - FAILED: {e}")
    
    def test_backend_health(self):
        """Test AgentHive backend health and API endpoints."""
        logger.info("🏥 Testing Backend Health...")
        
        try:
            # Test health endpoint
            response = requests.get(f"{BACKEND_URL}/health", timeout=10)
            response.raise_for_status()
            
            health_data = response.json()
            if health_data.get("status") == "healthy":
                self.test_results.append({
                    "test": "Backend Health",
                    "passed": True,
                    "message": "Backend is healthy"
                })
                logger.info("✅ Backend Health - OK")
            else:
                raise Exception(f"Unhealthy status: {health_data}")
                
        except Exception as e:
            self.test_results.append({
                "test": "Backend Health",
                "passed": False,
                "message": f"Failed: {e}"
            })
            logger.error(f"❌ Backend Health - FAILED: {e}")
    
    def test_agent_registration(self):
        """Test that all enterprise agents are registered."""
        logger.info("👥 Testing Agent Registration...")
        
        expected_agents = ["IT", "FINANCE", "HR"]
        
        try:
            response = requests.get(f"{BACKEND_URL}/agents", timeout=10)
            response.raise_for_status()
            
            agents_data = response.json()
            registered_agents = [agent.get("agent_type") for agent in agents_data.get("agents", [])]
            
            for agent_type in expected_agents:
                if agent_type in registered_agents:
                    self.test_results.append({
                        "test": f"Agent Registration: {agent_type}",
                        "passed": True,
                        "message": f"{agent_type} agent is registered"
                    })
                    logger.info(f"✅ {agent_type} Agent - Registered")
                else:
                    self.test_results.append({
                        "test": f"Agent Registration: {agent_type}",
                        "passed": False,
                        "message": f"{agent_type} agent not found"
                    })
                    logger.error(f"❌ {agent_type} Agent - NOT REGISTERED")
                    
        except Exception as e:
            self.test_results.append({
                "test": "Agent Registration",
                "passed": False,
                "message": f"Failed: {e}"
            })
            logger.error(f"❌ Agent Registration - FAILED: {e}")
    
    def test_enterprise_tools(self):
        """Test enterprise tool integration through MCP."""
        logger.info("🔧 Testing Enterprise Tools...")
        
        # Test Active Directory user search
        self.test_ad_user_search()
        
        # Test JIRA ticket creation
        self.test_jira_ticket_creation()
        
        # Test Concur expense report
        self.test_concur_expense_report()
    
    def test_ad_user_search(self):
        """Test Active Directory user search functionality."""
        try:
            url = "http://localhost:3001/mcp"
            payload = {
                "jsonrpc": "2.0",
                "id": "test",
                "method": "tools/call",
                "params": {
                    "name": "search_user",
                    "arguments": {
                        "identifier": "jdoe",
                        "fields": ["email", "department", "groups"]
                    }
                }
            }
            
            response = requests.post(url, json=payload, timeout=5)
            response.raise_for_status()
            
            result = response.json()
            if result.get("result", {}).get("success"):
                self.test_results.append({
                    "test": "AD User Search",
                    "passed": True,
                    "message": "User search successful"
                })
                logger.info("✅ AD User Search - OK")
            else:
                raise Exception("User search failed")
                
        except Exception as e:
            self.test_results.append({
                "test": "AD User Search",
                "passed": False,
                "message": f"Failed: {e}"
            })
            logger.error(f"❌ AD User Search - FAILED: {e}")
    
    def test_jira_ticket_creation(self):
        """Test JIRA ticket creation functionality."""
        try:
            url = "http://localhost:3002/mcp"
            payload = {
                "jsonrpc": "2.0",
                "id": "test",
                "method": "tools/call",
                "params": {
                    "name": "create_ticket",
                    "arguments": {
                        "summary": "Integration test ticket",
                        "description": "Test ticket created by integration test",
                        "priority": "Low",
                        "category": "Testing"
                    }
                }
            }
            
            response = requests.post(url, json=payload, timeout=5)
            response.raise_for_status()
            
            result = response.json()
            if result.get("result", {}).get("success"):
                ticket_id = result["result"].get("ticket_id")
                self.test_results.append({
                    "test": "JIRA Ticket Creation",
                    "passed": True,
                    "message": f"Ticket created: {ticket_id}"
                })
                logger.info(f"✅ JIRA Ticket Creation - OK ({ticket_id})")
            else:
                raise Exception("Ticket creation failed")
                
        except Exception as e:
            self.test_results.append({
                "test": "JIRA Ticket Creation",
                "passed": False,
                "message": f"Failed: {e}"
            })
            logger.error(f"❌ JIRA Ticket Creation - FAILED: {e}")
    
    def test_concur_expense_report(self):
        """Test Concur expense report creation."""
        try:
            url = "http://localhost:3011/mcp"
            payload = {
                "jsonrpc": "2.0",
                "id": "test",
                "method": "tools/call",
                "params": {
                    "name": "create_expense_report",
                    "arguments": {
                        "employee_id": "EMP001",
                        "business_purpose": "Integration testing",
                        "expenses": [
                            {
                                "amount": 25.00,
                                "description": "Test expense",
                                "category": "testing",
                                "date": "2025-01-10"
                            }
                        ]
                    }
                }
            }
            
            response = requests.post(url, json=payload, timeout=5)
            response.raise_for_status()
            
            result = response.json()
            if result.get("result", {}).get("success"):
                report_id = result["result"].get("report_id")
                self.test_results.append({
                    "test": "Concur Expense Report",
                    "passed": True,
                    "message": f"Report created: {report_id}"
                })
                logger.info(f"✅ Concur Expense Report - OK ({report_id})")
            else:
                raise Exception("Expense report creation failed")
                
        except Exception as e:
            self.test_results.append({
                "test": "Concur Expense Report",
                "passed": False,
                "message": f"Failed: {e}"
            })
            logger.error(f"❌ Concur Expense Report - FAILED: {e}")
    
    def test_agent_workflows(self):
        """Test end-to-end agent workflows."""
        logger.info("🤖 Testing Agent Workflows...")
        
        # Test IT agent password reset workflow
        self.test_it_password_reset_workflow()
        
        # Test Finance agent expense workflow
        self.test_finance_expense_workflow()
    
    def test_it_password_reset_workflow(self):
        """Test IT agent handling a password reset request."""
        try:
            # Simulate IT agent request
            payload = {
                "prompt": "Please reset password for user jdoe",
                "agent_type": "IT",
                "session_id": "test-session"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/chat", 
                json=payload, 
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            response_content = result.get("content", "").lower()
            
            # Check if response indicates password reset was attempted
            if ("password" in response_content and 
                ("reset" in response_content or "temporary" in response_content)):
                self.test_results.append({
                    "test": "IT Password Reset Workflow",
                    "passed": True,
                    "message": "IT agent handled password reset request"
                })
                logger.info("✅ IT Password Reset Workflow - OK")
            else:
                raise Exception("IT agent did not handle password reset properly")
                
        except Exception as e:
            self.test_results.append({
                "test": "IT Password Reset Workflow",
                "passed": False,
                "message": f"Failed: {e}"
            })
            logger.error(f"❌ IT Password Reset Workflow - FAILED: {e}")
    
    def test_finance_expense_workflow(self):
        """Test Finance agent handling an expense report request."""
        try:
            payload = {
                "prompt": "I need to submit an expense report for $50 hotel expense from yesterday",
                "agent_type": "FINANCE",
                "session_id": "test-session"
            }
            
            response = requests.post(
                f"{BACKEND_URL}/chat",
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            response_content = result.get("content", "").lower()
            
            # Check if response indicates expense handling
            if ("expense" in response_content and 
                ("report" in response_content or "submit" in response_content)):
                self.test_results.append({
                    "test": "Finance Expense Workflow",
                    "passed": True,
                    "message": "Finance agent handled expense request"
                })
                logger.info("✅ Finance Expense Workflow - OK")
            else:
                raise Exception("Finance agent did not handle expense properly")
                
        except Exception as e:
            self.test_results.append({
                "test": "Finance Expense Workflow",
                "passed": False,
                "message": f"Failed: {e}"
            })
            logger.error(f"❌ Finance Expense Workflow - FAILED: {e}")
    
    def print_test_summary(self):
        """Print comprehensive test results summary."""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["passed"])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "="*80)
        print("🧪 AGENTHIVE ENTERPRISE INTEGRATION TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["passed"]:
                    print(f"  • {result['test']}: {result['message']}")
            print()
        
        print("✅ PASSED TESTS:")
        for result in self.test_results:
            if result["passed"]:
                print(f"  • {result['test']}")
        
        print("\n" + "="*80)
        
        if failed_tests == 0:
            print("🎉 ALL TESTS PASSED! AgentHive Enterprise Integration is working!")
        else:
            print("⚠️  Some tests failed. Please check the issues above.")
        
        print("="*80)
    
    def cleanup(self):
        """Clean up test resources."""
        logger.info("🧹 Cleaning up test resources...")


def main():
    """Run the integration test."""
    print("🚀 AgentHive Enterprise Integration Test")
    print("=" * 50)
    print("This test validates the complete enterprise copilot setup:")
    print("• MCP servers connectivity")  
    print("• Backend health and agent registration")
    print("• Enterprise tool integration")
    print("• End-to-end agent workflows")
    print()
    
    # Check if user wants to proceed
    proceed = input("Proceed with integration test? (y/N): ").lower().strip()
    if proceed != 'y':
        print("Test cancelled.")
        return
    
    test_runner = AgentHiveIntegrationTest()
    success = test_runner.run_all_tests()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
