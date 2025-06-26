import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { RouterMetrics } from '../../../routing/router/routerAnalyticsApi';

interface AgentDistributionChartProps {
  data?: RouterMetrics;
}

const AgentDistributionChart: React.FC<AgentDistributionChartProps> = ({ data }) => {
  const theme = useTheme();

  // Generate agent distribution data
  const generateAgentData = () => {
    // Use data from RouterMetrics if available, otherwise use defaults
    const baseMultiplier = data?.total_requests ? Math.max(1, data.total_requests / 1000) : 1;
    const agentDist = data?.learning_metrics?.agent_distribution;
    
    const agents = [
      { 
        name: 'Product Search', 
        requests: agentDist?.['product_search'] || Math.floor((Math.random() * 1000 + 500) * baseMultiplier), 
        color: theme.palette.primary.main 
      },
      { 
        name: 'Customer Service', 
        requests: agentDist?.['customer_service'] || Math.floor((Math.random() * 800 + 400) * baseMultiplier), 
        color: theme.palette.secondary.main 
      },
      { 
        name: 'Technical Support', 
        requests: agentDist?.['technical_support'] || Math.floor((Math.random() * 600 + 300) * baseMultiplier), 
        color: theme.palette.success.main 
      },
      { 
        name: 'Store Locator', 
        requests: agentDist?.['store_locator'] || Math.floor((Math.random() * 400 + 200) * baseMultiplier), 
        color: theme.palette.info.main 
      },
      { 
        name: 'Account Management', 
        requests: agentDist?.['account_management'] || Math.floor((Math.random() * 300 + 150) * baseMultiplier), 
        color: theme.palette.warning.main 
      },
      { 
        name: 'General Inquiry', 
        requests: agentDist?.['general_inquiry'] || Math.floor((Math.random() * 200 + 100) * baseMultiplier), 
        color: theme.palette.error.main 
      },
    ];

    return agents.sort((a, b) => b.requests - a.requests);
  };

  const agentData = generateAgentData();
  const totalRequests = agentData.reduce((sum, agent) => sum + agent.requests, 0);

  // Prepare data for pie chart
  const pieData = agentData.map(agent => ({
    ...agent,
    value: agent.requests,
    percentage: ((agent.requests / totalRequests) * 100).toFixed(1),
  }));

  // Prepare data for bar chart (performance metrics)
  const performanceData = agentData.map(agent => ({
    name: agent.name.split(' ')[0], // Shortened name for better display
    requests: agent.requests,
    avgResponseTime: Math.floor(Math.random() * 200) + 100,
    successRate: Math.floor(Math.random() * 20) + 80,
  }));

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    if (percent < 0.05) return null; // Don't show labels for very small slices
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* Pie Chart - Distribution */}
        <Box sx={{ flex: 1 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill={theme.palette.primary.main}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [
                  `${value.toLocaleString()} requests`,
                  'Requests'
                ]}
                labelFormatter={(name: string) => name}
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value: string, entry: { color?: string }) => (
                  <span style={{ color: entry.color || theme.palette.text.primary, fontSize: '12px' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* Bar Chart - Performance */}
        <Box sx={{ flex: 1 }}>
          <ResponsiveContainer>
            <BarChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="name" 
                stroke={theme.palette.text.secondary}
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke={theme.palette.text.secondary}
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.shape.borderRadius,
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'avgResponseTime') return [`${value}ms`, 'Avg Response Time'];
                  if (name === 'successRate') return [`${value}%`, 'Success Rate'];
                  return [value.toLocaleString(), 'Requests'];
                }}
              />
              <Bar 
                dataKey="requests" 
                fill={theme.palette.primary.main}
                name="requests"
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default AgentDistributionChart;
