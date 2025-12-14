
export const isHTML = (str: string): boolean => {
  if (!str || typeof str !== "string") return false;

  const htmlTagPattern = /<\/?[a-z][a-z0-9]*\b[^>]*>/gi;
  const hasTags = htmlTagPattern.test(str);
  
  const hasHTMLEntities = /&(nbsp|amp|lt|gt|quot|#\d+);/i.test(str);
  
  return hasTags || hasHTMLEntities;
};

export const safeRenderHTML = (content: string | null | undefined): string => {
  if (!content || typeof content !== "string") return "";
  
  if (isHTML(content)) {
    return content;
  }
  
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
