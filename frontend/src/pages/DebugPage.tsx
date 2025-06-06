import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAppSelector, useAppDispatch, selectTheme } from '../store';
import { mockApi } from '../features/chat/mockApi';
import { useListSessionsQuery, useCreateSessionMutation } from '../features/chat/sessionsApi';
import { useAgentQueryMutation } from '../features/chat/chatApi';

interface HealthStatus {
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
}

const DebugPage: React.FC = () => {
  const theme = useAppSelector(selectTheme);
  const dispatch = useAppDispatch();

  // Health check states
  const [frontendHealth, setFrontendHealth] = useState<HealthStatus>({ status: 'loading' });
  const [backendHealth, setBackendHealth] = useState<HealthStatus>({ status: 'loading' });
  const [apiHealth, setApiHealth] = useState<HealthStatus>({ status: 'loading' });
  const [sessionTest, setSessionTest] = useState<HealthStatus>({ status: 'loading' });
  const [chatTest, setChatTest] = useState<HealthStatus>({ status: 'loading' });

  // API testing
  const [testMessage, setTestMessage] = useState('Hello AutoTractor, can you help me with store operations?');
  const [mockSessions, setMockSessions] = useState<any[]>([]);

  // RTK Query hooks for real API testing
  const { data: sessions, error: sessionError, isLoading: sessionLoading } = useListSessionsQuery();
  const [createSession, { isLoading: createLoading }] = useCreateSessionMutation();
  const [sendQuery, { isLoading: queryLoading }] = useAgentQueryMutation();

  // Health checks
  useEffect(() => {
    // Frontend health
    setFrontendHealth({
      status: 'success',
      data: {
        theme: theme,
        reduxConnected: true,
        reactVersion: React.version,
        timestamp: new Date().toISOString()
      }
    });

    // Backend health check
    const checkBackendHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/v1/agent/health');
        const data = await response.json();
        setBackendHealth({
          status: response.ok ? 'success' : 'error',
          data: data,
          error: response.ok ? undefined : 'Backend health check failed'
        });
      } catch (error) {
        setBackendHealth({
          status: 'error',
          error: error instanceof Error ? error.message : 'Backend connection failed'
        });
      }
    };

    // API endpoints check
    const checkApiEndpoints = async () => {
      try {
        const response = await fetch('http://localhost:8000/openapi.json');
        const data = await response.json();
        setApiHealth({
          status: 'success',
          data: {
            endpoints: Object.keys(data.paths || {}),
            version: data.info?.version,
            title: data.info?.title
          }
        });
      } catch (error) {
        setApiHealth({
          status: 'error',
          error: error instanceof Error ? error.message : 'API check failed'
        });
      }
    };

    // Mock API test
    const testMockApi = async () => {
      try {
        const sessions = await mockApi.listSessions();
        setMockSessions(sessions);
        setSessionTest({
          status: 'success',
          data: { mockSessionsCount: sessions.length }
        });
      } catch (error) {
        setSessionTest({
          status: 'error',
          error: error instanceof Error ? error.message : 'Mock API failed'
        });
      }
    };

    checkBackendHealth();
    checkApiEndpoints();
    testMockApi();
  }, [theme]);

  // Test functions
  const testRealSessionCreation = async () => {
    try {
      const result = await createSession({ title: "Debug Test Session" });
      alert('Session created successfully: ' + JSON.stringify(result));
    } catch (error) {
      alert('Session creation failed: ' + (error as any).message);
    }
  };

  const testMockChat = async () => {
    try {
      setChatTest({ status: 'loading' });
      const response = await mockApi.sendMessage('mock-session-1', testMessage);
      setChatTest({
        status: 'success',
        data: { response, originalMessage: testMessage }
      });
    } catch (error) {
      setChatTest({
        status: 'error',
        error: error instanceof Error ? error.message : 'Mock chat failed'
      });
    }
  };

  const testRealChat = async () => {
    try {
      if (!sessions || sessions.length === 0) {
        alert('No sessions available. Create a session first.');
        return;
      }
      
      const sessionId = sessions[0].session_id;
      await sendQuery({
        session_id: sessionId,
        query: testMessage,
        agent: 'general'
      });
      alert('Real chat query sent successfully!');
    } catch (error) {
      alert('Real chat failed: ' + (error as any).message);
    }
  };

  const StatusCard: React.FC<{ title: string; health: HealthStatus }> = ({ title, health }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          {health.status === 'loading' && <CircularProgress size={20} />}
          {health.status === 'success' && <Chip label="OK" color="success" size="small" />}
          {health.status === 'error' && <Chip label="ERROR" color="error" size="small" />}
        </Stack>
        
        {health.error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {health.error}
          </Alert>
        )}
        
        {health.data && (
          <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(health.data, null, 2)}
            </pre>
          </Paper>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        AutoTractor Debug Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Testing frontend, backend, and API connectivity
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">System Health Checks</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <StatusCard title="Frontend Status" health={frontendHealth} />
          <StatusCard title="Backend Health" health={backendHealth} />
          <StatusCard title="API Endpoints" health={apiHealth} />
          <StatusCard title="Mock API Test" health={sessionTest} />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Session Management Tests</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" gutterBottom>Real API Sessions</Typography>
              {sessionLoading && <CircularProgress size={20} />}
              {sessionError && (
                <Alert severity="error">
                  Session API Error: {JSON.stringify(sessionError)}
                </Alert>
              )}
              {sessions && (
                <Typography>Found {sessions.length} sessions</Typography>
              )}
              <Button 
                variant="contained" 
                onClick={testRealSessionCreation}
                disabled={createLoading}
                sx={{ mt: 1 }}
              >
                {createLoading ? 'Creating...' : 'Test Session Creation'}
              </Button>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>Mock Sessions</Typography>
              <List dense>
                {mockSessions.map((session) => (
                  <ListItem key={session.session_id}>
                    <ListItemText 
                      primary={session.title}
                      secondary={`ID: ${session.session_id}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Chat Functionality Tests</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label="Test Message"
              multiline
              rows={3}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              fullWidth
            />
            
            <Stack direction="row" spacing={2}>
              <Button 
                variant="contained" 
                onClick={testMockChat}
                disabled={chatTest.status === 'loading'}
              >
                Test Mock Chat
              </Button>
              <Button 
                variant="outlined" 
                onClick={testRealChat}
                disabled={queryLoading}
              >
                {queryLoading ? 'Sending...' : 'Test Real Chat'}
              </Button>
            </Stack>

            <StatusCard title="Chat Test Results" health={chatTest} />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Environment Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper sx={{ p: 2 }}>
            <pre style={{ fontSize: '12px' }}>
              {JSON.stringify({
                VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
                NODE_ENV: import.meta.env.NODE_ENV,
                MODE: import.meta.env.MODE,
                currentTheme: theme,
                timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
          </Paper>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button variant="outlined" href="/chat">Go to Chat</Button>
          <Button variant="outlined" href="/admin">Go to Admin</Button>
          <Button variant="outlined" href="/">Go to Landing</Button>
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default DebugPage; 