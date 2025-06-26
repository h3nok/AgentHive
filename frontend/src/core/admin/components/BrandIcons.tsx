import React from 'react';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

// Simple triangular Azure logo
export const AzureIcon: React.FC<SvgIconProps> = props => (
  <SvgIcon viewBox="0 0 256 256" {...props}>
    <path d="M0 256L128 0l128 256H0z" fill="#0078D4" />
  </SvgIcon>
);

// Minimal ChatGPT swirl (monochrome)
export const ChatGPTIcon: React.FC<SvgIconProps> = props => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path
      fill="#10A37F"
      d="M12 2a6.5 6.5 0 00-5.18 10.47A6.5 6.5 0 1012 2zm0 18.4a5.9 5.9 0 01-4.71-9.46 5.9 5.9 0 119.42 7.42A5.86 5.86 0 0112 20.4z"
    />
  </SvgIcon>
);
