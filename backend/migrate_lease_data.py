"""
Database migration script for lease data.

This script migrates synthetic lease data from JSON to the database.
"""

import json
import sys
import os
from pathlib import Path

# Add the backend/app directory to Python path
backend_app_path = Path(__file__).parent / "app"
sys.path.insert(0, str(backend_app_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.base_class import Base
from db.lease_models import Property, Tenant, Landlord, Lease, LeaseAnalytics
from services.lease_service import LeaseService
from core.settings import settings
from core.observability import get_logger

logger = get_logger(__name__)


def create_tables(engine):
    """Create all lease-related tables."""
    logger.info("Creating lease tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tables created successfully")


def load_synthetic_data():
    """Load synthetic lease data from JSON file."""
    data_path = Path(__file__).parent.parent / "app" / "data" / "lease_synthetic_data.json"
    
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            logger.info(f"Loaded synthetic data with {len(data.get('leases', []))} lease records")
            return data
    except FileNotFoundError:
        logger.error(f"Synthetic data file not found at {data_path}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON data: {e}")
        return None


def migrate_data_to_database():
    """Migrate synthetic data to database."""
    logger.info("Starting lease data migration...")
    
    # Load synthetic data
    synthetic_data = load_synthetic_data()
    if not synthetic_data:
        logger.error("Failed to load synthetic data")
        return False
    
    # Create database engine and session
    # Convert async URL to sync URL for migration
    db_url = str(settings.database_url).replace("postgresql+asyncpg://", "postgresql://")
    engine = create_engine(db_url, echo=settings.db_echo)
    SessionLocal = sessionmaker(bind=engine)
    
    # Create tables
    create_tables(engine)
    
    # Start migration
    with SessionLocal() as db:
        lease_service = LeaseService(db)
        
        try:
            # Import all leases
            imported_leases = lease_service.import_all_leases_from_json(synthetic_data)
            
            if imported_leases:
                logger.info(f"Successfully imported {len(imported_leases)} leases")
                
                # Generate analytics
                analytics = lease_service.generate_portfolio_analytics()
                if analytics:
                    logger.info(f"Generated portfolio analytics: ${float(analytics.total_annual_rent):,.2f} total annual rent")
                
                return True
            else:
                logger.warning("No leases were imported")
                return False
                
        except Exception as e:
            logger.error(f"Error during migration: {e}")
            db.rollback()
            raise e


def verify_migration():
    """Verify the migration was successful."""
    logger.info("Verifying migration...")
    
    engine = create_engine(str(settings.database_url), echo=False)
    SessionLocal = sessionmaker(bind=engine)
    
    with SessionLocal() as db:
        lease_service = LeaseService(db)
        
        # Check lease count
        leases = lease_service.get_all_leases()
        logger.info(f"Found {len(leases)} leases in database")
        
        # Check analytics
        analytics = lease_service.get_latest_analytics()
        if analytics:
            logger.info(f"Analytics: {analytics.total_properties} properties, ${float(analytics.total_annual_rent):,.2f} annual rent")
        
        # Sample lease details
        if leases:
            sample_lease = leases[0]
            logger.info(f"Sample lease: Store {sample_lease.property.store_number} - {sample_lease.property.property_name}")
            logger.info(f"  Tenant: {sample_lease.tenant.name}")
            logger.info(f"  Monthly rent: ${float(sample_lease.base_monthly_rent):,.2f}")
            logger.info(f"  Status: {sample_lease.lease_status}")
        
        return len(leases) > 0


def main():
    """Main migration function."""
    logger.info("=== Lease Data Migration Tool ===")
    
    # Check if we should recreate tables
    recreate = "--recreate" in sys.argv
    if recreate:
        logger.info("Recreating tables (WARNING: This will drop existing data)")
        engine = create_engine(str(settings.database_url), echo=False)
        Base.metadata.drop_all(bind=engine)
    
    # Run migration
    success = migrate_data_to_database()
    
    if success:
        logger.info("Migration completed successfully")
        
        # Verify migration
        if verify_migration():
            logger.info("Migration verification passed")
            return True
        else:
            logger.error("Migration verification failed")
            return False
    else:
        logger.error("Migration failed")
        return False


if __name__ == "__main__":
    main()
