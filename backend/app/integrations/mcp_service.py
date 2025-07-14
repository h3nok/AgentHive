"""
Core MCP service integration for enterprise agents.

This module provides the base MCP client and service discovery for connecting
agents to real enterprise tools and systems.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from abc import ABC, abstractmethod
import httpx
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


@dataclass
class MCPToolResult:
    """Result from an MCP tool execution."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    tool_name: str = ""
    execution_time: float = 0.0


@dataclass
class MCPServer:
    """MCP server configuration."""
    name: str
    url: str
    description: str
    tools: List[str]
    auth_type: str = "none"  # none, bearer, api_key
    auth_config: Dict[str, str] = None
    enabled: bool = True


class MCPClient:
    """Client for communicating with MCP servers."""
    
    def __init__(self, server: MCPServer):
        self.server = server
        self.session: Optional[httpx.AsyncClient] = None
        self.connected = False
    
    async def connect(self) -> bool:
        """Connect to the MCP server."""
        try:
            headers = self._get_auth_headers()
            self.session = httpx.AsyncClient(
                base_url=self.server.url,
                headers=headers,
                timeout=30.0
            )
            
            # Test connection
            response = await self.session.get("/health")
            if response.status_code == 200:
                self.connected = True
                logger.info(f"Connected to MCP server: {self.server.name}")
                return True
            else:
                logger.error(f"Failed to connect to {self.server.name}: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error connecting to MCP server {self.server.name}: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from the MCP server."""
        if self.session:
            await self.session.aclose()
            self.session = None
            self.connected = False
    
    async def call_tool(self, tool_name: str, parameters: Dict[str, Any]) -> MCPToolResult:
        """Call a tool on the MCP server."""
        if not self.connected or not self.session:
            return MCPToolResult(
                success=False,
                error="Not connected to MCP server",
                tool_name=tool_name
            )
        
        try:
            import time
            start_time = time.time()
            
            response = await self.session.post(
                f"/tools/{tool_name}/execute",
                json={"parameters": parameters}
            )
            
            execution_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                return MCPToolResult(
                    success=True,
                    data=result.get("data"),
                    tool_name=tool_name,
                    execution_time=execution_time
                )
            else:
                error_msg = f"Tool execution failed: {response.status_code}"
                if response.content:
                    error_msg += f" - {response.text}"
                
                return MCPToolResult(
                    success=False,
                    error=error_msg,
                    tool_name=tool_name,
                    execution_time=execution_time
                )
                
        except Exception as e:
            return MCPToolResult(
                success=False,
                error=f"Error calling tool {tool_name}: {str(e)}",
                tool_name=tool_name
            )
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        """List available tools on the MCP server."""
        if not self.connected or not self.session:
            return []
        
        try:
            response = await self.session.get("/tools")
            if response.status_code == 200:
                return response.json().get("tools", [])
            return []
        except Exception as e:
            logger.error(f"Error listing tools from {self.server.name}: {e}")
            return []
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers based on server configuration."""
        headers = {"Content-Type": "application/json"}
        
        if self.server.auth_type == "bearer" and self.server.auth_config:
            token = self.server.auth_config.get("token")
            if token:
                headers["Authorization"] = f"Bearer {token}"
        
        elif self.server.auth_type == "api_key" and self.server.auth_config:
            api_key = self.server.auth_config.get("api_key")
            key_header = self.server.auth_config.get("header", "X-API-Key")
            if api_key:
                headers[key_header] = api_key
        
        return headers


class EnterpriseMCPService:
    """Service for managing MCP connections and routing tool calls to appropriate servers."""
    
    def __init__(self):
        self.servers: Dict[str, MCPServer] = {}
        self.clients: Dict[str, MCPClient] = {}
        self.tool_registry: Dict[str, str] = {}  # tool_name -> server_name
        self.initialized = False
    
    async def initialize(self):
        """Initialize the MCP service with enterprise server configurations."""
        if self.initialized:
            return
        
        # Configure enterprise MCP servers
        await self._configure_enterprise_servers()
        
        # Connect to all enabled servers
        for server_name, server in self.servers.items():
            if server.enabled:
                client = MCPClient(server)
                self.clients[server_name] = client
                
                connected = await client.connect()
                if connected:
                    # Register tools from this server
                    tools = await client.list_tools()
                    for tool in tools:
                        tool_name = tool.get("name")
                        if tool_name:
                            self.tool_registry[tool_name] = server_name
                            logger.info(f"Registered tool '{tool_name}' from server '{server_name}'")
        
        self.initialized = True
        logger.info(f"MCP service initialized with {len(self.clients)} servers and {len(self.tool_registry)} tools")
    
    async def _configure_enterprise_servers(self):
        """Configure enterprise MCP servers for knowledge worker tools."""
        
        # IT Systems MCP Server
        self.servers["it_systems"] = MCPServer(
            name="it_systems",
            url="http://localhost:8100",  # Local IT systems MCP server
            description="IT systems integration for Active Directory, ITSM, MDM",
            tools=[
                "reset_password",
                "provision_account", 
                "check_system_status",
                "create_ticket",
                "assign_software_license",
                "lock_unlock_account",
                "check_device_compliance"
            ],
            auth_type="api_key",
            auth_config={
                "api_key": "your-it-systems-api-key",
                "header": "X-IT-API-Key"
            }
        )
        
        # Finance Systems MCP Server  
        self.servers["finance_systems"] = MCPServer(
            name="finance_systems",
            url="http://localhost:8101",  # Local finance systems MCP server
            description="Finance and accounting systems integration",
            tools=[
                "submit_expense_report",
                "check_budget_balance",
                "process_reimbursement",
                "create_purchase_order",
                "approve_expense",
                "get_financial_reports",
                "track_invoice_status"
            ],
            auth_type="bearer",
            auth_config={
                "token": "your-finance-systems-bearer-token"
            }
        )
        
        # HR Systems MCP Server
        self.servers["hr_systems"] = MCPServer(
            name="hr_systems", 
            url="http://localhost:8102",  # Local HR systems MCP server
            description="HR and payroll systems integration",
            tools=[
                "submit_pto_request",
                "check_pto_balance",
                "update_employee_info",
                "enroll_benefits",
                "get_pay_stub",
                "submit_performance_review",
                "check_policy_info"
            ],
            auth_type="api_key",
            auth_config={
                "api_key": "your-hr-systems-api-key",
                "header": "X-HR-API-Key"
            }
        )
        
        # Microsoft 365 MCP Server
        self.servers["microsoft365"] = MCPServer(
            name="microsoft365",
            url="http://localhost:8103",  # Local M365 MCP server
            description="Microsoft 365 integration for productivity tools",
            tools=[
                "create_calendar_event",
                "send_email",
                "create_teams_meeting",
                "share_document",
                "search_sharepoint",
                "create_task",
                "get_user_presence"
            ],
            auth_type="bearer",
            auth_config={
                "token": "your-m365-access-token"
            }
        )
    
    async def execute_tool(self, tool_name: str, parameters: Dict[str, Any], user_context: Optional[Dict[str, Any]] = None) -> MCPToolResult:
        """Execute a tool by routing to the appropriate MCP server."""
        if not self.initialized:
            await self.initialize()
        
        server_name = self.tool_registry.get(tool_name)
        if not server_name:
            return MCPToolResult(
                success=False,
                error=f"Tool '{tool_name}' not found in any registered MCP server",
                tool_name=tool_name
            )
        
        client = self.clients.get(server_name)
        if not client:
            return MCPToolResult(
                success=False,
                error=f"No client available for server '{server_name}'",
                tool_name=tool_name
            )
        
        # Add user context to parameters if provided
        if user_context:
            parameters = {**parameters, "user_context": user_context}
        
        return await client.call_tool(tool_name, parameters)
    
    async def get_available_tools(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get list of available tools, optionally filtered by category."""
        if not self.initialized:
            await self.initialize()
        
        tools = []
        for tool_name, server_name in self.tool_registry.items():
            server = self.servers.get(server_name)
            if server and (not category or category.lower() in server.description.lower()):
                tools.append({
                    "name": tool_name,
                    "server": server_name,
                    "description": server.description
                })
        
        return tools
    
    async def health_check(self) -> Dict[str, Any]:
        """Check health of all MCP servers."""
        if not self.initialized:
            await self.initialize()
        
        health_status = {
            "overall_status": "healthy",
            "servers": {},
            "total_tools": len(self.tool_registry)
        }
        
        unhealthy_count = 0
        for server_name, client in self.clients.items():
            if client.connected:
                health_status["servers"][server_name] = "connected"
            else:
                health_status["servers"][server_name] = "disconnected"
                unhealthy_count += 1
        
        if unhealthy_count > 0:
            health_status["overall_status"] = "degraded" if unhealthy_count < len(self.clients) else "unhealthy"
        
        return health_status
    
    async def shutdown(self):
        """Shutdown all MCP connections."""
        for client in self.clients.values():
            await client.disconnect()
        
        self.clients.clear()
        self.tool_registry.clear()
        self.initialized = False
        logger.info("MCP service shutdown complete")


# Global MCP service instance
mcp_service = EnterpriseMCPService()


@asynccontextmanager
async def get_mcp_service():
    """Context manager for getting the MCP service."""
    if not mcp_service.initialized:
        await mcp_service.initialize()
    
    try:
        yield mcp_service
    finally:
        # Keep service running for reuse
        pass
