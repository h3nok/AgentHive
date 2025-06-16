"""
Lease agent implementation for handling rental and lease inquiries.

This agent specializes in lease-related questions with database integration.
"""

from typing import Union, AsyncIterator, Dict, Any
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.domain.agent_factory import BaseAgent
from app.domain.schemas import RequestContext, AgentResponse, AgentType, AgentManifest
from app.domain.llm_factory import create_llm_adapter
from app.core.observability import get_logger, measure_tokens
from app.services.lease_service import LeaseService
from app.db.lease_models import Property, Tenant, Landlord, Lease, LeaseAnalytics
from app.core.settings import settings

logger = get_logger(__name__)


class Agent(BaseAgent):
    """Lease specialist agent implementation with database integration."""
    
    def __init__(self, agent_id: str, manifest: AgentManifest):
        super().__init__(agent_id, manifest)
        self.llm_adapter = create_llm_adapter()
        self.system_prompt = manifest.config.get(
            "system_prompt",
            "You are a lease specialist AI assistant with access to real-time lease data from the TSC portfolio."
        )
        self.db_engine = None
        self.session_maker = None
        self._setup_database()
    
    def _setup_database(self):
        """Setup database connection for lease data access."""
        try:
            # Convert async URL to sync for this service
            db_url = str(settings.database_url).replace("postgresql+asyncpg://", "postgresql://")
            db_url = db_url.replace("//test_db", "/intelligent_router")
            
            self.db_engine = create_engine(db_url, echo=False)
            self.session_maker = sessionmaker(bind=self.db_engine)
            logger.info("Database connection established for lease agent")
        except Exception as e:
            logger.error(f"Failed to setup database connection: {e}")
            self.db_engine = None
            self.session_maker = None
    
    async def _initialize(self) -> None:
        """Initialize the lease agent."""
        logger.info(f"Lease agent initialized: {self.agent_id}")
    
    def _get_lease_data_from_db(self) -> Dict[str, Any]:
        """Get current lease data from database."""
        if not self.session_maker:
            logger.warning("Database not available, returning empty data")
            return {"leases": [], "summary": {}}
        
        try:
            with self.session_maker() as db:
                lease_service = LeaseService(db)
                
                # Get all leases
                leases = lease_service.get_all_leases()
                
                # Convert to JSON-like format for the LLM
                lease_data = []
                for lease in leases:
                    lease_dict = {
                        "store_number": lease.property.store_number,
                        "property_id": lease.property.property_id,
                        "property_name": lease.property.property_name,
                        "address": {
                            "street": lease.property.street,
                            "city": lease.property.city,
                            "state": lease.property.state,
                            "zip_code": lease.property.zip_code,
                            "county": lease.property.county
                        },
                        "tenant": {
                            "name": lease.tenant.name,
                            "contact_person": lease.tenant.contact_person,
                            "phone": lease.tenant.phone,
                            "email": lease.tenant.email
                        },
                        "landlord": {
                            "name": lease.landlord.name,
                            "contact_person": lease.landlord.contact_person,
                            "phone": lease.landlord.phone,
                            "email": lease.landlord.email
                        },
                        "financial_details": {
                            "base_monthly_rent": float(lease.base_monthly_rent),
                            "annual_base_rent": float(lease.annual_base_rent),
                            "rent_per_sqft": float(lease.rent_per_sqft),
                            "security_deposit": float(lease.security_deposit)
                        },
                        "lease_terms": {
                            "lease_start_date": lease.lease_start_date.isoformat(),
                            "lease_end_date": lease.lease_end_date.isoformat(),
                            "lease_term_months": lease.lease_term_months,
                            "lease_type": lease.lease_type
                        },
                        "property_specifications": {
                            "property_type": lease.property.property_type,
                            "property_class": lease.property.property_class,
                            "total_square_feet": lease.property.total_square_feet,
                            "leased_area_sqft": lease.property.leased_area_sqft
                        },
                        "lease_status": lease.lease_status,
                        "lease_expiry_warning": lease.lease_expiry_warning
                    }
                    lease_data.append(lease_dict)
                
                # Get summary statistics
                summary = lease_service.get_lease_summary_stats()
                
                logger.info(f"Retrieved {len(lease_data)} leases from database")
                return {"leases": lease_data, "summary": summary}
                
        except Exception as e:
            logger.error(f"Error retrieving lease data from database: {e}")
            return {"leases": [], "summary": {}}
    
    def _enhance_prompt_with_lease_data(self, prompt: str) -> str:
        """Enhance the prompt with relevant lease data from database."""
        enhanced = prompt
        prompt_lower = prompt.lower()
        
        # Get current lease data from database
        lease_data = self._get_lease_data_from_db()
        leases = lease_data.get("leases", [])
        summary = lease_data.get("summary", {})
        
        if not leases:
            enhanced += "\n\nNote: No lease data available from database."
            return enhanced
        
        # Add summary statistics for context
        if summary:
            enhanced += f"\n\nLease Portfolio Summary: {json.dumps(summary, indent=2)}"
        
        # For specific queries, add relevant lease details
        if any(term in prompt_lower for term in ["expir", "expire", "expiration"]):
            expiring_leases = [l for l in leases if l.get("lease_expiry_warning", False) or 
                             l.get("lease_status") == "Expiring Soon"]
            if expiring_leases:
                enhanced += f"\n\nExpiring Leases: {json.dumps(expiring_leases, indent=2)}"
        
        # For table/list requests, include sample data structure
        if any(term in prompt_lower for term in ["table", "list", "show all", "summary"]):
            # Include first 3 leases as examples
            sample_leases = leases[:3] if len(leases) > 3 else leases
            enhanced += f"\n\nSample Lease Data (showing {len(sample_leases)} of {len(leases)} total): {json.dumps(sample_leases, indent=2)}"
        
        # Add static knowledge base information
        if any(term in prompt_lower for term in ["pet", "dog", "cat", "animal"]):
            enhanced += f"\n\nPet Policy: {json.dumps({'allowed': True, 'deposit': '$500', 'monthly_fee': '$50', 'restrictions': 'Max 2 pets, weight limit 50lbs'}, indent=2)}"
        
        if any(term in prompt_lower for term in ["apply", "application", "requirements"]):
            enhanced += f"\n\nApplication Requirements: {json.dumps(['Valid ID', 'Proof of income (3x rent)', 'References (2 previous landlords)', 'Credit check authorization', 'Application fee: $50'], indent=2)}"
        
        if any(term in prompt_lower for term in ["utility", "utilities", "included"]):
            enhanced += f"\n\nUtilities: {json.dumps({'included': ['Water', 'Trash'], 'tenant_responsibility': ['Electricity', 'Gas', 'Internet']}, indent=2)}"
        
        return enhanced
    
    @measure_tokens
    async def handle(self, context: RequestContext) -> Union[AgentResponse, AsyncIterator[str]]:
        """Handle lease-related queries with database integration."""
        if not self.llm_adapter:
            raise RuntimeError("Agent not initialized")
        
        # Enhance prompt with current lease data from database
        enhanced_prompt = self._enhance_prompt_with_lease_data(context.prompt.prompt)
        
        # Build conversation history
        messages = [
            {"role": "system", "content": self.system_prompt}
        ]
        
        # Add conversation history
        if context.prompt.history:
            for msg in context.prompt.history:
                messages.append({
                    "role": msg.role.value,
                    "content": msg.content
                })
        
        # Add current prompt
        messages.append({
            "role": "user",
            "content": enhanced_prompt
        })
        
        # Log the handling
        logger.info(
            "Lease agent handling request with database integration",
            request_id=context.request_id,
            has_database_data=self.session_maker is not None,
            has_enhancement=enhanced_prompt != context.prompt.prompt
        )
        
        if context.prompt.stream:
            # Return streaming response
            return self._stream_response(context, messages)
        else:
            # Return complete response
            response = await self.llm_adapter.complete(
                prompt=enhanced_prompt,
                messages=messages,
                temperature=self.manifest.config.get("temperature", 0.7),
                max_tokens=self.manifest.config.get("max_tokens", 1500)
            )
            
            return AgentResponse(
                content=response.content,
                agent_id=self.agent_id,
                agent_type=AgentType.LEASE,
                metadata={
                    "model": response.model,
                    "enhanced_with_knowledge": enhanced_prompt != context.prompt.prompt
                },
                usage=response.usage,
                latency_ms=response.metadata.get("latency_ms") if response.metadata else None
            )
    
    async def _stream_response(self, context: RequestContext, messages: list) -> AsyncIterator[str]:
        """Stream response tokens for lease queries."""
        if not self.llm_adapter:
            raise RuntimeError("LLM adapter not initialized")
            
        async for chunk in self.llm_adapter.stream_complete(
            prompt=context.prompt.prompt,
            messages=messages,
            temperature=self.manifest.config.get("temperature", 0.7),
            max_tokens=self.manifest.config.get("max_tokens", 1500)
        ):
            yield chunk.content
    
    def get_capabilities(self) -> list[str]:
        """Get specialized lease capabilities."""
        base_capabilities = super().get_capabilities()
        
        # Add database-driven capabilities
        additional_capabilities = [
            "lease_portfolio_analysis",
            "real_time_lease_data",
            "expiring_lease_alerts",
            "lease_financial_analytics",
            "property_search",
            "tenant_information",
            "landlord_contact_details"
        ]
        
        # Check if database is available
        if self.session_maker:
            additional_capabilities.append("database_integration")
        
        return base_capabilities + additional_capabilities
    
    def get_cost_estimate(self, context: RequestContext) -> float:
        """Estimate cost for lease query."""
        # Base cost from manifest
        base_cost = self.manifest.cost_per_call
        
        # Adjust based on complexity
        prompt_length = len(context.prompt.prompt)
        if prompt_length > 500:
            # Longer, more complex queries cost more
            return base_cost * 1.5
        
        return base_cost 