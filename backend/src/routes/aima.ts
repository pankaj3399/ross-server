import { Router } from "express";
import pool from "../config/database";

const router = Router();

// GET /aima/domains?project_id=uuid
router.get("/domains", async (req, res) => {
  try {
    const { project_id } = req.query;
    
    let query = `
      SELECT d.id, d.title, d.description, 
              ARRAY_AGG(p.id) as practices
      FROM aima_domains d
      LEFT JOIN aima_practices p ON d.id = p.domain_id
    `;
    
    let queryParams: any[] = [];
    
    if (project_id) {
      // Get project's version_id first
      const projectResult = await pool.query(
        "SELECT version_id FROM projects WHERE id = $1",
        [project_id]
      );
      
      if (projectResult.rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const projectVersionId = projectResult.rows[0].version_id;
      console.log(`Project ${project_id} has version_id:`, projectVersionId);
      
      // Also check the project's version details
      if (projectVersionId) {
        const projectVersionResult = await pool.query(`
          SELECT v.id, v.version_number, v.created_at
          FROM versions v
          WHERE v.id = $1
        `, [projectVersionId]);
        console.log("Project's version details:", projectVersionResult.rows);
      }
      
      if (projectVersionId) {
        // Filter by project's version - show only domains/practices created at or before this version
        // compare by created_at timestamp
        query += `
          WHERE (d.version_id IS NULL OR EXISTS (
            SELECT 1 FROM versions v1 WHERE v1.id = d.version_id 
            AND v1.created_at <= (SELECT created_at FROM versions WHERE id = $1)
          ))
          AND (p.version_id IS NULL OR EXISTS (
            SELECT 1 FROM versions v2 WHERE v2.id = p.version_id 
            AND v2.created_at <= (SELECT created_at FROM versions WHERE id = $1)
          ))
        `;
        queryParams.push(projectVersionId);
      }
      // If projectVersionId is NULL, show all domains (no filtering)
    }
    
    query += `
      GROUP BY d.id, d.title, d.description
      ORDER BY d.id
    `;

    console.log("Final query:", query);
    console.log("Query params:", queryParams);

    const result = await pool.query(query, queryParams);
    console.log("Query result rows:", result.rows.length);

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

// GET /aima/domains/:domainId?project_id=uuid
router.get("/domains/:domainId", async (req, res) => {
  try {
    const { project_id } = req.query;
    
    let domainQuery = "SELECT * FROM aima_domains WHERE id = $1";
    let domainParams = [req.params.domainId];
    
    if (project_id) {
      // Get project's version_id first
      const projectResult = await pool.query(
        "SELECT version_id FROM projects WHERE id = $1",
        [project_id]
      );
      
      if (projectResult.rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const projectVersionId = projectResult.rows[0].version_id;
      
      if (projectVersionId) {
        domainQuery += " AND (version_id IS NULL OR EXISTS (SELECT 1 FROM versions v WHERE v.id = version_id AND v.created_at <= (SELECT created_at FROM versions WHERE id = $2)))";
        domainParams.push(projectVersionId);
      }
    }
    
    const domainResult = await pool.query(domainQuery, domainParams);

    if (domainResult.rows.length === 0) {
      return res.status(404).json({ error: "Domain not found" });
    }

    let practicesQuery = "SELECT id, title, description FROM aima_practices WHERE domain_id = $1";
    let practicesParams = [req.params.domainId];
    
    if (project_id) {
      // Get project's version_id again for practices query
      const projectResult = await pool.query(
        "SELECT version_id FROM projects WHERE id = $1",
        [project_id]
      );
      
      if (projectResult.rows.length > 0) {
        const projectVersionId = projectResult.rows[0].version_id;
        
        if (projectVersionId) {
          practicesQuery += " AND (version_id IS NULL OR EXISTS (SELECT 1 FROM versions v WHERE v.id = version_id AND v.created_at <= (SELECT created_at FROM versions WHERE id = $2)))";
          practicesParams.push(projectVersionId);
        }
      }
    }
    
    practicesQuery += " ORDER BY id";
    
    const practicesResult = await pool.query(practicesQuery, practicesParams);

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

// GET /aima/domains/:domainId/practices/:practiceId?project_id=uuid
router.get("/domains/:domainId/practices/:practiceId", async (req, res) => {
  try {
    const { project_id } = req.query;
    
    let practiceQuery = "SELECT * FROM aima_practices WHERE id = $1 AND domain_id = $2";
    let practiceParams = [req.params.practiceId, req.params.domainId];
    
    if (project_id) {
      // Get project's version_id first
      const projectResult = await pool.query(
        "SELECT version_id FROM projects WHERE id = $1",
        [project_id]
      );
      
      if (projectResult.rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const projectVersionId = projectResult.rows[0].version_id;
      
      if (projectVersionId) {
        practiceQuery += " AND (version_id IS NULL OR EXISTS (SELECT 1 FROM versions v WHERE v.id = version_id AND v.created_at <= (SELECT created_at FROM versions WHERE id = $3)))";
        practiceParams.push(projectVersionId);
      }
    }
    
    const practiceResult = await pool.query(practiceQuery, practiceParams);

    if (practiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Practice not found" });
    }

    let questionsQuery = "SELECT level, stream, question_index, question_text FROM aima_questions WHERE practice_id = $1";
    let questionsParams = [req.params.practiceId];
    
    if (project_id) {
      // Get project's version_id again for questions query
      const projectResult = await pool.query(
        "SELECT version_id FROM projects WHERE id = $1",
        [project_id]
      );
      
      if (projectResult.rows.length > 0) {
        const projectVersionId = projectResult.rows[0].version_id;
        
        if (projectVersionId) {
          questionsQuery += " AND (version_id IS NULL OR EXISTS (SELECT 1 FROM versions v WHERE v.id = version_id AND v.created_at <= (SELECT created_at FROM versions WHERE id = $2)))";
          questionsParams.push(projectVersionId);
        }
      }
    }
    
    questionsQuery += " ORDER BY level, stream, question_index";
    
    const questionsResult = await pool.query(questionsQuery, questionsParams);

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
