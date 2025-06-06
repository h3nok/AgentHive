"""
Plugin Store Service for managing the plugin marketplace and discovery.

This service handles plugin discovery, installation, updates, and marketplace functionality.
"""

import json
import asyncio
import hashlib
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from packaging import version
import httpx
import aiofiles

from ..core.observability import get_logger, with_tracing
from ..core.errors import PluginNotFoundException, PluginInstallationError, PluginValidationError
from ..domain.schemas import AgentManifest, AgentType
from ..domain.agent_factory import agent_registry

logger = get_logger(__name__)


@dataclass
class PluginInfo:
    """Plugin information from marketplace."""
    id: str
    name: str
    description: str
    version: str
    author: str
    homepage: str
    repository: str
    download_url: str
    checksum: str
    agent_type: str
    capabilities: List[str]
    requirements: List[str]
    tags: List[str]
    ratings: float
    downloads: int
    last_updated: datetime
    compatibility: List[str]  # Compatible platform versions
    size: int  # Package size in bytes
    license: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        data = asdict(self)
        data['last_updated'] = data['last_updated'].isoformat()
        return data


@dataclass
class InstalledPlugin:
    """Information about an installed plugin."""
    id: str
    name: str
    version: str
    installed_at: datetime
    enabled: bool
    health_status: str  # healthy, degraded, unhealthy
    last_health_check: datetime
    metrics: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        data = asdict(self)
        data['installed_at'] = data['installed_at'].isoformat()
        data['last_health_check'] = data['last_health_check'].isoformat()
        return data


