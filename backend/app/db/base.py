"""
Base module.

This module imports all models to make them available for Alembic.
"""

from app.db.base_class import Base  # noqa
from app.db.models import User, Agent, RequestMetrics  # noqa 