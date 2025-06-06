// src/components/markdown/plugins/CodeHighlighter.tsx
// -----------------------------------------------------------------------------
// Generic syntax highlighter using react-syntax-highlighter / Prism.
// -----------------------------------------------------------------------------
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@mui/material';

interface CodeHighlighterProps {
  language: string;
  literal: string;
  dark: boolean;
}

const CodeHighlighter: React.FC<CodeHighlighterProps> = ({ language, literal, dark }) => {
  return (
    <SyntaxHighlighter
      language={language}
      style={dark ? materialDark : oneLight}
      PreTag="div"
      showLineNumbers
      wrapLines
      wrapLongLines={false}
      customStyle={{
        margin: '1.5em 0',
        padding: '18px',
        backgroundColor: 'transparent',
        maxHeight: '500px',
        overflowX: 'auto',
        overflowY: 'auto',
        borderRadius: '8px',
        fontFamily: '"Roboto Mono", "Fira Code", monospace',
        fontSize: '0.9rem',
        lineHeight: 1.5,
      }}
      lineNumberStyle={{
        textAlign: 'left',
        paddingRight: '1.5em',
        opacity: 0.5,
        userSelect: 'none',
      }}
    >
      {literal.replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
};

export default CodeHighlighter;
