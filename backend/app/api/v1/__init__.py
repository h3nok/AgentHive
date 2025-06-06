"""API v1 module.""" 

from fastapi import APIRouter
from .agents import router as agents_router
from .router import router as router_router
from .workflows import router as workflows_router

router = APIRouter()

router.include_router(agents_router, prefix="/agents", tags=["agents"])
router.include_router(router_router, prefix="/router", tags=["router"])
router.include_router(workflows_router, prefix="/workflows", tags=["workflows"]) 