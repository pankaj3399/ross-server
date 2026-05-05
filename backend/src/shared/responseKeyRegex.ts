// SYNC SOURCE — canonical definition of the Response Output Path validator.
// Mirror copy: frontend/src/lib/responseKeyRegex.ts. Keep both in sync until
// this monorepo gains a real shared package.
//
// Matches dot-and-bracket JSON paths starting with an identifier, e.g.
// `data.answers[0].message` or `choices[0].message.content`. Used by the
// API Testing tool form (frontend) and the /fairness evaluation endpoint
// (backend) so client-side validation rejects exactly what the server would.
export const RESPONSE_KEY_REGEX =
    /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\d+\])*$/;

export const RESPONSE_KEY_ERROR_MESSAGE =
    "Must be a JSON path like data.answers[0].message";
