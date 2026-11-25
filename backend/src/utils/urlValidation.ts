/**
 * Strict HTTP/HTTPS URL scheme validation for user-supplied external URLs.
 * Rejects dangerous schemes such as javascript:, data:, vbscript:, file:, etc.
 */

export interface UrlValidationOptions {
  allowHttp?: boolean;
  fieldLabel?: string;
}

export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}

export function validateHttpUrl(
  raw: unknown,
  options: UrlValidationOptions = {}
): UrlValidationResult {
  const { allowHttp = true, fieldLabel = "URL" } = options;

  if (typeof raw !== "string" || !raw.trim()) {
    return { valid: false, error: `${fieldLabel} is required.` };
  }

  const trimmed = raw.trim();

  // Reject ASCII control characters (newlines, tabs, null bytes) that can obfuscate schemes
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return { valid: false, error: `${fieldLabel} contains invalid control characters.` };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: `${fieldLabel} must be a valid URL starting with ${allowHttp ? "http:// or https://" : "https://"}.`,
    };
  }

  const allowedProtocols = allowHttp ? ["https:", "http:"] : ["https:"];
  if (!allowedProtocols.includes(parsed.protocol)) {
    return {
      valid: false,
      error: `${fieldLabel} must use ${allowHttp ? "http:// or https://" : "https://"} protocol.`,
    };
  }

  if (!parsed.hostname) {
    return {
      valid: false,
      error: `${fieldLabel} must include a valid domain host.`,
    };
  }

  return { valid: true, normalizedUrl: trimmed };
}
