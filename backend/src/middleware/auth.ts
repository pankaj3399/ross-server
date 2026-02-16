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
      "SELECT id, email, role, subscription_status, stripe_customer_id, stripe_subscription_id FROM users WHERE id = $1",
      [decoded.userId],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
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

    const validStatuses: SubscriptionStatus[] = ['free', 'basic_premium', 'pro_premium'];
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
