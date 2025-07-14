import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Button,
  Collapse
} from '@mui/material';
import {
  PersonAdd,
  Payment,
  Support,
  QuestionAnswer,
  Security,
  ExpandMore,
  ExpandLess,
  AutoAwesome,
  Business,
  Assignment
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { AgentType } from '../../shared/types/agent';

interface AgentInfo {
  type: AgentType;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  emoji: string;
  capabilities: string[];
  quickActions: string[];
}

const ENTERPRISE_AGENTS: AgentInfo[] = [
  {
    type: AgentType.HR,
    name: "HR Assistant",
    description: "Employee support, benefits, time-off, and HR policies",
    icon: <PersonAdd />,
    color: "#4CAF50",
    emoji: "👥",
    capabilities: ["Benefits Inquiry", "PTO Management", "Policy Guidance", "Onboarding"],
    quickActions: ["Check PTO balance", "Submit time-off request", "Benefits enrollment", "Employee handbook"]
  },
  {
    type: AgentType.FINANCE,
    name: "Finance Assistant",
    description: "Expense reports, budgets, reimbursements, and financial policies",
    icon: <Payment />,
    color: "#2196F3",
    emoji: "💰",
    capabilities: ["Expense Reports", "Budget Inquiry", "Reimbursements", "Invoice Processing"],
    quickActions: ["Submit expense report", "Check budget status", "Track reimbursement", "Financial policies"]
  },
  {
    type: AgentType.IT,
    name: "IT Support",
    description: "Technical support, password resets, and system access",
    icon: <Security />,
    color: "#FF9800",
    emoji: "🔧",
    capabilities: ["Password Reset", "Software Requests", "Technical Support", "Account Access"],
    quickActions: ["Reset password", "Request software", "Report technical issue", "Access permissions"]
  },
  {
    type: AgentType.SUPPORT,
    name: "General Support",
    description: "Customer service and general business support",
    icon: <Support />,
    color: "#9C27B0",
    emoji: "🎧",
    capabilities: ["Issue Resolution", "Customer Service", "Process Guidance", "Escalation"],
    quickActions: ["Report an issue", "General inquiry", "Process help", "Contact support"]
  },
  {
    type: AgentType.GENERAL,
    name: "General Assistant",
    description: "General questions and conversational assistance",
    icon: <QuestionAnswer />,
    color: "#607D8B",
    emoji: "💬",
    capabilities: ["General Q&A", "Information", "Guidance", "Conversation"],
    quickActions: ["Ask a question", "Get help", "General guidance", "Chat"]
  }
];

interface EnterpriseAgentSelectorProps {
  onAgentSelect?: (agentType: AgentType) => void;
  onQuickActionSelect?: (action: string, agentType: AgentType) => void;
  selectedAgent?: AgentType;
  compact?: boolean;
}

const EnterpriseAgentSelector: React.FC<EnterpriseAgentSelectorProps> = ({
  onAgentSelect,
  onQuickActionSelect,
  selectedAgent,
  compact = false
}) => {
  const theme = useTheme();
  const [expandedAgent, setExpandedAgent] = useState<AgentType | null>(null);
  const [showAllAgents, setShowAllAgents] = useState(false);

  const visibleAgents = showAllAgents ? ENTERPRISE_AGENTS : ENTERPRISE_AGENTS.slice(0, 3);

  const handleAgentClick = (agentType: AgentType) => {
    if (expandedAgent === agentType) {
      setExpandedAgent(null);
    } else {
      setExpandedAgent(agentType);
      onAgentSelect?.(agentType);
    }
  };

  const handleQuickActionClick = (action: string, agentType: AgentType) => {
    onQuickActionSelect?.(action, agentType);
  };

  if (compact) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
          🤖 Available Assistants
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {ENTERPRISE_AGENTS.map((agent) => (
            <Chip
              key={agent.type}
              label={agent.name}
              avatar={<Avatar sx={{ bgcolor: agent.color, width: 24, height: 24 }}>{agent.emoji}</Avatar>}
              onClick={() => onAgentSelect?.(agent.type)}
              variant={selectedAgent === agent.type ? "filled" : "outlined"}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(agent.color, 0.1),
                  borderColor: agent.color,
                },
                ...(selectedAgent === agent.type && {
                  backgroundColor: alpha(agent.color, 0.15),
                  borderColor: agent.color,
                  color: agent.color,
                })
              }}
            />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Enterprise Assistants
          </Typography>
        </Box>
        <Chip
          label={`${ENTERPRISE_AGENTS.length} Available`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 2
        }}
      >
        {visibleAgents.map((agent) => (
          <motion.div
            key={agent.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `2px solid ${
                    selectedAgent === agent.type || expandedAgent === agent.type
                      ? agent.color
                      : 'transparent'
                  }`,
                  backgroundColor: selectedAgent === agent.type
                    ? alpha(agent.color, 0.05)
                    : theme.palette.background.paper,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${alpha(agent.color, 0.2)}`,
                    borderColor: agent.color,
                  },
                }}
                onClick={() => handleAgentClick(agent.type)}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: agent.color,
                        color: 'white',
                        width: 48,
                        height: 48,
                        fontSize: '1.5rem',
                      }}
                    >
                      {agent.emoji}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: agent.color }}>
                          {agent.name}
                        </Typography>
                        <IconButton
                          size="small"
                          sx={{
                            color: agent.color,
                            transform: expandedAgent === agent.type ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s',
                          }}
                        >
                          <ExpandMore />
                        </IconButton>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: 1,
                          lineHeight: 1.4,
                        }}
                      >
                        {agent.description}
                      </Typography>
                      
                      {/* Capabilities */}
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {agent.capabilities.slice(0, 2).map((capability) => (
                          <Chip
                            key={capability}
                            label={capability}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              borderColor: alpha(agent.color, 0.3),
                              color: agent.color,
                            }}
                          />
                        ))}
                        {agent.capabilities.length > 2 && (
                          <Chip
                            label={`+${agent.capabilities.length - 2} more`}
                            size="small"
                            variant="filled"
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              bgcolor: alpha(agent.color, 0.1),
                              color: agent.color,
                            }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Box>

                  {/* Expanded Quick Actions */}
                  <Collapse in={expandedAgent === agent.type}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(agent.color, 0.1)}` }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: agent.color, fontWeight: 600 }}>
                        Quick Actions
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: 1
                        }}
                      >
                        {agent.quickActions.map((action) => (
                          <Button
                            key={action}
                            variant="outlined"
                            size="small"
                            fullWidth
                            startIcon={<Assignment />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickActionClick(action, agent.type);
                            }}
                            sx={{
                              borderColor: alpha(agent.color, 0.3),
                              color: agent.color,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              py: 0.5,
                              '&:hover': {
                                borderColor: agent.color,
                                backgroundColor: alpha(agent.color, 0.05),
                              },
                            }}
                          >
                            {action}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </motion.div>
        ))}
      </Box>

      {/* Show More/Less Button */}
      {ENTERPRISE_AGENTS.length > 3 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowAllAgents(!showAllAgents)}
            startIcon={showAllAgents ? <ExpandLess /> : <ExpandMore />}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            {showAllAgents ? 'Show Less' : `Show All ${ENTERPRISE_AGENTS.length} Assistants`}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default EnterpriseAgentSelector;
