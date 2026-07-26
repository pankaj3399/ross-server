// Full CRC (Compliance Readiness Controls) module UI + logic e2e coverage.
// Complements the disabled premium-feature/fully-compliant specs (all-Yes
// only) with: a 100% run, a mixed run that mathematically reproduces the
// known dashboard-vs-report tier-label mismatch, NA-exclusion-from-
// denominator scoring, the incomplete-submit guard, the Quick-Wins-widget
// empty-state bug on a zero-response project, and PDF export.
//
// Does not depend on AIMA being completed first — the AI System Profile
// wizard (which gates CRC) only requires a premium account, not a finished
// AIMA assessment.
const { test, expect } = require("@playwright/test");
const { STORAGE_STATE, API_BASE_URL } = require("../constants");
const { DashboardPage } = require("../pages/dashboard.page");
const { PremiumFeaturesPage } = require("../pages/premium-features.page");
const { CrcPage } = require("../pages/crc.page");
const { CrcDashboardPage } = require("../pages/crc-dashboard.page");

test.use({ storageState: STORAGE_STATE });
test.setTimeout(10 * 60 * 1000);

// Creates a project and applies the AI System Profile wizard (unlocks CRC),
// without touching AIMA. Returns the (possibly wizard-renamed) projectId.
async function createWizardedProject(page, name) {
  const dashboard = new DashboardPage(page);
  const premiumFeatures = new PremiumFeaturesPage(page);

  await dashboard.deleteProjectIfPresent(name);
  await dashboard.createProject(name, "CRC e2e coverage project.");
  const projectId = await dashboard.startAssessment(name);
  expect(projectId).toBeTruthy();

  await premiumFeatures.completeSystemProfileWizard(projectId, name);
  return projectId;
}

