import { useState } from 'react';

export const usePopperAnchor = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isOpen = Boolean(anchorEl);

  return {
    anchorEl,
    setAnchorEl,
    handleOpen,
    handleClose,
    isOpen,
  };
};
