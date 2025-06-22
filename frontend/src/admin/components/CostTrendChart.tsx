import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCostLatency } from '../hooks/useCostLatency';
import { Paper, Typography, useTheme } from '@mui/material';
import { swarmColors } from '../../theme';

const CostTrendChart: React.FC = () => {
  const theme = useTheme();
  const { data = [] } = useCostLatency();

  const tickFormatter = (ts: number) => `${new Date(ts * 1000).getHours()}:00`;

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }} elevation={3}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Cost ($) Over Time
      </Typography>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={swarmColors.idle} stopOpacity={0.2} />
              <stop offset="95%" stopColor={swarmColors.idle} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="ts" tickFormatter={tickFormatter} stroke={theme.palette.text.secondary} />
          <YAxis stroke={theme.palette.text.secondary} />
          <Tooltip labelFormatter={(v) => new Date((v as number) * 1000).toLocaleString()} />
          <Legend />
          <Area
            type="monotone"
            dataKey="cost"
            stroke={swarmColors.idle}
            fill="url(#costGrad)"
            name="Cost ($)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default CostTrendChart;
