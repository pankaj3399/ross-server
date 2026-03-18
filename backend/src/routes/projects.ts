import { Router } from "express";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { getCurrentVersion } from "../services/getCurrentVersion"; // Assuming this service exists as per original file
import { GoogleGenerativeAI } from "@google/generative-ai";
import { randomUUID } from "crypto";
import { addMember, updateMember, removeMember } from "../services/projectMembershipService";
import { loadProject, requireProjectRole } from "../middleware/projectAccess";
import {
  createInvitation,
  listInvitationsForProject,
  revokeInvitation,
} from "../services/projectInvitationService";
import { emailService } from "../services/emailService";
import { recordEvent } from "../services/auditLogService";

// Initialize Gemini client only if configured
let genAI: GoogleGenerativeAI | null = null;
if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set; AI insights generation will be disabled.");
} else {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
const isPremiumUser = (status: string | undefined) => ["basic_premium", "pro_premium", "trial"].includes(status || "");

const router = Router();

// Create project schema validation
const createProjectSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  aiSystemType: z.string().optional(),
  industry: z.string().optional(),
});

// In-memory job store: jobId -> { status, insights?, error?, projectId, createdAt }
// Note: In a production environment with multiple instances, use Redis or a DB table.
interface InsightJob {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  insights?: Record<string, string>;
  error?: string;
  projectId: string;
  userId: string;
  createdAt: number;
}
const insightJobs = new Map<string, InsightJob>();

// Cleanup old jobs periodically (simple implementation)
// Runs every 5 minutes, clears jobs older than 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of insightJobs.entries()) {
    if (now - job.createdAt > 3600000) { // 1 hour expiration
      insightJobs.delete(jobId);
    }
  }
}, 300000); 

