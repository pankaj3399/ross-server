// Quick standalone re-check of CRC dashboard PDF export, against the already
// fully-answered (100%) project left behind by crc-full.spec.js's Yes run —
// avoids re-walking all 138 controls just to test the export buttons.
const { test, expect } = require("@playwright/test");
const { STORAGE_STATE } = require("../constants");
const { CrcDashboardPage } = require("../pages/crc-dashboard.page");

test.use({ storageState: STORAGE_STATE });

const PROJECT_ID = process.env.CRC_PDF_PROJECT_ID;

test("CRC dashboard PDF export (Full + Summary) on a 100%-complete project", async ({ page }) => {
  test.skip(!PROJECT_ID, "set CRC_PDF_PROJECT_ID to an existing fully-answered project id");
  const crcDash = new CrcDashboardPage(page);
  const errors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

  await crcDash.goto(PROJECT_ID);
  await expect(crcDash.tierBadge).toHaveText(/ready/i);

  const [download1] = await Promise.all([
    page.waitForEvent("download", { timeout: 30_000 }),
    crcDash.exportFullButton.click(),
  ]);
  expect(await download1.path()).toBeTruthy();
  console.log(`[crc-pdf] full export downloaded: ${download1.suggestedFilename()}`);

  await page.waitForTimeout(1000);

  const [download2] = await Promise.all([
    page.waitForEvent("download", { timeout: 30_000 }),
    crcDash.exportSummaryButton.click(),
  ]);
  expect(await download2.path()).toBeTruthy();
  console.log(`[crc-pdf] summary export downloaded: ${download2.suggestedFilename()}`);

  expect(errors, `console errors during PDF export: ${errors.join(" | ")}`).toEqual([]);
});
