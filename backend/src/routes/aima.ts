import { Router } from "express";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// GET /aima/domains?project_id=uuid
router.get("/domains", authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.query;
    const user = req.user;
    const isPremium = user?.subscription_status === "basic_premium" || user?.subscription_status === "pro_premium";
    
    let query = `
      SELECT d.id, d.title, d.description, COALESCE(d.is_premium, false) as is_premium,
              ARRAY_AGG(p.id) as practices
      FROM aima_domains d
      LEFT JOIN aima_practices p ON d.id = p.domain_id
    `;
    
    let queryParams: any[] = [];
    let whereConditions: string[] = [];
    
    // Filter out premium domains for non-premium users
    if (!isPremium) {
      whereConditions.push("COALESCE(d.is_premium, false) = false");
    }
    
    if (project_id) {
      const projectResult = await pool.query(
        "SELECT version_id FROM projects WHERE id = $1",
        [project_id]
      );
      
      if (projectResult.rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const projectVersionId = projectResult.rows[0].version_id;
      
      if (projectVersionId) {
        // Filter by project's version
        const paramIndex = queryParams.length + 1;
        const versionFilter = `
          (d.version_id IS NULL OR EXISTS (
            SELECT 1 FROM versions v1 WHERE v1.id = d.version_id 
            AND v1.created_at <= (SELECT created_at FROM versions WHERE id = $${paramIndex})
          ))
          AND (p.version_id IS NULL OR EXISTS (
            SELECT 1 FROM versions v2 WHERE v2.id = p.version_id 
            AND v2.created_at <= (SELECT created_at FROM versions WHERE id = $${paramIndex})
          ))
        `;
        whereConditions.push(versionFilter);
        queryParams.push(projectVersionId);
      }
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }
    
    query += `
      GROUP BY d.id, d.title, d.description, d.is_premium
      ORDER BY d.id
    `;

    console.log("Final query:", query);
    console.log("Query params:", queryParams);

    const result = await pool.query(query, queryParams);

    const domains = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      is_premium: row.is_premium || false,
      practices: row.practices.filter(Boolean),
    }));

    res.json({ domains });
  } catch (error) {
    console.error("Error fetching domains:", error);
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

// GET /aima/domains-full?project_id=uuid
// Returns all domains with their practices in a single optimized request
router.get("/domains-full", authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.query;
    const user = req.user;
    const isPremium = user?.subscription_status === "basic_premium" || user?.subscription_status === "pro_premium";
    
    let projectVersionCreatedAt: Date | null = null;
    if (project_id) {
      const projectResult = await pool.query(
        "SELECT version_id FROM projects WHERE id = $1",
        [project_id]
      );
      
      if (projectResult.rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const projectVersionId = projectResult.rows[0].version_id;
      if (projectVersionId) {
        const versionResult = await pool.query(
          "SELECT created_at FROM versions WHERE id = $1",
          [projectVersionId]
        );
        if (versionResult.rows.length > 0) {
          projectVersionCreatedAt = versionResult.rows[0].created_at;
        }
      }
    }
    
    // Single query with LEFT JOINs for better performance
    let query = `
      SELECT 
        d.id as domain_id,
        d.title as domain_title,
        d.description as domain_description,
        COALESCE(d.is_premium, false) as domain_is_premium,
        p.id as practice_id,
        p.title as practice_title,
        p.description as practice_description
      FROM aima_domains d
      ${projectVersionCreatedAt ? `
        LEFT JOIN versions vd ON d.version_id = vd.id
      ` : ''}
      LEFT JOIN aima_practices p ON d.id = p.domain_id
      ${projectVersionCreatedAt ? `
        LEFT JOIN versions vp ON p.version_id = vp.id
      ` : ''}
    `;
    
    const queryParams: any[] = [];
    const whereConditions: string[] = [];
    
    // Filter out premium domains for non-premium users
    if (!isPremium) {
      whereConditions.push("COALESCE(d.is_premium, false) = false");
    }
    
    // Apply version filtering
    if (projectVersionCreatedAt) {
      queryParams.push(projectVersionCreatedAt);
      whereConditions.push(`(d.version_id IS NULL OR vd.created_at <= $${queryParams.length})`);
      whereConditions.push(`(p.id IS NULL OR p.version_id IS NULL OR vp.created_at <= $${queryParams.length})`);
    }
    
    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ");
    }
    
    query += " ORDER BY d.id, p.id";
    
    const result = await pool.query(query, queryParams);
    
    const domainsMap = new Map<string, any>();
    
    result.rows.forEach((row) => {
      if (!domainsMap.has(row.domain_id)) {
        domainsMap.set(row.domain_id, {
          id: row.domain_id,
          title: row.domain_title,
          description: row.domain_description,
          is_premium: row.domain_is_premium || false,
          practices: {},
        });
      }
      
      if (row.practice_id) {
        const domain = domainsMap.get(row.domain_id);
        if (domain && !domain.practices[row.practice_id]) {
          domain.practices[row.practice_id] = {
            title: row.practice_title,
            description: row.practice_description,
          };
        }
      }
    });
    
    const domains = Array.from(domainsMap.values());
    
    res.json({ domains });
  } catch (error) {
    console.error("Error fetching domains-full:", error);
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

// GET /aima/domains/:domainId?project_id=uuid
router.get("/domains/:domainId", authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.query;
    const user = req.user;
    const isPremium = user?.subscription_status === "basic_premium" || user?.subscription_status === "pro_premium";
    
    let domainQuery = "SELECT *, COALESCE(is_premium, false) as is_premium FROM aima_domains WHERE id = $1";
    let domainParams = [req.params.domainId];
    
    // Filter out premium domains for non-premium users
    if (!isPremium) {
      domainQuery += " AND COALESCE(is_premium, false) = false";
    }
    
    if (project_id) {
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
    
    const domainData = domainResult.rows[0];
    if (domainData.is_premium && !isPremium) {
      return res.status(403).json({ error: "Premium domain - subscription required" });
    }

    let practicesQuery = "SELECT id, title, description FROM aima_practices WHERE domain_id = $1";
    let practicesParams = [req.params.domainId];
    
    if (project_id) {
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
router.get("/domains/:domainId/practices/:practiceId", authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.query;
    const user = req.user;
    const isPremium = user?.subscription_status === "basic_premium" || user?.subscription_status === "pro_premium";
    
    const domainCheck = await pool.query(
      "SELECT COALESCE(is_premium, false) as is_premium FROM aima_domains WHERE id = $1",
      [req.params.domainId]
    );
    
    if (domainCheck.rows.length === 0) {
      return res.status(404).json({ error: "Domain not found" });
    }
    
    if (domainCheck.rows[0].is_premium && !isPremium) {
      return res.status(403).json({ error: "Premium domain - subscription required" });
    }
    
    let practiceQuery = "SELECT * FROM aima_practices WHERE id = $1 AND domain_id = $2";
    let practiceParams = [req.params.practiceId, req.params.domainId];
    
    if (project_id) {
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

    let questionsQuery =
      "SELECT level, stream, question_index, question_text, description FROM aima_questions WHERE practice_id = $1";
    let questionsParams = [req.params.practiceId];
    
    if (project_id) {
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
    const levels: Record<
      string,
      Record<
        string,
        Array<{
          question_text: string;
          description: string | null;
        }>
      >
    > = {};

    questionsResult.rows.forEach((row) => {
      if (!levels[row.level]) {
        levels[row.level] = {};
      }
      if (!levels[row.level][row.stream]) {
        levels[row.level][row.stream] = [];
      }
      levels[row.level][row.stream][row.question_index] = {
        question_text: row.question_text,
        description: row.description,
      };
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
