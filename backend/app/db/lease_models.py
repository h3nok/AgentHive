"""
Lease data models for database integration.

This module provides SQLAlchemy models for lease management.
"""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Date, ForeignKey, JSON, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from uuid import uuid4

from app.db.base_class import Base


class Property(Base):
    """Property model for lease management."""
    __tablename__ = "properties"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    property_id = Column(String, unique=True, index=True, nullable=False)  # PROP-TSC-001
    store_number = Column(String, index=True, nullable=False)  # ST001
    property_name = Column(String, nullable=False)
    
    # Address information
    street = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)
    county = Column(String)
    
    # Property specifications
    property_type = Column(String, nullable=False)  # Retail, Industrial, etc.
    property_class = Column(String, nullable=False)  # Class A, Class B+, etc.
    total_square_feet = Column(Integer, nullable=False)
    leased_area_sqft = Column(Integer, nullable=False)
    warehouse_sqft = Column(Integer)
    retail_floor_sqft = Column(Integer)
    parking_spaces = Column(Integer)
    loading_docks = Column(Integer)
    year_built = Column(Integer)
    year_renovated = Column(Integer)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    leases = relationship("Lease", back_populates="property")


class Tenant(Base):
    """Tenant model for lease management."""
    __tablename__ = "tenants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    contact_person = Column(String)
    phone = Column(String)
    email = Column(String)
    tenant_type = Column(String)  # Corporate, Individual, etc.
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    leases = relationship("Lease", back_populates="tenant")


class Landlord(Base):
    """Landlord model for lease management."""
    __tablename__ = "landlords"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    contact_person = Column(String)
    phone = Column(String)
    email = Column(String)
    management_company = Column(String)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    leases = relationship("Lease", back_populates="landlord")


class Lease(Base):
    """Main lease model."""
    __tablename__ = "leases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Foreign Keys
    property_id = Column(UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    landlord_id = Column(UUID(as_uuid=True), ForeignKey("landlords.id"), nullable=False)
    
    # Lease terms
    lease_start_date = Column(Date, nullable=False)
    lease_end_date = Column(Date, nullable=False)
    lease_term_months = Column(Integer, nullable=False)
    lease_type = Column(String, nullable=False)  # Triple Net (NNN), Modified Gross, etc.
    
    # Financial details
    base_monthly_rent = Column(Numeric(precision=10, scale=2), nullable=False)
    annual_base_rent = Column(Numeric(precision=12, scale=2), nullable=False)
    rent_per_sqft = Column(Numeric(precision=8, scale=2), nullable=False)
    security_deposit = Column(Numeric(precision=10, scale=2))
    
    # NNN charges
    real_estate_taxes = Column(Numeric(precision=8, scale=2))
    insurance = Column(Numeric(precision=8, scale=2))
    cam_charges = Column(Numeric(precision=8, scale=2))
    total_monthly_nnn = Column(Numeric(precision=8, scale=2))
    
    # Status and metadata
    lease_status = Column(String, nullable=False)  # Active, Expiring Soon, Expired, etc.
    lease_expiry_warning = Column(Boolean, default=False)
    next_rent_review = Column(Date)
    
    # JSON fields for complex data
    renewal_options = Column(JSON)  # List of renewal option details
    termination_clauses = Column(JSON)  # List of termination clause details
    rent_escalations = Column(JSON)  # List of rent escalation details
    additional_deposits = Column(JSON)  # Dictionary of additional deposits
    responsibilities = Column(JSON)  # Dictionary of maintenance responsibilities
    special_provisions = Column(JSON)  # List of special provisions
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    property = relationship("Property", back_populates="leases")
    tenant = relationship("Tenant", back_populates="leases")
    landlord = relationship("Landlord", back_populates="leases")
    
    def __repr__(self):
        return f"<Lease(store={self.property.store_number}, tenant={self.tenant.name}, status={self.lease_status})>"


class LeaseAnalytics(Base):
    """Analytics and reporting model for lease portfolio."""
    __tablename__ = "lease_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    report_date = Column(Date, nullable=False, default=date.today)
    
    # Portfolio metrics
    total_properties = Column(Integer, nullable=False)
    total_annual_rent = Column(Numeric(precision=15, scale=2), nullable=False)
    average_rent_per_sqft = Column(Numeric(precision=8, scale=2), nullable=False)
    total_leased_sqft = Column(Integer, nullable=False)
    
    # Lease analysis
    properties_by_class = Column(JSON)  # {"Class A": 5, "Class B": 3}
    lease_types = Column(JSON)  # {"Triple Net": 6, "Modified Gross": 2}
    expiring_soon_count = Column(Integer, default=0)
    renewal_options_available = Column(Integer, default=0)
    average_lease_term_months = Column(Float)
    
    # Risk metrics
    top_risk_properties = Column(JSON)  # List of properties requiring attention
    lease_concentration_risk = Column(JSON)  # Analysis of geographic/tenant concentration
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
