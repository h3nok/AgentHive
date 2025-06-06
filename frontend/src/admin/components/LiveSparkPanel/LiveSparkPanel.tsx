import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Box, Typography, useTheme, Stack, Paper } from '@mui/material';
import { useCostLatency, SparkPoint } from '../../hooks/useCostLatency';

const Spark: React.FC<{ dataKey: keyof SparkPoint; color: string; data: SparkPoint[] }> = ({ dataKey, color, data }) => (
  <ResponsiveContainer width="100%" height={40}>
    <LineChart data={data} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
      <Line
        type="monotone"
        dataKey={dataKey}
        stroke={color}
        strokeWidth={2}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

const LiveSparkPanel: React.FC = () => {
  const theme = useTheme();
  const { data = [] } = useCostLatency();

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(0,0,0,0.04) 30px), repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(0,0,0,0.04) 30px)',
        backgroundSize: '30px 30px',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Box flex={1}>
          <Typography variant="subtitle2">Cost ($)</Typography>
          <Spark dataKey="cost" color={theme.palette.success.main} data={data} />
        </Box>
        <Box flex={1}>
          <Typography variant="subtitle2">Latency (ms)</Typography>
          <Spark dataKey="latency" color={theme.palette.warning.main} data={data} />
        </Box>
        <Box flex={1}>
          <Typography variant="subtitle2">Throughput (req/s)</Typography>
          <Spark dataKey="throughput" color={theme.palette.info.main} data={data} />
        </Box>
      </Stack>
    </Paper>
  );
};

export default LiveSparkPanel;
