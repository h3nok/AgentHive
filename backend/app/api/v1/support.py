"""
Support API router with customer service functionality.

This module provides comprehensive support capabilities including:
- AI-powered support query handling
- Knowledge base management
- Support ticket creation and tracking
- Feedback collection
- Agent intake request processing
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Body, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import logging
import uuid

from .deps import DevFriendlyUser

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/support", tags=["support"])

class SupportTicket(BaseModel):
    """Support ticket schema"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: Optional[str] = None
    email: str
    subject: str
    message: str
    category: str = Field(default="general")
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    status: str = Field(default="open", pattern="^(open|in_progress|resolved|closed)$")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = Field(default_factory=list)

class SupportQuery(BaseModel):
    """Support query request schema"""
    message: str = Field(..., min_length=1, max_length=2000)
    category: str = Field(default="general")
    customer_id: Optional[str] = None
    email: Optional[str] = None
    order_id: Optional[str] = None
    product_sku: Optional[str] = None
    urgency: str = Field(default="normal", pattern="^(low|normal|high|urgent)$")

class SupportResponse(BaseModel):
    """Support response schema"""
    response: str
    suggested_actions: List[str] = Field(default_factory=list)
    escalation_needed: bool = False
    category: str
    confidence: float = Field(ge=0.0, le=1.0)
    ticket_id: Optional[str] = None
    estimated_resolution_time: Optional[str] = None

class KnowledgeBaseEntry(BaseModel):
    """Knowledge base entry schema"""
    id: str
    title: str
    content: str
    category: str
    tags: List[str]
    last_updated: datetime
    helpful_count: int = 0

class FeedbackData(BaseModel):
    """Feedback submission schema"""
    ticket_id: Optional[str] = None
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional feedback comment")
    email: Optional[str] = None

class IntakeRequest(BaseModel):
    """Model for agent intake requests"""
    name: str
    orgUnit: str  
    summary: str
    deadline: str
    contact: str

# Mock knowledge base for TSC support
KNOWLEDGE_BASE = [
    {
        "id": "kb_001",
        "title": "How to track your order",
        "content": "You can track your order by logging into your TSC account and visiting the 'My Orders' section. You'll find tracking information and estimated delivery dates there.",
        "category": "orders",
        "tags": ["tracking", "delivery", "orders"],
        "last_updated": datetime.utcnow(),
        "helpful_count": 45
    },
    {
        "id": "kb_002", 
        "title": "Return and exchange policy",
        "content": "TSC offers a 30-day return policy for most items. Items must be in original condition with receipt. Farm and ranch equipment may have different return periods.",
        "category": "returns",
        "tags": ["returns", "exchanges", "policy"],
        "last_updated": datetime.utcnow(),
        "helpful_count": 38
    },
    {
        "id": "kb_003",
        "title": "Product warranty information",
        "content": "Most TSC products come with manufacturer warranties. Check your product manual or contact customer support for specific warranty details.",
        "category": "warranty",
        "tags": ["warranty", "protection", "coverage"],
        "last_updated": datetime.utcnow(),
        "helpful_count": 22
    },
    {
        "id": "kb_004",
        "title": "Store pickup options",
        "content": "You can choose 'Buy Online, Pick Up In Store' at checkout. Orders are typically ready within 2-4 hours during business hours.",
        "category": "pickup",
        "tags": ["pickup", "store", "bopis"],
        "last_updated": datetime.utcnow(),
        "helpful_count": 31
    }
]

# Mock support tickets storage
support_tickets: Dict[str, SupportTicket] = {}

