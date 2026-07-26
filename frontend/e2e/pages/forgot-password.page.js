class ForgotPasswordPage {
  constructor(page) {
    this.page = page;

    this.emailInput = page.locator("#email");
    this.sendButton = page.getByRole("button", { name: "Send reset link", exact: true });
    this.checkInboxHeading = page.getByText("Check your inbox", { exact: true });
    this.tryDifferentEmailButton = page.getByRole("button", { name: "Try a different email", exact: true });
  }

  async goto() {
    await this.page.goto("/auth/forgot-password", { waitUntil: "domcontentloaded" });
    await this.emailInput.waitFor();
  }

  async submit(email) {
    await this.emailInput.fill(email);
    await this.sendButton.click();
  }
}

module.exports = { ForgotPasswordPage };
