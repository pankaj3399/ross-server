
export function sanitizeNote(note: string): string {
  if (!note || typeof note !== "string") {
    return "";
  }

  let sanitized = note.replace(/<[^>]*>/g, "");

  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:/gi,
    /on\w+\s*=/gi,
  ];

  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000);
  }

  return sanitized.trim();
}

