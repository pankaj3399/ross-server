
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


export function sanitizeAIResponse(aiResponse: string): string {
  if (!aiResponse || typeof aiResponse !== "string") {
    return "";
  }

  let sanitized = aiResponse
    .replace(/\0/g, "") 
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ""); 

  return sanitized.trim();
}

/**
 * Sanitizes user input for safe use in LLM prompts to prevent prompt injection attacks.
 * This function:
 * 1. Escapes potentially dangerous instruction-like patterns
 * 2. Normalizes whitespace to prevent hidden instructions
 * 3. Truncates extremely long inputs
 * 
 * @param input - The user input string to sanitize
 * @returns Sanitized string safe for prompt interpolation
 */
export function sanitizeForPrompt(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let sanitized = input.trim();

  // Remove or escape common prompt injection patterns
  // These patterns could be interpreted as instructions by the LLM
  const injectionPatterns = [
    // Direct instruction attempts
    /(?:^|\n)\s*(?:ignore|forget|disregard|override|skip|bypass)\s+(?:previous|all|above|earlier|prior)\s+(?:instructions?|prompts?|rules?|directives?)/gi,
    // System prompt injection attempts
    /(?:^|\n)\s*(?:you\s+are|act\s+as|pretend|roleplay|system|assistant|user)\s*[:=]/gi,
    // Output manipulation attempts
    /(?:^|\n)\s*(?:output|return|respond|answer|say|write|generate)\s+(?:only|just|exactly|precisely)\s+[:\-]/gi,
    // Score manipulation attempts
    /(?:^|\n)\s*(?:score|rating|evaluation|result)\s*[=:]\s*\d+/gi,
    // JSON/format manipulation
    /(?:^|\n)\s*\{[^}]*"(?:score|result|answer|output)"[^}]*\}/gi,
  ];

  injectionPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  // Normalize excessive whitespace and newlines that could hide instructions
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n"); // Max 2 consecutive newlines
  sanitized = sanitized.replace(/[ \t]{3,}/g, "  "); // Max 2 consecutive spaces

  // Truncate extremely long inputs (prevent resource exhaustion)
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + "... [truncated]";
  }

  return sanitized.trim();
}

/**
 * Sanitizes a configuration object by redacting sensitive keys.
 * Recursively checking is not performed, it only redacts top-level keys 
 * unless the object implementation is changed. 
 * Based on the previous implementation, it iterates over keys.
 * 
 * @param config - The value to sanitize (usually a config object or stringified JSON)
 * @returns The sanitized object or original value
 */
export function sanitizeConfig(config: any): any {
    if (!config) return config;

    // Expanded sensitive pattern
    const sensitivePattern = /api[-_]?key|token|secret|password|access[-_]?token|credentials|private[-_]?key|privatekey|bearer|auth/i;

    try {
        // If config is a string (JSON), parse it first
        const parsed = typeof config === 'string' ? JSON.parse(config) : config;
        
        // Helper to scrub a string value for URL params or embedded secrets
        const scrubString = (str: string): string => {
             // 1. Try treating as URL
             try {
                 const url = new URL(str);
                 let changed = false;
                 url.searchParams.forEach((val, key) => {
                     if (sensitivePattern.test(key)) {
                         url.searchParams.set(key, "[REDACTED]");
                         changed = true;
                     }
                 });
                 if (changed) {
                     return url.toString();
                 }
                 // If valid URL but no query params matched, fall through to check other patterns
             } catch (e) {
                 // Not a URL, ignore
             }

             // 2. Fallback check for "Bearer <token>" style patterns or direct sensitive keys in template strings
             // This is a simple heuristic.
             // Redact patterns like "Bearer eyJ..." -> "Bearer [REDACTED]"
             return str.replace(/(bearer\s+)([a-zA-Z0-9\-\._~+\/]+)/gi, "$1[REDACTED]");
        };

        // Recursive sanitization helper
        const sanitizeRecursive = (obj: any): any => {
            if (typeof obj === 'string') {
                return scrubString(obj);
            }

            if (typeof obj !== 'object' || obj === null) {
                return obj;
            }

            if (Array.isArray(obj)) {
                return obj.map((item) => sanitizeRecursive(item));
            }

            const newObj: any = {};
            for (const [key, value] of Object.entries(obj)) {
                if (sensitivePattern.test(key)) {
                    newObj[key] = "[REDACTED]";
                } else {
                    newObj[key] = sanitizeRecursive(value);
                }
            }
            return newObj;
        };

        return sanitizeRecursive(parsed);
    } catch (e) {
        // Best-effort fallback on error
        try {
            if (typeof config === 'object' && config !== null) {
                // Return a shallow copy where all values are redacted to be safe
                const safe: any = {};
                for (const key of Object.keys(config)) {
                   safe[key] = "[REDACTED]";
                }
                return safe;
            }
        } catch (_) {}
        // Ultimate fallback
        return "[REDACTED]";
    }
}
