// Auth flows beyond plain login: signup validation, wrong-credentials login,
// forgot/reset password, and email/OTP verification.
//
// None of these tests create a real account or complete a real password
// reset/email verification — doing that needs a mailbox this suite doesn't
// have (the reset link / OTP / verify-email link only ever reach a real
// inbox). Instead this covers every one of these pages' client-side and
// server-rejection error paths, which are exercisable with fabricated
// emails/tokens and don't touch the shared E2E_EMAIL test account's actual
// password or leave new persisted accounts behind. See team-invite.spec.js
// for the same scoping decision applied to invite acceptance.
const { test, expect } = require("@playwright/test");
const { EMAIL } = require("../constants");
const { AuthPage } = require("../pages/auth.page");
const { ForgotPasswordPage } = require("../pages/forgot-password.page");
const { ResetPasswordPage } = require("../pages/reset-password.page");
const { VerifyEmailPage } = require("../pages/verify-email.page");
const { VerifyOtpPage } = require("../pages/verify-otp.page");

// This suite intentionally runs signed OUT (no storageState) — these are all
// pre-login/account-recovery pages.

test.describe("Login", () => {
  test("wrong password shows an error and does not redirect to the dashboard", async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.attemptLogin(EMAIL, "definitely-the-wrong-password-e2e");
    await expect(auth.errorText(/invalid|incorrect|credentials/i)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe("Signup validation", () => {
  test("mismatched passwords are blocked client-side before any account is created", async ({ page }) => {
    const auth = new AuthPage(page);
    const uniqueEmail = `e2e-signup-${Date.now()}@example.com`;
    await auth.fillSignupForm({
      // Not "E2E" — the name field's pattern (^[^0-9]*$) rejects digits,
      // and "E2E" contains a literal "2". Reproduced live 2026-07-18 as a
      // native "Please match the requested format" failure that pre-empts
      // form submission before the JS mismatch check ever runs.
      name: "Signup Test",
      email: uniqueEmail,
      password: "ValidPass1!",
      confirmPassword: "DifferentPass1!",
    });
    await auth.createAccountButton.click();
    await expect(auth.errorText(/passwords do not match/i)).toBeVisible({ timeout: 5_000 });
    // Still on /auth, never reached the post-signup redirect to verify-otp —
    // confirms register() was never called (see handleSubmit's mismatch
    // check in frontend/src/app/auth/page.tsx, which runs before the API call).
    await expect(page).toHaveURL(/\/auth\?isLogin=false/);
  });
});

test.describe("Forgot password", () => {
  test("submitting any well-formed email shows the generic 'check your inbox' state", async ({ page }) => {
    // A fabricated, never-registered address on purpose: the endpoint always
    // returns the same generic success regardless of whether an account
    // exists (frontend/src/app/auth/forgot-password/page.tsx), so this
    // doesn't need — and shouldn't use — a real account's email.
    const forgotPassword = new ForgotPasswordPage(page);
    await forgotPassword.goto();
    await forgotPassword.submit(`e2e-nonexistent-${Date.now()}@example.com`);
    await expect(forgotPassword.checkInboxHeading).toBeVisible({ timeout: 15_000 });

    await forgotPassword.tryDifferentEmailButton.click();
    await expect(forgotPassword.emailInput).toBeVisible();
  });
});

test.describe("Reset password", () => {
  test("no token shows the invalid-link state, not the form", async ({ page }) => {
    const resetPassword = new ResetPasswordPage(page);
    await resetPassword.goto(null);
    await expect(resetPassword.invalidLinkHeading).toBeVisible({ timeout: 15_000 });
  });

  test("a bogus/expired token reaches the form but is rejected server-side on submit", async ({ page }) => {
    const resetPassword = new ResetPasswordPage(page);
    await resetPassword.goto("not-a-real-reset-token-e2e");
    await expect(resetPassword.invalidLinkHeading).toHaveCount(0); // form renders, not the no-token state
    await resetPassword.submit("NewValidPass1!");
    await expect(resetPassword.errorBanner).toBeVisible({ timeout: 15_000 });
    await expect(resetPassword.successHeading).toHaveCount(0);
  });
});

test.describe("Verify email (link-based)", () => {
  // See VerifyEmailPage's goto() comment: this asserts the current (buggy)
  // behavior, not the intended one — a token-only request 400s with "Email
  // and OTP are required" because the backend never implemented a
  // token-based path, not with an "invalid/expired token" message. This
  // should be revisited (and can go back to asserting an actual
  // invalid-token message) if that's ever fixed backend-side.
  test("a token-only request 400s (backend has no token-based verify path — see page object)", async ({ page }) => {
    const verifyEmail = new VerifyEmailPage(page);
    await verifyEmail.goto("not-a-real-verify-token-e2e");
    await expect(verifyEmail.errorText).toBeVisible({ timeout: 15_000 });
  });

  test("no token stays on the loading state (no verification attempted)", async ({ page }) => {
    const verifyEmail = new VerifyEmailPage(page);
    await verifyEmail.goto(null);
    await expect(verifyEmail.loadingText).toBeVisible({ timeout: 5_000 });
    await page.waitForTimeout(2_000);
    await expect(verifyEmail.loadingText).toBeVisible(); // still loading, never resolved either way
  });
});

test.describe("Verify OTP", () => {
  test("an incomplete code cannot be submitted, a wrong 6-digit code is rejected", async ({ page }) => {
    const verifyOtp = new VerifyOtpPage(page);
    await verifyOtp.goto(`e2e-otp-${Date.now()}@example.com`);
    await expect(verifyOtp.checkInboxHeading).toBeVisible({ timeout: 15_000 });

    await verifyOtp.enterCode("123");
    await expect(verifyOtp.verifyButton).toBeDisabled();

    await verifyOtp.submit("000000");
    await expect(verifyOtp.errorText).toBeVisible({ timeout: 15_000 });
  });
});
