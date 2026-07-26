class ResetPasswordPage {
  constructor(page) {
    this.page = page;

    this.invalidLinkHeading = page.getByText("Invalid Reset Link", { exact: true });
    this.passwordInput = page.locator("#password");
    this.confirmPasswordInput = page.locator("#confirmPassword");
    this.submitButton = page.getByRole("button", { name: "Reset Password", exact: true });
    this.successHeading = page.getByText("Password Updated!", { exact: true });
    // The page renders `err.message || "Failed to reset password..."` — the
    // backend actually returns a specific message ("Invalid or expired reset
    // token", backend/src/routes/auth.ts:486), so that's what shows in
    // practice, not the generic fallback. Verified live 2026-07-18. `.or()`
    // covers all three fixed strings this banner can show instead of one
    // alternation regex.
    this.errorBanner = page
      .getByText("Invalid or expired reset token", { exact: true })
      .or(page.getByText("Failed to reset password", { exact: false }))
      .or(page.getByText("Passwords do not match", { exact: true }));
  }

  // token=null exercises the "Invalid Reset Link" no-token state; a
  // bogus/expired token reaches the real form but fails server-side on
  // submit with the backend's "Invalid or expired reset token" message.
  async goto(token) {
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    await this.page.goto(`/auth/reset-password${qs}`, { waitUntil: "domcontentloaded" });
  }

  async submit(password, confirmPassword = password) {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }
}

module.exports = { ResetPasswordPage };
