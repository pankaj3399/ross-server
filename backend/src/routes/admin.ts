import { Router } from "express";
import pool from "../config/database";
import { getNextVersion } from "../services/getNextVersion";
import { z } from "zod";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// Helper function to generate ID from title
const generateId = (title: string): string =>
  title.toLowerCase().trim().replace(/\s+/g, "_");

// Validation schemas
const addDomainSchema = z.object({
  title: z.string().min(1, "Domain title is required"),
  description: z.string().optional(),
});

const addPracticeSchema = z.object({
  domain_id: z.string().min(1, "Domain ID is required"),
  title: z.string().min(1, "Practice title is required"),
  description: z.string().optional(),
});

const addQuestionSchema = z.object({
  practice_id: z.string().min(1, "Practice ID is required"),
  level: z.string().regex(/^[1-3]$/, "Level must be 1, 2, or 3"),
  stream: z.string().regex(/^[AB]$/, "Stream must be A or B"),
  question_text: z.string().min(1, "Question text is required"),
  description: z.string().optional(),
});

const updateQuestionSchema = z
  .object({
    question_text: z.string().min(1, "Question text cannot be empty").optional(),
    description: z.string().optional(),
    level: z.string().regex(/^[1-3]$/, "Level must be 1, 2, or 3").optional(),
    stream: z.string().regex(/^[AB]$/, "Stream must be A or B").optional(),
  })
  .refine(
    (data) =>
      data.question_text !== undefined ||
      data.description !== undefined ||
      data.level !== undefined ||
      data.stream !== undefined,
    {
      message: "At least one field (question_text, description, level, or stream) must be provided",
      path: ["question_text"],
    },
  );

