/**
 * GitHub Connector API Service
 * Handles communication with the backend GitHub connector API
 */

export interface GitHubConfig {
  access_token: string;
  base_url: string;
  organization?: string;
  repositories: string[];
  webhook_url?: string;
  enable_pr_notifications: boolean;
  enable_issue_notifications: boolean;
  auto_assign_reviewers: boolean;
  default_branch: string;
  sync_frequency: string;
  rate_limit_buffer: number;
}

export interface GitHubTestResponse {
  status: string;
  message: string;
  user?: {
    login: string;
    name: string;
    email: string;
    avatar_url: string;
    public_repos: number;
    followers: number;
    following: number;
    [key: string]: any;
  };
  organization?: {
    login: string;
    name: string;
    description: string;
    public_repos: number;
    [key: string]: any;
  };
  rate_limit?: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
  permissions?: string[];
  error?: string;
}

export interface GitHubDiscoveryResponse {
  status: string;
  message: string;
  apis: Array<{
    method: string;
    path: string;
    description: string;
    category: string;
    enabled?: boolean;
  }>;
  capabilities: string[];
  error?: string;
}

export interface GitHubCapabilitiesResponse {
  capabilities: string[];
  authentication_methods: string[];
  supported_apis: string[];
}

class GitHubConnectorApiService {
  private baseUrl: string;

  constructor() {
    // Use Vite environment variable or default to localhost:8001 for development
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
  }

  /**
   * Test GitHub API connection with provided configuration
   */
  async testConnection(config: GitHubConfig): Promise<GitHubTestResponse> {
    try {
      // Backend expects "token" not "access_token"; translate accordingly
    const payload = {
      token: config.access_token,
      base_url: config.base_url,
      organization: config.organization,
      mock_mode: true // keep mock mode for now until real integration
    };

    const response = await fetch(`${this.baseUrl}/api/v1/connectors/github/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return {
        status: 'error',
        message: 'Failed to connect to GitHub API service',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Discover available GitHub APIs and capabilities
   */
  async getCommits(params: { owner: string; repo: string; limit?: number; token: string; base_url: string; organization?: string; mock_mode?: boolean }): Promise<any> {
    try {
      const payload = {
        owner: params.owner,
        repo: params.repo,
        limit: params.limit ?? 20,
        token: params.token,
        base_url: params.base_url,
        organization: params.organization,
        mock_mode: params.mock_mode ?? true
      };
      const response = await fetch(`${this.baseUrl}/api/v1/connectors/github/commits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch commits:', error);
      return { status: 'error', message: 'Failed to fetch commits', error };
    }
  }

  async discoverApis(config: GitHubConfig): Promise<GitHubDiscoveryResponse> {
    try {
      const payload = {
      token: config.access_token,
      base_url: config.base_url,
      organization: config.organization,
      mock_mode: true // discovery also in mock mode for now
    };

    const response = await fetch(`${this.baseUrl}/api/v1/connectors/github/discover-apis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('GitHub API discovery failed:', error);
      return {
        status: 'error',
        message: 'Failed to discover GitHub APIs',
        apis: [],
        capabilities: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get GitHub connector capabilities
   */
  async getCapabilities(): Promise<GitHubCapabilitiesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/connectors/github/capabilities`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get GitHub capabilities:', error);
      return {
        capabilities: [],
        authentication_methods: [],
        supported_apis: []
      };
    }
  }

  /**
   * Check GitHub connector health
   */
  async checkHealth(): Promise<{ status: string; connector: string; version: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/connectors/github/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('GitHub connector health check failed:', error);
      return {
        status: 'unhealthy',
        connector: 'github',
        version: 'unknown',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const githubConnectorApi = new GitHubConnectorApiService();
export default githubConnectorApi;
