import pool from "../config/database";
import { emailService } from "./emailService";

export interface NotificationPreferences {
  weekly_digest: boolean;
  critical_alerts: boolean;
  vendor_reassessment: boolean;
  email_undeliverable: boolean;
  marketing_emails: boolean;
  timezone?: string;
}

export class NotificationService {
  /**
   * Get notification preferences for a user.
   * If they don't exist, create default preferences.
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // First try to select
      const result = await pool.query(
        `SELECT np.weekly_digest, np.critical_alerts, np.vendor_reassessment, np.email_undeliverable, np.marketing_emails, u.timezone
         FROM notification_preferences np
         JOIN users u ON np.user_id = u.id
         WHERE np.user_id = $1`,
        [userId]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // If preferences row doesn't exist, create defaults
      await pool.query(
        `INSERT INTO notification_preferences (user_id, weekly_digest, critical_alerts, vendor_reassessment, email_undeliverable, marketing_emails)
         VALUES ($1, true, true, true, false, true)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );

      // Fetch user timezone
      const userResult = await pool.query("SELECT timezone FROM users WHERE id = $1", [userId]);
      const timezone = userResult.rows[0]?.timezone || "UTC";

      return {
        weekly_digest: true,
        critical_alerts: true,
        vendor_reassessment: true,
        email_undeliverable: false,
        marketing_emails: true,
        timezone,
      };
    } catch (error) {
      console.error("Error in getPreferences:", error);
      throw error;
    }
  }

  /**
   * Update notification preferences and/or user timezone
   */
  async updatePreferences(
    userId: string,
    prefs: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update preferences
      const prefFields: string[] = [];
      const prefValues: any[] = [];
      let index = 1;

      const allowedPrefKeys: Array<keyof NotificationPreferences> = [
        "weekly_digest",
        "critical_alerts",
        "vendor_reassessment",
        "email_undeliverable",
        "marketing_emails",
      ];

      for (const key of allowedPrefKeys) {
        if (prefs[key] !== undefined) {
          prefFields.push(`${key} = $${index}`);
          prefValues.push(prefs[key]);
          index++;
        }
      }

      if (prefFields.length > 0) {
        prefValues.push(userId);
        await client.query(
          `UPDATE notification_preferences
           SET ${prefFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $${index}`,
          prefValues
        );
      }

      // Update user timezone if provided
      if (prefs.timezone !== undefined) {
        await client.query(
          "UPDATE users SET timezone = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [prefs.timezone, userId]
        );
      }

      await client.query("COMMIT");
      
      // Return updated preferences
      return this.getPreferences(userId);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error in updatePreferences:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if a notification should be sent to the user based on preferences,
   * deliverability status, and rate limits.
   */
  async shouldSendNotification(
    userId: string,
    projectId: string | null,
    type: "weekly_digest" | "critical_alerts" | "vendor_reassessment"
  ): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(userId);

      // Check deliverability
      if (prefs.email_undeliverable) {
        return false;
      }

      // Check specific preference toggle
      if (type === "weekly_digest" && !prefs.weekly_digest) return false;
      if (type === "critical_alerts" && !prefs.critical_alerts) return false;
      if (type === "vendor_reassessment" && !prefs.vendor_reassessment) return false;

      // Rate limit check: critical alerts (max 3 per day per project/user)
      if (type === "critical_alerts") {
        if (projectId) {
          const rateLimitResult = await pool.query(
            `SELECT COUNT(*) FROM notification_log
             WHERE user_id = $1 AND project_id = $2 AND notification_type = $3
             AND created_at > NOW() - INTERVAL '24 hours'`,
            [userId, projectId, type]
          );
          const sentCount = parseInt(rateLimitResult.rows[0].count, 10);
          if (sentCount >= 3) {
            console.warn(`Critical alert suppressed: Rate limit hit (3/day) for user ${userId} on project ${projectId}`);
            return false;
          }
        } else {
          const rateLimitResult = await pool.query(
            `SELECT COUNT(*) FROM notification_log
             WHERE user_id = $1 AND project_id IS NULL AND notification_type = $2
             AND created_at > NOW() - INTERVAL '24 hours'`,
            [userId, type]
          );
          const sentCount = parseInt(rateLimitResult.rows[0].count, 10);
          if (sentCount >= 3) {
            console.warn(`Critical alert suppressed: Rate limit hit (3/day) for user ${userId} globally (project-less)`);
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error("Error checking shouldSendNotification:", error);
      return false;
    }
  }

  /**
   * Log a sent notification
   */
  async logNotification(
    userId: string,
    projectId: string | null,
    type: string,
    subject: string,
    status: "sent" | "failed" | "queued" | "bounced",
    metadata: any = null
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO notification_log (user_id, project_id, notification_type, subject, status, metadata, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          projectId,
          type,
          subject,
          status,
          metadata,
          status === "sent" ? new Date() : null,
        ]
      );
    } catch (error) {
      console.error("Error logging notification:", error);
    }
  }

  /**
   * Queue a failed or deferred notification
   */
  async queueNotification(
    userId: string,
    projectId: string | null,
    type: string,
    payload: { to: string; subject: string; html: string; text?: string }
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO notification_queue (user_id, project_id, notification_type, payload, status, next_attempt_at)
         VALUES ($1, $2, $3, $4, 'pending', CURRENT_TIMESTAMP)`,
        [userId, projectId, type, payload]
      );
      await this.logNotification(userId, projectId, type, payload.subject, "queued", { error: "Initial send failed" });
    } catch (error) {
      console.error("Error queueing notification:", error);
    }
  }

  /**
   * Process pending queue entries with exponential backoff retry.
   * Runs in Inngest cron job.
   */
  async processQueue(): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const pendingResult = await client.query(
        `SELECT id, user_id, project_id, notification_type, payload, attempts
         FROM notification_queue
         WHERE status = 'pending' AND next_attempt_at <= NOW()
         LIMIT 50
         FOR UPDATE SKIP LOCKED`
      );

      for (const row of pendingResult.rows) {
        const { id, user_id, project_id, notification_type, payload, attempts } = row;
        
        console.log(`Retrying queued notification ${id} (Attempt ${attempts + 1})`);
        
        const success = await emailService.sendEmail({
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        });

        if (success) {
          await client.query(
            `UPDATE notification_queue
             SET status = 'sent', attempts = attempts + 1, next_attempt_at = NOW()
             WHERE id = $1`,
            [id]
          );
          await this.logNotification(user_id, project_id, notification_type, payload.subject, "sent", { queue_id: id, attempts: attempts + 1 });
        } else {
          const nextAttempts = attempts + 1;
          if (nextAttempts >= 5) {
            // Mark failed after 5 retries
            await client.query(
              `UPDATE notification_queue
               SET status = 'failed', attempts = $2
               WHERE id = $1`,
              [id, nextAttempts]
            );
            await this.logNotification(user_id, project_id, notification_type, payload.subject, "failed", { queue_id: id, attempts: nextAttempts, error: "Max attempts reached" });
          } else {
            // Exponential backoff: 15 min, 30 min, 1 hour, 2 hours
            const delayMinutes = Math.pow(2, nextAttempts) * 15;
            await client.query(
              `UPDATE notification_queue
               SET attempts = $2, next_attempt_at = NOW() + ($3 || ' minutes')::interval
               WHERE id = $1`,
              [id, nextAttempts, delayMinutes]
            );
          }
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error in processQueue:", error);
    } finally {
      client.release();
    }
  }
}

export const notificationService = new NotificationService();
