import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  plugins?: ((components: Components) => Components)[];
}

// Basic markdown renderer with optional plugin system
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, plugins = [] }) => {
  let components: Components = {};
  plugins.forEach((plug) => {
    components = { ...components, ...plug(components) };
  });

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer; 