import { useState, MouseEvent } from 'react';

/**
 * useMenuAnchor - a small convenience hook to manage anchorEl/open pairs that
 * are common when working with Material-UI <Menu> components.
 *
 * Usage:
 *   const {
 *     anchorEl,
 *     open,
 *     handleOpen,
 *     handleClose,
 *   } = useMenuAnchor();
 */
export default function useMenuAnchor<T extends HTMLElement = HTMLElement>() {
  const [anchorEl, setAnchorEl] = useState<T | null>(null);

  const handleOpen = (event: MouseEvent<T>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return {
    anchorEl,
    open: Boolean(anchorEl),
    handleOpen,
    handleClose,
  } as const;
} 