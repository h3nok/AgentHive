import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RouterMetrics } from '../../../routing/router/routerAnalyticsApi';

interface RouterPerformanceChartProps {
  data?: RouterMetrics;
  timeRange: string;
}

const RouterPerformanceChart: React.FC<RouterPerformanceChartProps> = ({ data, timeRange }) => {
  const theme = useTheme();

  // Generate mock time series data based on timeRange
  const generateTimeSeriesData = () => {
    if (!data) return [];

    const now = new Date();
    const intervals = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const timeUnit = timeRange === '1h' ? 5 : timeRange === '24h' ? 60 : timeRange === '7d' ? 1440 : 1440;

    return Array.from({ length: intervals }, (_, i) => {
      const timestamp = new Date(now.getTime() - (intervals - 1 - i) * timeUnit * 60000);
      const baseResponseTime = data.learning_metrics?.success_rate ? 
        150 + (1 - data.learning_metrics.success_rate) * 100 : 150;
      const baseAccuracy = data.learning_metrics?.success_rate || 0.85;
      
      // Add some realistic variance
      const responseTimeVariance = (Math.random() - 0.5) * 50;
      const accuracyVariance = (Math.random() - 0.5) * 0.1;

      return {
        time: timeRange === '7d' || timeRange === '30d' 
          ? timestamp.toLocaleDateString() 
          : timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseTime: Math.max(50, baseResponseTime + responseTimeVariance),
        accuracy: Math.max(0.5, Math.min(1, baseAccuracy + accuracyVariance)) * 100,
        throughput: Math.max(10, 50 + (Math.random() - 0.5) * 30),
      };
    });
  };

  const chartData = generateTimeSeriesData();

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey="time" 
            stroke={theme.palette.text.secondary}
            fontSize={12}
          />
          <YAxis 
            yAxisId="left"
            stroke={theme.palette.text.secondary}
            fontSize={12}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            stroke={theme.palette.text.secondary}
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="responseTime"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Response Time (ms)"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="accuracy"
            stroke={theme.palette.success.main}
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Routing Accuracy (%)"
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="throughput"
            stroke={theme.palette.info.main}
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Requests/min"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default RouterPerformanceChart;
