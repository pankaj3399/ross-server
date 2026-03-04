import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { getMembership } from "../services/projectMembershipService";
import { listEventsForProject } from "../services/auditLogService";

const router = Router();

// GET /projects/:projectId/audit-log
router.get(
  "/:projectId/audit-log",
  authenticateToken,
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = req.user!.id;

      const membership = await getMembership(projectId, userId);
      if (!membership) {
        return res
          .status(403)
          .json({ error: "Project not found or access denied" });
      }

      const limit = Math.min(
        parseInt(req.query.limit as string, 10) || 50,
        100,
      );
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const events = await listEventsForProject(projectId, { limit, offset });

      res.json({ events });
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
  },
);

export default router;

