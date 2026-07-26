class WizardPage {
  constructor(page) {
    this.page = page;

    this.configureButton = page.getByRole("button", { name: "Configure AI Profile", exact: true });
    this.modalTitle = page.getByText("AI System Profile Wizard", { exact: true });
    // WizardSection1.tsx's placeholder for path==="system" (the only path
    // this spec ever selects — see complete()'s "Single AI System" pick) is
    // "e.g. TalentSift CV Analyzer"; "TalentSift" is the distinctive
    // substring. The old regex's other alternative, "name of this AI", never
    // actually matched anything — no placeholder or label on this page
    // contains that phrase.
    this.nameInput = page.getByPlaceholder("TalentSift");
    // Full placeholder is "Describe what the system does, its inputs, and
    // intended outputs..." — substring match, not exact.
    this.descInput = page.getByPlaceholder("Describe what the system does");
    this.nextButton = page.getByRole("button", { name: "Next", exact: true });
    this.completeButton = page.getByRole("button", { name: "Complete Setup", exact: true });
    this.applyButton = page.getByRole("button", { name: "Apply Profile & Open Platform", exact: true });
  }

  selectTrigger(placeholder) {
    return this.page.getByText(placeholder, { exact: false }).first();
  }

  // `optionText` is a plain substring (case-insensitive, like all
  // getByText/getByRole name matching by default) — every wizard dropdown's
  // real SelectItem text is longer than the short label passed in from
  // complete() below (e.g. "Deployer (We use/operate the AI system in our
  // operations)"), so this was never an exact match and doesn't need to be;
  // it just no longer needs a RegExp object to do it.
  option(optionText) {
    return this.page.getByRole("option", { name: optionText }).first();
  }

  checkbox(labelSub) {
    return this.page.getByText(labelSub, { exact: false }).first();
  }

  async pick(placeholder, optionText) {
    await this.selectTrigger(placeholder).click();
    await this.option(optionText).click();
    await this.page.waitForTimeout(250);
  }

  async check(labelSub) {
    await this.checkbox(labelSub).click();
    await this.page.waitForTimeout(150);
  }

  async next() {
    await this.nextButton.click();
    await this.page.waitForTimeout(500);
  }

  // Opens the wizard and fills it with a simple, low-risk profile, then
  // applies it. Returns once the platform is unlocked. Completing the wizard
  // silently renames the project itself to `systemName` (the "Name of this
  // AI system" field) — pass a name unique to your test if you need to find
  // the project again afterwards (e.g. to delete it).
  async complete(systemName = "Full Premium Feature") {
    await this.configureButton.scrollIntoViewIfNeeded().catch(() => {});
    await this.configureButton.click();
    await this.modalTitle.waitFor();

    // Section 1 — Project Setup
    // Real SelectItem text is "Single AI System (Path A)" — substring match.
    await this.pick("Select scope type", "Single AI System");
    await this.nameInput.fill(systemName);
    await this.descInput.fill("E2E full premium feature CRC test system.").catch(() => {});
    // Real text: "Customer Service Chatbot / Generative Assistant".
    await this.pick("Select primary use case", "Customer Service Chatbot");
    await this.next();

    // Section 2 — Regulatory Role
    // Real text: "Deployer (We use/operate the AI system in our operations)".
    await this.pick("Select regulatory role", "Deployer");
    await this.next();

    // Section 3 — Data and Scope
    await this.check("Non-Personal / Industrial Data");
    await this.check("United States");
    // Real text: "Local / Small Scale (e.g., single department, city, or
    // small customer base)".
    await this.pick("Select deployment scale", "Local / Small Scale");
    await this.next();

    // Section 4 — Architecture
    // Real text: "No, we train our models from scratch / use fully
    // proprietary code".
    await this.pick("Choose third-party model usage", "No, we train our models");
    // Real text: "Human-in-the-loop (AI advises, human reviews & approves
    // every action)".
    await this.pick("Select autonomy level", "Human-in-the-loop");
    await this.next();

    // Section 5 — Existing Compliance
    await this.check("None of the above / Starting from scratch");
    await this.next();

    // Section 6 — Sensitive Domain Flags
    await this.check("None of the above sensitive domains");
    // This one's real text ("No biometric data is processed") is the full,
    // exact label, unlike the others above — still passed as a plain string
    // either way since `option()` matches by substring.
    await this.pick("Select biometric use purpose", "No biometric data is processed");
    // Real text: "No, designed purely for adult users / business systems".
    await this.pick("Select children safety impact", "designed purely for adult users");

    await this.completeButton.click();

    await this.applyButton.waitFor({ timeout: 30_000 });
    await this.applyButton.click();
    await this.applyButton.waitFor({ state: "hidden", timeout: 60_000 }).catch(() => {});
    await this.page.waitForTimeout(2500);
  }
}

module.exports = { WizardPage };
