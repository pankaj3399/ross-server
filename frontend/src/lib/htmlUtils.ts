
export const isHTML = (str: string): boolean => {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
};

export const safeRenderHTML = (content: string | null | undefined): string => {
  if (!content) return "";
  if (isHTML(content)) {
    return content;
  }
  const textWithBreaks = content.replace(/\n/g, "<br>");
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
