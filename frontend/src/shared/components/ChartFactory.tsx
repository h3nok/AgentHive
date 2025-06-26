import React from 'react';
import { useTheme, Paper, Typography, Box, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
} from 'recharts';

// Configuration constants
const CHART_HEIGHT = 200;
const COLORS = ['#C8102E', '#3F88C5', '#7DB249', '#F2A900', '#6B5B95', '#EC7300'];

// Chart type definitions
export type ChartType = 
  | 'bar' 
  | 'line' 
  | 'area' 
  | 'pie' 
  | 'scatter' 
  | 'radar' 
  | 'radialBar' 
  | 'treemap'
  | 'stackedBar'
  | 'geo'
  | 'horizontalBar'; // Special type for horizontal bar charts

// Data field configuration
interface DataField {
  key: string;
  name: string;
  color?: string;
  stack?: string;
}

// Add type definitions for chart configurations
export interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'radar' | 'radialBar' | 'treemap' | 'stackedBar' | 'geo' | 'horizontalBar';
  options: any; // Using any for now as the options are complex and vary by chart type
  series: any[]; // Using any[] for now as series data varies by chart type
}

export interface ChartFactoryProps {
  type: ChartConfig['type'];
  options: ChartConfig['options'];
  series: ChartConfig['series'];
}

// Sample datasets
const chartDatasets = {
  timeSeriesData: [
    { month: 'Jan', amount: 4000, expense: 2400, profit: 1600 },
    { month: 'Feb', amount: 3000, expense: 1398, profit: 1602 },
    { month: 'Mar', amount: 2000, expense: 9800, profit: -7800 },
    { month: 'Apr', amount: 2780, expense: 3908, profit: -1128 },
    { month: 'May', amount: 1890, expense: 4800, profit: -2910 },
    { month: 'Jun', amount: 2390, expense: 3800, profit: -1410 },
    { month: 'Jul', amount: 3490, expense: 4300, profit: -810 },
  ],
  
  comparisonData: [
    { name: 'Store A', value: 400 },
    { name: 'Store B', value: 300 },
    { name: 'Store C', value: 300 },
    { name: 'Store D', value: 200 },
    { name: 'Store E', value: 278 },
  ],
  
  categoryData: [
    { category: 'Roof Repair', landlord: 40, tenant: 60 },
    { category: 'HVAC', landlord: 30, tenant: 70 },
    { category: 'Parking Lot', landlord: 20, tenant: 80 },
    { category: 'Common Areas', landlord: 80, tenant: 20 },
    { category: 'Plumbing', landlord: 50, tenant: 50 },
  ],
  
  locationData: [
    { state: 'CA', count: 42 },
    { state: 'TX', count: 35 },
    { state: 'FL', count: 28 },
    { state: 'NY', count: 23 },
    { state: 'IL', count: 19 },
  ],
  
  expenseData: [
    { month: 'Jan', expense: 2400, budget: 2800 },
    { month: 'Feb', expense: 1398, budget: 2000 },
    { month: 'Mar', expense: 9800, budget: 9000 },
    { month: 'Apr', expense: 3908, budget: 4000 },
    { month: 'May', expense: 4800, budget: 5000 },
    { month: 'Jun', expense: 3800, budget: 3500 },
    { month: 'Jul', expense: 4300, budget: 4500 },
  ],
  
  scatterData: [
    { x: 100, y: 200, z: 200 },
    { x: 120, y: 100, z: 260 },
    { x: 170, y: 300, z: 400 },
    { x: 140, y: 250, z: 280 },
    { x: 150, y: 400, z: 500 },
    { x: 110, y: 280, z: 200 },
  ],
  
  radarData: [
    { subject: 'Sales', A: 120, B: 110, fullMark: 150 },
    { subject: 'Marketing', A: 98, B: 130, fullMark: 150 },
    { subject: 'Operations', A: 86, B: 130, fullMark: 150 },
    { subject: 'Customer Support', A: 99, B: 100, fullMark: 150 },
    { subject: 'Development', A: 85, B: 90, fullMark: 150 },
    { subject: 'Finance', A: 65, B: 85, fullMark: 150 },
  ],
  
  radialData: [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
  ],
  
  treemapData: [
    { name: 'Store A', size: 400, fill: COLORS[0] },
    { name: 'Store B', size: 300, fill: COLORS[1] },
    { name: 'Store C', size: 300, fill: COLORS[2] },
    { name: 'Store D', size: 200, fill: COLORS[3] },
    { name: 'Store E', size: 278, fill: COLORS[4] },
  ],
};

