#!/usr/bin/env python3
"""
Test the lease agent knowledge base loading functionality
"""
import sys
import os
import json
from typing import Dict, Any

def test_knowledge_base_loading():
    """Test the knowledge base loading logic from the lease agent"""
    
    # Simulate the _load_knowledge_base method logic
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "backend/app/data/lease_synthetic_data.json")
    
    print("Testing Lease Agent Knowledge Base Loading")
    print("=" * 50)
    print(f"Data file path: {data_path}")
    print(f"File exists: {os.path.exists(data_path)}")
    
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            lease_data = json.load(f)
            print(f"✓ Loaded {len(lease_data.get('leases', []))} lease records")
    except FileNotFoundError:
        print("✗ Lease data file not found")
        lease_data = {"leases": [], "summary_statistics": {}}
    except Exception as e:
        print(f"✗ Error loading lease data: {e}")
        lease_data = {"leases": [], "summary_statistics": {}}
    
    # Simulate the knowledge base structure
    knowledge_base = {
        "lease_data": lease_data,
        "lease_terms": {
            "standard_term": "12 months",
            "short_term_available": True,
            "renewal_options": ["6 months", "12 months", "24 months"]
        }
    }
    
    # Test data access patterns
    print(f"\nKnowledge Base Structure:")
    print(f"- lease_data type: {type(knowledge_base['lease_data'])}")
    
    lease_data_kb = knowledge_base.get("lease_data", {})
    leases = lease_data_kb.get("leases", [])
    summary = lease_data_kb.get("summary_statistics", {})
    
    print(f"- Number of leases: {len(leases)}")
    print(f"- Has summary statistics: {bool(summary)}")
    
    if summary:
        print(f"\nPortfolio Summary:")
        for key, value in summary.items():
            if isinstance(value, (int, float)):
                if 'rent' in key.lower() or 'value' in key.lower():
                    print(f"  {key}: ${value:,.2f}")
                else:
                    print(f"  {key}: {value:,}")
            else:
                print(f"  {key}: {value}")
    
    if leases:
        print(f"\nSample Lease (Store {leases[0]['store_number']}):")
        sample = leases[0]
        print(f"  Address: {sample['address']['street']}, {sample['address']['city']}")
        print(f"  Lease Term: {sample['lease_details']['lease_start_date']} to {sample['lease_details']['lease_end_date']}")
        print(f"  Base Rent: ${sample['financial_details']['base_rent_annual']:,.2f}/year")
        print(f"  Property Type: {sample['property_details']['property_class']}")
    
    # Test query enhancement patterns
    print(f"\nTesting Query Enhancement Patterns:")
    test_queries = [
        "Show me all lease information",
        "Which leases are expiring soon?", 
        "Create a table of all properties",
        "What are the rent responsibilities?"
    ]
    
    for query in test_queries:
        query_lower = query.lower()
        enhanced = False
        
        if leases and any(term in query_lower for term in [
            "lease", "rent", "property", "store", "expir", "renew", "tenant", "landlord", 
            "responsibility", "repair", "hvac", "roof", "parking", "square", "sqft", "nnn"
        ]):
            enhanced = True
            
        print(f"  '{query}' -> Enhanced: {'✓' if enhanced else '○'}")
    
    print("\n" + "=" * 50)
    print("Knowledge Base Test Complete")
    return knowledge_base

if __name__ == "__main__":
    kb = test_knowledge_base_loading()
