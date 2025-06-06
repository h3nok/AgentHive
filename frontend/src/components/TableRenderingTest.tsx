import React from 'react';
import MarkdownRenderer from './markdown/MarkdownRenderer';
import { Box, Typography, Paper } from '@mui/material';

const TableRenderingTest: React.FC = () => {
  const simpleTable = `| Name | Age | City |
|------|-----|------|
| John | 25  | NYC  |
| Jane | 30  | LA   |
| Bob  | 35  | SF   |`;

  const leaseTable = `| Property ID | Tenant Name | Lease Start | Monthly Rent | Status |
|-------------|-------------|-------------|--------------|--------|
| PROP001     | Acme Corp   | 2023-01-01  | $5,000       | Active |
| PROP002     | Tech LLC    | 2023-03-15  | $7,500       | Active |
| PROP003     | Retail Inc  | 2023-02-01  | $3,200       | Expired |`;

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Table Rendering Test
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test 1: Simple Table
        </Typography>
        <Typography variant="body2" sx={{ 
          fontFamily: 'monospace', 
          bgcolor: 'grey.100', 
          p: 1, 
          mb: 2,
          whiteSpace: 'pre-wrap'
        }}>
          {simpleTable}
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom>
          Rendered Output:
        </Typography>
        <MarkdownRenderer markdown={simpleTable} />
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test 2: Lease Data Table
        </Typography>
        <Typography variant="body2" sx={{ 
          fontFamily: 'monospace', 
          bgcolor: 'grey.100', 
          p: 1, 
          mb: 2,
          whiteSpace: 'pre-wrap'
        }}>
          {leaseTable}
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom>
          Rendered Output:
        </Typography>
        <MarkdownRenderer markdown={leaseTable} />
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Debug Information
        </Typography>
        <Typography variant="body2">
          - Check browser console for any errors<br/>
          - Verify remarkGfm plugin is loaded<br/>
          - Check if DataGridTable component is available<br/>
          - Ensure all dependencies are installed
        </Typography>
      </Paper>
    </Box>
  );
};

export default TableRenderingTest;
