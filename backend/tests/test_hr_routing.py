#!/usr/bin/env python3
"""
Quick test script to verify HR routing functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.domain.router_chain import SIMPLIFIED_ROUTING_RULES, DEFAULT_AGENT_DESCRIPTIONS
from app.domain.schemas import AgentType
import re

def test_hr_patterns():
    """Test HR routing patterns"""
    print("Testing HR routing patterns...")
    print("=" * 50)
    
    # Test queries that should route to HR
    hr_test_queries = [
        "How much vacation time do I have left?",
        "I need to request time off for next week",
        "What are my benefits options?",
        "How do I access the UKG system?",
        "Where can I check my PTO balance?",
        "I want to submit a payroll question",
        "What's the company policy on sick leave?",
        "How do I request family medical leave?",
        "Can you help me with UKG time entry?",
        "I need to see my vacation balance"
    ]
    
    # Find HR rules
    hr_rules = [rule for rule in SIMPLIFIED_ROUTING_RULES if rule.agent_type == AgentType.HR]
    
    print(f"Found {len(hr_rules)} HR routing rules:")
    for i, rule in enumerate(hr_rules, 1):
        print(f"  {i}. Priority {rule.priority}: {rule.pattern}")
    
    print("\nTesting queries:")
    print("-" * 30)
    
    for query in hr_test_queries:
        matched_rules = []
        for rule in hr_rules:
            if re.search(rule.pattern, query, re.IGNORECASE):
                matched_rules.append(rule)
        
        if matched_rules:
            highest_priority_rule = min(matched_rules, key=lambda r: r.priority)
            print(f"✓ '{query}' -> HR (Rule: {highest_priority_rule.pattern})")
        else:
            print(f"✗ '{query}' -> NO MATCH")
    
    print(f"\nHR Agent Description:")
    print(f"  {DEFAULT_AGENT_DESCRIPTIONS[AgentType.HR]}")

if __name__ == "__main__":
    test_hr_patterns()
