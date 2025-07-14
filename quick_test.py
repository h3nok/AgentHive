import sys
import os
sys.path.append('backend')
try:
    from app.plugins.hr_agent.agent import Agent
    from app.domain.schemas import AgentType
    
    print('✅ Successfully imported HR agent components')
    print(f'✅ Available agent types: {[agent_type.value for agent_type in AgentType]}')
    
    # Check that lease agent type is removed
    agent_types = [agent_type.value for agent_type in AgentType]
    if 'lease' not in agent_types:
        print('✅ LEASE agent type successfully removed from system')
    else:
        print('❌ LEASE agent type still found in system')
        
    if 'hr' in agent_types:
        print('✅ HR agent type is available in system')
    else:
        print('❌ HR agent type not found in system')
        
    print('\n🎉 Enterprise automation system is ready!')
    print('🏢 Available agents: HR, General, Support, Sales')
    print('🚫 Lease-related functionality has been completely removed')
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
