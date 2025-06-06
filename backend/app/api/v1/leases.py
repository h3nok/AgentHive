"""
Lease API endpoints for database-driven lease management.

This module provides REST API endpoints for lease data access, search, and analytics.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime, date
from decimal import Decimal

from app.core.observability import get_logger
from app.services.lease_service import LeaseService
from app.db.session import get_db

logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/leases", tags=["leases"])

# Pydantic models for API responses
class PropertyResponse(BaseModel):
    """Property information response model."""
    id: str
    property_id: str
    store_number: str
    property_name: str
    street: str
    city: str
    state: str
    zip_code: str
    county: Optional[str] = None
    property_type: str
    property_class: str
    total_square_feet: int
    leased_area_sqft: int
    warehouse_sqft: Optional[int] = None
    retail_floor_sqft: Optional[int] = None
    parking_spaces: Optional[int] = None
    loading_docks: Optional[int] = None
    year_built: Optional[int] = None
    year_renovated: Optional[int] = None
    
    class Config:
        from_attributes = True

class TenantResponse(BaseModel):
    """Tenant information response model."""
    id: str
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tenant_type: Optional[str] = None
    
    class Config:
        from_attributes = True

class LandlordResponse(BaseModel):
    """Landlord information response model."""
    id: str
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    management_company: Optional[str] = None
    
    class Config:
        from_attributes = True

class LeaseResponse(BaseModel):
    """Lease information response model."""
    id: str
    property: PropertyResponse
    tenant: TenantResponse
    landlord: LandlordResponse
    lease_start_date: date
    lease_end_date: date
    lease_term_months: int
    lease_type: str
    base_monthly_rent: Decimal
    annual_base_rent: Decimal
    rent_per_sqft: Decimal
    security_deposit: Optional[Decimal] = None
    lease_status: str
    lease_expiry_warning: bool
    
    class Config:
        from_attributes = True

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
    total_sqft: int
    expiring_soon: int
    active_leases: int
    cities: List[str]
    property_classes: List[str]
    lease_types: List[str]

# Database dependency
def get_lease_service(db: Session = Depends(get_db)) -> LeaseService:
    """Get lease service instance."""
    return LeaseService(db)

@router.get("/", response_model=List[LeaseResponse])
def get_all_leases(
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
                id=str(lease.id),
                property=PropertyResponse(
                    id=str(lease.property.id),
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
                    leased_area_sqft=lease.property.leased_area_sqft,
                    warehouse_sqft=lease.property.warehouse_sqft,
                    retail_floor_sqft=lease.property.retail_floor_sqft,
                    parking_spaces=lease.property.parking_spaces,
                    loading_docks=lease.property.loading_docks,
                    year_built=lease.property.year_built,
                    year_renovated=lease.property.year_renovated
                ),
                tenant=TenantResponse(
                    id=str(lease.tenant.id),
                    name=lease.tenant.name,
                    contact_person=lease.tenant.contact_person,
                    phone=lease.tenant.phone,
                    email=lease.tenant.email,
                    tenant_type=lease.tenant.tenant_type
                ),
                landlord=LandlordResponse(
                    id=str(lease.landlord.id),
                    name=lease.landlord.name,
                    contact_person=lease.landlord.contact_person,
                    phone=lease.landlord.phone,
                    email=lease.landlord.email,
                    management_company=lease.landlord.management_company
                ),
                lease_start_date=lease.lease_start_date,
                lease_end_date=lease.lease_end_date,
                lease_term_months=lease.lease_term_months,
                lease_type=lease.lease_type,
                base_monthly_rent=lease.base_monthly_rent,
                annual_base_rent=lease.annual_base_rent,
                rent_per_sqft=lease.rent_per_sqft,
                security_deposit=lease.security_deposit,
                lease_status=lease.lease_status,
                lease_expiry_warning=lease.lease_expiry_warning
            )
            lease_responses.append(lease_response)
        
        logger.info(f"Retrieved {len(lease_responses)} leases (total available: {len(leases)})")
        return lease_responses
        
    except Exception as e:
        logger.error(f"Error retrieving leases: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving leases: {str(e)}")

@router.get("/analytics/summary", response_model=LeaseAnalyticsResponse)
def get_lease_analytics(
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
            total_properties=analytics.get("total_leases", 0),
            total_annual_rent=analytics.get("total_annual_rent", 0.0),
            average_rent_per_sqft=analytics.get("average_rent_per_sqft", 0.0),
            total_sqft=analytics.get("total_sqft", 0),
            expiring_soon=analytics.get("expiring_soon", 0),
            active_leases=analytics.get("active_leases", 0),
            cities=analytics.get("cities", []),
            property_classes=analytics.get("property_classes", []),
            lease_types=analytics.get("lease_types", [])
        )
        
    except Exception as e:
        logger.error(f"Error retrieving lease analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving analytics: {str(e)}")
