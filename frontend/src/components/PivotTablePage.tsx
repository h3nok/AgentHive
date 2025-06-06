import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  flexRender,
  GroupingState,
  SortingState,
} from '@tanstack/react-table';
import { Box, Button, Typography, Paper, Select, MenuItem, FormControl, InputLabel, Chip, IconButton, Tooltip, Stack, TextField, Menu, Checkbox, ListItemText, useTheme } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import PrintIcon from '@mui/icons-material/Print';
// @ts-ignore – external lib without TS types in repo
import jsPDF from 'jspdf';
// @ts-ignore – external plugin typings not in repo
import autoTable from 'jspdf-autotable';
// @ts-ignore – external lib without TS types in repo
import * as XLSX from 'xlsx';

// Use the same accent color defined in the MUI theme (Chat Interface)

function getPivotData() {
  try {
    const data = localStorage.getItem('pivotTableData');
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

function getPivotHeaders() {
  try {
    const headers = localStorage.getItem('pivotTableHeaders');
    if (headers) return JSON.parse(headers);
  } catch {}
  return null;
}

function exportToCSV(rows: any[], columns: any[]) {
  if (!rows.length) return;
  const header = columns.map((col: any) => col.header).join(',');
  const body = rows.map(row => columns.map((col: any) => row[col.accessorKey]).join(',')).join('\n');
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pivot-table.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportToPDF(rows: any[], columns: any[]) {
  if (!rows.length) return;
  const doc = new jsPDF({ orientation: 'landscape' });
  const headers = columns.map((c: any) => c.header);
  const body = rows.map(row => columns.map((c: any) => row[c.accessorKey]));
  // @ts-ignore – autoTable typing issues
  autoTable(doc, { head: [headers], body });
  doc.save('pivot-table.pdf');
}

function exportToXLSX(rows: any[], columns: any[]) {
  if (!rows.length) return;
  const headers = columns.map((c: any) => c.header);
  const data = rows.map(row => columns.map((c: any) => row[c.accessorKey]));
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pivot');
  XLSX.writeFile(workbook, 'pivot-table.xlsx');
}

const PivotTablePage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const data = React.useMemo(() => getPivotData(), []);
  const headers = React.useMemo(() => getPivotHeaders(), []);
  const columns = React.useMemo(() => {
    if (!data.length) return [];
    const keys = Object.keys(data[0]);
    return keys.map((key, i) => ({
      accessorKey: key,
      header: headers && headers[i] ? headers[i] : key,
      cell: (info: any) => info.getValue(),
    }));
  }, [data, headers]);

  // State for grouping (pivoting) and sorting
  const [grouping, setGrouping] = React.useState<GroupingState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  // columnVisibility: { [accessorKey]: boolean }
  const [columnVisibility, setColumnVisibility] = React.useState(() => {
    const obj: Record<string, boolean> = {};
    columns.forEach(col => { obj[col.accessorKey] = true; });
    return obj;
  });

  const table = useReactTable({
    data,
    columns,
    state: { grouping, sorting, globalFilter, columnVisibility },
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGroupingChange: setGrouping,
    onSortingChange: setSorting,
    getSubRows: (_row, _index) => undefined,
    debugTable: false,
    globalFilterFn: (row, columnId, filterValue) => {
      // Simple global filter: check if any visible cell contains the filter value
      return Object.keys(columnVisibility).filter(colId => columnVisibility[colId]).some(colId => {
        const value = row.getValue(colId);
        return value && value.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
  });

  // UI for selecting grouping columns
  const availableColumns = columns.map(col => ({ key: col.accessorKey, label: col.header }));

  // Flatten all visible rows for export
  const flatRows = table.getRowModel().rows.map(row => row.original);

  // Column manager menu
  const handleColumnMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleColumnMenuClose = () => {
    setAnchorEl(null);
  };
  const handleToggleColumn = (colId: string) => {
    setColumnVisibility(prev => ({ ...prev, [colId]: !prev[colId] }));
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 4 }, maxWidth: 1200, mx: 'auto', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#fcfcfc', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: theme.palette.primary.main, letterSpacing: 1 }}>
        ChatTSC - Pivot Table
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Select columns to group by (pivot). Click on group headers to expand/collapse. Sort by clicking column headers. Export your view as CSV.
      </Typography>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderRadius: 3, boxShadow: 2, background: isDark ? 'rgba(30,30,30,0.7)' : '#ffffff' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Group by</InputLabel>
          <Select
            multiple
            value={grouping}
            onChange={e => setGrouping(e.target.value as string[])}
            label="Group by"
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => {
                  const label = availableColumns.find(c => c.key === value)?.label || value;
                  return <Chip key={value} label={label} size="small" sx={{ bgcolor: theme.palette.primary.main, color: '#fff' }} />;
                })}
              </Box>
            )}
          >
            {availableColumns.map(col => (
              <MenuItem key={col.key} value={col.key}>
                {col.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" size="small" onClick={() => setGrouping([])} sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main, '&:hover': { borderColor: theme.palette.primary.main, bgcolor: '#fff5f7' } }}>
          Clear Grouping
        </Button>
        <Tooltip title="Export as CSV">
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveAltIcon />}
            onClick={() => exportToCSV(flatRows, columns)}
            sx={{ bgcolor: theme.palette.primary.main, color: '#fff', '&:hover': { bgcolor: '#a00d24' } }}
          >
            CSV
          </Button>
        </Tooltip>
        <Tooltip title="Export as PDF">
          <Button
            variant="contained"
            size="small"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => exportToPDF(flatRows, columns)}
            sx={{ bgcolor: '#d32f2f', color: '#fff', '&:hover': { bgcolor: '#9a0007' } }}
          >
            PDF
          </Button>
        </Tooltip>
        <Tooltip title="Export as Excel">
          <Button
            variant="contained"
            size="small"
            startIcon={<DescriptionIcon />}
            onClick={() => exportToXLSX(flatRows, columns)}
            sx={{ bgcolor: '#1976d2', color: '#fff', '&:hover': { bgcolor: '#115293' } }}
          >
            Excel
          </Button>
        </Tooltip>
        <Tooltip title="Print Table">
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main, '&:hover': { borderColor: theme.palette.primary.main, bgcolor: '#fff5f7' } }}
          >
            Print
          </Button>
        </Tooltip>
        <Tooltip title="Column Manager">
          <Button
            variant="outlined"
            size="small"
            onClick={handleColumnMenuOpen}
            sx={{ borderColor: theme.palette.primary.main, color: theme.palette.primary.main, '&:hover': { borderColor: theme.palette.primary.main, bgcolor: '#fff5f7' } }}
          >
            Columns
          </Button>
        </Tooltip>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleColumnMenuClose}>
          {columns.map(col => (
            <MenuItem key={col.accessorKey} onClick={() => handleToggleColumn(col.accessorKey)}>
              <Checkbox checked={columnVisibility[col.accessorKey] !== false} />
              <ListItemText primary={col.header} />
            </MenuItem>
          ))}
        </Menu>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          sx={{ minWidth: 180, ml: 2 }}
        />
        <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary', fontWeight: 500 }}>
          Rows: {flatRows.length}
        </Typography>
      </Paper>
      <Box sx={{ overflowX: 'auto', borderRadius: 3, boxShadow: 1, bgcolor: 'transparent', p: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.97rem', borderRadius: 8 }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    style={{
                      padding: 10,
                      background: grouping.includes(header.column.id) ? 'rgba(200,16,46,0.15)' : 'rgba(200,16,46,0.05)',
                      borderBottom: '2px solid #c8102e',
                      textAlign: 'left',
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      color: grouping.includes(header.column.id) ? '#800' : '#c8102e',
                      fontWeight: 600,
                      borderTopLeftRadius: header.index === 0 ? 8 : 0,
                      borderTopRightRadius: header.index === table.getHeaderGroups()[0].headers.length - 1 ? 8 : 0,
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && ' ▲'}
                    {header.column.getIsSorted() === 'desc' && ' ▼'}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} style={{ background: 'transparent' }}>
                {row.getVisibleCells().map((cell, i) => (
                  <td key={cell.id} style={{ padding: 10, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: row.getIsGrouped() && i === 0 ? 600 : 400 }}>
                    {row.getIsGrouped() && i === 0 ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton size="small" onClick={row.getToggleExpandedHandler()} sx={{ color: theme.palette.primary.main }}>
                          {row.getIsExpanded() ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        <span style={{ color: '#888', fontWeight: 400, marginLeft: 8 }}>
                          ({row.subRows?.length ?? 0})
                        </span>
                      </Stack>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
      {(!data || !data.length) && (
        <Typography sx={{ mt: 4, color: 'text.disabled', fontStyle: 'italic' }}>
          No data found. Please open a table from chat and click "Open in Pivot Table".
        </Typography>
      )}
    </Box>
  );
};

export default PivotTablePage; 