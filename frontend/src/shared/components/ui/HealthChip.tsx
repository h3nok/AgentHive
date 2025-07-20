import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { 
  CheckCircle, 
  Warning, 
  Error, 
  CloudDownload,
  Pause
} from '@mui/icons-material';

/**
 * Health status types for connectors and services
 */
export type HealthStatus = 'healthy' | 'warning' | 'error' | 'not-installed' | 'paused';

/**
 * Props for the HealthChip component
 */
export interface HealthChipProps extends Omit<ChipProps, 'color' | 'icon'> {
  /** The health status to display */
  status: HealthStatus;
  /** Whether to show the status icon */
  showIcon?: boolean;
  /** Custom label override */
  label?: string;
}

/**
 * Get the appropriate color for a health status
 */
const getStatusColor = (status: HealthStatus): ChipProps['color'] => {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'not-installed':
    case 'paused':
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Get the appropriate icon for a health status
 */
const getStatusIcon = (status: HealthStatus): React.ReactElement | undefined => {
  switch (status) {
    case 'healthy':
      return <CheckCircle fontSize="small" />;
    case 'warning':
      return <Warning fontSize="small" />;
    case 'error':
      return <Error fontSize="small" />;
    case 'not-installed':
      return <CloudDownload fontSize="small" />;
    case 'paused':
      return <Pause fontSize="small" />;
    default:
      return undefined;
  }
};

/**
 * Get the display label for a health status
 */
const getStatusLabel = (status: HealthStatus): string => {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'warning':
      return 'Warning';
    case 'error':
      return 'Error';
    case 'not-installed':
      return 'Not Installed';
    case 'paused':
      return 'Paused';
    default:
      return status;
  }
};

/**
 * HealthChip component for displaying connector and service health status
 * 
 * @example
 * ```tsx
 * <HealthChip status="healthy" />
 * <HealthChip status="warning" showIcon />
 * <HealthChip status="error" label="Critical Error" />
 * ```
 */
export const HealthChip: React.FC<HealthChipProps> = ({
  status,
  showIcon = true,
  label,
  variant = 'outlined',
  size = 'small',
  ...props
}) => {
  const displayLabel = label || getStatusLabel(status);
  const color = getStatusColor(status);
  const icon = showIcon ? getStatusIcon(status) : undefined;

  return (
    <Chip
      label={displayLabel}
      color={color}
      variant={variant}
      size={size}
      icon={icon}
      {...props}
    />
  );
};

export default HealthChip;
