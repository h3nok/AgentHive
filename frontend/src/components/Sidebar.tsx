import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  List, 
  ListItemIcon, 
  ListItemText, 
  useTheme, 
  Drawer, 
  Button, 
  IconButton, 
  Tooltip, 
  Typography, 
  ListItemButton,
  Menu,
  MenuItem,
  Divider,
  Collapse,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Badge,
  CircularProgress
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import FolderIcon from '@mui/icons-material/Folder';
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import LogoText from './LogoText';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setActiveSession, 
  moveSessionToFolder,
  createFolder,
  updateFolderName,
  deleteFolder,
  updateSessionTitle,
  clearSessionMessages
} from '../features/chat/chatSlice';
import { RootState } from '../store';
import { keyframes } from '@emotion/react';
import useMenuAnchor from '../hooks/useMenuAnchor';
import { useListSessionsQuery as useListSessionsQueryApi } from '../features/chat/sessionsApi';
import { useCreateSessionMutation, useUpdateSessionMutation, useDeleteSessionMutation } from '../features/chat/sessionsApi';
import Skeleton from '@mui/material/Skeleton';
import { alpha } from '@mui/material/styles';
import { Resizable } from 're-resizable';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarCollapseArrow from './SidebarCollapseArrow';

// Create a styled Drawer component to override theme defaults
const StyledDrawer = styled(Drawer)(() => ({
  '& .MuiDrawer-paper': {
    background: 'transparent',
    backgroundImage: 'none !important',
    transition: 'width 0.3s ease-in-out',
  }
}));

// Define a fade-in animation
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Define a subtle bounce animation
const subtleBounce = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
  100% { transform: translateY(0); }
`;

// Define a subtle glow animation for active items
const activeGlow = keyframes`
  0% { box-shadow: 0 0 0 rgba(244, 67, 54, 0); }
  50% { box-shadow: 0 0 8px rgba(244, 67, 54, 0.3); }
  100% { box-shadow: 0 0 0 rgba(244, 67, 54, 0); }
