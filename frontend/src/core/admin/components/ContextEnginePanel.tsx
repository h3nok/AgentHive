import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Button,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Badge,
  alpha,
  useTheme
} from '@mui/material';
import {
  Security,
  LocationOn,
  Schedule,
  Person,
  Group,
  Business,
  Visibility,
  VisibilityOff,
  Settings,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Info,
  AdminPanelSettings,
  WorkOutline,
  AccessTime,
  Shield,
  Policy
} from '@mui/icons-material';
import { DashboardGrid, DashboardCardProps } from '../../../shared/components/dashboard';

// Types for Context Engine
interface UserContext {
  userId: string;
  username: string;
  role: string;
  department: string;
  permissions: string[];
  location: string;
  shift: string;
  isActive: boolean;
  lastActivity: string;
}

interface LocationContext {
  locationId: string;
  name: string;
  type: 'office' | 'remote' | 'hybrid';
  timezone: string;
  restrictions: string[];
  activeUsers: number;
  isOperational: boolean;
}

interface ShiftContext {
  shiftId: string;
  name: string;
  startTime: string;
  endTime: string;
  timezone: string;
  activeUsers: number;
  permissions: string[];
  isActive: boolean;
}

interface RBACRule {
  id: string;
  name: string;
  type: 'allow' | 'deny';
  resource: string;
  action: string;
  conditions: string[];
  priority: number;
  isActive: boolean;
}

