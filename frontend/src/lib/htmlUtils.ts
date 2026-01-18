import DOMPurify from "dompurify";

export const isHTML = (str: string): boolean => {
  if (!str || typeof str !== "string") return false;

  const htmlTagPattern = /<\/?[a-z][a-z0-9]*\b[^>]*>/gi;
  const hasTags = htmlTagPattern.test(str);
  
  const hasHTMLEntities = /&(nbsp|amp|lt|gt|quot|#\d+);/i.test(str);
  
  return hasTags || hasHTMLEntities;
};

/**
 * Safely render HTML content by sanitizing it with DOMPurify.
 * This prevents XSS attacks while allowing safe HTML tags.
 */
export const safeRenderHTML = (content: string | null | undefined): string => {
  if (!content || typeof content !== "string") return "";
  
  // If content contains HTML, sanitize it with DOMPurify
  if (isHTML(content)) {
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'a', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur']
    });
  }
  
  // Plain text: escape and wrap
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  const textWithBreaks = escaped.replace(/\n/g, "<br>");
  return `<p>${textWithBreaks}</p>`;
};

export const stripHTML = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
};
