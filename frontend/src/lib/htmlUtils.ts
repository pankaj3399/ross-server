/**
 * Utility functions for safely rendering HTML content
 */

/**
 * Checks if a string contains HTML tags
 */
export const isHTML = (str: string): boolean => {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
};

/**
 * Safely renders HTML content, handling both plain text and HTML
 * If the content is plain text, it will be wrapped in <p> tags
 * If it's HTML, it will be rendered as HTML (assumed to be sanitized by Quill)
 */
export const safeRenderHTML = (content: string | null | undefined): string => {
  if (!content) return "";
  // If it's already HTML (contains HTML tags), return as is
  // Quill sanitizes HTML, so it should be safe
  if (isHTML(content)) {
    return content;
  }
  // If it's plain text, convert newlines to <br> and wrap in <p>
  // Since it's plain text (no HTML tags), we don't need to escape
  // The text will be safely rendered inside the <p> tag
  const textWithBreaks = content.replace(/\n/g, "<br>");
  return `<p>${textWithBreaks}</p>`;
};

/**
 * Strips HTML tags to get plain text (for display in non-HTML contexts)
 * Works in both browser and Node.js environments
 */
export const stripHTML = (html: string): string => {
  if (!html) return "";
  // Simple regex-based approach that works in both environments
  return html
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
};
