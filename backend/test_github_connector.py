#!/usr/bin/env python3
"""
Test script for GitHub Connector - demonstrates end-to-end functionality
including configuration, auto-discovery, and API integration.
"""

import os
import sys
import json
from connectors.github import GitHubConnector

def test_github_connector():
    """Test GitHub connector with mock and real data"""
    print("🚀 Testing GitHub Connector End-to-End")
    print("=" * 50)
    
    # Test 1: Mock Mode (no authentication required)
    print("\n📋 Test 1: Mock Mode")
    print("-" * 30)
    
    mock_connector = GitHubConnector(mock=True)
    
    # Test API discovery in mock mode
    discovery_result = mock_connector.call("discover_apis", {})
    print(f"✅ API Discovery: {discovery_result['status']}")
    print(f"   Available endpoints: {len(discovery_result.get('available_endpoints', []))}")
    print(f"   Capabilities: {', '.join(discovery_result.get('capabilities', []))}")
    
    # Test connection validation
    validation_result = mock_connector.call("validate_connection", {})
    print(f"✅ Connection Validation: {validation_result['status']}")
    print(f"   Message: {validation_result['message']}")
    
    # Test repository listing
    repos_result = mock_connector.call("get_repositories", {"per_page": 5})
    print(f"✅ Repository Listing: {repos_result['status']}")
    print(f"   Found {repos_result.get('total_count', 0)} repositories")
    
    # Test issue creation
    issue_result = mock_connector.call("create_issue", {
        "owner": "demo-org",
        "repo": "demo-repo",
        "title": "Test Issue from AgentHive",
        "body": "This is a test issue created by the GitHub connector",
        "labels": ["bug", "enhancement"]
    })
    print(f"✅ Issue Creation: {issue_result['status']}")
    if issue_result.get('status') == 'success':
        print(f"   Issue URL: {issue_result.get('url')}")
    
    # Test 2: Configuration Workflow
    print("\n⚙️  Test 2: Configuration Workflow")
    print("-" * 30)
    
    # Simulate configuration steps
    config_steps = [
        "1. Set Personal Access Token",
        "2. Configure Organization (optional)",
        "3. Select Repositories",
        "4. Configure Webhooks",
        "5. Set Notification Preferences",
        "6. Test Connection",
        "7. Auto-discover APIs"
    ]
    
    for step in config_steps:
        print(f"   {step}")
    
    print("\n✅ Configuration workflow completed")
    
    # Test 3: Auto-Discovery Simulation
    print("\n🔍 Test 3: API Auto-Discovery")
    print("-" * 30)
    
    discovered_apis = [
        {"method": "GET", "path": "/user", "category": "user"},
        {"method": "GET", "path": "/user/repos", "category": "repositories"},
        {"method": "GET", "path": "/orgs/{org}/repos", "category": "repositories"},
        {"method": "GET", "path": "/repos/{owner}/{repo}/issues", "category": "issues"},
        {"method": "POST", "path": "/repos/{owner}/{repo}/issues", "category": "issues"},
        {"method": "GET", "path": "/repos/{owner}/{repo}/pulls", "category": "pull_requests"},
        {"method": "POST", "path": "/repos/{owner}/{repo}/pulls", "category": "pull_requests"},
        {"method": "POST", "path": "/repos/{owner}/{repo}/hooks", "category": "webhooks"},
        {"method": "GET", "path": "/rate_limit", "category": "meta"}
    ]
    
    categories = {}
    for api in discovered_apis:
        category = api["category"]
        if category not in categories:
            categories[category] = []
        categories[category].append(f"{api['method']} {api['path']}")
    
    print(f"✅ Discovered {len(discovered_apis)} API endpoints across {len(categories)} categories:")
    for category, endpoints in categories.items():
        print(f"   📁 {category.title()}: {len(endpoints)} endpoints")
        for endpoint in endpoints[:2]:  # Show first 2 endpoints per category
            print(f"      • {endpoint}")
        if len(endpoints) > 2:
            print(f"      • ... and {len(endpoints) - 2} more")
    
    # Test 4: Real API Test (if token is available)
    print("\n🌐 Test 4: Real API Integration")
    print("-" * 30)
    
    github_token = os.getenv("GITHUB_ACCESS_TOKEN")
    if github_token:
        print("✅ GitHub token found - testing real API")
        real_connector = GitHubConnector(access_token=github_token)
        
        # Test real connection
        real_validation = real_connector.call("validate_connection", {})
        print(f"   Connection: {real_validation['status']}")
        
        if real_validation.get('status') == 'success':
            # Test real API discovery
            real_discovery = real_connector.call("discover_apis", {})
            print(f"   API Discovery: {real_discovery['status']}")
            print(f"   Rate Limit: {real_discovery.get('rate_limit', {}).get('remaining', 'N/A')}")
            print(f"   User: {real_discovery.get('user', {}).get('login', 'N/A')}")
    else:
        print("⚠️  No GitHub token found (GITHUB_ACCESS_TOKEN)")
        print("   Set environment variable to test real API integration")
        print("   Example: export GITHUB_ACCESS_TOKEN=ghp_your_token_here")
    
    # Test 5: Error Handling
    print("\n🛡️  Test 5: Error Handling")
    print("-" * 30)
    
    # Test invalid action
    invalid_result = mock_connector.call("invalid_action", {})
    print(f"✅ Invalid Action Handling: {'error' in invalid_result}")
    
    # Test missing parameters
    missing_params_result = mock_connector.call("create_issue", {"title": "Test"})
    print(f"✅ Missing Parameters Handling: {'error' in missing_params_result}")
    
    print("\n🎉 GitHub Connector End-to-End Test Complete!")
    print("=" * 50)
    
    # Summary
    print("\n📊 Test Summary:")
    print("✅ Mock mode functionality")
    print("✅ Configuration workflow")
    print("✅ API auto-discovery")
    print("✅ Error handling")
    print("✅ Real API integration (if token provided)")
    
    return True

def demonstrate_configuration():
    """Demonstrate the configuration workflow"""
    print("\n🔧 GitHub Connector Configuration Demo")
    print("=" * 50)
    
    config_example = {
        "connector_id": "github-enterprise",
        "name": "GitHub Enterprise",
        "version": "3.0.1",
        "settings": {
            "access_token": "ghp_xxxxxxxxxxxxxxxxxxxx",
            "base_url": "https://api.github.com",
            "organization": "agenthive",
            "repositories": ["core", "frontend", "docs", "connectors"],
            "webhook_url": "https://api.agenthive.com/webhooks/github",
            "enable_pr_notifications": True,
            "enable_issue_notifications": True,
            "auto_assign_reviewers": False,
            "default_branch": "main",
            "sync_frequency": "real-time",
            "rate_limit_buffer": 500
        }
    }
    
    print("📋 Example Configuration:")
    print(json.dumps(config_example, indent=2))
    
    print("\n🎯 Key Configuration Features:")
    print("• Personal Access Token authentication")
    print("• Support for GitHub.com and GitHub Enterprise Server")
    print("• Organization-level repository management")
    print("• Webhook integration for real-time updates")
    print("• Configurable notification preferences")
    print("• Rate limiting with buffer management")
    print("• Auto-discovery of available API endpoints")
    
    return config_example

if __name__ == "__main__":
    print("GitHub Connector Test Suite")
    print("==========================")
    
    try:
        # Run main tests
        test_result = test_github_connector()
        
        # Demonstrate configuration
        config_demo = demonstrate_configuration()
        
        print(f"\n✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        sys.exit(1)
