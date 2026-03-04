import { Request, Response, NextFunction } from "express";
import pool from "../config/database";
import {
  getMembership,
  ProjectMembership,
  ProjectRole,
} from "../services/projectMembershipService";

declare module "express-serve-static-core" {
  interface Request {
    project?: any;
    projectMembership?: ProjectMembership;
  }
}

export const loadProject = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const projectId = req.params.projectId;

    if (!projectId) {
      return res.status(400).json({ error: "projectId parameter is required" });
    }

    const result = await pool.query(
      "SELECT * FROM projects WHERE id = $1",
      [projectId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    req.project = result.rows[0];
    next();
  } catch (error) {
    console.error("Error loading project:", error);
    res.status(500).json({ error: "Failed to load project" });
  }
};

export const requireProjectRole =
  (roles: ProjectRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const projectId =
        (req.params && req.params.projectId) ||
        (req.project && req.project.id);

      if (!projectId) {
        return res
          .status(400)
          .json({ error: "Project identifier is missing for access check" });
      }

      const membership = await getMembership(projectId, req.user.id);

      if (!membership) {
        return res
          .status(403)
          .json({ error: "Project not found or access denied" });
      }

      if (!roles.includes(membership.role)) {
        return res.status(403).json({ error: "Insufficient project role" });
      }

      req.projectMembership = membership;
      next();
    } catch (error) {
      console.error("Error checking project role:", error);
      res.status(500).json({ error: "Failed to check project access" });
    }
  };

export const requireProjectPermission =
  (permission: string) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const projectId =
        (req.params && req.params.projectId) ||
        (req.project && req.project.id);

      if (!projectId) {
        return res
          .status(400)
          .json({ error: "Project identifier is missing for access check" });
      }

      const membership =
        req.projectMembership ||
        (await getMembership(projectId, req.user.id));

      if (!membership) {
        return res
          .status(403)
          .json({ error: "Project not found or access denied" });
      }

      const permissions = Array.isArray(membership.permissions)
        ? membership.permissions
        : [];

      if (!permissions.includes(permission)) {
        return res.status(403).json({ error: "Insufficient project permissions" });
      }

      req.projectMembership = membership;
      next();
    } catch (error) {
      console.error("Error checking project permission:", error);
      res.status(500).json({ error: "Failed to check project permissions" });
    }
  };

