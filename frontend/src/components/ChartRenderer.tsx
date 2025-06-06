import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Box, Typography } from '@mui/material';

export interface ChartSpec {
  id: string;
  chartType: 'bar' | 'line' | 'pie' | 'multiple';
  data: { label: string; value: number }[];
  options: { title: string; xAxis?: string; yAxis?: string; legend?: boolean };
}

interface ChartRendererProps {
  spec: ChartSpec;
}

const COLORS = ['#c8102e', '#A30D23', '#d32f2f', '#ef5350'];

const ChartRenderer: React.FC<ChartRendererProps> = ({ spec }) => {
  const renderChart = () => {
    switch (spec.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={spec.data} margin={{ top: 8, right: 20, bottom: 24, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" label={{ value: spec.options.xAxis, position: 'insideBottom', offset: -6 }} />
              <YAxis label={{ value: spec.options.yAxis, angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="value" fill="#c8102e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={spec.data} margin={{ top: 8, right: 20, bottom: 24, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" label={{ value: spec.options.xAxis, position: 'insideBottom', offset: -6 }} />
              <YAxis label={{ value: spec.options.yAxis, angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#c8102e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip />
              <Pie dataKey="value" data={spec.data} cx="50%" cy="50%" outerRadius={100} label>
                {spec.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      case 'multiple':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {spec.data.map((d, idx) => (
              <ResponsiveContainer width="100%" height={220} key={idx}>
                <BarChart data={[d]}>
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#c8102e" />
                </BarChart>
              </ResponsiveContainer>
            ))}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#c8102e' }}>{spec.options.title}</Typography>
      {renderChart()}
    </Box>
  );
};

export default ChartRenderer; 