// Get user's projects (all projects where the user is a member or owner)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          p.*,
          CASE 
            WHEN p.user_id = $1 THEN 'OWNER'
            ELSE pm.role 
          END as role
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
       WHERE p.user_id = $1 OR pm.user_id = $1
       ORDER BY p.created_at DESC`,
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
  let client;
  let beganTxn = false;
  try {
    const userId = req.user!.id;
    const status = req.user!.subscription_status;
    const isPremium = isPremiumUser(status);

    // Enforce subscription for creating/owning projects
    if (!isPremium && status !== "free") {
      return res.status(403).json({
        error: "Subscription required to create projects",
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    beganTxn = true;

    // Lock the user row to prevent race conditions on project count
    await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [userId]);

    // Enforce 1-project limit for free tier
    if (!isPremium) {
      const projectCountResult = await client.query(
        "SELECT COUNT(*) as count FROM projects WHERE user_id = $1",
        [userId]
      );
      const projectCount = parseInt(projectCountResult.rows[0].count);
      
      if (projectCount >= 1) {
        await client.query("ROLLBACK");
        beganTxn = false;
        return res.status(403).json({
          error: "PROJECT_LIMIT_REACHED",
          message: "Free plan is limited to 1 project. Please upgrade to create more.",
        });
      }
    }

    const { name, description, aiSystemType, industry } = createProjectSchema.parse(
      req.body,
    );

    // Get current AIMA version using transactional client
    const currentVersion = await getCurrentVersion(client);

    const result = await client.query(
      "INSERT INTO projects (user_id, name, description, ai_system_type, industry, version_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [userId, name, description || null, aiSystemType || null, industry || null, currentVersion.id],
    );

    const project = result.rows[0];

    // Ensure creator is recorded as OWNER in project_members using transactional client
    await addMember(project.id, userId, "OWNER", [], client);

    // Record audit event using transactional client
    await recordEvent({
      projectId: project.id,
      actorId: userId,
      action: "project.created",
      objectType: "PROJECT",
      objectId: project.id,
      metadata: { name, industry },
      client
    });

    await client.query("COMMIT");
    beganTxn = false;

    res.status(201).json({
      project,
      version: {
        id: currentVersion.id,
        version_number: currentVersion.version_number
      }
    });
  } catch (error) {
    if (client && beganTxn) {
      await client.query("ROLLBACK");
    }
    console.error("Error creating project:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create project" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Get specific project
router.get(
  "/:projectId",
  authenticateToken,
  loadProject,
  requireProjectRole(["OWNER", "EDITOR", "VIEWER"]),
  async (req, res) => {
    try {
      res.json({ 
        project: {
          ...req.project,
          role: req.projectMembership?.role ?? (req.user?.id === req.project.user_id ? "OWNER" : undefined)
        } 
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  },
);

// Update project
router.put(
  "/:projectId",
  authenticateToken,
  loadProject,
  requireProjectRole(["OWNER", "EDITOR"]),
  async (req, res) => {
  try {
    const { name, description, aiSystemType, industry, status } = req.body;

    const result = await pool.query(
      "UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description), ai_system_type = COALESCE($3, ai_system_type), industry = COALESCE($4, industry), status = COALESCE($5, status), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *",
      [
        name,
        description,
        aiSystemType,
        industry,
        status,
        req.params.projectId,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const updated = result.rows[0];

    await recordEvent({
      projectId: updated.id,
      actorId: req.user!.id,
      action: "project.updated",
      objectType: "PROJECT",
      objectId: updated.id,
    });

    res.json({ project: updated });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete project
router.delete(
  "/:projectId",
  authenticateToken,
  loadProject,
  requireProjectRole(["OWNER"]),
  async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const actorId = req.user!.id;

      // Best-effort audit logging before deletion so FK constraint is satisfied
      try {
        await recordEvent({
          projectId,
          actorId,
          action: "project.deleted",
          objectType: "PROJECT",
          objectId: projectId,
        });
      } catch (logError) {
        console.error("Failed to record project deletion audit log:", logError);
      }

      const result = await pool.query(
        "DELETE FROM projects WHERE id = $1 RETURNING id",
        [projectId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  },
);

// Submit project
router.post(
  "/:projectId/submit",
  authenticateToken,
  loadProject,
  requireProjectRole(["OWNER", "EDITOR"]),
  async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;

    const project = req.project as { id: string; status: string; version_id: string | null };
    const projectVersionId = project.version_id;

    // Check if user is premium
    const isPremium = isPremiumUser(req.user!.subscription_status);

    // Get all assessment answers for this project
    const answersResult = await pool.query(
      `SELECT domain_id, practice_id, level, stream, question_index, value 
       FROM assessment_answers 
       WHERE project_id = $1`,
      [projectId]
    );

    // Get total questions for each domain and practice
    let questionsQuery = `
      SELECT d.id as domain_id, d.title as domain_title, COALESCE(d.is_premium, false) as is_premium,
             p.id as practice_id, p.title as practice_title,
             aq.level, aq.stream, aq.question_index
      FROM aima_domains d
      JOIN aima_practices p ON d.id = p.domain_id
      JOIN aima_questions aq ON p.id = aq.practice_id
    `;
    
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    if (!isPremium) {
      whereConditions.push(`COALESCE(d.is_premium, false) = false`);
    }
    
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
      questionsQuery += ` WHERE ${whereConditions.join(" AND ")}`;
    }
    
    // No GROUP BY needed here as we want individual questions
    
    const questionsResult = await pool.query(questionsQuery, queryParams);

    // Organize structure for scoring
    const structure = new Map(); // domainId -> { title, isPremium, practices: Map(practiceId -> { title, totalQuestions, totalScore }) }
    
    questionsResult.rows.forEach(row => {
      if (!structure.has(row.domain_id)) {
        structure.set(row.domain_id, {
          title: row.domain_title,
          isPremium: row.is_premium,
          practices: new Map()
        });
      }
      const domain = structure.get(row.domain_id);
      if (!domain.practices.has(row.practice_id)) {
        domain.practices.set(row.practice_id, {
          title: row.practice_title,
          totalQuestions: 0,
          totalScore: 0,
          validQuestionKeys: new Set()
        });
      }
      const practice = domain.practices.get(row.practice_id);
      const questionKey = `${row.level}:${row.stream}:${row.question_index}`;
      if (!practice.validQuestionKeys.has(questionKey)) {
        practice.validQuestionKeys.add(questionKey);
        practice.totalQuestions++;
      }
    });

    // Populate scores from answers
    let totalQuestions = 0;
    answersResult.rows.forEach(answer => {
      const domain = structure.get(answer.domain_id);
      if (domain) {
        const practice = domain.practices.get(answer.practice_id);
        const questionKey = `${answer.level}:${answer.stream}:${answer.question_index}`;
        if (practice && practice.validQuestionKeys.has(questionKey)) {
          practice.totalScore += parseFloat(answer.value);
        }
      }
    });

    // Calculate Maturity Scores
    const domains = (Array.from(structure.entries()) as [string, any][]).map(([domainId, domain]) => {
      const practices = (Array.from(domain.practices.entries()) as [string, any][]).map(([practiceId, practice]) => {
        const maturityScore = practice.totalQuestions > 0 
          ? Math.round((practice.totalScore / practice.totalQuestions) * 100) / 100
          : 0;
        
        return {
          practiceId,
          practiceTitle: practice.title,
          maturityScore,
          totalQuestions: practice.totalQuestions
        };
      });

      const domainScore = practices.length > 0
        ? Math.round((practices.reduce((sum: number, p: any) => sum + p.maturityScore, 0) / practices.length) * 100) / 100
        : 0;
      
      const domainTotalQuestions = practices.reduce((sum: number, p: any) => sum + p.totalQuestions, 0);
      if (!domain.isPremium) {
        totalQuestions += domainTotalQuestions;
      }

      return {
        domainId,
        domainTitle: domain.title,
        maturityScore: domainScore,
        practiceScores: practices,
        totalQuestions: domainTotalQuestions,
        isPremium: domain.isPremium,
        // Legacy percentage field for compatibility during transition if needed
        percentage: (domainScore / 3) * 100 
      };
    });

    const relevantDomains = domains.filter(d => isPremium || !d.isPremium);
    const overallMaturityScore = relevantDomains.length > 0
      ? Math.round((relevantDomains.reduce((sum: number, d: any) => sum + d.maturityScore, 0) / relevantDomains.length) * 100) / 100
      : 0;

    const overallPercentage = (overallMaturityScore / 3) * 100;

    // Update project status to completed
    const result = await pool.query(
      "UPDATE projects SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [projectId],
    );

    await recordEvent({
      projectId,
      actorId: userId,
      action: "project.submitted",
      objectType: "PROJECT",
      objectId: projectId,
      metadata: {
        overallMaturityScore,
        totalQuestions,
        overallPercentage,
      },
    });

    res.json({
      message: "Project submitted successfully",
      project: result.rows[0],
      results: {
        domains,
        overall: {
          overallMaturityScore,
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

// --- Project invitations ---

const inviteBodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "EDITOR", "VIEWER"]).default("EDITOR"),
  permissions: z.array(z.string()).optional(),
});

// Create or send invitation
router.post(
  "/:projectId/invitations",
  authenticateToken,
  loadProject,
  requireProjectRole(["OWNER"]),
  async (req, res) => {
    try {
      const { email, role, permissions } = inviteBodySchema.parse(req.body);
      const project = req.project as { id: string; name: string };
      const inviterId = req.user!.id;

      // Check if the user is already a member
      const userResult = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
        [email],
      );

      if (userResult.rows.length > 0) {
        const existingUser = userResult.rows[0];
        const membershipResult = await pool.query(
          "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
          [project.id, existingUser.id]
        );
        
        if (membershipResult.rows.length > 0) {
          return res.status(400).json({ error: "User is already a member of this project." });
        }
      }

      // Check for existing pending/sent invitation
      const existingInvitationResult = await pool.query(
        `SELECT id FROM project_invitations 
         WHERE project_id = $1 AND LOWER(email) = LOWER($2) AND status IN ('pending', 'sent')
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)`,
        [project.id, email]
      );

      if (existingInvitationResult.rows.length > 0) {
        return res.status(400).json({ error: "A pending invitation already exists for this email." });
      }

      // Create a pending invitation for all users (new or existing)
      const invitation = await createInvitation(
        project.id,
        inviterId,
        email,
        role,
        permissions ?? [],
      );

      if (!invitation) {
        return res.status(400).json({ error: "A pending invitation already exists for this email." });
      }

      // Send email (best-effort)
      const inviteUrl = `${process.env.FRONTEND_URL}/invite/accept?token=${invitation.token}`;
      const inviterName = req.user!.email;
      emailService
        .sendProjectInvitation(email, project.name, inviterName, inviteUrl)
        .catch((err) => {
          console.error("Failed to send project invitation email:", err);
        });

      await recordEvent({
        projectId: project.id,
        actorId: inviterId,
        action: "project.invitation.created",
        objectType: "INVITATION",
        objectId: invitation.id,
        metadata: { email, role },
      });

      res.status(201).json({
        mode: "invited",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expires_at: invitation.expires_at,
        },
      });
    } catch (error) {
      console.error("Error creating project invitation:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Validation failed", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create invitation" });
    }
  },
);

// List invitations for a project
router.get(
  "/:projectId/invitations",
  authenticateToken,
  loadProject,
  requireProjectRole(["OWNER"]),
  async (req, res) => {
    try {
      const project = req.project as { id: string };
      const invitations = await listInvitationsForProject(project.id);

      res.json({
        invitations: invitations.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
          expires_at: inv.expires_at,
          created_at: inv.created_at,
        })),
      });
    } catch (error) {
      console.error("Error listing project invitations:", error);
      res.status(500).json({ error: "Failed to list invitations" });
    }
  },
);

// Revoke invitation
router.delete(
  "/:projectId/invitations/:invitationId",
  authenticateToken,
  loadProject,
  requireProjectRole(["OWNER"]),
  async (req, res) => {
    try {
      const { projectId, invitationId } = req.params;
      await revokeInvitation(invitationId, projectId);

      await recordEvent({
        projectId,
        actorId: req.user!.id,
        action: "project.invitation.revoked",
        objectType: "INVITATION",
        objectId: invitationId,
      });

      res.json({ message: "Invitation revoked" });
    } catch (error) {
      console.error("Error revoking project invitation:", error);
      res.status(500).json({ error: "Failed to revoke invitation" });
    }
  },
);

// ==========================================
// MEMBER MANAGEMENT ROUTES
// ==========================================

// GET /projects/:projectId/members
router.get("/:projectId/members", authenticateToken, loadProject, requireProjectRole(["OWNER", "EDITOR", "VIEWER"]), async (req, res) => {
    try {
      const { projectId } = req.params;
      
      // We need to fetch the actual user names and emails for these members
      // listMembersForProject(projectId) call removed as we use enriched query below.
      
      const enrichedMembersResult = await pool.query(
        `SELECT pm.*, u.name, u.email 
         FROM project_members pm
         JOIN users u ON pm.user_id = u.id
         WHERE pm.project_id = $1
         ORDER BY pm.created_at ASC`,
        [projectId]
      );

      res.json({ members: enrichedMembersResult.rows });
    } catch (error) {
      console.error("Error listing project members:", error);
      res.status(500).json({ error: "Failed to list project members" });
    }
  }
);

// Update a member's role
router.patch(
  "/:projectId/members/:userId",
  authenticateToken,
  loadProject,
  requireProjectRole(["OWNER"]),
  async (req, res) => {
    try {
      const { projectId, userId } = req.params;
      const { role } = req.body;

      if (!role || !["OWNER", "EDITOR", "VIEWER"].includes(role)) {
        return res.status(400).json({ error: "Invalid role specified" });
      }

      // Prevent owner from demoting themselves
      if (req.user!.id === userId) {
        return res.status(400).json({ error: "You cannot change your own role" });
      }

      // Prevent changing canonical project owner's role
      if (userId === (req.project as any).user_id) {
        return res.status(400).json({ error: "Cannot change canonical project owner role" });
      }

      const membership = await updateMember(projectId, userId, { role });
      
      if (!membership) {
        return res.status(404).json({ error: "Member not found" });
      }

      await recordEvent({
        projectId,
        actorId: req.user!.id,
        action: "project.member_updated",
        objectType: "MEMBERSHIP",
        objectId: membership.id,
        metadata: { targetUserId: userId, newRole: role }
      });

      res.json({ member: membership });
    } catch (error: any) {
      console.error("Error updating project member:", error);
      if (error.message === "Membership not found") {
        return res.status(404).json({ error: "Member not found" });
      }
      res.status(500).json({ error: "Failed to update project member" });
    }
  }
);

// Remove a member
router.delete(
  "/:projectId/members/:userId",
  authenticateToken,
  loadProject,
  requireProjectRole(["OWNER"]),
  async (req, res) => {
    try {
      const { projectId, userId } = req.params;

      // Prevent owner from removing themselves
      if (req.user!.id === userId) {
        return res.status(400).json({ error: "You cannot remove yourself from the project" });
      }

      // Prevent removal of the project's canonical owner
      if (userId === (req.project as any).user_id) {
        return res.status(400).json({ error: "Cannot remove the canonical project owner" });
      }

      // Verify membership exists in project_members
      const membershipCheck = await pool.query(
        "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
        [projectId, userId]
      );
      if (membershipCheck.rows.length === 0) {
        return res.status(404).json({ error: "Member not found" });
      }
      
      await removeMember(projectId, userId);
      
      await recordEvent({
        projectId,
        actorId: req.user!.id,
        action: "project.member_removed",
        objectType: "USER",
        objectId: userId,
      });

      res.json({ message: "Member removed successfully" });
    } catch (error) {
      console.error("Error removing project member:", error);
      res.status(500).json({ error: "Failed to remove project member" });
    }
  }
);

/**
 * Background task to generate insights
 */
const generateInsightsAsync = async (
  jobId: string, 
  projectId: string, 
  userId: string, 
  isPremium: boolean, 
  projectVersionId: string | null
) => {
  try {
    const job = insightJobs.get(jobId);
    if (!job) return;

    // Helper for rate limiting
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Update status to processing
    job.status = 'processing';
    insightJobs.set(jobId, job);

    // 1. Get project details
    const projectResult = await pool.query("SELECT name FROM projects WHERE id = $1", [projectId]);
    const projectName = projectResult.rows[0]?.name || "Project";

    // 2. Fetch existing cached insights
    const existingInsightsResult = await pool.query(
      "SELECT domain_id, insight_text FROM project_insights WHERE project_id = $1",
      [projectId]
    );
    const existingInsights: Record<string, string> = {};
    existingInsightsResult.rows.forEach(row => {
      existingInsights[row.domain_id] = row.insight_text;
    });

    // 3. Get domains and practices with their data
    
    // Note: the join aa.id = aq.id is a bit weird if it's not the same ID. 
    // In schema.sql: assessment_answers has (project_id, domain_id, practice_id, level, stream, question_index)
    // aima_questions has (practice_id, level, stream, question_index)
    // So we should join on those fields.
    
    let domainsQuery = `
      SELECT d.id as domain_id, d.title as domain_title, d.description as domain_description, COALESCE(d.is_premium, false) as is_premium,
             p.id as practice_id, p.title as practice_title,
             COUNT(aq.id) as questions_in_practice,
             SUM(COALESCE(aa.value, 0)) as practice_total_score
       FROM aima_domains d
       JOIN aima_practices p ON d.id = p.domain_id
       JOIN aima_questions aq ON p.id = aq.practice_id
       LEFT JOIN assessment_answers aa ON 
          aa.project_id = $1 AND 
          aa.domain_id = d.id AND
          aa.practice_id = p.id AND
          aa.level = aq.level AND
          aa.stream = aq.stream AND
          aa.question_index = aq.question_index
    `;

    const whereConditions: string[] = [];
    const queryParams: any[] = [projectId];
    let paramIndex = 2;
    
    if (!isPremium) {
      whereConditions.push(`COALESCE(d.is_premium, false) = false`);
    }
    
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
    
    domainsQuery += ` GROUP BY d.id, d.title, d.description, d.is_premium, p.id, p.title`;
    
    const domainsResult = await pool.query(domainsQuery, queryParams);
    
    // Group and calculate scores
    const domainMap = new Map();
    domainsResult.rows.forEach(row => {
      if (!domainMap.has(row.domain_id)) {
        domainMap.set(row.domain_id, {
          id: row.domain_id,
          title: row.domain_title,
          description: row.domain_description,
          is_premium: row.is_premium,
          practices: []
        });
      }
      const domain = domainMap.get(row.domain_id);
      const practiceScore = row.questions_in_practice > 0 
        ? row.practice_total_score / row.questions_in_practice
        : 0;
      domain.practices.push(practiceScore);
    });

    const domains = Array.from(domainMap.values()).map(d => {
      const maturityScore = d.practices.length > 0
        ? d.practices.reduce((a: number, b: number) => a + b, 0) / d.practices.length
        : 0;
      return {
        ...d,
        maturity_score: maturityScore,
        percentage: (maturityScore / 3) * 100 // for compatibility if used in prompts
      };
    });

    if (domains.length === 0) {
      job.status = 'completed';
      job.insights = {};
      insightJobs.set(jobId, job);
      return;
    }

    // Initialize insights with existing ones so we don't regenerate them
    const insights: Record<string, string> = { ...existingInsights };
    const domainsToProcess = domains.filter(d => !insights[d.id]);
    
    // Optimization: Prefetch detailed answers for ALL domains if Premium
    const detailedContextMap = new Map<string, string>();
    
    if (isPremium && domainsToProcess.length > 0) {
        const domainIdsToCheck = domainsToProcess.map(d => d.id);
        
        // Only run if we actually have domains to process
        if (domainIdsToCheck.length > 0) {
            const detailedAnswersQuery = `
              SELECT 
                aa.domain_id,
                aq.question_text,
                ap.title as practice_title,
                aa.value as user_score
              FROM assessment_answers aa
              JOIN aima_practices ap ON aa.practice_id = ap.id
              JOIN aima_questions aq ON aa.practice_id = aq.practice_id 
                   AND aa.level = aq.level 
                   AND aa.stream = aq.stream 
                   AND aa.question_index = aq.question_index
              WHERE aa.project_id = $1 AND aa.domain_id = ANY($2)
            `;
            
            const detailedAnswersResult = await pool.query(detailedAnswersQuery, [projectId, domainIdsToCheck]);
            
            // Group by domain_id
            const groupedAnswers = new Map<string, any[]>();
            detailedAnswersResult.rows.forEach(row => {
                if (!groupedAnswers.has(row.domain_id)) {
                    groupedAnswers.set(row.domain_id, []);
                }
                groupedAnswers.get(row.domain_id)!.push(row);
            });
            
            // Build context strings
            groupedAnswers.forEach((rows, domainId) => {
                 const context = "\n\nDetailed Question Analysis:\n" + rows.map(row => {
                    const score = parseFloat(row.user_score);
                    let label = "No Maturity";
                    if (score >= 3) label = "Mature";
                    else if (score >= 2) label = "Developing";
                    else if (score >= 1) label = "Initial";
                    
                    return `- [Maturity: ${label} (score: ${score})] Practice: ${row.practice_title}\n  Question: ${row.question_text}`;
                  }).join("\n");
                  detailedContextMap.set(domainId, context);
            });
        }
    }

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro"];

    // Generate insights for each missing domain sequentially
    for (const [index, domain] of domainsToProcess.entries()) {
      try {
        // Add delay between requests (except the first one) to respect rate limits
        if (index > 0) await sleep(2000); // reduced delay to be nice to API but faster than 5s

        const maturityScore = parseFloat(domain.maturity_score) || 0;

        let detailedContext = "";
        if (isPremium && detailedContextMap.has(domain.id)) {
            detailedContext = detailedContextMap.get(domain.id) || "";
        }

        const prompt = `You are an AI assessment expert analyzing domain maturity based on the OWASP AIMA model. Generate actionable insights and recommendations for the following domain:
 
 Domain: ${domain.title}
 Description: ${domain.description || 'N/A'}
 Maturity Score: ${maturityScore.toFixed(2)} / 3.0
 Project: ${projectName}${detailedContext}
 
 Based on this maturity scoring${isPremium ? ' and the detailed question analysis above' : ''}, provide:
 1. A brief analysis of the current maturity level
 2. Key strengths (if any)
 3. Areas that need improvement
 4. Specific actionable recommendations${isPremium ? ' based on the specific question scores' : ''}
 
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
                if (!genAI) throw new Error("GenAI not initialized");
                const model = genAI.getGenerativeModel({ model: modelName });
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
                    await sleep(5000 * attempts); 
                    break; 
                }
                
                console.error(`[Insights] Model ${modelName} failed for domain ${domain.id}:`, modelError.message || modelError);
                continue;
            }
            }
            
            if (!insightText && attempts < maxAttempts) {
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

    // Complete job
    job.status = 'completed';
    job.insights = insights;
    insightJobs.set(jobId, job);

  } catch (error: any) {
    console.error("Error in generateInsightsAsync:", error);
    const job = insightJobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      insightJobs.set(jobId, job);
    }
  }
};

