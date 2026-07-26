const { expect } = require("@playwright/test");

// HTTPS, not on the backend's evidence-URL blocklist (google.com, example.com,
// localhost, etc.), so it validates as a real evidence link.
const EVIDENCE_URL = "https://docs.com";

class CrcPage {
  constructor(page) {
    this.page = page;

    // crc/welcome/page.tsx: `hasProgress ? "Continue to the CRC assessment"
    // : "Start CRC assessment"` — two mutually-exclusive fixed strings
    // (lowercase "assessment", verified against source).
    this.welcomeStartLink = page
      .getByRole("link", { name: "Start CRC assessment", exact: true })
      .or(page.getByRole("link", { name: "Continue to the CRC assessment", exact: true }));

    // "Control N of M" is genuinely dynamic (live counter), so this is the
    // one locator in this file that can't drop the regex.
    this.counter = page.getByText(/Control \d+ of \d+/).first();
    this.nextButton = page.getByRole("button", { name: "Next", exact: true });
    this.submitButton = page.getByRole("button", { name: "Submit Assessment", exact: true });

    this.evidenceStatusSelect = page.getByLabel("Select Status", { exact: true });
    // Full label text is "Evidence URL (HTTPS required)" — substring match,
    // not exact.
    this.evidenceUrlInput = page.getByLabel("Evidence URL");
    // Full label text is "🔒 Audit-ready confirmation" — substring match to
    // avoid having to encode the emoji prefix exactly.
    this.auditReadyCheckbox = page.getByLabel("Audit-ready confirmation");

    // Sonner toasts (see frontend/src/lib/toast.ts) render their message as
    // plain text; Playwright's getByText is already a case-insensitive
    // substring match on a plain string, so no regex is needed to match
    // against the backend's longer exact error copy.
    this.blockedEvidenceUrlToast = page.getByText("does not appear to be a real evidence document");
    this.evidenceUrlSavedToast = page.getByText("Evidence URL saved", { exact: true });

    this.reportSummaryHeading = page.getByText("Compliance Readiness Summary", { exact: true });
    this.reportOverallReadiness = page.getByText("Overall compliance readiness", { exact: true });
    this.reportByCategory = page.getByText("By Category", { exact: true });
    // "Strong"/"Moderate"/"Developing"/"Needs Attention" maturity badge on
    // /score-report-crc, next to the overall % (getMaturityTier()'s labels).
    this.reportMaturityLabel = page
      .getByText("Strong", { exact: true })
      .or(page.getByText("Moderate", { exact: true }))
      .or(page.getByText("Developing", { exact: true }))
      .or(page.getByText("Needs Attention", { exact: true }))
      .first();
    // title attribute interpolates live counts ("Answer all controls (3/138)
    // before submitting"), so this stays a substring match, just without the
    // regex wrapper.
    this.submitBlockedReason = page.getByTitle("Answer all controls");
  }

  answerOption(label) {
    return this.page.getByText(label, { exact: true }).first();
  }

  // Fully populates one control's evidence tracker: status -> URL -> status
  // -> audit-ready. Assumes the control has already been answered.
  async fillEvidenceTracker() {
    await this.evidenceStatusSelect.selectOption("Evidence in Progress");
    await this.page.waitForTimeout(300);

    await this.evidenceUrlInput.fill(EVIDENCE_URL);
    await this.evidenceUrlInput.press("Tab"); // blur triggers save-on-blur
    await this.page.waitForTimeout(300);

    await this.evidenceStatusSelect.selectOption("Evidence Complete");
    await this.page.waitForTimeout(300);

    await expect(this.auditReadyCheckbox).toBeVisible({ timeout: 10_000 }); // renders once the URL is saved
    await this.auditReadyCheckbox.check();
    await this.page.waitForTimeout(300);
  }

  // Navigates to the first unanswered control, going through the welcome
  // page's "Start"/"Continue" CTA if present. Shared by answerAllAndSubmit
  // and any test that only needs a control or two, not a full walk.
  async gotoAssessment(projectId) {
    await this.page.goto(`/assess/${projectId}/crc/welcome`, { waitUntil: "domcontentloaded" });
    const started = await this.welcomeStartLink
      .waitFor({ timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    if (started) await this.welcomeStartLink.click();
    else await this.page.goto(`/assess/${projectId}/crc`, { waitUntil: "domcontentloaded" });

    await expect(this.counter).toBeVisible({ timeout: 30_000 });
  }

  // Answers every control, walking via "Next", then submits. Lands on
  // /score-report-crc. Requires the wizard to have been applied first.
  // `labelOrFn` is either a fixed answer label ("Yes"/"No"/"Partially"/"NA"/
  // "Not Sure") applied to every control, or a function (index, total) =>
  // label for a mixed pattern (index is 0-based). Pass withEvidence to also
  // fully populate each control's evidence tracker before moving on.
  async answerAllAndSubmit(projectId, labelOrFn = "Yes", withEvidence = false) {
    await this.gotoAssessment(projectId);

    for (let i = 0; i < 300; i++) {
      const text = await this.counter.innerText();
      const match = text.match(/Control (\d+) of (\d+)/);
      const total = match ? Number(match[2]) : null;
      // Derived from the displayed "Control N of M", not the loop variable:
      // gotoAssessment() can resume at the first unanswered control (not
      // necessarily #1), so a mixed pattern keyed on the loop index would be
      // applied to the wrong controls after a resume.
      const index = match ? Number(match[1]) - 1 : i;
      const label = typeof labelOrFn === "function" ? labelOrFn(index, total) : labelOrFn;

      await this.answerOption(label).click();
      await this.page.waitForTimeout(400); // let the answer persist

      if (withEvidence) await this.fillEvidenceTracker();

      if (match && Number(match[1]) >= Number(match[2])) break; // last control answered

      if (!(await this.nextButton.isEnabled().catch(() => false))) break;
      await this.nextButton.click();
      await expect.poll(() => this.counter.innerText(), { timeout: 15_000 }).not.toBe(text);
    }

    await expect(this.submitButton).toBeEnabled({ timeout: 90_000 }); // enables once every control is answered
    await this.submitButton.click();
    await this.page.waitForURL(/score-report-crc/i, { timeout: 90_000 });
  }
}

module.exports = { CrcPage };
