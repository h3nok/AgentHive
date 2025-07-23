/**
 * Enhanced Workflow Visualization Component
 * 
 * Comprehensive workflow visualization with step cards, agent thinking display,
 * and real-time metrics for enterprise users.
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Timeline,
  Analytics,
  Psychology
} from '@mui/icons-material';
import { WorkflowVisualizationProps } from '../types';

import WorkflowMetricsDashboard from './WorkflowMetricsDashboard';
import EnhancedWorkflowAnimations from './EnhancedWorkflowAnimations';
import RealTimeAgentThinking from './RealTimeAgentThinking';

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({
  workflow,
  interactive = true,
  showMetrics = true,
  onPause,
  onResume,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const isThinking = workflow.status === 'executing';

  // Mock agent for thinking display
  const mockAgent = {
    id: 'hr-agent-enhanced',
    name: 'HR Assistant',
    type: 'hr' as const,
    framework: 'langchain' as const,
    avatar: '👥',
    status: 'active' as const,
    capabilities: ['employee_data', 'policy_search'],
    description: 'Enhanced HR agent',
    performance: { avgResponseTime: 1.2, successRate: 0.96, totalRequests: 1247 },
    metadata: { version: '2.0', lastActive: new Date(), specializations: ['Benefits'] }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.light' }}>
              <Timeline />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {workflow.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workflow.description}
              </Typography>
            </Box>
          </Stack>
          
          {interactive && (
            <Stack direction="row" spacing={1}>
              {workflow.status === 'executing' && (
                <Button
                  startIcon={<Pause />}
                  onClick={() => onPause?.()}
                  variant="outlined"
                  size="small"
                >
                  Pause
                </Button>
              )}
              
              {workflow.status === 'paused' && (
                <Button
                  startIcon={<PlayArrow />}
                  onClick={() => onResume?.()}
                  variant="contained"
                  size="small"
                >
                  Resume
                </Button>
              )}
              
              <Button
                startIcon={<Stop />}
                onClick={() => onCancel?.()}
                variant="outlined"
                color="error"
                size="small"
              >
                Cancel
              </Button>
            </Stack>
          )}
        </Stack>
        
        {/* Progress */}
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress: {workflow.progress.overall}%
            </Typography>
            <Chip
              label={workflow.status}
              size="small"
              color={
                workflow.status === 'completed' ? 'success' :
                workflow.status === 'executing' ? 'warning' :
                workflow.status === 'error' ? 'error' : 'default'
              }
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={workflow.progress.overall}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Steps" icon={<Timeline />} />
          <Tab label="Agent Thinking" icon={<Psychology />} />
          <Tab label="Metrics" icon={<Analytics />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && (
          <EnhancedWorkflowAnimations
            steps={workflow.steps.map(step => ({
              id: step.id,
              name: step.name,
              status: step.status as 'pending' | 'active' | 'completed' | 'error',
              progress: step.progress || 0,
              duration: (step as any).estimatedDuration || 0,
              agent: (step as any).assignedAgent || 'AI Agent',
              tools: (step as any).toolsUsed || []
            }))}
            currentStep={workflow.steps.find(s => s.status === 'active')?.id}
            isThinking={isThinking}
            showProgress={showMetrics}
            onStepClick={(stepId) => console.log('Step clicked:', stepId)}
          />
        )}
        
        {activeTab === 1 && (
          <RealTimeAgentThinking
            agentName={mockAgent.name}
            agentAvatar={mockAgent.avatar}
            currentThought="Analyzing employee onboarding data and preparing compliance report..."
            thoughts={[
              {
                id: '1',
                text: 'Retrieving employee data from HR system',
                timestamp: new Date(Date.now() - 30000),
                confidence: 0.9,
                type: 'tool_selection'
              },
              {
                id: '2', 
                text: 'Analyzing compliance requirements for new hire documentation',
                timestamp: new Date(Date.now() - 15000),
                confidence: 0.85,
                type: 'reasoning'
              },
              {
                id: '3',
                text: 'Preparing comprehensive onboarding report with policy recommendations',
                timestamp: new Date(),
                confidence: 0.92,
                type: 'decision'
              }
            ]}
            tools={[
              { name: 'HR Database', purpose: 'Employee data retrieval', confidence: 0.95, status: 'completed' },
              { name: 'Policy Engine', purpose: 'Compliance checking', confidence: 0.88, status: 'executing' },
              { name: 'Report Generator', purpose: 'Document creation', confidence: 0.82, status: 'considering' }
            ]}
            metrics={{
              tokensUsed: 1247,
              cost: 0.0234,
              responseTime: 1200,
              memoryUsage: 45
            }}
            isThinking={isThinking}
            confidence={0.87}
            expanded={false}
            onExpand={() => console.log('Agent thinking expanded')}
          />
        )}
        
        {activeTab === 2 && showMetrics && (
          <WorkflowMetricsDashboard
            workflow={workflow}
            realTimeUpdates={workflow.status === 'executing'}
          />
        )}
      </Box>
    </Box>
  );
};

export default WorkflowVisualization;
