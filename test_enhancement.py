#!/usr/bin/env python3
"""
Test prompt enhancement functionality with lease data
"""
import json
import os

def simulate_prompt_enhancement():
    """Simulate the prompt enhancement logic"""
    
    # Load the lease data
    data_path = "backend/app/data/lease_synthetic_data.json"
    with open(data_path, 'r', encoding='utf-8') as f:
        lease_data = json.load(f)
    
    # Simulate knowledge base structure
    knowledge_base = {
        "lease_data": lease_data,
        "lease_terms": {
            "standard_term": "12 months",
            "short_term_available": True,
            "renewal_options": ["6 months", "12 months", "24 months"]
        }
    }
    
    def enhance_prompt(prompt: str) -> str:
        """Simulate the prompt enhancement logic"""
        enhanced = prompt
        prompt_lower = prompt.lower()
        
        # Lease data queries
        lease_data_kb = knowledge_base.get("lease_data", {})
        leases = lease_data_kb.get("leases", [])
        
        if leases and any(term in prompt_lower for term in [
            "lease", "rent", "property", "store", "expir", "renew", "tenant", "landlord", 
            "responsibility", "repair", "hvac", "roof", "parking", "square", "sqft", "nnn"
        ]):
            # Add summary statistics for context
            summary = lease_data_kb.get("summary_statistics", {})
            enhanced += f"\n\nLease Portfolio Summary: {json.dumps(summary, indent=2)}"
            
            # For specific queries, add relevant lease details
            if any(term in prompt_lower for term in ["expir", "expire", "expiration"]):
                expiring_leases = [l for l in leases if l.get("lease_expiry_warning", False) or 
                                 l.get("lease_status") == "Expiring Soon"]
                if expiring_leases:
                    enhanced += f"\n\nExpiring Leases: {json.dumps(expiring_leases, indent=2)}"
            
            # For table/list requests, include sample data structure
            if any(term in prompt_lower for term in ["table", "list", "show all", "summary"]):
                sample_leases = leases[:3] if len(leases) > 3 else leases
                enhanced += f"\n\nSample Lease Data (showing {len(sample_leases)} of {len(leases)} total): {json.dumps(sample_leases, indent=2)}"
        
        return enhanced
    
    # Test different queries
    test_queries = [
        "Show me all lease information",
        "Which leases are expiring soon?",
        "Create a table of all properties", 
        "What is the total portfolio value?",
        "Tell me about rent responsibilities",
        "What is the weather today?"  # Should not be enhanced
    ]
    
    print("Testing Prompt Enhancement")
    print("=" * 50)
    
    for query in test_queries:
        enhanced = enhance_prompt(query)
        was_enhanced = enhanced != query
        
        print(f"\nQuery: '{query}'")
        print(f"Enhanced: {'✓ YES' if was_enhanced else '○ NO'}")
        
        if was_enhanced:
            # Count how much content was added
            added_content = enhanced[len(query):]
            lines_added = len(added_content.split('\n'))
            print(f"Added {lines_added} lines of context")
            
            # Check what type of enhancement
            if "Portfolio Summary" in added_content:
                print("  - Added portfolio summary")
            if "Expiring Leases" in added_content:
                print("  - Added expiring lease details")
            if "Sample Lease Data" in added_content:
                print("  - Added sample lease data structure")
    
    print(f"\n" + "=" * 50)
    print("Enhancement Test Complete")
    
    # Show a sample enhanced prompt
    sample_query = "Show me all lease information"
    enhanced_sample = enhance_prompt(sample_query)
    print(f"\nSample Enhanced Prompt Preview:")
    print(f"Original: {sample_query}")
    print(f"Enhanced length: {len(enhanced_sample)} characters")
    print(f"First 200 chars of enhancement:")
    enhancement_part = enhanced_sample[len(sample_query):]
    print(enhancement_part[:200] + "..." if len(enhancement_part) > 200 else enhancement_part)

if __name__ == "__main__":
    simulate_prompt_enhancement()
