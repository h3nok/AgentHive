"""
Enterprise MCP Server Configurations for Knowledge Worker Tools.

This module defines configurations for connecting to various enterprise
systems through MCP servers.
"""

from typing import Dict, List
from .mcp_client import MCPServerConfig, MCPTransport


# IT Systems MCP Servers
IT_MCP_SERVERS: Dict[str, MCPServerConfig] = {
    "active_directory": MCPServerConfig(
        name="active_directory",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3001/mcp",
        timeout=30
    ),
    "jira_itsm": MCPServerConfig(
        name="jira_itsm", 
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3002/mcp",
        timeout=45
    ),
    "okta_identity": MCPServerConfig(
        name="okta_identity",
        transport=MCPTransport.HTTP, 
        endpoint="http://localhost:3003/mcp",
        timeout=30
    ),
    "microsoft_intune": MCPServerConfig(
        name="microsoft_intune",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3004/mcp", 
        timeout=30
    )
}

# Finance Systems MCP Servers  
FINANCE_MCP_SERVERS: Dict[str, MCPServerConfig] = {
    "sap_erp": MCPServerConfig(
        name="sap_erp",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3010/mcp",
        timeout=60
    ),
    "concur_expense": MCPServerConfig(
        name="concur_expense",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3011/mcp",
        timeout=30
    ),
    "netsuite": MCPServerConfig(
        name="netsuite", 
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3012/mcp",
        timeout=45
    ),
    "quickbooks": MCPServerConfig(
        name="quickbooks",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3013/mcp",
        timeout=30
    ),
    "coupa_procurement": MCPServerConfig(
        name="coupa_procurement",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3014/mcp",
        timeout=30
    )
}

# HR Systems MCP Servers
HR_MCP_SERVERS: Dict[str, MCPServerConfig] = {
    "workday_hris": MCPServerConfig(
        name="workday_hris",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3020/mcp",
        timeout=45
    ),
    "ukg_ready": MCPServerConfig(
        name="ukg_ready", 
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3021/mcp",
        timeout=30
    ),
    "bamboohr": MCPServerConfig(
        name="bamboohr",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3022/mcp",
        timeout=30
    ),
    "adp_workforce": MCPServerConfig(
        name="adp_workforce",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3023/mcp",
        timeout=30
    )
}

# Productivity Tools MCP Servers
PRODUCTIVITY_MCP_SERVERS: Dict[str, MCPServerConfig] = {
    "microsoft_365": MCPServerConfig(
        name="microsoft_365",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3030/mcp",
        timeout=30
    ),
    "google_workspace": MCPServerConfig(
        name="google_workspace",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3031/mcp", 
        timeout=30
    ),
    "slack": MCPServerConfig(
        name="slack",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3032/mcp",
        timeout=30
    ),
    "sharepoint": MCPServerConfig(
        name="sharepoint",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3033/mcp",
        timeout=30
    ),
    "confluence": MCPServerConfig(
        name="confluence",
        transport=MCPTransport.HTTP,
        endpoint="http://localhost:3034/mcp",
        timeout=30
    )
}

# Combine all servers by agent type
AGENT_MCP_MAPPING: Dict[str, Dict[str, MCPServerConfig]] = {
    "it": IT_MCP_SERVERS,
    "finance": FINANCE_MCP_SERVERS,
    "hr": HR_MCP_SERVERS,
    "productivity": PRODUCTIVITY_MCP_SERVERS
}

# Example tool definitions for each system
EXPECTED_TOOLS = {
    # IT Tools
    "active_directory": [
        "create_user_account",
        "reset_user_password", 
        "disable_user_account",
        "add_user_to_group",
        "get_user_details",
        "list_group_members"
    ],
    "jira_itsm": [
        "create_incident_ticket",
        "update_ticket_status",
        "assign_ticket",
        "get_ticket_details",
        "search_tickets",
        "create_service_request"
    ],
    "okta_identity": [
        "provision_user",
        "reset_mfa",
        "assign_application",
        "get_user_status",
        "list_user_applications"
    ],
    
    # Finance Tools
    "concur_expense": [
        "submit_expense_report",
        "get_expense_status",
        "approve_expense_report",
        "get_expense_policies",
        "upload_receipt"
    ],
    "sap_erp": [
        "create_purchase_order",
        "get_budget_status",
        "approve_financial_transaction",
        "get_cost_center_details",
        "generate_financial_report"
    ],
    "netsuite": [
        "create_invoice",
        "process_payment",
        "get_account_balance",
        "reconcile_transactions",
        "generate_tax_report"
    ],
    
    # HR Tools  
    "workday_hris": [
        "submit_time_off_request",
        "get_employee_details",
        "update_employee_information",
        "get_pay_stub",
        "enroll_in_benefits"
    ],
    "ukg_ready": [
        "clock_in_out",
        "request_time_off",
        "view_schedule",
        "submit_timesheet",
        "get_accrual_balances"
    ],
    "bamboohr": [
        "get_employee_directory",
        "update_personal_info",
        "request_time_off", 
        "view_company_directory",
        "access_employee_handbook"
    ],
    
    # Productivity Tools
    "microsoft_365": [
        "send_email",
        "schedule_meeting",
        "create_document",
        "share_file",
        "get_calendar_events"
    ],
    "slack": [
        "send_message",
        "create_channel",
        "schedule_reminder",
        "search_messages",
        "get_user_status"
    ],
    "sharepoint": [
        "upload_document",
        "create_list_item",
        "search_documents",
        "get_site_permissions",
        "create_page"
    ]
}
