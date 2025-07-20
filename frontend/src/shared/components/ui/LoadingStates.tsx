/**
 * LoadingStates - Comprehensive loading state components for AgentHive
 * 
 * Provides skeleton loaders, spinners, and loading overlays with
 * honey-themed styling and smooth animations.
 */
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  CircularProgress,
  Typography,
  useTheme
} from '@mui/material';

/**
 * Props for ConnectorCardSkeleton component
 */
export interface ConnectorCardSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Whether to show in grid layout */
  inGrid?: boolean;
}

/**
 * Skeleton loader for connector cards
 * 
 * @example
 * ```tsx
 * <ConnectorCardSkeleton count={6} inGrid />
 * ```
 */
export const ConnectorCardSkeleton: React.FC<ConnectorCardSkeletonProps> = ({
  count = 1,
  inGrid = false
}) => {
  const theme = useTheme();

  const skeletonCard = (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg, rgba(45, 45, 45, 0.6) 0%, rgba(56, 56, 56, 0.6) 100%)'
          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(249, 250, 251, 0.8) 100%)',
        border: theme.palette.mode === 'dark'
          ? '1px solid rgba(251, 191, 36, 0.05)'
          : '1px solid rgba(245, 158, 11, 0.05)',
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header skeleton */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Skeleton 
            variant="circular" 
            width={40} 
            height={40}
            sx={{
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
            }}
          />
          <Box sx={{ flexGrow: 1, ml: 2 }}>
            <Skeleton 
              variant="text" 
              width="70%" 
              height={24}
              sx={{
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
              }}
            />
            <Skeleton 
              variant="text" 
              width="50%" 
              height={16}
              sx={{
                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(251, 191, 36, 0.08)'
                  : 'rgba(245, 158, 11, 0.08)',
              }}
            />
          </Box>
        </Box>

        {/* Description skeleton */}
        <Skeleton 
          variant="text" 
          width="100%" 
          height={16}
          sx={{ mb: 1, bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(251, 191, 36, 0.08)'
            : 'rgba(245, 158, 11, 0.08)',
          }}
        />
        <Skeleton 
          variant="text" 
          width="80%" 
          height={16}
          sx={{ mb: 2, bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(251, 191, 36, 0.08)'
            : 'rgba(245, 158, 11, 0.08)',
          }}
        />

        {/* Status and version skeleton */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Skeleton 
            variant="rounded" 
            width={60} 
            height={24}
            sx={{
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
            }}
          />
          <Skeleton 
            variant="rounded" 
            width={40} 
            height={24}
            sx={{
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.08)'
                : 'rgba(245, 158, 11, 0.08)',
            }}
          />
        </Box>

        {/* Metadata skeleton */}
        <Skeleton 
          variant="text" 
          width="60%" 
          height={12}
          sx={{
            bgcolor: theme.palette.mode === 'dark'
              ? 'rgba(251, 191, 36, 0.06)'
              : 'rgba(245, 158, 11, 0.06)',
          }}
        />
      </CardContent>

      {/* Actions skeleton */}
      <Box sx={{ p: 2, pt: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton 
            variant="rounded" 
            width="50%" 
            height={32}
            sx={{
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
            }}
          />
          <Skeleton 
            variant="rounded" 
            width="50%" 
            height={32}
            sx={{
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.08)'
                : 'rgba(245, 158, 11, 0.08)',
            }}
          />
        </Box>
      </Box>
    </Card>
  );

  if (inGrid) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 3
        }}
      >
        {Array.from({ length: count }, (_, index) => (
          <Box key={index}>
            {skeletonCard}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          {skeletonCard}
        </Box>
      ))}
    </>
  );
};

/**
 * Props for HoneySpinner component
 */
export interface HoneySpinnerProps {
  /** Size of the spinner */
  size?: number;
  /** Whether to show loading text */
  showText?: boolean;
  /** Custom loading text */
  text?: string;
  /** Whether to center the spinner */
  centered?: boolean;
}

/**
 * Honey-themed loading spinner
 * 
 * @example
 * ```tsx
 * <HoneySpinner size={40} showText text="Loading connectors..." />
 * ```
 */
export const HoneySpinner: React.FC<HoneySpinnerProps> = ({
  size = 32,
  showText = false,
  text = 'Loading...',
  centered = false
}) => {
  const theme = useTheme();

  const spinner = (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <CircularProgress
        size={size}
        thickness={4}
        sx={{
          color: theme.palette.mode === 'dark' ? '#fbbf24' : '#f59e0b',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
      {showText && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            fontWeight: 500,
            animation: 'pulse 1.5s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.6 },
            },
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );

  if (centered) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
        }}
      >
        {spinner}
      </Box>
    );
  }

  return spinner;
};

/**
 * Props for LoadingOverlay component
 */
export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  loading: boolean;
  /** Custom loading text */
  text?: string;
  /** Children to render behind the overlay */
  children: React.ReactNode;
  /** Blur intensity for backdrop */
  blurIntensity?: number;
}

/**
 * Loading overlay with glassmorphism effect
 * 
 * @example
 * ```tsx
 * <LoadingOverlay loading={isLoading} text="Saving connector...">
 *   <ConnectorForm />
 * </LoadingOverlay>
 * ```
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  text = 'Loading...',
  children,
  blurIntensity = 4
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ position: 'relative' }}>
      {children}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(45, 45, 45, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: `blur(${blurIntensity}px)`,
            borderRadius: 'inherit',
            zIndex: 1000,
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <HoneySpinner size={40} showText text={text} />
        </Box>
      )}
    </Box>
  );
};

/**
 * Props for DashboardCardSkeleton component
 */
export interface DashboardCardSkeletonProps {
  /** Height of the skeleton card */
  height?: number;
  /** Whether to show header skeleton */
  showHeader?: boolean;
  /** Number of content lines to show */
  contentLines?: number;
}

/**
 * Skeleton loader for dashboard cards
 * 
 * @example
 * ```tsx
 * <DashboardCardSkeleton height={200} showHeader contentLines={3} />
 * ```
 */
export const DashboardCardSkeleton: React.FC<DashboardCardSkeletonProps> = ({
  height = 150,
  showHeader = true,
  contentLines = 2
}) => {
  const theme = useTheme();

  return (
    <Card 
      sx={{ 
        height,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg, rgba(45, 45, 45, 0.6) 0%, rgba(56, 56, 56, 0.6) 100%)'
          : 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(249, 250, 251, 0.8) 100%)',
        border: theme.palette.mode === 'dark'
          ? '1px solid rgba(251, 191, 36, 0.05)'
          : '1px solid rgba(245, 158, 11, 0.05)',
      }}
    >
      <CardContent>
        {showHeader && (
          <Skeleton 
            variant="text" 
            width="40%" 
            height={24}
            sx={{ 
              mb: 2,
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
            }}
          />
        )}
        {Array.from({ length: contentLines }, (_, index) => (
          <Skeleton 
            key={index}
            variant="text" 
            width={index === contentLines - 1 ? '60%' : '100%'} 
            height={16}
            sx={{ 
              mb: 1,
              bgcolor: theme.palette.mode === 'dark'
                ? 'rgba(251, 191, 36, 0.08)'
                : 'rgba(245, 158, 11, 0.08)',
            }}
          />
        ))}
      </CardContent>
    </Card>
  );
};
