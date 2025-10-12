import crypto from "crypto";
import pool from "../config/database";

class TokenService {
  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Create email verification token
   */
  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing tokens for this user
    await pool.query(
      "DELETE FROM email_verification_tokens WHERE user_id = $1",
      [userId],
    );

    // Insert new token
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt],
    );

    return token;
  }

  /**
   * Verify email verification token
   */
  async verifyEmailToken(
    token: string,
  ): Promise<{ userId: string; valid: boolean }> {
    try {
      const result = await pool.query(
        `SELECT user_id FROM email_verification_tokens 
         WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used = FALSE`,
        [token],
      );

      if (result.rows.length === 0) {
        return { userId: "", valid: false };
      }

      const userId = result.rows[0].user_id;

      // Mark token as used
      await pool.query(
        "UPDATE email_verification_tokens SET used = TRUE WHERE token = $1",
        [token],
      );

      // Mark user email as verified
      await pool.query("UPDATE users SET email_verified = TRUE WHERE id = $1", [
        userId,
      ]);

      return { userId, valid: true };
    } catch (error) {
      console.error("Error verifying email token:", error);
      return { userId: "", valid: false };
    }
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this user
    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [
      userId,
    ]);

    // Insert new token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt],
    );

    return token;
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(
    token: string,
  ): Promise<{ userId: string; valid: boolean }> {
    try {
      const result = await pool.query(
        `SELECT user_id FROM password_reset_tokens 
         WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used = FALSE`,
        [token],
      );

      if (result.rows.length === 0) {
        return { userId: "", valid: false };
      }

      const userId = result.rows[0].user_id;

      // Mark token as used
      await pool.query(
        "UPDATE password_reset_tokens SET used = TRUE WHERE token = $1",
        [token],
      );

      return { userId, valid: true };
    } catch (error) {
      console.error("Error verifying password reset token:", error);
      return { userId: "", valid: false };
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      await pool.query(
        "DELETE FROM email_verification_tokens WHERE expires_at < CURRENT_TIMESTAMP",
      );
      await pool.query(
        "DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP",
      );
      await pool.query(
        "DELETE FROM temp_mfa_codes WHERE expires_at < CURRENT_TIMESTAMP",
      );
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }

  /**
   * Check if user has valid email verification token
   */
  async hasValidEmailToken(userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT id FROM email_verification_tokens 
         WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP AND used = FALSE`,
        [userId],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking email token:", error);
      return false;
    }
  }

  /**
   * Check if user has valid password reset token
   */
  async hasValidPasswordResetToken(userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT id FROM password_reset_tokens 
         WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP AND used = FALSE`,
        [userId],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking password reset token:", error);
      return false;
    }
  }
}

export const tokenService = new TokenService();
