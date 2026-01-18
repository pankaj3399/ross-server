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
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }


  /**
   * Create email verification OTP
   */
  async createEmailVerificationOTP(userId: string): Promise<string> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing tokens for this user
    await pool.query(
      "DELETE FROM email_verification_tokens WHERE user_id = $1",
      [userId],
    );

    // Insert new OTP
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, otp, expires_at) 
       VALUES ($1, $2, $3)`,
      [userId, otp, expiresAt],
    );

    return otp;
  }

  /**
   * Verify email verification OTP
   */
  async verifyEmailOTP(
    email: string,
    otp: string,
  ): Promise<{ userId: string; valid: boolean }> {
    try {
      const result = await pool.query(
        `SELECT evt.user_id, evt.used, evt.expires_at
         FROM email_verification_tokens evt
         JOIN users u ON u.id = evt.user_id
         WHERE u.email = $1 AND evt.otp = $2 AND evt.expires_at > CURRENT_TIMESTAMP`,
        [email, otp],
      );

      console.log("- Query Result Rows:", result.rows.length);
      if (result.rows.length > 0) {
        console.log("- First Row:", result.rows[0]);
      }

      if (result.rows.length === 0) {
        console.log("- No matching OTP found or expired");
        return { userId: "", valid: false };
      }

      const { user_id: userId, used } = result.rows[0];

      if (!used) {
        await pool.query(
          "UPDATE email_verification_tokens SET used = TRUE WHERE user_id = $1 AND otp = $2",
          [userId, otp],
        );

        await pool.query(
          "UPDATE users SET email_verified = TRUE WHERE id = $1",
          [userId],
        );
      } else {
        await pool.query(
          "UPDATE users SET email_verified = TRUE WHERE id = $1",
          [userId],
        );
      }

      return { userId, valid: true };
    } catch (error) {
      console.error("Error verifying email OTP:", error);
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
   * Check if user has valid email verification OTP
   */
  async hasValidEmailOTP(userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT id FROM email_verification_tokens 
         WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP AND used = FALSE`,
        [userId],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking email OTP:", error);
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
