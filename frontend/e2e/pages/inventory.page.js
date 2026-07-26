class InventoryPage {
  constructor(page) {
    this.page = page;

    // The header "Add Component" button is always rendered, empty inventory
    // or not — the empty-state's "Add Your First Component" button is an
    // additional CTA shown alongside it, not a replacement for it, so match
    // on the header button alone rather than a non-exclusive .or().
    this.addComponentButton = page.getByRole("button", { name: "Add Component", exact: true });
    // Full copy is "Your component inventory is empty. Start by adding your
    // first AI system component." — substring match, not exact.
    this.emptyState = page.getByText("component inventory is empty");

    // Radix wires <DialogTitle> to aria-labelledby, so both dialogs' actual
    // titles ("Add New AI Component" / "Edit AI Component" / "Remove AI
    // Component") are their accessible `name` — match on that instead of
    // scanning the whole dialog body with hasText.
    this.formDialog = page
      .getByRole("dialog", { name: "Add New AI Component", exact: true })
      .or(page.getByRole("dialog", { name: "Edit AI Component", exact: true }));
    this.roleInput = this.formDialog.getByPlaceholder("Explain exactly what this component does");
    // Not getByRole: the button is nested inside the <label> for "Data
    // Categories Sent/Processed *" (inventory/page.tsx), so browsers compute
    // its accessible name from that wrapping label's text, not its own —
    // getByRole("button", {name: "Set to 'No Data Processing'"}) never
    // matches. Matching on its visible text sidesteps the broken a11y name
    // without depending on it being fixed.
    this.noDataProcessingButton = this.formDialog.getByText("Set to 'No Data Processing'", { exact: true });
    // formMode === "add" ? "Create Component" : "Save Changes" — two
    // mutually-exclusive fixed strings.
    this.createButton = this.formDialog
      .getByRole("button", { name: "Create Component", exact: true })
      .or(this.formDialog.getByRole("button", { name: "Save Changes", exact: true }));

    // Two mutually-exclusive fixed toast messages.
    this.savedToast = page
      .getByText("Component added to inventory", { exact: true })
      .or(page.getByText("Component updated successfully", { exact: true }));

    // The detail Sheet and the Delete-confirm Dialog are both Radix
    // Dialog.Content under the hood (role="dialog"); only one is open at a
    // time (openAddForm/openEditForm force the detail Sheet closed while the
    // form Dialog is open), so a plain role query is unambiguous per step.
    this.detailPanel = page.getByRole("dialog");
    this.deleteDialog = page.getByRole("dialog", { name: "Remove AI Component", exact: true });
    this.deleteConfirmButton = this.deleteDialog.getByRole("button", { name: "Delete Component", exact: true });
    this.deletedToast = page.getByText("Component removed from inventory", { exact: true });
  }

  async goto(projectId) {
    await this.page.goto(`/assess/${projectId}/inventory`, { waitUntil: "domcontentloaded" });
    await this.addComponentButton.or(this.emptyState).waitFor({ timeout: 30_000 });
  }

  // `componentName` is caller-supplied dynamic data, not UI copy —
  // Playwright's role `name` matching is already a case-insensitive
  // substring match on a plain string, so wrapping it in a RegExp added
  // nothing except a latent bug: unescaped regex metacharacters in a real
  // component name (e.g. a "." or "+") would be interpreted as regex syntax.
  row(componentName) {
    return this.page.getByRole("row", { name: componentName });
  }

  // Icon-only ghost buttons (IconEdit/IconTrash from @tabler/icons-react)
  // with no accessible name — tabler-icons-react stamps a stable
  // `tabler-icon-<name>` class on every icon's <svg>, so that's the only
  // reliable hook.
  deleteTriggerButton() {
    return this.detailPanel.locator("button:has(svg.tabler-icon-trash)");
  }

  // openAddForm() (frontend/src/app/assess/[projectId]/inventory/page.tsx)
  // pre-fills Type=Closed Foundation Model, Provider=OpenAI, Name from the
  // vendor catalog's first OpenAI model, and Status=Active — so the only
  // required fields actually missing are Role in AI System (free text) and
  // Data Categories (the "No Data Processing" shortcut satisfies it in one
  // click without opening the vendor-risk-assessment flow a real category
  // would trigger).
  // Waits on the actual `POST /inventory/:projectId` response (201) rather
  // than just the dialog closing.
  async addDefaultComponent(role) {
    await this.addComponentButton.click();
    await this.formDialog.waitFor();
    await this.roleInput.fill(role);
    await this.noDataProcessingButton.click();

    const [response] = await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.request().method() === "POST" &&
          /\/inventory\/[0-9a-f-]{36}$/i.test(res.url()) &&
          res.status() === 201
      ),
      this.createButton.click(),
    ]);
    await this.formDialog.waitFor({ state: "hidden" });

    return response.json();
  }

  async openDetail(componentName) {
    await this.row(componentName).click();
    await this.detailPanel.waitFor();
  }

  // Waits on the actual `DELETE /inventory/:projectId/:id` response (200)
  // rather than just the dialog closing.
  async deleteComponent(componentName) {
    await this.openDetail(componentName);
    await this.deleteTriggerButton().click();
    await this.deleteDialog.waitFor();

    await Promise.all([
      this.page.waitForResponse(
        (res) =>
          res.request().method() === "DELETE" &&
          /\/inventory\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/i.test(res.url()) &&
          res.status() === 200
      ),
      this.deleteConfirmButton.click(),
    ]);
    await this.deleteDialog.waitFor({ state: "hidden" });
  }
}

module.exports = { InventoryPage };
