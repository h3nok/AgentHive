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
  CircularProgress,
  Skeleton,
  Badge,
  alpha
} from '@mui/material';
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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatIcon from '@mui/icons-material/Chat';

import { styled } from '@mui/material/styles';
import { keyframes } from '@emotion/react';
import { Resizable } from 're-resizable';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Internal components and hooks
import LogoText from '../../shared/components/LogoText';
import EnterpriseFloatingActionButton from '../../shared/components/EnterpriseFloatingActionButton';
import useMenuAnchor from '../../shared/hooks/useMenuAnchor';

// Store and API
import { RootState } from '../../shared/store';
import type { Message } from '../../shared/store';
import { 
  setActiveSession, 
  moveSessionToFolder,
  createFolder,
  updateFolderName,
  deleteFolder,
  updateSessionTitle,
  clearSessionMessages,
  incrementTaskCounter,
  fixLegacySessionNames
} from './chat/chatSlice';
import { 
  useListSessionsQuery as useListSessionsQueryApi,
  useCreateSessionMutation, 
  useUpdateSessionMutation, 
  useDeleteSessionMutation 
} from './chat/sessionsApi';

//==========================================
// Styled Components
//==========================================

// Create a styled Drawer component to override theme defaults
const StyledDrawer = styled(Drawer)(() => ({
  '& .MuiDrawer-paper': {
    background: 'transparent',
    backgroundImage: 'none !important',
    transition: 'width 0.3s ease-in-out',
  }
}));

// Styled Dialog component that respects the enterprise honey/swarm theme
const ThemedDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
    boxShadow: theme.palette.mode === 'dark' 
      ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`
      : `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
    borderRadius: 16,
    border: theme.palette.mode === 'dark'
      ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
      : `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    backdropFilter: 'blur(8px)',
  },
  '& .MuiDialogTitle-root': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.primary.main, 0.08)
      : alpha(theme.palette.primary.main, 0.04),
    borderBottom: `1px solid ${theme.palette.mode === 'dark' 
      ? alpha(theme.palette.primary.main, 0.2) 
      : alpha(theme.palette.primary.main, 0.15)}`,
    color: theme.palette.primary.main,
    fontWeight: 600,
    position: 'relative',
    '&:after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.warning.main})`,
    }
  },
  '& .MuiDialogContent-root': {
    paddingTop: theme.spacing(3),
  },
  '& .MuiButton-containedPrimary': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    borderRadius: theme.shape.borderRadius,
    textTransform: 'none',
    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
      transform: 'translateY(-1px)',
    }
  },
  '& .MuiButton-outlined': {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    '&:hover': {
      borderColor: theme.palette.primary.dark,
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    }
  }
}));

//==========================================
// Animations
//==========================================

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

//==========================================
// Types and Interfaces
//==========================================

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

interface SessionData {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  folderId: string;
  pinned: boolean;
}

interface FolderData {
  id: string;
  name: string;
}