// Get all AIMA data (domains, practices, questions) in hierarchical structure
router.get("/aima-data", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    // Get all domains
    const domainsResult = await pool.query(`
      SELECT id, title, description, created_at 
      FROM aima_domains 
      ORDER BY title
    `);

    // Get all practices
    const practicesResult = await pool.query(`
      SELECT id, domain_id, title, description, created_at 
      FROM aima_practices 
      ORDER BY domain_id, title
    `);

    // Get all questions
    const questionsResult = await pool.query(`
      SELECT id, practice_id, level, stream, question_index, question_text, description, created_at 
      FROM aima_questions 
      ORDER BY practice_id, level, stream, question_index
    `);

    // Build hierarchical structure
    const domains = domainsResult.rows.map(domain => {
      const domainPractices = practicesResult.rows
        .filter(practice => practice.domain_id === domain.id)
        .map(practice => {
          const practiceQuestions = questionsResult.rows
            .filter(question => question.practice_id === practice.id)
            .map(question => ({
              id: question.id,
              level: question.level,
              stream: question.stream,
              question_index: question.question_index,
              question_text: question.question_text,
              description: question.description,
              created_at: question.created_at
            }))
            .sort((a, b) => {
              // Sort by level, then stream, then question_index
              if (a.level !== b.level) return a.level.localeCompare(b.level);
              if (a.stream !== b.stream) return a.stream.localeCompare(b.stream);
              return a.question_index - b.question_index;
            });

          return {
            id: practice.id,
            domain_id: practice.domain_id,
            title: practice.title,
            description: practice.description,
            created_at: practice.created_at,
            questions: practiceQuestions
          };
        });

      return {
        id: domain.id,
        title: domain.title,
        description: domain.description,
        created_at: domain.created_at,
        practices: domainPractices
      };
    });

    res.json({
      success: true,
      data: {
        domains,
        summary: {
          total_domains: domains.length,
          total_practices: practicesResult.rows.length,
          total_questions: questionsResult.rows.length
        }
      }
    });
  } catch (error) {
    console.error("Error fetching AIMA data:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch AIMA data",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Reset AIMA data (for development)
router.post("/reset-aima-data", async (req, res) => {
  try {
    // Clear existing data
    await pool.query("DELETE FROM aima_questions");
    await pool.query("DELETE FROM aima_practices");
    await pool.query("DELETE FROM aima_domains");

    res.json({ message: "AIMA data cleared successfully" });
  } catch (error) {
    console.error("Error clearing AIMA data:", error);
    res.status(500).json({ error: "Failed to clear AIMA data" });
  } 
});

// Add new domain
router.post("/add-domain", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { title, description } = addDomainSchema.parse(req.body);

    // Generate ID from title
    const id = generateId(title);

    // Check if domain already exists
    const existingDomain = await pool.query(
      "SELECT id FROM aima_domains WHERE id = $1",
      [id]
    );

    if (existingDomain.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: "Domain with this title already exists (ID would be duplicate)" 
      });
    }

    // Get next version
    const { nextVersion, versionId } = await getNextVersion();

    // Insert new domain
    const domainResult = await pool.query(
      "INSERT INTO aima_domains (id, title, description, version_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, title, description || null, versionId]
    );

    res.status(201).json({
      success: true,
      data: { domain: domainResult.rows[0], version: { id: versionId, version_number: nextVersion} },
      message: "Domain added successfully"
    });
  } catch (error) {
    console.error("Error adding domain:", error);
    res.status(500).json({
      error: "Failed to add domain",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Add new practice
router.post("/add-practice", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { domain_id, title, description } = addPracticeSchema.parse(req.body);

    // Check if domain exists
    const domainExists = await pool.query(
      "SELECT id FROM aima_domains WHERE id = $1",
      [domain_id]
    );

    if (domainExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Domain does not exist"
      });
    }

    // Generate ID from title
    const id = generateId(title);

    // Check if practice already exists
    const existingPractice = await pool.query(
      "SELECT id FROM aima_practices WHERE id = $1",
      [id]
    );

    if (existingPractice.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Practice with this title already exists (ID would be duplicate)"
      });
    }

    // Get next version
    const { nextVersion, versionId } = await getNextVersion();

    // Insert new practice
    const practiceResult = await pool.query(
      "INSERT INTO aima_practices (id, domain_id, title, description, version_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [id, domain_id, title, description || null, versionId]
    );

    res.status(201).json({
      success: true,
      data: { practice: practiceResult.rows[0], version: { id: versionId, version_number: nextVersion } },
      message: "Practice added successfully"
    });
  } catch (error) {
    console.error("Error adding practice:", error);
    res.status(500).json({
      error: "Failed to add practice",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Add new question
router.post("/add-question", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const { practice_id, level, stream, question_text, description } =
      addQuestionSchema.parse(req.body);

    // Check if practice exists
    const practiceExists = await pool.query(
      "SELECT id FROM aima_practices WHERE id = $1",
      [practice_id]
    );

    if (practiceExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Practice does not exist"
      });
    }

    // Get next question index for this practice, level, and stream
    const questionIndexResult = await pool.query(
      `SELECT COALESCE(MAX(question_index), -1) + 1 as next_index 
       FROM aima_questions 
       WHERE practice_id = $1 AND level = $2 AND stream = $3`,
      [practice_id, level, stream]
    );
    const questionIndex = questionIndexResult.rows[0].next_index;

    // Get next version
    const { nextVersion, versionId } = await getNextVersion();

    // Insert new question
    const questionResult = await pool.query(
      "INSERT INTO aima_questions (practice_id, level, stream, question_index, question_text, description, version_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        practice_id,
        level,
        stream,
        questionIndex,
        question_text,
        description?.trim() ? description : null,
        versionId,
      ],
    );

    res.status(201).json({
      success: true,
      data: { question: questionResult.rows[0], version: { id: versionId, version_number: nextVersion } },
      message: "Question added successfully"
    });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({
      error: "Failed to add question",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

router.patch(
  "/questions/:id",
  authenticateToken,
  requireRole(["ADMIN"]),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { question_text, description, level, stream } =
        updateQuestionSchema.parse(req.body);

      const existingResult = await client.query(
        `
        SELECT id, practice_id, level, stream, question_index 
        FROM aima_questions 
        WHERE id = $1
        FOR UPDATE
      `,
        [req.params.id],
      );

      if (existingResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          error: "Question not found",
        });
      }

      const existingQuestion = existingResult.rows[0];

      let nextLevel = existingQuestion.level;
      let nextStream = existingQuestion.stream;
      let nextQuestionIndex = existingQuestion.question_index;
      let levelChanged = false;
      let streamChanged = false;

      if (level !== undefined && level !== existingQuestion.level) {
        nextLevel = level;
        levelChanged = true;
      }

      if (stream !== undefined && stream !== existingQuestion.stream) {
        nextStream = stream;
        streamChanged = true;
      }

      const updates: string[] = [];
      const values: Array<string | null> = [];

      if (question_text !== undefined) {
        updates.push(`question_text = $${updates.length + 1}`);
        values.push(question_text);
      }

      if (description !== undefined) {
        updates.push(`description = $${updates.length + 1}`);
        values.push(description.trim() ? description : null);
      }

      if (levelChanged) {
        updates.push(`level = $${updates.length + 1}`);
        values.push(nextLevel);
      }

      if (streamChanged) {
        updates.push(`stream = $${updates.length + 1}`);
        values.push(nextStream);
      }

      if (levelChanged || streamChanged) {
        const questionIndexResult = await client.query(
          `SELECT COALESCE(MAX(question_index), -1) + 1 as next_index 
           FROM aima_questions 
           WHERE practice_id = $1 AND level = $2 AND stream = $3`,
          [existingQuestion.practice_id, nextLevel, nextStream],
        );

        nextQuestionIndex = questionIndexResult.rows[0].next_index;
        updates.push(`question_index = $${updates.length + 1}`);
        values.push(nextQuestionIndex);
      }

      if (updates.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          error: "No changes provided",
        });
      }

      values.push(req.params.id);

      const result = await client.query(
        `UPDATE aima_questions 
         SET ${updates.join(", ")} 
         WHERE id = $${values.length} 
         RETURNING *`,
        values,
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        data: { question: result.rows[0] },
        message: "Question updated successfully",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating question:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update question",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      client.release();
    }
  },
);

// Get all waitlist emails
router.get("/waitlist-emails", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, source, user_agent, ip, created_at
      FROM waitlist_emails
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: {
        emails: result.rows,
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error("Error fetching waitlist emails:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch waitlist emails",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get industry analytics
router.get("/analytics/industries", authenticateToken, requireRole(["ADMIN"]), async (req, res) => {
  try {
    // Get industry distribution
    const industryResult = await pool.query(`
      SELECT 
        industry,
        COUNT(*) as count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM projects WHERE industry IS NOT NULL) as percentage
      FROM projects
      WHERE industry IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC
    `);

    // Get total projects with and without industry
    const totalResult = await pool.query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(industry) as projects_with_industry,
        COUNT(*) - COUNT(industry) as projects_without_industry
      FROM projects
    `);

    res.json({
      success: true,
      data: {
        industries: industryResult.rows,
        summary: totalResult.rows[0]
      }
    });
  } catch (error) {
    console.error("Error fetching industry analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch industry analytics",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
