// src/components/markdown/MarkdownRenderer.tsx
// -----------------------------------------------------------------------------
// A lightweight, plugin-driven renderer that converts Markdown (and fenced
// blocks) into rich React components – charts, tables, SQL editors, etc.
// -----------------------------------------------------------------------------
// Usage:
//   <MarkdownRenderer markdown={assistantText} />
//     • Automatically renders GitHub-flavoured Markdown (remark-gfm)
//     • Recognises fenced blocks with language tags: ``sql``, ``table``,
//       ``chart``, etc. – via the plugin registry below.
//     • Each heavy dependency (react-syntax-highlighter, apexcharts,
//       data-grid) is **lazy-loaded**, so the base bundle stays tiny.

import React, { lazy, Suspense, ReactNode, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';
import { Box, CircularProgress, useTheme, Typography } from '@mui/material';
import yaml from 'js-yaml';
import DataGridTable from './plugins/DatagridTable';

// -----------------------------------------------------------------------------
// ⭐ 1. Types & helpers
// -----------------------------------------------------------------------------
export interface MdPlugin {
  /** Return true if the fenced‐code info string matches this plugin */
  test: (infoString: string) => boolean;
  /** Render the contents of the fence block */
  render: (literal: string) => ReactNode;
}

const Loading: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
    <CircularProgress size={24} />
  </Box>
);

// -----------------------------------------------------------------------------
// ⭐ 2. SQL plugin (lazy-loads syntax highlighter + SQL UI)
// -----------------------------------------------------------------------------
const SqlCode = lazy(() => import('./plugins/SqlCode'));
const sqlPlugin: MdPlugin = {
  test: (info) => info.trim().toLowerCase() === 'sql',
  render: (literal) => (
    <Suspense fallback={<Loading />}>
      <SqlCode code={literal} />
    </Suspense>
  ),
};

// -----------------------------------------------------------------------------
// ⭐ 3. Table plugin  –  uses DataGrid when Markdown‐table syntax detected
// -----------------------------------------------------------------------------
const tablePlugin: MdPlugin = {
  test: (info) => info.trim().toLowerCase() === 'table',
  render: (literal) => (
    <Suspense fallback={<Loading />}>
      <DataGridTable markdown={literal} />
    </Suspense>
  ),
};

// -----------------------------------------------------------------------------
// ⭐ 4. Chart plugin – supports YAML front-matter in the fenced block
// -----------------------------------------------------------------------------
const ChartFactory = lazy(() => import('./plugins/ChartFactory'));
const chartPlugin: MdPlugin = {
  test: (info) => info.trim().toLowerCase().startsWith('chart'),
  render: (literal) => {
    let cfg: any = {};
    try {
      // Expect YAML front-matter at the top of the literal
      cfg = yaml.load(literal) || {};
    } catch {
      /* invalid YAML → ignore and pass empty config */
    }
    return (
      <Suspense fallback={<Loading />}>
        <ChartFactory {...cfg} />
      </Suspense>
    );
  },
};

// -----------------------------------------------------------------------------
// ⭐ 5. Plugin registry – order matters (first match wins)
// -----------------------------------------------------------------------------
const plugins: MdPlugin[] = [sqlPlugin, tablePlugin, chartPlugin];

