// Shared constants for the UI E2E suite.
const path = require("path");

module.exports = {
  // Where auth.setup.js stores the signed-in browser state (localStorage JWT).
  STORAGE_STATE: path.join(__dirname, ".auth", "state.json"),

  EMAIL: process.env.E2E_EMAIL || "",
  PASSWORD: process.env.E2E_PASSWORD || "",

  // App under test — see e2e/.env.e2e.example. No hardcoded fallback here on
  // purpose: playwright.config.js is the only other place BASE_URL matters,
  // and it reads this same env var directly, so there's one source of truth
  // (the env file) rather than a literal duplicated across two JS files.
  BASE_URL: process.env.E2E_BASE_URL || "",

  // Backend origin for direct API calls that bypass the UI (e.g. project
  // cleanup DELETEs — see the dashboard delete-flow bug noted in
  // vulnerability-assessment.spec.js). No hardcoded fallback: this backs a
  // destructive call, so it must come from the same env file as
  // E2E_BASE_URL (see .env.e2e.example) rather than risk silently pointing
  // at a default backend that doesn't match wherever E2E_BASE_URL actually
  // points.
  API_BASE_URL: process.env.E2E_API_URL || "",

  // AIMA answer options, exactly as rendered in QuestionView.
  // (value scale, for reference: No = 0, Partially = 1.5, Yes = 3)
  AIMA_ANSWERS: ["No", "Partially", "Yes"],

  // Safety cap on the answer loop (free AIMA = 144 Qs; premium adds a few).
  MAX_QUESTIONS: 200,
};
