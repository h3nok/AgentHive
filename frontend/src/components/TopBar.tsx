import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Chip,
  Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareIcon from '@mui/icons-material/Share';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BarChartIcon from '@mui/icons-material/BarChart';

interface TopBarProps {
  sessionTitle?: string;
  messageCount?: number;
  activeAgent?: string;
  onShare?: () => void;
  onBookmark?: () => void;
  onMoreActions?: () => void;
}

// Agent configurations matching the input component
const agentConfig = {
  lease: {
    name: "Enterprise Document Agent",
    icon: <InsertDriveFileOutlinedIcon />,
    color: "#C60C30", // barnRed
    emoji: "🚜"
  },
  general: {
    name: "Enterprise General Assistant", 
    icon: <SmartToyIcon />,
    color: "#1976d2",
    emoji: "🤖"
  },
  support: {
    name: "Enterprise Customer Support",
    icon: <PsychologyIcon />,
    color: "#2e7d32",
    emoji: "🛠️"
  },
  sales: {
    name: "Enterprise Sales Expert",
    icon: <BarChartIcon />,
    color: "#ed6c02",
    emoji: "💼"
  }
};

const TopBarContainer = styled(Box)(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 100,
  background: theme.palette.mode === 'dark'
    ? alpha('#121212', 0.85)
    : alpha('#fafafa', 0.85),
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Mobile responsiveness
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5, 1),
    minHeight: 48,
  },
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(1, 2),
    minHeight: 56,
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(1.5, 3),
    minHeight: 64,
  },
}));

const TopBar: React.FC<TopBarProps> = ({
  sessionTitle = "New Chat",
  messageCount = 0,
  activeAgent = "general",
  onShare,
  onBookmark,
  onMoreActions
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const currentAgent = agentConfig[activeAgent as keyof typeof agentConfig] || agentConfig.general;

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Default share behavior
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark();
    }
  };

  const handleMoreActions = () => {
    if (onMoreActions) {
      onMoreActions();
    }
  };

  return (
    <TopBarContainer role="banner" aria-label="Chat session header">        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 1, sm: 1.5 },
            maxWidth: 800, // Match center rail layout
            mx: 'auto',
            width: '100%',
            background:"transparent",
          }}
        >
        {/* Left section - Chat info */}
        <Box 
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}
          role="region"
          aria-label="Chat session information"
        >
          {/* Agent avatar */}
          <Avatar
            sx={{
              width: { xs: 28, sm: 32 },
              height: { xs: 28, sm: 32 },
              bgcolor: currentAgent.color,
              color: 'white',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
            aria-label={`${currentAgent.name} agent avatar`}
          >
            {currentAgent.icon}
          </Avatar>
          
          {/* Chat title and info */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: isDark ? '#FFFFFF' : '#1A1A1A',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2
              }}
            >
              {sessionTitle}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, mt: 0.25 }}>
              <Chip
                label={currentAgent.name}
                size="small"
                sx={{
                  height: { xs: 16, sm: 18 },
                  fontSize: { xs: '0.6rem', sm: '0.65rem' },
                  fontWeight: 500,
                  bgcolor: alpha(currentAgent.color, 0.1),
                  color: currentAgent.color,
                  border: `1px solid ${alpha(currentAgent.color, 0.2)}`,
                  '& .MuiChip-label': {
                    px: { xs: 0.5, sm: 0.75 },
                    display: { xs: 'none', sm: 'block' } // Hide agent name on very small screens
                  }
                }}
              />
              
              {messageCount > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    display: { xs: 'none', sm: 'block' } // Hide message count on very small screens
                  }}
                >
                  {messageCount} message{messageCount !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Right section - Action buttons */}
        <Box 
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          role="toolbar"
          aria-label="Chat actions"
        >
          <Tooltip title="Share conversation">
            <IconButton
              size="small"
              onClick={handleShare}
              aria-label="Share this conversation"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                '&:hover': {
                  bgcolor: alpha(currentAgent.color, 0.1),
                  color: currentAgent.color
                }
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Bookmark chat">
            <IconButton
              size="small"
              onClick={handleBookmark}
              aria-label="Bookmark this chat session"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                '&:hover': {
                  bgcolor: alpha(currentAgent.color, 0.1),
                  color: currentAgent.color
                }
              }}
            >
              <BookmarkBorderIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="More actions">
            <IconButton
              size="small"
              onClick={handleMoreActions}
              aria-label="Open more actions menu"
              sx={{
                color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                '&:hover': {
                  bgcolor: alpha(currentAgent.color, 0.1),
                  color: currentAgent.color
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </TopBarContainer>
  );
};

export default TopBar;
