"""
IT Support agent implementation for handling technical support requests.

This agent specializes in IT support, password resets, account provisioning,
software requests, and general technical troubleshooting with real enterprise tool integration.
"""

from typing import Union, AsyncIterator, Dict, Any
import re
import json
from datetime import datetime

from app.domain.agent_factory import BaseAgent
from app.domain.schemas import RequestContext, AgentResponse, AgentType, AgentManifest
from app.adapters.llm_openai import OpenAIAdapter
from app.adapters.llm_ollama import OllamaAdapter
from app.core.observability import get_logger, measure_tokens
from app.integrations.enterprise_mcp_service import get_enterprise_mcp_service

logger = get_logger(__name__)


class Agent(BaseAgent):
    """IT Support specialist agent implementation."""
    
    def __init__(self, agent_id: str, manifest: AgentManifest):
        super().__init__(agent_id, manifest)
        self.llm_adapter: Union[OpenAIAdapter, OllamaAdapter, None] = None
        self.system_prompt = manifest.config.get(
            "system_prompt",
            "You are an IT Support specialist AI assistant."
        )
        
    async def _initialize(self) -> None:
        """Initialize the IT agent."""
        from app.domain.llm_factory import create_llm_adapter
        try:
            self.llm_adapter = create_llm_adapter()
            logger.info(f"IT agent initialized: {self.agent_id}")
        except Exception as e:
            logger.error(f"Failed to initialize IT agent LLM adapter: {e}")
            raise RuntimeError(f"IT agent initialization failed: No LLM provider available. {e}")
        
    async def handle(self, context: RequestContext) -> Union[AgentResponse, AsyncIterator[str]]:
        """Handle IT support queries."""
        try:
            if not self.llm_adapter:
                await self._initialize()
            
            # Check for specific IT request types and handle with enterprise tools
            request_type = self._classify_it_request(context.prompt.prompt)
            
            # Try to handle with enterprise tools first
            tool_result = await self._handle_with_enterprise_tools(request_type, context)
            if tool_result:
                return tool_result
            
            if request_type == "password_reset":
                return await self._handle_password_reset(context)
            elif request_type == "software_request":
                return await self._handle_software_request(context)
            elif request_type == "account_access":
                return await self._handle_account_access(context)
            else:
                return await self._handle_general_it_request(context)
                
        except Exception as e:
            logger.error(f"Error handling IT request: {str(e)}")
            return AgentResponse(
                content="I'm sorry, I encountered an error processing your IT request. Please try again or contact the IT helpdesk directly.",
                agent_id=self.agent_id,
                agent_type=AgentType.SUPPORT
            )
    
    def _classify_it_request(self, message: str) -> str:
        """Classify the type of IT request."""
        message_lower = message.lower()
        
        password_keywords = ["password", "reset", "locked out", "can't login", "forgot"]
        software_keywords = ["software", "install", "application", "app", "program"]
        access_keywords = ["access", "permission", "can't access", "blocked"]
        
        if any(keyword in message_lower for keyword in password_keywords):
            return "password_reset"
        elif any(keyword in message_lower for keyword in software_keywords):
            return "software_request"
        elif any(keyword in message_lower for keyword in access_keywords):
            return "account_access"
        else:
            return "general"
    
    async def _handle_password_reset(self, context: RequestContext) -> AgentResponse:
        """Handle password reset requests."""
        enhanced_prompt = f"""
        User message: {context.prompt.prompt}
        
        This appears to be a password reset request. Please provide helpful guidance including:
        1. Security verification steps
        2. Self-service password reset options
        3. Contact information for immediate assistance
        4. Security best practices for passwords
        
        Be helpful but maintain security protocols.
        """
        
        return await self._get_llm_response(enhanced_prompt, context)
    
    async def _handle_software_request(self, context: RequestContext) -> AgentResponse:
        """Handle software installation requests."""
        enhanced_prompt = f"""
        User message: {context.prompt.prompt}
        
        This appears to be a software request. Please provide guidance including:
        1. Company software catalog or approved applications
        2. Self-service installation options
        3. Business justification requirements
        4. Security and compliance considerations
        5. Alternative software suggestions if applicable
        
        Be helpful while following company IT policies.
        """
        
        return await self._get_llm_response(enhanced_prompt, context)
    
    async def _handle_account_access(self, context: RequestContext) -> AgentResponse:
        """Handle account access issues."""
        enhanced_prompt = f"""
        User message: {context.prompt.prompt}
        
        This appears to be an account access issue. Please provide guidance including:
        1. Common troubleshooting steps
        2. Permission request procedures
        3. Manager approval requirements
        4. Security verification process
        5. Escalation contacts
        
        Prioritize security while being helpful.
        """
        
        return await self._get_llm_response(enhanced_prompt, context)
    
    async def _handle_general_it_request(self, context: RequestContext) -> AgentResponse:
        """Handle general IT support requests."""
        return await self._get_llm_response(context.prompt.prompt, context)
    
    async def _get_llm_response(self, enhanced_prompt: str, context: RequestContext) -> AgentResponse:
        """Get response from LLM with context."""
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
                    temperature=0.3,
                    max_tokens=1000
                )
            
            response = await get_response()
            
            return AgentResponse(
                content=response.content,
                agent_id=self.agent_id,
                agent_type=AgentType.SUPPORT,
                metadata={
                    "model": response.model,
                    "usage": response.usage,
                    "specialized_handling": True
                }
            )
            
        except Exception as e:
            logger.error(f"LLM completion failed: {e}")
            return AgentResponse(
                content="I'm experiencing technical difficulties. Please contact the IT helpdesk directly for immediate assistance.",
                agent_id=self.agent_id,
                agent_type=AgentType.SUPPORT
            )
    
    async def _handle_with_enterprise_tools(
        self, 
        request_type: str, 
        context: RequestContext
    ) -> Union[AgentResponse, None]:
        """Handle IT requests using enterprise MCP tools."""
        try:
            async with get_enterprise_mcp_service() as mcp_service:
                user_message = context.prompt.prompt.lower()
                
                # Extract user identifier if present
                user_identifier = self._extract_user_identifier(context.prompt.prompt)
                
                if request_type == "password_reset" and user_identifier:
                    # Attempt real password reset
                    logger.info(f"Attempting password reset for user: {user_identifier}")
                    
                    # First, verify user exists
                    user_info = await mcp_service.search_user_info(
                        agent_type=AgentType.IT,
                        user_identifier=user_identifier
                    )
                    
                    if user_info.success:
                        # User exists, proceed with password reset
                        reset_result = await mcp_service.reset_password(user_identifier)
                        
                        if reset_result.success:
                            # Create service ticket for tracking
                            ticket_result = await mcp_service.create_service_ticket(
                                summary=f"Password reset for {user_identifier}",
                                description=f"Password reset completed via IT Agent. User: {user_identifier}",
                                category="Account Management",
                                priority="Medium"
                            )
                            
                            ticket_info = ""
                            if ticket_result.success:
                                ticket_id = ticket_result.data.get("ticket_id", "Unknown")
                                ticket_info = f"\n\n🎟️ **Service Ticket Created:** {ticket_id}"
                            
                            return AgentResponse(
                                content=f"""✅ **Password Reset Completed**

I've successfully reset the password for **{user_identifier}**.

**Next Steps:**
1. A temporary password has been sent to the user's registered email
2. The user will be required to change their password on next login
3. Please ensure the user follows the company password policy{ticket_info}

**Security Note:** The reset has been logged for compliance and security auditing.
""",
                                agent_id=self.agent_id,
                                agent_type=AgentType.IT,
                                metadata={
                                    "enterprise_tool_used": True,
                                    "tool_results": [reset_result.__dict__, ticket_result.__dict__],
                                    "execution_time_ms": reset_result.execution_time_ms
                                }
                            )
                        else:
                            # Password reset failed, create ticket for manual handling
                            await mcp_service.create_service_ticket(
                                summary=f"Password reset failed for {user_identifier}",
                                description=f"Automated password reset failed. Manual intervention required. Error: {reset_result.error}",
                                category="Account Management",
                                priority="High"
                            )
                            
                            return AgentResponse(
                                content=f"""⚠️ **Password Reset Issue**

I encountered an issue while trying to reset the password for **{user_identifier}**.

**What I Did:**
- Verified the user account exists ✅
- Attempted automated password reset ❌

**Next Steps:**
1. I've created a high-priority service ticket for manual review
2. Please contact the IT Help Desk directly for immediate assistance
3. Have the user verify their identity with IT support

**Error Details:** {reset_result.error}
""",
                                agent_id=self.agent_id,
                                agent_type=AgentType.IT,
                                metadata={
                                    "enterprise_tool_used": True,
                                    "tool_error": reset_result.error,
                                    "requires_manual_intervention": True
                                }
                            )
                    else:
                        # User not found
                        return AgentResponse(
                            content=f"""🔍 **User Not Found**

I couldn't find a user account for **{user_identifier}** in our system.

**Please verify:**
1. The username is spelled correctly
2. The user account exists in Active Directory
3. You have the correct employee ID or email address

**Alternative Options:**
- Try searching with email address instead of username
- Contact IT Help Desk with the user's full name and department
- Check if this is a new employee who needs account creation
""",
                            agent_id=self.agent_id,
                            agent_type=AgentType.IT,
                            metadata={
                                "enterprise_tool_used": True,
                                "user_not_found": True
                            }
                        )
                
                elif "software" in user_message and "install" in user_message:
                    # Handle software installation requests
                    software_name = self._extract_software_name(context.prompt.prompt)
                    
                    ticket_result = await mcp_service.create_service_ticket(
                        summary=f"Software installation request: {software_name}",
                        description=f"User requested installation of {software_name}. Request details: {context.prompt.prompt}",
                        category="Software Request",
                        priority="Medium",
                        requester=getattr(context, 'user_id', 'Unknown')
                    )
                    
                    if ticket_result.success:
                        ticket_id = ticket_result.data.get("ticket_id", "Unknown")
                        return AgentResponse(
                            content=f"""📋 **Software Request Submitted**

I've created a service request for **{software_name}** installation.

**Request Details:**
- **Ticket ID:** {ticket_id}
- **Software:** {software_name}
- **Status:** Pending approval

**Next Steps:**
1. Your request will be reviewed by IT administration
2. Business justification may be required
3. Security and compliance review will be conducted
4. You'll receive updates via email

**Typical Timeline:** 2-5 business days for approval and installation.
""",
                            agent_id=self.agent_id,
                            agent_type=AgentType.IT,
                            metadata={
                                "enterprise_tool_used": True,
                                "ticket_created": True,
                                "ticket_id": ticket_id
                            }
                        )
                
                # If no specific enterprise tool handling matched, return None to use LLM
                return None
                
        except Exception as e:
            logger.error(f"Enterprise tools error in IT agent: {e}")
            # Fall back to LLM-based response
            return None
    
    def _extract_user_identifier(self, message: str) -> Union[str, None]:
        """Extract user identifier from message."""
        # Look for common patterns: username, email, employee ID
        import re
        
        # Email pattern
        email_match = re.search(r'\b[\w.-]+@[\w.-]+\.\w+\b', message)
        if email_match:
            return email_match.group()
        
        # Username patterns (looking for @username or user: username)
        username_patterns = [
            r'@(\w+)',
            r'user:?\s*(\w+)',
            r'username:?\s*(\w+)',
            r'account:?\s*(\w+)',
            r'for\s+(\w+)(?:\s|$)',
            r'reset\s+(\w+)(?:\s|$)'
        ]
        
        for pattern in username_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                username = match.group(1)
                # Validate reasonable username (3-50 chars, alphanumeric + common chars)
                if 3 <= len(username) <= 50 and re.match(r'^[\w.-]+$', username):
                    return username
        
        return None
    
    def _extract_software_name(self, message: str) -> str:
        """Extract software name from installation request."""
        # Look for software names after common keywords
        software_patterns = [
            r'install\s+([\w\s]+?)(?:\s|$)',
            r'software:?\s*([\w\s]+?)(?:\s|$)',
            r'application:?\s*([\w\s]+?)(?:\s|$)',
            r'need\s+([\w\s]+?)(?:\s|$)'
        ]
        
        for pattern in software_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                software_name = match.group(1).strip()
                if software_name and len(software_name) <= 100:
                    return software_name
        
        return "Unknown Software"
