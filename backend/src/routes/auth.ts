import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import pool from "../config/database";
import { authenticateToken } from "../middleware/auth";
import {
  validatePassword,
  DEFAULT_PASSWORD_REQUIREMENTS,
} from "../utils/passwordValidation";
import { emailService } from "../services/emailService";
import { mfaService } from "../services/mfaService";
import { tokenService } from "../services/tokenService";

const router = Router();

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  name: z.string().min(1, "Name is required"),
  organization: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  mfaCode: z.string().optional(),
  backupCode: z.string().optional(),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(1, "Password is required"),
});

const mfaSetupSchema = z.object({
  mfaCode: z.string().min(6, "MFA code must be 6 digits"),
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, organization } = registerSchema.parse(
      req.body,
    );

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password, { email, name });
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "Password does not meet requirements",
        details: passwordValidation.errors,
        score: passwordValidation.score,
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, name, organization, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role, subscription_status, email_verified",
      [email, passwordHash, name, organization || null, false],
    );

    const user = result.rows[0];

    // Create email verification token
    const verificationToken = await tokenService.createEmailVerificationToken(
      user.id,
    );

    // Send verification email
    const emailSent = await emailService.sendEmailVerification(
      email,
      verificationToken,
    );
    if (!emailSent) {
      console.error("Failed to send verification email for user:", user.id);
    }

    // Generate JWT token (but user needs to verify email)
    const token = jwt.sign(
      { userId: user.id, email: user.email, emailVerified: false },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_status: user.subscription_status,
        email_verified: user.email_verified,
      },
      token,
      message:
        "Registration successful. Please check your email to verify your account.",
      emailSent,
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(400).json({ error: "Registration failed" });
  }
});

// Verify email
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const { userId, valid } = await tokenService.verifyEmailToken(token);
    if (!valid) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification token" });
    }

    // Get updated user info
    const result = await pool.query(
      "SELECT id, email, name, role, subscription_status, email_verified FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    // Generate new JWT with verified status
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, emailVerified: true },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_status: user.subscription_status,
        email_verified: user.email_verified,
      },
      token: newToken,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(400).json({ error: "Email verification failed" });
  }
});

// Resend verification email
router.post("/resend-verification", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;

    // Check if already verified
    const userResult = await pool.query(
      "SELECT email_verified FROM users WHERE id = $1",
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userResult.rows[0].email_verified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Check if there's already a valid token
    const hasValidToken = await tokenService.hasValidEmailToken(userId);
    if (hasValidToken) {
      return res.status(400).json({
        error: "Verification email already sent. Please check your email.",
      });
    }

    // Create new verification token
    const verificationToken = await tokenService.createEmailVerificationToken(
      userId,
    );

    // Send verification email
    const emailSent = await emailService.sendEmailVerification(
      email,
      verificationToken,
    );

    res.json({
      message: "Verification email sent",
      emailSent,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(400).json({ error: "Failed to resend verification email" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, mfaCode, backupCode } = loginSchema.parse(
      req.body,
    );

    // Get user
    const result = await pool.query(
      "SELECT id, email, password_hash, name, role, subscription_status, email_verified, mfa_enabled FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(401).json({
        error: "Please verify your email before logging in",
        emailVerified: false,
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check MFA if enabled
    if (user.mfa_enabled) {
      if (!mfaCode && !backupCode) {
        return res.status(200).json({
          requiresMFA: true,
          message: "Please provide your MFA code or backup code",
        });
      }

      let mfaValid = false;
      if (mfaCode) {
        const mfaResult = await mfaService.verifyTOTP(user.id, mfaCode);
        mfaValid = mfaResult.isValid;
      } else if (backupCode) {
        const backupResult = await mfaService.verifyBackupCode(
          user.id,
          backupCode,
        );
        mfaValid = backupResult.isValid;
      }

      if (!mfaValid) {
        return res.status(401).json({ error: "Invalid MFA code" });
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, emailVerified: true },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_status: user.subscription_status,
        email_verified: user.email_verified,
        mfa_enabled: user.mfa_enabled,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(400).json({ error: "Login failed" });
  }
});

// Request password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = passwordResetRequestSchema.parse(req.body);

    // Check if user exists
    const result = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      // Don't reveal if user exists or not
      return res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const user = result.rows[0];

    // Create password reset token
    const resetToken = await tokenService.createPasswordResetToken(user.id);

    // Send password reset email
    const emailSent = await emailService.sendPasswordReset(email, resetToken);

    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
      emailSent,
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(400).json({ error: "Password reset request failed" });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = passwordResetSchema.parse(req.body);

    // Verify reset token
    const { userId, valid } = await tokenService.verifyPasswordResetToken(
      token,
    );
    if (!valid) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Validate new password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "Password does not meet requirements",
        details: passwordValidation.errors,
        score: passwordValidation.score,
      });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [passwordHash, userId],
    );

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(400).json({ error: "Password reset failed" });
  }
});

