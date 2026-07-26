// Project settings (/assess/<id>/settings) — the plain (non-premium-gated)
// "Project Details" edit form, shared by every account tier. Not covered by
// any existing spec; project-lifecycle.spec.js only exercises the dashboard's
// own create/delete, never this page.
const { test, expect } = require("@playwright/test");
const { STORAGE_STATE, API_BASE_URL } = require("../constants");
const { DashboardPage } = require("../pages/dashboard.page");
const { ProjectSettingsPage } = require("../pages/project-settings.page");

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

test.describe("Project settings", () => {
  test("editing name and description persists across a reload", async ({ page }) => {
    const originalName = `E2E Settings ${Date.now()}`;
    const updatedName = `${originalName} (edited)`;
    const updatedDescription = "Updated by the project-settings e2e spec.";
    const dashboard = new DashboardPage(page);
    const settings = new ProjectSettingsPage(page);
    let projectId;

    try {
      await test.step("create a project and open its settings", async () => {
        await dashboard.createProject(originalName, "created by e2e");
        projectId = await dashboard.startAssessment(originalName);
        expect(projectId).toBeTruthy();
        await settings.goto(projectId);
        await expect(settings.nameInput).toHaveValue(originalName);
      });

      await test.step("update name and description, toast confirms the save", async () => {
        await settings.updateDetails({ name: updatedName, description: updatedDescription });
      });

      await test.step("the new values survive a reload (persisted server-side, not just local state)", async () => {
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(settings.nameInput).toHaveValue(updatedName, { timeout: 15_000 });
        await expect(settings.descriptionInput).toHaveValue(updatedDescription);
      });
    } finally {
      await deleteProject(page, projectId);
    }
  });
});
