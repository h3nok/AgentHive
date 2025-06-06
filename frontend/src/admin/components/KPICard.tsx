import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import CountUp from 'react-countup';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface KPICardProps {
  title: string;
  value: number | string;
  delta?: number;
  unit?: string;
  trendDir?: 'up' | 'down';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, delta, unit, trendDir }) => {
  const theme = useTheme();
  const isNumericValue = typeof value === 'number';

  return (
    <Paper 
      variant="outlined"
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
        <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
          {isNumericValue ? (
            <CountUp end={value as number} duration={1.5} separator="," />
          ) : (
            value
          )}
          {unit && <Typography variant="h6" component="span" sx={{ ml: 0.5, fontWeight: 500, color: theme.palette.text.secondary }}>{unit}</Typography>}
        </Typography>
      </Box>
      {delta !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {trendDir === 'up' ? 
            <ArrowUpwardIcon sx={{ color: theme.palette.success.main, fontSize: '1rem', mr: 0.5 }} /> : 
            <ArrowDownwardIcon sx={{ color: theme.palette.error.main, fontSize: '1rem', mr: 0.5 }} />
          }
          <Typography variant="caption" sx={{ color: trendDir === 'up' ? theme.palette.success.main : theme.palette.error.main, fontWeight: 600 }}>
            {delta > 0 ? `+${delta}` : delta}%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            vs last period
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default KPICard; 