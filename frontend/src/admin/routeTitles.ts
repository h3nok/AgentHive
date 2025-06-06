// Mapping of admin route patterns to user-facing page titles
// Wildcards (e.g., ':id') are allowed for matchPath in TopBar.
export const ROUTE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/agents': 'Agent Catalog',
  '/admin/agents/:id': 'Agent Details',
  '/admin/agents/:id/logs': 'Agent Logs',
};

export default ROUTE_TITLES;
