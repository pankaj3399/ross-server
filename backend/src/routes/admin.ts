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
});

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
      SELECT id, practice_id, level, stream, question_index, question_text, created_at 
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
    const { practice_id, level, stream, question_text } = addQuestionSchema.parse(req.body);

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
      "INSERT INTO aima_questions (practice_id, level, stream, question_index, question_text, version_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [practice_id, level, stream, questionIndex, question_text, versionId]
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

export default router;
