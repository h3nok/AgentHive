import { useState, useEffect } from 'react';

/**
 * Hook to offload markdown rendering to a web worker
 * @param markdownContent The markdown content to render
 * @returns The rendered HTML and loading state
 */
export const useMarkdownWorker = (markdownContent: string) => {
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!markdownContent) {
      setRenderedHtml('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a new worker
      const worker = new Worker(
        new URL('../workers/markdown.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up the message handler to receive the rendered HTML
      worker.onmessage = (event) => {
        setRenderedHtml(event.data);
        setIsLoading(false);
        // Terminate the worker when done to free up resources
        worker.terminate();
      };

      // Handle errors from the worker
      worker.onerror = (error) => {
        console.error('Markdown worker error:', error);
        setError('Error rendering markdown');
        setIsLoading(false);
        worker.terminate();
      };

      // Send the markdown content to the worker
      worker.postMessage(markdownContent);

      // Clean up function to terminate worker if component unmounts
      return () => {
        worker.terminate();
      };
    } catch (err) {
      console.error('Error creating markdown worker:', err);
      setError('Error initializing markdown rendering');
      setIsLoading(false);
      
      // Fallback rendering in the main thread if worker fails
      setRenderedHtml(markdownContent);
    }
  }, [markdownContent]);

  return { renderedHtml, isLoading, error };
};

export default useMarkdownWorker; 