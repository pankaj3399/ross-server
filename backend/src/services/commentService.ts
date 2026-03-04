import pool from "../config/database";

export interface Comment {
  id: string;
  project_id: string;
  author_id: string;
  object_type: string;
  object_id: string;
  body: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ListFilters {
  objectType?: string;
  objectId?: string;
  limit?: number;
  offset?: number;
}

export async function listComments(
  projectId: string,
  filters: ListFilters = {},
): Promise<Comment[]> {
  const conditions: string[] = ["project_id = $1"];
  const values: any[] = [projectId];
  let idx = 2;

  if (filters.objectType) {
    conditions.push(`object_type = $${idx++}`);
    values.push(filters.objectType);
  }

  if (filters.objectId) {
    conditions.push(`object_id = $${idx++}`);
    values.push(filters.objectId);
  }

  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  values.push(limit);
  values.push(offset);

  const result = await pool.query(
    `SELECT id, project_id, author_id, object_type, object_id, body, parent_comment_id, created_at, updated_at
     FROM comments
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    values,
  );

  return result.rows;
}

export async function createComment(
  projectId: string,
  authorId: string,
  payload: {
    objectType: string;
    objectId: string;
    body: string;
    parentCommentId?: string | null;
  },
): Promise<Comment> {
  const result = await pool.query(
    `INSERT INTO comments (project_id, author_id, object_type, object_id, body, parent_comment_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, project_id, author_id, object_type, object_id, body, parent_comment_id, created_at, updated_at`,
    [
      projectId,
      authorId,
      payload.objectType,
      payload.objectId,
      payload.body,
      payload.parentCommentId || null,
    ],
  );

  return result.rows[0];
}

export async function updateComment(
  commentId: string,
  body: string,
): Promise<Comment | null> {
  const result = await pool.query(
    `UPDATE comments
     SET body = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, project_id, author_id, object_type, object_id, body, parent_comment_id, created_at, updated_at`,
    [body, commentId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

export async function deleteComment(
  commentId: string,
): Promise<void> {
  await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
}

export async function getCommentById(commentId: string): Promise<Comment | null> {
  const result = await pool.query(
    `SELECT id, project_id, author_id, object_type, object_id, body, parent_comment_id, created_at, updated_at
     FROM comments
     WHERE id = $1`,
    [commentId],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

