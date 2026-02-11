import { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { getCurrentVersion } from "../services/getCurrentVersion";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client only if configured
let genAI: GoogleGenerativeAI | null = null;
if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set; AI insights generation will be disabled.");
} else {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  aiSystemType: z.string().optional(),
  industry: z.string().optional(),
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
    const { name, description, aiSystemType, industry } = createProjectSchema.parse(
      req.body,
    );

    // Get current AIMA version
    const currentVersion = await getCurrentVersion();

    const result = await pool.query(
      "INSERT INTO projects (user_id, name, description, ai_system_type, industry, version_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [req.user!.id, name, description || null, aiSystemType || null, industry || null, currentVersion.id],
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
    const { name, description, aiSystemType, industry, status } = req.body;

    const result = await pool.query(
      "UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), ai_system_type = COALESCE($3, ai_system_type), industry = COALESCE($4, industry), status = COALESCE($5, status), updated_at = CURRENT_TIMESTAMP WHERE id = $6 AND user_id = $7 RETURNING *",
      [
        name,
        description,
        aiSystemType,
        industry,
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

    // Verify project belongs to user and get version_id
    const projectCheck = await pool.query(
      "SELECT id, status, version_id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId],
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectCheck.rows[0];
    const projectVersionId = project.version_id;

    // Check if user is premium
    const isPremium = req.user!.subscription_status === "basic_premium" || req.user!.subscription_status === "pro_premium";

    // Get all assessment answers for this project and user
    const answersResult = await pool.query(
      `SELECT domain_id, practice_id, level, stream, question_index, value 
       FROM assessment_answers 
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    // Get total questions for each domain (filtering for no-premium, premium and version_id)
    let totalQuestionsQuery = `
      SELECT d.id as domain_id, d.title as domain_title, COALESCE(d.is_premium, false) as is_premium, COUNT(aq.id) as total_questions
      FROM aima_domains d
      JOIN aima_practices p ON d.id = p.domain_id
      JOIN aima_questions aq ON p.id = aq.practice_id
    `;
    
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    if (!isPremium) {
      // For free users: filter out premium domains, show all non-premium domains
      whereConditions.push(`COALESCE(d.is_premium, false) = false`);
    }
    
    // Add version filtering if project has a version_id
    if (projectVersionId) {
      whereConditions.push(`(d.version_id IS NULL OR EXISTS (
        SELECT 1 FROM versions v1 WHERE v1.id = d.version_id 
        AND v1.created_at <= (SELECT created_at FROM versions WHERE id = $${paramIndex})
      ))`);
      queryParams.push(projectVersionId);
      paramIndex++;
      
      whereConditions.push(`(p.version_id IS NULL OR EXISTS (
        SELECT 1 FROM versions v2 WHERE v2.id = p.version_id 
        AND v2.created_at <= (SELECT created_at FROM versions WHERE id = $${paramIndex})
      ))`);
      queryParams.push(projectVersionId);
      paramIndex++;
      
      whereConditions.push(`(aq.version_id IS NULL OR EXISTS (
        SELECT 1 FROM versions v3 WHERE v3.id = aq.version_id 
        AND v3.created_at <= (SELECT created_at FROM versions WHERE id = $${paramIndex})
      ))`);
      queryParams.push(projectVersionId);
      paramIndex++;
    }
    
    if (whereConditions.length > 0) {
      totalQuestionsQuery += ` WHERE ${whereConditions.join(" AND ")}`;
    }
    
    totalQuestionsQuery += ` GROUP BY d.id, d.title, d.is_premium`;
    
    const totalQuestionsResult = await pool.query(totalQuestionsQuery, queryParams);

    // Create a map of domain_id to total questions, domain title, and is_premium flag
    const domainStats = new Map();
    totalQuestionsResult.rows.forEach(row => {
      domainStats.set(row.domain_id, {
        title: row.domain_title,
        totalQuestions: parseInt(row.total_questions),
        isPremium: row.is_premium
      });
    });

    // Initialize domain results only for domains that should be shown
    const domainResults = new Map();
    let totalCorrectAnswers = 0;
    let totalQuestions = 0;

    // Initialize domains with 0 correct answers
    domainStats.forEach((stats, domainId) => {
      domainResults.set(domainId, {
        domainId,
        domainTitle: stats.title,
        correctAnswers: 0,
        totalQuestions: stats.totalQuestions,
        isPremium: stats.isPremium
      });
    });

    // Count correct answers from actual assessment data
    answersResult.rows.forEach(answer => {
      const domainId = answer.domain_id;
      const value = parseFloat(answer.value);
      const isCorrect = value === 1;

      // Only process answers for domains that are in domainResults
      if (domainResults.has(domainId)) {
        const domainResult = domainResults.get(domainId);
        if (isCorrect) {
          domainResult.correctAnswers++;
          // Only count non-premium domains in overall percentage
          if (!domainResult.isPremium) {
            totalCorrectAnswers++;
          }
        }
      }
    });

    // Calculate percentages and prepare response
    const domains = Array.from(domainResults.values()).map(domain => {
      const percentage = domain.totalQuestions > 0 
        ? Math.round((domain.correctAnswers / domain.totalQuestions) * 100 * 100) / 100
        : 0;
      
      // Only include non-premium domains in overall totalQuestions
      if (!domain.isPremium) {
        totalQuestions += domain.totalQuestions;
      }
      
      const domainResponse: any = {
        domainId: domain.domainId,
        domainTitle: domain.domainTitle,
        correctAnswers: domain.correctAnswers,
        totalQuestions: domain.totalQuestions,
        percentage,
        isPremium: domain.isPremium
      };
      
      return domainResponse;
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

// Generate AI insights for domains (free users: free domains only, premium users: all domains)
router.post("/:projectId/generate-insights", authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const isPremium = req.user!.subscription_status === "basic_premium" || req.user!.subscription_status === "pro_premium";

    if (!genAI) {
      return res.status(503).json({ error: "AI service is not configured. GEMINI_API_KEY is missing." });
    }

    // Verify project belongs to user and get version_id
    const projectCheck = await pool.query(
      "SELECT id, name, version_id FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId],
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectCheck.rows[0];
    const projectVersionId = project.version_id;

    // 1. Check if valid insights already exist for this project
    // We fetch all insights for the project
    const existingInsightsResult = await pool.query(
      "SELECT domain_id, insight_text FROM project_insights WHERE project_id = $1",
      [projectId]
    );

    const insights: Record<string, string> = {};
    if (existingInsightsResult.rows.length > 0) {
        existingInsightsResult.rows.forEach(row => {
            insights[row.domain_id] = row.insight_text;
        });
        
        // If we have insights, we might want to check if we have them for ALL required domains
        // But for now, let's assume if we have some, we return them (or we can augment them if incomplete logic is needed)
        // To keep it simple and fast: if we have any insights, we return them. 
        // A more robust implementation would check against the required domains list.
        if (Object.keys(insights).length > 0) {
             return res.json({ 
                success: true, 
                insights,
                cached: true
              });
        }
    }

    // Get domains with their data
    let domainsQuery = `
      SELECT d.id, d.title, d.description, COALESCE(d.is_premium, false) as is_premium,
              COUNT(DISTINCT aq.id) as total_questions,
              COUNT(DISTINCT CASE WHEN aa.value = 1 THEN aa.id END) as correct_answers
       FROM aima_domains d
       LEFT JOIN aima_practices p ON d.id = p.domain_id
       LEFT JOIN aima_questions aq ON p.id = aq.practice_id
       LEFT JOIN assessment_answers aa ON d.id = aa.domain_id AND aa.project_id = $1 AND aa.user_id = $2
    `;
    
    const whereConditions: string[] = [];
    const queryParams: any[] = [projectId, userId];
    let paramIndex = 3;
    
    // Filter domains based on user subscription
    if (!isPremium) {
      whereConditions.push(`COALESCE(d.is_premium, false) = false`);
    }
    
    // Add version filtering if project has a version_id
    if (projectVersionId) {
      whereConditions.push(`(d.version_id IS NULL OR EXISTS (
        SELECT 1 FROM versions v1 WHERE v1.id = d.version_id 
        AND v1.created_at <= (SELECT created_at FROM versions WHERE id = $${paramIndex})
      ))`);
      queryParams.push(projectVersionId);
      paramIndex++;
      
      whereConditions.push(`(p.version_id IS NULL OR EXISTS (
        SELECT 1 FROM versions v2 WHERE v2.id = p.version_id 
        AND v2.created_at <= (SELECT created_at FROM versions WHERE id = $${paramIndex})
      ))`);
      queryParams.push(projectVersionId);
      paramIndex++;
      
      whereConditions.push(`(aq.version_id IS NULL OR EXISTS (
        SELECT 1 FROM versions v3 WHERE v3.id = aq.version_id 
        AND v3.created_at <= (SELECT created_at FROM versions WHERE id = $${paramIndex})
      ))`);
      queryParams.push(projectVersionId);
      paramIndex++;
    }
    
    if (whereConditions.length > 0) {
      domainsQuery += ` WHERE ${whereConditions.join(" AND ")}`;
    }
    
    domainsQuery += ` GROUP BY d.id, d.title, d.description, d.is_premium
       HAVING COUNT(DISTINCT aq.id) > 0`;
    
    const domainsResult = await pool.query(domainsQuery, queryParams);

    if (domainsResult.rows.length === 0) {
      return res.json({ 
        success: true, 
        insights: {},
        message: "No domains found" 
      });
    }

    // The insights object is already declared above, so we don't redeclare it here.
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro"];

    // Helper for rate limiting
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Generate insights for each domain sequentially to avoid Rate Limits (429)
    for (const [index, domain] of domainsResult.rows.entries()) {
      try {
        // Add delay between requests (except the first one) to respect rate limits
        if (index > 0) await sleep(5000); // 5 seconds delay to be safe (approx 12 RPM)

        const totalQuestions = parseInt(domain.total_questions) || 0;
        const correctAnswers = parseInt(domain.correct_answers) || 0;
        const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        let detailedContext = "";
        if (isPremium) {
           // Fetch detailed answers for this domain
           const detailedAnswersQuery = `
             SELECT 
               aq.question_text,
               ap.title as practice_title,
               aa.value as user_score
             FROM assessment_answers aa
             JOIN aima_practices ap ON aa.practice_id = ap.id
             JOIN aima_questions aq ON aa.practice_id = aq.practice_id 
                  AND aa.level = aq.level 
                  AND aa.stream = aq.stream 
                  AND aa.question_index = aq.question_index
             WHERE aa.project_id = $1 AND aa.user_id = $2 AND aa.domain_id = $3
           `;
           
           const detailedAnswersResult = await pool.query(detailedAnswersQuery, [projectId, userId, domain.id]);
           
           if (detailedAnswersResult.rows.length > 0) {
             detailedContext = "\n\nDetailed Question Analysis:\n" + detailedAnswersResult.rows.map(row => {
               const status = parseFloat(row.user_score) === 1 ? "Correct" : "Incorrect";
               return `- [${status}] Practice: ${row.practice_title}\n  Question: ${row.question_text}`;
             }).join("\n");
           }
        }

        const prompt = `You are an AI assessment expert analyzing domain performance. Generate actionable insights and recommendations for the following domain assessment:

Domain: ${domain.title}
Description: ${domain.description || 'N/A'}
Performance: ${correctAnswers}/${totalQuestions} questions correct (${percentage}%)
Project: ${project.name}${detailedContext}

Based on this performance data${isPremium ? ' and the detailed question analysis above' : ''}, provide:
1. A brief analysis of the current performance level
2. Key strengths (if any)
3. Areas that need improvement
4. Specific actionable recommendations${isPremium ? ' based on the specific incorrect answers' : ''}

Keep the response concise (2-3 paragraphs) and focused on practical next steps. Format as plain text without markdown.`;

        let lastError: any = null;
        let insightText = "";

        // Retry logic for 429 Too Many Requests
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && !insightText) {
            attempts++;
            // Try multiple models
            for (const modelName of modelsToTry) {
            try {
                const model = genAI!.getGenerativeModel({ model: modelName });
                 // Adjust generation config if potential for longer response due to detailed context
                const result = await model.generateContent(prompt);
                const response = await result.response;
                insightText = response.text().trim();
                
                if (insightText) {
                break; 
                }
            } catch (modelError: any) {
                lastError = modelError;
                const isRateLimit = modelError.status === 429 || (modelError.message && modelError.message.includes('429'));
                
                if (isRateLimit) {
                    console.warn(`[Insights] Rate limit hit for ${modelName}. Waiting before retry...`);
                    await sleep(5000 * attempts); // Exponential-ish backoff: 5s, 10s...
                    // If rate limit, break from inner model loop to retry the outer attempt loop
                    // This allows the outer loop's `await sleep(2000)` to also apply if needed
                    break; 
                }
                
                console.error(`[Insights] Model ${modelName} failed for domain ${domain.id}:`, modelError.message || modelError);
                continue;
            }
            }
            
            if (!insightText && attempts < maxAttempts) {
                 // If we failed all models but haven't hit max attempts (likely rate limit caused break), wait and retry
                 // This sleep is for cases where the inner loop broke due to rate limit and we need to wait before next attempt
                 await sleep(2000); 
            }
        }

        if (!insightText) {
          throw lastError || new Error("All models failed to generate insights after retries");
        }

        // Save to database
        await pool.query(
            `INSERT INTO project_insights (project_id, domain_id, insight_text) 
             VALUES ($1, $2, $3)
             ON CONFLICT (project_id, domain_id) 
             DO UPDATE SET insight_text = EXCLUDED.insight_text, updated_at = CURRENT_TIMESTAMP`,
            [projectId, domain.id, insightText]
        );

        insights[domain.id] = insightText;

      } catch (error: any) {
        console.error(`Error generating insight for domain ${domain.id} (${domain.title}):`, error);
        insights[domain.id] = "Unable to generate insights at this time. Please try again later.";
      }
    }
    
    // The `results` and `results.forEach` are removed as insights are populated directly in the loop.

    res.json({ 
      success: true, 
      insights,
      cached: false
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

export default router;