// Every test creates its own project; this deletes it via a direct API call
// regardless of whether the test passed or failed, so a failed run doesn't
// leave the project behind (the dashboard's own delete flow is broken for
// never-started projects — see vulnerability-assessment.spec.js). Callers
// wrap their test body in try/finally and call this in the finally branch.
async function deleteProject(page, projectId) {
  if (!projectId) return;
  // Not thrown/asserted: this runs in a `finally` block, possibly after the
  // test itself already failed, and a throw here would replace that
  // original error rather than add to it. Logging loudly is enough to make
  // a failed cleanup visible without masking the real failure.
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

test.describe("CRC assessment → report → dashboard", () => {
  test("all 'Yes' → 100% Ready/Strong, dashboard+report agree, PDF export works", async ({ page }) => {
    const name = `E2E CRC Yes ${Date.now()}`;
    const crc = new CrcPage(page);
    const crcDash = new CrcDashboardPage(page);
    let projectId;

    try {
      await test.step("wizard + answer all 138 controls 'Yes'", async () => {
        projectId = await createWizardedProject(page, name);
        await crc.answerAllAndSubmit(projectId, "Yes");
        await expect(page).toHaveURL(/score-report-crc/i);
      });

      await test.step("report shows 100% and 'Strong'", async () => {
        await expect(crc.reportSummaryHeading).toBeVisible();
        await expect(crc.reportOverallReadiness).toBeVisible();
        await expect(page.getByText(/100(\.0)?%/).first()).toBeVisible();
        await expect(crc.reportMaturityLabel).toHaveText(/strong/i);
        await page.screenshot({ path: "e2e/.artifacts/crc-report-100.png", fullPage: true });
      });

      await test.step("dashboard agrees: 'Ready' tier, no Quick-Wins-before-data contradiction", async () => {
        await crcDash.goto(projectId);
        await expect(crcDash.tierBadge).toHaveText(/ready/i);
        await expect(crcDash.noAssessmentData).toHaveCount(0); // fully answered, so this banner must NOT show
        await page.screenshot({ path: "e2e/.artifacts/crc-dashboard-100.png", fullPage: true });
      });

      await test.step("PDF export (Full + Summary) both succeed with no console errors", async () => {
        const errors = [];
        page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

        const [download1] = await Promise.all([
          page.waitForEvent("download", { timeout: 30_000 }),
          crcDash.exportFullButton.click(),
        ]);
        expect(await download1.path()).toBeTruthy();

        const [download2] = await Promise.all([
          page.waitForEvent("download", { timeout: 30_000 }),
          crcDash.exportSummaryButton.click(),
        ]);
        expect(await download2.path()).toBeTruthy();

        expect(errors, `console errors during PDF export: ${errors.join(" | ")}`).toEqual([]);
      });
    } finally {
      await deleteProject(page, projectId);
    }
  });

  test("mixed NA/Yes/No pattern → NA excluded from denominator, dashboard/report tier-label mismatch reproduces", async ({ page }) => {
    const name = `E2E CRC Mixed ${Date.now()}`;
    const crc = new CrcPage(page);
    const crcDash = new CrcDashboardPage(page);
    let projectId;

    // Controls 0-9 (10 total) = NA, next 48 = Yes, rest = No.
    // Applicable = total - 10. With total=138: applicable=128, score=48/128=37.5%.
    // 37.5% is in the boundary zone where the two pages disagree in tone:
    // dashboard's getReadinessTier (30-59% = "Partially Ready", mildly
    // positive) vs score-report-crc's getMaturityLabel (<40% = "Needs
    // Attention", urgent).
    const pattern = (i) => {
      if (i < 10) return "NA";
      if (i < 58) return "Yes";
      return "No";
    };

    try {
      await test.step("wizard + answer with NA/Yes/No mix", async () => {
        projectId = await createWizardedProject(page, name);
        await crc.answerAllAndSubmit(projectId, pattern);
        await expect(page).toHaveURL(/score-report-crc/i);
      });

      await test.step("report reflects NA-excluded percentage, not raw yes-count/total", async () => {
        await expect(crc.reportOverallReadiness).toBeVisible();
        // naive (wrong) calc would be 48/138 = 34.8%; correct NA-excluded calc is 37.5%.
        await expect(page.getByText(/37\.5%/).first()).toBeVisible();
        await page.screenshot({ path: "e2e/.artifacts/crc-report-mixed.png", fullPage: true });
      });

      let reportLabel;
      await test.step("capture report maturity label", async () => {
        reportLabel = (await crc.reportMaturityLabel.innerText()).trim().toLowerCase();
      });

      await test.step("dashboard tier label vs report maturity label at 37.5%", async () => {
        await crcDash.goto(projectId);
        await expect(page.getByText(/37\.5%/).first()).toBeVisible();
        const dashLabel = (await crcDash.tierBadge.innerText()).trim().toLowerCase();
        await page.screenshot({ path: "e2e/.artifacts/crc-dashboard-mixed.png", fullPage: true });

        console.log(`[crc-tier-mismatch] report="${reportLabel}" dashboard="${dashLabel}" at 37.5%`);

        // Asserts the two labels actually agree at the same score. Currently
        // fails — dashboard's getReadinessTier and score-report-crc's
        // getMaturityLabel use different thresholds/vocabulary, so 37.5%
        // reads as "Partially Ready" on one and "Needs Attention" on the
        // other. Left as a real, unmasked assertion on purpose: this should
        // go red until that's fixed, and turn green on its own once it is.
        expect(
          dashLabel.includes("partially") === reportLabel.includes("needs attention"),
          `dashboard="${dashLabel}" vs report="${reportLabel}" — same 37.5% score, opposite framing`
        ).toBeFalsy();
      });
    } finally {
      await deleteProject(page, projectId);
    }
  });

  test("submit is blocked until all 138 controls are answered", async ({ page }) => {
    const name = `E2E CRC Partial ${Date.now()}`;
    const crc = new CrcPage(page);
    let projectId;

    try {
      await test.step("wizard + answer only the first 5 controls", async () => {
        projectId = await createWizardedProject(page, name);
        await crc.gotoAssessment(projectId);
        for (let i = 0; i < 5; i++) {
          const before = await crc.counter.innerText();
          await crc.answerOption("Yes").click();
          await page.waitForTimeout(300);
          await crc.nextButton.click();
          await expect.poll(() => crc.counter.innerText(), { timeout: 15_000 }).not.toBe(before);
        }
      });

      await test.step("submit button stays disabled and reports the missing count", async () => {
        await expect(crc.submitButton).toBeDisabled();
        await expect(crc.submitBlockedReason).toHaveCount(1);
        const title = await crc.submitBlockedReason.getAttribute("title");
        // Requires the actual "5/<total>" count, not just the generic phrase
        // — the total isn't hardcoded to 138 (the published control count
        // could change), but the numerator must be exactly 5 since that's
        // exactly how many controls this test answered.
        expect(title).toMatch(/5\/\d+/);
      });
    } finally {
      await deleteProject(page, projectId);
    }
  });

  test("evidence tracker: blocked URL is rejected server-side, valid URL completes the audit-ready flow", async ({ page }) => {
    const name = `E2E CRC Evidence ${Date.now()}`;
    const crc = new CrcPage(page);
    let projectId;

    try {
      projectId = await createWizardedProject(page, name);
      await crc.gotoAssessment(projectId);

      await test.step("answer the first control, then try a blocklisted evidence URL", async () => {
        await crc.answerOption("Yes").click();
        await page.waitForTimeout(400);

        await crc.evidenceStatusSelect.selectOption("Evidence in Progress");
        await page.waitForTimeout(300);

        // google.com is on the backend's BLOCKED_DOMAINS list (validateEvidenceUrl
        // in backend/src/routes/crc.ts) — the save should be rejected server-side
        // and the input should roll back, not silently accept it.
        await crc.evidenceUrlInput.fill("https://google.com");
        await crc.evidenceUrlInput.press("Tab");
        await expect(crc.blockedEvidenceUrlToast).toBeVisible({ timeout: 10_000 });
        await expect(crc.evidenceUrlInput).toHaveValue("");
        await expect(crc.auditReadyCheckbox).toHaveCount(0); // never appeared — no evidenceUrl was actually saved
      });

      await test.step("a real evidence URL saves, and the audit-ready flow completes", async () => {
        await crc.evidenceUrlInput.fill("https://docs.com");
        await crc.evidenceUrlInput.press("Tab");
        await expect(crc.evidenceUrlSavedToast).toBeVisible({ timeout: 10_000 });

        await crc.evidenceStatusSelect.selectOption("Evidence Complete");
        await page.waitForTimeout(300);

        await expect(crc.auditReadyCheckbox).toBeVisible({ timeout: 10_000 });
        await crc.auditReadyCheckbox.check();
        await expect(crc.auditReadyCheckbox).toBeChecked();
      });
    } finally {
      await deleteProject(page, projectId);
    }
  });

  test("fresh project (wizard done, zero CRC answers): Quick Wins widget renders before the empty-state check", async ({ page }) => {
    const name = `E2E CRC QuickWins ${Date.now()}`;
    const crcDash = new CrcDashboardPage(page);
    let projectId;

    try {
      projectId = await createWizardedProject(page, name);

      await crcDash.goto(projectId);
      await expect(crcDash.noAssessmentData).toBeVisible();

      // Known bug: QuickWinsWidget renders unconditionally above the
      // hasResponses check, so a zero-answer project shows recommended
      // "quick wins" at the same time as "no assessment data yet" —
      // contradictory framing.
      const quickWinsVisible = await crcDash.quickWinsHeading.isVisible().catch(() => false);
      await page.screenshot({ path: "e2e/.artifacts/crc-dashboard-quickwins-bug.png", fullPage: true });

      console.log(`[crc-quickwins-bug] Quick Wins widget visible alongside empty state: ${quickWinsVisible}`);
      expect(quickWinsVisible, "Quick Wins should NOT render before any CRC answers exist").toBeFalsy();
    } finally {
      await deleteProject(page, projectId);
    }
  });
});
