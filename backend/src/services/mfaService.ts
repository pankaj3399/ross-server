import speakeasy from "speakeasy";
import QRCode from "qrcode";
import pool from "../config/database";

interface MFASecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface MFAVerificationResult {
  isValid: boolean;
  backupCodeUsed?: boolean;
}

class MFAService {
  /**
   * Generate MFA secret and QR code
   */
  async generateMFASecret(
    userId: string,
    userEmail: string,
  ): Promise<MFASecret> {
    const secret = speakeasy.generateSecret({
      name: `MATUR.ai (${userEmail})`,
      issuer: "MATUR.ai",
      length: 32,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    const backupCodes = this.generateBackupCodes();

    await pool.query(
      `INSERT INTO user_mfa (user_id, secret, backup_codes, created_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET secret = $2, backup_codes = $3, updated_at = CURRENT_TIMESTAMP`,
      [userId, secret.base32, JSON.stringify(backupCodes)],
    );

    return {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify TOTP code
   */
  async verifyTOTP(
    userId: string,
    token: string,
  ): Promise<MFAVerificationResult> {
    try {
      const result = await pool.query(
        "SELECT secret FROM user_mfa WHERE user_id = $1",
        [userId],
      );

      if (result.rows.length === 0) {
        console.log(
          "MFA verification failed: No secret found for user",
          userId,
        );
        return { isValid: false };
      }

      const secret = result.rows[0].secret;

      const currentCode = speakeasy.totp({
        secret,
        encoding: "base32",
      });

      const verified = speakeasy.totp.verify({
        secret,
        encoding: "base32",
        token,
        window: 5,
        time: Math.floor(Date.now() / 1000),
      });

      return { isValid: verified };
    } catch (error) {
      console.error("Error verifying TOTP:", error);
      return { isValid: false };
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(
    userId: string,
    code: string,
  ): Promise<MFAVerificationResult> {
    try {
      const result = await pool.query(
        "SELECT backup_codes FROM user_mfa WHERE user_id = $1",
        [userId],
      );

      if (result.rows.length === 0) {
        return { isValid: false };
      }

      const backupCodes = JSON.parse(result.rows[0].backup_codes || "[]");
      const codeIndex = backupCodes.indexOf(code);

      if (codeIndex === -1) {
        return { isValid: false };
      }

      backupCodes.splice(codeIndex, 1);
      await pool.query(
        "UPDATE user_mfa SET backup_codes = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
        [JSON.stringify(backupCodes), userId],
      );

      return { isValid: true, backupCodeUsed: true };
    } catch (error) {
      console.error("Error verifying backup code:", error);
      return { isValid: false };
    }
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        "SELECT secret FROM user_mfa WHERE user_id = $1 AND secret IS NOT NULL",
        [userId],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking MFA status:", error);
      return false;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string): Promise<boolean> {
    try {
      await pool.query("DELETE FROM user_mfa WHERE user_id = $1", [userId]);
      return true;
    } catch (error) {
      console.error("Error disabling MFA:", error);
      return false;
    }
  }

  /**
   * Get remaining backup codes
   */
  async getBackupCodes(userId: string): Promise<string[]> {
    try {
      const result = await pool.query(
        "SELECT backup_codes FROM user_mfa WHERE user_id = $1",
        [userId],
      );

      if (result.rows.length === 0) {
        return [];
      }

      return JSON.parse(result.rows[0].backup_codes || "[]");
    } catch (error) {
      console.error("Error getting backup codes:", error);
      return [];
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();

    await pool.query(
      "UPDATE user_mfa SET backup_codes = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
      [JSON.stringify(backupCodes), userId],
    );

    return backupCodes;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateBackupCode());
    }
    return codes;
  }

  /**
   * Generate a single backup code
   */
  private generateBackupCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate a temporary MFA code for email fallback
   */
  generateTempCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store temporary MFA code
   */
  async storeTempCode(
    userId: string,
    code: string,
    expiresAt: Date,
  ): Promise<void> {
    await pool.query(
      `INSERT INTO temp_mfa_codes (user_id, code, expires_at, created_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET code = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [userId, code, expiresAt],
    );
  }

  /**
   * Verify temporary MFA code
   */
  async verifyTempCode(userId: string, code: string): Promise<boolean> {
    try {
      const result = await pool.query(
        "SELECT code FROM temp_mfa_codes WHERE user_id = $1 AND code = $2 AND expires_at > CURRENT_TIMESTAMP",
        [userId, code],
      );

      if (result.rows.length === 0) {
        return false;
      }

      await pool.query(
        "DELETE FROM temp_mfa_codes WHERE user_id = $1 AND code = $2",
        [userId, code],
      );

      return true;
    } catch (error) {
      console.error("Error verifying temp code:", error);
      return false;
    }
  }
}

export const mfaService = new MFAService();
