class CrcDashboardPage {
  constructor(page) {
    this.page = page;

    this.noAssessmentData = page.getByText("No assessment data yet", { exact: true });
    // QuickWinsWidget's heading text varies by state ("⚡ Quick Wins:
    // Recommended for this week" active vs "Complete your AI System Profile
    // to activate Quick Wins" gated) — "Quick Wins" is the only substring
    // common to both, so this can't be an exact match.
    this.quickWinsHeading = page.getByText("Quick Wins").first();
    // "Ready" / "Partially Ready" / "Not Ready" / "Not Started" tier badge
    // next to the big circular readiness % (getReadinessTier() in
    // crc/dashboard/page.tsx) — four mutually-exclusive fixed labels. As of
    // the 2026-07-26 upstream merge (af35378), "Insufficient Data" was
    // replaced by "Not Started" (now driven by answeredCount === 0, not just
    // a null percentage) and the ≥75%/≥30% thresholds were unified with
    // score-report-crc's getMaturityLabel — see
    // [[ross-server-readiness-dashboard-qa]] for the old mismatch.
    // Scoped to <main> — see crc.page.js's reportMaturityLabel for why: the
    // secondary sidebar's project-switcher list renders per-project status
    // pills using this same vocabulary, and an unscoped page-wide locator can
    // match one of those instead of this page's own tier badge.
    this.tierBadge = page
      .locator("main")
      .getByText("Ready", { exact: true })
      .or(page.locator("main").getByText("Partially Ready", { exact: true }))
      .or(page.locator("main").getByText("Not Ready", { exact: true }))
      .or(page.locator("main").getByText("Not Started", { exact: true }))
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
