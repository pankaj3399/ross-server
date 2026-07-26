class AuthPage {
  constructor(page) {
    this.page = page;
    // <Label htmlFor="email">Email address</Label> associates cleanly with
    // the input, so its accessible name is exactly "Email address" — no
    // fallback locator needed.
    this.emailInput = page.getByRole("textbox", { name: "Email address", exact: true });
    this.passwordInput = page.locator('input[type="password"]').first();
    // Button text is "Sign in"/"Create account" (lowercase, per
    // frontend/src/app/auth/page.tsx) — verified against source since the
    // old case-insensitive regex was masking the real casing.
    this.signInButton = page.getByRole("button", { name: "Sign in", exact: true });

    // Signup-only fields (isLogin=false). #password/#confirmPassword ids are
    // shared with the login form's single password field, so scope by id.
    this.nameInput = page.locator("#name");
    this.signupPasswordInput = page.locator("#password");
    this.confirmPasswordInput = page.locator("#confirmPassword");
    this.createAccountButton = page.getByRole("button", { name: "Create account", exact: true });
  }

  // Matches the inline error banner rendered from AuthPage's `error` state
  // (frontend/src/app/auth/page.tsx) — same markup for both the login and
  // signup forms, distinguished only by message text.
  errorText(pattern) {
    return this.page.getByText(pattern);
  }

  async goto(isLogin) {
    await this.page.goto(`/auth?isLogin=${isLogin}`, { waitUntil: "domcontentloaded" });
  }

  async login(email, password) {
    await this.page.goto("/auth?isLogin=true");
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
    await this.page.waitForURL("**/dashboard");
  }

  // Attempts login with the given credentials and stays on /auth (doesn't
  // wait for the dashboard redirect) — for negative-path assertions.
  async attemptLogin(email, password) {
    await this.goto(true);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  // Note for callers: the name field's pattern (^[^0-9]*$) rejects any
  // digit, e.g. "E2E" fails it (that "2" is a digit) — use a digit-free name.
  async fillSignupForm({ name, email, password, confirmPassword }) {
    await this.goto(false);
    if (name !== undefined) await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.signupPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }
}

module.exports = { AuthPage };
