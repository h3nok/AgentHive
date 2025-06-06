/**
 * Utility functions for error handling in the UI
 */

/**
 * Process message content to handle SQL errors gracefully
 * 
 * @param content - The message content to process
 * @returns The processed content with handled SQL errors
 */
export const handleSqlErrors = (content: string): string => {
  // Check for SQL error pattern
  if (content.includes("Generating SQL query") && 
      content.includes("Database query failed") && 
      content.includes("'coroutine' object is not callable")) {
        
    // Extract any SQL query that might be in the content
    let sqlQuery = '';
    const sqlMatch = content.match(/```sql\s*([\s\S]*?)\s*```/);
    if (sqlMatch && sqlMatch[1]) {
      sqlQuery = sqlMatch[1].trim();
    }
    
    // Extract any explanation that might exist in the content
    let explanation = '';
    // Look for explanation sections with common headers
    const explanationPatterns = [
      /### Explanation\s+([\s\S]*?)(?=###|$)/i,
      /### 🧠 Explanation\s+([\s\S]*?)(?=###|$)/i,
      /### Analysis\s+([\s\S]*?)(?=###|$)/i,
      /## Explanation\s+([\s\S]*?)(?=##|$)/i,
      /## Analysis\s+([\s\S]*?)(?=##|$)/i,
      /Explanation:\s+([\s\S]*?)(?=##|###|$)/i,
      /Analysis:\s+([\s\S]*?)(?=##|###|$)/i,
      /Key Insights:\s+([\s\S]*?)(?=##|###|$)/i,
      /Based on the query,\s+([\s\S]*?)(?=##|###|Database query failed|$)/i,
      /The results show\s+([\s\S]*?)(?=##|###|Database query failed|$)/i,
      /This query will\s+([\s\S]*?)(?=##|###|Database query failed|$)/i
    ];
    
    for (const pattern of explanationPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        explanation = match[1].trim();
        break;
      }
    }
    
    // If no structured explanation found, try to extract any content that might be an explanation
    if (!explanation) {
      // First, try to find content between the SQL query and the error message
      const afterSqlMatch = content.match(/```sql[\s\S]*?```\s*([\s\S]*?)(?=Database query failed|$)/);
      if (afterSqlMatch && afterSqlMatch[1] && afterSqlMatch[1].trim().length > 10) {
        explanation = afterSqlMatch[1].trim();
      }
      
      // If still no explanation, try to find content before the SQL query (might be pre-analysis)
      if (!explanation && sqlMatch) {
        const beforeSqlIndex = content.indexOf("```sql");
        if (beforeSqlIndex > 0) {
          const beforeSql = content.substring(0, beforeSqlIndex).trim();
          // Only use if it's substantial and doesn't just look like a header
          if (beforeSql.length > 30 && !beforeSql.match(/^###?\s+[^#\n]+$/)) {
            explanation = beforeSql;
          }
        }
      }
    }
    
    // Add a note about the database connection error, but preserve the original explanation
    return `
### SQL Query Request

${explanation ? `### 🧠 LLM Analysis\n${explanation}\n\n` : ''}

> **Note:** No active database connection is available. The SQL query was generated but couldn't be executed. The analysis above is based on the LLM's understanding of your request.

${sqlQuery ? `
### 🧾 SQL Query
\`\`\`sql
${sqlQuery}
\`\`\`
` : ''}

If you'd like to see actual data results, please ensure the backend server is properly connected to the database.
    `;
  }
  
  // Return original content if no errors
  return content;
};

/**
 * Process error messages in responses and return user-friendly content
 * 
 * @param content - The response content to process
 * @returns The processed content with user-friendly error messages
 */
export const sanitizeProgressMessages = (content: string): string => {
  // Remove any standalone lines (or concatenated progress-only lines) that indicate internal progress
  const progressPatterns: RegExp[] = [
    /generating\s+sql\s+query/i,
    /executing\s+query/i,
    /running\s+analysis/i,
    /formatting\s+response/i,
    /generating\s+response/i,
    /found\s+\d+\s+results?/i,
  ];

  // Split into lines, filter progress-only lines
  const filteredLines = content.split(/\r?\n/).filter(line => {
    const trimmed = line.trim();
    return !progressPatterns.some(pattern => pattern.test(trimmed));
  });

  return filteredLines.join("\n");
};

// Ensure headings are on their own line, e.g., "Here:### Title" -> "Here:\n\n### Title"
const fixHeadingSpacing = (content: string): string => {
  return content.replace(/:(\s*)(#+\s)/g, ':\n\n$2');
};

export const processErrorMessages = (content: string): string => {
  // First, strip noisy progress messages emitted by the backend/LLM
  const cleaned = sanitizeProgressMessages(content);
  // Handle SQL errors afterwards
  let processedContent = handleSqlErrors(cleaned);
  
  // Fix any heading spacing issues for professionalism
  processedContent = fixHeadingSpacing(processedContent);
  
  // Add more error handlers here as needed
  
  return processedContent;
}; 