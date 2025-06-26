// src/components/markdown/plugins/DataGridTable.tsx
// -----------------------------------------------------------------------------
// Converts a fenced ``table`` block into a Material-UI DataGrid. Falls back
// to a native <table> when parsing fails.
// -----------------------------------------------------------------------------
import React from 'react';
import { Box, useTheme } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface DataGridTableProps {
  markdown: string;
}

const DataGridTable: React.FC<DataGridTableProps> = ({ markdown }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Helper: Extract text from ReactNode children
  const extractText = (node: any): string => {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join(' ');
    if (React.isValidElement(node) && node.props && (node.props as any).children) {
      return extractText((node.props as any).children);
    }
    return '';
  };

  try {
    // Parse the markdown string into rows/columns
    const lines = markdown.split('\n').filter((l) => l.trim() !== '');
    if (lines.length < 2) throw new Error('Not enough rows');

    // Header row: split on pipe `|`, ignore empty leading/trailing
    const headerLine = lines[0].trim();
    const headers = headerLine.split('|').map((h) => h.trim()).filter((h) => h !== '');
    const columnDefs: GridColDef[] = headers.map((h, i) => ({
      field: `col${i}`,
      headerName: h,
      flex: 1,
      minWidth: 120,
    }));

    // Data rows: starting from the 2nd line, skip separator (---|---|---)
    const dataRows: any[] = [];
    for (let i = 2; i < lines.length; i++) {
      const rowCells = lines[i].split('|').map((c) => extractText(c.trim())).filter((c) => c !== '');
      // Only include rows that have the exact number of columns as the header
      if (rowCells.length === headers.length) {
        const rowObj: any = { id: i - 2 };
        headers.forEach((_, idx) => {
          rowObj[`col${idx}`] = rowCells[idx];
        });
        dataRows.push(rowObj);
      }
      // Otherwise, skip the row (do not add to dataRows)
    }

    if (dataRows.length === 0) throw new Error('No data rows');

    return (
      <Box
        sx={{
          width: '100%',
          bgcolor: 'transparent',
          borderRadius: 1,
          '& .MuiDataGrid-cell': {
            borderBottom: 'none',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: isDark ? 'rgba(200,16,46,0.15)' : 'rgba(200,16,46,0.08)',
            borderBottom: 'none',
            color: '#c8102e',
            fontWeight: 600,
          },
          '& .MuiDataGrid-virtualScrollerRenderZone': {
            '& > div': {
              '&:nth-of-type(odd)': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              },
            },
          },
        }}
      >
        <DataGrid
          columns={columnDefs}
          rows={dataRows}
          hideFooter
          disableRowSelectionOnClick
          autoHeight={false}
          disableColumnMenu
          rowHeight={36}
        />
      </Box>
    );
  } catch {
    // Fallback to native <table> if parsing fails
    return (
      <Box
        sx={{
          my: 2,
          overflowX: 'auto',
          borderRadius: 1,
          bgcolor: 'transparent',
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
          },
          '& th, & td': {
            padding: '8px 12px',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          },
          '& th': {
            backgroundColor: isDark ? 'rgba(200,16,46,0.15)' : 'rgba(200,16,46,0.08)',
            color: '#c8102e',
            fontWeight: 600,
            position: 'sticky',
            top: 0,
          },
          '& tr:nth-of-type(odd)': {
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          },
          '& tr:hover': {
            backgroundColor: isDark ? 'rgba(200,16,46,0.10)' : 'rgba(200,16,46,0.08)',
          },
        }}
      >
        <table>
          <thead>{/* dangerously render raw markdown */}
            <tr>
              {markdown
                .split('\n')[0]
                .split('|')
                .map((h, i) =>
                  h.trim() ? <th key={i}>{h.trim()}</th> : null
                )}
            </tr>
          </thead>
          <tbody>
            {markdown
              .split('\n')
              .slice(2)
              .map((line, rowIdx) => (
                <tr key={rowIdx}>
                  {line
                    .split('|')
                    .map((cell, i) =>
                      cell.trim() ? <td key={i}>{cell.trim()}</td> : null
                    )}
                </tr>
              ))}
          </tbody>
        </table>
      </Box>
    );
  }
};

export default DataGridTable;
