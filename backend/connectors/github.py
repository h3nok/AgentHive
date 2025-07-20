import os
import requests
from typing import Dict, List, Optional, Any
from connectors.base import BaseConnector

class GitHubConnector(BaseConnector):
    """
    GitHub Enterprise Connector with auto-discovery capabilities.
    Supports GitHub.com and GitHub Enterprise Server.
    """
    
    def __init__(self, access_token=None, base_url=None, organization=None, mock=False):
        self.access_token = access_token or os.getenv("GITHUB_ACCESS_TOKEN")
        self.base_url = base_url or os.getenv("GITHUB_BASE_URL", "https://api.github.com")
        self.organization = organization or os.getenv("GITHUB_ORGANIZATION")
        self.mock = mock
        self.session = requests.Session()
        
        if self.access_token:
            self.session.headers.update({
                "Authorization": f"token {self.access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "AgentHive-GitHub-Connector/1.0"
            })

    def call(self, action: str, params: dict) -> dict:
        """Main entry point for GitHub connector actions"""
        if self.mock:
            return self._mock_call(action, params)
        
        try:
            # Route actions to appropriate methods
            if action == "discover_apis":
                return self.discover_apis()
            elif action == "validate_connection":
                return self.validate_connection()
            elif action == "get_repositories":
                return self.get_repositories(params)
            elif action == "create_issue":
                return self.create_issue(params)
            elif action == "get_issues":
                return self.get_issues(params)
            elif action == "create_pull_request":
                return self.create_pull_request(params)
            elif action == "get_pull_requests":
                return self.get_pull_requests(params)
            elif action == "get_user_info":
                return self.get_user_info()
            elif action == "get_organization_info":
                return self.get_organization_info()
            elif action == "list_branches":
                return self.list_branches(params)
            elif action == "create_webhook":
                return self.create_webhook(params)
            elif action == "get_commits":
                return self.get_commits(params)
            else:
                return {"error": f"Unknown action: {action}"}
                
        except Exception as e:
            return {"error": str(e), "action": action, "params": params}

    def discover_apis(self) -> dict:
        """Auto-discover available GitHub API endpoints and capabilities"""
        try:
            # Get rate limit info to validate connection
            rate_limit = self._make_request("GET", "/rate_limit")
            
            # Get user info to determine permissions
            user_info = self._make_request("GET", "/user")
            
            # Discover organization capabilities if org is set
            org_info = None
            if self.organization:
                try:
                    org_info = self._make_request("GET", f"/orgs/{self.organization}")
                except:
                    pass
            
            # Define available API endpoints based on permissions
            available_endpoints = self._get_available_endpoints(user_info, org_info)
            
            return {
                "status": "success",
                "connection": "active",
                "rate_limit": rate_limit.get("data", {}),
                "user": user_info.get("data", {}),
                "organization": org_info.get("data") if org_info else None,
                "available_endpoints": available_endpoints,
                "capabilities": self._get_capabilities(user_info, org_info)
            }
            
        except Exception as e:
            return {"error": f"API discovery failed: {str(e)}"}

    def validate_connection(self) -> dict:
        """Validate GitHub connection and authentication"""
        try:
            response = self._make_request("GET", "/user")
            if response.get("status") == "success":
                return {
                    "status": "success",
                    "message": "Connection validated successfully",
                    "user": response.get("data", {}).get("login"),
                    "scopes": response.get("headers", {}).get("x-oauth-scopes", "").split(", ")
                }
            else:
                return {"status": "error", "message": "Authentication failed"}
        except Exception as e:
            return {"status": "error", "message": f"Connection validation failed: {str(e)}"}

    def get_repositories(self, params: dict) -> dict:
        """Get repositories for user or organization"""
        try:
            org = params.get("organization", self.organization)
            per_page = params.get("per_page", 30)
            page = params.get("page", 1)
            
            if org:
                endpoint = f"/orgs/{org}/repos"
            else:
                endpoint = "/user/repos"
            
            response = self._make_request("GET", endpoint, {
                "per_page": per_page,
                "page": page,
                "sort": "updated"
            })
            
            if response.get("status") == "success":
                repos = response.get("data", [])
                return {
                    "status": "success",
                    "repositories": [self._format_repository(repo) for repo in repos],
                    "total_count": len(repos)
                }
            else:
                return response
                
        except Exception as e:
            return {"error": f"Failed to get repositories: {str(e)}"}

    def create_issue(self, params: dict) -> dict:
        """Create a new issue in a repository"""
        try:
            owner = params.get("owner", self.organization)
            repo = params.get("repo")
            title = params.get("title")
            body = params.get("body", "")
            labels = params.get("labels", [])
            assignees = params.get("assignees", [])
            
            if not all([owner, repo, title]):
                return {"error": "Missing required parameters: owner, repo, title"}
            
            endpoint = f"/repos/{owner}/{repo}/issues"
            data = {
                "title": title,
                "body": body,
                "labels": labels,
                "assignees": assignees
            }
            
            response = self._make_request("POST", endpoint, data)
            
            if response.get("status") == "success":
                issue = response.get("data", {})
                return {
                    "status": "success",
                    "issue": self._format_issue(issue),
                    "url": issue.get("html_url")
                }
            else:
                return response
                
        except Exception as e:
            return {"error": f"Failed to create issue: {str(e)}"}

    def get_issues(self, params: dict) -> dict:
        """Get issues from a repository"""
        try:
            owner = params.get("owner", self.organization)
            repo = params.get("repo")
            state = params.get("state", "open")
            per_page = params.get("per_page", 30)
            page = params.get("page", 1)
            
            if not all([owner, repo]):
                return {"error": "Missing required parameters: owner, repo"}
            
            endpoint = f"/repos/{owner}/{repo}/issues"
            response = self._make_request("GET", endpoint, {
                "state": state,
                "per_page": per_page,
                "page": page
            })
            
            if response.get("status") == "success":
                issues = response.get("data", [])
                return {
                    "status": "success",
                    "issues": [self._format_issue(issue) for issue in issues],
                    "total_count": len(issues)
                }
            else:
                return response
                
        except Exception as e:
            return {"error": f"Failed to get issues: {str(e)}"}

    def create_pull_request(self, params: dict) -> dict:
        """Create a new pull request"""
        try:
            owner = params.get("owner", self.organization)
            repo = params.get("repo")
            title = params.get("title")
            head = params.get("head")  # branch name
            base = params.get("base", "main")
            body = params.get("body", "")
            
            if not all([owner, repo, title, head]):
                return {"error": "Missing required parameters: owner, repo, title, head"}
            
            endpoint = f"/repos/{owner}/{repo}/pulls"
            data = {
                "title": title,
                "head": head,
                "base": base,
                "body": body
            }
            
            response = self._make_request("POST", endpoint, data)
            
            if response.get("status") == "success":
                pr = response.get("data", {})
                return {
                    "status": "success",
                    "pull_request": self._format_pull_request(pr),
                    "url": pr.get("html_url")
                }
            else:
                return response
                
        except Exception as e:
            return {"error": f"Failed to create pull request: {str(e)}"}

    def get_pull_requests(self, params: dict) -> dict:
        """Get pull requests from a repository"""
        try:
            owner = params.get("owner", self.organization)
            repo = params.get("repo")
            state = params.get("state", "open")
            per_page = params.get("per_page", 30)
            page = params.get("page", 1)
            
            if not all([owner, repo]):
                return {"error": "Missing required parameters: owner, repo"}
            
            endpoint = f"/repos/{owner}/{repo}/pulls"
            response = self._make_request("GET", endpoint, {
                "state": state,
                "per_page": per_page,
                "page": page
            })
            
            if response.get("status") == "success":
                prs = response.get("data", [])
                return {
                    "status": "success",
                    "pull_requests": [self._format_pull_request(pr) for pr in prs],
                    "total_count": len(prs)
                }
            else:
                return response
                
        except Exception as e:
            return {"error": f"Failed to get pull requests: {str(e)}"}

    def get_commits(self, params: dict) -> dict:
        """Get recent commits from a repository"""
        owner = params.get("owner")
        repo = params.get("repo")
        limit = params.get("limit", 20)
        since = params.get("since")

        if not owner or not repo:
            return {"error": "'owner' and 'repo' parameters required"}

        endpoint = f"/repos/{owner}/{repo}/commits"
        query = {"per_page": limit}
        if since:
            query["since"] = since

        commits_resp = self._make_request("GET", endpoint, data=query)
        commits = [self._format_commit(c) for c in commits_resp.get("data", [])[:limit]]
        return {
            "status": "success",
            "total": len(commits),
            "commits": commits
        }

    def _format_commit(self, commit: dict) -> dict:
        """Format commit data for consistent output"""
        return {
            "sha": commit.get("sha"),
            "message": commit.get("commit", {}).get("message"),
            "author": commit.get("commit", {}).get("author", {}).get("name"),
            "date": commit.get("commit", {}).get("author", {}).get("date"),
            "html_url": commit.get("html_url"),
            "url": commit.get("url")
        }

    def get_user_info(self) -> dict:
        """Get authenticated user information"""
        try:
            response = self._make_request("GET", "/user")
            if response.get("status") == "success":
                user = response.get("data", {})
                return {
                    "status": "success",
                    "user": {
                        "login": user.get("login"),
                        "name": user.get("name"),
                        "email": user.get("email"),
                        "avatar_url": user.get("avatar_url"),
                        "public_repos": user.get("public_repos"),
                        "followers": user.get("followers"),
                        "following": user.get("following")
                    }
                }
            else:
                return response
        except Exception as e:
            return {"error": f"Failed to get user info: {str(e)}"}

    def get_organization_info(self) -> dict:
        """Get organization information"""
        try:
            if not self.organization:
                return {"error": "No organization configured"}
            
            response = self._make_request("GET", f"/orgs/{self.organization}")
            if response.get("status") == "success":
                org = response.get("data", {})
                return {
                    "status": "success",
                    "organization": {
                        "login": org.get("login"),
                        "name": org.get("name"),
                        "description": org.get("description"),
                        "public_repos": org.get("public_repos"),
                        "followers": org.get("followers"),
                        "following": org.get("following")
                    }
                }
            else:
                return response
        except Exception as e:
            return {"error": f"Failed to get organization info: {str(e)}"}

    def _make_request(self, method: str, endpoint: str, data: dict = None) -> dict:
        """Make HTTP request to GitHub API"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == "GET":
                response = self.session.get(url, params=data, timeout=30)
            elif method == "POST":
                response = self.session.post(url, json=data, timeout=30)
            elif method == "PUT":
                response = self.session.put(url, json=data, timeout=30)
            elif method == "DELETE":
                response = self.session.delete(url, timeout=30)
            else:
                return {"status": "error", "message": f"Unsupported method: {method}"}
            
            response.raise_for_status()
            
            return {
                "status": "success",
                "data": response.json() if response.content else {},
                "headers": dict(response.headers)
            }
            
        except requests.exceptions.RequestException as e:
            return {"status": "error", "message": str(e)}

    def _get_available_endpoints(self, user_info: dict, org_info: dict) -> List[dict]:
        """Get list of available API endpoints based on permissions"""
        endpoints = [
            {
                "method": "GET",
                "path": "/user",
                "description": "Get authenticated user information",
                "category": "user"
            },
            {
                "method": "GET", 
                "path": "/user/repos",
                "description": "List user repositories",
                "category": "repositories"
            },
            {
                "method": "GET",
                "path": "/repos/{owner}/{repo}",
                "description": "Get repository information",
                "category": "repositories"
            },
            {
                "method": "GET",
                "path": "/repos/{owner}/{repo}/issues",
                "description": "List repository issues",
                "category": "issues"
            },
            {
                "method": "POST",
                "path": "/repos/{owner}/{repo}/issues",
                "description": "Create repository issue",
                "category": "issues"
            },
            {
                "method": "GET",
                "path": "/repos/{owner}/{repo}/pulls",
                "description": "List pull requests",
                "category": "pull_requests"
            },
            {
                "method": "POST",
                "path": "/repos/{owner}/{repo}/pulls",
                "description": "Create pull request",
                "category": "pull_requests"
            }
        ]
        
        # Add organization endpoints if org is available
        if org_info:
            endpoints.extend([
                {
                    "method": "GET",
                    "path": f"/orgs/{self.organization}",
                    "description": "Get organization information",
                    "category": "organization"
                },
                {
                    "method": "GET",
                    "path": f"/orgs/{self.organization}/repos",
                    "description": "List organization repositories",
                    "category": "repositories"
                }
            ])
        
        return endpoints

    def _get_capabilities(self, user_info: dict, org_info: dict) -> List[str]:
        """Get list of connector capabilities"""
        capabilities = [
            "repository_management",
            "issue_tracking",
            "pull_request_management",
            "user_information",
            "webhook_support"
        ]
        
        if org_info:
            capabilities.append("organization_management")
        
        return capabilities

    def _format_repository(self, repo: dict) -> dict:
        """Format repository data for consistent output"""
        return {
            "id": repo.get("id"),
            "name": repo.get("name"),
            "full_name": repo.get("full_name"),
            "description": repo.get("description"),
            "private": repo.get("private"),
            "html_url": repo.get("html_url"),
            "clone_url": repo.get("clone_url"),
            "default_branch": repo.get("default_branch"),
            "language": repo.get("language"),
            "stargazers_count": repo.get("stargazers_count"),
            "forks_count": repo.get("forks_count"),
            "updated_at": repo.get("updated_at")
        }

    def _format_issue(self, issue: dict) -> dict:
        """Format issue data for consistent output"""
        return {
            "id": issue.get("id"),
            "number": issue.get("number"),
            "title": issue.get("title"),
            "body": issue.get("body"),
            "state": issue.get("state"),
            "html_url": issue.get("html_url"),
            "user": issue.get("user", {}).get("login"),
            "labels": [label.get("name") for label in issue.get("labels", [])],
            "created_at": issue.get("created_at"),
            "updated_at": issue.get("updated_at")
        }

    def _format_pull_request(self, pr: dict) -> dict:
        """Format pull request data for consistent output"""
        return {
            "id": pr.get("id"),
            "number": pr.get("number"),
            "title": pr.get("title"),
            "body": pr.get("body"),
            "state": pr.get("state"),
            "html_url": pr.get("html_url"),
            "user": pr.get("user", {}).get("login"),
            "head": pr.get("head", {}).get("ref"),
            "base": pr.get("base", {}).get("ref"),
            "mergeable": pr.get("mergeable"),
            "created_at": pr.get("created_at"),
            "updated_at": pr.get("updated_at")
        }

    def _mock_call(self, action: str, params: dict) -> dict:
        """Mock responses for testing and development"""
        if action == "discover_apis":
            return {
                "status": "success",
                "connection": "active",
                "rate_limit": {"remaining": 4999, "limit": 5000},
                "user": {"login": "demo-user", "name": "Demo User"},
                "organization": {"login": "demo-org", "name": "Demo Organization"} if self.organization else None,
                "available_endpoints": [
                    {"method": "GET", "path": "/user", "description": "Get user info", "category": "user"},
                    {"method": "GET", "path": "/repos/{owner}/{repo}/issues", "description": "List issues", "category": "issues"}
                ],
                "capabilities": ["repository_management", "issue_tracking", "pull_request_management"]
            }
        elif action == "validate_connection":
            return {"status": "success", "message": "Connection validated (mock)", "user": "demo-user"}
        elif action == "get_repositories":
            return {
                "status": "success",
                "repositories": [
                    {
                        "id": 12345,
                        "name": "demo-repo",
                        "full_name": "demo-org/demo-repo",
                        "description": "Demo repository",
                        "private": False,
                        "html_url": "https://github.com/demo-org/demo-repo",
                        "default_branch": "main",
                        "language": "Python"
                    }
                ],
                "total_count": 1
            }
        elif action == "create_issue":
            return {
                "status": "success",
                "issue": {
                    "id": 67890,
                    "number": 42,
                    "title": params.get("title", "Demo Issue"),
                    "state": "open",
                    "html_url": "https://github.com/demo-org/demo-repo/issues/42"
                },
                "url": "https://github.com/demo-org/demo-repo/issues/42"
            }
        elif action == "get_commits":
            return {
                "status": "success",
                "total": 2,
                "commits": [
                    {
                        "sha": "abc123",
                        "message": "Initial commit",
                        "author": "demo-user",
                        "date": "2025-07-19T12:00:00Z",
                        "html_url": "https://github.com/demo-org/demo-repo/commit/abc123"
                    },
                    {
                        "sha": "def456",
                        "message": "Add README",
                        "author": "demo-user",
                        "date": "2025-07-19T13:00:00Z",
                        "html_url": "https://github.com/demo-org/demo-repo/commit/def456"
                    }
                ]
            }
        else:
            return {"mock": True, "action": action, "params": params}