// -----------------------------------------------------------------------------
// ⭐ 6. Core MarkdownRenderer component
// -----------------------------------------------------------------------------
export interface MarkdownRendererProps {
  markdown: string | undefined;
  components?: Partial<Components>; // allow callers to override default renderers
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdown = '', components = {} }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // ---------------------------------------------------------------------------
  // 🛠 0. Preprocess markdown – auto-fix simple `|` tables missing separator row.
  // ---------------------------------------------------------------------------
  const processedMd = useMemo(() => {
    const lines = markdown.split(/\r?\n/);
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Detect table header candidate: must start with | and contain another |
      if (/^\s*\|.*\|\s*$/.test(line)) {
        const next = lines[i + 1] ?? '';
        const isSeparator = /^\s*\|?\s*-{3,}/.test(next);
        if (!isSeparator) {
          // Build separator based on header cell count
          const cells = line.split('|').filter(c => c.trim() !== '');
          const sep = `| ${cells.map(() => '---').join(' | ')} |`;
          out.push(line);
          out.push(sep);
          continue;
        }
      }
      out.push(line);
    }
    return out.join('\n');
  }, [markdown]);

  // ---------------------------------------------------------------------------
  // 📐 6.a Default element → component mapping
  // ---------------------------------------------------------------------------
  const defaultComponents = {
    h1: ({ children, ...rest }: any) => (
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }} {...rest}>
        {children}
      </Typography>
    ),
    h2: ({ children, ...rest }: any) => (
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700, mt: 3 }} {...rest}>
        {children}
      </Typography>
    ),
    h3: ({ children, ...rest }: any) => (
      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600, mt: 2.5 }} {...rest}>
        {children}
      </Typography>
    ),
    h4: ({ children, ...rest }: any) => (
      <Typography variant="subtitle1" component="h4" gutterBottom sx={{ fontWeight: 600, mt: 2 }} {...rest}>
        {children}
      </Typography>
    ),
    p: ({ children, ...rest }: any) => (
      <Typography variant="body1" component="p" sx={{ mb: 1.5, lineHeight: 1.7 }} {...rest}>
        {children}
      </Typography>
    ),
    strong: ({ children, ...rest }: any) => (
      <Box component="strong" sx={{ fontWeight: 600 }} {...rest}>
        {children}
      </Box>
    ),
    em: ({ children, ...rest }: any) => (
      <Box component="em" sx={{ fontStyle: 'italic' }} {...rest}>
        {children}
      </Box>
    ),
    a: ({ children, ...rest }: any) => (
      <Box
        component="a"
        sx={{
          color: theme.palette.primary.main,
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </Box>
    ),
    ul: ({ children, ...rest }: any) => (
      <Box component="ul" sx={{ pl: 3, mb: 1.5 }} {...rest}>
        {children}
      </Box>
    ),
    ol: ({ children, ...rest }: any) => (
      <Box component="ol" sx={{ pl: 3, mb: 1.5 }} {...rest}>
        {children}
      </Box>
    ),
    li: ({ children, ...rest }: any) => (
      <Box component="li" sx={{ mb: 0.75, '&::marker': { color: theme.palette.primary.main } }} {...rest}>
        {children}
      </Box>
    ),
    table: ({ children, ...rest }: any) => {
      return (
        <Box sx={{ width: '100%', my: 2 }}>
          <DataGridTable markdown={markdown} />
        </Box>
      );
    },
    thead: ({ children, ...rest }: any) => (
      <Box component="thead" {...rest}>{children}</Box>
    ),
    tbody: ({ children, ...rest }: any) => (
      <Box component="tbody" {...rest}>{children}</Box>
    ),
    tr: ({ children, ...rest }: any) => (
      <Box component="tr" sx={{ '&:nth-of-type(odd)': { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' } }} {...rest}>{children}</Box>
    ),
    th: ({ children, ...rest }: any) => (
      <Box component="th" sx={{
        textAlign: 'left',
        px: 2,
        py: 1,
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
        backgroundColor: isDark ? 'rgba(200,16,46,0.15)' : 'rgba(200,16,46,0.08)',
        color: '#c8102e',
        fontWeight: 600,
        fontSize: '0.875rem',
      }} {...rest}>
        {children}
      </Box>
    ),
    td: ({ children, ...rest }: any) => (
      <Box component="td" sx={{
        px: 2,
        py: 1,
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        fontSize: '0.875rem'
      }} {...rest}>
        {children}
      </Box>
    ),
    blockquote: ({ children, ...rest }: any) => (
      <Box
        component="blockquote"
        sx={{
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          pl: 2,
          py: 1,
          mb: 2,
          color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
          fontStyle: 'italic',
        }}
        {...rest}
      >
        {children}
      </Box>
    ),
    hr: () => (
      <Box
        component="hr"
        sx={{
          border: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
          my: 3,
        }}
      />
    ),
    // Ensure code blocks render in a full-width container for DataGrid
    pre: ({ children }: any) => <Box sx={{ width: '100%' }}>{children}</Box>,
    code: undefined, // Placeholder – will be overwritten by codeComponent below
  } as Components;

  // Custom `code` handler: if it's a fenced block, check plugins first
  const codeComponent = (props: any) => {
    const { inline, children, className, node } = props;
    if (inline) {
      return (
        <Box
          component="code"
          sx={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            borderRadius: '4px',
            px: 0.5,
            py: 0.25,
            fontFamily: 'Roboto Mono, Fira Code, monospace',
            fontSize: '0.875em',
          }}
        >
          {children}
        </Box>
      );
    }

    // Extract info string
    const fenceInfo =
      (node as any)?.data?.meta ?? (className ?? '').replace('language-', '');
    const literal = String(children);

    // Try plugin
    const plug = plugins.find((p) => p.test(fenceInfo));
    if (plug) {
      return <>{plug.render(literal)}</>;
    }

    const Highlighter = lazy(() => import('./plugins/CodeHighlighter'));
    return (
      <Suspense fallback={<Loading />}>
        <Highlighter language={fenceInfo} literal={literal} dark={isDark} />
      </Suspense>
    );
  };

  // Attach our custom code handler
  defaultComponents.code = codeComponent;

  // Merge with any user‐supplied overrides (caller overrides win)
  const mergedComponents: Components = {
    ...defaultComponents,
    ...components,
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mergedComponents}>
      {processedMd}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
