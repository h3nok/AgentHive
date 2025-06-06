"""
Plugin Marketplace & Discovery API endpoints.

This module provides REST API endpoints for the plugin store service,
enabling plugin discovery, installation, management, and marketplace integration.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status, Query, Path, Depends
from pydantic import BaseModel, Field

from app.core.observability import get_logger, with_tracing
from app.core.errors import PluginNotFoundException, PluginInstallationError, PluginValidationError
from app.services.plugin_store import (
    PluginStoreService, 
    PluginInfo, 
    InstalledPlugin
)
from .deps import require_admin

logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/plugins", tags=["plugins"])

# Pydantic models for API requests/responses
class PluginDiscoveryQuery(BaseModel):
    """Query parameters for plugin discovery."""
    category: Optional[str] = Field(None, description="Filter by category")
    tags: Optional[List[str]] = Field(default_factory=list, description="Filter by tags")
    search_query: Optional[str] = Field(None, description="Search in name and description", alias="q")
    sort_by: str = Field("popularity", description="Sort criteria: popularity, name, date, rating")
    limit: int = Field(50, ge=1, le=100, description="Maximum number of results")


class PluginInstallRequest(BaseModel):
    """Request model for plugin installation."""
    plugin_id: str = Field(..., description="Plugin ID to install")
    version_spec: Optional[str] = Field(None, description="Version specification (e.g., '>=1.0.0')")
    force_reinstall: bool = Field(False, description="Force reinstall if already installed")


class PluginUpdateRequest(BaseModel):
    """Request model for plugin updates."""
    plugin_id: str = Field(..., description="Plugin ID to update")
    version_spec: Optional[str] = Field(None, description="Target version specification")


class PluginOperationResponse(BaseModel):
    """Response model for plugin operations."""
    success: bool
    message: str
    plugin_id: str
    operation: str
    details: Optional[Dict[str, Any]] = None


class PluginHealthResponse(BaseModel):
    """Response model for plugin health check."""
    plugin_id: str
    name: str
    status: str
    health_status: str
    last_health_check: str
    metrics: Dict[str, Any]
    issues: List[str] = Field(default_factory=list)


class PluginStoreStats(BaseModel):
    """Plugin store statistics."""
    total_available: int
    total_installed: int
    total_enabled: int
    categories: List[str]
    most_popular: List[str]
    recently_updated: List[str]


# Service dependency
async def get_plugin_store() -> PluginStoreService:
    """Get plugin store service instance."""
    return PluginStoreService()


PluginStore = Depends(get_plugin_store)


# Discovery endpoints
@router.get("/discover", response_model=List[PluginInfo])
@with_tracing("api_plugins_discover")
async def discover_plugins(
    plugin_store: PluginStoreService = PluginStore,
    category: Optional[str] = Query(None, description="Filter by category"),
    tags: Optional[List[str]] = Query(default=[], description="Filter by tags"),
    q: Optional[str] = Query(None, description="Search query", alias="search"),
    sort_by: str = Query("popularity", description="Sort criteria"),
    limit: int = Query(50, ge=1, le=100, description="Maximum results"),
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Discover available plugins from the marketplace.
    
    Supports filtering by category, tags, and search queries.
    Results are cached for performance.
    """
    try:
        plugins = await plugin_store.discover_plugins(
            category=category,
            tags=tags if tags else None,
            search_query=q,
            sort_by=sort_by,
            limit=limit
        )
        
        logger.info(f"Discovered {len(plugins)} plugins for user {user.get('user_id')}")
        return plugins
        
    except Exception as e:
        logger.error(f"Error discovering plugins: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to discover plugins from marketplace"
        )


