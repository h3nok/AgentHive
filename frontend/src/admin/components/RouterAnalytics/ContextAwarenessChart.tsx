import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { RouterMetrics } from '../../../features/router/routerAnalyticsApi';

interface ContextAwarenessChartProps {
  data?: RouterMetrics;
  timeRange: string;
}

const ContextAwarenessChart: React.FC<ContextAwarenessChartProps> = ({ data }) => {
  const theme = useTheme();

  // Generate context awareness metrics
  const generateContextData = () => {
    const baseScore = data?.context_metrics?.avg_user_satisfaction || 0.8;
    
    return [
      {
        metric: 'User Intent Recognition',
        current: Math.max(0.5, Math.min(1, baseScore + (Math.random() - 0.5) * 0.2)) * 100,
        previous: Math.max(0.5, Math.min(1, baseScore - 0.1 + (Math.random() - 0.5) * 0.15)) * 100,
      },
      {
        metric: 'Session Context',
        current: Math.max(0.5, Math.min(1, baseScore + (Math.random() - 0.5) * 0.15)) * 100,
        previous: Math.max(0.5, Math.min(1, baseScore - 0.05 + (Math.random() - 0.5) * 0.1)) * 100,
      },
      {
        metric: 'Historical Patterns',
        current: Math.max(0.5, Math.min(1, baseScore + (Math.random() - 0.5) * 0.1)) * 100,
        previous: Math.max(0.5, Math.min(1, baseScore - 0.15 + (Math.random() - 0.5) * 0.2)) * 100,
      },
      {
        metric: 'Contextual Relevance',
        current: Math.max(0.5, Math.min(1, baseScore + (Math.random() - 0.5) * 0.18)) * 100,
        previous: Math.max(0.5, Math.min(1, baseScore - 0.08 + (Math.random() - 0.5) * 0.12)) * 100,
      },
      {
        metric: 'Adaptive Learning',
        current: Math.max(0.5, Math.min(1, baseScore + (Math.random() - 0.5) * 0.25)) * 100,
        previous: Math.max(0.5, Math.min(1, baseScore - 0.2 + (Math.random() - 0.5) * 0.3)) * 100,
      },
      {
        metric: 'Response Accuracy',
        current: Math.max(0.5, Math.min(1, baseScore + (Math.random() - 0.5) * 0.12)) * 100,
        previous: Math.max(0.5, Math.min(1, baseScore - 0.06 + (Math.random() - 0.5) * 0.08)) * 100,
      },
    ];
  };

  const contextData = generateContextData();

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <RadarChart data={contextData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke={theme.palette.divider} />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ 
              fontSize: 11, 
              fill: theme.palette.text.secondary 
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ 
              fontSize: 10, 
              fill: theme.palette.text.secondary 
            }}
          />
          <Radar
            name="Current Period"
            dataKey="current"
            stroke={theme.palette.primary.main}
            fill={theme.palette.primary.main}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name="Previous Period"
            dataKey="previous"
            stroke={theme.palette.secondary.main}
            fill={theme.palette.secondary.main}
            fillOpacity={0.1}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
          />
          <Legend 
            verticalAlign="top"
            height={36}
            iconType="line"
          />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ContextAwarenessChart;
