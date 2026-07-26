// AI Bias & Fairness Testing (/assess/<id>/fairness-bias/*) — the one premium
// feature the e2e README explicitly marked "out of scope; not attempted
// here." This is the first pass: create a project, complete the AI System
// Profile wizard (wizard-gated, same as CRC/vulnerability-assessment — see
// isPremiumRoute in layout.tsx), and drive all three testing paths (Manual
// Prompt Testing, API Automated Testing, Dataset Testing) end-to-end.
//
// Kept project, like premium-feature.spec.js's "Full Premium Feature": named
// exactly "bias test" (not timestamped) so it stays easy to find and inspect
// afterward. NOT deleted in a `finally` block on purpose.
//
// Bug under live investigation (see fairness-manual.page.js's class-level
// comment for the code-level theory): the manual-prompt "report" page reached
// via the natural job-completion redirect
// (/fairness-bias/report?jobId=X) ignores jobId entirely and can show a
// STALE response for a question that was re-answered in a later run, while
// the separate Manual Test History detail view
// (/fairness-bias/manual-history/<reportId>) is scoped correctly. This spec
// answers the same question twice with distinguishable text to prove it live
// rather than only by reading the code.
const { test, expect } = require("@playwright/test");
const { STORAGE_STATE, API_BASE_URL } = require("../constants");
const { DashboardPage } = require("../pages/dashboard.page");
const { PremiumFeaturesPage } = require("../pages/premium-features.page");
const { FairnessOptionsPage } = require("../pages/fairness-options.page");
const {
  FairnessManualPage,
  FairnessJobPage,
  FairnessManualReportPage,
  FairnessManualHistoryDetailPage,
} = require("../pages/fairness-manual.page");
const { FairnessApiEndpointPage, FairnessApiHistoryDetailPage, STEREOTYPED_RESPONSE } = require("../pages/fairness-api.page");
const { FairnessDatasetPage, FairnessDatasetReportPage } = require("../pages/fairness-dataset.page");

test.setTimeout(25 * 60 * 1000);

test.use({ storageState: STORAGE_STATE });

const PROJECT_NAME = "bias test";

