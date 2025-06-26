import React from 'react';
import { Typography } from '@mui/material';
import MarkdownRenderer from './markdown/MarkdownRenderer';

interface MessageRendererProps {
  content: string;
  isUser: boolean;
}

/**
 * Safe message renderer with fallback handling
 */
const MessageRenderer: React.FC<MessageRendererProps> = ({ content, isUser }) => {
  const trimmedContent = content.trim();
  
  // Empty content check
  if (trimmedContent.length === 0) {
    return (
      <Typography
        variant="body1"
        sx={{
          fontStyle: 'italic',
          opacity: 0.7,
          color: 'text.secondary'
        }}
      >
        [Empty message]
      </Typography>
    );
  }

  // User messages always render as plain text
  if (isUser) {
    return (
      <Typography
        variant="body1"
        component="div"
        sx={{
          fontSize: '0.95rem',
          lineHeight: 1.6,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {trimmedContent}
      </Typography>
    );
  }

  // Assistant messages – always attempt markdown; fallback to plain text only on error
  try {
    return <MarkdownRenderer markdown={trimmedContent} />;
  } catch (error) {
    console.error('Error rendering markdown, falling back to plain text:', error);
    return (
      <Typography
        variant="body1"
        component="div"
        sx={{
          fontSize: '0.95rem',
          lineHeight: 1.6,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {trimmedContent}
      </Typography>
    );
  }
};

export default MessageRenderer;
