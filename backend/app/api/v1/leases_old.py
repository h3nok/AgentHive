"""
Lease API endpoints for database-driven lease management.

This module provides REST API endpoints for lease data access, search, and analytics.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.observability import get_logger, with_tracing
from app.core.errors import BaseRouterException
from app.services.lease_service import LeaseService
from app.db.lease_models import Lease, Property, Tenant, Landlord, LeaseAnalytics
from app.db.session import get_db
from .deps import DevFriendlyUser

logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/leases", tags=["leases"])

# Pydantic models for API responses
class PropertyResponse(BaseModel):
    """Property information response model."""
    property_id: str
    store_number: str
    property_name: str
    street: str
    city: str
    state: str
    zip_code: str
    county: str
    property_type: str
    property_class: str
    total_square_feet: int
    leased_area_sqft: int

class TenantResponse(BaseModel):
    """Tenant information response model."""
    tenant_id: str
    name: str
    contact_person: str
    phone: str
    email: str

class LandlordResponse(BaseModel):
    """Landlord information response model."""
    landlord_id: str
    name: str
    contact_person: str
    phone: str
    email: str

class LeaseResponse(BaseModel):
    """Lease information response model."""
    lease_id: str
    property: PropertyResponse
    tenant: TenantResponse
    landlord: LandlordResponse
    lease_start_date: datetime
    lease_end_date: datetime
    lease_term_months: int
    lease_type: str
    base_monthly_rent: float
    annual_base_rent: float
    rent_per_sqft: float
    security_deposit: float
    lease_status: str
    lease_expiry_warning: bool

class LeaseSearchQuery(BaseModel):
    """Lease search query parameters."""
    status: Optional[str] = None
    property_class: Optional[str] = None
    lease_type: Optional[str] = None
    city: Optional[str] = None
    expiring_soon: Optional[bool] = None
    min_rent: Optional[float] = None
    max_rent: Optional[float] = None

class LeaseAnalyticsResponse(BaseModel):
    """Lease analytics response model."""
    total_properties: int
    total_annual_rent: float
    average_rent_per_sqft: float
    total_square_feet: int
    leased_square_feet: int
    occupancy_rate: float
    expiring_leases_count: int
    lease_types_distribution: Dict[str, int]
    property_classes_distribution: Dict[str, int]
    city_distribution: Dict[str, int]

# Database dependency
async def get_lease_service(db: Session = Depends(get_db)) -> LeaseService:
    """Get lease service instance."""
    return LeaseService(db)

@router.get("/", response_model=List[LeaseResponse])
@with_tracing("get_all_leases")
async def get_all_leases(
    user: DevFriendlyUser,
    lease_service: LeaseService = Depends(get_lease_service),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return")
) -> List[LeaseResponse]:
    """
    Get all leases with pagination.
    
    Returns:
        List of lease records with property, tenant, and landlord details.
    """
    try:
        leases = lease_service.get_all_leases()
        
        # Apply pagination
        paginated_leases = leases[skip:skip + limit]
        
        # Convert to response format
        lease_responses = []
        for lease in paginated_leases:
            lease_response = LeaseResponse(
                lease_id=lease.lease_id,
                property=PropertyResponse(
                    property_id=lease.property.property_id,
                    store_number=lease.property.store_number,
                    property_name=lease.property.property_name,
                    street=lease.property.street,
                    city=lease.property.city,
                    state=lease.property.state,
                    zip_code=lease.property.zip_code,
                    county=lease.property.county,
                    property_type=lease.property.property_type,
                    property_class=lease.property.property_class,
                    total_square_feet=lease.property.total_square_feet,
                    leased_area_sqft=lease.property.leased_area_sqft
                ),
                tenant=TenantResponse(
                    tenant_id=lease.tenant.tenant_id,
                    name=lease.tenant.name,
                    contact_person=lease.tenant.contact_person,
                    phone=lease.tenant.phone,
                    email=lease.tenant.email
                ),
                landlord=LandlordResponse(
                    landlord_id=lease.landlord.landlord_id,
                    name=lease.landlord.name,
                    contact_person=lease.landlord.contact_person,
                    phone=lease.landlord.phone,
                    email=lease.landlord.email
                ),
                lease_start_date=lease.lease_start_date,
                lease_end_date=lease.lease_end_date,
                lease_term_months=lease.lease_term_months,
                lease_type=lease.lease_type,
                base_monthly_rent=float(lease.base_monthly_rent),
                annual_base_rent=float(lease.annual_base_rent),
                rent_per_sqft=float(lease.rent_per_sqft),
                security_deposit=float(lease.security_deposit),
                lease_status=lease.lease_status,
                lease_expiry_warning=lease.lease_expiry_warning
            )
            lease_responses.append(lease_response)
        
        logger.info(f"Retrieved {len(lease_responses)} leases (total available: {len(leases)})")
        return lease_responses
        
    except Exception as e:
        logger.error(f"Error retrieving leases: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving leases: {str(e)}")

@router.get("/{lease_id}", response_model=LeaseResponse)
@with_tracing("get_lease_by_id")
async def get_lease_by_id(
    lease_id: str,
    user: DevFriendlyUser,
    lease_service: LeaseService = Depends(get_lease_service)
) -> LeaseResponse:
    """
    Get a specific lease by ID.
    
    Args:
        lease_id: The lease identifier
        
    Returns:
        Lease record with full details
    """
    try:
        lease = lease_service.get_lease_by_id(lease_id)
        if not lease:
            raise HTTPException(status_code=404, detail=f"Lease {lease_id} not found")
        
        return LeaseResponse(
            lease_id=lease.lease_id,
            property=PropertyResponse(
                property_id=lease.property.property_id,
                store_number=lease.property.store_number,
                property_name=lease.property.property_name,
                street=lease.property.street,
                city=lease.property.city,
                state=lease.property.state,
                zip_code=lease.property.zip_code,
                county=lease.property.county,
                property_type=lease.property.property_type,
                property_class=lease.property.property_class,
                total_square_feet=lease.property.total_square_feet,
                leased_area_sqft=lease.property.leased_area_sqft
            ),
            tenant=TenantResponse(
                tenant_id=lease.tenant.tenant_id,
                name=lease.tenant.name,
                contact_person=lease.tenant.contact_person,
                phone=lease.tenant.phone,
                email=lease.tenant.email
            ),
            landlord=LandlordResponse(
                landlord_id=lease.landlord.landlord_id,
                name=lease.landlord.name,
                contact_person=lease.landlord.contact_person,
                phone=lease.landlord.phone,
                email=lease.landlord.email
            ),
            lease_start_date=lease.lease_start_date,
            lease_end_date=lease.lease_end_date,
            lease_term_months=lease.lease_term_months,
            lease_type=lease.lease_type,
            base_monthly_rent=float(lease.base_monthly_rent),
            annual_base_rent=float(lease.annual_base_rent),
            rent_per_sqft=float(lease.rent_per_sqft),
            security_deposit=float(lease.security_deposit),
            lease_status=lease.lease_status,
            lease_expiry_warning=lease.lease_expiry_warning
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving lease {lease_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving lease: {str(e)}")

@router.post("/search", response_model=List[LeaseResponse])
@with_tracing("search_leases")
async def search_leases(
    search_query: LeaseSearchQuery,
    user: DevFriendlyUser,
    lease_service: LeaseService = Depends(get_lease_service)
) -> List[LeaseResponse]:
    """
    Search leases based on various criteria.
    
    Args:
        search_query: Search parameters
        
    Returns:
        List of matching lease records
    """
    try:
        # Convert Pydantic model to dict for service layer
        query_params = search_query.dict(exclude_none=True)
        
        leases = lease_service.search_leases(query_params)
        
        # Convert to response format
        lease_responses = []
        for lease in leases:
            lease_response = LeaseResponse(
                lease_id=lease.lease_id,
                property=PropertyResponse(
                    property_id=lease.property.property_id,
                    store_number=lease.property.store_number,
                    property_name=lease.property.property_name,
                    street=lease.property.street,
                    city=lease.property.city,
                    state=lease.property.state,
                    zip_code=lease.property.zip_code,
                    county=lease.property.county,
                    property_type=lease.property.property_type,
                    property_class=lease.property.property_class,
                    total_square_feet=lease.property.total_square_feet,
                    leased_area_sqft=lease.property.leased_area_sqft
                ),
                tenant=TenantResponse(
                    tenant_id=lease.tenant.tenant_id,
                    name=lease.tenant.name,
                    contact_person=lease.tenant.contact_person,
                    phone=lease.tenant.phone,
                    email=lease.tenant.email
                ),
                landlord=LandlordResponse(
                    landlord_id=lease.landlord.landlord_id,
                    name=lease.landlord.name,
                    contact_person=lease.landlord.contact_person,
                    phone=lease.landlord.phone,
                    email=lease.landlord.email
                ),
                lease_start_date=lease.lease_start_date,
                lease_end_date=lease.lease_end_date,
                lease_term_months=lease.lease_term_months,
                lease_type=lease.lease_type,
                base_monthly_rent=float(lease.base_monthly_rent),
                annual_base_rent=float(lease.annual_base_rent),
                rent_per_sqft=float(lease.rent_per_sqft),
                security_deposit=float(lease.security_deposit),
                lease_status=lease.lease_status,
                lease_expiry_warning=lease.lease_expiry_warning
            )
            lease_responses.append(lease_response)
        
        logger.info(f"Search returned {len(lease_responses)} leases")
        return lease_responses
        
    except Exception as e:
        logger.error(f"Error searching leases: {e}")
        raise HTTPException(status_code=500, detail=f"Error searching leases: {str(e)}")

@router.get("/analytics/summary", response_model=LeaseAnalyticsResponse)
@with_tracing("get_lease_analytics")
async def get_lease_analytics(
    user: DevFriendlyUser,
    lease_service: LeaseService = Depends(get_lease_service)
) -> LeaseAnalyticsResponse:
    """
    Get comprehensive lease portfolio analytics.
    
    Returns:
        Portfolio analytics including financial metrics, occupancy, and distributions.
    """
    try:
        analytics = lease_service.get_lease_summary_stats()
        
        return LeaseAnalyticsResponse(
            total_properties=analytics.get("total_properties", 0),
            total_annual_rent=analytics.get("total_annual_rent", 0.0),
            average_rent_per_sqft=analytics.get("average_rent_per_sqft", 0.0),
            total_square_feet=analytics.get("total_square_feet", 0),
            leased_square_feet=analytics.get("leased_square_feet", 0),
            occupancy_rate=analytics.get("occupancy_rate", 0.0),
            expiring_leases_count=analytics.get("expiring_leases_count", 0),
            lease_types_distribution=analytics.get("lease_types_distribution", {}),
            property_classes_distribution=analytics.get("property_classes_distribution", {}),
            city_distribution=analytics.get("city_distribution", {})
        )
        
    except Exception as e:
        logger.error(f"Error retrieving lease analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving analytics: {str(e)}")

@router.get("/expiring", response_model=List[LeaseResponse])
@with_tracing("get_expiring_leases")
async def get_expiring_leases(
    user: DevFriendlyUser,
    lease_service: LeaseService = Depends(get_lease_service),
    days_ahead: int = Query(90, ge=1, le=365, description="Look ahead this many days for expiring leases")
) -> List[LeaseResponse]:
    """
    Get leases that are expiring soon.
    
    Args:
        days_ahead: Number of days to look ahead for expiring leases
        
    Returns:
        List of leases expiring within the specified timeframe
    """
    try:
        # Search for expiring leases
        query_params = {"expiring_soon": True}
        leases = lease_service.search_leases(query_params)
        
        # Convert to response format
        lease_responses = []
        for lease in leases:
            lease_response = LeaseResponse(
                lease_id=lease.lease_id,
                property=PropertyResponse(
                    property_id=lease.property.property_id,
                    store_number=lease.property.store_number,
                    property_name=lease.property.property_name,
                    street=lease.property.street,
                    city=lease.property.city,
                    state=lease.property.state,
                    zip_code=lease.property.zip_code,
                    county=lease.property.county,
                    property_type=lease.property.property_type,
                    property_class=lease.property.property_class,
                    total_square_feet=lease.property.total_square_feet,
                    leased_area_sqft=lease.property.leased_area_sqft
                ),
                tenant=TenantResponse(
                    tenant_id=lease.tenant.tenant_id,
                    name=lease.tenant.name,
                    contact_person=lease.tenant.contact_person,
                    phone=lease.tenant.phone,
                    email=lease.tenant.email
                ),
                landlord=LandlordResponse(
                    landlord_id=lease.landlord.landlord_id,
                    name=lease.landlord.name,
                    contact_person=lease.landlord.contact_person,
                    phone=lease.landlord.phone,
                    email=lease.landlord.email
                ),
                lease_start_date=lease.lease_start_date,
                lease_end_date=lease.lease_end_date,
                lease_term_months=lease.lease_term_months,
                lease_type=lease.lease_type,
                base_monthly_rent=float(lease.base_monthly_rent),
                annual_base_rent=float(lease.annual_base_rent),
                rent_per_sqft=float(lease.rent_per_sqft),
                security_deposit=float(lease.security_deposit),
                lease_status=lease.lease_status,
                lease_expiry_warning=lease.lease_expiry_warning
            )
            lease_responses.append(lease_response)
        
        logger.info(f"Retrieved {len(lease_responses)} expiring leases")
        return lease_responses
        
    except Exception as e:
        logger.error(f"Error retrieving expiring leases: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving expiring leases: {str(e)}")

@router.get("/properties", response_model=List[PropertyResponse])
@with_tracing("get_all_properties")
async def get_all_properties(
    user: DevFriendlyUser,
    lease_service: LeaseService = Depends(get_lease_service)
) -> List[PropertyResponse]:
    """
    Get all properties from the lease portfolio.
    
    Returns:
        List of all properties
    """
    try:
        properties = lease_service.get_all_properties()
        
        property_responses = []
        for prop in properties:
            property_response = PropertyResponse(
                property_id=prop.property_id,
                store_number=prop.store_number,
                property_name=prop.property_name,
                street=prop.street,
                city=prop.city,
                state=prop.state,
                zip_code=prop.zip_code,
                county=prop.county,
                property_type=prop.property_type,
                property_class=prop.property_class,
                total_square_feet=prop.total_square_feet,
                leased_area_sqft=prop.leased_area_sqft
            )
            property_responses.append(property_response)
        
        logger.info(f"Retrieved {len(property_responses)} properties")
        return property_responses
        
    except Exception as e:
        logger.error(f"Error retrieving properties: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving properties: {str(e)}")
