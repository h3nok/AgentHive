# AgentHive Enterprise MCP Integration

## Overview

AgentHive now includes a comprehensive **Model Context Protocol (MCP)** integration framework that enables AI agents to communicate with real enterprise systems. This transforms AgentHive from a conversational assistant into a true **knowledge worker copilot** capable of automating business processes.

## Key Features

### 🔧 Enterprise Tool Integration
- **Active Directory**: User management, password resets, group membership
- **JIRA ITSM**: Service tickets, incident management, automation
- **Concur Expense**: Expense reports, approvals, reimbursements
- **Extensible Architecture**: Easy to add new enterprise systems

### 🤖 Specialized Agents
- **IT Agent**: Handles technical support, password resets, account provisioning
- **Finance Agent**: Manages expense reports, budget inquiries, financial operations
- **HR Agent**: Employee information, time-off requests, policy guidance

### 🔐 Enterprise-Ready
- **Secure Communication**: MCP protocol for safe enterprise integration
- **Error Handling**: Robust error management and fallback mechanisms
- **Audit Logging**: Complete audit trail for compliance
- **Scalable Architecture**: Designed for enterprise-scale deployments

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AgentHive Frontend                           │
│                 (React Agent Selector)                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                AgentHive Backend                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  IT Agent   │  │Finance Agent│  │  HR Agent   │             │
│  └─────┬───────┘  └─────┬───────┘  └─────┬───────┘             │
│        │                │                │                     │
│  ┌─────▼─────────────────▼────────────────▼───────────────────┐ │
│  │         Enterprise MCP Service                            │ │
│  │        (MCP Client Manager)                               │ │
│  └─────┬─────────────────┬────────────────┬───────────────────┘ │
└────────┼─────────────────┼────────────────┼─────────────────────┘
         │                 │                │
┌────────▼───────┐ ┌───────▼────────┐ ┌─────▼──────────┐
│ Active Directory│ │   JIRA ITSM    │ │ Concur Expense │
│  MCP Server     │ │  MCP Server    │ │   MCP Server   │
│   (Port 3001)   │ │  (Port 3002)   │ │  (Port 3011)   │
└────────────────┘ └────────────────┘ └────────────────┘
```

## Quick Start

### 1. Start MCP Servers
```bash
cd mcp-servers
python start_servers.py
```

### 2. Start AgentHive Backend
```bash
cd backend
python start_server.py
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

### 4. Test Integration
```bash
python test_enterprise_integration.py
```

## Example Workflows

### IT Support - Password Reset
**User Request:** "Please reset password for john.doe"

**Agent Actions:**
1. 🔍 Search for user in Active Directory
2. 🔐 Reset password with temporary credentials
3. 🎟️ Create service ticket for tracking
4. 📧 Notify user of reset completion

### Finance - Expense Report
**User Request:** "Submit expense report for $150 hotel stay"

**Agent Actions:**
1. 📄 Extract expense details from request
2. 💰 Create expense report in Concur
3. 📊 Validate against budget policies
4. ✅ Submit for manager approval

### HR - Employee Information
**User Request:** "What's my remaining vacation balance?"

**Agent Actions:**
1. 👤 Lookup employee in HRIS
2. 📅 Retrieve time-off balances
3. 📋 Show vacation, sick, and personal time
4. 📈 Display usage trends and recommendations

## Implementation Details

### MCP Client Architecture
```python
# Enterprise MCP Service Usage
from app.integrations.enterprise_mcp_service import get_enterprise_mcp_service

async def handle_password_reset(user_identifier: str):
    async with get_enterprise_mcp_service() as mcp_service:
        # Search for user
        user_info = await mcp_service.search_user_info(
            agent_type=AgentType.IT,
            user_identifier=user_identifier
        )
        
        if user_info.success:
            # Reset password
            reset_result = await mcp_service.reset_password(user_identifier)
            
            # Create tracking ticket
            ticket_result = await mcp_service.create_service_ticket(
                summary=f"Password reset for {user_identifier}",
                description="Password reset completed via IT Agent",
                category="Account Management"
            )
            
            return reset_result, ticket_result
```

