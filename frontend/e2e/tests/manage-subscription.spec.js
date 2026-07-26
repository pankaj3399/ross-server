// Subscription & Billing (/manage-subscription) — read-only smoke coverage.
// See ManageSubscriptionPage for why this deliberately never clicks
// Upgrade/Cancel: those redirect into real Stripe billing against the shared
// test account's actual subscription.
const { test, expect } = require("@playwright/test");
const { STORAGE_STATE } = require("../constants");
const { ManageSubscriptionPage } = require("../pages/manage-subscription.page");

test.use({ storageState: STORAGE_STATE });

test.describe("Manage Subscription (read-only)", () => {
  test("page loads with the current plan and FAQ sections, no console errors", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    const sub = new ManageSubscriptionPage(page);
    await sub.goto();

    await expect(sub.heading).toBeVisible();
    await expect(sub.faqHeading).toBeVisible();

    expect(errors, `console errors on /manage-subscription: ${errors.join(" | ")}`).toEqual([]);
  });
});
