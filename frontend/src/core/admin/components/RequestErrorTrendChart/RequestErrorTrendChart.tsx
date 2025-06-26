import React from 'react';
import { Line, Area, AreaChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRequestErrorTrends } from '../../hooks/useRequestErrorTrends';
import { Paper, Typography, useTheme } from '@mui/material';
import { swarmColors } from '../../../theme';

const RequestErrorTrendChart: React.FC = () => {
  const theme = useTheme();
  const { data = [] } = useRequestErrorTrends();

  const tickFormatter = (ts: number) => `${new Date(ts * 1000).getHours()}:00`;

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }} elevation={3}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Requests vs Errors (per hr)
      </Typography>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.palette.error.main} stopOpacity={0.1} />
              <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="ts" tickFormatter={tickFormatter} stroke={theme.palette.text.secondary} />
          <YAxis stroke={theme.palette.text.secondary} />
          <Tooltip labelFormatter={(v) => new Date((v as number) * 1000).toLocaleString()} />
          <Legend />
          <Area type="monotone" dataKey="requests" stroke={theme.palette.error.main} fill="url(#reqGrad)" name="Requests" />
          <Line type="monotone" dataKey="errors" stroke={theme.palette.warning.main} name="Errors" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default RequestErrorTrendChart;
