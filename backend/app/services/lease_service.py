"""
Lease database service for managing lease data operations.

This service provides CRUD operations and business logic for lease management.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc

from app.db.lease_models import Property, Tenant, Landlord, Lease, LeaseAnalytics
from app.core.observability import get_logger

logger = get_logger(__name__)


class LeaseService:
    """Service for lease data operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Property operations
    def get_property_by_id(self, property_id: str) -> Optional[Property]:
        """Get property by property_id (e.g., PROP-TSC-001)."""
        return self.db.query(Property).filter(Property.property_id == property_id).first()
    
    def get_property_by_store_number(self, store_number: str) -> Optional[Property]:
        """Get property by store number (e.g., ST001)."""
        return self.db.query(Property).filter(Property.store_number == store_number).first()
    
    def create_property(self, property_data: Dict[str, Any]) -> Property:
        """Create a new property record."""
        property_obj = Property(**property_data)
        self.db.add(property_obj)
        self.db.commit()
        self.db.refresh(property_obj)
        return property_obj
    
    def get_all_properties(self) -> List[Property]:
        """Get all property records."""
        return self.db.query(Property).all()
    
    # Tenant operations
    def get_or_create_tenant(self, tenant_data: Dict[str, Any]) -> Tenant:
        """Get existing tenant or create new one."""
        existing = self.db.query(Tenant).filter(
            and_(
                Tenant.name == tenant_data["name"],
                Tenant.email == tenant_data.get("email")
            )
        ).first()
        
        if existing:
            return existing
        
        tenant = Tenant(**tenant_data)
        self.db.add(tenant)
        self.db.commit()
        self.db.refresh(tenant)
        return tenant
    
    # Landlord operations
    def get_or_create_landlord(self, landlord_data: Dict[str, Any]) -> Landlord:
        """Get existing landlord or create new one."""
        existing = self.db.query(Landlord).filter(
            and_(
                Landlord.name == landlord_data["name"],
                Landlord.email == landlord_data.get("email")
            )
        ).first()
        
        if existing:
            return existing
        
        landlord = Landlord(**landlord_data)
        self.db.add(landlord)
        self.db.commit()
        self.db.refresh(landlord)
        return landlord
    
    # Lease operations
    def get_all_leases(self) -> List[Lease]:
        """Get all lease records with related data."""
        return self.db.query(Lease).options(
            joinedload(Lease.property),
            joinedload(Lease.tenant),
            joinedload(Lease.landlord)
        ).all()
    
    def get_lease_by_id(self, lease_id: str) -> Optional[Lease]:
        """Get lease by ID (UUID)."""
        return self.db.query(Lease).filter(Lease.id == lease_id).options(
            joinedload(Lease.property),
            joinedload(Lease.tenant),
            joinedload(Lease.landlord)
        ).first()
    
    def get_all_properties(self) -> List[Property]:
        """Get all property records."""
        return self.db.query(Property).all()
    
    def get_lease_by_store(self, store_number: str) -> Optional[Lease]:
        """Get lease by store number."""
        return self.db.query(Lease).join(Property).filter(
            Property.store_number == store_number
        ).options(
            joinedload(Lease.property),
            joinedload(Lease.tenant),
            joinedload(Lease.landlord)
        ).first()
    
    def get_expiring_leases(self, days_ahead: int = 180) -> List[Lease]:
        """Get leases expiring within specified days."""
        cutoff_date = date.today() + timedelta(days=days_ahead)
        return self.db.query(Lease).filter(
            or_(
                Lease.lease_end_date <= cutoff_date,
                Lease.lease_expiry_warning == True
            )
        ).options(
            joinedload(Lease.property),
            joinedload(Lease.tenant),
            joinedload(Lease.landlord)
        ).all()
    
    def get_leases_by_status(self, status: str) -> List[Lease]:
        """Get leases by status."""
        return self.db.query(Lease).filter(
            Lease.lease_status == status
        ).options(
            joinedload(Lease.property),
            joinedload(Lease.tenant),
            joinedload(Lease.landlord)
        ).all()
    
    def create_lease(self, lease_data: Dict[str, Any]) -> Lease:
        """Create a new lease record."""
        lease = Lease(**lease_data)
        self.db.add(lease)
        self.db.commit()
        self.db.refresh(lease)
        return lease
    
    def update_lease(self, lease_id: str, update_data: Dict[str, Any]) -> Optional[Lease]:
        """Update an existing lease."""
        lease = self.db.query(Lease).filter(Lease.id == lease_id).first()
        if not lease:
            return None
        
        for key, value in update_data.items():
            if hasattr(lease, key):
                setattr(lease, key, value)
        
        lease.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(lease)
        return lease
    
    # Analytics operations
    def generate_portfolio_analytics(self) -> LeaseAnalytics:
        """Generate comprehensive portfolio analytics."""
        leases = self.get_all_leases()
        
        if not leases:
            logger.warning("No leases found for analytics generation")
            return None
        
        # Calculate metrics
        total_properties = len(leases)
        total_annual_rent = sum(float(lease.annual_base_rent) for lease in leases)
        total_leased_sqft = sum(lease.property.leased_area_sqft for lease in leases)
        average_rent_per_sqft = total_annual_rent / total_leased_sqft if total_leased_sqft > 0 else 0
        
        # Property class distribution
        properties_by_class = {}
        for lease in leases:
            prop_class = lease.property.property_class
            properties_by_class[prop_class] = properties_by_class.get(prop_class, 0) + 1
        
        # Lease type distribution
        lease_types = {}
        for lease in leases:
            lease_type = lease.lease_type
            lease_types[lease_type] = lease_types.get(lease_type, 0) + 1
        
        # Risk analysis
        expiring_soon = len([l for l in leases if l.lease_expiry_warning or l.lease_status == "Expiring Soon"])
        renewal_options_available = len([l for l in leases if l.renewal_options])
        average_lease_term = sum(lease.lease_term_months for lease in leases) / len(leases) if leases else 0
        
        # Create analytics record
        analytics = LeaseAnalytics(
            total_properties=total_properties,
            total_annual_rent=Decimal(str(total_annual_rent)),
            average_rent_per_sqft=Decimal(str(round(average_rent_per_sqft, 2))),
            total_leased_sqft=total_leased_sqft,
            properties_by_class=properties_by_class,
            lease_types=lease_types,
            expiring_soon_count=expiring_soon,
            renewal_options_available=renewal_options_available,
            average_lease_term_months=average_lease_term
        )
        
        self.db.add(analytics)
        self.db.commit()
        self.db.refresh(analytics)
        
        logger.info(f"Generated portfolio analytics: {total_properties} properties, ${total_annual_rent:,.2f} annual rent")
        return analytics
    
    def get_latest_analytics(self) -> Optional[LeaseAnalytics]:
        """Get the most recent analytics record."""
        return self.db.query(LeaseAnalytics).order_by(desc(LeaseAnalytics.created_at)).first()
    
    # Data import operations
    def import_lease_from_json(self, lease_json: Dict[str, Any]) -> Lease:
        """Import a single lease record from JSON format."""
        try:
            # Extract and create/get property
            property_data = {
                "property_id": lease_json["property_id"],
                "store_number": lease_json["store_number"],
                "property_name": lease_json["property_name"],
                "street": lease_json["address"]["street"],
                "city": lease_json["address"]["city"],
                "state": lease_json["address"]["state"],
                "zip_code": lease_json["address"]["zip_code"],
                "county": lease_json["address"].get("county"),
                "property_type": lease_json["property_specifications"]["property_type"],
                "property_class": lease_json["property_specifications"]["property_class"],
                "total_square_feet": lease_json["property_specifications"]["total_square_feet"],
                "leased_area_sqft": lease_json["property_specifications"]["leased_area_sqft"],
                "warehouse_sqft": lease_json["property_specifications"].get("warehouse_sqft"),
                "retail_floor_sqft": lease_json["property_specifications"].get("retail_floor_sqft"),
                "parking_spaces": lease_json["property_specifications"].get("parking_spaces"),
                "loading_docks": lease_json["property_specifications"].get("loading_docks"),
                "year_built": lease_json["property_specifications"].get("year_built"),
                "year_renovated": lease_json["property_specifications"].get("year_renovated")
            }
            
            # Check if property already exists
            existing_property = self.get_property_by_id(property_data["property_id"])
            if existing_property:
                property_obj = existing_property
            else:
                property_obj = self.create_property(property_data)
            
            # Create/get tenant
            tenant_data = lease_json["tenant"]
            tenant_obj = self.get_or_create_tenant(tenant_data)
            
            # Create/get landlord
            landlord_data = lease_json["landlord"]
            landlord_obj = self.get_or_create_landlord(landlord_data)
            
            # Create lease
            lease_data = {
                "property_id": property_obj.id,
                "tenant_id": tenant_obj.id,
                "landlord_id": landlord_obj.id,
                "lease_start_date": datetime.strptime(lease_json["lease_terms"]["lease_start_date"], "%Y-%m-%d").date(),
                "lease_end_date": datetime.strptime(lease_json["lease_terms"]["lease_end_date"], "%Y-%m-%d").date(),
                "lease_term_months": lease_json["lease_terms"]["lease_term_months"],
                "lease_type": lease_json["lease_terms"]["lease_type"],
                "base_monthly_rent": Decimal(str(lease_json["financial_details"]["base_monthly_rent"])),
                "annual_base_rent": Decimal(str(lease_json["financial_details"]["annual_base_rent"])),
                "rent_per_sqft": Decimal(str(lease_json["financial_details"]["rent_per_sqft"])),
                "security_deposit": Decimal(str(lease_json["financial_details"].get("security_deposit", 0))),
                "real_estate_taxes": Decimal(str(lease_json["financial_details"]["nnn_charges"].get("real_estate_taxes", 0))),
                "insurance": Decimal(str(lease_json["financial_details"]["nnn_charges"].get("insurance", 0))),
                "cam_charges": Decimal(str(lease_json["financial_details"]["nnn_charges"].get("cam_charges", 0))),
                "total_monthly_nnn": Decimal(str(lease_json["financial_details"]["nnn_charges"].get("total_monthly_nnn", 0))),
                "lease_status": lease_json["lease_status"],
                "lease_expiry_warning": lease_json.get("lease_expiry_warning", False),
                "next_rent_review": datetime.strptime(lease_json["next_rent_review"], "%Y-%m-%d").date() if lease_json.get("next_rent_review") else None,
                "renewal_options": lease_json["lease_terms"].get("renewal_options", []),
                "termination_clauses": lease_json["lease_terms"].get("termination_clauses", []),
                "rent_escalations": lease_json["financial_details"].get("rent_escalations", []),
                "additional_deposits": lease_json["financial_details"].get("additional_deposits", {}),
                "responsibilities": lease_json.get("responsibilities", {}),
                "special_provisions": lease_json.get("special_provisions", []),
                "last_updated": datetime.strptime(lease_json["last_updated"], "%Y-%m-%dT%H:%M:%SZ") if lease_json.get("last_updated") else datetime.utcnow()
            }
            
            return self.create_lease(lease_data)
            
        except Exception as e:
            logger.error(f"Error importing lease from JSON: {e}")
            self.db.rollback()
            raise
    
    def import_all_leases_from_json(self, json_data: Dict[str, Any]) -> List[Lease]:
        """Import all leases from JSON data."""
        imported_leases = []
        leases_data = json_data.get("leases", [])
        
        logger.info(f"Starting import of {len(leases_data)} leases")
        
        for i, lease_json in enumerate(leases_data):
            try:
                # Check if lease already exists
                existing_lease = self.get_lease_by_store(lease_json["store_number"])
                if existing_lease:
                    logger.info(f"Lease for store {lease_json['store_number']} already exists, skipping")
                    continue
                
                lease = self.import_lease_from_json(lease_json)
                imported_leases.append(lease)
                logger.info(f"Imported lease {i+1}/{len(leases_data)}: Store {lease_json['store_number']}")
                
            except Exception as e:
                logger.error(f"Failed to import lease {i+1} (Store {lease_json.get('store_number', 'Unknown')}): {e}")
                continue
        
        logger.info(f"Successfully imported {len(imported_leases)} leases")
        return imported_leases
    
    # Query operations for the agent
    def search_leases(self, query_params: Dict[str, Any]) -> List[Lease]:
        """Search leases based on various criteria."""
        query = self.db.query(Lease).options(
            joinedload(Lease.property),
            joinedload(Lease.tenant),
            joinedload(Lease.landlord)
        )
        
        # Filter by status
        if "status" in query_params:
            query = query.filter(Lease.lease_status == query_params["status"])
        
        # Filter by property class
        if "property_class" in query_params:
            query = query.join(Property).filter(Property.property_class == query_params["property_class"])
        
        # Filter by lease type
        if "lease_type" in query_params:
            query = query.filter(Lease.lease_type == query_params["lease_type"])
        
        # Filter by city
        if "city" in query_params:
            query = query.join(Property).filter(Property.city == query_params["city"])
        
        # Filter by expiring soon
        if query_params.get("expiring_soon"):
            query = query.filter(Lease.lease_expiry_warning == True)
        
        return query.all()
    
    def get_lease_summary_stats(self) -> Dict[str, Any]:
        """Get summary statistics for lease portfolio."""
        leases = self.get_all_leases()
        
        if not leases:
            return {"error": "No leases found"}
        
        return {
            "total_leases": len(leases),
            "total_annual_rent": sum(float(lease.annual_base_rent) for lease in leases),
            "average_rent_per_sqft": sum(float(lease.rent_per_sqft) for lease in leases) / len(leases),
            "total_sqft": sum(lease.property.leased_area_sqft for lease in leases),
            "expiring_soon": len([l for l in leases if l.lease_expiry_warning]),
            "active_leases": len([l for l in leases if l.lease_status == "Active"]),
            "cities": list(set(lease.property.city for lease in leases)),
            "property_classes": list(set(lease.property.property_class for lease in leases)),
            "lease_types": list(set(lease.lease_type for lease in leases))
        }
