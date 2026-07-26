// Team management (/assess/<id>/team) + the /invite/accept landing page.
//
// The full loop (send an invite email -> open it in a second mailbox ->
// accept/decline) needs a real second inbox this suite doesn't have, so it's
// intentionally out of scope here (see README). What IS covered end-to-end
// against the real backend: sending an invite, it showing up in the "Pending
// & Declined Invitations" table with the chosen role, and revoking it — the
// full lifecycle an owner can drive alone. /invite/accept itself is covered
// for its two token-error states, which don't require ever sending mail.
const { test, expect } = require("@playwright/test");
const { STORAGE_STATE, API_BASE_URL } = require("../constants");
const { DashboardPage } = require("../pages/dashboard.page");
const { TeamPage } = require("../pages/team.page");
const { InvitePage } = require("../pages/invite.page");

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

test.describe("Team management", () => {
  test("owner can invite a member with a chosen role, see it pending, then revoke it", async ({ page }) => {
    const name = `E2E Team ${Date.now()}`;
    const inviteEmail = `e2e-invite-${Date.now()}@example.com`;
    const dashboard = new DashboardPage(page);
    const team = new TeamPage(page);
    let projectId;

    try {
      await test.step("create a project and open its Team page", async () => {
        await dashboard.createProject(name, "team e2e coverage project.");
        projectId = await dashboard.startAssessment(name);
        expect(projectId).toBeTruthy();
        await team.goto(projectId);
        await expect(team.inviteHeading).toBeVisible({ timeout: 15_000 });
      });

      await test.step("send an invite with the Viewer role", async () => {
        await team.invite(inviteEmail, "Viewer");
        await expect(team.pendingInvitationsHeading).toBeVisible({ timeout: 15_000 });
        const row = team.invitationRow(inviteEmail);
        await expect(row).toBeVisible();
        await expect(row).toContainText(/viewer/i);
        await expect(row).toContainText(/pending/i);
      });

      await test.step("revoking removes it from the pending list", async () => {
        await team.revokeInvitation(inviteEmail);
        await expect(team.invitationRow(inviteEmail)).toHaveCount(0);
      });
    } finally {
      await deleteProject(page, projectId);
    }
  });
});

test.describe("Invite acceptance landing page (/invite/accept)", () => {
  test("no token shows the invalid-invitation error, not a crash", async ({ page }) => {
    const invite = new InvitePage(page);
    await invite.goto(null);
    await expect(invite.invalidHeading).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/no invitation token provided/i)).toBeVisible();
  });

  test("a garbage/expired token shows the invalid-invitation error", async ({ page }) => {
    const invite = new InvitePage(page);
    await invite.goto("not-a-real-token-e2e");
    await expect(invite.invalidHeading).toBeVisible({ timeout: 15_000 });
  });
});