def generate_support_response(query: SupportQuery) -> SupportResponse:
    """Generate AI-powered support response based on query"""
    message = query.message.lower()
    category = query.category
    
    # Analyze the query and generate appropriate response
    if any(word in message for word in ["track", "tracking", "where", "delivery", "shipped"]):
        response = "I can help you track your order! To get the most accurate tracking information, please log into your TSC account and check the 'My Orders' section. If you need immediate assistance, please provide your order number and I'll look it up for you."
        suggested_actions = [
            "Log into your TSC account",
            "Check 'My Orders' section",
            "Contact customer service with order number"
        ]
        category = "orders"
        confidence = 0.9
        
    elif any(word in message for word in ["return", "exchange", "refund", "take back"]):
        response = "TSC has a customer-friendly return policy! You can return most items within 30 days of purchase with your receipt. Items should be in original condition. Farm and ranch equipment may have different return periods. Would you like help with a specific return?"
        suggested_actions = [
            "Bring item and receipt to store", 
            "Check return policy for specific item",
            "Contact customer service for assistance"
        ]
        category = "returns"
        confidence = 0.85
        
    elif any(word in message for word in ["warranty", "broken", "defective", "not working"]):
        response = "I'm sorry to hear you're having product issues. Most TSC products come with manufacturer warranties. I can help you understand your warranty options and next steps for getting your item repaired or replaced."
        suggested_actions = [
            "Check product manual for warranty info",
            "Contact manufacturer directly",
            "Bring product and receipt to store"
        ]
        category = "warranty"
        confidence = 0.8
        
    elif any(word in message for word in ["pickup", "store", "ready", "bopis"]):
        response = "Our Buy Online, Pick Up In Store service is convenient and fast! Orders are typically ready within 2-4 hours during business hours. You'll receive an email notification when your order is ready for pickup."
        suggested_actions = [
            "Wait for pickup notification email",
            "Bring ID and order confirmation",
            "Visit customer service desk"
        ]
        category = "pickup"
        confidence = 0.9
        
    elif any(word in message for word in ["account", "login", "password", "forgot"]):
        response = "I can help with account issues! If you're having trouble logging in, you can reset your password using the 'Forgot Password' link on the login page. For other account issues, our customer service team can assist you."
        suggested_actions = [
            "Use 'Forgot Password' link",
            "Check email for reset instructions", 
            "Contact customer service for account help"
        ]
        category = "account"
        confidence = 0.85
        
    else:
        response = "Thank you for contacting TSC customer support! I'm here to help with any questions about orders, returns, products, or your account. Could you provide more details about what you need assistance with?"
        suggested_actions = [
            "Describe your specific issue",
            "Provide relevant order or product information",
            "Contact customer service for complex issues"
        ]
        category = "general"
        confidence = 0.7
    
    # Determine if escalation is needed
    escalation_needed = confidence < 0.7 or query.urgency in ["high", "urgent"]
    
    # Estimate resolution time
    resolution_times = {
        "orders": "2-4 hours",
        "returns": "1-2 business days", 
        "warranty": "3-5 business days",
        "pickup": "Immediate",
        "account": "1-2 hours",
        "general": "1-3 business days"
    }
    
    return SupportResponse(
        response=response,
        suggested_actions=suggested_actions,
        escalation_needed=escalation_needed,
        category=category,
        confidence=confidence,
        estimated_resolution_time=resolution_times.get(category, "1-3 business days")
    )

@router.post("/query", response_model=SupportResponse)
async def support_query(
    query: SupportQuery,
    user: DevFriendlyUser
) -> SupportResponse:
    """
    Handle customer support queries with AI-powered responses.
    
    Analyzes customer inquiries and provides relevant support information
    including suggested actions and escalation recommendations.
    """
    try:
        logger.info(f"Processing support query for user {user.get('user_id', 'unknown')}: {query.category}")
        
        # Generate AI response
        response = generate_support_response(query)
        
        # Create support ticket if needed
        if query.urgency in ["high", "urgent"] or response.escalation_needed:
            ticket = SupportTicket(
                customer_id=query.customer_id or user.get('user_id'),
                email=query.email or user.get('email', 'unknown@customer.com'),
                subject=f"Support Query - {query.category.title()}",
                message=query.message,
                category=query.category,
                priority=query.urgency,
                tags=[query.category, "auto-generated"]
            )
            support_tickets[ticket.id] = ticket
            response.ticket_id = ticket.id
        
        return response
        
    except Exception as e:
        logger.error("Error processing support query: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process support query: {str(e)}"
        )

@router.get("/knowledge-base", response_model=List[KnowledgeBaseEntry])
async def get_knowledge_base(
    user: DevFriendlyUser,
    category: Optional[str] = None,
    limit: int = 10
) -> List[KnowledgeBaseEntry]:
    """
    Get knowledge base articles for self-service support.
    
    Returns helpful articles that customers can use to resolve
    common issues without contacting support.
    """
    try:
        entries = KNOWLEDGE_BASE.copy()
        
        # Filter by category if specified
        if category:
            entries = [entry for entry in entries if entry["category"] == category.lower()]
        
        # Sort by helpfulness and limit results
        entries.sort(key=lambda x: x["helpful_count"], reverse=True)
        
        return [KnowledgeBaseEntry(**entry) for entry in entries[:limit]]
        
    except Exception as e:
        logger.error("Error fetching knowledge base: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch knowledge base: {str(e)}"
        )

