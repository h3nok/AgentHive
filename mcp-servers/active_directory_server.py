"""
Mock Active Directory MCP Server for AgentHive Demo.

This is a demonstration MCP server that simulates Active Directory operations
for the IT agent. In production, this would connect to real AD services.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
import uuid
from aiohttp import web, web_request

# Mock user database
MOCK_USERS = {
    "jdoe": {
        "username": "jdoe",
        "email": "john.doe@company.com",
        "full_name": "John Doe",
        "department": "Engineering",
        "manager": "mbrown",
        "groups": ["Domain Users", "Engineering", "VPN Users"],
        "status": "active",
        "last_login": "2025-01-10T09:15:00Z",
        "password_last_set": "2024-12-01T10:30:00Z"
    },
    "asmith": {
        "username": "asmith", 
        "email": "alice.smith@company.com",
        "full_name": "Alice Smith",
        "department": "Finance",
        "manager": "djohnson",
        "groups": ["Domain Users", "Finance", "Budget Managers"],
        "status": "active",
        "last_login": "2025-01-10T08:45:00Z",
        "password_last_set": "2024-11-15T14:20:00Z"
    },
    "mbrown": {
        "username": "mbrown",
        "email": "mike.brown@company.com", 
        "full_name": "Mike Brown",
        "department": "Engineering",
        "manager": "ceo",
        "groups": ["Domain Users", "Engineering", "Managers", "VPN Users"],
        "status": "active",
        "last_login": "2025-01-10T07:30:00Z",
        "password_last_set": "2024-10-20T11:15:00Z"
    }
}

logger = logging.getLogger(__name__)

class MCPADServer:
    """Mock Active Directory MCP Server."""
    
    def __init__(self):
        self.tools = {
            "search_user": {
                "name": "search_user",
                "description": "Search for user information in Active Directory",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "identifier": {
                            "type": "string",
                            "description": "Username or email to search for"
                        },
                        "fields": {
                            "type": "array", 
                            "items": {"type": "string"},
                            "description": "Fields to return (email, department, manager, groups, etc.)"
                        }
                    },
                    "required": ["identifier"]
                }
            },
            "reset_password": {
                "name": "reset_password",
                "description": "Reset user password in Active Directory",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "user_identifier": {
                            "type": "string",
                            "description": "Username or email of user"
                        },
                        "temporary_password": {
                            "type": "string",
                            "description": "Optional temporary password, will be generated if not provided"
                        },
                        "force_change_on_logon": {
                            "type": "boolean",
                            "description": "Force user to change password on next login",
                            "default": True
                        }
                    },
                    "required": ["user_identifier"]
                }
            },
            "list_groups": {
                "name": "list_groups", 
                "description": "List Active Directory groups",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "filter": {
                            "type": "string",
                            "description": "Optional filter for group names"
                        }
                    }
                }
            },
            "add_user_to_group": {
                "name": "add_user_to_group",
                "description": "Add user to an Active Directory group",
                "inputSchema": {
                    "type": "object", 
                    "properties": {
                        "username": {"type": "string"},
                        "group_name": {"type": "string"}
                    },
                    "required": ["username", "group_name"]
                }
            }
        }
    
    async def handle_mcp_request(self, request: web_request.Request) -> web.Response:
        """Handle incoming MCP requests."""
        try:
            data = await request.json()
            method = data.get("method")
            params = data.get("params", {})
            request_id = data.get("id")
            
            logger.info(f"AD MCP Server received: {method}")
            
            if method == "initialize":
                return web.json_response({
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {
                            "tools": {}
                        },
                        "serverInfo": {
                            "name": "active-directory-mcp",
                            "version": "1.0.0"
                        }
                    }
                })
            
            elif method == "tools/list":
                return web.json_response({
                    "jsonrpc": "2.0", 
                    "id": request_id,
                    "result": {
                        "tools": list(self.tools.values())
                    }
                })
            
            elif method == "tools/call":
                tool_name = params.get("name")
                arguments = params.get("arguments", {})
                
                if tool_name == "search_user":
                    result = await self._search_user(arguments)
                elif tool_name == "reset_password":
                    result = await self._reset_password(arguments)
                elif tool_name == "list_groups":
                    result = await self._list_groups(arguments)
                elif tool_name == "add_user_to_group":
                    result = await self._add_user_to_group(arguments)
                else:
                    return web.json_response({
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "error": {
                            "code": -32601,
                            "message": f"Tool not found: {tool_name}"
                        }
                    })
                
                return web.json_response({
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": result
                })
            
            else:
                return web.json_response({
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "error": {
                        "code": -32601,
                        "message": f"Method not found: {method}"
                    }
                })
                
        except Exception as e:
            logger.error(f"Error handling MCP request: {e}")
            return web.json_response({
                "jsonrpc": "2.0",
                "id": data.get("id") if "data" in locals() else None,
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            })
    
    async def _search_user(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Search for user in mock Active Directory."""
        identifier = args.get("identifier", "").lower()
        fields = args.get("fields", ["email", "department", "manager", "groups"])
        
        # Find user by username or email
        user = None
        for username, user_data in MOCK_USERS.items():
            if (username.lower() == identifier or 
                user_data["email"].lower() == identifier):
                user = user_data
                break
        
        if not user:
            return {
                "success": False,
                "error": f"User not found: {identifier}",
                "user": None
            }
        
        # Filter requested fields
        filtered_user = {field: user.get(field) for field in fields if field in user}
        
        return {
            "success": True,
            "user": filtered_user,
            "found": True
        }
    
    async def _reset_password(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Reset user password (mock implementation)."""
        user_identifier = args.get("user_identifier", "").lower()
        temp_password = args.get("temporary_password")
        force_change = args.get("force_change_on_logon", True)
        
        # Find user
        user = None
        for username, user_data in MOCK_USERS.items():
            if (username.lower() == user_identifier or 
                user_data["email"].lower() == user_identifier):
                user = user_data
                break
        
        if not user:
            return {
                "success": False,
                "error": f"User not found: {user_identifier}"
            }
        
        # Generate temp password if not provided
        if not temp_password:
            temp_password = f"Temp{uuid.uuid4().hex[:8]}!"
        
        # Mock password reset
        logger.info(f"Password reset for {user_identifier} - temp password: {temp_password}")
        
        return {
            "success": True,
            "user": user_identifier,
            "temporary_password": temp_password,
            "force_change_required": force_change,
            "reset_time": datetime.utcnow().isoformat() + "Z",
            "message": f"Password reset successful for {user_identifier}"
        }
    
    async def _list_groups(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """List Active Directory groups."""
        filter_text = args.get("filter", "").lower()
        
        # Extract all unique groups
        all_groups = set()
        for user_data in MOCK_USERS.values():
            all_groups.update(user_data["groups"])
        
        # Apply filter if provided
        if filter_text:
            filtered_groups = [g for g in all_groups if filter_text in g.lower()]
        else:
            filtered_groups = list(all_groups)
        
        return {
            "success": True,
            "groups": sorted(filtered_groups),
            "total_count": len(filtered_groups)
        }
    
    async def _add_user_to_group(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Add user to group (mock implementation)."""
        username = args.get("username", "").lower()
        group_name = args.get("group_name", "")
        
        # Find user
        user = None
        user_key = None
        for key, user_data in MOCK_USERS.items():
            if (key.lower() == username or 
                user_data["email"].lower() == username):
                user = user_data
                user_key = key
                break
        
        if not user:
            return {
                "success": False,
                "error": f"User not found: {username}"
            }
        
        # Add to group (in mock data)
        if user_key and group_name not in user["groups"]:
            MOCK_USERS[user_key]["groups"].append(group_name)
            logger.info(f"Added {username} to group {group_name}")
        
        return {
            "success": True,
            "user": username,
            "group": group_name,
            "message": f"User {username} added to group {group_name}",
            "current_groups": user["groups"]
        }


async def create_app():
    """Create the MCP server web application."""
    app = web.Application()
    server = MCPADServer()
    
    # Add MCP endpoint
    app.router.add_post('/mcp', server.handle_mcp_request)
    
    return app


def main():
    """Run the Active Directory MCP server."""
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting Active Directory MCP Server on port 3001")
    
    app = create_app()
    web.run_app(app, host='localhost', port=3001)


if __name__ == "__main__":
    main()
