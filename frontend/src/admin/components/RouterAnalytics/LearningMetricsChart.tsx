import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RouterMetrics } from '../../../features/router/routerAnalyticsApi';

interface LearningMetricsChartProps {
  data?: RouterMetrics;
  timeRange: string;
}

const LearningMetricsChart: React.FC<LearningMetricsChartProps> = ({ data, timeRange }) => {
  const theme = useTheme();

  // Generate learning metrics time series data
  const generateLearningData = () => {
    if (!data) return [];

    const now = new Date();
    const intervals = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const timeUnit = timeRange === '1h' ? 5 : timeRange === '24h' ? 60 : timeRange === '7d' ? 1440 : 1440;

    return Array.from({ length: intervals }, (_, i) => {
      const timestamp = new Date(now.getTime() - (intervals - 1 - i) * timeUnit * 60000);
      const baseLearningAccuracy = data.learning_metrics?.success_rate || 0.75;
      const baseAdaptationRate = 0.85;
      
      // Simulate learning progression with some variance
      const progressionFactor = i / intervals; // Learning improves over time
      const variance = (Math.random() - 0.5) * 0.1;
      
      const learningAccuracy = Math.max(0.5, Math.min(1, 
        baseLearningAccuracy + progressionFactor * 0.2 + variance
      )) * 100;
      
      const adaptationRate = Math.max(0.5, Math.min(1, 
        baseAdaptationRate + progressionFactor * 0.1 + variance
      )) * 100;

      const modelConfidence = Math.max(60, Math.min(100, 
        80 + progressionFactor * 15 + variance * 50
      ));

      return {
        time: timeRange === '7d' || timeRange === '30d' 
          ? timestamp.toLocaleDateString() 
          : timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        learningAccuracy,
        adaptationRate,
        modelConfidence,
        trainingDataPoints: Math.floor(100 + i * 50 + Math.random() * 100),
      };
    });
  };

  const chartData = generateLearningData();

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey="time" 
            stroke={theme.palette.text.secondary}
            fontSize={12}
          />
          <YAxis 
            stroke={theme.palette.text.secondary}
            fontSize={12}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
            }}
            formatter={(value: number, name: string) => [
              name.includes('Points') ? value : `${value.toFixed(1)}%`,
              name
            ]}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="learningAccuracy"
            stackId="1"
            stroke={theme.palette.primary.main}
            fill={theme.palette.primary.main}
            fillOpacity={0.3}
            name="Learning Accuracy"
          />
          <Area
            type="monotone"
            dataKey="adaptationRate"
            stackId="2"
            stroke={theme.palette.secondary.main}
            fill={theme.palette.secondary.main}
            fillOpacity={0.3}
            name="Adaptation Rate"
          />
          <Area
            type="monotone"
            dataKey="modelConfidence"
            stackId="3"
            stroke={theme.palette.success.main}
            fill={theme.palette.success.main}
            fillOpacity={0.3}
            name="Model Confidence"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default LearningMetricsChart;
