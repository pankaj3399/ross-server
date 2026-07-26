// The "Bias & Fairness Testing" hub (/assess/<id>/fairness-bias/options).
// Wizard-gated premium route (see WizardGateProvider's isPremiumRoute set in
// layout.tsx, alongside CRC / vulnerability-assessment / inventory /
// premium-domains) — complete the AI System Profile wizard first.

class FairnessOptionsPage {
  constructor(page) {
    this.page = page;

    this.heading = page.getByText("Bias & Fairness Testing Options", { exact: true });
    this.manualCard = page.getByRole("heading", { name: "Manual Prompt Testing", exact: true });
    this.apiCard = page.getByRole("heading", { name: "API Automated Testing", exact: true });
    this.datasetCard = page.getByRole("heading", { name: "Dataset Testing", exact: true });
    this.continueButton = page.getByRole("button", { name: "Continue", exact: true });
  }

  async goto(projectId) {
    await this.page.goto(`/assess/${projectId}/fairness-bias/options`, { waitUntil: "domcontentloaded" });
    await this.heading.waitFor({ timeout: 30_000 });
  }

  async selectAndContinue(cardLocator) {
    await cardLocator.click();
    await this.continueButton.click();
  }
}

module.exports = { FairnessOptionsPage };
