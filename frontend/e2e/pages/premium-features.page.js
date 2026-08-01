const { WizardPage } = require("./wizard.page");

class PremiumFeaturesPage {
  constructor(page) {
    this.page = page;

    // Two possible states: the feature hub (premium) or the upgrade gate
    // (not premium). The old third state — a full-screen onboarding gate
    // blocking the hub until the AI System Profile wizard was completed —
    // no longer exists: WizardGateProvider now renders the hub directly for
    // every premium user, with a dismissible "AI Profile Setup" nudge banner
    // on top when the wizard hasn't been completed/skipped yet (see
    // wizardSetupBanner below). PreWizardScreen.tsx is unreferenced dead
    // code as of the 2026-07-26 upstream merge.
    this.hubHeading = page.getByText("Take your AI governance to the next level", { exact: true });
    this.upgradeGate = page.getByRole("button", { name: "Upgrade to Premium", exact: true });

    // The non-blocking banner shown above feature content (hub, CRC,
    // vulnerability assessment, fairness-bias, inventory...) until the
    // wizard is completed or dismissed via "Skip for Now"/"Dismiss". Real
    // text is "⚡ AI Profile Setup" — substring match to avoid encoding the
    // emoji prefix exactly.
    this.wizardSetupBanner = page.getByText("AI Profile Setup", { exact: false });
    this.dismissWizardBannerButton = page.getByRole("button", { name: "Dismiss", exact: true });

    this.vulnerabilityCard = page.getByText("AI Vulnerability Assessment", { exact: true }).first();
    this.biasCard = page.getByText("Automated Bias & Fairness Testing", { exact: true }).first();
    // Full card title is "Compliance Readiness Controls (CRC)" — the old
    // regex only ever matched as a prefix of that; kept as an explicit
    // substring match (not exact) rather than typing out the "(CRC)" suffix.
    this.crcCard = page.getByText("Compliance Readiness Controls");
    this.premiumDomains = page.getByText("Premium Domains Assessment", { exact: true });

    // Left assess sidebar — present for a premium account, absent/locked
    // otherwise. Post-2026-07-26 secondary-sidebar redesign, items are
    // grouped under section headers ("CRC Governance & Controls",
    // "Fairness & Bias", "Security & Assets"); the nav item text itself is
    // "CRC Dashboard" (not bare "CRC"), and there's no single "Bias &
    // Fairness Testing" item anymore — matching the section header instead.
    this.sidebarVulnerability = page.getByText("AI Vulnerability Assessment", { exact: true }).first();
    this.sidebarCrc = page.getByText("CRC Dashboard", { exact: true }).first();
    this.sidebarBias = page.getByText("Fairness & Bias", { exact: true }).first();

    this.wizard = new WizardPage(page);
  }

  async goto(projectId) {
    await this.page.goto(`/assess/${projectId}/premium-features`, { waitUntil: "domcontentloaded" });
  }

  // Returns true if the account is premium (hub rendered), false if the
  // upgrade gate showed instead.
  async isPremium(projectId) {
    await this.goto(projectId);
    await Promise.race([
      this.hubHeading.waitFor({ timeout: 30_000 }).catch(() => {}),
      this.upgradeGate.waitFor({ timeout: 30_000 }).catch(() => {}),
    ]);
    if (await this.upgradeGate.isVisible().catch(() => false)) return false;
    return await this.hubHeading.isVisible().catch(() => false);
  }

  // Completes (and applies) the AI System Profile wizard nudged via the
  // dismissible "AI Profile Setup" banner (no longer a hard gate — the hub/
  // feature content is already visible underneath). Returns true if it ran
  // the wizard, false if it was already applied/skipped (banner absent). See
  // WizardPage.complete() re: systemName — it becomes the project's new
  // display name.
  async completeSystemProfileWizard(projectId, systemName) {
    await this.goto(projectId);
    // Don't race this against hubHeading: the hub renders immediately
    // regardless of wizard state (see class-level comment), so racing it in
    // would resolve the wait before the banner/button ever gets a chance to
    // render and cause a false "already applied/skipped" result. Wait on the
    // button itself for the full timeout instead.
    await this.wizard.configureButton.waitFor({ timeout: 30_000 }).catch(() => {});
    if (!(await this.wizard.configureButton.isVisible().catch(() => false))) return false; // banner not shown: already applied or skipped
    await this.wizard.complete(systemName);
    return true;
  }
}

module.exports = { PremiumFeaturesPage };
