import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database";
import { getRoutesForSubscription, SubscriptionStatus } from "../config/subscriptionAccess";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
      subscription_status: string;
      stripe_customer_id?: string | null;
      stripe_subscription_id?: string | null;
      trial_started_at?: Date | null;
      trial_ends_at?: Date | null;
      trial_used?: boolean;
      free_path_chosen_at?: Date | null;
    };
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const result = await pool.query(
      "SELECT id, email, role, subscription_status, stripe_customer_id, stripe_subscription_id, trial_started_at, trial_ends_at, trial_used, free_path_chosen_at FROM users WHERE id = $1",
      [decoded.userId],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    let user = result.rows[0];

    // Trial auto-expiration logic
    if (user.subscription_status === 'trial' && user.trial_ends_at) {
      if (new Date() > new Date(user.trial_ends_at)) {
        const updateResult = await pool.query(
          "UPDATE users SET subscription_status = 'free', trial_used = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND subscription_status = 'trial' AND trial_ends_at <= NOW()",
          [user.id]
        );
        if (updateResult.rowCount === 1) {
          user.subscription_status = 'free';
          user.trial_used = true;
        }
      }
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    console.error("Internal authentication error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

/**
 * Check if user's subscription has access to a specific route
 * Uses the subscription access configuration
 */
export const checkRouteAccess = (route: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admins bypass subscription checks
    if (req.user.role === "ADMIN") {
      return next();
    }

    const userStatus = req.user.subscription_status as SubscriptionStatus;

    const validStatuses: SubscriptionStatus[] = ['free', 'basic_premium', 'pro_premium', 'trial'];
    if (!validStatuses.includes(userStatus)) {
      return res.status(403).json({
        error: "Invalid subscription status",
        status: userStatus
      });
    }

    const allowedRoutes = getRoutesForSubscription(userStatus);

    if (!allowedRoutes.includes(route)) {
      return res.status(403).json({
        error: "Access denied. This route requires a different subscription plan.",
        required: "Premium subscription required",
        current: userStatus
      });
    }

    next();
  };
};
