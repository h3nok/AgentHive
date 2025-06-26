import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Stack,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Code,
  PlayArrow,
  ContentCopy,
  Download,
  Fullscreen,
  MoreVert,
  CheckCircle,
  Cancel,
  Schedule,
  Assessment
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';

// Chart Data Visualization Component
interface ChartComponentProps {
  type: 'bar' | 'line' | 'pie';
  data: any[];
  title?: string;
  description?: string;
  xKey?: string;
  yKey?: string;
  colors?: string[];
  height?: number;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  type,
  data,
  title,
  description,
  xKey = 'name',
  yKey = 'value',
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'],
  height = 300
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const downloadChart = useCallback(() => {
    // Implementation for chart download
    console.log('Downloading chart...');
    handleMenuClose();
  }, []);

  const copyData = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    handleMenuClose();
  }, [data]);

  const renderChart = (containerHeight: number) => {
    const chartProps = {
      height: containerHeight,
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={containerHeight}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey={yKey} fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={containerHeight}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke={colors[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={containerHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={yKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <Typography>Unsupported chart type</Typography>;
    }
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: theme.shadows[1]
        }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              {title && (
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {title}
                </Typography>
              )}
              {description && (
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              <IconButton size="small" onClick={() => setFullscreenOpen(true)}>
                <Fullscreen fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVert fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
          
          <Box sx={{ height: height, width: '100%' }}>
            {renderChart(height)}
          </Box>
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{title || 'Chart'}</Typography>
            <IconButton onClick={() => setFullscreenOpen(false)}>
              <Cancel />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: 500, width: '100%' }}>
            {renderChart(500)}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={downloadChart}>
          <Download fontSize="small" sx={{ mr: 1 }} />
          Download Chart
        </MenuItem>
        <MenuItem onClick={copyData}>
          <ContentCopy fontSize="small" sx={{ mr: 1 }} />
          Copy Data
        </MenuItem>
      </Menu>
    </>
  );
};

// Code Block Component with Execution
interface CodeBlockComponentProps {
  code: string;
  language: string;
  title?: string;
  executable?: boolean;
  onExecute?: (code: string) => void;
  output?: string;
  isExecuting?: boolean;
}

const CodeBlockComponent: React.FC<CodeBlockComponentProps> = ({
  code,
  language,
  title,
  executable = false,
  onExecute,
  output,
  isExecuting = false
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    handleMenuClose();
  }, [code]);

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {title && (
          <Box sx={{ p: 2, pb: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Code fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
                <Chip 
                  label={language} 
                  size="small" 
                  sx={{ height: 20, fontSize: '0.7rem' }} 
                />
              </Stack>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVert fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        )}
        
        <Box sx={{ position: 'relative' }}>
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '0.875rem'
            }}
          >
            {code}
          </SyntaxHighlighter>
        </Box>
        
        {executable && (
          <CardActions sx={{ px: 2, py: 1, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
            <Button
              size="small"
              startIcon={<PlayArrow />}
              onClick={() => onExecute?.(code)}
              disabled={isExecuting}
              sx={{ mr: 1 }}
            >
              {isExecuting ? 'Executing...' : 'Run Code'}
            </Button>
          </CardActions>
        )}
        
        {output && (
          <Box sx={{ 
            p: 2, 
            bgcolor: alpha(theme.palette.background.default, 0.7),
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {output}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={copyCode}>
          <ContentCopy fontSize="small" sx={{ mr: 1 }} />
          Copy Code
        </MenuItem>
      </Menu>
    </Card>
  );
};

// Data Table Component
interface DataTableComponentProps {
  data: any[];
  title?: string;
  columns?: Array<{
    key: string;
    label: string;
    type?: 'string' | 'number' | 'date';
  }>;
  maxRows?: number;
  sortable?: boolean;
  filterable?: boolean;
}

const DataTableComponent: React.FC<DataTableComponentProps> = ({
  data,
  title,
  columns,
  maxRows = 10,
  sortable = true,
  filterable = false
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Auto-generate columns if not provided
  const tableColumns = columns || (data.length > 0 ? 
    Object.keys(data[0]).map(key => ({ key, label: key, type: 'string' as const })) : 
    []
  );

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const exportData = useCallback(() => {
    const csv = [
      tableColumns.map(col => col.label).join(','),
      ...data.slice(0, maxRows).map(row => 
        tableColumns.map(col => row[col.key] || '').join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'data'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleMenuClose();
  }, [data, tableColumns, maxRows, title]);

  const sortedData = React.useMemo(() => {
    if (!sortField) return data.slice(0, maxRows);
    
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }).slice(0, maxRows);
  }, [data, sortField, sortDirection, maxRows]);

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {title && (
          <Box sx={{ p: 2, pb: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Assessment fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {title}
                </Typography>
                <Chip 
                  label={`${data.length} rows`} 
                  size="small" 
                  sx={{ height: 20, fontSize: '0.7rem' }} 
                />
              </Stack>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreVert fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        )}
        
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                {tableColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={{ 
                      fontWeight: 600,
                      cursor: sortable ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (sortable) {
                        if (sortField === column.key) {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField(column.key);
                          setSortDirection('asc');
                        }
                      }
                    }}
                  >
                    {column.label}
                    {sortField === column.key && (
                      <Typography component="span" sx={{ ml: 1, fontSize: '0.7rem' }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row, index) => (
                <TableRow 
                  key={index}
                  sx={{ '&:nth-of-type(odd)': { bgcolor: alpha(theme.palette.action.hover, 0.3) } }}
                >
                  {tableColumns.map((column) => (
                    <TableCell key={column.key}>
                      {row[column.key]?.toString() || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {data.length > maxRows && (
          <Box sx={{ p: 1, textAlign: 'center', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
            <Typography variant="caption" color="text.secondary">
              Showing {maxRows} of {data.length} rows
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={exportData}>
          <Download fontSize="small" sx={{ mr: 1 }} />
          Export CSV
        </MenuItem>
      </Menu>
    </Card>
  );
};

// Action Buttons Component
interface ActionButtonsComponentProps {
  actions: Array<{
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }>;
  title?: string;
}

const ActionButtonsComponent: React.FC<ActionButtonsComponentProps> = ({
  actions,
  title
}) => {
  const theme = useTheme();

  const getButtonColor = (type: string) => {
    switch (type) {
      case 'primary': return theme.palette.primary.main;
      case 'secondary': return theme.palette.secondary.main;
      case 'success': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'error': return theme.palette.error.main;
      default: return theme.palette.primary.main;
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <CardContent>
        {title && (
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            {title}
          </Typography>
        )}
        
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {actions.map((action) => (
            <motion.div
              key={action.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="contained"
                startIcon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled}
                sx={{
                  bgcolor: getButtonColor(action.type),
                  '&:hover': {
                    bgcolor: alpha(getButtonColor(action.type), 0.8)
                  }
                }}
              >
                {action.label}
              </Button>
            </motion.div>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export {
  ChartComponent,
  CodeBlockComponent,
  DataTableComponent,
  ActionButtonsComponent
};