class PluginStoreService:
    """Service for managing plugin marketplace and discovery."""
    
    def __init__(
        self,
        plugins_dir: Path = Path("app/plugins"),
        marketplace_url: str = "https://plugins.chattsc.com/api/v1",
        cache_ttl: int = 3600  # 1 hour cache TTL
    ):
        self.plugins_dir = plugins_dir
        self.marketplace_url = marketplace_url
        self.cache_ttl = cache_ttl
        self._cache: Dict[str, Tuple[datetime, Any]] = {}
        self._installed_plugins: Dict[str, InstalledPlugin] = {}
        self._lock = asyncio.Lock()
        
        # Ensure plugins directory exists
        self.plugins_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize installed plugins tracking
        asyncio.create_task(self._load_installed_plugins())
    
    async def _load_installed_plugins(self) -> None:
        """Load information about currently installed plugins."""
        try:
            for plugin_dir in self.plugins_dir.iterdir():
                if plugin_dir.is_dir() and (plugin_dir / "manifest.json").exists():
                    try:
                        async with aiofiles.open(plugin_dir / "manifest.json", 'r') as f:
                            manifest_data = json.loads(await f.read())
                        
                        # Create installed plugin info
                        installed_plugin = InstalledPlugin(
                            id=f"{manifest_data['agent_type']}_{manifest_data['name']}",
                            name=manifest_data['name'],
                            version=manifest_data['version'],
                            installed_at=datetime.now(),  # Would be stored in metadata
                            enabled=True,
                            health_status="healthy",
                            last_health_check=datetime.now(),
                            metrics={}
                        )
                        
                        self._installed_plugins[installed_plugin.id] = installed_plugin
                        logger.info(f"Loaded installed plugin: {installed_plugin.name}")
                        
                    except Exception as e:
                        logger.error(f"Failed to load plugin from {plugin_dir}: {e}")
                        
        except Exception as e:
            logger.error(f"Failed to load installed plugins: {e}")
    
    def _is_cache_valid(self, key: str) -> bool:
        """Check if cached data is still valid."""
        if key not in self._cache:
            return False
        
        cached_time, _ = self._cache[key]
        return datetime.now() - cached_time < timedelta(seconds=self.cache_ttl)
    
    def _get_cached(self, key: str) -> Optional[Any]:
        """Get cached data if valid."""
        if self._is_cache_valid(key):
            return self._cache[key][1]
        return None
    
    def _set_cache(self, key: str, data: Any) -> None:
        """Set cached data with timestamp."""
        self._cache[key] = (datetime.now(), data)
    
    @with_tracing("plugin_store_discover")
    async def discover_plugins(
        self,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        search_query: Optional[str] = None,
        sort_by: str = "popularity",
        limit: int = 50
    ) -> List[PluginInfo]:
        """Discover available plugins from the marketplace."""
        cache_key = f"discover_{category}_{tags}_{search_query}_{sort_by}_{limit}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            # Build query parameters
            params = {
                "limit": limit,
                "sort_by": sort_by
            }
            if category:
                params["category"] = category
            if tags:
                params["tags"] = ",".join(tags)
            if search_query:
                params["q"] = search_query
            
            # Make request to marketplace API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.marketplace_url}/plugins",
                    params=params
                )
                response.raise_for_status()
                
                # Parse response
                data = response.json()
                plugins = []
                
                for plugin_data in data.get("plugins", []):
                    plugin_info = PluginInfo(
                        id=plugin_data["id"],
                        name=plugin_data["name"],
                        description=plugin_data["description"],
                        version=plugin_data["version"],
                        author=plugin_data["author"],
                        homepage=plugin_data.get("homepage", ""),
                        repository=plugin_data.get("repository", ""),
                        download_url=plugin_data["download_url"],
                        checksum=plugin_data["checksum"],
                        agent_type=plugin_data["agent_type"],
                        capabilities=plugin_data.get("capabilities", []),
                        requirements=plugin_data.get("requirements", []),
                        tags=plugin_data.get("tags", []),
                        ratings=plugin_data.get("ratings", 0.0),
                        downloads=plugin_data.get("downloads", 0),
                        last_updated=datetime.fromisoformat(plugin_data["last_updated"]),
                        compatibility=plugin_data.get("compatibility", []),
                        size=plugin_data.get("size", 0),
                        license=plugin_data.get("license", "Unknown")
                    )
                    plugins.append(plugin_info)
                
                # Cache the results
                self._set_cache(cache_key, plugins)
                
                logger.info(f"Discovered {len(plugins)} plugins from marketplace")
                return plugins
                
        except httpx.RequestError as e:
            logger.error(f"Failed to connect to marketplace: {e}")
            # Return cached data if available, even if expired
            if cache_key in self._cache:
                return self._cache[cache_key][1]
            return []
        except Exception as e:
            logger.error(f"Error discovering plugins: {e}")
            return []
    
    @with_tracing("plugin_store_get_details")
    async def get_plugin_details(self, plugin_id: str) -> Optional[PluginInfo]:
        """Get detailed information about a specific plugin."""
        cache_key = f"plugin_details_{plugin_id}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.marketplace_url}/plugins/{plugin_id}"
                )
                response.raise_for_status()
                
                plugin_data = response.json()
                plugin_info = PluginInfo(
                    id=plugin_data["id"],
                    name=plugin_data["name"],
                    description=plugin_data["description"],
                    version=plugin_data["version"],
                    author=plugin_data["author"],
                    homepage=plugin_data.get("homepage", ""),
                    repository=plugin_data.get("repository", ""),
                    download_url=plugin_data["download_url"],
                    checksum=plugin_data["checksum"],
                    agent_type=plugin_data["agent_type"],
                    capabilities=plugin_data.get("capabilities", []),
                    requirements=plugin_data.get("requirements", []),
                    tags=plugin_data.get("tags", []),
                    ratings=plugin_data.get("ratings", 0.0),
                    downloads=plugin_data.get("downloads", 0),
                    last_updated=datetime.fromisoformat(plugin_data["last_updated"]),
                    compatibility=plugin_data.get("compatibility", []),
                    size=plugin_data.get("size", 0),
                    license=plugin_data.get("license", "Unknown")
                )
                
                self._set_cache(cache_key, plugin_info)
                return plugin_info
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise PluginNotFoundException(f"Plugin {plugin_id} not found")
            logger.error(f"HTTP error getting plugin details: {e}")
            return None
        except Exception as e:
            logger.error(f"Error getting plugin details: {e}")
            return None
    
    async def _validate_plugin_manifest(self, manifest_data: Dict[str, Any]) -> None:
        """Validate plugin manifest data."""
        required_fields = ["name", "version", "agent_type", "module_path"]
        for field in required_fields:
            if field not in manifest_data:
                raise PluginValidationError(f"Missing required field: {field}")
        
        # Validate agent type
        try:
            AgentType(manifest_data["agent_type"])
        except ValueError:
            raise PluginValidationError(f"Invalid agent_type: {manifest_data['agent_type']}")
        
        # Validate version format
        try:
            version.parse(manifest_data["version"])
        except version.InvalidVersion:
            raise PluginValidationError(f"Invalid version format: {manifest_data['version']}")
    
    async def _verify_checksum(self, file_path: Path, expected_checksum: str) -> bool:
        """Verify file checksum."""
        sha256_hash = hashlib.sha256()
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(8192):
                sha256_hash.update(chunk)
        
        actual_checksum = sha256_hash.hexdigest()
        return actual_checksum == expected_checksum
    
    @with_tracing("plugin_store_install")
    async def install_plugin(self, plugin_id: str, version_spec: Optional[str] = None) -> bool:
        """Install a plugin from the marketplace."""
        async with self._lock:
            try:
                # Get plugin details
                plugin_info = await self.get_plugin_details(plugin_id)
                if not plugin_info:
                    raise PluginNotFoundException(f"Plugin {plugin_id} not found")
                
                # Check if already installed
                if plugin_id in self._installed_plugins:
                    installed = self._installed_plugins[plugin_id]
                    if version_spec:
                        # Version comparison logic would go here
                        pass
                    logger.info(f"Plugin {plugin_id} already installed (v{installed.version})")
                    return True
                
                # Create temporary download directory
                temp_dir = Path(f"/tmp/plugin_install_{plugin_id}")
                temp_dir.mkdir(parents=True, exist_ok=True)
                
                try:
                    # Download plugin package
                    logger.info(f"Downloading plugin {plugin_id} from {plugin_info.download_url}")
                    async with httpx.AsyncClient(timeout=300.0) as client:
                        response = await client.get(plugin_info.download_url)
                        response.raise_for_status()
                        
                        # Save to temporary file
                        temp_file = temp_dir / f"{plugin_id}.zip"
                        async with aiofiles.open(temp_file, 'wb') as f:
                            await f.write(response.content)
                    
                    # Verify checksum
                    if not await self._verify_checksum(temp_file, plugin_info.checksum):
                        raise PluginInstallationError("Checksum verification failed")
                    
                    # Extract plugin (simplified - would use zipfile in real implementation)
                    plugin_dir = self.plugins_dir / plugin_info.name
                    if plugin_dir.exists():
                        shutil.rmtree(plugin_dir)
                    
                    # For now, create a basic plugin structure
                    plugin_dir.mkdir(parents=True)
                    
                    # Create manifest.json
                    manifest = {
                        "name": plugin_info.name,
                        "description": plugin_info.description,
                        "version": plugin_info.version,
                        "agent_type": plugin_info.agent_type,
                        "module_path": "agent",
                        "capabilities": plugin_info.capabilities,
                        "requirements": plugin_info.requirements,
                        "cost_per_call": 0.02,
                        "config": {
                            "system_prompt": f"You are a {plugin_info.name} specialist.",
                            "max_tokens": 1500,
                            "temperature": 0.7
                        }
                    }
                    
                    async with aiofiles.open(plugin_dir / "manifest.json", 'w') as f:
                        await f.write(json.dumps(manifest, indent=2))
                    
                    # Validate manifest
                    await self._validate_plugin_manifest(manifest)
                    
                    # Load plugin into registry
                    agent_id = await agent_registry.load_plugin(plugin_dir)
                    if not agent_id:
                        raise PluginInstallationError("Failed to load plugin into registry")
                    
                    # Create installed plugin record
                    installed_plugin = InstalledPlugin(
                        id=plugin_id,
                        name=plugin_info.name,
                        version=plugin_info.version,
                        installed_at=datetime.now(),
                        enabled=True,
                        health_status="healthy",
                        last_health_check=datetime.now(),
                        metrics={}
                    )
                    
                    self._installed_plugins[plugin_id] = installed_plugin
                    
                    logger.info(f"Successfully installed plugin {plugin_id} (v{plugin_info.version})")
                    return True
                    
                finally:
                    # Cleanup temporary files
                    if temp_dir.exists():
                        shutil.rmtree(temp_dir)
                        
            except Exception as e:
                logger.error(f"Failed to install plugin {plugin_id}: {e}")
                raise PluginInstallationError(f"Installation failed: {e}")
    
    async def uninstall_plugin(self, plugin_id: str) -> bool:
        """Uninstall a plugin."""
        async with self._lock:
            if plugin_id not in self._installed_plugins:
                raise PluginNotFoundException(f"Plugin {plugin_id} not installed")
            
            try:
                installed = self._installed_plugins[plugin_id]
                plugin_dir = self.plugins_dir / installed.name
                
                # Unload from registry first
                await agent_registry.unload_agent(plugin_id)
                
                # Remove plugin directory
                if plugin_dir.exists():
                    shutil.rmtree(plugin_dir)
                
                # Remove from installed plugins
                del self._installed_plugins[plugin_id]
                
                logger.info(f"Successfully uninstalled plugin {plugin_id}")
                return True
                
            except Exception as e:
                logger.error(f"Failed to uninstall plugin {plugin_id}: {e}")
                return False
    
    async def enable_plugin(self, plugin_id: str) -> bool:
        """Enable a plugin."""
        if plugin_id not in self._installed_plugins:
            raise PluginNotFoundException(f"Plugin {plugin_id} not installed")
        
        self._installed_plugins[plugin_id].enabled = True
        logger.info(f"Enabled plugin {plugin_id}")
        return True
    
    async def disable_plugin(self, plugin_id: str) -> bool:
        """Disable a plugin."""
        if plugin_id not in self._installed_plugins:
            raise PluginNotFoundException(f"Plugin {plugin_id} not installed")
        
        self._installed_plugins[plugin_id].enabled = False
        logger.info(f"Disabled plugin {plugin_id}")
        return True
    
    async def get_installed_plugins(self) -> List[InstalledPlugin]:
        """Get list of installed plugins."""
        return list(self._installed_plugins.values())
    
    async def list_installed_plugins(self) -> Dict[str, InstalledPlugin]:
        """Get dictionary of installed plugins by ID."""
        return self._installed_plugins.copy()
    
    async def check_plugin_updates(self, plugin_ids: List[str]) -> Dict[str, PluginInfo]:
        """Check for available updates for specified plugins."""
        updates = {}
        
        for plugin_id in plugin_ids:
            if plugin_id not in self._installed_plugins:
                continue
                
            try:
                installed = self._installed_plugins[plugin_id]
                plugin_info = await self.get_plugin_details(plugin_id)
                
                if plugin_info and version.parse(plugin_info.version) > version.parse(installed.version):
                    updates[plugin_id] = plugin_info
                    
            except Exception as e:
                logger.error(f"Error checking updates for {plugin_id}: {e}")
        
        return updates
    
    async def update_plugin(self, plugin_id: str) -> bool:
        """Update a plugin to the latest version."""
        if plugin_id not in self._installed_plugins:
            raise PluginNotFoundException(f"Plugin {plugin_id} not installed")
        
        # Uninstall current version
        await self.uninstall_plugin(plugin_id)
        
        # Install latest version
        return await self.install_plugin(plugin_id)
    
    async def get_plugin_health(self, plugin_id: str) -> Dict[str, Any]:
        """Get health status of a plugin."""
        if plugin_id not in self._installed_plugins:
            raise PluginNotFoundException(f"Plugin {plugin_id} not installed")
        
        installed = self._installed_plugins[plugin_id]
        
        # Basic health check (would be more sophisticated in real implementation)
        health_status = "healthy"
        metrics = {
            "uptime": (datetime.now() - installed.installed_at).total_seconds(),
            "enabled": installed.enabled,
            "last_used": installed.last_health_check.isoformat(),
            "error_count": 0,
            "success_rate": 1.0
        }
        
        # Update health status
        installed.health_status = health_status
        installed.last_health_check = datetime.now()
        installed.metrics = metrics
        
        return {
            "plugin_id": plugin_id,
            "health_status": health_status,
            "metrics": metrics
        }
    
    async def check_plugin_health(self, plugin_id: str) -> str:
        """Check health status of a specific plugin."""
        if plugin_id not in self._installed_plugins:
            raise PluginNotFoundException(f"Plugin {plugin_id} not installed")
        
        installed = self._installed_plugins[plugin_id]
        
        # Basic health check (would be more sophisticated in real implementation)
        health_status = "healthy"
        
        try:
            # Check if plugin directory exists
            plugin_dir = self.plugins_dir / plugin_id
            if not plugin_dir.exists():
                health_status = "error"
            
            # Check if manifest is valid
            manifest_path = plugin_dir / "manifest.json"
            if not manifest_path.exists():
                health_status = "error"
            else:
                async with aiofiles.open(manifest_path, 'r') as f:
                    manifest_data = json.loads(await f.read())
                await self._validate_plugin_manifest(manifest_data)
            
            # Update metrics
            metrics = {
                "uptime": (datetime.now() - installed.installed_at).total_seconds(),
                "enabled": installed.enabled,
                "last_used": installed.last_health_check.isoformat(),
                "error_count": 0,
                "success_rate": 1.0,
                "health_check_duration": 0.1
            }
            
            # Update health status
            installed.health_status = health_status
            installed.last_health_check = datetime.now()
            installed.metrics = metrics
            
        except Exception as e:
            logger.error(f"Health check failed for plugin {plugin_id}: {e}")
            health_status = "error"
            installed.health_status = health_status
            installed.last_health_check = datetime.now()
        
        return health_status


# Global instance
plugin_store = PluginStoreService()
