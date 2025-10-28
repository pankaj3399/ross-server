import { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { getCurrentVersion } from "../services/getCurrentVersion";

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  aiSystemType: z.string().optional(),
});

// Get user's projects
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user!.id],
    );

    res.json({ projects: result.rows });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Create new project
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description, aiSystemType } = createProjectSchema.parse(
      req.body,
    );

    // Get current AIMA version
    const currentVersion = await getCurrentVersion();

    const result = await pool.query(
      "INSERT INTO projects (user_id, name, description, ai_system_type, version_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user!.id, name, description || null, aiSystemType || null, currentVersion.id],
    );

    res.status(201).json({ 
      project: result.rows[0],
      version: {
        id: currentVersion.id,
        version_number: currentVersion.version_number
      }
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Get specific project
router.get("/:projectId", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
      [req.params.projectId, req.user!.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Update project
router.put("/:projectId", authenticateToken, async (req, res) => {
  try {
    const { name, description, aiSystemType, status } = req.body;

    const result = await pool.query(
      "UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), ai_system_type = COALESCE($3, ai_system_type), status = COALESCE($4, status), updated_at = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING *",
      [
        name,
        description,
        aiSystemType,
        status,
        req.params.projectId,
        req.user!.id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({ project: result.rows[0] });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete project
router.delete("/:projectId", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.projectId, req.user!.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Submit project
router.post("/:projectId/submit", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    // Verify project belongs to user
    const projectCheck = await pool.query(
      "SELECT id, status FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId],
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectCheck.rows[0];

    // Get all assessment answers for this project and user
    const answersResult = await pool.query(
      `SELECT domain_id, practice_id, level, stream, question_index, value 
       FROM assessment_answers 
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    console.log(`Found ${answersResult.rows.length} answers for project ${projectId}`);
    console.log('Sample answers:', answersResult.rows.slice(0, 3));

    // Get total questions per domain from aima_questions table
    const totalQuestionsResult = await pool.query(
      `SELECT d.id as domain_id, d.title as domain_title, COUNT(aq.id) as total_questions
       FROM aima_domains d
       JOIN aima_practices p ON d.id = p.domain_id
       JOIN aima_questions aq ON p.id = aq.practice_id
       GROUP BY d.id, d.title`
    );

    // Create a map of domain_id to total questions and domain title
    const domainStats = new Map();
    totalQuestionsResult.rows.forEach(row => {
      domainStats.set(row.domain_id, {
        title: row.domain_title,
        totalQuestions: parseInt(row.total_questions)
      });
    });

    console.log(`Found ${domainStats.size} domains with questions`);
    console.log('Domain stats:', Array.from(domainStats.entries()).slice(0, 3));

    // Initialize domain results for ALL domains (even those with no answers)
    const domainResults = new Map();
    let totalCorrectAnswers = 0;
    let totalQuestions = 0;

    // Initialize all domains with 0 correct answers
    domainStats.forEach((stats, domainId) => {
      domainResults.set(domainId, {
        domainId,
        domainTitle: stats.title,
        correctAnswers: 0,
        totalQuestions: stats.totalQuestions
      });
    });

    // Count correct answers from actual assessment data
    let correctCount = 0;
    let totalCount = 0;
    
    answersResult.rows.forEach(answer => {
      const domainId = answer.domain_id;
      const value = parseFloat(answer.value);
      const isCorrect = value === 1;
      
      totalCount++;
      if (isCorrect) correctCount++;

      if (domainResults.has(domainId)) {
        const domainResult = domainResults.get(domainId);
        if (isCorrect) {
          domainResult.correctAnswers++;
          totalCorrectAnswers++;
        }
      }
    });

    console.log(`Processed ${totalCount} answers, found ${correctCount} correct answers`);
    console.log(`Total correct answers across all domains: ${totalCorrectAnswers}`);

    // Calculate percentages and prepare response
    const domains = Array.from(domainResults.values()).map(domain => {
      const percentage = domain.totalQuestions > 0 
        ? Math.round((domain.correctAnswers / domain.totalQuestions) * 100 * 100) / 100
        : 0;
      
      totalQuestions += domain.totalQuestions;
      
      return {
        domainId: domain.domainId,
        domainTitle: domain.domainTitle,
        correctAnswers: domain.correctAnswers,
        totalQuestions: domain.totalQuestions,
        percentage
      };
    });

    const overallPercentage = totalQuestions > 0 
      ? Math.round((totalCorrectAnswers / totalQuestions) * 100 * 100) / 100
      : 0;

    // Update project status to completed
    const result = await pool.query(
      "UPDATE projects SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *",
      [projectId, userId],
    );

    res.json({ 
      message: "Project submitted successfully",
      project: result.rows[0],
      results: {
        domains,
        overall: {
          totalCorrectAnswers,
          totalQuestions,
          overallPercentage
        }
      }
    });
  } catch (error) {
    console.error("Error submitting project:", error);
    res.status(500).json({ error: "Failed to submit project" });
  }
});

export default router;
