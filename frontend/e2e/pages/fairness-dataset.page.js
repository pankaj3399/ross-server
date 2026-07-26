// Dataset Testing path of Bias & Fairness Testing
// (/assess/<id>/fairness-bias/dataset-testing -> .../report).
//
// A CSV engineered for a clear, unambiguous disparity: every "Male" row is
// "approved", every "Female" row is "denied" (10 rows, 5/5 split) — headers
// "gender" and "loan_approved" both hit the backend's SENSITIVE_KEYWORDS /
// TARGET_COLUMN_KEYWORDS lists (datasetFairness.ts), and "approved"/"denied"
// are recognized POSITIVE_KEYWORDS/NEGATIVE_KEYWORDS. This should force a
// 100% vs 0% selection rate (disparity 1.0, "fail" verdict) — good for
// asserting the detector actually catches an obvious case, not just that a
// report renders. The free-text "notes" column carries a mild occupational
// stereotype so toxicity/relevancy/faithfulness aren't "insufficient_data".
const BIASED_CSV = [
  "gender,age,income,notes,loan_approved",
  'Male,35,72000,"He is a strong candidate for a senior engineering role.",approved',
  'Male,42,68000,"He has excellent leadership and analytical skills.",approved',
  'Male,29,61000,"He is naturally good with technical problem solving.",approved',
  'Male,50,75000,"He shows strong financial discipline.",approved',
  'Male,33,80000,"He is a reliable and steady earner.",approved',
  'Female,31,70000,"She is naturally more suited to a caring, supportive role.",denied',
  'Female,45,65000,"She may struggle with the technical demands of the job.",denied',
  'Female,28,60000,"She seems less focused on career advancement.",denied',
  'Female,38,72000,"She is likely to prioritize family over work.",denied',
  'Female,52,77000,"She is not seen as assertive enough for this role.",denied',
].join("\n");

class FairnessDatasetPage {
  constructor(page) {
    this.page = page;

    this.heading = page.getByText("Dataset Testing & Evaluation", { exact: true });
    this.fileInput = page.locator("#csv-upload");
    this.evaluateButton = page.getByRole("button", { name: "Run Fairness Evaluation", exact: true });
    this.previewHeading = page.getByText("Dataset Snapshot", { exact: true });

    // NOTE: the old /report history/i regex never actually matched anything
    // — ReportHistory.tsx's real heading is "Recent Evaluations", not
    // "Report History" (confirmed against source; nothing on this page
    // renders that phrase). Fixed here, though this locator turned out to be
    // unused in the current specs (only fairness-manual.page.js's
    // historyHeading — a different instance for a different heading that
    // really does say "Manual Test History" — is actually asserted on).
    this.historyHeading = page.getByText("Recent Evaluations", { exact: true }).first();
  }

  async goto(projectId) {
    await this.page.goto(`/assess/${projectId}/fairness-bias/dataset-testing`, { waitUntil: "domcontentloaded" });
    await this.fileInput.waitFor({ state: "attached", timeout: 30_000 });
  }

  async uploadBiasedCsv(fileName = "loan-approvals.csv") {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(BIASED_CSV, "utf-8"),
    });
    await this.previewHeading.waitFor({ timeout: 15_000 });
  }

  async evaluate() {
    await this.evaluateButton.isEnabled({ timeout: 15_000 });
    await this.evaluateButton.click();
    await this.page.waitForURL(/\/fairness-bias\/dataset-testing\/report/i, { timeout: 30_000 });
  }
}

class FairnessDatasetReportPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByText("Fairness & Bias Evaluation Summary", { exact: true });
    this.verdictLabel = page.getByText("Overall verdict", { exact: true }).locator("xpath=following-sibling::p").first();
    // "{N} groups analyzed" — N is dynamic, so this stays a substring match.
    this.sensitiveColumnsCount = page.getByText("groups analyzed");
    // Real copy (report/page.tsx) is "No sensitive columns detected or
    // insufficient data to compute disparities." — kept as a substring match
    // since it's part of a longer sentence, just without the regex wrapper.
    this.noSensitiveColumnsMessage = page.getByText("No sensitive columns detected");
  }

  async waitFor() {
    await this.heading.waitFor({ timeout: 30_000 });
  }
}

module.exports = { FairnessDatasetPage, FairnessDatasetReportPage, BIASED_CSV };
