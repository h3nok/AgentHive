import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Paper, Typography, useTheme, Box } from '@mui/material';
import { useUsageTrends } from '../../hooks/useUsageTrends';

const UsageTrendChart: React.FC = () => {
  const theme = useTheme();
  const { data = [] } = useUsageTrends();

  const tickFormatter = (ts: number) => `${new Date(ts * 1000).getHours()}:00`;

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }} elevation={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Azure & ChatGPT Usage (tokens/hr)
        </Typography>
      </Box>
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="azureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="chatGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8} />
              <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="ts" tickFormatter={tickFormatter} stroke={theme.palette.text.secondary} />
          <YAxis stroke={theme.palette.text.secondary} />
          <Tooltip labelFormatter={(v) => new Date((v as number) * 1000).toLocaleString()} />
          <Legend />
          <Area type="monotone" dataKey="azure" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#azureGradient)" name="Azure Foundry" />
          <Area type="monotone" dataKey="chatgpt" stroke={theme.palette.secondary.main} fillOpacity={1} fill="url(#chatGradient)" name="ChatGPT" />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default UsageTrendChart;
