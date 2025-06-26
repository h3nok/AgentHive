// frontend/src/utils/preprocessMarkdown.ts
// Utility to preprocess and clean up assistant output for better markdown rendering

export function preprocessMarkdown(text: string): string {
  // Remove duplicate lines
  const lines = text.split('\n');
  const seen = new Set();
  const deduped = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (seen.has(trimmed)) return false;
    seen.add(trimmed);
    return true;
  });

  let processed = deduped.join('\n');

  // Convert numbered steps to markdown numbered list
  processed = processed.replace(/(\d+)\.\s+/g, (m) => `\n${m}`);

  // Bold 'Note:' and 'Tip:'
  processed = processed.replace(/(Note:|Tip:)/g, '**$1**');

  // Optionally, add more rules here

  return processed.trim();
} 