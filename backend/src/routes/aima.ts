import { Router } from "express";
import pool from "../config/database";

const router = Router();

// GET /aima/domains
router.get("/domains", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.id, d.title, d.description, 
             ARRAY_AGG(p.id) as practices
      FROM aima_domains d
      LEFT JOIN aima_practices p ON d.id = p.domain_id
      GROUP BY d.id, d.title, d.description
      ORDER BY d.id
    `);

    const domains = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      practices: row.practices.filter(Boolean),
    }));

    res.json({ domains });
  } catch (error) {
    console.error("Error fetching domains:", error);
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

// GET /aima/domains/:domainId
router.get("/domains/:domainId", async (req, res) => {
  try {
    const domainResult = await pool.query(
      "SELECT * FROM aima_domains WHERE id = $1",
      [req.params.domainId],
    );

    if (domainResult.rows.length === 0) {
      return res.status(404).json({ error: "Domain not found" });
    }

    const practicesResult = await pool.query(
      "SELECT id, title, description FROM aima_practices WHERE domain_id = $1 ORDER BY id",
      [req.params.domainId],
    );

    const domain = domainResult.rows[0];
    const practices = practicesResult.rows.reduce((acc, practice) => {
      acc[practice.id] = {
        title: practice.title,
        description: practice.description,
      };
      return acc;
    }, {} as Record<string, any>);

    res.json({
      id: domain.id,
      title: domain.title,
      description: domain.description,
      practices,
    });
  } catch (error) {
    console.error("Error fetching domain:", error);
    res.status(500).json({ error: "Failed to fetch domain" });
  }
});

// GET /aima/domains/:domainId/practices/:practiceId
router.get("/domains/:domainId/practices/:practiceId", async (req, res) => {
  try {
    const practiceResult = await pool.query(
      "SELECT * FROM aima_practices WHERE id = $1 AND domain_id = $2",
      [req.params.practiceId, req.params.domainId],
    );

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Practice not found" });
    }

    const questionsResult = await pool.query(
      "SELECT level, stream, question_index, question_text FROM aima_questions WHERE practice_id = $1 ORDER BY level, stream, question_index",
      [req.params.practiceId],
    );

    const practice = practiceResult.rows[0];
    const levels: Record<string, Record<string, string[]>> = {};

    questionsResult.rows.forEach((row) => {
      if (!levels[row.level]) {
        levels[row.level] = {};
      }
      if (!levels[row.level][row.stream]) {
        levels[row.level][row.stream] = [];
      }
      levels[row.level][row.stream][row.question_index] = row.question_text;
    });

    res.json({
      domainId: req.params.domainId,
      practiceId: req.params.practiceId,
      title: practice.title,
      description: practice.description,
      levels,
    });
  } catch (error) {
    console.error("Error fetching practice:", error);
    res.status(500).json({ error: "Failed to fetch practice" });
  }
});

export default router;