// Generate AI insights for domains (free users: free domains only, premium users: all domains)
// REFACTORED: Now async, returns a jobId
router.post(
  "/:projectId/generate-insights",
  authenticateToken,
  loadProject,
  requireProjectRole(["OWNER", "EDITOR"]),
  async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.id;
    const isPremium = isPremiumUser(req.user!.subscription_status);

    if (!genAI) {
      return res.status(503).json({ error: "AI service is not configured. GEMINI_API_KEY is missing." });
    }

    const project = req.project as { id: string; name: string; version_id: string | null };
    const projectVersionId = project.version_id;

    // 1. Determine which domains need insights
    // We need to know the list of relevant domain IDs first to check if cache is complete
    let domainsQuery = `
        SELECT d.id
        FROM aima_domains d
        LEFT JOIN aima_practices p ON d.id = p.domain_id
        LEFT JOIN aima_questions aq ON p.id = aq.practice_id
    `;

    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (!isPremium) {
        whereConditions.push(`COALESCE(d.is_premium, false) = false`);
    }

    // Add version filtering (simplified reuse of logic)
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
    
    domainsQuery += ` GROUP BY d.id HAVING COUNT(DISTINCT aq.id) > 0`;

    const domainsResult = await pool.query(domainsQuery, queryParams);
    const requiredDomainIds = domainsResult.rows.map(r => r.id);

    // 2. Check cache
    const existingInsightsResult = await pool.query(
      "SELECT domain_id, insight_text FROM project_insights WHERE project_id = $1",
      [projectId]
    );
    const cachedAllowed: Record<string, string> = {};
    existingInsightsResult.rows.forEach(row => {
        if (requiredDomainIds.includes(row.domain_id)) {
            cachedAllowed[row.domain_id] = row.insight_text;
        }
    });

    // Check if we have insights for ALL required domains
    const allCached = requiredDomainIds.length > 0 && requiredDomainIds.every(id => cachedAllowed[id]);

    if (allCached) {
         return res.json({ 
            success: true, 
            insights: cachedAllowed,
            cached: true,
            status: 'completed'
          });
    }

    // 3. Not fully cached, start async job
    const jobId = randomUUID();
    
    // Store job
    insightJobs.set(jobId, {
        status: 'pending',
        projectId,
        userId,
        createdAt: Date.now()
    });

    // Start background processing (fire and forget)
    generateInsightsAsync(jobId, projectId, userId, isPremium, projectVersionId).catch(err => {
        console.error(`Background job ${jobId} failed completely:`, err);
        const job = insightJobs.get(jobId);
        if (job) {
            job.status = 'failed';
            job.error = "Internal server error during processing";
            insightJobs.set(jobId, job);
        }
    });

    // Return immediately
    res.json({ 
      success: true, 
      jobId, 
      status: 'processing',
      message: "Insights generation started. Please poll status."
    });

  } catch (error) {
    console.error("Error initiating insights generation:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// Poll for insights status
router.get(
  "/:projectId/insights/status/:jobId",
  authenticateToken,
  async (req, res) => {
    try {
        const { jobId, projectId } = req.params;
        const job = insightJobs.get(jobId);

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        if (job.projectId !== projectId) {
             return res.status(403).json({ error: "Unauthorized access to this job" });
        }

        if (job.userId !== req.user!.id) {
             return res.status(403).json({ error: "Unauthorized access to this job" });
        }

        res.json({
            jobId,
            status: job.status,
            insights: job.insights,
            error: job.error
        });

    } catch (error) {
        console.error("Error checking job status:", error);
        res.status(500).json({ error: "Failed to check status" });
    }
});

export default router;
