class CrcDashboardPage {
  constructor(page) {
    this.page = page;

    this.noAssessmentData = page.getByText("No assessment data yet", { exact: true });
    // QuickWinsWidget's heading text varies by state ("⚡ Quick Wins:
    // Recommended for this week" active vs "Complete your AI System Profile
    // to activate Quick Wins" gated) — "Quick Wins" is the only substring
    // common to both, so this can't be an exact match.
    this.quickWinsHeading = page.getByText("Quick Wins").first();
    // "Ready" / "Partially Ready" / "Not Ready" / "Insufficient Data" tier
    // badge next to the big circular readiness % (getReadinessTier() in
    // crc/dashboard/page.tsx) — four mutually-exclusive fixed labels.
    this.tierBadge = page
      .getByText("Ready", { exact: true })
      .or(page.getByText("Partially Ready", { exact: true }))
      .or(page.getByText("Not Ready", { exact: true }))
      .or(page.getByText("Insufficient Data", { exact: true }))
      .first();
    this.overallReadinessLabel = page.getByText("Overall Readiness", { exact: true }).first();
    this.exportFullButton = page.getByRole("button", { name: "Download Full PDF", exact: true }).first();
    this.exportSummaryButton = page.getByRole("button", { name: "Download Summary", exact: true }).first();
  }

  async goto(projectId) {
    await this.page.goto(`/assess/${projectId}/crc/dashboard`, { waitUntil: "domcontentloaded" });
    // Wait for whichever stable state the 4-call load waterfall settles into
    // — a scored tier badge, or the empty state on a zero-answer project —
    // instead of a fixed sleep. .or() rejects if neither appears within the
    // timeout, so a real load failure still surfaces at the call site.
    await this.tierBadge.or(this.noAssessmentData).waitFor({ timeout: 30_000 });
  }
}

module.exports = { CrcDashboardPage };
