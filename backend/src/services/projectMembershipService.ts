import pool from "../config/database";
import type { PoolClient } from "pg";

export type ProjectRole = "OWNER" | "EDITOR" | "VIEWER";

export interface ProjectMembership {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export async function getMembership(
  projectId: string,
  userId: string,
): Promise<ProjectMembership | null> {
  // First, verify project exists and is active (not soft-deleted)
  const projectCheck = await pool.query(
    `SELECT id, user_id, created_at, updated_at
     FROM projects
     WHERE id = $1 AND deleted_at IS NULL`,
    [projectId],
  );

  if (projectCheck.rows.length === 0) {
    return null;
  }

  const project = projectCheck.rows[0];

  // Next, look for an explicit membership row
  const result = await pool.query(
    `SELECT id, project_id, user_id, role, permissions, created_at, updated_at
     FROM project_members
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  );

  if (result.rows.length > 0) {
    const row = result.rows[0];
    return {
      ...row,
      permissions: Array.isArray(row.permissions) ? row.permissions : [],
    };
  }

  // Fallback: treat the project owner as an implicit OWNER member.
  if (project.user_id === userId) {
    return {
      id: `implicit-owner-${project.id}-${project.user_id}`,
      project_id: project.id,
      user_id: project.user_id,
      role: "OWNER",
      permissions: ["*"],
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }

  // Fallback 2: Platform ADMIN users have full access to existing active projects
  const userResult = await pool.query(
    `SELECT role FROM users WHERE id = $1`,
    [userId]
  );
  if (userResult.rows.length > 0 && userResult.rows[0].role === "ADMIN") {
    return {
      id: `admin-owner-${projectId}-${userId}`,
      project_id: projectId,
      user_id: userId,
      role: "OWNER",
      permissions: ["*"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return null;
}

type DbClient = PoolClient | typeof pool;

export async function addMember(
  projectId: string,
  userId: string,
  role: ProjectRole,
  permissions: string[] = [],
  client?: DbClient,
): Promise<ProjectMembership> {
  const db = client ?? pool;

  const result = await db.query(
    `INSERT INTO project_members (project_id, user_id, role, permissions)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (project_id, user_id)
     DO UPDATE SET role = EXCLUDED.role,
                   permissions = EXCLUDED.permissions,
                   updated_at = CURRENT_TIMESTAMP
     RETURNING id, project_id, user_id, role, permissions, created_at, updated_at`,
    [projectId, userId, role, JSON.stringify(permissions)],
  );

  const row = result.rows[0];
  return {
    ...row,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  };
}

export async function updateMember(
  projectId: string,
  userId: string,
  options: {
    role?: ProjectRole;
    permissions?: string[];
  },
): Promise<ProjectMembership | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (options.role) {
    fields.push(`role = $${idx++}`);
    values.push(options.role);
  }

  if (options.permissions) {
    fields.push(`permissions = $${idx++}`);
    values.push(JSON.stringify(options.permissions));
  }

  if (fields.length === 0) {
    return getMembership(projectId, userId);
  }

  // Always bump updated_at
  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(projectId);
  values.push(userId);

  const result = await pool.query(
    `UPDATE project_members
     SET ${fields.join(", ")}
     WHERE project_id = $${idx++} AND user_id = $${idx}
     RETURNING id, project_id, user_id, role, permissions, created_at, updated_at`,
    values,
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

export async function removeMember(
  projectId: string,
  userId: string,
): Promise<void> {
  await pool.query(
    `DELETE FROM project_members
     WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  );
}

export async function listMembersForProject(
  projectId: string,
): Promise<ProjectMembership[]> {
  const result = await pool.query(
    `SELECT id, project_id, user_id, role, permissions, created_at, updated_at
     FROM project_members
     WHERE project_id = $1
     ORDER BY created_at ASC`,
    [projectId],
  );

  return result.rows.map((row) => ({
    ...row,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  }));
}

