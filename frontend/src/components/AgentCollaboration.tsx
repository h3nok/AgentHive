import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Avatar, 
  useTheme, 
  IconButton, 
  Collapse, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemButton,
  Button,
  Divider,
  Tooltip,
  Badge
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CodeIcon from '@mui/icons-material/Code';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import StorageIcon from '@mui/icons-material/Storage';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

// Agent definitions
const agents = [
  {
    id: "lease",
    name: "Lease Agent",
    description: "Specialized in lease analysis and document management",
    icon: <DescriptionIcon />,
    color: "#c8102e", // Red
    avatarBg: "white",
    emoji: "🚜",
    capabilities: [
      "Document analysis",
      "Contract review",
      "Data extraction",
      "Financial interpretation"
    ]
  },
  {
    id: "coder",
    name: "Code Assistant",
    description: "Specialized in programming and technical solutions",
    icon: <CodeIcon />,
    color: "#8250DF", // Purple
    avatarBg: "white",
    emoji: "👨‍💻",
    capabilities: [
      "Code generation",
      "Debugging",
      "Technical concepts",
      "Documentation"
    ]
  },
  {
    id: "analyst",
    name: "Data Analyst",
    description: "Specialized in data analysis and visualization",
    icon: <AnalyticsIcon />,
    color: "#2E7D32", // Green
    avatarBg: "white",
    emoji: "📊",
    capabilities: [
      "Data transformation",
      "Statistical analysis",
      "Chart creation",
      "Pattern recognition"
    ]
  },
  {
    id: "database",
    name: "Database Expert",
    description: "Specialized in database operations and queries",
    icon: <StorageIcon />,
    color: "#0288D1", // Blue
    avatarBg: "white",
    emoji: "💾",
    capabilities: [
      "SQL writing",
      "Database design",
      "Query optimization",
      "Data modeling"
    ]
  },
  {
    id: "general",
    name: "General Assistant",
    description: "Can answer questions on a wide range of topics",
    icon: <SmartToyIcon />,
    color: "#1976d2", // MUI blue
    avatarBg: "white",
    emoji: "🤖",
    capabilities: [
      "Knowledge base",
      "Creative thinking",
      "Problem solving",
      "Research assistance"
    ]
  }
];

// Agent collaboration workflows
const collaborationWorkflows = [
  {
    id: "doc-to-code",
    name: "Document to Code",
    description: "Extract information from documents and generate code",
    agents: ["lease", "coder"],
    steps: [
      { agent: "lease", description: "Extract structured data from documents" },
      { agent: "coder", description: "Generate code based on extracted data" }
    ]
  },
  {
    id: "data-analysis",
    name: "Complete Data Analysis",
    description: "Analyze data, create visualizations, and store in database",
    agents: ["analyst", "database", "coder"],
    steps: [
      { agent: "analyst", description: "Perform statistical analysis" },
      { agent: "coder", description: "Create visualization code" },
      { agent: "database", description: "Create database schema for results" }
    ]
  },
  {
    id: "requirements-to-app",
    name: "Requirements to App",
    description: "Convert business requirements to a working application",
    agents: ["general", "coder", "database"],
    steps: [
      { agent: "general", description: "Analyze business requirements" },
      { agent: "database", description: "Design data model" },
      { agent: "coder", description: "Generate application code" }
    ]
  }
];

interface AgentCollaborationProps {
  onWorkflowSelect: (workflow: any) => void;
  onAgentSelect: (agentId: string) => void;
}

