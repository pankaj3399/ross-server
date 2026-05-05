// MIRROR of backend/src/shared/responseKeyRegex.ts — keep both in sync until
// this monorepo gains a real shared package. The two files MUST hold the
// exact same regex and message; the frontend uses this to reject inputs
// before the server's Zod validator does.
export const RESPONSE_KEY_REGEX =
    /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\d+\])*$/;

export const RESPONSE_KEY_ERROR_MESSAGE =
    "Must be a JSON path like data.answers[0].message";
