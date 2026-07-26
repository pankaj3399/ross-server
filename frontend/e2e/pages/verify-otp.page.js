class VerifyOtpPage {
  constructor(page) {
    this.page = page;

    this.checkInboxHeading = page.getByText("Check your inbox", { exact: true });
    this.verifyButton = page.getByRole("button", { name: "Verify code", exact: true });
    // Actual backend copy is "Invalid or expired OTP" (no trailing "code" —
    // backend/src/routes/auth.ts:225; the frontend's own "...OTP code"
    // fallback never actually fires since the backend always sends a real
    // error string). .first() is required, not cosmetic: the app renders
    // this same text both as an inline banner AND as a toast in the
    // notifications region — reproduced live 2026-07-18 as a strict-mode
    // "resolved to 2 elements" failure without it. .or() covers the second,
    // client-side-only validation message instead of one alternation regex.
    this.errorText = page
      .getByText("Invalid or expired OTP", { exact: true })
      .or(page.getByText("Please enter a complete 6-digit code", { exact: true }))
      .first();
    this.resendLink = page.getByRole("button", { name: "Resend code", exact: true });
  }

  async goto(email) {
    const qs = email ? `?email=${encodeURIComponent(email)}` : "";
    await this.page.goto(`/auth/verify-otp${qs}`, { waitUntil: "domcontentloaded" });
  }

  digitInput(n) {
    return this.page.getByLabel(`Digit ${n} of 6`);
  }

  async enterCode(code) {
    const digits = code.split("");
    for (let i = 0; i < digits.length; i++) {
      await this.digitInput(i + 1).fill(digits[i]);
    }
  }

  async submit(code) {
    await this.enterCode(code);
    await this.verifyButton.click();
  }
}

module.exports = { VerifyOtpPage };
