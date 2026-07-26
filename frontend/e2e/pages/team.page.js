class TeamPage {
  constructor(page) {
    this.page = page;

    this.membersHeading = page.getByText("Project Members", { exact: true }).first();
    this.inviteHeading = page.getByText("Invite New Member", { exact: true }).first();
    this.upgradeGate = page.getByRole("button", { name: "Upgrade to Invite Members", exact: true });

    this.inviteEmailInput = page.locator("#inviteEmail");
    // <SelectValue placeholder="Select role" /> — lowercase "role", disappears
    // once a role is chosen, hence the combobox-role fallback for that state.
    this.roleSelectTrigger = page.getByText("Select role", { exact: true }).or(page.getByRole("combobox")).first();
    this.sendInviteButton = page.getByRole("button", { name: "Send Invite", exact: true });

    this.pendingInvitationsHeading = page.getByText("Pending & Declined Invitations", { exact: true });
    this.refreshButton = page.getByRole("button", { name: "Refresh", exact: true });
  }

  async goto(projectId) {
    await this.page.goto(`/assess/${projectId}/team`, { waitUntil: "domcontentloaded" });
    await this.inviteHeading.or(this.membersHeading).waitFor({ timeout: 30_000 });
  }

  // `email` is caller-supplied dynamic data, not UI copy — Playwright's role
  // `name` matching is already a case-insensitive substring match on a plain
  // string, so wrapping it in `new RegExp(email, "i")` added nothing except a
  // real bug: unescaped regex metacharacters in the email itself (the "."s in
  // any domain, or a "+" in a plus-addressed test email) would be interpreted
  // as regex syntax instead of literal characters.
  memberRow(email) {
    return this.page.getByRole("row", { name: email });
  }

  invitationRow(email) {
    return this.page.getByRole("row", { name: email });
  }

  async invite(email, role) {
    await this.inviteEmailInput.fill(email);
    if (role) {
      await this.roleSelectTrigger.click();
      await this.page.getByRole("option", { name: role, exact: true }).click();
    }
    await this.sendInviteButton.click();
  }

  // Revokes (or dismisses, for a declined invite) the row matching `email`.
  // Both actions open the same confirmation dialog with a "Revoke"/"Dismiss"
  // submit button.
  async revokeInvitation(email) {
    const row = this.invitationRow(email);
    await row
      .getByRole("button", { name: "Revoke", exact: true })
      .or(row.getByRole("button", { name: "Dismiss", exact: true }))
      .click();
    const dialog = this.page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: "Revoke", exact: true })
      .or(dialog.getByRole("button", { name: "Dismiss", exact: true }))
      .click();
    await dialog.waitFor({ state: "hidden" });
  }
}

module.exports = { TeamPage };
