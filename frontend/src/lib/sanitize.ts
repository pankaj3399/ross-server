/**
 * Sanitization utilities for user input to prevent XSS attacks
 */

// HTML entities that should be escaped
const HTML_ENTITIES: { [key: string]: string } = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

// Dangerous patterns that should be removed or escaped
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
  /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
];

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove dangerous HTML patterns
 */
function removeDangerousPatterns(text: string): string {
  let sanitized = text;
  DANGEROUS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });
  return sanitized;
}

/**
 * Sanitize user input for safe storage and display
 * @param input - The user input to sanitize
 * @param preserveWhitespace - If true, preserve leading/trailing whitespace (for typing). Default false.
 * @returns Sanitized text safe for storage and display
 */
export function sanitizeInput(input: string, preserveWhitespace: boolean = false): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Only trim whitespace if not preserving it (for final save)
  let sanitized = preserveWhitespace ? input : input.trim();

  // Remove dangerous patterns first
  sanitized = removeDangerousPatterns(sanitized);

  // Escape HTML entities
  sanitized = escapeHtml(sanitized);

  // Remove any remaining HTML tags (basic protection)
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Limit length to prevent abuse (max 5000 characters)
  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000);
  }

  return sanitized;
}

/**
 * Validate that input is safe (contains only text, no scripts)
 * @param input - The input to validate
 * @returns true if input is safe, false otherwise
 */
export function isInputSafe(input: string): boolean {
  if (!input || typeof input !== "string") {
    return true;
  }

  // Check for dangerous patterns
  // Reset lastIndex before each test to avoid regex state issues with global flags
  for (const pattern of DANGEROUS_PATTERNS) {
    pattern.lastIndex = 0; // Reset lastIndex before test to prevent state issues
    const hasMatch = pattern.test(input);
    if (hasMatch) {
      return false;
    }
  }

  // Check for HTML tags (reset lastIndex before test to prevent state issues)
  const htmlTagPattern = /<[^>]*>/g;
  htmlTagPattern.lastIndex = 0; // Reset lastIndex before test
  const hasHtmlTags = htmlTagPattern.test(input);
  if (hasHtmlTags) {
    return false;
  }

  // Check for javascript: or data: URLs (reset lastIndex before test to prevent state issues)
  const urlPattern = /javascript:|data:/gi;
  urlPattern.lastIndex = 0; // Reset lastIndex before test
  const hasDangerousUrl = urlPattern.test(input);
  if (hasDangerousUrl) {
    return false;
  }

  return true;
}

/**
 * Check if input contains dangerous content that would be removed during sanitization
 * @param input - The input to check
 * @returns true if dangerous content is detected, false otherwise
 */
export function containsDangerousContent(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  // Check for dangerous patterns using the canonical DANGEROUS_PATTERNS
  // Reset lastIndex before each test to avoid regex state issues with global flags
  for (const pattern of DANGEROUS_PATTERNS) {
    pattern.lastIndex = 0; // Reset lastIndex before test to prevent state issues
    const hasMatch = pattern.test(input);
    if (hasMatch) {
      return true;
    }
  }

  // Check for any HTML tags (reset lastIndex before test to prevent state issues)
  const htmlTagPattern = /<[^>]*>/g;
  htmlTagPattern.lastIndex = 0; // Reset lastIndex before test
  const hasHtmlTags = htmlTagPattern.test(input);
  if (hasHtmlTags) {
    return true;
  }

  return false;
}

/**
 * Sanitize and validate input for question notes
 * @param input - The note input
 * @param preserveWhitespace - If true, preserve leading/trailing whitespace (for typing). Default false.
 * @returns Sanitized note text (dangerous content is removed, not rejected)
 */
export function sanitizeNoteInput(input: string, preserveWhitespace: boolean = false): string {
  // Sanitize the input - this removes dangerous patterns and escapes HTML
  const sanitized = sanitizeInput(input, preserveWhitespace);

  // Return the cleaned string - dangerous content has already been removed by sanitizeInput
  // This allows users to see their safe input reflected while dangerous parts are stripped
  return sanitized;
}
