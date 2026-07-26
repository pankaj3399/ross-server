class InvitePage {
  constructor(page) {
    this.page = page;

    this.invalidHeading = page.getByText("Invalid Invitation", { exact: true });
    this.projectInvitationHeading = page.getByText("Project Invitation", { exact: true });
    this.acceptButton = page.getByRole("button", { name: "Accept Invitation", exact: true });
    this.declineButton = page.getByRole("button", { name: "Decline Invitation", exact: true });
    this.signInAndAcceptButton = page.getByRole("button", { name: "Sign In & Accept", exact: true });
    this.createAccountButton = page.getByRole("button", { name: "Create Account & Accept", exact: true });
  }

  // token=null exercises the "No invitation token provided" path;
  // a bogus/expired token exercises the "Invalid or expired invitation
  // token" path (both render the same invalidHeading card).
  async goto(token) {
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    await this.page.goto(`/invite/accept${qs}`, { waitUntil: "domcontentloaded" });
  }
}

module.exports = { InvitePage };
