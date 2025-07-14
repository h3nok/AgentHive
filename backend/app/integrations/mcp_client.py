"""
MCP Client for Enterprise System Integration.

This module provides a standardized MCP client for connecting to various
enterprise systems through the Model Context Protocol.
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from enum import Enum
import aiohttp
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class MCPTransport(Enum):
    """Supported MCP transport protocols."""
    STDIO = "stdio"
    HTTP = "http"
    WEBSOCKET = "websocket"


@dataclass
class MCPServerConfig:
    """Configuration for an MCP server connection."""
    name: str
    transport: MCPTransport
    endpoint: str
    command: Optional[str] = None
    args: Optional[List[str]] = None
    env: Optional[Dict[str, str]] = None
    timeout: int = 30
    max_retries: int = 3


class MCPRequest(BaseModel):
    """MCP request structure."""
    jsonrpc: str = "2.0"
    id: Union[str, int]
    method: str
    params: Optional[Dict[str, Any]] = None


class MCPResponse(BaseModel):
    """MCP response structure."""
    jsonrpc: str
    id: Union[str, int]
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None


class MCPTool(BaseModel):
    """MCP tool definition."""
    name: str
    description: str
    inputSchema: Dict[str, Any]


class MCPResource(BaseModel):
    """MCP resource definition."""
    uri: str
    name: str
    description: Optional[str] = None
    mimeType: Optional[str] = None


class MCPClient:
    """Client for communicating with MCP servers."""
    
    def __init__(self, config: MCPServerConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.process: Optional[asyncio.subprocess.Process] = None
        self.connected = False
        self.tools: Dict[str, MCPTool] = {}
        self.resources: Dict[str, MCPResource] = {}
        
    async def connect(self) -> None:
        """Establish connection to the MCP server."""
        try:
            if self.config.transport == MCPTransport.HTTP:
                await self._connect_http()
            elif self.config.transport == MCPTransport.STDIO:
                await self._connect_stdio()
            elif self.config.transport == MCPTransport.WEBSOCKET:
                await self._connect_websocket()
            
            # Initialize the session
            await self._initialize_session()
            self.connected = True
            logger.info(f"Connected to MCP server: {self.config.name}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MCP server {self.config.name}: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Disconnect from the MCP server."""
        try:
            if self.session:
                await self.session.close()
            if self.process:
                self.process.terminate()
                await self.process.wait()
            self.connected = False
            logger.info(f"Disconnected from MCP server: {self.config.name}")
        except Exception as e:
            logger.error(f"Error disconnecting from {self.config.name}: {e}")
    
    async def _connect_http(self) -> None:
        """Connect via HTTP transport."""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout)
        )
    
    async def _connect_stdio(self) -> None:
        """Connect via STDIO transport."""
        if not self.config.command:
            raise ValueError("Command required for STDIO transport")
        
        self.process = await asyncio.create_subprocess_exec(
            self.config.command,
            *(self.config.args or []),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=self.config.env
        )
    
    async def _connect_websocket(self) -> None:
        """Connect via WebSocket transport."""
        # TODO: Implement WebSocket transport
        raise NotImplementedError("WebSocket transport not yet implemented")
    
    async def _initialize_session(self) -> None:
        """Initialize the MCP session and discover capabilities."""
        # Send initialize request
        init_response = await self.send_request(
            "initialize",
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {},
                    "resources": {}
                },
                "clientInfo": {
                    "name": "AgentHive",
                    "version": "1.0.0"
                }
            }
        )
        
        # Discover tools
        try:
            tools_response = await self.send_request("tools/list")
            if tools_response.result and "tools" in tools_response.result:
                for tool_data in tools_response.result["tools"]:
                    tool = MCPTool(**tool_data)
                    self.tools[tool.name] = tool
        except Exception as e:
            logger.warning(f"Failed to discover tools: {e}")
        
        # Discover resources
        try:
            resources_response = await self.send_request("resources/list")
            if resources_response.result and "resources" in resources_response.result:
                for resource_data in resources_response.result["resources"]:
                    resource = MCPResource(**resource_data)
                    self.resources[resource.uri] = resource
        except Exception as e:
            logger.warning(f"Failed to discover resources: {e}")
    
    async def send_request(self, method: str, params: Optional[Dict[str, Any]] = None) -> MCPResponse:
        """Send a request to the MCP server."""
        if not self.connected and method != "initialize":
            raise RuntimeError("Not connected to MCP server")
        
        request = MCPRequest(
            id=f"{method}_{asyncio.get_event_loop().time()}",
            method=method,
            params=params
        )
        
        if self.config.transport == MCPTransport.HTTP:
            return await self._send_http_request(request)
        elif self.config.transport == MCPTransport.STDIO:
            return await self._send_stdio_request(request)
        else:
            raise NotImplementedError(f"Transport {self.config.transport} not implemented")
    
    async def _send_http_request(self, request: MCPRequest) -> MCPResponse:
        """Send HTTP request to MCP server."""
        if not self.session:
            raise RuntimeError("HTTP session not initialized")
        
        async with self.session.post(
            self.config.endpoint,
            json=request.model_dump(),
            headers={"Content-Type": "application/json"}
        ) as response:
            response.raise_for_status()
            data = await response.json()
            return MCPResponse(**data)
    
    async def _send_stdio_request(self, request: MCPRequest) -> MCPResponse:
        """Send STDIO request to MCP server."""
        if not self.process or not self.process.stdin or not self.process.stdout:
            raise RuntimeError("STDIO process not initialized")
        
        # Send request
        request_json = json.dumps(request.model_dump()) + "\n"
        self.process.stdin.write(request_json.encode())
        await self.process.stdin.drain()
        
        # Read response
        response_line = await self.process.stdout.readline()
        response_data = json.loads(response_line.decode().strip())
        return MCPResponse(**response_data)
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a tool on the MCP server."""
        if tool_name not in self.tools:
            raise ValueError(f"Tool '{tool_name}' not available on server {self.config.name}")
        
        response = await self.send_request(
            "tools/call",
            {
                "name": tool_name,
                "arguments": arguments
            }
        )
        
        if response.error:
            raise RuntimeError(f"Tool call failed: {response.error}")
        
        return response.result or {}
    
    async def read_resource(self, uri: str) -> Dict[str, Any]:
        """Read a resource from the MCP server."""
        response = await self.send_request(
            "resources/read",
            {"uri": uri}
        )
        
        if response.error:
            raise RuntimeError(f"Resource read failed: {response.error}")
        
        return response.result or {}
    
    def list_tools(self) -> List[MCPTool]:
        """List all available tools."""
        return list(self.tools.values())
    
    def list_resources(self) -> List[MCPResource]:
        """List all available resources."""
        return list(self.resources.values())


class MCPClientManager:
    """Manager for multiple MCP client connections."""
    
    def __init__(self):
        self.clients: Dict[str, MCPClient] = {}
    
    def add_client(self, config: MCPServerConfig) -> None:
        """Add a new MCP client."""
        client = MCPClient(config)
        self.clients[config.name] = client
    
    async def connect_all(self) -> None:
        """Connect to all registered MCP servers."""
        tasks = [client.connect() for client in self.clients.values()]
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def disconnect_all(self) -> None:
        """Disconnect from all MCP servers."""
        tasks = [client.disconnect() for client in self.clients.values()]
        await asyncio.gather(*tasks, return_exceptions=True)
    
    def get_client(self, name: str) -> Optional[MCPClient]:
        """Get a specific MCP client by name."""
        return self.clients.get(name)
    
    def list_all_tools(self) -> Dict[str, List[MCPTool]]:
        """List all tools from all connected servers."""
        all_tools = {}
        for name, client in self.clients.items():
            if client.connected:
                all_tools[name] = client.list_tools()
        return all_tools


# Global MCP client manager
mcp_manager = MCPClientManager()
