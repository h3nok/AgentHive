"""
Enterprise MCP Service for Agent-Tool Integration.

This service provides a high-level interface for agents to interact with
enterprise systems through MCP servers.
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Union
from contextlib import asynccontextmanager
from datetime import datetime

from .mcp_client import MCPClientManager, MCPServerConfig, MCPTool
from .enterprise_mcp_configs import IT_MCP_SERVERS, FINANCE_MCP_SERVERS, HR_MCP_SERVERS
from app.domain.schemas import AgentType
from app.core.observability import get_logger

logger = get_logger(__name__)


class EnterpriseToolResult:
    """Result from enterprise tool execution."""
    
    def __init__(
        self,
        success: bool,
        data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        tool_name: str = "",
        server_name: str = "",
        execution_time_ms: int = 0
    ):
        self.success = success
        self.data = data or {}
        self.error = error
        self.tool_name = tool_name
        self.server_name = server_name
        self.execution_time_ms = execution_time_ms
        self.timestamp = datetime.utcnow()


class EnterpriseMCPService:
    """Service for managing enterprise tool integrations via MCP."""
    
    def __init__(self):
        self.mcp_manager = MCPClientManager()
        self.initialized = False
        self._agent_server_mapping = {
            AgentType.IT: IT_MCP_SERVERS,
            AgentType.FINANCE: FINANCE_MCP_SERVERS,
            AgentType.HR: HR_MCP_SERVERS
        }
    
    async def initialize(self) -> None:
        """Initialize all MCP server connections."""
        if self.initialized:
            return
        
        try:
            # Add all server configurations
            for agent_type, servers in self._agent_server_mapping.items():
                for config in servers.values():
                    self.mcp_manager.add_client(config)
            
            # Connect to all servers
            logger.info("Connecting to enterprise MCP servers...")
            await self.mcp_manager.connect_all()
            
            # Log available tools
            all_tools = self.mcp_manager.list_all_tools()
            for server_name, tools in all_tools.items():
                logger.info(f"Server '{server_name}': {len(tools)} tools available")
                for tool in tools:
                    logger.debug(f"  - {tool.name}: {tool.description}")
            
            self.initialized = True
            logger.info("Enterprise MCP service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Enterprise MCP service: {e}")
            raise
    
    async def shutdown(self) -> None:
        """Shutdown all MCP connections."""
        if not self.initialized:
            return
        
        try:
            await self.mcp_manager.disconnect_all()
            self.initialized = False
            logger.info("Enterprise MCP service shutdown completed")
        except Exception as e:
            logger.error(f"Error during MCP service shutdown: {e}")
    
    def get_available_tools(self, agent_type: AgentType) -> Dict[str, List[MCPTool]]:
        """Get all available tools for a specific agent type."""
        if not self.initialized:
            logger.warning("MCP service not initialized")
            return {}
        
        servers = self._agent_server_mapping.get(agent_type, {})
        available_tools = {}
        
        for server_name in servers.keys():
            client = self.mcp_manager.get_client(server_name)
            if client and client.connected:
                available_tools[server_name] = client.list_tools()
        
        return available_tools
    
    async def call_tool(
        self,
        agent_type: AgentType,
        server_name: str,
        tool_name: str,
        arguments: Dict[str, Any]
    ) -> EnterpriseToolResult:
        """Call a specific tool on an enterprise server."""
        if not self.initialized:
            await self.initialize()
        
        start_time = datetime.utcnow()
        
        try:
            # Verify the server is available for this agent type
            servers = self._agent_server_mapping.get(agent_type, {})
            if server_name not in servers:
                return EnterpriseToolResult(
                    success=False,
                    error=f"Server '{server_name}' not available for {agent_type.value} agent",
                    tool_name=tool_name,
                    server_name=server_name
                )
            
            # Get the MCP client
            client = self.mcp_manager.get_client(server_name)
            if not client or not client.connected:
                return EnterpriseToolResult(
                    success=False,
                    error=f"MCP client for '{server_name}' not connected",
                    tool_name=tool_name,
                    server_name=server_name
                )
            
            # Call the tool
            logger.info(f"Calling tool '{tool_name}' on server '{server_name}' for {agent_type.value} agent")
            result = await client.call_tool(tool_name, arguments)
            
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return EnterpriseToolResult(
                success=True,
                data=result,
                tool_name=tool_name,
                server_name=server_name,
                execution_time_ms=execution_time
            )
            
        except Exception as e:
            execution_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            logger.error(f"Tool call failed: {tool_name} on {server_name}: {e}")
            
            return EnterpriseToolResult(
                success=False,
                error=str(e),
                tool_name=tool_name,
                server_name=server_name,
                execution_time_ms=execution_time
            )
    
    async def search_user_info(
        self,
        agent_type: AgentType,
        user_identifier: str,
        search_fields: Optional[List[str]] = None
    ) -> EnterpriseToolResult:
        """Search for user information across relevant systems."""
        if agent_type == AgentType.IT:
            # Search Active Directory for user info
            return await self.call_tool(
                agent_type=agent_type,
                server_name="active_directory",
                tool_name="search_user",
                arguments={
                    "identifier": user_identifier,
                    "fields": search_fields or ["email", "department", "manager", "groups"]
                }
            )
        elif agent_type == AgentType.HR:
            # Search HRIS for employee info
            return await self.call_tool(
                agent_type=agent_type,
                server_name="workday_hris",
                tool_name="get_employee",
                arguments={
                    "employee_id": user_identifier,
                    "include_fields": search_fields or ["personal_info", "job_info", "compensation"]
                }
            )
        else:
            return EnterpriseToolResult(
                success=False,
                error=f"User search not supported for {agent_type.value} agent"
            )
    
    async def reset_password(
        self,
        user_identifier: str,
        temporary_password: Optional[str] = None
    ) -> EnterpriseToolResult:
        """Reset user password in Active Directory."""
        return await self.call_tool(
            agent_type=AgentType.IT,
            server_name="active_directory",
            tool_name="reset_password",
            arguments={
                "user_identifier": user_identifier,
                "temporary_password": temporary_password,
                "force_change_on_logon": True
            }
        )
    
    async def create_service_ticket(
        self,
        summary: str,
        description: str,
        category: str = "General",
        priority: str = "Medium",
        requester: Optional[str] = None
    ) -> EnterpriseToolResult:
        """Create a service ticket in ITSM system."""
        return await self.call_tool(
            agent_type=AgentType.IT,
            server_name="jira_itsm",
            tool_name="create_ticket",
            arguments={
                "summary": summary,
                "description": description,
                "issue_type": "Service Request",
                "category": category,
                "priority": priority,
                "requester": requester
            }
        )
    
    async def submit_expense_report(
        self,
        employee_id: str,
        expenses: List[Dict[str, Any]],
        business_purpose: str
    ) -> EnterpriseToolResult:
        """Submit an expense report."""
        return await self.call_tool(
            agent_type=AgentType.FINANCE,
            server_name="concur_expense",
            tool_name="create_expense_report",
            arguments={
                "employee_id": employee_id,
                "expenses": expenses,
                "business_purpose": business_purpose,
                "status": "SUBMITTED"
            }
        )
    
    async def get_budget_info(
        self,
        cost_center: str,
        fiscal_year: Optional[int] = None
    ) -> EnterpriseToolResult:
        """Get budget information for a cost center."""
        return await self.call_tool(
            agent_type=AgentType.FINANCE,
            server_name="sap_erp",
            tool_name="get_budget",
            arguments={
                "cost_center": cost_center,
                "fiscal_year": fiscal_year or datetime.now().year
            }
        )
    
    async def request_time_off(
        self,
        employee_id: str,
        start_date: str,
        end_date: str,
        time_off_type: str = "Vacation",
        reason: Optional[str] = None
    ) -> EnterpriseToolResult:
        """Submit a time-off request."""
        return await self.call_tool(
            agent_type=AgentType.HR,
            server_name="ukg_ready",
            tool_name="request_time_off",
            arguments={
                "employee_id": employee_id,
                "start_date": start_date,
                "end_date": end_date,
                "time_off_type": time_off_type,
                "reason": reason
            }
        )


# Global enterprise MCP service instance
enterprise_mcp_service = EnterpriseMCPService()


@asynccontextmanager
async def get_enterprise_mcp_service():
    """Context manager for enterprise MCP service."""
    if not enterprise_mcp_service.initialized:
        await enterprise_mcp_service.initialize()
    
    try:
        yield enterprise_mcp_service
    finally:
        # Keep the service running for other requests
        pass