// Update the promptChartConfigs type
const promptChartConfigs: Record<string, ChartConfig> = {
  "What is the lease expiration date for each property?": {
    type: 'bar',
    options: {
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: true
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ['Property A', 'Property B', 'Property C', 'Property D'],
        title: {
          text: 'Properties'
        }
      },
      yaxis: {
        title: {
          text: 'Expiration Date'
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function (val: any) {
            return val
          }
        }
      }
    },
    series: [{
      name: 'Expiration Date',
      data: [30, 40, 35, 50]
    }]
  },
  "Who is responsible for roof repair for each property?": {
    type: 'pie',
    options: {
      chart: {
        type: 'pie',
        height: 350
      },
      labels: ['Landlord', 'Tenant', 'Shared', 'Not Specified'],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    },
    series: [44, 55, 13, 43]
  },
  "Who is responsible for parking lot maintenance for each property?": {
    type: 'pie',
    options: {
      chart: {
        type: 'pie',
        height: 350
      },
      labels: ['Landlord', 'Tenant', 'Shared', 'Not Specified'],
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    },
    series: [35, 45, 15, 5]
  },
  "Can you show me all recurring expense schedules?": {
    type: 'line',
    options: {
      chart: {
        type: 'line',
        height: 350,
        toolbar: {
          show: true
        }
      },
      stroke: {
        curve: 'smooth'
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        title: {
          text: 'Month'
        }
      },
      yaxis: {
        title: {
          text: 'Amount ($)'
        }
      },
      tooltip: {
        y: {
          formatter: function (val: any) {
            return "$ " + val
          }
        }
      }
    },
    series: [{
      name: 'Rent',
      data: [45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000]
    }, {
      name: 'Utilities',
      data: [5000, 5500, 4800, 5200, 6000, 5800, 6200, 5900, 5100, 5300, 5600, 5400]
    }, {
      name: 'Maintenance',
      data: [2000, 1800, 2200, 1900, 2100, 2300, 2000, 2200, 1900, 2100, 2000, 2200]
    }]
  }
};

// Update the getChartConfigForPrompt function
export const getChartConfigForPrompt = (prompt: string): ChartConfig | null => {
  return promptChartConfigs[prompt] || null;
};

// Get dataset for a category
const getDatasetForCategory = (category: string): any[] => {
  switch (category) {
    case 'lease':
      return chartDatasets.categoryData;
    case 'expense': 
      return chartDatasets.expenseData;
    case 'table':
    case 'development':
      return chartDatasets.timeSeriesData;
    case 'location':
      return chartDatasets.locationData;
    case 'contacts':
    case 'analysis':
      return chartDatasets.comparisonData;
    case 'scatter':
      return chartDatasets.scatterData;
    case 'radar':
      return chartDatasets.radarData;
    case 'radial':
      return chartDatasets.radialData;
    case 'treemap':
      return chartDatasets.treemapData;
    default:
      // Default to time series data
      return chartDatasets.timeSeriesData;
  }
};

const GLASSY_PAPER_SX = (theme: any) => ({
  background: theme.palette.mode === 'dark'
    ? 'rgba(30,30,30,0.55)'
    : 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: 'none',
  boxShadow: 'none',
  p: 2,
  m: 0,
  borderRadius: 3,
});

const CustomTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: any; isDark?: boolean }> = ({ active, payload, label, isDark }) => {
  if (!active || !payload || payload.length === 0) return null;
  const theme = useTheme();
  return (
    <Paper 
      elevation={0}
      sx={{
        ...GLASSY_PAPER_SX(theme),
        p: 1.5,
        minWidth: 120,
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.7)' : '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5 }}>{label}</Typography>
      {payload.map((pl, i) => (
        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">{pl.name}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 500 }}>{pl.value}</Typography>
        </Box>
      ))}
    </Paper>
  );
};

const chartTypeOptions = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'stackedBar', label: 'Stacked Bar' },
  { value: 'horizontalBar', label: 'Horizontal Bar' },
];

