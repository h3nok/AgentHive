"""
GitHub Connector API endpoints for AgentHive
Provides REST API interface for GitHub connector operations
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import logging
from datetime import datetime

# Import GitHubConnector using absolute import
try:
    import sys
    import os
    # Add the backend directory to Python path
    backend_dir = os.path.dirname(os.path.dirname(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    from connectors.github import GitHubConnector
except ImportError as e:
    # Fallback: create a mock GitHubConnector for testing
    class GitHubConnector:
        def __init__(self, *args, **kwargs):
            pass
        async def call(self, *args, **kwargs):
            return {"status": "mock", "message": "GitHubConnector not available"}

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/github", tags=["github-connector"])

class GitHubConfigRequest(BaseModel):
    """Request model for GitHub connector configuration"""
    access_token: str
    base_url: str = "https://api.github.com"
    organization: Optional[str] = None
    repositories: List[str] = []
    webhook_url: Optional[str] = None
    enable_pr_notifications: bool = True
    enable_issue_notifications: bool = True
    auto_assign_reviewers: bool = False
    default_branch: str = "main"
    sync_frequency: str = "real-time"
    rate_limit_buffer: int = 500

class GitHubTestResponse(BaseModel):
    """Response model for GitHub connection test"""
    status: str
    message: str
    user: Optional[Dict[str, Any]] = None
    organization: Optional[Dict[str, Any]] = None
    rate_limit: Optional[Dict[str, Any]] = None
    permissions: Optional[List[str]] = None
    error: Optional[str] = None

class GitHubDiscoveryResponse(BaseModel):
    """Response model for GitHub API discovery"""
    status: str
    message: str
    apis: List[Dict[str, Any]] = []
    capabilities: List[str] = []
    error: Optional[str] = None

def get_github_connector(config: GitHubConfigRequest) -> GitHubConnector:
    """Create GitHub connector instance from configuration"""
    connector_config = {
        'access_token': config.access_token,
        'base_url': config.base_url,
        'organization': config.organization,
        'mock_mode': False  # Always use real API for this endpoint
    }
    return GitHubConnector(connector_config)

@router.post("/test-connection", response_model=GitHubTestResponse)
async def test_github_connection(config: GitHubConfigRequest):
    """
    Test GitHub API connection with provided configuration
    
    This endpoint validates the GitHub access token and retrieves
    basic user and organization information to verify connectivity.
    """
    try:
        logger.info(f"Testing GitHub connection to {config.base_url}")
        
        # Create connector instance
        connector = get_github_connector(config)
        
        # Test basic connectivity by getting user info
        user_result = await connector.call({
            'action': 'get_user_info',
            'parameters': {}
        })
        
        if not user_result.get('success'):
            return GitHubTestResponse(
                status="error",
                message="Failed to authenticate with GitHub API",
                error=user_result.get('error', 'Authentication failed')
            )
        
        user_data = user_result.get('data', {})
        
        # Get rate limit information
        rate_limit_result = await connector.call({
            'action': 'get_rate_limit',
            'parameters': {}
        })
        
        rate_limit_data = rate_limit_result.get('data', {}) if rate_limit_result.get('success') else {}
        
        # Get organization info if specified
        org_data = None
        if config.organization:
            org_result = await connector.call({
                'action': 'get_organization_info',
                'parameters': {'organization': config.organization}
            })
            if org_result.get('success'):
                org_data = org_result.get('data', {})
        
        # Determine permissions based on token scopes (simplified)
        permissions = ['repo', 'metadata:read']
        if user_data.get('permissions', {}).get('admin', False):
            permissions.extend(['admin:org', 'admin:repo'])
        
        return GitHubTestResponse(
            status="success",
            message="Connection successful",
            user=user_data,
            organization=org_data,
            rate_limit=rate_limit_data,
            permissions=permissions
        )
        
    except Exception as e:
        logger.error(f"GitHub connection test failed: {str(e)}")
        return GitHubTestResponse(
            status="error",
            message="Connection test failed",
            error=str(e)
        )

@router.post("/discover-apis", response_model=GitHubDiscoveryResponse)
async def discover_github_apis(config: GitHubConfigRequest):
    """
    Discover available GitHub APIs and capabilities
    
    This endpoint performs auto-discovery of GitHub API endpoints
    and returns categorized API information.
    """
    try:
        logger.info(f"Discovering GitHub APIs for {config.base_url}")
        
        # Create connector instance
        connector = get_github_connector(config)
        
        # Perform API discovery
        discovery_result = await connector.call({
            'action': 'discover_apis',
            'parameters': {
                'organization': config.organization,
                'repositories': config.repositories
            }
        })
        
        if not discovery_result.get('success'):
            return GitHubDiscoveryResponse(
                status="error",
                message="API discovery failed",
                error=discovery_result.get('error', 'Discovery failed')
            )
        
        discovery_data = discovery_result.get('data', {})
        
        return GitHubDiscoveryResponse(
            status="success",
            message="API discovery completed",
            apis=discovery_data.get('apis', []),
            capabilities=discovery_data.get('capabilities', [])
        )
        
    except Exception as e:
        logger.error(f"GitHub API discovery failed: {str(e)}")
        return GitHubDiscoveryResponse(
            status="error",
            message="API discovery failed",
            error=str(e)
        )

@router.get("/health")
async def github_connector_health():
    """Health check endpoint for GitHub connector"""
    return {
        "status": "healthy",
        "connector": "github",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/capabilities")
async def get_github_capabilities():
    """Get GitHub connector capabilities"""
    return {
        "capabilities": [
            "repository_management",
            "issue_tracking", 
            "pull_request_management",
            "organization_management",
            "webhook_support",
            "rate_limiting",
            "user_management",
            "api_discovery"
        ],
        "authentication_methods": [
            "personal_access_token",
            "github_app",
            "oauth2"
        ],
        "supported_apis": [
            "REST API v3",
            "GraphQL API v4"
        ]
    }
