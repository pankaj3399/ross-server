class VerifyEmailPage {
  constructor(page) {
    this.page = page;

    this.loadingText = page.getByText("Verifying your email address", { exact: true });
    // Bug found live 2026-07-18 (see goto() below): this page always hits
    // "Email and OTP are required" (backend/src/routes/auth.ts:219), never
    // the frontend's own "Invalid or expired verification token." fallback
    // for a *rejected* token — that fallback is effectively dead code today.
    // .or() covers both fixed strings instead of one alternation regex.
    this.errorText = page
      .getByText("Email and OTP are required", { exact: true })
      .or(page.getByText("Invalid or expired verification token", { exact: false }));
    this.successText = page.getByText("Your email has been successfully verified!", { exact: true });
  }

  // token=null never calls the backend (the page's useEffect is a no-op
  // without a token) and stays on the loading skeleton indefinitely.
  //
  // **Product bug, not an e2e issue** (verified live 2026-07-18): a token
  // (bogus or real) calls `POST /auth/verify-email` with `{ token }` only,
  // but the backend route (`backend/src/routes/auth.ts` `/verify-email`)
  // only implements the OTP flow — it destructures `{ email, otp }` and
  // immediately 400s with "Email and OTP are required" whenever either is
  // missing, with no branch for a bare `token`. So this link-based
  // verification page cannot ever succeed, for ANY token value, real or
  // fake — the email a new signup receives with a verify-email link is
  // presumably unusable as-is. Not fixed here per repo scope (e2e-only);
  // flagging in case this needs a backend-side look.
  async goto(token) {
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    await this.page.goto(`/auth/verify-email${qs}`, { waitUntil: "domcontentloaded" });
  }
}

module.exports = { VerifyEmailPage };
