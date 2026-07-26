// Compliance Readiness Dashboard (/assess/<id>/crc/dashboard) — coverage
// beyond what crc-full.spec.js already exercises inline as part of the full
// CRC lifecycle (100%-Ready tier badge, the dashboard/report tier-label
// mismatch, the Quick-Wins-before-data bug, PDF export). This spec covers two
// things that lifecycle doesn't touch:
//  - the AI Profile Setup nudge banner on a fresh premium project's
//    /crc/dashboard, and that the dashboard itself (not a hard gate) renders
//    underneath it. Prior to the 2026-07-26 upstream merge, WizardGateProvider
//    fully blocked isPremiumRoute pages behind PreWizardScreen until the AI
//    System Profile wizard was applied; that gate is gone (PreWizardScreen is
//    now unreferenced dead code) — the wizard is an optional, dismissible
//    nudge and every premium route renders its real content immediately.
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
  test("a fresh premium project without the wizard applied shows the dashboard directly, with a dismissible AI Profile Setup nudge", async ({ page }) => {
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
      // No hard gate: the empty-state dashboard renders immediately, with a
      // non-blocking banner nudging (not requiring) profile setup.
      await expect(premiumFeatures.wizardSetupBanner).toBeVisible({ timeout: 30_000 });
      await expect(premiumFeatures.wizard.configureButton).toBeVisible();
      await expect(crcDash.noAssessmentData).toBeVisible();
      await expect(crcDash.tierBadge).toHaveCount(0); // no score yet, but not gated out either

      // Dismissing the banner hides it (persisted per-project in
      // localStorage) without affecting the dashboard underneath.
      await premiumFeatures.dismissWizardBannerButton.click();
      await expect(premiumFeatures.wizardSetupBanner).toHaveCount(0);
      await expect(crcDash.noAssessmentData).toBeVisible();
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
