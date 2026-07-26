const { WizardPage } = require("./wizard.page");

class PremiumFeaturesPage {
  constructor(page) {
    this.page = page;

    // Three possible states: the feature hub (profile configured), the
    // onboarding gate (fresh premium project), or the upgrade gate (not
    // premium). Either of the first two proves the account is premium.
    this.hubHeading = page.getByText("Take your AI governance to the next level", { exact: true });
    this.onboardingHeading = page
      .getByText("Personalize Your Compliance Experience", { exact: true })
      .or(page.getByText("Premium Onboarding Flow", { exact: true }))
      .first();
    this.upgradeGate = page.getByRole("button", { name: "Upgrade to Premium", exact: true });

    this.vulnerabilityCard = page.getByText("AI Vulnerability Assessment", { exact: true }).first();
    this.biasCard = page.getByText("Automated Bias & Fairness Testing", { exact: true }).first();
    // Full card title is "Compliance Readiness Controls (CRC)" — the old
    // regex only ever matched as a prefix of that; kept as an explicit
    // substring match (not exact) rather than typing out the "(CRC)" suffix.
    this.crcCard = page.getByText("Compliance Readiness Controls");
    this.premiumDomains = page.getByText("Premium Domains Assessment", { exact: true });

    // Left assess sidebar — present for a premium account, absent/locked
    // otherwise. Sidebar labels are shorter than the feature-hub card
    // titles above ("AI Vulnerability Assessment" / "Bias & Fairness
    // Testing", not "Automated Bias & Fairness Testing").
    this.sidebarVulnerability = page.getByText("AI Vulnerability Assessment", { exact: true }).first();
    this.sidebarCrc = page.getByText("CRC", { exact: true }).first();
    this.sidebarBias = page.getByText("Bias & Fairness Testing", { exact: true }).first();

    this.wizard = new WizardPage(page);
  }

  async goto(projectId) {
    await this.page.goto(`/assess/${projectId}/premium-features`, { waitUntil: "domcontentloaded" });
  }

  // Returns true if the account is premium (hub or onboarding rendered),
  // false only if the upgrade gate showed instead.
  async isPremium(projectId) {
    await this.goto(projectId);
    await Promise.race([
      this.hubHeading.waitFor({ timeout: 30_000 }).catch(() => {}),
      this.onboardingHeading.waitFor({ timeout: 30_000 }).catch(() => {}),
      this.upgradeGate.waitFor({ timeout: 30_000 }).catch(() => {}),
    ]);
    if (await this.upgradeGate.isVisible().catch(() => false)) return false;
    return (await this.hubHeading.isVisible().catch(() => false)) || (await this.onboardingHeading.isVisible().catch(() => false));
  }

  // Completes (and applies) the AI System Profile wizard that gates CRC /
  // premium features for a fresh premium project. Returns true if it ran the
  // wizard, false if it was already applied. See WizardPage.complete() re:
  // systemName — it becomes the project's new display name.
  async completeSystemProfileWizard(projectId, systemName) {
    await this.goto(projectId);
    await Promise.race([
      this.wizard.configureButton.waitFor({ timeout: 30_000 }).catch(() => {}),
      this.hubHeading.waitFor({ timeout: 30_000 }).catch(() => {}),
    ]);
    if (!(await this.wizard.configureButton.isVisible().catch(() => false))) return false; // already applied
    await this.wizard.complete(systemName);
    return true;
  }
}

module.exports = { PremiumFeaturesPage };
