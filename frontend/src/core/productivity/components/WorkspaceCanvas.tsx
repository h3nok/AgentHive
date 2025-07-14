/**
 * WorkspaceCanvas - Visual workspace for multi-agent collaboration
 * 
 * This component provides a canvas-like interface where users can:
 * - Drag and drop tasks, documents, and data sources
 * - Visually connect agents to specific workflows
 * - See real-time progress on multiple simultaneous tasks
 * - Create workflow templates that can be reused
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Fab,
  Menu,
  MenuItem,
  Chip,
  Avatar,
  Stack,
  Card,
  CardContent,
  useTheme,
  alpha,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  DragIndicator as DragIcon,
  Link as ConnectIcon,
  PlayArrow as RunIcon,
  Save as SaveIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
  Settings as ConfigIcon,
  Close as CloseIcon,
  AutoAwesome as AIIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentType } from '../../../shared/types/agent';

interface WorkspaceNode {
  id: string;
  type: 'agent' | 'task' | 'document' | 'data_source' | 'workflow';
  title: string;
  agentType?: AgentType;
  status: 'idle' | 'running' | 'completed' | 'error';
  position: { x: number; y: number };
  size: { width: number; height: number };
  connections: string[]; // IDs of connected nodes
  config?: Record<string, any>;
  data?: any;
}

interface WorkspaceConnection {
  id: string;
  from: string;
  to: string;
  type: 'data_flow' | 'dependency' | 'trigger';
  status: 'active' | 'inactive';
}

const WorkspaceCanvas: React.FC = () => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes] = useState<WorkspaceNode[]>([]);
  const [connections, setConnections] = useState<WorkspaceConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
  const [configDialog, setConfigDialog] = useState<string | null>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Add new node to canvas
  const addNode = useCallback((type: WorkspaceNode['type'], agentType?: AgentType) => {
    const newNode: WorkspaceNode = {
      id: `node-${Date.now()}`,
      type,
      title: `New ${type}`,
      agentType,
      status: 'idle',
      position: { x: 200, y: 200 },
      size: { width: 200, height: 120 },
      connections: []
    };
    setNodes(prev => [...prev, newNode]);
    setAddMenuAnchor(null);
  }, []);

  // Node dragging logic
  const handleNodeDrag = useCallback((nodeId: string, deltaX: number, deltaY: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, position: { x: node.position.x + deltaX, y: node.position.y + deltaY } }
        : node
    ));
  }, []);

  // Execute workflow
  const executeWorkflow = useCallback(() => {
    // Implement workflow execution logic
    console.log('Executing workspace workflow...', { nodes, connections });
  }, [nodes, connections]);

  // Save workspace template
  const saveTemplate = useCallback(() => {
    const template = { nodes, connections, name: 'Workspace Template' };
    console.log('Saving workspace template:', template);
  }, [nodes, connections]);

  const renderNode = (node: WorkspaceNode) => (
    <motion.div
      key={node.id}
      drag
      dragMomentum={false}
      onDrag={(_, info) => handleNodeDrag(node.id, info.delta.x, info.delta.y)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        cursor: 'grab',
        zIndex: selectedNode === node.id ? 10 : 1
      }}
    >
      <Card
        sx={{
          width: '100%',
          height: '100%',
          border: selectedNode === node.id ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
          bgcolor: getNodeColor(node.type, node.status),
          '&:hover': {
            boxShadow: theme.shadows[4]
          }
        }}
        onClick={() => setSelectedNode(node.id)}
      >
        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {node.title}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={() => setConfigDialog(node.id)}>
                <ConfigIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <DragIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Chip 
              size="small" 
              label={node.type}
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            {node.agentType && (
              <Chip 
                size="small" 
                label={node.agentType}
                color="primary"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 'auto' }}>
            <Chip 
              size="small" 
              label={node.status}
              color={getStatusColor(node.status)}
              sx={{ fontSize: '0.7rem' }}
            />
            {node.connections.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {node.connections.length} connections
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );

  const getNodeColor = (type: string, status: string) => {
    const baseColors: Record<string, string> = {
      agent: theme.palette.primary.main,
      task: theme.palette.success.main,
      document: theme.palette.info.main,
      data_source: theme.palette.warning.main,
      workflow: theme.palette.secondary.main
    };
    
    const opacity = status === 'running' ? 0.8 : status === 'completed' ? 0.3 : 0.1;
    return alpha(baseColors[type] || theme.palette.grey[500], opacity);
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'running': return 'primary';
      case 'completed': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Canvas Header */}
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: 60, 
        bgcolor: 'background.paper', 
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2
      }}>
        <Typography variant="h6" fontWeight={600}>
          Workspace Canvas
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<ImportIcon />} size="small">Import</Button>
          <Button startIcon={<SaveIcon />} size="small" onClick={saveTemplate}>Save</Button>
          <Button startIcon={<RunIcon />} size="small" variant="contained" onClick={executeWorkflow}>
            Execute
          </Button>
        </Stack>
      </Box>

      {/* Canvas Area */}
      <Box
        ref={canvasRef}
        sx={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: alpha(theme.palette.grey[100], 0.3),
          backgroundImage: `radial-gradient(${alpha(theme.palette.primary.main, 0.1)} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          overflow: 'auto',
          cursor: draggedNode ? 'grabbing' : 'default'
        }}
      >
        <AnimatePresence>
          {nodes.map(renderNode)}
        </AnimatePresence>

        {/* Add Node FAB */}
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={(e) => setAddMenuAnchor(e.currentTarget)}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Add Node Menu */}
      <Menu
        anchorEl={addMenuAnchor}
        open={Boolean(addMenuAnchor)}
        onClose={() => setAddMenuAnchor(null)}
      >
        <MenuItem onClick={() => addNode('agent', AgentType.HR)}>
          <Avatar sx={{ mr: 2, bgcolor: theme.palette.primary.main }}>
            <AIIcon />
          </Avatar>
          HR Agent
        </MenuItem>
        <MenuItem onClick={() => addNode('agent', AgentType.FINANCE)}>
          <Avatar sx={{ mr: 2, bgcolor: theme.palette.success.main }}>
            <AIIcon />
          </Avatar>
          Finance Agent
        </MenuItem>
        <MenuItem onClick={() => addNode('agent', AgentType.IT)}>
          <Avatar sx={{ mr: 2, bgcolor: theme.palette.info.main }}>
            <AIIcon />
          </Avatar>
          IT Agent
        </MenuItem>
        <MenuItem onClick={() => addNode('task')}>Task</MenuItem>
        <MenuItem onClick={() => addNode('document')}>Document</MenuItem>
        <MenuItem onClick={() => addNode('data_source')}>Data Source</MenuItem>
        <MenuItem onClick={() => addNode('workflow')}>Workflow</MenuItem>
      </Menu>

      {/* Node Configuration Dialog */}
      <Dialog open={Boolean(configDialog)} onClose={() => setConfigDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Node</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="Node Title" fullWidth />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status">
                <MenuItem value="idle">Idle</MenuItem>
                <MenuItem value="running">Running</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => setConfigDialog(null)}>Cancel</Button>
              <Button variant="contained" onClick={() => setConfigDialog(null)}>Save</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default WorkspaceCanvas;
