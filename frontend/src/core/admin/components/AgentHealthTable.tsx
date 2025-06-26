import React, { useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams, GridValueGetter } from '@mui/x-data-grid';
import { Paper, Chip, Typography, Box, CircularProgress, Alert, useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';

interface AgentHealth {
  id: string;
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded' | 'pending';
  latency: number; // in ms
  lastCheck?: string; // ISO string
  errorRate?: number; // percentage 0-100
}

const mockAgentHealthData: AgentHealth[] = [
  { id: 'lease', name: 'Lease Abstraction Agent', status: 'healthy', latency: 95, lastCheck: new Date().toISOString(), errorRate: 0.5 },
  { id: 'hr', name: 'HR Task Automation', status: 'degraded', latency: 250, lastCheck: new Date().toISOString(), errorRate: 5.2 },
  { id: 'sales', name: 'Instant Sales Insights', status: 'healthy', latency: 120, lastCheck: new Date().toISOString(), errorRate: 1.1 },
  { id: 'tech', name: 'Tech Support Simplified', status: 'unhealthy', latency: 550, lastCheck: new Date().toISOString(), errorRate: 15.0 },
  { id: 'routing', name: 'Intelligent Request Routing', status: 'pending', latency: 0, lastCheck: new Date().toISOString(), errorRate: 0 },
  { id: 'billing', name: 'Automated Billing Agent', status: 'healthy', latency: 80, lastCheck: new Date().toISOString(), errorRate: 0.2 },
  { id: 'inventory', name: 'Real-time Inventory Checker', status: 'degraded', latency: 300, lastCheck: new Date().toISOString(), errorRate: 3.5 },
];

const StatusPill: React.FC<{ status: AgentHealth['status'] }> = ({ status }) => {
  const theme = useTheme();
  let iconElement: React.ReactElement | undefined = undefined;
  let color: string;
  let label: string;

  switch (status) {
    case 'healthy':
      iconElement = <CheckCircleIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />;
      color = theme.palette.success.main;
      label = 'Healthy';
      break;
    case 'degraded':
      iconElement = <WarningIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />;
      color = theme.palette.warning.main;
      label = 'Degraded';
      break;
    case 'unhealthy':
      iconElement = <ErrorIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />;
      color = theme.palette.error.main;
      label = 'Unhealthy';
      break;
    case 'pending':
      iconElement = <PendingIcon sx={{ fontSize: '1.1rem', mr: 0.5 }} />;
      color = theme.palette.info.main;
      label = 'Pending';
      break;
    default:
      color = theme.palette.text.disabled;
      label = 'Unknown';
  }

  return (
    <Chip 
      icon={iconElement}
      label={label} 
      size="small"
      sx={{ 
        backgroundColor: `${color}20`,
        color: color, 
        fontWeight: 500, 
        borderRadius: '8px',
        px: 0.5 
      }} 
    />
  );
};

const AgentHealthTable: React.FC<{ sx?: any }> = ({ sx }) => {
  const [rows, setRows] = useState<AgentHealth[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        setRows(mockAgentHealthData);
      } catch (err) {
        console.error(err);
        setError('Failed to load agent health data. Using mock data as fallback.');
        setRows(mockAgentHealthData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns: GridColDef<AgentHealth>[] = [
    { field: 'name', headerName: 'Agent Name', flex: 2, minWidth: 200 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams<AgentHealth, AgentHealth['status']>) => {
        if (params.value === undefined) return null;
        return <StatusPill status={params.value} />;
      }
    },
    {
      field: 'latency',
      headerName: 'P95 Latency (ms)',
      type: 'number',
      flex: 1,
      minWidth: 150,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<AgentHealth, number | undefined>) => (
        <Typography variant="body2" sx={{ color: params.value != null && params.value > 300 ? theme.palette.warning.main : theme.palette.text.primary}}>
          {params.value != null ? `${params.value} ms` : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'errorRate',
      headerName: 'Error Rate (%)',
      type: 'number',
      flex: 1,
      minWidth: 130,
      align: 'right',
      headerAlign: 'right',
      // Guard against undefined row (edge case when DataGrid renders placeholder rows)
      valueGetter: ((params: GridValueGetter<AgentHealth>) => {
        const row = (params as any).row as AgentHealth | undefined;
        return row?.errorRate;
      }) as GridValueGetter<AgentHealth, number | undefined>,
      renderCell: (params: GridRenderCellParams<AgentHealth, number | undefined>) => (
        <Typography variant="body2" sx={{ color: params.value != null && params.value > 5 ? theme.palette.error.main : theme.palette.text.primary}}>
          {params.value != null ? `${params.value.toFixed(1)} %` : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'lastCheck',
      headerName: 'Last Check',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<AgentHealth, string | undefined>) => (
        <Typography variant="body2" color="text.secondary">
          {params.value ? new Date(params.value).toLocaleString() : 'N/A'}
        </Typography>
      )
    },
  ];

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: sx?.height || 400 }}><CircularProgress /></Box>;
  }

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 2, overflow: 'hidden', ...sx }}>
      {error && <Alert severity="warning" sx={{ mb: 2, borderRadius: 0 }}>{error}</Alert>}
      <DataGrid
        rows={rows}
        columns={columns}
        autoHeight={!sx?.height}
        density="compact"
        disableRowSelectionOnClick
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
          sorting: {
            sortModel: [{ field: 'name', sort: 'asc' }],
          },
        }}
        pageSizeOptions={[5, 10, 20]}
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
          },
           '& .MuiDataGrid-virtualScroller': {
            overflowY: 'auto', 
          },
        }}
      />
    </Paper>
  );
};

export default AgentHealthTable; 