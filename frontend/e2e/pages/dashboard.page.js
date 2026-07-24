class DashboardPage {
  constructor(page) {
    this.page = page;

    // Full text interpolates the user's name ("Welcome back, {name}! Manage
    // your AI maturity assessments") — dynamic, so this stays a substring
    // match, not exact.
    this.welcomeHeading = page.getByText("Welcome back");
    this.newProjectButton = page.getByRole("button", { name: "New Project", exact: true });

    // Radix wires each Dialog's <DialogTitle> to aria-labelledby, so the
    // dialog's accessible `name` is the title text itself — no need to
    // content-scan the whole dialog body with hasText.
    this.createDialog = page.getByRole("dialog", { name: "Create New Project", exact: true });
    this.nameInput = this.createDialog.getByPlaceholder("Enter project name", { exact: true });
    this.descriptionInput = this.createDialog.getByPlaceholder("Describe your AI system", { exact: true });
    this.createSubmitButton = page.getByRole("button", { name: "Create Project", exact: true });

    this.deleteDialog = page.getByRole("dialog", { name: "Delete Project", exact: true });
    this.deleteConfirmButton = this.deleteDialog.getByRole("button", { name: "Delete", exact: true });

    // Shown after clicking "Start" on a new project. Unlike the dialogs above,
    // PathSelectionModal.tsx renders its "Choose Your Path" heading as a plain
    // <h2>, not Radix's <DialogTitle> — so this dialog has no aria-labelledby
    // and no accessible `name` to match on. hasText is the only option here
    // until that component is fixed to use DialogTitle.
    this.pathModal = page.getByRole("dialog").filter({ hasText: "Choose Your Path" });
    this.continueAimaButton = page.getByRole("button", { name: "Continue with AIMA", exact: true });
  }

  card(name) {
    return this.page
      .locator("div", { hasText: name })
      .filter({ has: this.page.getByRole("button", { name: "Open menu", exact: true }) })
      .last();
  }

  cardMenuButton(name) {
    return this.card(name).getByRole("button", { name: "Open menu", exact: true });
  }

  // The card's name/"Open menu" button and its "Start Assessment"/"Continue
  // Assessment" CTA sit under different wrapper divs, so this requires both
  // to be present before narrowing to the innermost match. The CTA is always
  // the full "Start Assessment"/"Continue Assessment" (never a bare "Start"/
  // "Continue" — confirmed against dashboard/page.tsx's
  // `project.status === 'in_progress' ? 'Continue Assessment' :
  // 'Start Assessment'`), so .or() of the two exact strings replaces what
  // was previously one optional-suffix regex.
  cardStartButton(name) {
    const ctaButton = (scope) =>
      scope
        .getByRole("button", { name: "Start Assessment", exact: true })
        .or(scope.getByRole("button", { name: "Continue Assessment", exact: true }));

    return ctaButton(
      this.page
        .locator("div", { hasText: name })
        .filter({ has: this.page.getByRole("button", { name: "Open menu", exact: true }) })
        .filter({ has: ctaButton(this.page) })
        .last()
    );
  }

  async goto() {
    await this.page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await this.welcomeHeading.waitFor();
  }

  // Waits on the actual `POST /projects` response (201) rather than inferring
  // success from the dialog closing and the name appearing somewhere on the
  // page — the latter can't distinguish a real failure from a slow render,
  // and can't tell two same-named cards apart. Returns the created project.
  async createProject(name, description) {
    await this.goto();
    await this.newProjectButton.click();
    await this.createDialog.waitFor();
    await this.nameInput.fill(name);
    if (description) await this.descriptionInput.fill(description);

    const [response] = await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.request().method() === "POST" &&
          res.url().endsWith("/projects") &&
          res.status() === 201
      ),
      this.createSubmitButton.click(),
    ]);
    await this.createDialog.waitFor({ state: "hidden" });

    const { project } = await response.json();
    return project;
  }

  // Clicks a project's "Start"/"Continue" and resolves the AIMA path if a new
  // project shows the path-selection modal. Returns the projectId parsed
  // from the resulting /assess/<id> URL.
  async startAssessment(name) {
    await this.goto();
    await this.cardStartButton(name).click();

    if (await this.continueAimaButton.isVisible().catch(() => false)) {
      await this.continueAimaButton.click();
    }

    await this.page.waitForURL(/\/assess\/[0-9a-f-]+/i);
    const match = this.page.url().match(/\/assess\/([0-9a-f-]+)/i);
    return match ? match[1] : null;
  }

  async deleteProjectCard(name) {
    await this.cardMenuButton(name).click();
    await this.page.getByRole("menuitem", { name: "Delete", exact: true }).click();
    await this.deleteDialog.waitFor();

    await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.request().method() === "DELETE" &&
          /\/projects\/[0-9a-f-]{36}$/i.test(res.url()) &&
          res.status() === 200
      ),
      this.deleteConfirmButton.click(),
    ]);
    await this.deleteDialog.waitFor({ state: "hidden" });
  }

  async deleteProject(name) {
    await this.goto();
    await this.deleteProjectCard(name);
  }

  // Deletes every card matching `name`, not just one — card() resolves to the
  // last match, so a same-named duplicate left over from a crashed prior run
  // would otherwise never fully clear. Returns the count actually deleted.
  async deleteProjectIfPresent(name) {
    const MAX_DUPLICATES = 10;
    let deletedCount = 0;
    for (let i = 0; i < MAX_DUPLICATES; i++) {
      await this.goto();
      await this.page.waitForTimeout(800);
      const menuButton = this.cardMenuButton(name);
      if (!(await menuButton.isVisible().catch(() => false))) break;
      await this.deleteProjectCard(name);
      deletedCount++;
    }
    return deletedCount;
  }
}

module.exports = { DashboardPage };
