#!/usr/bin/env python3
"""
Simple lease data migration script.
Run from the app directory: python migrate_lease_data_simple.py
"""

import json
import sys
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import models and services
from db.base_class import Base
from db.lease_models import Property, Tenant, Landlord, Lease, LeaseAnalytics
from services.lease_service import LeaseService
from core.settings import settings

def main():
    print("=== Lease Data Migration ===")
    print("Starting migration process...")
    
    # Load synthetic data
    data_path = Path(__file__).parent / "data" / "lease_synthetic_data.json"
    print(f"Looking for data at: {data_path}")
    
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"Loaded {len(data.get('leases', []))} lease records")
    except FileNotFoundError:
        print(f"Error: Lease data file not found at {data_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON data: {e}")
        return False
    
    # Create database connection (convert async URL to sync)
    db_url = str(settings.database_url).replace("postgresql+asyncpg://", "postgresql://")
    # Fix double slash in URL if present
    db_url = db_url.replace("//test_db", "/intelligent_router")
    print(f"Connecting to database: {db_url.split('@')[1] if '@' in db_url else db_url}")
    
    try:
        engine = create_engine(db_url, echo=settings.db_echo)
        SessionLocal = sessionmaker(bind=engine)
        
        # Create tables
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully")
        
        # Import data
        with SessionLocal() as db:
            lease_service = LeaseService(db)
            
            # Import all leases
            print("Importing lease data...")
            imported_leases = lease_service.import_all_leases_from_json(data)
            
            if imported_leases:
                print(f"Successfully imported {len(imported_leases)} leases")
                
                # Generate analytics
                print("Generating portfolio analytics...")
                analytics = lease_service.generate_portfolio_analytics()
                if analytics:
                    print(f"Analytics: {analytics.total_properties} properties, ${float(analytics.total_annual_rent):,.2f} annual rent")
                
                print("Migration completed successfully!")
                return True
            else:
                print("No leases were imported")
                return False
                
    except Exception as e:
        print(f"Error during migration: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
