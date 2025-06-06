 
// This is a Web Worker that offloads the markdown rendering from the main thread

// Mock import of a markdown processor - in a real app you'd use an actual markdown library
// For demo purposes, we're doing a minimal version
const renderMarkdown = (markdownText: string): string => {
  // Simple mock markdown rendering implementation
  // In real app, you'd use a proper markdown library here
  
  // Process headings
  let html = markdownText
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Process lists
  html = html
    .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>');
  
  // Process bold and italic
  html = html
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>');
  
  // Process code blocks
  html = html
    .replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Process paragraphs
  html = html
    .replace(/\n\s*\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (_, p) => {
      // Skip if this is already wrapped in a tag
      if (p.trim().startsWith('<') && p.trim().endsWith('>')) return p;
      return `<p>${p}</p>`;
    });
  
  // Clean up any empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  
  // Process links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  return html;
};

// Add event listener for incoming messages
self.addEventListener('message', (event) => {
  // Get the markdown content from the message
  const markdownContent = event.data;
  
  // Render the markdown to HTML
  const htmlContent = renderMarkdown(markdownContent);
  
  // Send the rendered HTML back to the main thread
  self.postMessage(htmlContent);
});

export {}; 