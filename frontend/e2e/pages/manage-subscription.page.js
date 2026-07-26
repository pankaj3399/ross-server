// Read-only coverage only, intentionally. Every action on this page (Upgrade
// to BLOOM/BLOOM PLUS, Cancel Subscription) redirects to real Stripe billing
// against whatever plan the shared test account currently holds — none of
// that is safe to automate against a real account, so this page object never
// clicks a billing action, only asserts the page renders.
class ManageSubscriptionPage {
  constructor(page) {
    this.page = page;

    // The real <h1> is "Subscription & Billing" — the old locator's
    // "Manage Your Subscription" alternative never matched anything; it only
    // worked at all because of the second, much broader "subscription"
    // fallback (which happens to be a substring of the real heading).
    this.heading = page.getByRole("heading", { name: "Subscription & Billing", exact: true }).first();
    this.faqHeading = page.getByText("Frequently Asked Questions", { exact: true });
  }

  async goto() {
    await this.page.goto("/manage-subscription", { waitUntil: "domcontentloaded" });
    await this.heading.waitFor({ timeout: 30_000 });
  }
}

module.exports = { ManageSubscriptionPage };
