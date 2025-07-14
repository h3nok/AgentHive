"""
Finance agent implementation for handling financial and accounting requests.

This agent specializes in expense reports, budget inquiries, reimbursements,
and financial policy guidance with real enterprise system integration.
"""

from typing import Union, AsyncIterator, Dict, Any, List
import re
from datetime import datetime
import json

from app.domain.agent_factory import BaseAgent
from app.domain.schemas import RequestContext, AgentResponse, AgentType, AgentManifest
from app.adapters.llm_openai import OpenAIAdapter
from app.adapters.llm_ollama import OllamaAdapter
from app.core.observability import get_logger, measure_tokens
from app.integrations.enterprise_mcp_service import get_enterprise_mcp_service

logger = get_logger(__name__)


class Agent(BaseAgent):
    """Finance & Accounting specialist agent implementation."""
    
    def __init__(self, agent_id: str, manifest: AgentManifest):
        super().__init__(agent_id, manifest)
        self.llm_adapter: Union[OpenAIAdapter, OllamaAdapter, None] = None
        self.system_prompt = manifest.config.get(
            "system_prompt",
            "You are a Finance & Accounting specialist AI assistant."
        )
        
    async def _initialize(self) -> None:
        """Initialize the Finance agent."""
        from app.domain.llm_factory import create_llm_adapter
        try:
            self.llm_adapter = create_llm_adapter()
            logger.info(f"Finance agent initialized: {self.agent_id}")
        except Exception as e:
            logger.error(f"Failed to initialize Finance agent LLM adapter: {e}")
            raise RuntimeError(f"Finance agent initialization failed: No LLM provider available. {e}")
        
    async def handle(self, context: RequestContext) -> Union[AgentResponse, AsyncIterator[str]]:
        """Handle finance and accounting queries."""
        try:
            if not self.llm_adapter:
                await self._initialize()
            
            # Classify the financial request type and try enterprise tools first
            request_type = self._classify_finance_request(context.prompt.prompt)
            
            # Try to handle with enterprise tools first
            tool_result = await self._handle_with_enterprise_tools(request_type, context)
            if tool_result:
                return tool_result
            
            if request_type == "expense_report":
                return await self._handle_expense_report(context)
            elif request_type == "budget_inquiry":
                return await self._handle_budget_inquiry(context)
            elif request_type == "reimbursement":
                return await self._handle_reimbursement(context)
            elif request_type == "invoice":
                return await self._handle_invoice_inquiry(context)
            else:
                return await self._handle_general_finance_request(context)
                
        except Exception as e:
            logger.error(f"Error handling finance request: {str(e)}")
            return AgentResponse(
                content="I'm sorry, I encountered an error processing your financial request. Please try again or contact the Finance team directly.",
                agent_id=self.agent_id,
                agent_type=AgentType.GENERAL  # Update this when FINANCE type is added
            )
    
    def _classify_finance_request(self, message: str) -> str:
        """Classify the type of financial request."""
        message_lower = message.lower()
        
        expense_keywords = ["expense", "receipt", "reimbursement", "travel", "meal", "mileage"]
        budget_keywords = ["budget", "spending", "allocation", "cost center", "approval"]
        reimbursement_keywords = ["reimburse", "refund", "pay back", "owe me", "receipt"]
        invoice_keywords = ["invoice", "bill", "payment", "vendor", "supplier"]
        
        if any(keyword in message_lower for keyword in expense_keywords):
            return "expense_report"
        elif any(keyword in message_lower for keyword in budget_keywords):
            return "budget_inquiry"
        elif any(keyword in message_lower for keyword in reimbursement_keywords):
            return "reimbursement"
        elif any(keyword in message_lower for keyword in invoice_keywords):
            return "invoice"
        else:
            return "general"
    
    async def _handle_expense_report(self, context: RequestContext) -> AgentResponse:
        """Handle expense report related requests."""
        enhanced_prompt = f"""
        User message: {context.prompt.prompt}
        
        This appears to be an expense report inquiry. Please provide helpful guidance including:
        1. How to submit expense reports in the company system
        2. Required documentation and receipts
        3. Expense categories and limits
        4. Approval process and timelines
        5. Reimbursement timeline and method
        6. Common expense policy violations to avoid
        
        Provide step-by-step guidance and ensure compliance with company policies.
        """
        
        return await self._get_llm_response(enhanced_prompt, context)
    
    async def _handle_budget_inquiry(self, context: RequestContext) -> AgentResponse:
        """Handle budget-related inquiries."""
        enhanced_prompt = f"""
        User message: {context.prompt.prompt}
        
        This appears to be a budget inquiry. Please provide guidance including:
        1. How to check budget allocations
        2. Spending approval processes
        3. Budget transfer procedures
        4. Cost center information
        5. Quarterly/annual budget planning
        6. Budget reporting and tracking
        
        Focus on helping the user understand budget processes and requirements.
        """
        
        return await self._get_llm_response(enhanced_prompt, context)
    
    async def _handle_reimbursement(self, context: RequestContext) -> AgentResponse:
        """Handle reimbursement tracking and inquiries."""
        enhanced_prompt = f"""
        User message: {context.prompt.prompt}
        
        This appears to be a reimbursement inquiry. Please provide information about:
        1. How to track reimbursement status
        2. Typical processing timelines
        3. Required documentation for reimbursements
        4. Direct deposit vs. check options
        5. Who to contact for delayed reimbursements
        6. Common reasons for reimbursement delays
        
        Be helpful and provide clear next steps.
        """
        
        return await self._get_llm_response(enhanced_prompt, context)
    
    async def _handle_invoice_inquiry(self, context: RequestContext) -> AgentResponse:
        """Handle invoice and payment inquiries."""
        enhanced_prompt = f"""
        User message: {context.prompt.prompt}
        
        This appears to be an invoice or payment inquiry. Please provide guidance on:
        1. Invoice submission processes
        2. Payment approval workflows
        3. Vendor payment timelines
        4. Invoice tracking and status
        5. Required purchase order information
        6. Accounts payable contacts
        
        Focus on process clarity and next steps.
        """
        
        return await self._get_llm_response(enhanced_prompt, context)
    
    async def _handle_general_finance_request(self, context: RequestContext) -> AgentResponse:
        """Handle general finance and accounting requests."""
        enhanced_prompt = f"""
        User message: {context.prompt.prompt}
        
        Please provide helpful financial guidance, considering:
        1. Company financial policies and procedures
        2. Compliance requirements
        3. Best practices for financial processes
        4. Appropriate escalation contacts
        5. Self-service options when available
        
        Current date: {datetime.now().strftime('%Y-%m-%d')}
        """
        
        return await self._get_llm_response(enhanced_prompt, context)
    
    async def _get_llm_response(self, enhanced_prompt: str, context: RequestContext) -> AgentResponse:
        """Get response from LLM with financial context."""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": enhanced_prompt}
        ]
        
        if context.prompt.history:
            for msg in context.prompt.history[-5:]:
                messages.insert(-1, {
                    "role": msg.role.value,
                    "content": msg.content
                })
        
        try:
            @measure_tokens
            async def get_response():
                if not self.llm_adapter:
                    raise RuntimeError("LLM adapter not initialized")
                return await self.llm_adapter.complete(
                    prompt=enhanced_prompt,
                    messages=messages,
                    temperature=0.2,  # Lower temperature for financial accuracy
                    max_tokens=1200
                )
            
            response = await get_response()
            
            return AgentResponse(
                content=response.content,
                agent_id=self.agent_id,
                agent_type=AgentType.GENERAL,  # Update when FINANCE type is added
                metadata={
                    "model": response.model,
                    "usage": response.usage,
                    "specialized_handling": True,
                    "domain": "finance"
                }
            )
            
        except Exception as e:
            logger.error(f"LLM completion failed: {e}")
            return AgentResponse(
                content="I'm experiencing technical difficulties. Please contact the Finance team directly for immediate assistance.",
                agent_id=self.agent_id,
                agent_type=AgentType.GENERAL
            )
    
    async def _handle_with_enterprise_tools(
        self, 
        request_type: str, 
        context: RequestContext
    ) -> Union[AgentResponse, None]:
        """Handle finance requests using enterprise MCP tools."""
        try:
            async with get_enterprise_mcp_service() as mcp_service:
                user_message = context.prompt.prompt.lower()
                
                if request_type == "expense_report":
                    # Extract expense information and submit expense report
                    expense_data = self._extract_expense_data(context.prompt.prompt)
                    
                    if expense_data.get("expenses") and expense_data.get("employee_id"):
                        logger.info(f"Submitting expense report for employee: {expense_data['employee_id']}")
                        
                        result = await mcp_service.submit_expense_report(
                            employee_id=expense_data["employee_id"],
                            expenses=expense_data["expenses"],
                            business_purpose=expense_data.get("business_purpose", "Business expense")
                        )
                        
                        if result.success:
                            report_id = result.data.get("report_id", "Unknown")
                            return AgentResponse(
                                content=f"""✅ **Expense Report Submitted Successfully**

**Report Details:**
- **Report ID:** {report_id}
- **Employee:** {expense_data['employee_id']}
- **Total Amount:** ${sum(exp.get('amount', 0) for exp in expense_data['expenses']):.2f}
- **Number of Expenses:** {len(expense_data['expenses'])}

**Status:** Submitted for approval

**Next Steps:**
1. Your manager will receive an approval notification
2. Finance will review for policy compliance
3. Reimbursement will be processed after approval
4. You'll receive email updates on status changes

**Estimated Processing Time:** 3-5 business days
""",
                                agent_id=self.agent_id,
                                agent_type=AgentType.FINANCE,
                                metadata={
                                    "enterprise_tool_used": True,
                                    "report_id": report_id,
                                    "tool_result": result.__dict__
                                }
                            )
                        else:
                            return AgentResponse(
                                content=f"""⚠️ **Expense Report Submission Issue**

I encountered an issue while submitting your expense report.

**Error Details:** {result.error}

**Please try:**
1. Verify all required fields are complete
2. Check that receipt amounts match entered amounts
3. Ensure expense dates are within policy limits
4. Contact Finance directly if the issue persists

**Alternative:** You can submit manually through the finance portal.
""",
                                agent_id=self.agent_id,
                                agent_type=AgentType.FINANCE,
                                metadata={
                                    "enterprise_tool_used": True,
                                    "tool_error": result.error
                                }
                            )
                
                elif request_type == "budget_inquiry":
                    # Get budget information
                    cost_center = self._extract_cost_center(context.prompt.prompt)
                    
                    if cost_center:
                        logger.info(f"Retrieving budget info for cost center: {cost_center}")
                        
                        result = await mcp_service.get_budget_info(cost_center)
                        
                        if result.success:
                            budget_data = result.data
                            allocated = budget_data.get("allocated_amount", 0)
                            spent = budget_data.get("spent_amount", 0)
                            remaining = allocated - spent
                            
                            return AgentResponse(
                                content=f"""📊 **Budget Information - {cost_center}**

**Current Fiscal Year Budget:**
- **Allocated:** ${allocated:,.2f}
- **Spent:** ${spent:,.2f}
- **Remaining:** ${remaining:,.2f}
- **Utilization:** {(spent/allocated*100) if allocated > 0 else 0:.1f}%

**Budget Status:** {"⚠️ Over Budget" if remaining < 0 else "✅ On Track" if spent/allocated < 0.8 else "⚠️ Near Limit"}

**Recent Activity:**
{self._format_budget_activity(budget_data.get("recent_transactions", []))}

**Need Help?**
- Contact your budget manager for adjustments
- Finance team can provide detailed spending reports
- Budget transfers may be available if needed
""",
                                agent_id=self.agent_id,
                                agent_type=AgentType.FINANCE,
                                metadata={
                                    "enterprise_tool_used": True,
                                    "cost_center": cost_center,
                                    "budget_data": budget_data
                                }
                            )
                
                # If no specific enterprise tool handling matched, return None to use LLM
                return None
                
        except Exception as e:
            logger.error(f"Enterprise tools error in Finance agent: {e}")
            # Fall back to LLM-based response
            return None
    
    def _extract_expense_data(self, message: str) -> Dict[str, Any]:
        """Extract expense information from user message."""
        # This is a simplified extraction - in production, you'd want more robust parsing
        import re
        
        # Look for amounts (e.g., $50, 50.00, $1,234.56)
        amount_pattern = r'\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
        amounts = re.findall(amount_pattern, message)
        
        # Look for dates (basic patterns)
        date_pattern = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
        dates = re.findall(date_pattern, message)
        
        # Look for expense types
        expense_types = []
        type_keywords = {
            "travel": ["travel", "flight", "hotel", "uber", "taxi", "airbnb"],
            "meal": ["meal", "lunch", "dinner", "restaurant", "food"],
            "office": ["office", "supplies", "equipment", "software"],
            "entertainment": ["entertainment", "client", "meeting"]
        }
        
        message_lower = message.lower()
        for exp_type, keywords in type_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                expense_types.append(exp_type)
        
        # Create expense entries
        expenses = []
        for i, amount in enumerate(amounts[:5]):  # Limit to 5 expenses
            expense = {
                "amount": float(amount.replace(",", "")),
                "description": f"Expense {i+1}",
                "category": expense_types[i] if i < len(expense_types) else "general",
                "date": dates[i] if i < len(dates) else datetime.now().strftime("%Y-%m-%d")
            }
            expenses.append(expense)
        
        # Try to extract employee ID (simplified)
        employee_id = self._extract_employee_id(message)
        
        return {
            "expenses": expenses,
            "employee_id": employee_id,
            "business_purpose": "Business expense submitted via AI assistant"
        }
    
    def _extract_employee_id(self, message: str) -> str:
        """Extract employee ID from message."""
        # Look for employee ID patterns
        import re
        
        patterns = [
            r'employee\s*(?:id|#)?\s*:?\s*(\w+)',
            r'emp\s*(?:id|#)?\s*:?\s*(\w+)',
            r'id\s*:?\s*(\w+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                return match.group(1)
        
        # Default fallback - in production, this would come from auth context
        return "EMP001"
    
    def _extract_cost_center(self, message: str) -> Union[str, None]:
        """Extract cost center from message."""
        import re
        
        patterns = [
            r'cost\s*center\s*:?\s*(\w+[-]?\w*)',
            r'budget\s*(?:for|code)\s*:?\s*(\w+[-]?\w*)',
            r'cc\s*:?\s*(\w+[-]?\w*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                return match.group(1)
        
        # Look for department names that might map to cost centers
        dept_patterns = [
            r'marketing', r'sales', r'engineering', r'hr', r'finance', 
            r'operations', r'it', r'legal', r'product'
        ]
        
        for dept in dept_patterns:
            if re.search(dept, message, re.IGNORECASE):
                return f"CC-{dept.upper()}"
        
        return None
    
    def _format_budget_activity(self, transactions: List[Dict]) -> str:
        """Format recent budget activity for display."""
        if not transactions:
            return "No recent activity"
        
        formatted = []
        for txn in transactions[:5]:  # Show last 5
            date = txn.get("date", "Unknown")
            amount = txn.get("amount", 0)
            description = txn.get("description", "Transaction")
            formatted.append(f"- {date}: ${amount:,.2f} - {description}")
        
        return "\n".join(formatted)