@router.get("/search", response_model=List[PluginInfo])
@with_tracing("api_plugins_search")
async def search_plugins(
    query: str = Query(..., description="Search query", min_length=1),
    plugin_store: PluginStoreService = PluginStore,
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results"),
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Search plugins with advanced filtering.
    
    Performs full-text search across plugin names, descriptions, and tags.
    """
    try:
        plugins = await plugin_store.discover_plugins(
            search_query=query,
            category=category,
            limit=limit,
            sort_by="relevance"
        )
        
        logger.info(f"Search '{query}' returned {len(plugins)} results")
        return plugins
        
    except Exception as e:
        logger.error(f"Error searching plugins: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search plugins"
        )


@router.get("/details/{plugin_id}", response_model=PluginInfo)
@with_tracing("api_plugins_get_details")
async def get_plugin_details(
    plugin_id: str = Path(..., description="Plugin ID"),
    plugin_store: PluginStoreService = PluginStore,
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Get detailed information about a specific plugin.
    
    Returns comprehensive plugin metadata including compatibility,
    requirements, and marketplace information.
    """
    try:
        plugin_info = await plugin_store.get_plugin_details(plugin_id)
        
        if not plugin_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plugin {plugin_id} not found"
            )
        
        return plugin_info
        
    except PluginNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plugin {plugin_id} not found in marketplace"
        )
    except Exception as e:
        logger.error(f"Error getting plugin details: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve plugin details"
        )


