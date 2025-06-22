// Mapping of admin route patterns to user-facing page titles and descriptions
// Wildcards (e.g., ':id') are allowed for matchPath in TopBar.
export interface RouteInfo {
  title: string;
  description: string;
  functionCount?: number;
}

export const ROUTE_TITLES: Record<string, RouteInfo> = {
  '/admin/overview': {
    title: 'Admin Dashboard',
    description: 'Intelligent admin control center',
    functionCount: 12
  },
  '/admin/dashboard': {
    title: 'Technical Dashboard',
    description: 'System monitoring and analytics',
    functionCount: 8
  },
  '/admin/performance': {
    title: 'Performance Monitor',
    description: 'Real-time system performance metrics',
    functionCount: 6
  },
  '/admin/swarm': {
    title: 'Swarm Dashboard',
    description: 'Agent network management and coordination',
    functionCount: 10
  },
  '/admin/enterprise-command': {
    title: 'Enterprise Command',
    description: 'Executive control and strategic operations',
    functionCount: 15
  },
  '/admin/workflows': {
    title: 'Workflow Management',
    description: 'Automated process orchestration',
    functionCount: 7
  },
  '/admin/ai-assistant': {
    title: 'AI Assistant Management',
    description: 'Intelligent assistant configuration',
    functionCount: 5
  },
  '/admin/orchestration': {
    title: 'Agent Orchestration',
    description: 'Multi-agent coordination and deployment',
    functionCount: 9
  },
  '/admin/users': {
    title: 'User Management',
    description: 'User accounts and access control',
    functionCount: 6
  },
  '/admin/plugins': {
    title: 'Plugin Management',
    description: 'Extension and integration management',
    functionCount: 4
  },
  '/admin/marketplace': {
    title: 'Plugin Marketplace',
    description: 'Discover and install new capabilities',
    functionCount: 3
  },
  '/admin/mcp-servers': {
    title: 'MCP Servers',
    description: 'Model Context Protocol server management',
    functionCount: 8
  },
  '/admin/reports': {
    title: 'Analytics & Reports',
    description: 'Data insights and reporting tools',
    functionCount: 12
  },
  '/admin/settings': {
    title: 'System Settings',
    description: 'Configuration and preferences',
    functionCount: 10
  },
  '/admin/mobile-optimization': {
    title: 'Mobile Optimization',
    description: 'Mobile experience optimization tools',
    functionCount: 5
  }
};

export default ROUTE_TITLES;
