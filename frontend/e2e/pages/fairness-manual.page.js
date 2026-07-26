// Manual Prompt Testing path of Bias & Fairness Testing
// (/assess/<id>/fairness-bias -> job/<jobId> -> report?jobId=<jobId>), plus
// the separate Manual Test History list/detail views
// (/assess/<id>/fairness-bias/manual-history[/<id>]).
//
// Two different "report" views exist for the same underlying manual-prompt
// job, and they are NOT equivalent:
//   - FairnessManualReportPage (/fairness-bias/report?jobId=X) is reached by
//     the natural job-completion auto-redirect. It calls
//     GET /fairness/evaluations/:projectId (ALL evaluations ever recorded for
//     the project, not scoped to jobId at all — the jobId query param is
//     parsed by nothing in the component) and keys them by
//     `${category}:${questionText}` into a Map built by iterating the
//     newest-first array with .set() — so if the same question was ever
//     answered in an earlier job too, the OLDEST evaluation for that
//     category+question wins, not the newest.
//   - FairnessManualHistoryDetailPage (/fairness-bias/manual-history/<id>) is
//     reached via the "Manual Test History" table and calls
//     GET /fairness/manual-reports/detail/:reportId — scoped to exactly one
//     report row, always correct for that run.
class FairnessManualPage {
  constructor(page) {
    this.page = page;

    this.heading = page.getByText("Manual Prompt Testing", { exact: true }).first();
    this.responseTextarea = page.locator("#responseTextarea");
    this.nextButton = page.getByRole("button", { name: "Next", exact: true });
    this.previousButton = page.getByRole("button", { name: "Previous", exact: true });
    this.evaluateButton = page.getByRole("button", { name: "Evaluate Assessment", exact: true });
    this.currentQuestionText = page.locator(".card-google-blue h2");
    // "Question {ordinal} of {total}" is genuinely dynamic — can't drop the regex.
    this.questionOrdinal = page.getByText(/^Question \d+ of \d+$/);

    this.historyHeading = page.getByText("Manual Test History", { exact: true });
    this.historyRows = page.locator("table tbody tr");
  }

  async goto(projectId) {
    await this.page.goto(`/assess/${projectId}/fairness-bias`, { waitUntil: "domcontentloaded" });
    await this.responseTextarea.waitFor({ timeout: 30_000 });
  }

  async answerCurrentQuestion(text) {
    await this.responseTextarea.fill(text);
  }

  // Submits whatever has been answered so far and returns the jobId parsed
  // from the resulting URL (job ids look like
  // "fairness-prompts-1784018220389-jv4yp0x", not a UUID).
  async submit() {
    await this.evaluateButton.click();
    await this.page.waitForURL(/\/fairness-bias\/job\/[\w-]+/i, { timeout: 30_000 });
    const match = this.page.url().match(/\/job\/([\w-]+)/i);
    return match ? match[1] : null;
  }
}

// Shared job-status page shape for both the manual-prompt and API-automated
// paths (identical component structure, different base route). `basePath`
// e.g. `/assess/<id>/fairness-bias` (manual) or
// `/assess/<id>/fairness-bias/api-endpoint` (API).
class FairnessJobPage {
  constructor(page, basePath) {
    this.page = page;
    this.basePath = basePath;
    this.jobIdLabel = page.getByText("Job ID", { exact: true });
    this.statusBadge = page.locator("span.rounded-full.text-xs.font-semibold").first();
    this.viewReportButton = page.getByRole("button", { name: "View report", exact: true });
  }

  async waitForTerminalStatus(timeoutMs = 6 * 60 * 1000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const text = (await this.statusBadge.textContent().catch(() => null))?.trim().toLowerCase();
      if (text && ["completed", "success", "partial_success", "failed"].includes(text)) {
        return text;
      }
      await this.page.waitForTimeout(4000);
    }
    throw new Error(`Job did not reach a terminal status within ${timeoutMs}ms`);
  }

  // BUG (confirmed live 2x, 2026-07-21/22): the manual-prompt job page's
  // "Auto redirect when completed" effect
  // (fairness-bias/job/[jobId]/page.tsx:91-100) lists its own
  // `redirectScheduled` flag in the useEffect dependency array and returns a
  // `clearTimeout` cleanup. Calling `setRedirectScheduled(true)` inside the
  // effect makes React re-run that same effect (since redirectScheduled is a
  // dependency) — cleanup fires FIRST and clears the just-scheduled 2000ms
  // timeout before it can ever elapse. The redirect never fires, full stop
  // (verified idle on the job page for 85+ seconds past terminal status,
  // twice). Does NOT affect the API-automated-testing job page, which has an
  // equivalent effect but no cleanup function to cancel its async redirect.
  // Work around it here the way a real stuck user would: click "View report"
  // manually (that path is NOT broken).
  async clickViewReportManually(timeoutMs = 15_000) {
    await this.viewReportButton.isEnabled({ timeout: timeoutMs });
    await this.viewReportButton.click();
  }
}

class FairnessManualReportPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByText("Fairness & Bias Report", { exact: true });
    this.avgScore = page.getByText("Avg Score", { exact: true }).locator("xpath=following-sibling::div").first();
  }

  async goto(projectId, jobId) {
    const url = jobId
      ? `/assess/${projectId}/fairness-bias/report?jobId=${jobId}`
      : `/assess/${projectId}/fairness-bias/report`;
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    await this.heading.waitFor({ timeout: 30_000 });
  }

  // This spec only ever answers a single question per run (deliberately
  // reused across runs to probe the staleness bug — see the class-level
  // comment), so there is always at most one "Your Response" block on the
  // page: simpler and more robust than trying to scope by prompt text.
  async firstResponseText() {
    const block = this.page.getByText("Your Response", { exact: true }).first().locator("xpath=following-sibling::div").first();
    return (await block.textContent())?.trim();
  }
}

class FairnessManualHistoryDetailPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByText("Manual Prompt Report Details", { exact: true });
  }

  async goto(projectId, reportId) {
    await this.page.goto(`/assess/${projectId}/fairness-bias/manual-history/${reportId}`, { waitUntil: "domcontentloaded" });
    await this.heading.waitFor({ timeout: 30_000 });
  }

  async firstResponseText() {
    const block = this.page.getByText("Your Response", { exact: true }).first().locator("xpath=following-sibling::div").first();
    return (await block.textContent())?.trim();
  }
}

module.exports = {
  FairnessManualPage,
  FairnessJobPage,
  FairnessManualReportPage,
  FairnessManualHistoryDetailPage,
};