@router.get("/categories")
async def get_support_categories(user: DevFriendlyUser):
    """
    Get available support categories for filtering and routing.
    """
    return {
        "categories": [
            {"id": "orders", "name": "Orders & Shipping", "description": "Order status, tracking, delivery issues"},
            {"id": "returns", "name": "Returns & Exchanges", "description": "Return policy, exchanges, refunds"},
            {"id": "warranty", "name": "Warranty & Repairs", "description": "Product warranties, defective items"},
            {"id": "pickup", "name": "Store Pickup", "description": "Buy online pickup in store (BOPIS)"},
            {"id": "account", "name": "Account Issues", "description": "Login problems, account management"},
            {"id": "products", "name": "Product Information", "description": "Product details, specifications"},
            {"id": "general", "name": "General Support", "description": "Other questions and concerns"}
        ],
        "urgency_levels": [
            {"id": "low", "name": "Low", "description": "General questions, non-urgent"},
            {"id": "normal", "name": "Normal", "description": "Standard support requests"},
            {"id": "high", "name": "High", "description": "Important issues affecting orders"},
            {"id": "urgent", "name": "Urgent", "description": "Critical issues requiring immediate attention"}
        ]
    }

@router.get("/tickets/{ticket_id}", response_model=SupportTicket)
async def get_ticket(
    ticket_id: str,
    user: DevFriendlyUser
) -> SupportTicket:
    """
    Get support ticket details by ID.
    """
    if ticket_id not in support_tickets:
        raise HTTPException(status_code=404, detail="Support ticket not found")
    
    return support_tickets[ticket_id]

@router.get("/health")
async def support_health_check():
    """
    Health check for the support service.
    """
    return {
        "status": "healthy",
        "service": "TSC Customer Support",
        "knowledge_base_entries": len(KNOWLEDGE_BASE),
        "active_tickets": len(support_tickets),
        "categories_available": 7,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackData,
    user: DevFriendlyUser
):
    """
    Submit feedback for support interaction.
    """
    try:
        feedback_id = str(uuid.uuid4())
        
        # In a real implementation, this would be stored in a database
        logger.info(f"Feedback received from user {user.get('user_id', 'unknown')}: Rating {feedback.rating}/5 for ticket {feedback.ticket_id}")
        
        return {
            "feedback_id": feedback_id,
            "message": "Thank you for your feedback!",
            "rating": feedback.rating,
            "ticket_id": feedback.ticket_id,
            "status": "success"
        }
    except Exception as e:
        logger.error("Error processing feedback: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process feedback: {str(e)}"
        )

@router.post("/intake-request")
async def submit_intake_request(
    request: IntakeRequest,
    user: DevFriendlyUser
):
    """
    Submit a request for a new agent to be built.
    
    This endpoint receives requests from teams who want custom agents built
    for their specific workflows and use cases.
    """
    try:
        logger.info(f"Received agent intake request from {request.name} for {request.orgUnit} via user {user.get('user_id', 'unknown')}")
        
        # In a production system, this would:
        # 1. Store the request in a database
        # 2. Send notification emails to the AI team
        # 3. Create a ticket in the project management system
        # 4. Return a tracking number
        
        # For now, we'll just log and return success
        intake_data = {
            "request_id": str(uuid.uuid4()),
            "submitted_by": request.name,
            "org_unit": request.orgUnit,
            "summary": request.summary,
            "deadline": request.deadline,
            "contact": request.contact,
            "submitted_at": datetime.utcnow().isoformat(),
            "status": "pending_review",
            "submitted_via_user": user.get('user_id', 'unknown')
        }
        
        # Mock storing to database
        logger.info("Intake request stored: %s", intake_data["request_id"])
        
        return {
            "success": True,
            "request_id": intake_data["request_id"],
            "message": "Your agent request has been submitted successfully. Our AI team will review and contact you within 2 business days.",
            "data": intake_data
        }
        
    except Exception as e:
        logger.error("Error processing intake request: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to submit agent request. Please try again or contact support."
        )
