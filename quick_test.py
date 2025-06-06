import sys
sys.path.append('backend/app')
try:
    from plugins.lease_agent.agent import LeaseAgent
    agent = LeaseAgent()
    kb = agent._load_knowledge_base()
    print(f'Successfully loaded lease agent with {len(kb.get("lease_data", []))} lease records')
    if 'portfolio_summary' in kb:
        print(f'Portfolio total annual rent: ${kb["portfolio_summary"]["total_annual_rent"]:,.2f}')
        print(f'Total properties: {kb["portfolio_summary"]["total_properties"]}')
        print(f'Average rent per sqft: ${kb["portfolio_summary"]["avg_rent_per_sqft"]:.2f}')
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
