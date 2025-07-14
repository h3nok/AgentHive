"""
Mock JIRA ITSM MCP Server for AgentHive Demo.

This is a demonstration MCP server that simulates JIRA IT Service Management
operations for the IT agent.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import uuid
from aiohttp import web, web_request

# Mock ticket database
MOCK_TICKETS = {}
MOCK_USERS = {
    "jdoe": {"name": "John Doe", "email": "john.doe@company.com"},
    "asmith": {"name": "Alice Smith", "email": "alice.smith@company.com"},
    "support": {"name": "IT Support", "email": "support@company.com"}
}

logger = logging.getLogger(__name__)

class MCPJiraServer:
    """Mock JIRA ITSM MCP Server."""
    
    def __init__(self):
        self.tools = {
            "create_ticket": {
                "name": "create_ticket",
                "description": "Create a new ITSM ticket in JIRA",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "summary": {
                            "type": "string",
                            "description": "Brief summary of the issue"
                        },
                        "description": {
                            "type": "string",
                            "description": "Detailed description of the issue"
                        },
                        "issue_type": {
                            "type": "string",
                            "description": "Type of issue (Incident, Service Request, Problem)",
                            "default": "Service Request"
                        },
                        "category": {
                            "type": "string",
                            "description": "Issue category",
                            "default": "General"
                        },
                        "priority": {
                            "type": "string",
                            "description": "Priority level (Low, Medium, High, Critical)",
                            "default": "Medium"
                        },
                        "requester": {
                            "type": "string",
                            "description": "Username of the requester"
                        }
                    },
                    "required": ["summary", "description"]
                }
            },
            "get_ticket": {
                "name": "get_ticket",
                "description": "Retrieve ticket details by ID",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "ticket_id": {
                            "type": "string",
                            "description": "Ticket ID"
                        }
                    },
                    "required": ["ticket_id"]
                }
            },
            "update_ticket": {
                "name": "update_ticket",
                "description": "Update an existing ticket",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "ticket_id": {"type": "string"},
                        "status": {"type": "string"},
                        "assignee": {"type": "string"},
                        "comment": {"type": "string"}
                    },
                    "required": ["ticket_id"]
                }
            },
            "search_tickets": {
                "name": "search_tickets",
                "description": "Search for tickets",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "requester": {"type": "string"},
                        "status": {"type": "string"},
                        "category": {"type": "string"},
                        "priority": {"type": "string"}
                    }
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
            
            logger.info(f"JIRA MCP Server received: {method}")
            
            if method == "initialize":
                return web.json_response({
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {"tools": {}},
                        "serverInfo": {
                            "name": "jira-itsm-mcp",
                            "version": "1.0.0"
                        }
                    }
                })
            
            elif method == "tools/list":
                return web.json_response({
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {"tools": list(self.tools.values())}
                })
            
            elif method == "tools/call":
                tool_name = params.get("name")
                arguments = params.get("arguments", {})
                
                if tool_name == "create_ticket":
                    result = await self._create_ticket(arguments)
                elif tool_name == "get_ticket":
                    result = await self._get_ticket(arguments)
                elif tool_name == "update_ticket":
                    result = await self._update_ticket(arguments)
                elif tool_name == "search_tickets":
                    result = await self._search_tickets(arguments)
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
    
    async def _create_ticket(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Create new ITSM ticket."""
        summary = args.get("summary")
        description = args.get("description")
        issue_type = args.get("issue_type", "Service Request")
        category = args.get("category", "General")
        priority = args.get("priority", "Medium")
        requester = args.get("requester", "unknown")
        
        # Generate ticket ID
        ticket_id = f"IT-{uuid.uuid4().hex[:6].upper()}"
        
        # Create ticket
        ticket = {
            "ticket_id": ticket_id,
            "summary": summary,
            "description": description,
            "issue_type": issue_type,
            "category": category,
            "priority": priority,
            "requester": requester,
            "status": "Open",
            "assignee": "support",
            "created_date": datetime.utcnow().isoformat() + "Z",
            "updated_date": datetime.utcnow().isoformat() + "Z",
            "comments": [],
            "resolution": None
        }
        
        # Store in mock database
        MOCK_TICKETS[ticket_id] = ticket
        
        logger.info(f"Created ticket {ticket_id}: {summary}")
        
        return {
            "success": True,
            "ticket_id": ticket_id,
            "status": "Open",
            "created_date": ticket["created_date"],
            "message": f"Ticket {ticket_id} created successfully"
        }
    
    async def _get_ticket(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get ticket by ID."""
        ticket_id = args.get("ticket_id")
        
        if ticket_id not in MOCK_TICKETS:
            return {
                "success": False,
                "error": f"Ticket not found: {ticket_id}"
            }
        
        return {
            "success": True,
            "ticket": MOCK_TICKETS[ticket_id]
        }
    
    async def _update_ticket(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing ticket."""
        ticket_id = args.get("ticket_id")
        status = args.get("status")
        assignee = args.get("assignee")
        comment = args.get("comment")
        
        if ticket_id not in MOCK_TICKETS:
            return {
                "success": False,
                "error": f"Ticket not found: {ticket_id}"
            }
        
        ticket = MOCK_TICKETS[ticket_id]
        
        # Update fields
        if status:
            ticket["status"] = status
        if assignee:
            ticket["assignee"] = assignee
        if comment:
            ticket["comments"].append({
                "comment": comment,
                "author": "system",
                "created_date": datetime.utcnow().isoformat() + "Z"
            })
        
        ticket["updated_date"] = datetime.utcnow().isoformat() + "Z"
        
        logger.info(f"Updated ticket {ticket_id}")
        
        return {
            "success": True,
            "ticket_id": ticket_id,
            "updated_fields": {
                "status": status,
                "assignee": assignee,
                "comment_added": bool(comment)
            },
            "message": f"Ticket {ticket_id} updated successfully"
        }
    
    async def _search_tickets(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Search for tickets."""
        requester = args.get("requester")
        status = args.get("status")
        category = args.get("category")
        priority = args.get("priority")
        
        # Filter tickets
        matching_tickets = []
        for ticket in MOCK_TICKETS.values():
            match = True
            
            if requester and ticket["requester"] != requester:
                match = False
            if status and ticket["status"] != status:
                match = False
            if category and ticket["category"] != category:
                match = False
            if priority and ticket["priority"] != priority:
                match = False
            
            if match:
                matching_tickets.append(ticket)
        
        return {
            "success": True,
            "tickets": matching_tickets,
            "total_count": len(matching_tickets)
        }


async def create_app():
    """Create the MCP server web application."""
    app = web.Application()
    server = MCPJiraServer()
    
    app.router.add_post('/mcp', server.handle_mcp_request)
    
    return app


def main():
    """Run the JIRA ITSM MCP server."""
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting JIRA ITSM MCP Server on port 3002")
    
    app = create_app()
    web.run_app(app, host='localhost', port=3002)


if __name__ == "__main__":
    main()