//==========================================
// Main Component
//==========================================

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  toggleSidebar
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Fetch sessions from API
  const { data: sessionsData } = useListSessionsQueryApi();
  
  const folders = useSelector((state: RootState) => state.chat.folders);
  const activeSessionId = useSelector((state: RootState) => state.chat.activeSessionId);
  const taskCounter = useSelector((state: RootState) => state.chat.taskCounter);
  const reduxSessions = useSelector((state: RootState) => state.chat.sessions);
  
  // Transform API data to match expected format
  const transformedSessions = React.useMemo(() => {
    return sessionsData?.map(session => {
      // Get messages from Redux store for this session
      const reduxSession = reduxSessions.find(s => s.id === session.session_id);
      
      return {
        id: session.session_id,
        title: session.title || `Task ${new Date().toLocaleDateString()}`,
        messages: reduxSession?.messages || [], // Get messages from Redux store
        createdAt: session.updated_at,
        updatedAt: session.updated_at,
        folderId: folders.length > 0 ? folders[0].id : 'default', // Use first folder ID
        pinned: session.pinned || false,
      };
    }) || [];
  }, [sessionsData, folders, reduxSessions]);
  
  const sessions = transformedSessions;
  
  // Ensure default folder exists (prevent duplicates)
  React.useEffect(() => {
    if (folders.length === 0) {
      dispatch(createFolder("Default"));
    } else {
      // Check for and cleanup duplicate default folders
      const defaultFolders = folders.filter(f => 
        f.name === "Default" || 
        f.name === "Default Session" || 
        f.name.toLowerCase().includes("default")
      );
      
      if (defaultFolders.length > 1) {
        console.warn(`Found ${defaultFolders.length} default folders, cleaning up duplicates`);
        
        // Keep the first one and remove the rest
        const folderToKeep = defaultFolders[0];
        const foldersToRemove = defaultFolders.slice(1);
        
        // Move all sessions from duplicate folders to the main one
        foldersToRemove.forEach(duplicateFolder => {
          const sessionsInDuplicate = sessions.filter(s => s.folderId === duplicateFolder.id);
          sessionsInDuplicate.forEach(session => {
            dispatch(moveSessionToFolder({ sessionId: session.id, folderId: folderToKeep.id }));
          });
          
          // Delete the duplicate folder
          dispatch(deleteFolder(duplicateFolder.id));
        });
        
        // Rename the kept folder to "Default" if it's not already
        if (folderToKeep.name !== "Default") {
          dispatch(updateFolderName({ folderId: folderToKeep.id, name: "Default" }));
        }
      }
    }
  }, [folders, sessions, dispatch]);

  // Fix old session names on mount (one-time operation)
  React.useEffect(() => {
    if (sessions.length > 0) {
      const hasOldNames = sessions.some(session => 
        !session.title || 
        session.title.includes('New Chat') ||
        session.title.includes('Chat ') ||
        (session.title.includes('Session ') && !session.title.startsWith('Task '))
      );
      
      if (hasOldNames) {
        console.log('🔧 Fixing old session names...');
        dispatch(fixLegacySessionNames());
      }
    }
  }, [sessions.length, dispatch]); // Only run when sessions are first loaded
  
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
  
  // Handler for moving all tasks from one folder to another
  const handleMoveAllTasks = (targetFolderId: string) => {
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
          // Increment task counter first
          dispatch(incrementTaskCounter());
          const nextTaskNumber = taskCounter + 1;
          const duplicateTitle = `Task ${nextTaskNumber} (Copy)`;
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

  // Add folder-specific new task handler
  const handleNewTaskInFolder = async (folderId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    try {
      // Increment task counter first
      dispatch(incrementTaskCounter());
      const nextTaskNumber = taskCounter + 1;
      const defaultTitle = `Task ${nextTaskNumber}`;
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

  const handleNewTask = async () => {
    try {
      // Check if there are any folders, and create a default one if not
      if (folders.length === 0) {
        dispatch(createFolder("Default"));
        // Wait a bit for the folder to be created
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const now = new Date();
      // Increment task counter first
      dispatch(incrementTaskCounter());
      const nextTaskNumber = taskCounter + 1;
      const defaultTitle = `Task ${nextTaskNumber}`;
      const result = await createSession({ title: defaultTitle }).unwrap();
      const newId = result.session_id;
      
      // Increment task counter after successful creation
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
    const sessionTitle = session.title || `Task ${new Date(session.createdAt).toLocaleDateString()}`;
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
            (theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.05)) : 
            'transparent',
          borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.primary.main, 0.08),
            transform: 'translateX(2px)',
            borderLeftColor: isActive ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.3),
          },
          '&.Mui-selected': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.primary.main, 0.05),
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.primary.main, 0.08),
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
          color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
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
            {/* Add New Task to Folder Button */}
            <Tooltip title="New task in this folder" PopperProps={{ sx: { zIndex: 1400 } }}>
              <IconButton
                size="small"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleNewTaskInFolder(folder.id, e)}
                sx={{
                  opacity: 0.8,
                  color: theme.palette.primary.main,
                  '&:hover': { 
                    opacity: 1,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 179, 0, 0.12)' 
                      : 'rgba(255, 179, 0, 0.08)',
                  },
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
                  color="primary"
                  size="small"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={() => handleNewTaskInFolder(folder.id)}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    py: 0.5,
                    minWidth: 0,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 179, 0, 0.12)' 
                        : 'rgba(255, 179, 0, 0.08)',
                    }
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
            position: 'fixed', // Fixed positioning for full height
            top: 0, // Start from the very top
            left: 0,
            height: '100vh',
            zIndex: 1400, // Ensure it's above AppBar
            transition: 'none',
          }}
        >
          <StyledDrawer
            variant="permanent"
            anchor="left"
            sx={{
              width: currentWidth,
              flexShrink: 0,
              zIndex: 1400, // Higher than AppBar to ensure it's on top
              '& .MuiDrawer-paper': {
                width: currentWidth,
                boxSizing: 'border-box',
                height: '100vh',
                top: 0, // Start from the very top
                position: 'fixed', // Fixed positioning to ensure full height
                border: 'none',
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(145deg, #2a1f00 0%, #1a1200 100%), linear-gradient(90deg, rgba(255, 179, 0, 0.05) 0%, transparent 100%)' 
                  : 'linear-gradient(165deg, #FFF8E1 0%, #FFECB3 60%, #FFE082 100%)',
                backdropFilter: 'blur(16px) saturate(1.8)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '4px 0 24px rgba(255, 145, 0, 0.2), 0 8px 32px rgba(255, 179, 0, 0.15)'
                  : '8px 0 32px rgba(0, 0, 0, 0.2), 0 0 24px rgba(0, 0, 0, 0.15), inset 2px 0 0 rgba(255, 255, 255, 0.8)',
                borderRight: 'none',
                transition: theme.transitions.create(['width', 'box-shadow', 'transform'], {
                  easing: theme.transitions.easing.easeOut,
                  duration: '0.3s',
                }),
                overflowX: 'hidden',
                transformStyle: 'preserve-3d',
                // Enhanced inner glow and depth - always visible
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(255, 200, 0, 0.08) 0%, transparent 60%)'
                    : 'linear-gradient(90deg, rgba(255, 248, 225, 0.6) 0%, rgba(255, 236, 179, 0.4) 60%, rgba(255, 224, 130, 0.2) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                },
                // Shadow only, no edge highlight
                '&::after': {
                  content: 'none',
                },
                // Enhanced hover expansion for collapsed state
                ...(isCollapsed && {
                  zIndex: 1400, // Keep same z-index when collapsed
                  '&:hover': {
                    width: 280,
                    boxShadow: theme.palette.mode === 'dark'
                      ? `8px 0 32px rgba(0, 0, 0, 0.6), 0 16px 48px rgba(0, 0, 0, 0.4)`
                      : `
                          20px 0 70px rgba(0, 0, 0, 0.2), 
                          10px 0 35px rgba(0, 0, 0, 0.15),
                          inset 2px 0 0 rgba(255, 255, 255, 0.7)
                        `,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(18, 18, 18, 0.98)'
                      : 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(50px) saturate(1.4)',
                    transform: 'translateX(0) translateZ(25px)',
                    transition: theme.transitions.create(['width', 'box-shadow', 'transform', 'background-color'], {
                      easing: theme.transitions.easing.easeOut,
                      duration: '0.4s',
                    }),
                  }
                }),
                // Remove duplicate pseudo-elements - using only the enhanced versions above
              },
            }}
          >
            {/* Header with animated Logo - show when sidebar is NOT collapsed OR when collapsed and hovered */}
            {(!isCollapsed || (isCollapsed && isHovered)) && (
              <Box sx={{ 
                px: 2, 
                pt: 1, 
                pb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)',
                minHeight: 48,
                transition: 'all 0.3s ease',
              }}>
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
                      interactive={false}
                      animated={false}
                      onClick={handleLogoClick}
                      aria-label="Return to home page"
                    />
                  </Box>
                </motion.div>
              </Box>
            )}

            {/* Collapsed state icon at top */}
            {isCollapsed && !isHovered && (
              <Box sx={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
              }}>
                <Tooltip title="AgentHive" placement="right">
                  <Box
                    onClick={handleLogoClick}
                    sx={{
                      fontSize: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    🐝
                  </Box>
                </Tooltip>
              </Box>
            )}

            {/* Folder management - Show when expanded OR when collapsed and hovered */}
            <AnimatePresence>
              {(!isCollapsed || (isCollapsed && isHovered)) && (
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
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)',
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      Tasks
                    </Typography>
                    <Tooltip title="New Task" PopperProps={{ sx: { zIndex: 1400 } }}>
                      <IconButton 
                        size="small" 
                        onClick={() => setFolderDialogOpen(true)}
                        sx={{ 
                          color: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          borderRadius: 2,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.1)})`,
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                          },
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.15),
                            borderColor: alpha(theme.palette.primary.main, 0.4),
                            transform: 'translateY(-1px) scale(1.05)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                            '&:before': {
                              opacity: 1,
                            },
                          }
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
                <Box sx={{ mt: 2, mb: 3, px: isExpanded ? 2 : 0 }}>
                  {isExpanded && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary, 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        textTransform: 'none',
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      Pinned Tasks
                    </Typography>
                  )}
                  <List dense sx={{ mt: isCollapsed && !isHovered ? 0 : 0.5, px: isExpanded ? undefined : 0, textAlign: isExpanded ? undefined : 'center' }}>
                    {pinnedSessions.map(session => renderSessionItem(session))}
                  </List>
                </Box>
              )}
              
              {sessionsLoading && sessions.length === 0 && (
                <Box sx={{ px: isExpanded ? 2 : 1, pt: 2 }}>
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <Skeleton 
                      key={idx} 
                      variant="rectangular" 
                      height={isExpanded ? 32 : 24} 
                      sx={{ 
                        mb: 1, 
                        borderRadius: 1, 
                        bgcolor: theme.palette.mode === 'dark' ? '#2e2e2e' : '#e0e0e0',
                        mx: isExpanded ? 0 : 'auto',
                        width: isExpanded ? '100%' : 40,
                        transition: 'all 0.3s ease'
                      }} 
                    />
                  ))}
                </Box>
              )}
              
              {sessions.length > 0 && (
                <Box sx={{ mt: isExpanded ? 0 : 2, px: isExpanded ? 2 : 0 }}>
                {folders.length > 0 ? (
                  folders.map(folder => renderFolderSection(folder))
                ) : (
                  isExpanded && (
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
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        No tasks available
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<CreateNewFolderOutlinedIcon fontSize="small" />}
                        onClick={() => setFolderDialogOpen(true)}
                        sx={{
                          mt: 1,
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          background: theme.palette.primary.main,
                          color: 'white',
                          '&:hover': {
                            background: theme.palette.primary.dark,
                          }
                        }}
                      >
                        Create Task
                      </Button>
                    </Box>
                  )
                )}
              </Box>
              )}
            </Box>

            {/* New Task Button - Enterprise FAB for collapsed state, button for expanded state */}
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
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={handleNewTask}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    justifyContent: 'center',
                    width: '100%',
                    py: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: theme.palette.primary.contrastText,
                    borderRadius: 2,
                    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(45deg, transparent 30%, ${alpha('#fff', 0.1)} 50%, transparent 70%)`,
                      transform: 'translateX(-100%)',
                      transition: 'transform 0.6s ease',
                    },
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                      transform: 'translateY(-2px)',
                      '&:before': {
                        transform: 'translateX(100%)',
                      },
                    },
                  }}
                >
                  New Task
                </Button>
              ) : (
                <EnterpriseFloatingActionButton
                  icon={<AddIcon />}
                  tooltip="New Task"
                  colorVariant="primary"
                  onClick={handleNewTask}
                  size="medium"
                />
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
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                  <PushPinOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={sessions.find(s => s.id === selectedSessionId)?.pinned ? "Unpin" : "Pin"}
                />
              </MenuItem>
              
              <MenuItem onClick={handleRenameSession}>
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                  <EditOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Rename" />
              </MenuItem>
              
              <MenuItem onClick={handleDuplicateSession}>
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
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
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                  <DeleteOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Clear tasks" />
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
                          ? alpha(theme.palette.primary.main, 0.15)
                          : alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28, color: theme.palette.primary.main }}>
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
                  ? alpha(theme.palette.primary.main, 0.2)
                  : alpha(theme.palette.primary.main, 0.1)
              }} />
              
              <MenuItem 
                onClick={handleDeleteSession} 
                sx={{ 
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                  }
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.error.main }}>
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
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.primary.main, 0.05),
                  }
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
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
                      ? alpha(theme.palette.primary.main, 0.15)
                      : alpha(theme.palette.primary.main, 0.05),
                  },
                  '&.Mui-disabled': {
                    color: alpha(theme.palette.primary.main, 0.4),
                  }
                }}
              >
                <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                  <FolderIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="                  Move all tasks to" />
              </MenuItem>
              
              <MenuItem 
                onClick={handleOpenDeleteFolder} 
                sx={{ 
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                  },
                  '&.Mui-disabled': {
                    color: alpha(theme.palette.error.main, 0.4),
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
              sx={{ zIndex: 1500 }}
              PaperProps={{
                elevation: 0,
                sx: {
                  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                  borderRadius: 1.5,
                  minWidth: 180,
                  overflow: 'visible',
                  mt: 1.5,
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
              {folders
                .filter(folder => folder.id !== selectedFolderId)
                .map(folder => (
                  <MenuItem 
                    key={folder.id} 
                    onClick={() => handleMoveAllTasks(folder.id)}
                    dense
                    sx={{
                      pl: 2,
                      fontSize: '0.85rem',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark'
                          ? alpha(theme.palette.primary.main, 0.15)
                          : alpha(theme.palette.primary.main, 0.05),
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28, color: theme.palette.primary.main }}>
                      <FolderIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={folder.name} />
                  </MenuItem>
                ))}
            </Menu>
            
            {/* New Folder Dialog */}
            <ThemedDialog 
              open={folderDialogOpen} 
              onClose={() => setFolderDialogOpen(false)}
              maxWidth="xs"
              fullWidth
              sx={{ zIndex: 1400 }}
            >
              <DialogTitle>New Folder</DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Folder Name"
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
              <DialogTitle>Rename Folder</DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Folder Name"
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
              <DialogTitle>Rename Task</DialogTitle>
              <DialogContent sx={{ pt: 2 }}>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Task Name"
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
                      Tasks in this session will be moved to another available session.
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
                  height:  28,
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
                  <IconButton
                    onClick={toggleSidebar}
                    size="small"
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.action.hover, 0.1),
                      },
                    }}
                  >
                    {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                  </IconButton>
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