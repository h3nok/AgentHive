import React from 'react';
import { Avatar, SvgIcon, SvgIconProps } from '@mui/material';
import {
  Business,
  AccountBalance,
  Support,
  ContactPhone,
  Inventory,
  CloudQueue,
  Api,
  Storage,
  Security,
  Analytics
} from '@mui/icons-material';

/**
 * Connector category types
 */
export type ConnectorCategory = 'hr' | 'finance' | 'itsm' | 'crm' | 'erp' | 'cloud' | 'api' | 'database' | 'security' | 'analytics';

/**
 * Props for the ConnectorIcon component
 */
export interface ConnectorIconProps {
  /** The connector category or custom icon URL */
  category?: ConnectorCategory;
  /** Custom icon URL or base64 image */
  iconUrl?: string;
  /** Fallback text for avatar (usually first letter of connector name) */
  fallbackText?: string;
  /** Size of the icon */
  size?: number;
  /** Whether to show as circular avatar or square icon */
  variant?: 'circular' | 'square';
  /** Additional CSS class name */
  className?: string;
}

/**
 * Get the appropriate Material-UI icon for a connector category
 */
const getCategoryIcon = (category: ConnectorCategory): React.ComponentType<SvgIconProps> => {
  switch (category) {
    case 'hr':
      return Business;
    case 'finance':
      return AccountBalance;
    case 'itsm':
      return Support;
    case 'crm':
      return ContactPhone;
    case 'erp':
      return Inventory;
    case 'cloud':
      return CloudQueue;
    case 'api':
      return Api;
    case 'database':
      return Storage;
    case 'security':
      return Security;
    case 'analytics':
      return Analytics;
    default:
      return Api;
  }
};

/**
 * Get the appropriate color for a connector category
 */
const getCategoryColor = (category: ConnectorCategory): string => {
  const colors: Record<ConnectorCategory, string> = {
    hr: '#FF6B6B',
    finance: '#4ECDC4',
    itsm: '#45B7D1',
    crm: '#96CEB4',
    erp: '#FFEAA7',
    cloud: '#A8E6CF',
    api: '#FFD93D',
    database: '#6C5CE7',
    security: '#FD79A8',
    analytics: '#FDCB6E'
  };
  return colors[category] || '#BDC3C7';
};

/**
 * ConnectorIcon component for displaying connector type icons
 * 
 * @example
 * ```tsx
 * <ConnectorIcon category="hr" />
 * <ConnectorIcon iconUrl="https://example.com/logo.png" fallbackText="W" />
 * <ConnectorIcon category="finance" size={48} variant="square" />
 * ```
 */
export const ConnectorIcon: React.FC<ConnectorIconProps> = ({
  category,
  iconUrl,
  fallbackText,
  size = 40,
  variant = 'circular',
  className
}) => {
  // If custom icon URL is provided, use it
  if (iconUrl) {
    return (
      <Avatar
        src={iconUrl}
        alt={fallbackText || 'Connector'}
        variant={variant}
        className={className}
        sx={{
          width: size,
          height: size,
          bgcolor: category ? getCategoryColor(category) : 'grey.400'
        }}
      >
        {fallbackText?.charAt(0).toUpperCase()}
      </Avatar>
    );
  }

  // If category is provided, use category icon
  if (category) {
    const IconComponent = getCategoryIcon(category);
    const categoryColor = getCategoryColor(category);

    if (variant === 'circular') {
      return (
        <Avatar
          variant="circular"
          className={className}
          sx={{
            width: size,
            height: size,
            bgcolor: categoryColor,
            color: 'white'
          }}
        >
          <IconComponent sx={{ fontSize: size * 0.6 }} />
        </Avatar>
      );
    }

    return (
      <SvgIcon
        component={IconComponent}
        className={className}
        sx={{
          fontSize: size,
          color: categoryColor
        }}
      />
    );
  }

  // Fallback to text avatar
  return (
    <Avatar
      variant={variant}
      className={className}
      sx={{
        width: size,
        height: size,
        bgcolor: 'grey.400'
      }}
    >
      {fallbackText?.charAt(0).toUpperCase() || '?'}
    </Avatar>
  );
};

export default ConnectorIcon;