// Setup MFA
router.post("/setup-mfa", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;

    // Check if MFA is already enabled
    const isEnabled = await mfaService.isMFAEnabled(userId);
    if (isEnabled) {
      return res.status(400).json({ error: "MFA is already enabled" });
    }

    // Generate MFA secret
    const mfaSecret = await mfaService.generateMFASecret(userId, email);

    res.json({
      secret: mfaSecret.secret,
      qrCodeUrl: mfaSecret.qrCodeUrl,
      backupCodes: mfaSecret.backupCodes,
      message:
        "Scan the QR code with your authenticator app and enter the code to complete setup",
    });
  } catch (error) {
    console.error("MFA setup error:", error);
    res.status(400).json({ error: "MFA setup failed" });
  }
});

// Verify MFA setup
router.post("/verify-mfa-setup", authenticateToken, async (req, res) => {
  try {
    const { mfaCode } = mfaSetupSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify MFA code
    const mfaResult = await mfaService.verifyTOTP(userId, mfaCode);
    if (!mfaResult.isValid) {
      return res.status(400).json({ error: "Invalid MFA code" });
    }

    // Enable MFA for user
    await pool.query("UPDATE users SET mfa_enabled = TRUE WHERE id = $1", [
      userId,
    ]);

    res.json({ message: "MFA enabled successfully" });
  } catch (error) {
    console.error("MFA verification error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(400).json({ error: "MFA verification failed" });
  }
});

// Disable MFA
router.post("/disable-mfa", authenticateToken, async (req, res) => {
  try {
    const { mfaCode } = mfaSetupSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify MFA code before disabling
    const mfaResult = await mfaService.verifyTOTP(userId, mfaCode);
    if (!mfaResult.isValid) {
      return res.status(400).json({ error: "Invalid MFA code" });
    }

    // Disable MFA
    const disabled = await mfaService.disableMFA(userId);
    if (!disabled) {
      return res.status(400).json({ error: "Failed to disable MFA" });
    }

    await pool.query("UPDATE users SET mfa_enabled = FALSE WHERE id = $1", [
      userId,
    ]);

    res.json({ message: "MFA disabled successfully" });
  } catch (error) {
    console.error("MFA disable error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(400).json({ error: "MFA disable failed" });
  }
});

// Get backup codes
router.get("/backup-codes", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const backupCodes = await mfaService.getBackupCodes(userId);

    res.json({ backupCodes });
  } catch (error) {
    console.error("Get backup codes error:", error);
    res.status(400).json({ error: "Failed to get backup codes" });
  }
});

// Regenerate backup codes
router.post("/regenerate-backup-codes", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const backupCodes = await mfaService.regenerateBackupCodes(userId);

    res.json({ backupCodes, message: "Backup codes regenerated successfully" });
  } catch (error) {
    console.error("Regenerate backup codes error:", error);
    res.status(400).json({ error: "Failed to regenerate backup codes" });
  }
});

// Disable MFA
router.post("/disable-mfa", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Disable MFA in user record
    await pool.query("UPDATE users SET mfa_enabled = FALSE WHERE id = $1", [
      userId,
    ]);

    // Remove MFA data
    await pool.query("DELETE FROM user_mfa WHERE user_id = $1", [userId]);

    res.json({ message: "MFA disabled successfully" });
  } catch (error) {
    console.error("Disable MFA error:", error);
    res.status(400).json({ error: "Failed to disable MFA" });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get updated user info
    const result = await pool.query(
      "SELECT id, email, name, role, subscription_status, email_verified, mfa_enabled FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(400).json({ error: "Failed to get user info" });
  }
});

// Cleanup expired tokens (cron job endpoint)
router.post("/cleanup-tokens", async (req, res) => {
  try {
    await tokenService.cleanupExpiredTokens();
    res.json({ message: "Expired tokens cleaned up successfully" });
  } catch (error) {
    console.error("Token cleanup error:", error);
    res.status(500).json({ error: "Token cleanup failed" });
  }
});

export default router;
