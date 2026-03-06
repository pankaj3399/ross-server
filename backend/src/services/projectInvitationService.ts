import crypto from "crypto";
import type { PoolClient } from "pg";
import pool from "../config/database";
import {
  addMember,
  ProjectMembership,
  ProjectRole,
} from "./projectMembershipService";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface ProjectInvitation {
  id: string;
  project_id: string;
  inviter_id: string | null;
  email: string;
  role: ProjectRole;
  permissions: string[];
  token: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createInvitation(
  projectId: string,
  inviterId: string,
  email: string,
  role: ProjectRole,
  permissions: string[] = [],
  ttlHours = 72,
): Promise<ProjectInvitation | null> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await pool.query(
    `UPDATE project_invitations 
     SET status = 'expired', updated_at = CURRENT_TIMESTAMP
     WHERE project_id = $1 AND LOWER(email) = $2 AND status IN ('pending', 'sent') AND expires_at <= CURRENT_TIMESTAMP`,
    [projectId, email.toLowerCase()]
  );

  const result = await pool.query(
    `INSERT INTO project_invitations 
       (project_id, inviter_id, email, role, permissions, token, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
     ON CONFLICT DO NOTHING
     RETURNING id, project_id, inviter_id, email, role, permissions, token, status, expires_at, created_at, updated_at`,
    [projectId, inviterId, email.toLowerCase(), role, JSON.stringify(permissions), token, expiresAt],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  };
}

export async function findInvitationByToken(
  token: string,
): Promise<ProjectInvitation | null> {
  const result = await pool.query(
    `SELECT id, project_id, inviter_id, email, role, permissions, token, status, expires_at, created_at, updated_at
     FROM project_invitations
     WHERE token = $1`,
    [token],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    ...row,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  };
}

export async function acceptInvitation(
  token: string,
  userId: string,
  clientOverride?: PoolClient,
): Promise<{ invitation: ProjectInvitation; membership: ProjectMembership }> {
  const client = clientOverride ?? (await pool.connect());
  const manageTransaction = !clientOverride;

  try {
    if (manageTransaction) {
      await client.query("BEGIN");
    }

    const inviteResult = await client.query(
      `SELECT * FROM project_invitations WHERE token = $1 FOR UPDATE`,
      [token],
    );

    if (inviteResult.rows.length === 0) {
      throw new Error("Invalid invitation token");
    }

    const invite = inviteResult.rows[0] as ProjectInvitation & { expires_at: Date };

    if (invite.status !== "pending") {
      throw new Error("Invitation is no longer valid");
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      await client.query(
        `UPDATE project_invitations SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [invite.id],
      );
      throw new Error("Invitation has expired");
    }

    const membership = await addMember(
      invite.project_id,
      userId,
      invite.role,
      Array.isArray(invite.permissions) ? invite.permissions : [],
      client,
    );

    const updatedInviteResult = await client.query(
      `UPDATE project_invitations 
       SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, project_id, inviter_id, email, role, permissions, token, status, expires_at, created_at, updated_at`,
      [invite.id],
    );

    if (manageTransaction) {
      await client.query("COMMIT");
    }

    const updatedInvite = updatedInviteResult.rows[0];

    return {
      invitation: {
        ...updatedInvite,
        permissions: Array.isArray(updatedInvite.permissions)
          ? updatedInvite.permissions
          : [],
      },
      membership,
    };
  } catch (error) {
    if (manageTransaction) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    if (!clientOverride) {
      client.release();
    }
  }
}

export async function revokeInvitation(
  invitationId: string,
  projectId: string,
): Promise<void> {
  await pool.query(
    `UPDATE project_invitations 
     SET status = 'revoked', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND project_id = $2`,
    [invitationId, projectId],
  );
}

export async function listInvitationsForProject(
  projectId: string,
): Promise<ProjectInvitation[]> {
  const result = await pool.query(
    `SELECT id, project_id, inviter_id, email, role, permissions, token, status, expires_at, created_at, updated_at
     FROM project_invitations
     WHERE project_id = $1 AND status = 'pending'
     AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
     ORDER BY created_at DESC`,
    [projectId],
  );

  return result.rows.map((row) => ({
    ...row,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  }));
}

