import { Router } from "express";
import { z } from "zod";
import { authenticateToken } from "../middleware/auth";
import { getMembership } from "../services/projectMembershipService";
import {
  createComment,
  deleteComment,
  getCommentById,
  listComments,
  updateComment,
} from "../services/commentService";
import { recordEvent } from "../services/auditLogService";

const router = Router();

const createSchema = z.object({
  objectType: z.string().min(1),
  objectId: z.string().min(1),
  body: z.string().min(1).max(5000),
  parentCommentId: z.string().uuid().optional(),
});

const updateSchema = z.object({
  body: z.string().min(1).max(5000),
});

// GET /projects/:projectId/comments
router.get("/:projectId/comments", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const membership = await getMembership(projectId, req.user!.id);
    if (!membership) {
      return res
        .status(403)
        .json({ error: "Project not found or access denied" });
    }

    const { objectType, objectId } = req.query;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 100, 200);
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const comments = await listComments(projectId, {
      objectType: typeof objectType === "string" ? objectType : undefined,
      objectId: typeof objectId === "string" ? objectId : undefined,
      limit,
      offset,
    });

    res.json({ comments });
  } catch (error) {
    console.error("Error listing comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /projects/:projectId/comments
router.post("/:projectId/comments", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const membership = await getMembership(projectId, req.user!.id);
    if (!membership) {
      return res
        .status(403)
        .json({ error: "Project not found or access denied" });
    }

    // Simple role check: require at least EDITOR to comment
    if (!["OWNER", "EDITOR"].includes(membership.role)) {
      return res
        .status(403)
        .json({ error: "Insufficient project role to comment" });
    }

    const parsed = createSchema.parse(req.body);

    const comment = await createComment(projectId, req.user!.id, {
      objectType: parsed.objectType,
      objectId: parsed.objectId,
      body: parsed.body,
      parentCommentId: parsed.parentCommentId,
    });

    await recordEvent({
      projectId,
      actorId: req.user!.id,
      action: "comment.created",
      objectType: "COMMENT",
      objectId: comment.id,
      metadata: {
        objectType: comment.object_type,
        objectId: comment.object_id,
      },
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: error.errors[0]?.message || "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// PATCH /comments/:commentId
router.patch("/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const parsed = updateSchema.parse(req.body);

    const existing = await getCommentById(commentId);
    if (!existing) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Load membership to ensure user can see this project
    const membership = await getMembership(existing.project_id, req.user!.id);
    if (!membership) {
      return res
        .status(403)
        .json({ error: "Project not found or access denied" });
    }

    // Only author or OWNER can edit
    if (existing.author_id !== req.user!.id && membership.role !== "OWNER") {
      return res
        .status(403)
        .json({ error: "Not allowed to edit this comment" });
    }

    const updated = await updateComment(commentId, parsed.body);
    if (!updated) {
      return res.status(404).json({ error: "Comment not found" });
    }

    await recordEvent({
      projectId: existing.project_id,
      actorId: req.user!.id,
      action: "comment.updated",
      objectType: "COMMENT",
      objectId: commentId,
    });

    res.json({ comment: updated });
  } catch (error) {
    console.error("Error updating comment:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: error.errors[0]?.message || "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// DELETE /comments/:commentId
router.delete("/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    const existing = await getCommentById(commentId);
    if (!existing) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const membership = await getMembership(existing.project_id, req.user!.id);
    if (!membership) {
      return res
        .status(403)
        .json({ error: "Project not found or access denied" });
    }

    // Only author or OWNER can delete
    if (existing.author_id !== req.user!.id && membership.role !== "OWNER") {
      return res
        .status(403)
        .json({ error: "Not allowed to delete this comment" });
    }

    await deleteComment(commentId);

    await recordEvent({
      projectId: existing.project_id,
      actorId: req.user!.id,
      action: "comment.deleted",
      objectType: "COMMENT",
      objectId: commentId,
    });

    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;

