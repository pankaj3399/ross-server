import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import pool from "../config/database";
import { authenticateToken, checkRouteAccess } from "../middleware/auth";
import { notificationService } from "../services/notificationService";

const router = Router();

const PreferencesSchema = z.object({
  weekly_digest: z.boolean().optional(),
  critical_alerts: z.boolean().optional(),
  vendor_reassessment: z.boolean().optional(),
  email_undeliverable: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  timezone: z.string().optional(),
});

// GET preferences
router.get("/preferences", authenticateToken, checkRouteAccess('/notifications'), async (req, res) => {
  try {
    const userId = req.user!.id;
    const preferences = await notificationService.getPreferences(userId);
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    res.status(500).json({ error: "Failed to fetch notification preferences" });
  }
});

// PUT preferences
router.put("/preferences", authenticateToken, checkRouteAccess('/notifications'), async (req, res) => {
  try {
    const parsed = PreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const userId = req.user!.id;
    const updated = await notificationService.updatePreferences(userId, parsed.data);
    res.json(updated);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({ error: "Failed to update notification preferences" });
  }
});

// GET notification history (paginated)
router.get("/history", authenticateToken, checkRouteAccess('/notifications'), async (req, res) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, project_id, notification_type, subject, status, metadata, sent_at, created_at
       FROM notification_log
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM notification_log WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      history: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notification history:", error);
    res.status(500).json({ error: "Failed to fetch notification history" });
  }
});

// GET unsubscribe (one-click unsubscribe endpoint)
router.get("/unsubscribe/:token", async (req, res) => {
  try {
    const { token } = req.params;
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Invalid Link - MATUR.ai</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f7fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; text-align: center; border-top: 4px solid #e53e3e; }
              h1 { color: #e53e3e; margin-top: 0; font-size: 24px; }
              p { color: #4a5568; line-height: 1.5; font-size: 15px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Expired or Invalid</h1>
              <p>This unsubscribe link is invalid or has expired.</p>
              <p>Please log in to your account settings to manage your notification preferences.</p>
            </div>
          </body>
        </html>
      `);
    }

    const { userId, notificationType } = decoded;

    // Type checking
    const validTypes = ["weekly_digest", "critical_alerts", "vendor_reassessment"];
    if (!validTypes.includes(notificationType)) {
      return res.status(400).send("Invalid notification type");
    }

    // Update preferences to false
    await notificationService.updatePreferences(userId, {
      [notificationType]: false,
    });

    const formattedType = notificationType
      .split("_")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Unsubscribed - MATUR.ai</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f7fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; text-align: center; border-top: 4px solid #667eea; }
            h1 { color: #667eea; margin-top: 0; font-size: 24px; }
            p { color: #4a5568; line-height: 1.5; font-size: 15px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; font-size: 14px; box-shadow: 0 4px 6px rgba(118, 75, 162, 0.2); }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Unsubscribed</h1>
            <p>You have been successfully unsubscribed from <strong>${formattedType}</strong> notifications.</p>
            <p>You can update your preferences at any time in your settings.</p>
            <a href="${frontendUrl}/settings?tab=notifications" class="btn">Go to Settings</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error handling unsubscribe request:", error);
    res.status(500).send("An error occurred processing your request.");
  }
});

export default router;