test.describe("AI Bias & Fairness Testing", () => {
  test("manual prompt, API automated, and dataset testing paths end-to-end", async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const premiumFeatures = new PremiumFeaturesPage(page);
    const options = new FairnessOptionsPage(page);
    const manual = new FairnessManualPage(page);
    const manualReport = new FairnessManualReportPage(page);
    const manualHistoryDetail = new FairnessManualHistoryDetailPage(page);
    const apiEndpoint = new FairnessApiEndpointPage(page);
    const apiHistoryDetail = new FairnessApiHistoryDetailPage(page);
    const dataset = new FairnessDatasetPage(page);
    const datasetReport = new FairnessDatasetReportPage(page);

    let projectId;

    await test.step("create the 'bias test' project", async () => {
      await dashboard.createProject(PROJECT_NAME, "Bias & fairness testing QA pass.");
      projectId = await dashboard.startAssessment(PROJECT_NAME);
      expect(projectId).toBeTruthy();
    });

    await test.step("complete the AI System Profile wizard (unlocks fairness-bias)", async () => {
      await premiumFeatures.completeSystemProfileWizard(projectId, PROJECT_NAME);
    });

    await test.step("Bias & Fairness Testing Options hub renders all three paths", async () => {
      await options.goto(projectId);
      await expect(options.manualCard).toBeVisible();
      await expect(options.apiCard).toBeVisible();
      await expect(options.datasetCard).toBeVisible();
    });

    let questionText;
    await test.step("Manual Prompt Testing — run 1: answer the first question", async () => {
      await manual.goto(projectId);
      questionText = await manual.currentQuestionText.textContent();
      await manual.answerCurrentQuestion(
        "RUN-1 RESPONSE: Men and women are equally capable in any profession; hiring should be based on qualifications only."
      );
      const jobId = await manual.submit();
      expect(jobId).toBeTruthy();

      const job = new FairnessJobPage(page, `/assess/${projectId}/fairness-bias`);
      const status = await job.waitForTerminalStatus();
      expect(["completed", "success", "partial_success"]).toContain(status);

      // BUG: the auto-redirect never fires here — see FairnessJobPage's
      // clickViewReportManually() comment. Confirmed live twice (this run,
      // and an isolated repro) waiting 85+ seconds past terminal status.
      // Work around it by clicking "View report" manually so the rest of
      // this spec can proceed.
      await job.clickViewReportManually();
      await page.waitForURL(/\/fairness-bias\/report\?jobId=/i, { timeout: 15_000 });
      await manualReport.heading.waitFor({ timeout: 15_000 });
      const shown = await manualReport.firstResponseText();
      expect(shown, "run 1's report should show run 1's response").toContain("RUN-1 RESPONSE");
    });

    await test.step("Manual Prompt Testing — run 2: re-answer the SAME question differently", async () => {
      await manual.goto(projectId);
      const questionTextRun2 = await manual.currentQuestionText.textContent();
      expect(questionTextRun2, "run 2 should land on the same question as run 1 (fresh page load resets to prompt 0)").toBe(questionText);

      await manual.answerCurrentQuestion(
        "RUN-2 RESPONSE: This is the updated answer that should replace run 1's response in any report scoped to this job."
      );
      const jobId2 = await manual.submit();
      expect(jobId2).toBeTruthy();

      const job = new FairnessJobPage(page, `/assess/${projectId}/fairness-bias`);
      const status = await job.waitForTerminalStatus();
      expect(["completed", "success", "partial_success"]).toContain(status);

      await job.clickViewReportManually();
      await page.waitForURL(/\/fairness-bias\/report\?jobId=/i, { timeout: 15_000 });
      await manualReport.heading.waitFor({ timeout: 15_000 });
      const shownAfterRun2 = await manualReport.firstResponseText();

      // THE ACTUAL BUG CHECK: /fairness-bias/report?jobId=<jobId2> ignores
      // jobId and rebuilds from ALL evaluations ever recorded for the
      // project, keyed by category+questionText with .set() overwriting in
      // newest-first iteration order — so the OLDEST evaluation for a
      // repeated key wins. If that theory is right, this still shows RUN-1's
      // text despite being reached via run 2's own completion redirect.
      console.log(`[bias-test] /fairness-bias/report after run 2 shows: ${shownAfterRun2?.slice(0, 80)}`);
      if (shownAfterRun2?.includes("RUN-1 RESPONSE")) {
        console.log("[bias-test] CONFIRMED LIVE: report page shows stale (run 1) response after run 2 completed, and jobId query param had no effect.");
      } else if (shownAfterRun2?.includes("RUN-2 RESPONSE")) {
        console.log("[bias-test] Report page showed the fresh (run 2) response — staleness theory did not reproduce this time.");
      }
    });

    await test.step("Manual Test History detail view — check 'Your Response' rendering", async () => {
      await manual.goto(projectId);
      await manual.historyHeading.scrollIntoViewIfNeeded();
      await expect(manual.historyRows.first()).toBeVisible({ timeout: 15_000 });
      await manual.historyRows.first().click();
      await manualHistoryDetail.heading.waitFor({ timeout: 15_000 });
      const shown = await manualHistoryDetail.firstResponseText();
      console.log(`[bias-test] Manual Test History detail (latest row) 'Your Response' shows: ${shown?.slice(0, 80)}`);
      // BUG (confirmed live): this always reads "N/A", never the actual
      // submitted text. Root cause — evaluationAggregator in
      // backend/src/inngest/functions.ts (~line 526) builds each persisted
      // result as { category, prompt, success, evaluation, message } only;
      // it never includes the user's response text under any field name.
      // The frontend (manual-history/[reportId]/page.tsx ~line 293) reads
      // `item.userResponse || item.response || "N/A"`, and since neither
      // key is ever present, every report's "Your Response" section falls
      // through to the literal string "N/A" — not specific to rerunning the
      // same question, this is every Manual Prompt Testing report, always.
      // Logged, not hard-asserted, so the remaining API/dataset legs run.
      if (shown === "N/A") {
        console.log("[bias-test] CONFIRMED: 'Your Response' is always N/A on the Manual Test History detail page — the submitted answer text is never persisted/returned by the backend.");
      }
    });

    await test.step("API Automated Testing — configure and run against httpbin", async () => {
      await apiEndpoint.goto(projectId);
      await expect(apiEndpoint.heading).toBeVisible();
      await apiEndpoint.configure();
      await expect(apiEndpoint.startButton).toBeEnabled({ timeout: 15_000 });

      const jobId = await apiEndpoint.startTest();
      expect(jobId).toBeTruthy();

      const job = new FairnessJobPage(page, `/assess/${projectId}/fairness-bias/api-endpoint`);
      // 20 total fairness prompts at a 45s-per-request rate limit
      // (EVALUATION_MIN_REQUEST_INTERVAL_MS) — up to ~15 minutes worst case.
      const status = await job.waitForTerminalStatus(18 * 60 * 1000);
      expect(["completed", "success", "partial_success"]).toContain(status);

      await page.waitForURL(/\/fairness-bias\/api-history\/[\w-]+/i, { timeout: 30_000 });
      await apiHistoryDetail.heading.waitFor({ timeout: 15_000 });

      const overall = (await apiHistoryDetail.valueAfter(apiHistoryDetail.avgOverallScoreLabel).textContent())?.trim();
      const bias = (await apiHistoryDetail.valueAfter(apiHistoryDetail.avgBiasScoreLabel).textContent())?.trim();
      console.log(`[bias-test] API automated report — Avg Overall Score: ${overall}, Avg Bias Score: ${bias}`);
      expect(overall, "Avg Overall Score should be a real percentage, not N/A (unlike the known SECURITY_SCAN average_scores bug)").not.toBe("N/A");
      expect(bias, "Avg Bias Score should be a real percentage given every probe got the identical stereotyped response").not.toBe("N/A");
    });

    await test.step("Dataset Testing — upload a CSV with an unambiguous gender/outcome disparity", async () => {
      await dataset.goto(projectId);
      await dataset.uploadBiasedCsv();
      await dataset.evaluate();

      await datasetReport.waitFor();
      const verdict = (await datasetReport.verdictLabel.textContent())?.trim();
      console.log(`[bias-test] Dataset report overall verdict: ${verdict}`);
      expect(verdict, "a 100%-approved-male / 0%-approved-female dataset should not verdict as fully fair").not.toMatch(/^fair$/i);

      const noSensitive = await datasetReport.noSensitiveColumnsMessage.isVisible().catch(() => false);
      expect(noSensitive, "the 'gender' column with a 100%/0% split should be detected as a sensitive column, not reported as insufficient data").toBe(false);

      await page.screenshot({ path: "e2e/.artifacts/bias-test-dataset-report.png", fullPage: true });
    });

    console.log(`[bias test] DONE — project kept at /assess/${projectId} (not deleted, like premium-feature.spec.js's kept project).`);
  });
});
