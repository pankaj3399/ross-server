import { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { sanitizeNote } from "../utils/sanitize";

const router = Router();

const NoteSchema = z.object({
  projectId: z.string().min(1),
  domainId: z.string().min(1),
  practiceId: z.string().min(1),
  level: z.enum(["1", "2", "3"]),
  stream: z.enum(["A", "B"]),
  questionIndex: z.number().int().min(0),
  note: z.string().max(5000).optional(),
});

// Save note
router.post("/", authenticateToken, async (req, res) => {
  try {
    const parsed = NoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const {
      projectId,
      domainId,
      practiceId,
      level,
      stream,
      questionIndex,
      note = "",
    } = parsed.data;

    // Verify project belongs to user
    const projectCheck = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, req.user!.id],
    );

    if (projectCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Project not found or access denied" });
    }

    // Sanitize the note
    const sanitizedNote = sanitizeNote(note);

    // Upsert note
    const result = await pool.query(
      `
      INSERT INTO question_notes (project_id, domain_id, practice_id, level, stream, question_index, note)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (project_id, domain_id, practice_id, level, stream, question_index)
      DO UPDATE SET note = $7, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `,
      [
        projectId,
        domainId,
        practiceId,
        level,
        stream,
        questionIndex,
        sanitizedNote,
      ],
    );

    res.json({
      message: "Note saved successfully",
      note: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving note:", error);
    res.status(500).json({ error: "Failed to save note" });
  }
});

// Get notes for project
router.get("/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify project belongs to user
    const projectCheck = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, req.user!.id],
    );

    if (projectCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Project not found or access denied" });
    }

    // Get all notes for project
    const result = await pool.query(
      "SELECT domain_id, practice_id, level, stream, question_index, note, created_at, updated_at FROM question_notes WHERE project_id = $1 ORDER BY created_at DESC",
      [projectId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// Delete note
router.delete("/:projectId", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { domainId, practiceId, level, stream, questionIndex } = req.body;

    // Verify project belongs to user
    const projectCheck = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, req.user!.id],
    );

    if (projectCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ error: "Project not found or access denied" });
    }

    // Delete note
    await pool.query(
      "DELETE FROM question_notes WHERE project_id = $1 AND domain_id = $2 AND practice_id = $3 AND level = $4 AND stream = $5 AND question_index = $6",
      [projectId, domainId, practiceId, level, stream, questionIndex],
    );

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
