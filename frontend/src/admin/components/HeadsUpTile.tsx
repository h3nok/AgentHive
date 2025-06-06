import React from 'react';
import { Card, CardContent, Typography, Box, Slide, useTheme } from '@mui/material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

export interface HeadsUpForecast {
  kpi: string;
  daysToBudget: number;
}

interface Props {
  forecast: HeadsUpForecast | null;
}

/**
 * HeadsUpTile – predictive warning for key KPIs (e.g. token spend).
 * Slides in from the right when `forecast` triggers. Caller controls mount.
 */
const HeadsUpTile: React.FC<Props> = ({ forecast }) => {
  const theme = useTheme();
  if (!forecast) return null;

  const { kpi, daysToBudget } = forecast;
  const show = daysToBudget <= 3;

  return (
    <Slide direction="left" in={show} mountOnEnter unmountOnExit timeout={400}>
      <Card
        elevation={4}
        sx={{
          minWidth: 220,
          bgcolor: theme.palette.warning.light,
          color: theme.palette.warning.contrastText,
          borderLeft: `6px solid ${theme.palette.warning.main}`,
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningAmberOutlinedIcon sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Heads-Up!
            </Typography>
            <Typography variant="body2">
              {kpi === 'token_spend'
                ? `Token budget exhausted in ~${daysToBudget} day${daysToBudget === 1 ? '' : 's'}`
                : `${kpi} at risk in ${daysToBudget}d`}
            </Typography>
            <Typography
              variant="button"
              sx={{ mt: 1, display: 'inline-block', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Switch to GPT-3.5
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Slide>
  );
};

export default HeadsUpTile;
