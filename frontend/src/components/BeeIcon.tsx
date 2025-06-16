import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

/**
 * Simple bee SVG icon that follows MUI color/currentColor.
 */
const BeeIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    {/* Body */}
    <path d="M12 2a5 5 0 0 0-5 5v1h10V7a5 5 0 0 0-5-5z" />
    {/* Stripes */}
    <path d="M7 8h10v2H7zM7 12h10v2H7z" fillOpacity={0.6} />
    {/* Wings */}
    <path d="M5 7c-1.5 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3-1.5-3-3-3zm14 0c-1.5 0-3 1.5-3 3s1.5 3 3 3 3-1.5 3-3-1.5-3-3-3z" fillOpacity={0.3} />
    {/* Stinger */}
    <path d="M12 16l-1 4 1 .5 1-.5-1-4z" />
  </SvgIcon>
);

export default BeeIcon;