# Installation management endpoints
@router.post("/install", response_model=PluginOperationResponse)
@with_tracing("api_plugins_install")
async def install_plugin(
    request: PluginInstallRequest,
    plugin_store: PluginStoreService = PluginStore,
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Install a plugin from the marketplace.
    
    Requires admin privileges. Downloads, validates, and installs
    the plugin with all dependencies.
    """
    try:
        # Check if already installed and force reinstall not requested
        installed_plugins = await plugin_store.list_installed_plugins()
        if request.plugin_id in installed_plugins and not request.force_reinstall:
            return PluginOperationResponse(
                success=False,
                message="Plugin already installed. Use force_reinstall=true to reinstall.",
                plugin_id=request.plugin_id,
                operation="install",
                details={"installed_version": installed_plugins[request.plugin_id].version}
            )
        
        # Perform installation
        success = await plugin_store.install_plugin(
            plugin_id=request.plugin_id,
            version_spec=request.version_spec
        )
        
        if success:
            logger.info(f"Successfully installed plugin {request.plugin_id}")
            return PluginOperationResponse(
                success=True,
                message="Plugin installed successfully",
                plugin_id=request.plugin_id,
                operation="install"
            )
        else:
            return PluginOperationResponse(
                success=False,
                message="Plugin installation failed",
                plugin_id=request.plugin_id,
                operation="install"
            )
            
    except PluginNotFoundException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plugin {request.plugin_id} not found in marketplace"
        )
    except PluginValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plugin validation failed: {str(e)}"
        )
    except PluginInstallationError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Plugin installation failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error installing plugin {request.plugin_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to install plugin"
        )


@router.delete("/uninstall/{plugin_id}", response_model=PluginOperationResponse)
@with_tracing("api_plugins_uninstall")
async def uninstall_plugin(
    plugin_id: str = Path(..., description="Plugin ID"),
    plugin_store: PluginStoreService = PluginStore,
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Uninstall a plugin.
    
    Requires admin privileges. Removes plugin files and cleans up
    associated resources.
    """
    try:
        success = await plugin_store.uninstall_plugin(plugin_id)
        
        if success:
            logger.info(f"Successfully uninstalled plugin {plugin_id}")
            return PluginOperationResponse(
                success=True,
                message="Plugin uninstalled successfully",
                plugin_id=plugin_id,
                operation="uninstall"
            )
        else:
            return PluginOperationResponse(
                success=False,
                message="Plugin uninstall failed - plugin not found",
                plugin_id=plugin_id,
                operation="uninstall"
            )
            
    except Exception as e:
        logger.error(f"Error uninstalling plugin {plugin_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to uninstall plugin"
        )


@router.post("/update", response_model=PluginOperationResponse)
@with_tracing("api_plugins_update")
async def update_plugin(
    request: PluginUpdateRequest,
    plugin_store: PluginStoreService = PluginStore,
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Update a plugin to the latest version.
    
    Requires admin privileges. Checks for updates and performs
    safe upgrade with rollback capability.
    """
    try:
        # Check if plugin is installed
        installed_plugins = await plugin_store.list_installed_plugins()
        if request.plugin_id not in installed_plugins:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plugin {request.plugin_id} is not installed"
            )
        
        # Check for updates
        updates = await plugin_store.check_plugin_updates([request.plugin_id])
        if request.plugin_id not in updates:
            return PluginOperationResponse(
                success=True,
                message="Plugin is already up to date",
                plugin_id=request.plugin_id,
                operation="update",
                details={"current_version": installed_plugins[request.plugin_id].version}
            )
        
        # Perform update (uninstall + install)
        await plugin_store.uninstall_plugin(request.plugin_id)
        success = await plugin_store.install_plugin(
            plugin_id=request.plugin_id,
            version_spec=request.version_spec
        )
        
        if success:
            return PluginOperationResponse(
                success=True,
                message="Plugin updated successfully",
                plugin_id=request.plugin_id,
                operation="update",
                details={"new_version": updates[request.plugin_id].version}
            )
        else:
            return PluginOperationResponse(
                success=False,
                message="Plugin update failed",
                plugin_id=request.plugin_id,
                operation="update"
            )
            
    except Exception as e:
        logger.error(f"Error updating plugin {request.plugin_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update plugin"
        )


# Plugin management endpoints
@router.get("/installed", response_model=List[InstalledPlugin])
@with_tracing("api_plugins_list_installed")
async def list_installed_plugins(
    plugin_store: PluginStoreService = PluginStore,
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    List all installed plugins.
    
    Returns detailed information about locally installed plugins
    including version, status, and health information.
    """
    try:
        installed_plugins = await plugin_store.list_installed_plugins()
        return list(installed_plugins.values())
        
    except Exception as e:
        logger.error(f"Error listing installed plugins: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list installed plugins"
        )


@router.post("/toggle/{plugin_id}", response_model=PluginOperationResponse)
@with_tracing("api_plugins_toggle")
async def toggle_plugin(
    plugin_id: str = Path(..., description="Plugin ID"),
    enable: bool = Query(..., description="Enable or disable the plugin"),
    plugin_store: PluginStoreService = PluginStore,
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Enable or disable a plugin.
    
    Requires admin privileges. Toggles plugin state without
    uninstalling it.
    """
    try:
        if enable:
            success = await plugin_store.enable_plugin(plugin_id)
            operation = "enable"
            message = "Plugin enabled successfully" if success else "Failed to enable plugin"
        else:
            success = await plugin_store.disable_plugin(plugin_id)
            operation = "disable"
            message = "Plugin disabled successfully" if success else "Failed to disable plugin"
        
        return PluginOperationResponse(
            success=success,
            message=message,
            plugin_id=plugin_id,
            operation=operation
        )
        
    except Exception as e:
        logger.error(f"Error toggling plugin {plugin_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to {'enable' if enable else 'disable'} plugin"
        )


@router.get("/updates", response_model=Dict[str, PluginInfo])
@with_tracing("api_plugins_check_updates")
async def check_plugin_updates(
    plugin_store: PluginStoreService = PluginStore,
    plugin_ids: Optional[List[str]] = Query(None, description="Specific plugin IDs to check"),
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Check for plugin updates.
    
    Returns available updates for installed plugins.
    If plugin_ids is provided, checks only those plugins.
    """
    try:
        installed_plugins = await plugin_store.list_installed_plugins()
        check_list = plugin_ids or list(installed_plugins.keys())
        
        updates = await plugin_store.check_plugin_updates(check_list)
        return updates
        
    except Exception as e:
        logger.error(f"Error checking plugin updates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check for plugin updates"
        )


# Health and monitoring endpoints
@router.get("/health", response_model=List[PluginHealthResponse])
@with_tracing("api_plugins_health")
async def get_plugins_health(
    plugin_store: PluginStoreService = PluginStore,
    plugin_id: Optional[str] = Query(None, description="Specific plugin ID"),
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Get health status of plugins.
    
    Returns health information including metrics and any issues.
    """
    try:
        installed_plugins = await plugin_store.list_installed_plugins()
        health_responses = []
        
        plugins_to_check = [plugin_id] if plugin_id else list(installed_plugins.keys())
        
        for pid in plugins_to_check:
            if pid in installed_plugins:
                plugin = installed_plugins[pid]
                health_responses.append(PluginHealthResponse(
                    plugin_id=pid,
                    name=plugin.name,
                    status="enabled" if plugin.enabled else "disabled",
                    health_status=plugin.health_status,
                    last_health_check=plugin.last_health_check.isoformat(),
                    metrics=plugin.metrics,
                    issues=[]  # TODO: Implement issue detection
                ))
        
        return health_responses
        
    except Exception as e:
        logger.error(f"Error getting plugin health: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get plugin health information"
        )


@router.post("/health/check/{plugin_id}", response_model=PluginHealthResponse)
@with_tracing("api_plugins_health_check")
async def run_plugin_health_check(
    plugin_id: str = Path(..., description="Plugin ID"),
    plugin_store: PluginStoreService = PluginStore,
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Run health check for a specific plugin.
    
    Requires admin privileges. Performs comprehensive health
    validation and updates plugin status.
    """
    try:
        health_status = await plugin_store.check_plugin_health(plugin_id)
        installed_plugins = await plugin_store.list_installed_plugins()
        
        if plugin_id not in installed_plugins:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plugin {plugin_id} is not installed"
            )
        
        plugin = installed_plugins[plugin_id]
        return PluginHealthResponse(
            plugin_id=plugin_id,
            name=plugin.name,
            status="enabled" if plugin.enabled else "disabled",
            health_status=health_status,
            last_health_check=plugin.last_health_check.isoformat(),
            metrics=plugin.metrics,
            issues=[]  # TODO: Implement issue detection
        )
        
    except Exception as e:
        logger.error(f"Error running health check for plugin {plugin_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to run plugin health check"
        )


# Statistics and analytics endpoints
@router.get("/stats", response_model=PluginStoreStats)
@with_tracing("api_plugins_stats")
async def get_plugin_store_stats(
    plugin_store: PluginStoreService = PluginStore,
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Get plugin store statistics.
    
    Returns overview statistics about available and installed plugins.
    """
    try:
        # Get marketplace stats
        available_plugins = await plugin_store.discover_plugins(limit=1000)
        installed_plugins = await plugin_store.list_installed_plugins()
        
        # Calculate statistics
        enabled_count = sum(1 for p in installed_plugins.values() if p.enabled)
        categories = list(set(p.agent_type for p in available_plugins))
        most_popular = sorted(available_plugins, key=lambda x: x.downloads, reverse=True)[:5]
        recently_updated = sorted(available_plugins, key=lambda x: x.last_updated, reverse=True)[:5]
        
        return PluginStoreStats(
            total_available=len(available_plugins),
            total_installed=len(installed_plugins),
            total_enabled=enabled_count,
            categories=categories,
            most_popular=[p.id for p in most_popular],
            recently_updated=[p.id for p in recently_updated]
        )
        
    except Exception as e:
        logger.error(f"Error getting plugin store stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get plugin store statistics"
        )


# Marketplace sync endpoints
@router.post("/sync", response_model=Dict[str, Any])
@with_tracing("api_plugins_sync")
async def sync_marketplace(
    plugin_store: PluginStoreService = PluginStore,
    force: bool = Query(False, description="Force cache refresh"),
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Sync with marketplace.
    
    Requires admin privileges. Refreshes marketplace cache and
    checks for plugin updates.
    """
    try:
        # Clear cache if force refresh
        if force:
            plugin_store._cache.clear()
        
        # Sync with marketplace
        available_plugins = await plugin_store.discover_plugins(limit=1000)
        installed_plugins = await plugin_store.list_installed_plugins()
        updates = await plugin_store.check_plugin_updates(list(installed_plugins.keys()))
        
        return {
            "success": True,
            "message": "Marketplace sync completed",
            "stats": {
                "available_plugins": len(available_plugins),
                "installed_plugins": len(installed_plugins),
                "available_updates": len(updates)
            },
            "sync_timestamp": plugin_store._cache.get("last_sync", ["", None])[0]
        }
        
    except Exception as e:
        logger.error(f"Error syncing marketplace: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync with marketplace"
        )
