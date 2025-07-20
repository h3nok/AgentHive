#!/usr/bin/env python3
"""
Simple test script for GitHub Connector API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8001/api/v1/connectors/github"

def test_endpoints():
    print("🚀 Testing GitHub Connector API Endpoints")
    print("=" * 50)
    
    # Test 1: Health endpoint
    print("\n1️⃣ Testing Health Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
    
    # Test 2: Capabilities endpoint
    print("\n2️⃣ Testing Capabilities Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/capabilities", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=4)}")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
    
    # Test 3: Test Connection endpoint (mock mode)
    print("\n3️⃣ Testing Connection Endpoint (Mock Mode)")
    test_data = {
        "token": "mock_token",
        "base_url": "https://api.github.com",
        "organization": "test-org",
        "mock_mode": True
    }
    try:
        response = requests.post(
            f"{BASE_URL}/test-connection",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=4)}")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
    
    # Test 4: Discover APIs endpoint (mock mode)
    print("\n4️⃣ Testing Discover APIs Endpoint (Mock Mode)")
    discover_data = {
        "token": "mock_token",
        "base_url": "https://api.github.com",
        "mock_mode": True
    }
    try:
        response = requests.post(
            f"{BASE_URL}/discover-apis",
            json=discover_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=4)}")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
    
    print("\n" + "=" * 50)
    print("✅ GitHub Connector API Test Complete!")

if __name__ == "__main__":
    test_endpoints()
