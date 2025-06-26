import React from 'react';
import { Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import { useMpcServers } from '../hooks/useMpcServers';

const MpcServersPage: React.FC = () => {
  const { servers, loading, error, reload } = useMpcServers();

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4">MPC Servers</Typography>
        <Button variant="contained" color="primary" disabled>
          + New Server
        </Button>
      </Box>
      <Paper sx={{ width: '100%', overflowX: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">Failed to load servers.</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Host/IP</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Seen</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {servers.map((server: any) => (
                <TableRow key={server.id}>
                  <TableCell>{server.id}</TableCell>
                  <TableCell>{server.name}</TableCell>
                  <TableCell>{server.host}</TableCell>
                  <TableCell>{server.status}</TableCell>
                  <TableCell>{new Date(server.lastSeen).toLocaleString()}</TableCell>
                  <TableCell>
                    {/* Actions: Edit, Restart, Delete (to be implemented) */}
                    <Button size="small" disabled>Edit</Button>
                    <Button size="small" disabled>Restart</Button>
                    <Button size="small" color="error" disabled>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

export default MpcServersPage; 