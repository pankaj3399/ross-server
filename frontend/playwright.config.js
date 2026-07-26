// Playwright config for the MATUR.ai frontend UI E2E suite.
// Docs: https://playwright.dev/docs/test-configuration
const { defineConfig, devices } = require("@playwright/test");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "e2e/.env.e2e") });

// Single source of truth: BASE_URL comes from e2e/constants.js (which reads
// E2E_BASE_URL — see e2e/.env.e2e.example), not a literal duplicated here.
const { BASE_URL } = require("./e2e/constants");

module.exports = defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.artifacts/test-results",
  // The AIMA flow answers ~145 questions in the UI, so give specs generous room.
  timeout: 8 * 60 * 1000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "./e2e/.artifacts/report", open: "never" }],
  ],
  use: {
    baseURL: BASE_URL,
    // The assess page holds long-lived connections; never wait for networkidle.
    navigationTimeout: 45_000,
    actionTimeout: 20_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 2560, height: 1440 },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.js/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      // devices["Desktop Chrome"] carries its own 1280x720 viewport, which
      // would silently win over the global `use.viewport` above since
      // project-level `use` is merged on top of it — so the 1440p viewport
      // has to be reasserted here, after the spread, to actually apply.
      use: { ...devices["Desktop Chrome"], viewport: { width: 2560, height: 1440 } },
    },
  ],

  // To run against a local dev server: set E2E_BASE_URL=http://localhost:3000
  // and uncomment. (Requires the app's NEXT_PUBLIC_API_URL to point at a backend.)
  // webServer: {
  //   command: "npm run dev",
  //   url: BASE_URL,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120_000,
  // },
});
