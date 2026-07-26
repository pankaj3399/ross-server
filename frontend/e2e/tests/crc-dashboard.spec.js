// Compliance Readiness Dashboard (/assess/<id>/crc/dashboard) — coverage
// beyond what crc-full.spec.js already exercises inline as part of the full
// CRC lifecycle (100%-Ready tier badge, the dashboard/report tier-label
// mismatch, the Quick-Wins-before-data bug, PDF export). This spec covers two
// things that lifecycle doesn't touch:
//  - the wizard gate applying to /crc/dashboard itself, not just /crc
//    (WizardGateProvider wraps the whole isPremiumRoute set per layout.tsx)
//  - Framework Readiness (EU AI Act/NIST/ISO 42001) + Evidence Progress
//    rendering on a scored project, manually QA'd once (see
//    [[ross-server-readiness-dashboard-qa]]) but never asserted in an
//    automated spec.
const { test, expect } = require("@playwright/test");
const { STORAGE_STATE, API_BASE_URL } = require("../constants");
const { DashboardPage } = require("../pages/dashboard.page");
const { PremiumFeaturesPage } = require("../pages/premium-features.page");
const { CrcPage } = require("../pages/crc.page");
const { CrcDashboardPage } = require("../pages/crc-dashboard.page");

test.use({ storageState: STORAGE_STATE });
test.setTimeout(5 * 60 * 1000);

async function deleteProject(page, projectId) {
  if (!projectId) return;
  try {
    const token = await page.evaluate(() => localStorage.getItem("auth_token"));
    const response = await page.request.delete(`${API_BASE_URL}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok()) {
      console.error(`Failed to clean up project ${projectId}: DELETE returned ${response.status()}`);
    }
  } catch (err) {
    console.error(`Failed to clean up project ${projectId}:`, err);
  }
}

test.describe("CRC Readiness Dashboard", () => {
  test("a fresh premium project without the wizard applied shows the onboarding gate, not the dashboard", async ({ page }) => {
    const name = `E2E CrcDash Gate ${Date.now()}`;
    const dashboard = new DashboardPage(page);
    const premiumFeatures = new PremiumFeaturesPage(page);
    const crcDash = new CrcDashboardPage(page);
    let projectId;

    try {
      await dashboard.createProject(name, "crc-dashboard wizard-gate e2e coverage.");
      projectId = await dashboard.startAssessment(name);
      expect(projectId).toBeTruthy();

      await page.goto(`/assess/${projectId}/crc/dashboard`, { waitUntil: "domcontentloaded" });
      await expect(premiumFeatures.onboardingHeading).toBeVisible({ timeout: 30_000 });
      await expect(crcDash.tierBadge).toHaveCount(0);
      await expect(crcDash.noAssessmentData).toHaveCount(0);
    } finally {
      await deleteProject(page, projectId);
    }
  });

  test("Framework Readiness cards and Evidence Progress render on a scored project", async ({ page }) => {
    const name = `E2E CrcDash Frameworks ${Date.now()}`;
    const dashboard = new DashboardPage(page);
    const premiumFeatures = new PremiumFeaturesPage(page);
    const crc = new CrcPage(page);
    const crcDash = new CrcDashboardPage(page);
    let projectId;

    try {
      await dashboard.createProject(name, "crc-dashboard framework-cards e2e coverage.");
      projectId = await dashboard.startAssessment(name);
      expect(projectId).toBeTruthy();
      await premiumFeatures.completeSystemProfileWizard(projectId, name);

      await crc.answerAllAndSubmit(projectId, "Yes");
      await expect(page).toHaveURL(/score-report-crc/i);

      await crcDash.goto(projectId);
      await expect(crcDash.tierBadge).toHaveText(/ready/i);

      await expect(page.getByText(/^EU AI Act$/).first()).toBeVisible();
      await expect(page.getByText(/^NIST AI RMF$/).first()).toBeVisible();
      await expect(page.getByText(/^ISO 42001$/).first()).toBeVisible();
      await expect(page.getByText(/evidence progress/i).first()).toBeVisible();

      await page.screenshot({ path: "e2e/.artifacts/crc-dashboard-frameworks.png", fullPage: true });
    } finally {
      await deleteProject(page, projectId);
    }
  });
});
