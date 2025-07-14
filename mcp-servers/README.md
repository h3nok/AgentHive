# AgentHive MCP Servers

This directory contains mock Model Context Protocol (MCP) servers that simulate enterprise systems for AgentHive's knowledge worker copilot platform.

## Overview

The MCP servers provide realistic simulations of enterprise tools that the AI agents can interact with:

- **Active Directory Server** (Port 3001): User management, password resets, group membership
- **JIRA ITSM Server** (Port 3002): IT service tickets, incident management
- **Concur Expense Server** (Port 3011): Expense reports, approvals, reimbursements

## Quick Start

### 1. Install Dependencies

```bash
cd mcp-servers
pip install -r requirements.txt
```

### 2. Start All Servers

```bash
python start_servers.py
```

This will start all MCP servers in the background. You should see output like:

```
============================================================
AgentHive MCP Servers Status
============================================================
Active Directory     Port 3001  Status: Running
JIRA ITSM           Port 3002  Status: Running  
Concur Expense      Port 3011  Status: Running

MCP servers are ready for AgentHive integration!
Press Ctrl+C to stop all servers
============================================================
```

### 3. Test Individual Servers

You can also run individual servers for testing:

```bash
# Active Directory
python active_directory_server.py

# JIRA ITSM  
python jira_itsm_server.py

# Concur Expense
python concur_expense_server.py
```

## Server Details

### Active Directory Server (Port 3001)

**Mock Users:**
- `jdoe` / john.doe@company.com (Engineering)
- `asmith` / alice.smith@company.com (Finance) 
- `mbrown` / mike.brown@company.com (Engineering Manager)

**Available Tools:**
- `search_user`: Find user information
- `reset_password`: Reset user passwords
- `list_groups`: List AD groups
- `add_user_to_group`: Add users to groups

**Example Usage:**
```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/call",
    "params": {
      "name": "search_user",
      "arguments": {
        "identifier": "jdoe",
        "fields": ["email", "department", "groups"]
      }
    }
  }'
```

### JIRA ITSM Server (Port 3002)

**Available Tools:**
- `create_ticket`: Create new IT service tickets
- `get_ticket`: Retrieve ticket details
- `update_ticket`: Update ticket status/assignments
- `search_tickets`: Search for tickets

**Example Usage:**
```bash
curl -X POST http://localhost:3002/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1", 
    "method": "tools/call",
    "params": {
      "name": "create_ticket",
      "arguments": {
        "summary": "Password reset for John Doe",
        "description": "User requested password reset",
        "priority": "Medium",
        "category": "Account Management"
      }
    }
  }'
```

### Concur Expense Server (Port 3011)

**Mock Employees:**
- `EMP001`: John Doe (Engineering)
- `EMP002`: Alice Smith (Finance)

**Available Tools:**
- `create_expense_report`: Submit new expense reports
- `get_expense_report`: Retrieve expense report details
- `list_expense_reports`: List reports for an employee
- `approve_expense_report`: Approve expense reports

**Example Usage:**
```bash
curl -X POST http://localhost:3011/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/call", 
    "params": {
      "name": "create_expense_report",
      "arguments": {
        "employee_id": "EMP001",
        "business_purpose": "Client meeting travel",
        "expenses": [
          {
            "amount": 150.00,
            "description": "Hotel stay",
            "category": "travel",
            "date": "2025-01-10"
          }
        ]
      }
    }
  }'
```

## Integration with AgentHive

The MCP servers are automatically configured in the AgentHive backend through:

- `/backend/app/integrations/enterprise_mcp_configs.py`: Server configurations
- `/backend/app/integrations/enterprise_mcp_service.py`: High-level service interface
- Agent plugins use these services to call enterprise tools

## Architecture

```
AgentHive Backend
├── IT Agent ────────────── Active Directory MCP Server (3001)
│                     └─── JIRA ITSM MCP Server (3002)
├── Finance Agent ────────── Concur Expense MCP Server (3011)
└── HR Agent ─────────────── (HR MCP servers - future)
```

## Production Considerations

These are **mock servers for demonstration**. In production:

1. **Replace with real MCP servers** that connect to actual enterprise systems
2. **Add authentication/authorization** for secure enterprise integration
3. **Implement proper error handling** and retry logic
4. **Add monitoring and logging** for enterprise tool interactions
5. **Use HTTPS** and secure communication protocols
6. **Implement rate limiting** to protect enterprise systems

## MCP Protocol

All servers implement the Model Context Protocol specification:
- **Initialize**: Capability negotiation
- **Tools List**: Discovery of available tools
- **Tools Call**: Execute enterprise operations
- **Error Handling**: Structured error responses

## Troubleshooting

### Port Conflicts
If ports are in use, you can modify the ports in:
- `start_servers.py`: Update the MCP_SERVERS configuration
- `/backend/app/integrations/enterprise_mcp_configs.py`: Update endpoint URLs

### Connection Issues
1. Ensure all servers are running: `python start_servers.py`
2. Check server logs for errors
3. Test endpoints with curl (examples above)
4. Verify firewall settings allow local connections

### AgentHive Integration
1. Start MCP servers first: `python start_servers.py`
2. Start AgentHive backend: `cd ../backend && python start_server.py`
3. Test through the frontend agent interactions

## Contributing

To add new enterprise MCP servers:

1. Create a new server file (e.g., `salesforce_server.py`)
2. Follow the existing MCP server pattern
3. Add to `start_servers.py` configuration
4. Update `enterprise_mcp_configs.py` with the new server
5. Add tool integration to relevant agent plugins
