// src/components/markdown/plugins/SqlCode.tsx
// -----------------------------------------------------------------------------
// Renders a SQL block as an editable card with copy / run / download support.
// -----------------------------------------------------------------------------
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  TextField,
  Collapse,
  Button,
  useTheme,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import ShareIcon from '@mui/icons-material/Share';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BuildIcon from '@mui/icons-material/Build';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';

// You can replace this function with your actual SQL execution logic
const executeSql = async (sql: string) => {
  // Placeholder: in real use, call your backend or SQL engine
  return `Executed SQL: ${sql.substring(0, 50)}...`;
};

interface SqlCodeProps {
  code: string;
}

const SqlCode: React.FC<SqlCodeProps> = ({ code }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showExplain, setShowExplain] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sqlContent, setSqlContent] = useState(code);
  const [results, setResults] = useState<string | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setSnackbarMessage('SQL query copied to clipboard');
    setSnackbarOpen(true);
  };

  const handleRun = async () => {
    const res = await executeSql(sqlContent);
    setResults(res);
    setSnackbarMessage('SQL executed');
    setSnackbarOpen(true);
  };

  const handleSave = () => {
    const blob = new Blob([sqlContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query.sql';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setSnackbarMessage('SQL saved as query.sql');
    setSnackbarOpen(true);
  };

  const handleShare = () => {
    // Placeholder for sharing logic
    setSnackbarMessage('Share functionality not implemented');
    setSnackbarOpen(true);
  };

  const toggleExplain = () => {
    setShowExplain((prev) => !prev);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => editorRef.current?.focus(), 100);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    setSnackbarMessage('SQL query updated');
    setSnackbarOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSqlContent(code);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        my: 2,
        overflow: 'visible',
        borderRadius: 1,
        backgroundColor: 'transparent',
        width: '100%',
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: 'transparent',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoOutlinedIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main, opacity: 0.8 }} />
          <Typography variant="subtitle2" fontWeight={500} color={theme.palette.primary.main}>
            SQL Query
          </Typography>
          {isEditing && (
            <Typography
              variant="caption"
              sx={{
                ml: 2,
                px: 1,
                py: 0.5,
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                borderRadius: 1,
                fontSize: '0.75rem',
              }}
            >
              Editing
            </Typography>
          )}
        </Box>

        <Box>
          {!isEditing ? (
            <>
              <Tooltip title="Edit SQL">
                <IconButton size="small" onClick={handleEdit}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy SQL">
                <IconButton size="small" onClick={handleCopy}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Run Query">
                <IconButton size="small" onClick={handleRun}>
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download SQL">
                <IconButton size="small" onClick={handleSave}>
                  <SaveAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Query">
                <IconButton size="small" onClick={handleShare}>
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={showExplain ? 'Hide Analysis' : 'Show Analysis'}>
                <IconButton size="small" onClick={toggleExplain}>
                  {showExplain ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip title="Save Changes">
                <IconButton size="small" onClick={handleSaveEdit} color="primary">
                  <DoneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel Editing">
                <IconButton size="small" onClick={handleCancelEdit}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {/* Editor or SyntaxHighlighter */}
      {isEditing ? (
        <TextField
          inputRef={editorRef}
          multiline
          fullWidth
          variant="outlined"
          value={sqlContent}
          onChange={(e) => setSqlContent(e.target.value)}
          sx={{
            mt: 1,
            fontFamily: '"Roboto Mono", monospace',
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              '& fieldset': { border: 'none' },
            },
            '& .MuiOutlinedInput-input': {
              p: 2,
              bgcolor: isDark ? 'rgba(0,0,0,0.2)' : theme.palette.grey[100],
              fontSize: '0.9rem',
              lineHeight: 1.5,
            },
          }}
        />
      ) : (
        <Box sx={{ my: 2 }}>
          <Box sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: '0.9rem', color: isDark ? '#eee' : '#111' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {sqlContent}
            </pre>
          </Box>
        </Box>
      )}

      {/* Collapsible analysis */}
      <Collapse in={showExplain && !isEditing}>
        <Box
          sx={{
            p: 2,
            bgcolor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.03)',
            borderRadius: '0 0 8px 8px',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BuildIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main, opacity: 0.85 }} />
            <Typography variant="subtitle2" fontWeight={500} color={theme.palette.primary.main}>
              Query Analysis
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
            This SQL is designed to illustrate a typical lease‐expense query. You can adapt it to your own schema.
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            Adjust `table_name` and column names as needed.
          </Typography>
        </Box>
      </Collapse>

      {/* Execution results */}
      {results && (
        <Box sx={{ mt: 2, p: 2, bgcolor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.04)', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontFamily: '"Roboto Mono", monospace' }}>
            {results}
          </Typography>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SqlCode;
