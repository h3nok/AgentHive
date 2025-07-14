"""
Mock Concur Expense MCP Server for AgentHive Demo.

This is a demonstration MCP server that simulates Concur expense management
operations for the Finance agent.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import uuid
from aiohttp import web, web_request

# Mock expense data
MOCK_EXPENSE_REPORTS = {}
MOCK_EMPLOYEES = {
    "EMP001": {
        "employee_id": "EMP001",
        "name": "John Doe",
        "email": "john.doe@company.com",
        "department": "Engineering",
        "manager": "EMP002"
    },
    "EMP002": {
        "employee_id": "EMP002", 
        "name": "Alice Smith",
        "email": "alice.smith@company.com",
        "department": "Finance",
        "manager": "EMP003"
    }
}

logger = logging.getLogger(__name__)

class MCPConcurServer:
    """Mock Concur Expense MCP Server."""
    
    def __init__(self):
        self.tools = {
            "create_expense_report": {
                "name": "create_expense_report",
                "description": "Create a new expense report in Concur",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "employee_id": {
                            "type": "string",
                            "description": "Employee ID submitting the report"
                        },
                        "expenses": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "amount": {"type": "number"},
                                    "description": {"type": "string"},
                                    "category": {"type": "string"},
                                    "date": {"type": "string"}
                                }
                            },
                            "description": "List of expense items"
                        },
                        "business_purpose": {
                            "type": "string",
                            "description": "Business purpose for the expenses"
                        }
                    },
                    "required": ["employee_id", "expenses", "business_purpose"]
                }
            },
            "get_expense_report": {
                "name": "get_expense_report",
                "description": "Retrieve an existing expense report",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "report_id": {
                            "type": "string",
                            "description": "Expense report ID"
                        }
                    },
                    "required": ["report_id"]
                }
            },
            "list_expense_reports": {
                "name": "list_expense_reports",
                "description": "List expense reports for an employee",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "employee_id": {
                            "type": "string",
                            "description": "Employee ID"
                        },
                        "status": {
                            "type": "string",
                            "description": "Filter by status (DRAFT, SUBMITTED, APPROVED, PAID)"
                        }
                    },
                    "required": ["employee_id"]
                }
            },
            "approve_expense_report": {
                "name": "approve_expense_report",
                "description": "Approve an expense report",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "report_id": {"type": "string"},
                        "approver_id": {"type": "string"},
                        "comments": {"type": "string"}
                    },
                    "required": ["report_id", "approver_id"]
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
            
            logger.info(f"Concur MCP Server received: {method}")
            
            if method == "initialize":
                return web.json_response({
                    "jsonrpc": "2.0",
                    "id": request_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {"tools": {}},
                        "serverInfo": {
                            "name": "concur-expense-mcp",
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
                
                if tool_name == "create_expense_report":
                    result = await self._create_expense_report(arguments)
                elif tool_name == "get_expense_report":
                    result = await self._get_expense_report(arguments)
                elif tool_name == "list_expense_reports":
                    result = await self._list_expense_reports(arguments)
                elif tool_name == "approve_expense_report":
                    result = await self._approve_expense_report(arguments)
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
    
    async def _create_expense_report(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Create new expense report."""
        employee_id = args.get("employee_id")
        expenses = args.get("expenses", [])
        business_purpose = args.get("business_purpose")
        
        # Validate employee
        if employee_id not in MOCK_EMPLOYEES:
            return {
                "success": False,
                "error": f"Employee not found: {employee_id}"
            }
        
        # Generate report ID
        report_id = f"EXP-{uuid.uuid4().hex[:8].upper()}"
        
        # Calculate total amount
        total_amount = sum(expense.get("amount", 0) for expense in expenses)
        
        # Create expense report
        expense_report = {
            "report_id": report_id,
            "employee_id": employee_id,
            "employee_name": MOCK_EMPLOYEES[employee_id]["name"],
            "business_purpose": business_purpose,
            "expenses": expenses,
            "total_amount": total_amount,
            "status": "SUBMITTED",
            "created_date": datetime.utcnow().isoformat() + "Z",
            "submitted_date": datetime.utcnow().isoformat() + "Z",
            "approval_status": "PENDING"
        }
        
        # Store in mock database
        MOCK_EXPENSE_REPORTS[report_id] = expense_report
        
        logger.info(f"Created expense report {report_id} for {employee_id} - ${total_amount:.2f}")
        
        return {
            "success": True,
            "report_id": report_id,
            "total_amount": total_amount,
            "status": "SUBMITTED",
            "message": f"Expense report {report_id} created successfully"
        }
    
    async def _get_expense_report(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get expense report by ID."""
        report_id = args.get("report_id")
        
        if report_id not in MOCK_EXPENSE_REPORTS:
            return {
                "success": False,
                "error": f"Expense report not found: {report_id}"
            }
        
        return {
            "success": True,
            "report": MOCK_EXPENSE_REPORTS[report_id]
        }
    
    async def _list_expense_reports(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """List expense reports for employee."""
        employee_id = args.get("employee_id")
        status_filter = args.get("status")
        
        # Find reports for employee
        reports = []
        for report in MOCK_EXPENSE_REPORTS.values():
            if report["employee_id"] == employee_id:
                if not status_filter or report["status"] == status_filter:
                    reports.append(report)
        
        return {
            "success": True,
            "reports": reports,
            "total_count": len(reports)
        }
    
    async def _approve_expense_report(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Approve expense report."""
        report_id = args.get("report_id")
        approver_id = args.get("approver_id")
        comments = args.get("comments", "")
        
        if report_id not in MOCK_EXPENSE_REPORTS:
            return {
                "success": False,
                "error": f"Expense report not found: {report_id}"
            }
        
        # Update report status
        report = MOCK_EXPENSE_REPORTS[report_id]
        report["status"] = "APPROVED"
        report["approval_status"] = "APPROVED"
        report["approved_by"] = approver_id
        report["approved_date"] = datetime.utcnow().isoformat() + "Z"
        report["approval_comments"] = comments
        
        logger.info(f"Expense report {report_id} approved by {approver_id}")
        
        return {
            "success": True,
            "report_id": report_id,
            "status": "APPROVED",
            "approved_by": approver_id,
            "message": f"Expense report {report_id} approved successfully"
        }


async def create_app():
    """Create the MCP server web application."""
    app = web.Application()
    server = MCPConcurServer()
    
    app.router.add_post('/mcp', server.handle_mcp_request)
    
    return app


def main():
    """Run the Concur Expense MCP server."""
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting Concur Expense MCP Server on port 3011")
    
    app = create_app()
    web.run_app(app, host='localhost', port=3011)


if __name__ == "__main__":
    main()
