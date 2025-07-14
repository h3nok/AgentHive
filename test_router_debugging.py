#!/usr/bin/env python3
"""
Test script to examine router debugging and identify why routing defaults to general_inquiry.
This script sends various test messages to observe the routing behavior with comprehensive logging.
"""

import asyncio
import httpx
import json
import websockets
import time
from datetime import datetime

# Backend URLs
BACKEND_URL = "http://localhost:8001"
WS_DEBUG_URL = "ws://localhost:8001/api/debug/router_trace"
CHAT_URL = f"{BACKEND_URL}/api/debug/chat"  # Use debug chat endpoint
SESSION_URL = f"{BACKEND_URL}/v1/sessions"

# Test messages that should trigger different routing behaviors
test_messages = [
    {
        "category": "UKG Demo Triggers",
        "messages": [
            "I need to request vacation time",
            "vacation",
            "time off",
            "request time off",
            "I want to submit a time-off request",
            "Can I request vacation days?",
        ]
    },
    {
        "category": "IT Support queries", 
        "messages": [
            "I need help with my computer",
            "Can't access the system",
            "Software installation request",
            "Password reset needed",
            "VPN connection issues",
        ]
    },
    {
        "category": "HR-related queries",
        "messages": [
            "I need to check my benefits",
            "What is my PTO balance?",
            "HR policy question",
            "Employee handbook inquiry",
            "I have a payroll question",
            "Can you help me with HR forms?",
            "Benefits enrollment",
            "performance review",
        ]
    },
    {
        "category": "General queries",
        "messages": [
            "Hello",
            "How are you?",
            "What can you help me with?",
            "General information",
            "Tell me about your capabilities",
        ]
    },
    {
        "category": "Ambiguous queries",
        "messages": [
            "I need help",
            "Can you assist me?",
            "I have a question",
            "What should I do?",
            "Please help",
        ]
    }
]

async def test_websocket_debug():
    """Test WebSocket debug connection to capture router traces."""
    print("🔍 Testing WebSocket debug connection...")
    try:
        async with websockets.connect(WS_DEBUG_URL) as websocket:
            print("✅ WebSocket debug connection established")
            
            # Listen for a few seconds to see if any traces come through
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                print(f"📨 Received debug trace: {message}")
            except asyncio.TimeoutError:
                print("⏰ No debug traces received within 3 seconds")
                
    except Exception as e:
        print(f"❌ WebSocket debug connection failed: {e}")

async def test_chat_message(client: httpx.AsyncClient, message: str, category: str):
    """Send a chat message and analyze the response."""
    print(f"\n🧪 Testing: '{message}' (Category: {category})")
    
    # Test both debug endpoints to see which one works
    endpoints_to_test = [
        {
            "name": "Simple Debug (/api/debug/chat)",
            "url": f"{BACKEND_URL}/api/debug/chat",
            "payload": {
                "prompt": message,
                "session_id": f"test_session_{int(time.time() * 1000)}",
                "stream": False
            }
        },
        {
            "name": "V1 Debug (/v1/debug/chat)",
            "url": f"{BACKEND_URL}/v1/debug/chat",
            "payload": {
                "prompt": message,
                "session_id": f"test_session_{int(time.time() * 1000)}",
                "stream": False
            }
        }
    ]
    
    for endpoint in endpoints_to_test:
        try:
            print(f"   Testing {endpoint['name']}...")
            response = await client.post(endpoint['url'], json=endpoint['payload'])
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ {endpoint['name']} - Response received:")
                print(f"      Agent Type: {data.get('agent_type', 'unknown')}")
                print(f"      Intent: {data.get('metadata', {}).get('intent', 'unknown')}")
                print(f"      Confidence: {data.get('metadata', {}).get('confidence', 'unknown')}")
                print(f"      Routing Method: {data.get('metadata', {}).get('routing_method', 'unknown')}")
                
                # Check if this defaulted to general/test (mock response)
                if data.get('agent_type') == 'general' and data.get('metadata', {}).get('intent') == 'test':
                    print(f"      ⚠️  USING MOCK RESPONSE")
                elif endpoint['name'].startswith("V1"):
                    print(f"      🎯 REAL ROUTER RESPONSE!")
                    
            else:
                print(f"   ❌ {endpoint['name']} failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"      Error: {error_data}")
                except:
                    print(f"      Error: {response.text}")
        except Exception as e:
            print(f"   ❌ {endpoint['name']} Exception: {e}")
        
        await asyncio.sleep(0.5)  # Brief pause between endpoint tests

async def test_health_endpoints(client: httpx.AsyncClient):
    """Test backend health and debug endpoints."""
    print("🏥 Testing backend health endpoints...")
    
    endpoints = [
        "/api/debug/health",
        "/api/debug/router",
        "/docs",
    ]
    
    for endpoint in endpoints:
        try:
            response = await client.get(f"{BACKEND_URL}{endpoint}")
            if response.status_code == 200:
                print(f"✅ {endpoint}: OK")
            else:
                print(f"❌ {endpoint}: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint}: {e}")

async def main():
    """Main test function."""
    print("🚀 Starting Router Debugging Test")
    print("=" * 60)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test backend health
        await test_health_endpoints(client)
        
        # Test WebSocket debug connection
        await test_websocket_debug()
        
        print("\n" + "=" * 60)
        print("🎯 Testing Chat Messages with Router Debugging")
        print("=" * 60)
        
        # Test each category of messages
        for test_category in test_messages:
            category_name = test_category["category"]
            messages = test_category["messages"]
            
            print(f"\n📁 Testing Category: {category_name}")
            print("-" * 40)
            
            for message in messages:
                await test_chat_message(client, message, category_name)
                await asyncio.sleep(1)  # Brief pause between requests
        
        print("\n" + "=" * 60)
        print("✅ Router Debugging Test Complete")
        print("=" * 60)
        
        print("\n📋 Summary:")
        print("- Check the backend logs for detailed router debugging information")
        print("- Look for emoji indicators (🎯, 🤖, ⚠️, etc.) in the router_chain.py logs")
        print("- Identify which messages defaulted to general_inquiry")
        print("- Review confidence scores and validation failures")

if __name__ == "__main__":
    asyncio.run(main())
