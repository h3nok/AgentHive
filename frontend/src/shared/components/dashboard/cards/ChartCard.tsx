import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';

export interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  description?: string;
  height?: number | string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  children,
  description,
  height = '100%',
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: description ? 0.5 : 0,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.8rem',
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {/* Chart Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
          borderRadius: 2,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.5)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ChartCard;
