import * as React from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { Box, Button, Tooltip, Snackbar, Alert } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Papa from 'papaparse';

export interface DataGridTableProps {
  columns: GridColDef[];
  rows: any[];
  height?: number;
  maxHeight?: number;
  enablePivot?: boolean;
}

const DataGridTable: React.FC<DataGridTableProps> = ({ columns, rows, height = 460, maxHeight = 460, enablePivot = true }) => {
  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [snackbar, setSnackbar] = React.useState<{open: boolean, message: string}>({open: false, message: ''});

  // Export to CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(rows.map(({ id, ...rest }) => rest));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSnackbar({open: true, message: 'Exported as CSV'});
  };

  // Export to JSON
  const handleExportJSON = () => {
    const json = JSON.stringify(rows, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSnackbar({open: true, message: 'Exported as JSON'});
  };

  // Copy table to clipboard
  const handleCopy = () => {
    const header = columns.map(col => col.headerName).join('\t');
    const body = rows.map(row => columns.map(col => row[col.field]).join('\t')).join('\n');
    const text = `${header}\n${body}`;
    navigator.clipboard.writeText(text);
    setSnackbar({open: true, message: 'Table copied to clipboard'});
  };

  // Open in Pivot Table
  const handleOpenPivot = () => {
    localStorage.setItem('pivotTableData', JSON.stringify(rows));
    window.open('/pivot-table', '_blank');
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height,
        width: '100%',
        maxHeight,
        overflowY: 'auto',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'rgba(30,30,30,0.55)'
          : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: 'none',
        boxShadow: 'none',
        p: 0,
        m: 0,
        borderRadius: 2,
        '@media (max-width: 600px)': {
          height: 'auto',
          minWidth: 0,
          maxHeight: 'none',
        },
      }}
    >
      <Box sx={{ p: 1, pb: 0, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Tooltip title="Export as CSV">
          <Button size="small" startIcon={<SaveAltIcon />} onClick={handleExportCSV} aria-label="Export as CSV">CSV</Button>
        </Tooltip>
        <Tooltip title="Export as JSON">
          <Button size="small" startIcon={<SaveAltIcon />} onClick={handleExportJSON} aria-label="Export as JSON">JSON</Button>
        </Tooltip>
        <Tooltip title="Copy Table">
          <Button size="small" startIcon={<ContentCopyIcon />} onClick={handleCopy} aria-label="Copy Table">Copy</Button>
        </Tooltip>
        {enablePivot && (
          <Tooltip title="Open in Pivot Table">
            <Button size="small" startIcon={<OpenInNewIcon />} onClick={handleOpenPivot} aria-label="Open in Pivot Table">Pivot</Button>
          </Tooltip>
        )}
      </Box>
      <DataGrid
        rows={rows}
        columns={columns}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight={false}
        sx={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          '& .MuiDataGrid-cell': {
            background: 'transparent',
            borderBottom: 'none',
            py: { xs: 0.5, sm: 1 },
            px: { xs: 0.5, sm: 2 },
          },
          '& .MuiDataGrid-columnHeaders': {
            background: 'rgba(200, 16, 46, 0.05)',
            borderBottom: '2px solid #c8102e',
            fontSize: { xs: '0.9rem', sm: '1rem' },
            color: '#c8102e',
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 700,
              color: '#c8102e',
            },
          },
          '& .MuiDataGrid-footerContainer': {
            background: 'transparent',
            borderTop: 'none',
          },
        }}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({open: false, message: ''})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({open: false, message: ''})} severity="success" variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DataGridTable; 