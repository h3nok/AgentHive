import React from 'react';
import { 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemText, 
  Tooltip,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import ShareIcon from '@mui/icons-material/Share';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { usePopperAnchor } from '../hooks/usePopperAnchor';

interface BubbleActionsProps {
  anchorEl?: HTMLElement | null;
  onCopy?: () => void;
  onRerun?: () => void;
  onShare?: () => void;
  onOpenCanvas?: () => void;
  isUser?: boolean;
}

const BubbleActions: React.FC<BubbleActionsProps> = ({
  anchorEl,
  onCopy,
  onRerun,
  onShare,
  onOpenCanvas,
  isUser = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { 
    anchorEl: menuAnchor, 
    handleOpen, 
    handleClose, 
    isOpen 
  } = usePopperAnchor();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    handleOpen(event);
  };

  const handleMenuClose = () => {
    handleClose();
  };

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleMenuClose();
    }
  };

  if (!anchorEl) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: -36,
        right: isUser ? 0 : 'auto',
        left: isUser ? 'auto' : 0,
        display: 'flex',
        alignItems: 'center',
        bgcolor: isDark 
          ? alpha('#1A1A1A', 0.95)
          : alpha('#FFFFFF', 0.95),
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 2,
        py: 0.5,
        px: 1,
        boxShadow: isDark
          ? '0 8px 24px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(198, 12, 48, 0.15)',
        border: `1px solid ${isDark 
          ? 'rgba(244, 246, 248, 0.1)'
          : 'rgba(198, 12, 48, 0.1)'
        }`,
        zIndex: 1000,
        opacity: 0,
        transform: 'translateY(4px)',
        animation: 'slideIn 0.2s ease-out forwards',
        '@keyframes slideIn': {
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        '& .MuiIconButton-root': {
          padding: 0.5,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            bgcolor: isDark 
              ? 'rgba(244, 246, 248, 0.1)'
              : 'rgba(198, 12, 48, 0.1)',
          },
        },
      }}
      role="toolbar"
      aria-label="Message actions"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Copy button */}
      {onCopy && (
        <Tooltip title="Copy message" placement="top">
          <IconButton
            size="small"
            onClick={() => handleAction(onCopy)}
            aria-label="Copy message text"
            sx={{
              color: isDark ? '#F4F6F8' : '#C60C30',
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Rerun button - only for user messages */}
      {isUser && onRerun && (
        <Tooltip title="Rerun message" placement="top">
          <IconButton
            size="small"
            onClick={() => handleAction(onRerun)}
            aria-label="Rerun this message"
            sx={{
              color: isDark ? '#F4F6F8' : '#C60C30',
            }}
          >
            <ReplayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Share button */}
      {onShare && (
        <Tooltip title="Share message" placement="top">
          <IconButton
            size="small"
            onClick={() => handleAction(onShare)}
            aria-label="Share this message"
            sx={{
              color: isDark ? '#F4F6F8' : '#C60C30',
            }}
          >
            <ShareIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Open in canvas - only for assistant messages */}
      {!isUser && onOpenCanvas && (
        <Tooltip title="Open in canvas" placement="top">
          <IconButton
            size="small"
            onClick={() => handleAction(onOpenCanvas)}
            aria-label="Open message in canvas"
            sx={{
              color: isDark ? '#F4F6F8' : '#C60C30',
            }}
          >
            <OpenInNewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* More actions menu */}
      <Tooltip title="More actions" placement="top">
        <IconButton
          size="small"
          onClick={handleMenuOpen}
          aria-label="Open more actions menu"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          sx={{
            color: isDark ? '#F4F6F8' : '#C60C30',
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Dropdown menu for additional actions */}
      <Menu
        anchorEl={menuAnchor}
        open={isOpen}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            bgcolor: isDark 
              ? alpha('#1A1A1A', 0.95)
              : alpha('#FFFFFF', 0.95),
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${isDark 
              ? 'rgba(244, 246, 248, 0.1)'
              : 'rgba(198, 12, 48, 0.1)'
            }`,
            borderRadius: 2,
            mt: 1,
            '& .MuiMenuItem-root': {
              borderRadius: 1,
              mx: 0.5,
              my: 0.25,
              '&:hover': {
                bgcolor: isDark 
                  ? 'rgba(244, 246, 248, 0.1)'
                  : 'rgba(198, 12, 48, 0.1)',
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleAction(() => console.log('Edit message'))}>
          <ListItemText>Edit message</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(() => console.log('Pin message'))}>
          <ListItemText>Pin message</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction(() => console.log('Delete message'))}>
          <ListItemText>Delete message</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default BubbleActions;
