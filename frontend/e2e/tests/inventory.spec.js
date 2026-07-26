// AI Component Inventory (/assess/<id>/inventory) — wizard-gated premium
// route (layout.tsx's isPremiumRoute set, same gate as CRC/vulnerability-
// assessment; see [[ross-server-vuln-assessment-qa]]). Covers the core
// add -> appears in table with the right risk badge -> delete loop; filters,
// the vendor catalog dropdown, and the vendor-risk-assessment sub-flow
// ("Feature C") are out of scope for this pass.
const { test, expect } = require("@playwright/test");
const { STORAGE_STATE, API_BASE_URL } = require("../constants");
const { DashboardPage } = require("../pages/dashboard.page");
const { PremiumFeaturesPage } = require("../pages/premium-features.page");
const { InventoryPage } = require("../pages/inventory.page");

test.use({ storageState: STORAGE_STATE });
test.setTimeout(5 * 60 * 1000);

async function createWizardedProject(page, name) {
  const dashboard = new DashboardPage(page);
  const premiumFeatures = new PremiumFeaturesPage(page);

  await dashboard.deleteProjectIfPresent(name);
  await dashboard.createProject(name, "Inventory e2e coverage project.");
  const projectId = await dashboard.startAssessment(name);
  expect(projectId).toBeTruthy();

  await premiumFeatures.completeSystemProfileWizard(projectId, name);
  return projectId;
}

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

test.describe("AI Component Inventory", () => {
  test("adding a default (OpenAI, no data processing) component shows it as Low risk, then it can be deleted", async ({ page }) => {
    const name = `E2E Inventory ${Date.now()}`;
    const inventory = new InventoryPage(page);
    let projectId;

    try {
      await test.step("wizard + open a fresh (empty) inventory", async () => {
        projectId = await createWizardedProject(page, name);
        await inventory.goto(projectId);
        await expect(inventory.emptyState).toBeVisible({ timeout: 15_000 });
      });

      await test.step("add a component using the form's OpenAI defaults + 'No Data Processing'", async () => {
        await inventory.addDefaultComponent("Primary closed foundation LLM used for e2e coverage.");
        await expect(inventory.savedToast).toBeVisible({ timeout: 10_000 });
      });

      await test.step("it renders in the table as OpenAI / Closed Foundation Model / Low risk", async () => {
        const row = inventory.row("GPT");
        await expect(row).toBeVisible({ timeout: 10_000 });
        await expect(row).toContainText(/openai/i);
        await expect(row).toContainText(/low/i);
        await page.screenshot({ path: "e2e/.artifacts/inventory-component-added.png", fullPage: true });
      });

      await test.step("deleting it removes it from the table", async () => {
        await inventory.deleteComponent("GPT");
        await expect(inventory.deletedToast).toBeVisible({ timeout: 10_000 });
        await expect(inventory.row("GPT")).toHaveCount(0);
        await expect(inventory.emptyState).toBeVisible({ timeout: 10_000 });
      });
    } finally {
      await deleteProject(page, projectId);
    }
  });
});