### Agent Integration Pattern
```python
class Agent(BaseAgent):
    async def handle(self, context: RequestContext):
        # Try enterprise tools first
        tool_result = await self._handle_with_enterprise_tools(
            request_type, context
        )
        
        if tool_result:
            return tool_result  # Real enterprise action completed
        
        # Fallback to LLM-based assistance
        return await self._handle_with_llm(context)
```

### Enterprise Tool Configuration
```python
# MCP Server Configurations
IT_MCP_SERVERS = {
    "active_directory": MCPServerConfig(
        name="active_directory",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3001/mcp"
    ),
    "jira_itsm": MCPServerConfig(
        name="jira_itsm",
        transport=MCPTransport.HTTP, 
        endpoint="http://localhost:3002/mcp"
    )
}
```

## Available MCP Tools

### Active Directory Server (Port 3001)
- **search_user**: Find user information and attributes
- **reset_password**: Reset user passwords with temporary credentials
- **list_groups**: Enumerate Active Directory groups
- **add_user_to_group**: Add users to security/distribution groups

### JIRA ITSM Server (Port 3002)  
- **create_ticket**: Create new service/incident tickets
- **get_ticket**: Retrieve ticket details and status
- **update_ticket**: Modify ticket status, assignments, comments
- **search_tickets**: Query tickets by various criteria

### Concur Expense Server (Port 3011)
- **create_expense_report**: Submit new expense reports
- **get_expense_report**: Retrieve report details and status
- **list_expense_reports**: List reports for an employee
- **approve_expense_report**: Approve/reject expense reports

## Production Deployment

### Enterprise System Integration
In production, replace mock MCP servers with real integrations:

1. **Active Directory**: Connect to actual AD/Azure AD via LDAP/Graph API
2. **JIRA**: Integrate with real JIRA instance using REST API
3. **Concur**: Connect to SAP Concur using official APIs
4. **Additional Systems**: Add Workday, Salesforce, ServiceNow, etc.

### Security Considerations
- **Authentication**: Implement OAuth2/SAML for enterprise SSO
- **Authorization**: Role-based access control for agent capabilities
- **Encryption**: TLS/SSL for all MCP communications
- **Audit Logging**: Complete audit trail for compliance
- **Rate Limiting**: Protect enterprise systems from overload

### Scaling and Performance
- **Load Balancing**: Distribute MCP server load
- **Caching**: Cache frequently accessed enterprise data
- **Connection Pooling**: Efficient database/API connections
- **Monitoring**: Real-time monitoring of agent performance

## Development Guide

### Adding New Enterprise Systems
1. Create new MCP server (follow existing patterns)
2. Add server configuration to `enterprise_mcp_configs.py`
3. Implement agent integration methods
4. Add corresponding agent tools/capabilities
5. Update integration tests

### Testing
```bash
# Test individual MCP servers
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"test","method":"tools/list"}'

# Test complete integration
python test_enterprise_integration.py

# Test specific agent workflows
python -m pytest backend/tests/test_agent_integration.py
```

## Future Enhancements

### Planned Integrations
- **Workday HRIS**: Complete HR system integration
- **Salesforce CRM**: Customer data and opportunity management  
- **Microsoft 365**: Calendar, email, document collaboration
- **Google Workspace**: Productivity and collaboration tools
- **ServiceNow**: Enterprise service management
- **SAP ERP**: Enterprise resource planning integration

### Advanced Features
- **Multi-Agent Coordination**: Agents working together on complex tasks
- **Workflow Automation**: Predefined business process automation
- **Analytics Dashboard**: Enterprise usage and performance metrics
- **Natural Language Queries**: SQL-like queries for enterprise data
- **Compliance Automation**: Automated compliance checking and reporting

## Support and Documentation

- **Setup Guide**: `/mcp-servers/README.md`
- **API Documentation**: `/docs/mcp-integration.md`
- **Troubleshooting**: `/docs/troubleshooting.md`
- **Examples**: `/examples/enterprise-workflows/`

## Conclusion

AgentHive's MCP integration transforms it into a powerful enterprise copilot platform that bridges the gap between conversational AI and real business systems. This enables knowledge workers to accomplish complex tasks through natural language while maintaining enterprise security and compliance standards.

The modular architecture ensures easy extensibility to additional enterprise systems, making AgentHive a comprehensive solution for enterprise AI automation.
