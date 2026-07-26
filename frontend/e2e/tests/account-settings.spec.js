// Global account settings (/settings) — Notifications preference toggles and
// the Deleted Projects recovery flow. Profile-info editing and Security
// (password/MFA) are read-only-verified elsewhere in this pass (see
// auth-flows.spec.js for password-adjacent coverage); this spec avoids ever
// submitting a real password/MFA change against the shared test account.
const { test, expect } = require("@playwright/test");
const { STORAGE_STATE, API_BASE_URL } = require("../constants");
const { DashboardPage } = require("../pages/dashboard.page");
const { AccountSettingsPage } = require("../pages/account-settings.page");

test.use({ storageState: STORAGE_STATE });

async function deleteProject(page, projectId) {
  if (!projectId) return;
  const token = await page.evaluate(() => localStorage.getItem("auth_token"));
  try {
    const response = await page.request.delete(`${API_BASE_URL}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok()) {
      console.error(`Failed to clean up project ${projectId}: DELETE returned ${response.status()}`);
    }
  } catch (err) {
    console.error(`Failed to clean up project ${projectId}:`, err);
  }
}

test.describe("Account settings — Notifications", () => {
  test("toggling Weekly Digest persists across a reload, then is restored", async ({ page }) => {
    const settings = new AccountSettingsPage(page);
    await settings.goto();

    const before = await settings.weeklyDigestSwitch.getAttribute("aria-checked");

    await settings.weeklyDigestSwitch.click();
    await expect
      .poll(() => settings.weeklyDigestSwitch.getAttribute("aria-checked"), { timeout: 10_000 })
      .not.toBe(before);

    await page.reload({ waitUntil: "domcontentloaded" });
    await settings.heading.waitFor({ timeout: 15_000 });
    const afterReload = await settings.weeklyDigestSwitch.getAttribute("aria-checked");
    expect(afterReload).not.toBe(before); // persisted server-side, not just local state

    // Restore the account's original preference so this test is idempotent
    // and doesn't leave the shared test account's notification settings
    // altered for the next run.
    await settings.weeklyDigestSwitch.click();
    await expect
      .poll(() => settings.weeklyDigestSwitch.getAttribute("aria-checked"), { timeout: 10_000 })
      .toBe(before);
  });
});

test.describe("Account settings — Deleted Projects recovery", () => {
  test("a project deleted from the dashboard shows up here and can be restored", async ({ page }) => {
    const name = `E2E DeletedProjects ${Date.now()}`;
    const dashboard = new DashboardPage(page);
    const settings = new AccountSettingsPage(page);
    let projectId;

    try {
      await test.step("create then delete a project", async () => {
        await dashboard.createProject(name, "deleted-projects recovery e2e coverage.");
        projectId = await dashboard.startAssessment(name);
        expect(projectId).toBeTruthy();
        // Deletes via the same DELETE /projects/:id route the dashboard's
        // own delete button calls (soft-delete, same effect on the Deleted
        // Projects list) rather than driving that UI button directly: the
        // dashboard's kebab-menu "Delete" is documented as broken for any
        // project the app still considers "never started" (opens the
        // project's own "Choose Your Path" modal instead of the delete
        // dialog — see [[ross-server-e2e]] memory) — reproduced live
        // 2026-07-18 even after navigating into the AIMA flow via
        // startAssessment(), since that alone doesn't flip the project to
        // "started" until an answer is actually submitted. Testing that
        // broken UI flow itself isn't this test's concern; project-lifecycle
        // .spec.js already covers (and currently reproduces) it.
        await deleteProject(page, projectId);
      });

      await test.step("it appears under Settings > Deleted Projects with a days-remaining badge", async () => {
        await settings.goto();
        await expect(settings.deletedProjectsHeading).toBeVisible();
        await expect(settings.deletedProjectRestoreButton(name)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/\d+ days? left/i).first()).toBeVisible();
      });

      await test.step("restoring it removes it from Deleted Projects and it reappears on the dashboard", async () => {
        await settings.restoreDeletedProject(name);
        await expect(settings.deletedProjectRestoreButton(name)).toHaveCount(0, { timeout: 15_000 });

        await dashboard.goto();
        await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
      });
    } finally {
      // The project is restored (active) by this point regardless of which
      // step the test reached, so the normal API delete cleanup applies.
      await deleteProject(page, projectId);
    }
  });
});
