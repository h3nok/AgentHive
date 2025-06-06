import React from 'react';
import { useTheme, Paper, Typography, Box, IconButton, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
} from 'recharts';

const CHART_HEIGHT = 300;
const COLORS = ['#C8102E', '#3F88C5', '#7DB249', '#F2A900', '#6B5B95', '#EC7300'];

// Sample data for different chart types
const timeSeriesData = [
  { month: 'Jan', amount: 4000, expense: 2400 },
  { month: 'Feb', amount: 3000, expense: 1398 },
  { month: 'Mar', amount: 2000, expense: 9800 },
  { month: 'Apr', amount: 2780, expense: 3908 },
  { month: 'May', amount: 1890, expense: 4800 },
  { month: 'Jun', amount: 2390, expense: 3800 },
  { month: 'Jul', amount: 3490, expense: 4300 },
];

const comparisonData = [
  { name: 'Store A', value: 400 },
  { name: 'Store B', value: 300 },
  { name: 'Store C', value: 300 },
  { name: 'Store D', value: 200 },
  { name: 'Store E', value: 278 },
];

const categoryData = [
  { category: 'Roof Repair', landlord: 40, tenant: 60 },
  { category: 'HVAC', landlord: 30, tenant: 70 },
  { category: 'Parking Lot', landlord: 20, tenant: 80 },
  { category: 'Common Areas', landlord: 80, tenant: 20 },
  { category: 'Plumbing', landlord: 50, tenant: 50 },
];

const locationData = [
  { state: 'CA', count: 42 },
  { state: 'TX', count: 35 },
  { state: 'FL', count: 28 },
  { state: 'NY', count: 23 },
  { state: 'IL', count: 19 },
];

const expenseData = [
  { month: 'Jan', expense: 2400, budget: 2800 },
  { month: 'Feb', expense: 1398, budget: 2000 },
  { month: 'Mar', expense: 9800, budget: 9000 },
  { month: 'Apr', expense: 3908, budget: 4000 },
  { month: 'May', expense: 4800, budget: 5000 },
  { month: 'Jun', expense: 3800, budget: 3500 },
  { month: 'Jul', expense: 4300, budget: 4500 },
];

interface ChartSampleProps {
  category: string;
}

