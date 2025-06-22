import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const BeeIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 2C10.9 2 10 2.9 10 4s.9 2 2 2 2-.9 2-2-.9-2-2-2zm8 7h-2.5c-.4 0-.8.2-1 .5L15 12l1.5 2.5c.2.3.6.5 1 .5H20c1.1 0 2-.9 2-2s-.9-2-2-2zM4 9h2.5c.4 0 .8.2 1 .5L9 12 7.5 14.5c-.2.3-.6.5-1 .5H4c-1.1 0-2-.9-2-2s.9-2 2-2zm8 1c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </SvgIcon>
  );
};

export default BeeIcon;