const AgentCollaboration: React.FC<AgentCollaborationProps> = ({ onWorkflowSelect, onAgentSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const theme = useTheme();
  const mode = theme.palette.mode;
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleWorkflowSelect = (workflowId: string) => {
    setSelectedWorkflow(workflowId);
    const workflow = collaborationWorkflows.find(w => w.id === workflowId);
    if (workflow) {
      onWorkflowSelect(workflow);
    }
  };
  
  const handleAgentClick = (agentId: string) => {
    onAgentSelect(agentId);
  };
  
  // Find the selected workflow
  const currentWorkflow = collaborationWorkflows.find(w => w.id === selectedWorkflow);
  
  return (
    <Box sx={{ mb: 3 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }}
      >
        {/* Collaboration header - always visible */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderBottom: expanded ? '1px solid' : 'none',
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            cursor: 'pointer',
          }}
          onClick={handleToggleExpand}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: '#1976d2',
                width: 32,
                height: 32,
                mr: 1.5,
              }}
            >
              <GroupWorkIcon fontSize="small" />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={500}>
              Agent Collaboration
            </Typography>
            
            {/* If a workflow is selected, show it as a chip */}
            {selectedWorkflow && (
              <Chip
                label={currentWorkflow?.name || ""}
                size="small"
                sx={{ 
                  ml: 1.5,
                  borderRadius: 1,
                  bgcolor: mode === 'dark' ? 'rgba(25,118,210,0.15)' : 'rgba(25,118,210,0.1)',
                  border: '1px solid',
                  borderColor: 'rgba(25,118,210,0.3)',
                }}
              />
            )}
          </Box>
          
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand();
            }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        {/* Expandable collaboration content */}
        <Collapse in={expanded}>
          <Box sx={{ p: 2 }}>
            {!selectedWorkflow ? (
              <>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Select a collaboration workflow or create a custom agent sequence for multi-step processing.
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Collaboration Workflows
                </Typography>
                
                <List disablePadding>
                  {collaborationWorkflows.map((workflow) => (
                    <ListItem 
                      key={workflow.id} 
                      disablePadding
                      sx={{ mb: 1 }}
                    >
                      <ListItemButton
                        onClick={() => handleWorkflowSelect(workflow.id)}
                        sx={{
                          border: '1px solid',
                          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          }
                        }}
                      >
                        <ListItemIcon>
                          <Box sx={{ display: 'flex' }}>
                            {workflow.agents.slice(0, 3).map((agentId, index) => {
                              const agent = agents.find(a => a.id === agentId);
                              return (
                                <Badge
                                  key={agentId}
                                  overlap="circular"
                                  anchorOrigin={{ 
                                    vertical: 'bottom', 
                                    horizontal: index === 0 ? 'right' : index === 2 ? 'left' : 'right'
                                  }}
                                  badgeContent={
                                    index < workflow.agents.length - 1 ? (
                                      <ArrowBadge direction="right" />
                                    ) : null
                                  }
                                >
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      bgcolor: agent?.color,
                                      fontSize: '0.8rem',
                                      ml: index > 0 ? -0.5 : 0,
                                      border: '2px solid',
                                      borderColor: mode === 'dark' ? '#121212' : '#fff',
                                    }}
                                  >
                                    {agent?.icon}
                                  </Avatar>
                                </Badge>
                              );
                            })}
                            
                            {workflow.agents.length > 3 && (
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  ml: -0.5,
                                  bgcolor: 'rgba(0,0,0,0.3)',
                                  fontSize: '0.7rem',
                                  border: '2px solid',
                                  borderColor: mode === 'dark' ? '#121212' : '#fff',
                                }}
                              >
                                +{workflow.agents.length - 3}
                              </Avatar>
                            )}
                          </Box>
                        </ListItemIcon>
                        
                        <ListItemText 
                          primary={workflow.name} 
                          secondary={workflow.description}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Available Agents
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {agents.map((agent) => (
                    <Chip
                      key={agent.id}
                      label={agent.name}
                      onClick={() => handleAgentClick(agent.id)}
                      avatar={
                        <Avatar sx={{ bgcolor: agent.color }}>
                          {agent.icon}
                        </Avatar>
                      }
                      sx={{
                        borderRadius: 2,
                        bgcolor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.9)',
                        border: '1px solid',
                        borderColor: `${agent.color}40`,
                        '&:hover': {
                          bgcolor: `${agent.color}15`,
                        }
                      }}
                    />
                  ))}
                </Box>
              </>
            ) : (
              // Show selected workflow details
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" color="primary">
                    {currentWorkflow?.name} Workflow
                  </Typography>
                  
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => setSelectedWorkflow(null)}
                    sx={{ borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {currentWorkflow?.description}
                </Typography>
                
                <Box
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    mb: 2,
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 1.5, 
                    bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    borderBottom: '1px solid',
                    borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }}>
                    <Typography variant="subtitle2">Workflow Process</Typography>
                  </Box>
                  
                  <List disablePadding>
                    {currentWorkflow?.steps.map((step, index) => {
                      const agent = agents.find(a => a.id === step.agent);
                      return (
                        <ListItem 
                          key={index}
                          sx={{ 
                            py: 1,
                            borderBottom: index < (currentWorkflow?.steps.length || 0) - 1 ? '1px dashed' : 'none',
                            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: agent?.color,
                                fontSize: '0.8rem',
                              }}
                            >
                              {agent?.icon}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight={500}>
                                  Step {index + 1}: {agent?.name}
                                </Typography>
                              </Box>
                            }
                            secondary={step.description}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
                
                <Button
                  variant="contained"
                  fullWidth
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Start Collaboration
                </Button>
              </>
            )}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

// Custom arrow badge for workflow visualization
const ArrowBadge = ({ direction }: { direction: 'left' | 'right' }) => {
  const theme = useTheme();
  const mode = theme.palette.mode;
  
  return (
    <Box
      sx={{
        width: 14,
        height: 14,
        bgcolor: mode === 'dark' ? '#333' : '#ddd',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid',
        borderColor: mode === 'dark' ? '#121212' : '#fff',
      }}
    >
      <Box
        component="span"
        sx={{
          fontSize: '8px',
          lineHeight: 1,
          transform: direction === 'left' ? 'rotate(180deg)' : 'none'
        }}
      >
        →
      </Box>
    </Box>
  );
};

export default AgentCollaboration; 