const ChartSamples: React.FC<ChartSampleProps> = ({ category }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Copy chart as image - just a placeholder for now
  const handleCopyChart = () => {
    console.log('Copy chart');
    // In a real implementation, would use html2canvas or similar 
    // to convert the chart to an image and copy to clipboard
  };

  // Download chart as image - just a placeholder for now
  const handleDownloadChart = () => {
    console.log('Download chart');
    // In a real implementation, would use html2canvas or similar
    // to convert the chart to an image and download it
  };

  const renderChart = () => {
    switch (category) {
      case 'lease':
        return (
          <>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 2, 
                fontWeight: 500,
                pb: 1,
                borderBottom: 'none',
                color: isDark ? theme.palette.grey[200] : theme.palette.grey[800],
                display: 'flex',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 16,
                  marginRight: '8px',
                  backgroundColor: COLORS[0],
                  borderRadius: 4
                }
              }}
            >
              Lease Term Distribution by Responsibility
            </Typography>
            <Box 
              sx={{
                borderRadius: '12px',
                p: 2,
                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)',
                border: 'none',
                backdropFilter: 'blur(4px)'
              }}
            >
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart 
                  data={categoryData}
                  margin={{top: 10, right: 30, left: 0, bottom: 10}}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fill: isDark ? '#f0f0f0' : '#333' }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    tickLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                  />
                  <YAxis 
                    tick={{ fill: isDark ? '#f0f0f0' : '#333' }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    tickLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? 'rgba(33,33,33,0.9)' : 'rgba(255,255,255,0.9)',
                      color: isDark ? '#f0f0f0' : '#333',
                      border: 'none',
                      borderRadius: '6px',
                      boxShadow: 'none'
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '10px',
                      borderTop: 'none'
                    }}
                  />
                  <Bar dataKey="landlord" name="Landlord Responsibility (%)" fill={COLORS[0]} />
                  <Bar dataKey="tenant" name="Tenant Responsibility (%)" fill={COLORS[1]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </>
        );
        
      case 'expense':
        return (
          <>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 2, 
                fontWeight: 500,
                pb: 1,
                borderBottom: 'none',
                color: isDark ? theme.palette.grey[200] : theme.palette.grey[800],
                display: 'flex',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 16,
                  marginRight: '8px',
                  backgroundColor: COLORS[0],
                  borderRadius: 4
                }
              }}
            >
              Monthly Expense Tracking vs Budget
            </Typography>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={expenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis dataKey="month" tick={{ fill: isDark ? '#f0f0f0' : '#333' }} />
                <YAxis tick={{ fill: isDark ? '#f0f0f0' : '#333' }} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(33,33,33,0.9)' : 'rgba(255,255,255,0.9)',
                    color: isDark ? '#f0f0f0' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    boxShadow: 'none'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px',
                    borderTop: 'none'
                  }}
                />
                <Line type="monotone" dataKey="expense" name="Actual Expense" stroke={COLORS[0]} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="budget" name="Budget" stroke={COLORS[1]} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </>
        );

      case 'table':
      case 'development':
        return (
          <>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 2, 
                fontWeight: 500,
                pb: 1,
                borderBottom: 'none',
                color: isDark ? theme.palette.grey[200] : theme.palette.grey[800],
                display: 'flex',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 16,
                  marginRight: '8px',
                  backgroundColor: COLORS[2],
                  borderRadius: 4
                }
              }}
            >
              Revenue and Expense Timeline
            </Typography>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis dataKey="month" tick={{ fill: isDark ? '#f0f0f0' : '#333' }} />
                <YAxis tick={{ fill: isDark ? '#f0f0f0' : '#333' }} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(33,33,33,0.9)' : 'rgba(255,255,255,0.9)',
                    color: isDark ? '#f0f0f0' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    boxShadow: 'none'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px',
                    borderTop: 'none'
                  }}
                />
                <Area type="monotone" dataKey="amount" name="Revenue" fill={COLORS[2]} stroke={COLORS[2]} />
                <Area type="monotone" dataKey="expense" name="Expense" fill={COLORS[0]} stroke={COLORS[0]} />
              </AreaChart>
            </ResponsiveContainer>
          </>
        );

      case 'location':
        return (
          <>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 2, 
                fontWeight: 500,
                pb: 1,
                borderBottom: 'none',
                color: isDark ? theme.palette.grey[200] : theme.palette.grey[800],
                display: 'flex',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 16,
                  marginRight: '8px',
                  backgroundColor: COLORS[3],
                  borderRadius: 4
                }
              }}
            >
              Store Locations by State
            </Typography>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={locationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis type="number" tick={{ fill: isDark ? '#f0f0f0' : '#333' }} />
                <YAxis dataKey="state" type="category" tick={{ fill: isDark ? '#f0f0f0' : '#333' }} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(33,33,33,0.9)' : 'rgba(255,255,255,0.9)',
                    color: isDark ? '#f0f0f0' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    boxShadow: 'none'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px',
                    borderTop: 'none'
                  }}
                />
                <Bar dataKey="count" name="Number of Stores" fill={COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        );

      case 'contacts':
      case 'analysis':
        return (
          <>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 2, 
                fontWeight: 500,
                pb: 1,
                borderBottom: 'none',
                color: isDark ? theme.palette.grey[200] : theme.palette.grey[800],
                display: 'flex',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  width: 4,
                  height: 16,
                  marginRight: '8px',
                  backgroundColor: COLORS[4],
                  borderRadius: 4
                }
              }}
            >
              Store Performance Comparison
            </Typography>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={comparisonData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {comparisonData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(33,33,33,0.9)' : 'rgba(255,255,255,0.9)',
                    color: isDark ? '#f0f0f0' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    boxShadow: 'none'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        );

      default:
        return null;
    }
  };

  if (!category) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        my: 4,
        p: 3,
        border: 'none',
        borderRadius: '12px',
        backgroundColor: isDark ? 'rgba(30,30,30,0.4)' : 'rgba(250,250,250,0.7)',
        backdropFilter: 'blur(8px)',
        boxShadow: 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: theme.palette.primary.main, opacity: 0.9 }} />
          <Typography variant="subtitle1" fontWeight={500} color={theme.palette.primary.main}>
            Interactive Data Visualization
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Copy chart">
            <IconButton size="small" onClick={handleCopyChart}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download chart">
            <IconButton size="small" onClick={handleDownloadChart}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {renderChart()}
    </Paper>
  );
};

export default ChartSamples; 