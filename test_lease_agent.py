#!/usr/bin/env python3
"""
Test script to validate the lease agent synthetic data integration
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'app'))

from plugins.lease_agent.agent import LeaseAgent
from core.context import Context
from core.prompt import Prompt

def test_lease_agent():
    """Test the lease agent with synthetic data"""
    print("Testing Lease Agent with Synthetic Data")
    print("=" * 50)
    
    # Initialize the lease agent
    agent = LeaseAgent()
    
    # Test 1: Check if synthetic data loads
    print("\n1. Testing synthetic data loading...")
    try:
        knowledge_base = agent._load_knowledge_base()
        if 'lease_data' in knowledge_base:
            lease_count = len(knowledge_base['lease_data'])
            print(f"✓ Successfully loaded {lease_count} lease records")
            
            # Show a sample lease
            if lease_count > 0:
                sample_lease = knowledge_base['lease_data'][0]
                print(f"✓ Sample lease: Store {sample_lease['store_number']} - {sample_lease['property_address']}")
        else:
            print("✗ No lease data found in knowledge base")
    except Exception as e:
        print(f"✗ Error loading synthetic data: {e}")
    
    # Test 2: Test prompt enhancement with different query types
    print("\n2. Testing prompt enhancement...")
    test_queries = [
        "Show me all lease information",
        "Which leases are expiring soon?",
        "Create a table of all properties",
        "What is the total portfolio value?"
    ]
    
    for query in test_queries:
        print(f"\nTesting query: '{query}'")
        try:
            # Create a simple context and prompt
            context = Context()
            context.prompt = Prompt(content=query)
            context.prompt.history = []
            
            # Test prompt enhancement
            enhanced_prompt = agent._enhance_prompt_with_knowledge(context, query)
            if "TSC Portfolio Summary" in enhanced_prompt or "lease_data" in enhanced_prompt:
                print("✓ Prompt enhanced with lease data")
            else:
                print("○ Prompt not enhanced (may be expected for this query type)")
        except Exception as e:
            print(f"✗ Error enhancing prompt: {e}")
    
    print("\n" + "=" * 50)
    print("Lease Agent Test Complete")

if __name__ == "__main__":
    test_lease_agent()