const ChartFactory: React.FC<ChartFactoryProps> = ({ 
  type: initialType,
  options,
  series
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [chartType, setChartType] = React.useState<string>(initialType);
  
  // Handle chart utility actions
  const handleCopyChart = () => {
    // Implementation for copying chart
  };

  const handleDownloadChart = () => {
    // Implementation for downloading chart
  };
  
  const handleShareChart = () => {
    // Implementation for sharing chart
  };
  
  const handleEditChart = () => {
    // Implementation for editing chart
  };
  
  const handleSaveChart = () => {
    // Implementation for saving chart
  };
  
  const handleExplainChart = () => {
    // Implementation for explaining chart
  };
  
  const handleRunChart = () => {
    // Implementation for running chart
  };
  
  if (!chartType) return null;

  // Helper: Convert Apex-style series/categories to Recharts data array
  const buildCartesianData = React.useMemo(() => {
    if (!options?.xaxis?.categories || !Array.isArray(series)) return [];
    return options.xaxis.categories.map((cat: string, idx: number) => {
      const obj: any = { category: cat };
      series.forEach((s: any) => {
        obj[s.name] = s.data[idx];
      });
      return obj;
    });
  }, [options, series]);

  // Render functions per chart type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={buildCartesianData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <RechartsTooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend />
              {series.map((s: any, idx: number) => (
                <Bar key={s.name} dataKey={s.name} fill={COLORS[idx % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'stackedBar':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={buildCartesianData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <RechartsTooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend />
              {series.map((s: any, idx: number) => (
                <Bar key={s.name} dataKey={s.name} fill={COLORS[idx % COLORS.length]} stackId="a" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'horizontalBar':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={buildCartesianData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="category" />
              <RechartsTooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend />
              {series.map((s: any, idx: number) => (
                <Bar key={s.name} dataKey={s.name} fill={COLORS[idx % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={buildCartesianData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <RechartsTooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend />
              {series.map((s: any, idx: number) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={COLORS[idx % COLORS.length]}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={buildCartesianData}>
              <defs>
                {series.map((s: any, idx: number) => (
                  <linearGradient key={idx} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <RechartsTooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend />
              {series.map((s: any, idx: number) => (
                <Area
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={COLORS[idx % COLORS.length]}
                  fillOpacity={1}
                  fill={`url(#color${idx})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie':
        // For pies, assume labels in options.labels and numeric series array
        const labels = (options?.labels || []) as string[];
        const pieData = labels.map((label: string, idx: number) => ({
          name: label,
          value: series[idx] ?? 0,
        }));
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <RechartsTooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                fill={COLORS[0]}
                label
              >
                {pieData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <ScatterChart data={buildCartesianData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis dataKey="y" />
              <RechartsTooltip content={<CustomTooltip isDark={isDark} />} />
              <Legend />
              <Scatter data={buildCartesianData} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <Typography variant="body2">Radar chart not yet supported.</Typography>
        );
      case 'radialBar':
        return (
          <Typography variant="body2">RadialBar chart not yet supported.</Typography>
        );
      case 'treemap':
        return (
          <Typography variant="body2">Treemap chart not yet supported.</Typography>
        );
      case 'geo':
        return (
          <Typography variant="body2">Geo map demo coming soon.</Typography>
        );
      default:
        return (
          <Typography variant="body2">Chart type "{chartType}" not yet supported.</Typography>
        );
    }
  };

  return (
    <Paper elevation={0} sx={GLASSY_PAPER_SX(theme)}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
          <InputLabel id="chart-type-label">Chart Type</InputLabel>
          <Select
            labelId="chart-type-label"
            value={chartType}
            label="Chart Type"
            onChange={e => setChartType(e.target.value)}
          >
            {chartTypeOptions.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Copy Chart">
          <IconButton size="small" onClick={handleCopyChart}><ContentCopyIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Download Chart">
          <IconButton size="small" onClick={handleDownloadChart}><DownloadIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Chart Settings">
          <IconButton size="small" onClick={handleEditChart}><SettingsIcon fontSize="small" /></IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ width: '100%', minHeight: CHART_HEIGHT }}>
        {renderChart()}
      </Box>
    </Paper>
  );
};

export default ChartFactory; 