const ContextEnginePanel: React.FC = () => {
  const theme = useTheme();
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [showInactiveRules, setShowInactiveRules] = useState(false);

  // Mock data for Context Engine
  const mockUsers: UserContext[] = [
    {
      userId: 'user1',
      username: 'john.doe',
      role: 'Manager',
      department: 'Sales',
      permissions: ['read:reports', 'write:leads', 'manage:team'],
      location: 'office-nyc',
      shift: 'day-shift',
      isActive: true,
      lastActivity: '2 min ago'
    },
    {
      userId: 'user2',
      username: 'jane.smith',
      role: 'Agent',
      department: 'Support',
      permissions: ['read:tickets', 'write:responses'],
      location: 'remote',
      shift: 'night-shift',
      isActive: true,
      lastActivity: '5 min ago'
    },
    {
      userId: 'user3',
      username: 'mike.wilson',
      role: 'Admin',
      department: 'IT',
      permissions: ['admin:all', 'manage:system', 'configure:rbac'],
      location: 'office-sf',
      shift: 'day-shift',
      isActive: false,
      lastActivity: '1 hour ago'
    }
  ];

  const mockLocations: LocationContext[] = [
    {
      locationId: 'office-nyc',
      name: 'New York Office',
      type: 'office',
      timezone: 'America/New_York',
      restrictions: ['secure-data-access'],
      activeUsers: 45,
      isOperational: true
    },
    {
      locationId: 'office-sf',
      name: 'San Francisco Office',
      type: 'office',
      timezone: 'America/Los_Angeles',
      restrictions: ['secure-data-access', 'compliance-required'],
      activeUsers: 32,
      isOperational: true
    },
    {
      locationId: 'remote',
      name: 'Remote Workers',
      type: 'remote',
      timezone: 'Various',
      restrictions: ['vpn-required', 'limited-data-access'],
      activeUsers: 28,
      isOperational: true
    }
  ];

  const mockShifts: ShiftContext[] = [
    {
      shiftId: 'day-shift',
      name: 'Day Shift',
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'Local',
      activeUsers: 67,
      permissions: ['full-access'],
      isActive: true
    },
    {
      shiftId: 'night-shift',
      name: 'Night Shift',
      startTime: '22:00',
      endTime: '06:00',
      timezone: 'Local',
      activeUsers: 23,
      permissions: ['limited-access', 'emergency-only'],
      isActive: true
    },
    {
      shiftId: 'weekend-shift',
      name: 'Weekend Shift',
      startTime: '10:00',
      endTime: '18:00',
      timezone: 'Local',
      activeUsers: 15,
      permissions: ['maintenance-only'],
      isActive: false
    }
  ];

  const mockRBACRules: RBACRule[] = [
    {
      id: 'rule1',
      name: 'Manager Data Access',
      type: 'allow',
      resource: 'customer-data',
      action: 'read',
      conditions: ['role:Manager', 'location:office'],
      priority: 1,
      isActive: true
    },
    {
      id: 'rule2',
      name: 'Remote Access Restriction',
      type: 'deny',
      resource: 'sensitive-data',
      action: 'write',
      conditions: ['location:remote'],
      priority: 2,
      isActive: true
    },
    {
      id: 'rule3',
      name: 'Night Shift Limitations',
      type: 'allow',
      resource: 'support-tickets',
      action: 'read',
      conditions: ['shift:night-shift', 'department:Support'],
      priority: 3,
      isActive: true
    }
  ];

  // Helper functions
  const getStatusColor = useCallback((isActive: boolean, isOperational?: boolean) => {
    if (isOperational === false) return theme.palette.error.main;
    return isActive ? theme.palette.success.main : theme.palette.text.disabled;
  }, [theme]);

  const getRoleColor = useCallback((role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return theme.palette.error.main;
      case 'manager': return theme.palette.warning.main;
      case 'agent': return theme.palette.info.main;
      default: return theme.palette.text.secondary;
    }
  }, [theme]);

  const getLocationIcon = useCallback((type: string) => {
    switch (type) {
      case 'office': return <Business fontSize="small" />;
      case 'remote': return <LocationOn fontSize="small" />;
      case 'hybrid': return <WorkOutline fontSize="small" />;
      default: return <LocationOn fontSize="small" />;
    }
  }, []);

  // Dashboard cards configuration
  const dashboardCards: DashboardCardProps[] = useMemo(() => [
    {
      id: 'rbac-overview',
      title: 'RBAC Overview',
      defaultLayout: { x: 0, y: 0, w: 6, h: 5 },
      children: (
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Role-Based Access Control
            </Typography>
            <IconButton size="small" onClick={() => console.log('Refresh RBAC')}>
              <Refresh fontSize="small" />
            </IconButton>
          </Box>
          
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Active Rules</Typography>
              <Typography variant="body2" fontWeight={600}>
                {mockRBACRules.filter(rule => rule.isActive).length}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
              <Typography variant="body2" fontWeight={600}>
                {mockUsers.length}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Active Users</Typography>
              <Typography variant="body2" fontWeight={600} color="success.main">
                {mockUsers.filter(user => user.isActive).length}
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>Recent RBAC Rules</Typography>
            <Stack spacing={1}>
              {mockRBACRules.slice(0, 3).map((rule) => (
                <Box
                  key={rule.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={rule.type}
                        size="small"
                        color={rule.type === 'allow' ? 'success' : 'error'}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                      <Typography variant="caption" fontWeight={600}>
                        {rule.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={rule.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={rule.isActive ? 'success' : 'default'}
                      sx={{ fontSize: '0.6rem', height: 18 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {rule.resource} • {rule.action}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      )
    },
    {
      id: 'location-context',
      title: 'Location Context',
      defaultLayout: { x: 6, y: 0, w: 6, h: 5 },
      children: (
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Location-Based Context
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                displayEmpty
              >
                <MenuItem value="all">All Locations</MenuItem>
                {mockLocations.map((location) => (
                  <MenuItem key={location.locationId} value={location.locationId}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Stack spacing={1.5}>
            {mockLocations.map((location) => (
              <Box
                key={location.locationId}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getLocationIcon(location.type)}
                    <Typography variant="subtitle2" fontWeight={600}>
                      {location.name}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Badge
                      badgeContent={location.activeUsers}
                      color="primary"
                      sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', height: 16, minWidth: 16 } }}
                    >
                      <Person fontSize="small" />
                    </Badge>
                    <Chip
                      label={location.isOperational ? 'Operational' : 'Down'}
                      size="small"
                      color={location.isOperational ? 'success' : 'error'}
                      sx={{ fontSize: '0.6rem', height: 18 }}
                    />
                  </Box>
                </Box>
                
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary">
                    {location.timezone}
                  </Typography>
                  {location.restrictions.map((restriction) => (
                    <Chip
                      key={restriction}
                      label={restriction}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.6rem', height: 16 }}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      )
    },
    {
      id: 'shift-context',
      title: 'Shift Context',
      defaultLayout: { x: 0, y: 5, w: 6, h: 4 },
      children: (
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Shift-Based Context
            </Typography>
            <IconButton size="small" onClick={() => console.log('Refresh shifts')}>
              <Schedule fontSize="small" />
            </IconButton>
          </Box>

          <Stack spacing={1.5}>
            {mockShifts.map((shift) => (
              <Box
                key={shift.shiftId}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTime fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      {shift.name}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary">
                      {shift.activeUsers} users
                    </Typography>
                    <Chip
                      label={shift.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={shift.isActive ? 'success' : 'default'}
                      sx={{ fontSize: '0.6rem', height: 18 }}
                    />
                  </Box>
                </Box>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {shift.startTime} - {shift.endTime}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    {shift.permissions.map((permission) => (
                      <Chip
                        key={permission}
                        label={permission}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.6rem', height: 16 }}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      )
    },
    {
      id: 'user-context',
      title: 'User Context',
      defaultLayout: { x: 6, y: 5, w: 6, h: 4 },
      children: (
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              User Context & Permissions
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                displayEmpty
              >
                <MenuItem value="all">All Users</MenuItem>
                {mockUsers.map((user) => (
                  <MenuItem key={user.userId} value={user.userId}>
                    {user.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Stack spacing={1.5}>
            {mockUsers.map((user) => (
              <Box
                key={user.userId}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person fontSize="small" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      {user.username}
                    </Typography>
                    <Chip
                      label={user.role}
                      size="small"
                      sx={{
                        fontSize: '0.6rem',
                        height: 18,
                        backgroundColor: alpha(getRoleColor(user.role), 0.1),
                        color: getRoleColor(user.role)
                      }}
                    />
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary">
                      {user.lastActivity}
                    </Typography>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={user.isActive ? 'success' : 'default'}
                      sx={{ fontSize: '0.6rem', height: 18 }}
                    />
                  </Box>
                </Box>
                
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary">
                    {user.department} • {user.permissions.length} permissions
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Stack>
      )
    },
    {
      id: 'context-policies',
      title: 'Context Policies',
      defaultLayout: { x: 0, y: 9, w: 12, h: 4 },
      children: (
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Context-Aware Policies
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showInactiveRules}
                    onChange={(e) => setShowInactiveRules(e.target.checked)}
                    size="small"
                  />
                }
                label="Show Inactive"
                sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.8rem' } }}
              />
              <Button
                startIcon={<Settings />}
                size="small"
                onClick={() => console.log('Configure policies')}
                sx={{ textTransform: 'none' }}
              >
                Configure
              </Button>
            </Box>
          </Box>

          <Stack spacing={1}>
            {mockRBACRules
              .filter(rule => showInactiveRules || rule.isActive)
              .map((rule) => (
                <Box
                  key={rule.id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Shield fontSize="small" />
                      <Typography variant="subtitle2" fontWeight={600}>
                        {rule.name}
                      </Typography>
                      <Chip
                        label={rule.type}
                        size="small"
                        color={rule.type === 'allow' ? 'success' : 'error'}
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.secondary">
                        Priority: {rule.priority}
                      </Typography>
                      <Chip
                        label={rule.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={rule.isActive ? 'success' : 'default'}
                        sx={{ fontSize: '0.6rem', height: 18 }}
                      />
                    </Box>
                  </Box>
                  
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      <strong>Resource:</strong> {rule.resource}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Action:</strong> {rule.action}
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {rule.conditions.map((condition) => (
                        <Chip
                          key={condition}
                          label={condition}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: 18 }}
                        />
                      ))}
                    </Box>
                  </Stack>
                </Box>
              ))}
          </Stack>
        </Stack>
      )
    }
  ], [theme, selectedUser, selectedLocation, selectedShift, showInactiveRules, mockUsers, mockLocations, mockShifts, mockRBACRules, getStatusColor, getRoleColor, getLocationIcon]);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          p: 3,
          borderRadius: 2,
          mb: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <AdminPanelSettings sx={{ color: theme.palette.primary.main, fontSize: 32 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Context Engine
              </Typography>
              <Typography variant="body2" color="text.secondary">
                RBAC, location, and shift-aware context management
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<Refresh />}
              onClick={() => console.log('Refresh context engine')}
              sx={{ textTransform: 'none' }}
            >
              Refresh
            </Button>
            <Button
              startIcon={<Policy />}
              onClick={() => console.log('Manage policies')}
              sx={{ textTransform: 'none' }}
            >
              Policies
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Dashboard Grid */}
      <DashboardGrid
        cards={dashboardCards}
        onLayoutChange={(layout) => {
          console.log('Context Engine layout changed:', layout);
        }}
      />
    </Box>
  );
};

export default ContextEnginePanel;
