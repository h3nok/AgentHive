import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const TractorIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        d="M4 18.5c0-1.38 1.12-2.5 2.5-2.5S9 17.12 9 18.5 7.88 21 6.5 21 4 19.88 4 18.5zm13 0c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5zM18 13V9c0-.55-.45-1-1-1h-2V6c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v2H5c-.55 0-1 .45-1 1v4H2c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h1.46c.34-1.37 1.54-2.4 2.97-2.5H18.57c1.43.1 2.63 1.13 2.97 2.5H23c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1h-2zm-8-5h4v2h-4V8z"
        fill="currentColor"
      />
    </SvgIcon>
  );
};

export default TractorIcon; 