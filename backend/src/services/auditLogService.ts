import pool from "../config/database";
import type { PoolClient } from "pg";

type DbClient = PoolClient | typeof pool;

export interface AuditLogEntry {
  id: string;
  project_id: string | null;
  actor_id: string | null;
  action: string;
  object_type: string;
  object_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface RecordEventParams {
  projectId?: string | null;
  actorId?: string | null;
  action: string;
  objectType: string;
  objectId: string;
  metadata?: Record<string, any>;
  client?: DbClient;
}

export async function recordEvent(params: RecordEventParams): Promise<void> {
  const { projectId = null, actorId = null, action, objectType, objectId, metadata = {}, client } = params;
  const db = client ?? pool;

  await db.query(
    `INSERT INTO audit_logs (project_id, actor_id, action, object_type, object_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [projectId, actorId, action, objectType, objectId, JSON.stringify(metadata)],
  );
}

export async function listEventsForProject(
  projectId: string,
  options?: { limit?: number; offset?: number },
): Promise<AuditLogEntry[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const result = await pool.query(
    `SELECT id, project_id, actor_id, action, object_type, object_id, metadata, created_at
     FROM audit_logs
     WHERE project_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [projectId, limit, offset],
  );

  return result.rows;
}

