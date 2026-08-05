import bcrypt from "bcryptjs";
import pool from "../config/database";

export class PasswordHistoryService {
  private readonly historyLimit = 3;

  /**
   * Check if the new password matches any of the user's last N passwords
   * (including the current active password).
   */
  async isPasswordReused(userId: string, newPasswordText: string): Promise<boolean> {
    try {
      // 1. Get user's current active password hash
      const userRes = await pool.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userId],
      );

      const hashesToCheck: string[] = [];

      if (userRes.rows.length > 0 && userRes.rows[0].password_hash) {
        hashesToCheck.push(userRes.rows[0].password_hash);
      }

      // 2. Fetch recent password hashes from password_history
      const historyRes = await pool.query(
        `SELECT password_hash 
         FROM password_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, this.historyLimit],
      );

      for (const row of historyRes.rows) {
        if (row.password_hash && !hashesToCheck.includes(row.password_hash)) {
          hashesToCheck.push(row.password_hash);
        }
      }

      // 3. Compare newPasswordText against all retrieved hashes
      for (const hash of hashesToCheck) {
        const matches = await bcrypt.compare(newPasswordText, hash);
        if (matches) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking password history:", error);
      // In case of database error, return false or rethrow depending on safety preferences.
      // Re-throwing allows callers to catch or handle properly.
      throw error;
    }
  }

  /**
   * Record a new password hash into password_history for the given user,
   * and clean up old records beyond the retention limit.
   */
  async recordPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)`,
        [userId, passwordHash],
      );

      // Keep only recent entries per user to avoid unbounded table growth
      await pool.query(
        `DELETE FROM password_history 
         WHERE user_id = $1 AND id NOT IN (
           SELECT id FROM password_history 
           WHERE user_id = $1 
           ORDER BY created_at DESC 
           LIMIT 10
         )`,
        [userId],
      );
    } catch (error) {
      console.error("Error recording password history:", error);
    }
  }
}

export const passwordHistoryService = new PasswordHistoryService();
