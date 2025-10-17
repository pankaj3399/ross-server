import { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";

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

    const result = await pool.query(
      "INSERT INTO projects (user_id, name, description, ai_system_type) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.user!.id, name, description || null, aiSystemType || null],
    );

    res.status(201).json({ project: result.rows[0] });
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

export default router;