`;

// Styled Dialog component that respects the current theme
const ThemedDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff', // TSC theme colors
    boxShadow: 'none', // Remove box shadow
    borderRadius: theme.shape.borderRadius,
    border: theme.palette.mode === 'dark'
      ? '1px solid rgba(200, 16, 46, 0.2)'
      : '1px solid rgba(200, 16, 46, 0.1)',
  },
  '& .MuiDialogTitle-root': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(200, 16, 46, 0.1)' // Dark red tint for dark mode
      : 'rgba(200, 16, 46, 0.05)', // Light red tint for light mode
    borderBottom: `1px solid ${theme.palette.mode === 'dark' 
      ? 'rgba(200, 16, 46, 0.2)' 
      : 'rgba(200, 16, 46, 0.1)'}`
  },
  '& .MuiButton-containedPrimary': {
    backgroundColor: '#f59e0b', // Enterprise amber color
    '&:hover': {
      backgroundColor: '#d97706', // Darker Enterprise amber for hover
    }
  }
}));

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Fetch sessions from API
  const { data: sessionsData, isLoading: isLoadingSessions } = useListSessionsQueryApi();
  
  // Transform API data to match expected format
  const transformedSessions = sessionsData?.map(session => ({
    id: session.session_id,
    title: session.title || `Chat ${new Date().toLocaleDateString()}`,
    messages: [], // Will be populated when session is selected
    createdAt: session.updated_at,
    updatedAt: session.updated_at,
    folderId: 'default', // Default folder for now
    pinned: session.pinned || false,
  })) || [];
  
  const sessions = transformedSessions;
  const folders = useSelector((state: RootState) => state.chat.folders);
  const activeSessionId = useSelector((state: RootState) => state.chat.activeSessionId);
  
  // Ensure default folder exists
  React.useEffect(() => {
    if (folders.length === 0) {
      dispatch(createFolder("Default"));
    }
  }, [folders.length, dispatch]);
  
  // Hover state for expand on hover
  const [isHovered, setIsHovered] = useState(false);
  const [showCollapseButton, setShowCollapseButton] = useState(false);
  
  // Load saved drawer width and collapse state from localStorage
  const defaultWidth = 260;
  const savedWidth = localStorage.getItem('drawerWidth');
  const savedCollapsed = localStorage.getItem('drawerCollapsed') === 'true';
  const [drawerWidth, setDrawerWidth] = useState(savedWidth ? parseInt(savedWidth) : defaultWidth);
  
  // Initialize collapse state from localStorage on mount
  useEffect(() => {
    if (savedCollapsed !== isCollapsed) {
      toggleSidebar();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
  
  // Save drawer width to localStorage when it changes
  useEffect(() => {
    if (!isCollapsed) {
      localStorage.setItem('drawerWidth', drawerWidth.toString());
    }
  }, [drawerWidth, isCollapsed]);
  
  // Save collapse state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('drawerCollapsed', isCollapsed.toString());
  }, [isCollapsed]);
  
  // For handling folder dropdowns
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(
    folders.reduce((acc, folder) => ({ ...acc, [folder.id]: true }), {})
  );

  // For folder menu interactions
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderEditDialogOpen, setFolderEditDialogOpen] = useState<boolean>(false);
  const [folderDeleteDialogOpen, setFolderDeleteDialogOpen] = useState<boolean>(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [folderDeleteError, setFolderDeleteError] = useState<string | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState<boolean>(false);

  // For handling the session actions menu
  const { anchorEl: sessionMenuAnchorEl, handleOpen: openSessionMenuAnchor, handleClose: closeSessionMenuAnchor } = useMenuAnchor<HTMLElement>();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // For handling folder actions menu
  const { anchorEl: folderMenuAnchorEl, handleOpen: openFolderMenuAnchor, handleClose: closeFolderMenuAnchor } = useMenuAnchor<HTMLElement>();
  
  // Add state for the move folder submenu
  const { anchorEl: moveFolderMenuAnchorEl, handleOpen: openMoveFolderMenuAnchor, handleClose: closeMoveFolderMenuAnchor } = useMenuAnchor<HTMLElement>();
  
  // Backend hooks
  const { isLoading: sessionsLoading } = useListSessionsQueryApi();
  const [createSession] = useCreateSessionMutation();
  const [updateSessionApi] = useUpdateSessionMutation();
  const [deleteSessionApi] = useDeleteSessionMutation();
  
  // Session menu handlers
  const handleSessionMenuOpen = (event: React.MouseEvent<HTMLElement>, sessionId: string) => {
    openSessionMenuAnchor(event);
    setSelectedSessionId(sessionId);
  };
  
  const handleSessionMenuClose = () => {
    closeSessionMenuAnchor();
    setSelectedSessionId(null);
  };
  
  // Folder menu handlers
  const handleFolderMenuOpen = (event: React.MouseEvent<HTMLElement>, folderId: string) => {
    openFolderMenuAnchor(event);
    setSelectedFolderId(folderId);
  };
  
  const handleFolderMenuClose = () => {
    closeFolderMenuAnchor();
    setSelectedFolderId(null);
  };
  
  // Handler for opening the move folder submenu
  const handleMoveFolderMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    openMoveFolderMenuAnchor(event);
  };
  
  // Handler for closing the move folder submenu
  const handleMoveFolderMenuClose = closeMoveFolderMenuAnchor;
  
  // Handler for moving all chats from one folder to another
  const handleMoveAllChats = (targetFolderId: string) => {
    if (selectedFolderId && targetFolderId !== selectedFolderId) {
      // Get all sessions in the selected folder
      const sessionsToMove = sessions.filter(session => session.folderId === selectedFolderId);
      
      // Move each session to the target folder
      sessionsToMove.forEach(session => {
        dispatch(moveSessionToFolder({ sessionId: session.id, folderId: targetFolderId }));
      });
      
      // Close both menus
      handleMoveFolderMenuClose();
      handleFolderMenuClose();
    }
  };
  
  // Session actions
  const handleDeleteSession = async () => {
    if (selectedSessionId) {
      try {
        // Close the menu immediately to prevent multiple clicks
        handleSessionMenuClose();
        // Show some loading indication if needed here
        
        // Wait for the delete operation to complete
        await deleteSessionApi(selectedSessionId).unwrap();
        
        // Optional: navigate away if currently viewing the deleted session
        if (activeSessionId === selectedSessionId) {
          navigate('/chat');
          // Use empty string instead of null since setActiveSession expects a string
          dispatch(setActiveSession(''));
        }
      } catch (error) {
        console.error('Failed to delete session:', error);
        // Consider showing an error message to the user
      }
    }
  };
  
  const handleMoveToFolder = (folderId: string) => {
    if (selectedSessionId) {
      dispatch(moveSessionToFolder({ sessionId: selectedSessionId, folderId }));
      handleSessionMenuClose();
    }
  };
  
  const handleTogglePinned = () => {
    if (selectedSessionId) {
      const sess = sessions.find(s=>s.id===selectedSessionId);
      if(sess){
        updateSessionApi({id:selectedSessionId, changes:{pinned: !sess.pinned}});
      }
      handleSessionMenuClose();
    }
  };
  
  // Add rename session functionality
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  
  const handleRenameSession = () => {
    if (selectedSessionId) {
      const session = sessions.find(s => s.id === selectedSessionId);
      if (session) {
        setNewSessionTitle(session.title || '');
        setRenameDialogOpen(true);
        handleSessionMenuClose();
      }
    }
  };
  
  const handleRenameConfirm = async () => {
    if (selectedSessionId && newSessionTitle.trim()) {
      try {
        await updateSessionApi({
          id: selectedSessionId, 
          changes: { title: newSessionTitle.trim() }
        }).unwrap();
        setRenameDialogOpen(false);
        setNewSessionTitle('');
      } catch (error) {
        console.error('Failed to rename session:', error);
      }
    }
  };
  
  // Add duplicate session functionality
  const handleDuplicateSession = async () => {
    if (selectedSessionId) {
      try {
        const session = sessions.find(s => s.id === selectedSessionId);
        if (session) {
          const duplicateTitle = `${session.title || 'Chat'} (Copy)`;
          const result = await createSession({ title: duplicateTitle }).unwrap();
          const newSessionId = result.session_id;
          
          // Move to same folder as original
          if (session.folderId) {
            dispatch(moveSessionToFolder({ sessionId: newSessionId, folderId: session.folderId }));
          }
          
          // Navigate to the new session
          navigate(`/chat/${newSessionId}`);
          dispatch(setActiveSession(newSessionId));
        }
        handleSessionMenuClose();
      } catch (error) {
        console.error('Failed to duplicate session:', error);
      }
    }
  };
  
  // Folder actions
  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      dispatch(createFolder(newFolderName.trim()));
      setNewFolderName('');
      setFolderDialogOpen(false);
      
      // Auto-expand the new folder
      const newFolderId = folders[folders.length - 1]?.id;
      if (newFolderId) {
        setExpandedFolders(prev => ({ ...prev, [newFolderId]: true }));
      }
    }
  };
  
  const handleEditFolder = () => {
    if (editingFolderId && newFolderName.trim()) {
      dispatch(updateFolderName({ folderId: editingFolderId, name: newFolderName.trim() }));
      setNewFolderName('');
      setEditingFolderId(null);
      setFolderEditDialogOpen(false);
      handleFolderMenuClose();
    }
  };
  
  const handleOpenEditFolder = () => {
    if (selectedFolderId) {
      const folder = folders.find(f => f.id === selectedFolderId);
      if (folder) {
        setNewFolderName(folder.name);
        setEditingFolderId(selectedFolderId);
        setFolderEditDialogOpen(true);
        handleFolderMenuClose();
      }
    }
  };
  
  const handleOpenDeleteFolder = () => {
    if (selectedFolderId) {
      const folder = folders.find(f => f.id === selectedFolderId);
      if (folder) {
        setFolderToDelete(selectedFolderId);
        setFolderDeleteDialogOpen(true);
        handleFolderMenuClose();
      }
    }
  };

  const handleDeleteFolder = async () => {
    if (folderToDelete) {
      try {
        // Check if this is the only folder
        if (folders.length <= 1) {
          setFolderDeleteError("Cannot delete the only session. Create another session first.");
          return;
        }

        // Set loading state
        setIsDeletingFolder(true);
        
        // Count sessions in this folder
        const sessionsInFolder = sessions.filter(s => s.folderId === folderToDelete).length;
        
        // Brief artificial delay for better UX
        if (sessionsInFolder > 0) {
          // Add a small delay to show the loading state if there are sessions to move
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Perform the deletion
        dispatch(deleteFolder(folderToDelete));
        
        // Close the dialog
        setFolderDeleteDialogOpen(false);
        setFolderToDelete(null);
        setFolderDeleteError(null);
      } catch (error) {
        console.error('Failed to delete folder:', error);
        setFolderDeleteError("An error occurred while deleting the folder.");
      } finally {
        setIsDeletingFolder(false);
      }
    }
  };
  
  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Add folder-specific new chat handler
  const handleNewChatInFolder = async (folderId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    try {
      const now = new Date();
      const defaultTitle = `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      const result = await createSession({ title: defaultTitle }).unwrap();
      const newId = result.session_id;
      // Ensure session linked to selected folder
      dispatch(moveSessionToFolder({ sessionId: newId, folderId }));
      navigate(`/chat/${newId}`);
      dispatch(setActiveSession(newId));
    } catch(e){
      console.error('Failed to create session', e);
    }
  };

  const handleNewChat = async () => {
    try {
      // Check if there are any folders, and create a default one if not
      if (folders.length === 0) {
        dispatch(createFolder("Default Session"));
        // Wait a bit for the folder to be created
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const now = new Date();
      const defaultTitle = `Chat ${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      const result = await createSession({ title: defaultTitle }).unwrap();
      const newId = result.session_id;
      
      dispatch(updateSessionTitle({ sessionId: newId, title: defaultTitle }));
      
      // Ensure session linked to selected folder
      dispatch(moveSessionToFolder({ sessionId: newId, folderId: folders[0].id }));
      navigate(`/chat/${newId}`);
      dispatch(setActiveSession(newId));
    } catch (e) {
      console.error('Failed to create session', e);
    }
  };
  
  // Group sessions by folder and pinned status
  const pinnedSessions = sessions.filter(session => session.pinned);
  const folderSessions = folders.reduce((acc, folder) => {
    acc[folder.id] = sessions.filter(
      session => session.folderId === folder.id && !session.pinned
    );
    return acc;
  }, {} as Record<string, typeof sessions>);
  
  // Function to render a session list item
  const renderSessionItem = (session: typeof sessions[number]) => {
    const sessionTitle = session.title || `Chat ${new Date(session.createdAt).toLocaleDateString()}`;
    const messageCount = `${session.messages.length} messages`;
    const isActive = session.id === activeSessionId;
    
    const sessionItem = (
      <ListItemButton 
        key={session.id}
        selected={isActive}
        component={Link}
        to={`/chat/${session.id}`}
        onClick={() => dispatch(setActiveSession(session.id))}
        sx={{ 
          borderRadius: 2, 
          mb: 0.5,
          px: isCollapsed ? 1 : 1.5,
          py: 1,
          position: 'relative',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          backgroundColor: isActive ? 
            (theme.palette.mode === 'dark' ? alpha('#c8102e', 0.08) : alpha('#c8102e', 0.05)) : 
            'transparent',
          borderLeft: isActive ? '3px solid #c8102e' : '3px solid transparent',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#c8102e', 0.12)
              : alpha('#c8102e', 0.08),
            transform: 'translateX(2px)',
            borderLeftColor: isActive ? '#c8102e' : alpha('#c8102e', 0.3),
          },
          '&.Mui-selected': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha('#c8102e', 0.08)
              : alpha('#c8102e', 0.05),
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha('#c8102e', 0.12)
                : alpha('#c8102e', 0.08),
            }
          },
          // Add hover affordance
          '&:hover .session-menu-button': {
            opacity: 1,
          }
        }}
      >
        <ListItemIcon sx={{ 
          minWidth: isCollapsed ? 0 : 30, 
          color: isActive ? '#c8102e' : theme.palette.text.secondary,
          mr: isCollapsed ? 0 : 1
        }}>
          <Badge
            color="error"
            variant="dot"
            invisible={session.messages.length === 0 || isActive}
            sx={{ 
              '& .MuiBadge-badge': {
                right: 2,
                top: 2,
              }
            }}
          >
            <ChatIcon fontSize="small" />
          </Badge>
        </ListItemIcon>
        
        {isExpanded && (
          <>
            <ListItemText 
              primary={sessionTitle}
              primaryTypographyProps={{
                noWrap: true,
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
              }}
              secondary={messageCount}
              secondaryTypographyProps={{
                noWrap: true,
                fontSize: '0.75rem',
                sx: { opacity: 0.7 },
              }}
            />
            {session.pinned && (
              <PushPinOutlinedIcon 
                fontSize="small" 
                sx={{ 
                  position: 'absolute', 
                  right: 32, 
                  color: theme.palette.text.secondary,
                  fontSize: '0.8rem', 
                  opacity: 0.6 
                }} 
              />
            )}
            <IconButton
              className="session-menu-button"
              size="small"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Session menu clicked for:', session.id); // Debug log
                handleSessionMenuOpen(e, session.id);
              }}
              sx={{
                opacity: 0.7, // Make slightly visible by default
                transition: 'opacity 0.2s',
                '&:hover': { 
                  opacity: 1,
                  backgroundColor: alpha(theme.palette.action.hover, 0.5),
                },
                ml: 0.5,
                mr: -1,
                p: 0.5,
                zIndex: 10, // Ensure it's above other elements
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </>
        )}
        
        {isCollapsed && session.pinned && (
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: theme.palette.error.main,
            }}
          />
        )}
      </ListItemButton>
    );
    
    // Wrap with tooltip if sidebar is collapsed
    return isCollapsed ? (
      <Tooltip 
        title={`${sessionTitle} - ${messageCount}${session.pinned ? ' (Pinned)' : ''}`} 
        placement="right"
        key={session.id}
      >
        {sessionItem}
      </Tooltip>
    ) : sessionItem;
  };

  // Function to render a folder section
  const renderFolderSection = (folder: typeof folders[number]) => {
    const folderContent = folderSessions[folder.id] || [];
    
    if (folderContent.length === 0 && isCollapsed) return null;
    
    const folderHeader = (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          px: isCollapsed ? 1 : 2, 
          py: 1,
          cursor: 'pointer', 
          userSelect: 'none',
          color: theme.palette.text.secondary,
          borderRadius: 1,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          transition: 'all 0.2s ease-in-out',
          position: 'relative',
          '&:hover': { 
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.03)',
            transform: isCollapsed ? 'scale(1.1)' : 'none',
          },
        }}
        onClick={() => handleToggleFolder(folder.id)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mr: isCollapsed ? 0 : 1 }}>
          <FolderOutlinedIcon 
            fontSize="small"
            color={folderContent.length > 0 ? "primary" : undefined}
          />
        </Box>
        
        {isCollapsed && folderContent.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              right: '50%',
              transform: 'translateX(50%)',
              width: 8,
              height: 2,
              borderRadius: 4,
              bgcolor: theme.palette.primary.main,
              opacity: expandedFolders[folder.id] ? 1 : 0.4,
            }}
          />
        )}
        
        {isExpanded && (
          <>
            <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500, flexGrow: 1, textTransform: 'none' }}>
              {folder.name} ({folderContent.length})
            </Typography>
            {/* Add New Chat to Folder Button */}
            <Tooltip title="New chat in this session" PopperProps={{ sx: { zIndex: 1400 } }}>
              <IconButton
                size="small"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleNewChatInFolder(folder.id, e)}
                sx={{
                  opacity: 0.8,
                  color: '#f59e0b', // Enterprise amber color
                  '&:hover': { opacity: 1 },
                  mr: 0.5,
                  p: 0.5,
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <ExpandMoreIcon 
              fontSize="small" 
              sx={{
                transform: expandedFolders[folder.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease-in-out',
                mr: 1
              }} 
            />
            <IconButton
              size="small"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleFolderMenuOpen(e, folder.id)}
              sx={{
                opacity: 0.6,
                '&:hover': { opacity: 1 },
                ml: 0.5,
                mr: -1,
                p: 0.5,
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
    );
    
    return (
      <Box key={folder.id} sx={{ mb: 2 }}>
        {isCollapsed ? (
          <Tooltip 
            title={`${folder.name} (${folderContent.length})`}
            placement="right"
            PopperProps={{
              sx: { zIndex: 1400 }
            }}
          >
            {folderHeader}
          </Tooltip>
        ) : (
          folderHeader
        )}
        
        <Collapse 
          in={expandedFolders[folder.id] || isCollapsed}
          timeout={300}
          sx={{
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <List dense sx={{ mt: 0.5, pl: isCollapsed ? 0 : 1 }}>
            {folderContent.map(session => renderSessionItem(session))}
            {folderContent.length === 0 && isExpanded && (
              <Box 
                sx={{ 
                  px: 2, 
                  py: 1.5, 
                  color: theme.palette.text.secondary, 
                  fontSize: '0.8rem', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 1,
                  border: '1px dashed',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  my: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                  No chats in this session
                </Typography>
                <Button
                  variant="text"
                  color="error"
                  size="small"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => handleNewChatInFolder(folder.id)}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    py: 0.5,
                    minWidth: 0,
                  }}
                >
                  Add chat
                </Button>
              </Box>
            )}
          </List>
        </Collapse>
      </Box>
    );
  };

  // Determine if sidebar should be expanded (collapsed but hovered)
  const isExpanded = !isCollapsed || (isCollapsed && isHovered);
  const currentWidth = isExpanded ? drawerWidth : 72; // 72px for collapsed state showing icons

  // Sync rail-open class on documentElement for CSS var
  useEffect(() => {
    const root = document.documentElement;
    if (isCollapsed) {
      root.classList.remove('rail-open');
    } else {
      root.classList.add('rail-open');
    }
  }, [isCollapsed]);

  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <>
      {/* Enhanced resizable wrapper for the drawer with improved hover behavior */}
      <Box
        onMouseEnter={() => {
          setIsHovered(true);
          setShowCollapseButton(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          // Delay hiding the button to prevent flicker
          setTimeout(() => setShowCollapseButton(false), 300);
        }}
        sx={{ 
          position: 'relative',
          // Add hover expansion zone for collapsed sidebar
          ...(isCollapsed && {
            '&:hover': {
              zIndex: 1300,
            },
            // Extend hover area slightly to make interaction easier
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: -8, // Extend 8px to the right for easier hover activation
              bottom: 0,
              zIndex: -1,
              pointerEvents: 'auto',
            }
          })
        }}
      >
        <Resizable
          size={{ width: isCollapsed ? 72 : drawerWidth, height: '100vh' }}
          onResizeStop={(e, direction, ref, d) => {
            const newWidth = drawerWidth + d.width;
            if (newWidth >= 180 && newWidth <= 400) { // Min and max width constraints
              setDrawerWidth(newWidth);
            }
          }}
          enable={{
            top: false,
            right: !isCollapsed,
            bottom: false,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }}
          minWidth={isCollapsed ? 72 : 180}
          maxWidth={isCollapsed ? 72 : 400}
          style={{
            position: 'relative',
            transition: 'none',
          }}
        >
          <StyledDrawer
            variant="permanent"
            anchor="left"
            sx={{
              width: currentWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: currentWidth,
                boxSizing: 'border-box',
                height: '100vh',
                border: 'none',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(18, 18, 18, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                boxShadow: isCollapsed && !isHovered
                  ? 'none' 
                  : theme.palette.mode === 'dark'
                    ? `4px 0 24px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(0, 0, 0, 0.3)`
                    : `4px 0 24px rgba(0, 0, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.04)`,
                borderRight: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                transition: theme.transitions.create(['width', 'box-shadow', 'transform'], {
                  easing: theme.transitions.easing.easeOut,
                  duration: '0.3s',
                }),
                overflowX: 'hidden',
                // Enhanced hover expansion for collapsed state
                ...(isCollapsed && {
                  position: 'fixed',
                  zIndex: 1300,
                  '&:hover': {
                    width: 280,
                    boxShadow: theme.palette.mode === 'dark'
                      ? `8px 0 32px rgba(0, 0, 0, 0.6), 0 16px 48px rgba(0, 0, 0, 0.4)`
                      : `8px 0 32px rgba(0, 0, 0, 0.12), 0 16px 48px rgba(0, 0, 0, 0.08)`,
                    transform: 'translateX(0)',
                    transition: theme.transitions.create(['width', 'box-shadow', 'transform'], {
                      easing: theme.transitions.easing.easeOut,
                      duration: '0.3s',
                    }),
                  }
                }),
                // Professional bottom shadow enhancement
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '8px',
                  background: `linear-gradient(to bottom, transparent, ${alpha(theme.palette.common.black, 0.08)})`,
                  pointerEvents: 'none',
                },
                // Additional depth with layered shadows
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: -1,
                  bottom: 0,
                  width: '1px',
                  background: `linear-gradient(to bottom, 
                    ${alpha(theme.palette.primary.main, 0.1)}, 
                    transparent 30%, 
                    transparent 70%, 
                    ${alpha(theme.palette.primary.main, 0.1)}
                  )`,
                  pointerEvents: 'none',
                },
              },
            }}
          >
            {/* Header with animated Logo - show logo icon when collapsed, full logo when expanded */}
            <Box sx={{ 
              px: isCollapsed ? 1 : 2, 
              py: isCollapsed ? 1.5 : 2, 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              minHeight: 56, // Consistent height
              transition: 'all 0.3s ease',
            }}>
              {/* Show logo icon when collapsed, full logo when expanded */}
              <AnimatePresence mode="wait">
                {isCollapsed ? (
                  <motion.div
                    key="collapsed-logo"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          transform: 'scale(1.05)',
                          opacity: 0.8 
                        }
                      }}
                    >
                      <LogoText 
                        size="small" 
                        showOnlyBubble={true} 
                        hasNewMessage={pinnedSessions.length > 0} 
                        interactive={true}
                        onClick={handleLogoClick}
                        aria-label="Return to home page"
                      />
                    </Box>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded-logo"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                          opacity: 0.8 
                        }
                      }}
                    >
                      <LogoText 
                        size="small" 
                        hasNewMessage={pinnedSessions.length > 0} 
                        interactive={true}
                        onClick={handleLogoClick}
                        aria-label="Return to home page"
                      />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>

            {/* Folder management - Enhanced to show on hover when collapsed */}
            <AnimatePresence>
              {(isExpanded || (isCollapsed && isHovered)) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <Box 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        opacity: isCollapsed && !isHovered ? 0 : 1,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      Sessions
                    </Typography>
                    <Tooltip title="New Session" PopperProps={{ sx: { zIndex: 1400 } }}>
                      <IconButton 
                        size="small" 
                        onClick={() => setFolderDialogOpen(true)}
                        sx={{ 
                          color: '#c8102e',
                          opacity: isCollapsed && !isHovered ? 0 : 1,
                          transition: 'opacity 0.3s ease'
                        }}
                      >
                        <CreateNewFolderOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Chat History with improved hover behavior */}
            <Box 
              sx={{ 
                overflow: 'auto', 
                flexGrow: 1,
                // Enhance scrollbar when expanded via hover
                '&::-webkit-scrollbar': {
                  width: isCollapsed && isHovered ? '6px' : '4px',
                  transition: 'width 0.3s ease',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.2)' 
                    : 'rgba(0,0,0,0.2)',
                  borderRadius: '3px',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.3)' 
                      : 'rgba(0,0,0,0.3)',
                  },
                },
                '& .MuiListItemButton-root': {
                  animation: `${fadeIn} 0.3s ease-in-out`,
                  '&.Mui-selected': {
                    animation: isCollapsed && !isHovered ? `${activeGlow} 2s infinite ease-in-out` : 'none',
                  },
                  '&:hover': {
                    animation: isCollapsed && !isHovered ? `${subtleBounce} 0.3s ease-in-out` : 'none',
                  }
                } 
              }}
            >
              {pinnedSessions.length > 0 && (
                <Box sx={{ mt: 2, mb: 3, px: isCollapsed && !isHovered ? 0 : 2 }}>
                  {(isExpanded || (isCollapsed && isHovered)) && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary, 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        textTransform: 'none',
                        opacity: isCollapsed && !isHovered ? 0 : 1,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      Pinned Chats
                    </Typography>
                  )}
                  <List dense sx={{ mt: isCollapsed ? 0 : 0.5, px: isCollapsed && !isHovered ? 0 : undefined, textAlign: isCollapsed && !isHovered ? 'center' : undefined }}>
                    {pinnedSessions.map(session => renderSessionItem(session))}
                  </List>
                </Box>
              )}
              
              {sessionsLoading && sessions.length === 0 && (
                <Box sx={{ px: (isCollapsed && !isHovered) ? 1 : 2, pt: 2 }}>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <Skeleton 
                      key={idx} 
                      variant="rectangular" 
                      height={isCollapsed && !isHovered ? 24 : 32} 
                      sx={{ 
                        mb: 1, 
                        borderRadius: 1, 
                        bgcolor: theme.palette.mode === 'dark' ? '#2e2e2e' : '#e0e0e0',
                        mx: isCollapsed && !isHovered ? 'auto' : 0,
                        width: isCollapsed && !isHovered ? 40 : '100%',
                        transition: 'all 0.3s ease'
                      }} 
                    />
                  ))}
                </Box>
              )}
              
              {sessions.length > 0 && (
                <Box sx={{ mt: isCollapsed && !isHovered ? 2 : 0, px: isCollapsed && !isHovered ? 0 : 2 }}>
                {folders.length > 0 ? (
                  folders.map(folder => renderFolderSection(folder))
                ) : (
                  (isExpanded || (isCollapsed && isHovered)) && (
                    <Box 
                      sx={{ 
                        py: 2, 
                        px: 2,
                        textAlign: 'center',
                        color: theme.palette.text.secondary,
                        borderRadius: 1,
                        border: '1px dashed',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        margin: 1,
                        opacity: isCollapsed && !isHovered ? 0 : 1,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        No sessions available
                      </Typography>
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        startIcon={<CreateNewFolderOutlinedIcon fontSize="small" />}
                        onClick={() => setFolderDialogOpen(true)}
                        sx={{
                          mt: 1,
                          textTransform: 'none',
                          fontSize: '0.75rem',
                        }}
                      >
                        Create Session
                      </Button>
                    </Box>
                  )
                )}
              </Box>
              )}
            </Box>

            {/* New Chat Button - Fab for collapsed state, button for expanded state */}
            <Box 
              sx={{ 
                mt: 'auto', 
                p: 2, 
                borderTop: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'center',
                position: 'sticky',
                bottom: 0,
                backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                zIndex: 10,
              }}
            >
              {isExpanded ? (
                <Button
                  variant="text"
                  color="error"
                  size="small"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={handleNewChat}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    justifyContent: 'center',
                    width: '100%',
                    py: 0.8,
                    opacity: 0.9,
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(244,67,54,0.15)'
                        : 'rgba(244,67,54,0.12)',
                    },
                  }}
                >
                  New Chat
                </Button>
              ) : (
                <Tooltip title="New Chat" placement="right" PopperProps={{ sx: { zIndex: 1400 } }}>
                  <Fab
                    color="error"
                    size="small"
                    onClick={handleNewChat}
                    sx={{
                      boxShadow: theme.shadows[3],
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: theme.shadows[4],
                      }
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </Fab>
                </Tooltip>
              )}
            </Box>
            
            {/* Session context menu */}
            <Menu
              anchorEl={sessionMenuAnchorEl}
              open={Boolean(sessionMenuAnchorEl)}
              onClose={handleSessionMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              sx={{ zIndex: 1400 }}
              PaperProps={{
                elevation: 0, // Remove elevation
                sx: {
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff', // TSC theme colors
                  borderRadius: 1.5,
                  minWidth: 180,
                  overflow: 'visible',
                  mt: 1.5,
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(200, 16, 46, 0.2)'
                    : '1px solid rgba(200, 16, 46, 0.1)',
                  boxShadow: 'none', // Remove box shadow
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 14,
                    width: 10,
                    height: 10,
                    bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff', // TSC theme colors
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                    border: theme.palette.mode === 'dark'
                      ? '1px solid rgba(200, 16, 46, 0.2)'
                      : '1px solid rgba(200, 16, 46, 0.1)',
                    borderRight: 'none',
                    borderBottom: 'none',
                  },
                  '& .MuiMenuItem-root:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(200, 16, 46, 0.15)'
                      : 'rgba(200, 16, 46, 0.05)',
                  }
                },
              }}
            >
              <MenuItem onClick={handleTogglePinned}>
                <ListItemIcon sx={{ color: '#c8102e' }}>
                  <PushPinOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={sessions.find(s => s.id === selectedSessionId)?.pinned ? "Unpin" : "Pin"}
                />
              </MenuItem>
              
              <MenuItem onClick={handleRenameSession}>
                <ListItemIcon sx={{ color: '#c8102e' }}>
                  <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Rename" />
              </MenuItem>
              
              <MenuItem onClick={handleDuplicateSession}>
                <ListItemIcon sx={{ color: '#c8102e' }}>
                  <ContentCopyIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Duplicate" />
              </MenuItem>
              
              <Divider sx={{ 
                borderColor: theme.palette.mode === 'dark' 
                  ? 'rgba(200, 16, 46, 0.2)' 
                  : 'rgba(200, 16, 46, 0.1)'
              }} />
              
              <MenuItem onClick={() => { dispatch(clearSessionMessages(selectedSessionId!)); handleSessionMenuClose(); }}>
                <ListItemIcon sx={{ color: '#c8102e' }}>
                  <DeleteOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Clear chats" />
              </MenuItem>
              
              <Divider sx={{ 
                borderColor: theme.palette.mode === 'dark' 
                  ? 'rgba(200, 16, 46, 0.2)' 
                  : 'rgba(200, 16, 46, 0.1)'
              }} />
              
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 2, 
                  py: 0.5, 
                  display: 'block', 
                  color: theme.palette.mode === 'dark' ? '#f0f0f0' : '#333333',
                  fontWeight: 600
                }}
              >
                Move to group
              </Typography>
              
              {folders.map(folder => {
                const isCurrentFolder = sessions.find(s => s.id === selectedSessionId)?.folderId === folder.id;
                
                return (
                  <MenuItem 
                    key={folder.id} 
                    onClick={() => handleMoveToFolder(folder.id)}
                    dense
                    sx={{
                      pl: 3,
                      fontSize: '0.85rem',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(200, 16, 46, 0.15)'
                          : 'rgba(200, 16, 46, 0.05)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28, color: '#c8102e' }}>
                      <FolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={folder.name} />
                    {isCurrentFolder && (
                      <Box component="span" sx={{ ml: 1, color: theme.palette.success.main }}>
                        ✓
                      </Box>
                    )}
                  </MenuItem>
                );
              })}
              
              <Divider sx={{ 
                borderColor: theme.palette.mode === 'dark' 
                  ? 'rgba(200, 16, 46, 0.2)' 
                  : 'rgba(200, 16, 46, 0.1)'
              }} />
              
              <MenuItem 
                onClick={handleDeleteSession} 
                sx={{ 
                  color: '#c8102e',
                  '&:hover': {
                    backgroundColor: 'rgba(200, 16, 46, 0.1)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: '#c8102e' }}>
                  <DeleteOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Delete" />
              </MenuItem>
            </Menu>
            
            {/* Folder context menu */}
            <Menu
              anchorEl={folderMenuAnchorEl}
              open={Boolean(folderMenuAnchorEl)}
              onClose={handleFolderMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              sx={{ zIndex: 1400 }}
              PaperProps={{
                elevation: 0, // Remove elevation
                sx: {
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff', // TSC theme colors
                  borderRadius: 1.5,
                  minWidth: 180,
                  overflow: 'visible',
                  mt: 1.5,
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(200, 16, 46, 0.2)'
                    : '1px solid rgba(200, 16, 46, 0.1)',
                  boxShadow: 'none', // Remove box shadow
                  '& .MuiMenuItem-root:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(200, 16, 46, 0.15)'
                      : 'rgba(200, 16, 46, 0.05)',
                  }
                },
              }}
            >
              <MenuItem 
                onClick={handleOpenEditFolder}
                sx={{
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(200, 16, 46, 0.15)'
                      : 'rgba(200, 16, 46, 0.05)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: '#c8102e' }}>
                  <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Rename" />
              </MenuItem>
              
              <MenuItem 
                onClick={handleMoveFolderMenuOpen}
                disabled={folders.length <= 1 || folderSessions[selectedFolderId || '']?.length === 0}
                sx={{
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(200, 16, 46, 0.15)'
                      : 'rgba(200, 16, 46, 0.05)',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(200, 16, 46, 0.4)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: '#c8102e' }}>
                  <FolderIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Move all chats to" />
              </MenuItem>
              
              <MenuItem 
                onClick={handleOpenDeleteFolder} 
                sx={{ 
                  color: '#c8102e',
                  '&:hover': {
                    backgroundColor: 'rgba(200, 16, 46, 0.1)',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(200, 16, 46, 0.4)',
                  }
                }}
                disabled={folders.length <= 1} // Prevent deleting the last folder
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <DeleteOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Delete session" />
              </MenuItem>
            </Menu>
            
            {/* New Folder Dialog */}
            <ThemedDialog 
              open={folderDialogOpen} 
              onClose={() => setFolderDialogOpen(false)}
              maxWidth="xs"
              fullWidth
              sx={{ zIndex: 1400 }}
            >
              <DialogTitle>New Session</DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Session Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleAddFolder} 
                  variant="contained" 
                  color="primary"
                  disabled={!newFolderName.trim()}
                >
                  Create
                </Button>
              </DialogActions>
            </ThemedDialog>
            
            {/* Edit Folder Dialog */}
            <ThemedDialog 
              open={folderEditDialogOpen} 
              onClose={() => setFolderEditDialogOpen(false)}
              maxWidth="xs"
              fullWidth
              sx={{ zIndex: 1400 }}
            >
              <DialogTitle>Rename Session</DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Session Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setFolderEditDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleEditFolder} 
                  variant="contained" 
                  color="primary"
                  disabled={!newFolderName.trim()}
                >
                  Rename
                </Button>
              </DialogActions>
            </ThemedDialog>

            {/* Rename Session Dialog */}
            <ThemedDialog 
              open={renameDialogOpen} 
              onClose={() => setRenameDialogOpen(false)}
              maxWidth="xs"
              fullWidth
              sx={{ zIndex: 1400 }}
            >
              <DialogTitle>Rename Chat</DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Chat Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={newSessionTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSessionTitle(e.target.value)}
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleRenameConfirm} 
                  variant="contained" 
                  color="primary"
                  disabled={!newSessionTitle.trim()}
                >
                  Rename
                </Button>
              </DialogActions>
            </ThemedDialog>

            {/* Folder Delete Confirmation Dialog */}
            <ThemedDialog
              open={folderDeleteDialogOpen}
              onClose={() => {
                if (!isDeletingFolder) {
                  setFolderDeleteDialogOpen(false);
                  setFolderToDelete(null);
                  setFolderDeleteError(null);
                }
              }}
              maxWidth="xs"
              fullWidth
              sx={{ zIndex: 1400 }}
            >
              <DialogTitle>Delete Session</DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                {folderToDelete && (
                  <>
                    <Typography variant="body1" gutterBottom>
                      Are you sure you want to delete this session?
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                      Chats in this session will be moved to another available session.
                    </Typography>
                    
                    {folderDeleteError && (
                      <Box 
                        sx={{ 
                          p: 1.5, 
                          my: 1.5, 
                          bgcolor: 'rgba(200, 16, 46, 0.1)', 
                          borderRadius: 1,
                          border: '1px solid rgba(200, 16, 46, 0.3)'
                        }}
                      >
                        <Typography variant="body2" color="error">
                          {folderDeleteError}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button 
                  onClick={() => {
                    setFolderDeleteDialogOpen(false);
                    setFolderToDelete(null);
                    setFolderDeleteError(null);
                  }}
                  disabled={isDeletingFolder}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteFolder}
                  variant="contained"
                  color="error"
                  disabled={isDeletingFolder || !folderToDelete || folders.length <= 1}
                  startIcon={isDeletingFolder ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
                >
                  {isDeletingFolder ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogActions>
            </ThemedDialog>

            {/* Move Folder Submenu */}
            <Menu
              anchorEl={moveFolderMenuAnchorEl}
              open={Boolean(moveFolderMenuAnchorEl)}
              onClose={handleMoveFolderMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              sx={{ zIndex: 1400 }}
              PaperProps={{
                elevation: 0,
                sx: {
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                  borderRadius: 1.5,
                  minWidth: 180,
                  overflow: 'visible',
                  mt: 1.5,
                  ml: 2,
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(200, 16, 46, 0.2)'
                    : '1px solid rgba(200, 16, 46, 0.1)',
                  boxShadow: 'none',
                  '& .MuiMenuItem-root:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(200, 16, 46, 0.15)'
                      : 'rgba(200, 16, 46, 0.05)',
                  }
                },
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 2, 
                  py: 0.5, 
                  display: 'block', 
                  color: theme.palette.mode === 'dark' ? '#f0f0f0' : '#333333',
                  fontWeight: 600
                }}
              >
                Select session
              </Typography>
              
              {folders
                .filter(folder => folder.id !== selectedFolderId)
                .map(folder => (
                  <MenuItem 
                    key={folder.id} 
                    onClick={() => handleMoveAllChats(folder.id)}
                    dense
                    sx={{
                      pl: 3,
                      fontSize: '0.85rem',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(200, 16, 46, 0.15)'
                          : 'rgba(200, 16, 46, 0.05)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28, color: '#c8102e' }}>
                      <FolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={folder.name} />
                  </MenuItem>
                ))}
            </Menu>
          </StyledDrawer>
        </Resizable>
        
        {/* Collapse button - shows on hover */}
        <AnimatePresence>
          {showCollapseButton && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                left: currentWidth - 8,
                top: 'calc(var(--nav-h) / 2)',
                transform: 'translateY(-50%)',
                zIndex: 1500, // Higher z-index to ensure it's always visible
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(26, 26, 26, 0.95)' 
                    : 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #c21f1a',
                  boxShadow: `0 2px 8px rgba(194, 31, 26, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1)`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 246, 227, 0.15)' 
                      : '#FFF6E3',
                    transform: 'scale(1.05)',
                    boxShadow: `0 3px 12px rgba(194, 31, 26, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)`,
                    borderColor: '#a50d24',
                  },
                  // Glow effect
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    right: -2,
                    bottom: -2,
                    background: 'linear-gradient(45deg, #c21f1a, #ff4444, #c21f1a)',
                    borderRadius: '50%',
                    zIndex: -1,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                  '&:hover::before': {
                    opacity: 0.15,
                  },
                }}
              >
                <Tooltip title={isCollapsed ? "Open sidebar (⌘B)" : "Close sidebar (⌘B)"} placement="right">
                  <Box>
                    <SidebarCollapseArrow isCollapsed={isCollapsed} onClick={toggleSidebar} />
                  </Box>
                </Tooltip>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </>
  );
};

export default Sidebar; 