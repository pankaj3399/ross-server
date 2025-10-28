import { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";

const router = Router();

const AnswerItemSchema = z.object({
  domainId: z.string().min(1),
  practiceId: z.string().min(1),
  level: z.enum(["1", "2", "3"]),
  stream: z.enum(["A", "B"]),
  questionIndex: z.number().int().min(0),
  value: z.number().min(0).max(1),
});

const AnswerSchema = z.object({
  projectId: z.string().min(1),
  answers: z.array(AnswerItemSchema).min(1),
});

// Save answer
router.post("/", authenticateToken, async (req, res) => {
  try {
    const parsed = AnswerSchema.safeParse(req.body);
    const userId = req.user!.id;
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { projectId, answers } = parsed.data;

    // Verify project 
    const projectCheck = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, req.user!.id]
    );
    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: "Project not found or access denied" });
    }

    // Upsert answer
    const queries = answers.map((a: any) =>
      pool.query(
        `
        INSERT INTO assessment_answers
          (project_id, domain_id, practice_id, level, stream, question_index, value, user_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7, $8)
        ON CONFLICT (project_id, domain_id, practice_id, level, stream, question_index, user_id)
        DO UPDATE SET value = $7, updated_at = CURRENT_TIMESTAMP
        `,
        [
          projectId,
          a.domainId,
          a.practiceId,
          a.level,
          a.stream,
          a.questionIndex,
          a.value,
          userId
        ]
      )
    );

    await Promise.all(queries);

    res.json({ ok: true, savedCount: answers.length });
  } catch (error) {
    console.error("Error saving answer:", error);
    res.status(500).json({ error: "Failed to save answer" });
  }
});

// Get answers for project
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

    // Get all answers for project
    const result = await pool.query(
      "SELECT domain_id, practice_id, level, stream, question_index, value FROM assessment_answers WHERE project_id = $1 AND user_id = $2",
      [projectId, req.user!.id],
    );

    const answers: Record<string, number> = {};
    result.rows.forEach((row) => {
      const key = `${row.domain_id}:${row.practice_id}:${row.level}:${row.stream}:${row.question_index}`;
      answers[key] = parseFloat(row.value);
    });

    res.json({ projectId, answers });
  } catch (error) {
    console.error("Error fetching answers:", error);
    res.status(500).json({ error: "Failed to fetch answers" });
  }
});

export default router;
