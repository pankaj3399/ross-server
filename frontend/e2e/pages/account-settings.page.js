class AccountSettingsPage {
  constructor(page) {
    this.page = page;

    this.heading = page.getByText("Account Settings", { exact: true }).first();

    // Notifications — each Switch's id matches its Label's htmlFor exactly
    // (weekly_digest / critical_alerts / vendor_reassessment), so getByLabel
    // resolves the underlying Radix switch button directly.
    this.weeklyDigestSwitch = page.getByLabel("Weekly Digest", { exact: true });
    this.criticalAlertsSwitch = page.getByLabel("Critical Risk Alerts", { exact: true });
    this.vendorReassessmentSwitch = page.getByLabel("Vendor Reassessment Reminders", { exact: true });

    this.deletedProjectsHeading = page.getByText("Deleted Projects", { exact: true }).first();
    // Start of a longer sentence ("No deleted projects. Projects you delete
    // will be kept here for 30 days...") — substring match, not exact.
    this.noDeletedProjectsText = page.getByText("No deleted projects");
  }

  async goto() {
    await this.page.goto("/settings", { waitUntil: "domcontentloaded" });
    await this.heading.waitFor({ timeout: 30_000 });
  }

  // The wrapping <div> holds an <h4>{name}</h4> plus a "Restore" button —
  // match on text rather than a heading role to keep this independent of
  // how h4 gets mapped to accessibility roles. `name` itself is caller-
  // supplied dynamic data (a project name), not a UI-copy regex, so it's
  // left as a plain string substring match here — this isn't the kind of
  // locator that has a fixed accessible name to pin to.
  deletedProjectRestoreButton(name) {
    return this.page
      .locator("div")
      .filter({ hasText: name })
      .filter({ has: this.page.getByRole("button", { name: "Restore", exact: true }) })
      .last()
      .getByRole("button", { name: "Restore", exact: true });
  }

  async restoreDeletedProject(name) {
    await this.deletedProjectRestoreButton(name).click();
  }
}

module.exports = { AccountSettingsPage };
