/**
 * Formats markdown content using the marked library
 * 
 * @param {string} content - The markdown content to parse
 * @param {Object} options - Additional options to override default marked settings
 * @returns {string} HTML string of the parsed markdown
 */
export const formatMarkdown = (content = '') => {
  if (!window.marked) {
    console.error('Marked library not loaded');
    return content;
  }
  
  try {
    return window.marked.parse(content);
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return `<p>${content}</p>`;
  }
};

/**
 * Formats markdown content with sanitization for user-generated content
 * 
 * @param {string} content - The markdown content to parse
 * @returns {string} HTML string of the parsed and sanitized markdown
 */
export const formatSafeMarkdown = (content = '') => {
  if (!window.marked) {
    console.error('Marked library not loaded');
    return content;
  }
  
  try {
    // Create a temporary marked instance with more strict settings
    const tempMarked = window.marked.parse(content, {
      sanitize: true, // Force sanitize for user content
      headerIds: false, // Disable header IDs for security
    });
    
    return tempMarked;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return `<p>${content}</p>`;
  }
}; 