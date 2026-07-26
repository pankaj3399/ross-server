class ReportPage {
  constructor(page) {
    this.page = page;

    this.overallScoreLabel = page.getByText("Overall Score", { exact: true });
    // The big "X.XX" figure is genuinely dynamic (a live computed score), so
    // this is one of the few locators here that has to stay a regex.
    // Renders before the domain breakdown in DOM order, so .first() reliably
    // targets it over a per-domain score.
    this.overallScoreValue = page.getByText(/^\d\.\d{2}$/).first();
    this.questionsEvaluated = page.getByText("Questions Evaluated", { exact: true });
    this.questionsEvaluatedValue = page
      .locator("div", { hasText: "Questions Evaluated" })
      .last()
      .getByText(/^\d+$/); // dynamic count, unavoidably a regex
    this.domainBreakdown = page.getByText("Domain Maturity Breakdown", { exact: true });
    // Premium projects also render their premium domain(s) — the domain's
    // name itself is backend/dataset-driven, not fixed UI copy (on this
    // deployment it happens to be "Test Premium Control Family …"), so this
    // stays a substring match rather than an exact one.
    this.premiumDomainRow = page.getByText("Premium Control Family").first();

    // Toggles between "Generating..." / "Preparing insights..." (disabled,
    // while the AI-insights job runs) / "Download Report" (idle, enabled).
    this.downloadButton = page.getByRole("button", { name: "Download Report", exact: true });
    this.preparingInsights = page.getByText("Preparing insights...", { exact: true });

    this.backToAssessmentButton = page.getByRole("button", { name: "Back to Assessment", exact: true }).first();
  }

  async download() {
    const appeared = await this.downloadButton
      .waitFor({ state: "visible", timeout: 120_000 })
      .then(() => true)
      .catch(() => false);

    if (!appeared) {
      throw new Error(
        "Download blocked: the 'Download Report' button stayed disabled " +
          "('Preparing insights...') — the AI-insights job never finished."
      );
    }

    const [download] = await Promise.all([
      this.page.waitForEvent("download", { timeout: 60_000 }),
      this.downloadButton.click(),
    ]);
    return download;
  }
}

module.exports = { ReportPage };
