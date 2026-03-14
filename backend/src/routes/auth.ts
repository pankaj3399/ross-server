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
import {
  acceptInvitation,
  findInvitationByToken,
} from "../services/projectInvitationService";
import { addMember } from "../services/projectMembershipService";
import { recordEvent } from "../services/auditLogService";

const router = Router();

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  name: z.string().min(1, "Name is required").max(50, "Name is too long").regex(/^[^0-9]*$/, "Name should not contain numbers"),
  lastName: z.string().max(50, "Last name is too long").regex(/^[^0-9]*$/, "Last name should not contain numbers").optional(),
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(1, "New password is required"),
});

const mfaSetupSchema = z.object({
  mfaCode: z.string().min(6, "MFA code must be 6 digits"),
});

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long").regex(/^[^0-9]*$/, "Name should not contain numbers").optional(),
  lastName: z.string().max(50, "Last name is too long").regex(/^[^0-9]*$/, "Last name should not contain numbers").optional(),
  email: z.string().email("Invalid email format").optional(),
}).refine((data) => data.name !== undefined || data.email !== undefined || data.lastName !== undefined, {
  message: "At least one field (name, last name or email) must be provided",
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, organization } = registerSchema.parse(
      req.body,
    );

    // Check if user already exists and handle unverified accounts atomically
    // DELETE returns the deleted row if the condition matches (email exists AND not verified)
    const deletedUser = await pool.query(
      "DELETE FROM users WHERE email = $1 AND email_verified = FALSE RETURNING id",
      [email]
    );

    // If we didn't delete a user, check if a verified user exists
    if (deletedUser.rows.length === 0) {
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }
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
      "INSERT INTO users (email, password_hash, name, last_name, organization, email_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, last_name, role, subscription_status, email_verified",
      [email, passwordHash, name, req.body.lastName || null, organization || null, false],
    );

    const user = result.rows[0];

    // Create email verification OTP
    const otp = await tokenService.createEmailVerificationOTP(user.id);

    // Send verification email with OTP
    const emailSent = await emailService.sendEmailVerification(
      email,
      otp,
    );
    if (!emailSent) {
      console.error("Failed to send verification email for user:", user.id);
    }

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.last_name,
        role: user.role,
        subscription_status: user.subscription_status,
        email_verified: user.email_verified,
      },
      message:
        "Registration successful. Please check your email for the verification code.",
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

// Verify email with OTP
router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const result = await tokenService.verifyEmailOTP(email, otp);

    if (!result.valid) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Get updated user info
    const userResult = await pool.query(
      "SELECT id, email, name, role, subscription_status, email_verified FROM users WHERE id = $1",
      [result.userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Generate new JWT token with verified email
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
        lastName: user.last_name,
        role: user.role,
        subscription_status: user.subscription_status,
        email_verified: user.email_verified,
      },
      token,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ error: "Email verification failed" });
  }
});

// Resend verification email/OTP
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const userResult = await pool.query(
      "SELECT id, email, email_verified FROM users WHERE email = $1",
      [email],
    );

    // Always return success message to prevent email enumeration
    const successResponse = {
      message: "If an account with that email exists, a verification email has been sent.",
      emailSent: false, // You might want to remove this field or always set it to true/false depending on API contract, but for security it's best not to expose it. 
      // However, to match previous behavior's shape but be secure:
      // We will just return the message. 
      // If the consumer expects 'emailSent', we can include it but it shouldn't reveal truth.
      // But purely for this refactor, let's stick to the secure message.
    };

    if (userResult.rows.length === 0) {
      return res.json(successResponse);
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.json(successResponse);
    }

    // Check for rate limiting (30 seconds)
    const canResend = await tokenService.canResendEmailOTP(user.id);
    if (!canResend) {
      // Even for rate limit, we should ideally not reveal it IF it reveals user existence.
      // But usually rate limits are fine to expose if we are careful. 
      // HOWEVER, the requirement is "never expose those outcomes".
      // So checking rate limit and failing silently or returning same success message is better.
      // We will log it and return success message.
      console.log(`Rate limit hit for user ${user.id}`);
      return res.json(successResponse);
    }

    // Create new OTP
    const otp = await tokenService.createEmailVerificationOTP(user.id);

    // Send verification email
    const emailSent = await emailService.sendEmailVerification(
      user.email,
      otp,
    );

    if (!emailSent) {
      // Log error but still return success to user to prevent enumeration
      console.error(`Failed to send verification email for user ${user.id}`);
      return res.json(successResponse);
    }

    // Actual success
    res.json(successResponse);
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
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
      "SELECT id, email, password_hash, name, last_name, role, subscription_status, email_verified, mfa_enabled FROM users WHERE email = $1",
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
        lastName: user.last_name,
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
    res.status(401).json({ error: "Login failed" });
  }
});

// Request password reset
router.post("/forgot-password", authenticateToken, async (req, res) => {
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
    res.status(500).json({ error: "Password reset request failed" });
  }
});

// Reset password
router.post("/reset-password", authenticateToken, async (req, res) => {
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
    res.status(500).json({ error: "Password reset failed" });
  }
});

// Change password (for authenticated users)
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    // Get user's current password hash
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user!.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: "New password does not meet requirements",
        details: passwordValidation.errors,
        score: passwordValidation.score,
      });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [passwordHash, req.user!.id],
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Update profile (name and/or email)
router.put("/update-profile", authenticateToken, async (req, res) => {
  try {
    const { name, lastName, email } = updateProfileSchema.parse(req.body);
    const userId = req.user!.id;

    // Get current user data (widen SELECT to include all fields needed for response)
    const currentUserResult = await pool.query(
      "SELECT id, email, name, last_name, role, subscription_status, email_verified, mfa_enabled FROM users WHERE id = $1",
      [userId],
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentUser = currentUserResult.rows[0];
    let emailChanged = false;

    // Check if email is being changed and if it's already taken
    if (email && email !== currentUser.email) {
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, userId],
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: "Email is already in use" });
      }

      emailChanged = true;
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined && name !== currentUser.name) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (lastName !== undefined && lastName !== currentUser.last_name) {
      updates.push(`last_name = $${paramIndex}`);
      values.push(lastName);
      paramIndex++;
    }

    if (email !== undefined && email !== currentUser.email) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
      // Reset email verification if email changed
      updates.push(`email_verified = FALSE`);
    }

    if (updates.length === 0) {
      // Reuse the initial query result instead of querying again
      return res.status(200).json({ 
        message: "Profile is already up to date",
        user: currentUser
      });
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Execute update
    values.push(userId);
    const updateQuery = `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING id, email, name, last_name, role, subscription_status, email_verified, mfa_enabled`;

    const result = await pool.query(updateQuery, values);

    const updatedUser = result.rows[0];
    const userResponse = {
      ...updatedUser,
      lastName: updatedUser.last_name
    };
    delete userResponse.last_name;

    // If email changed, send verification email
    if (emailChanged) {
      // Create email verification OTP
      const otp = await tokenService.createEmailVerificationOTP(userId);

      // Send verification email with OTP
      const emailSent = await emailService.sendEmailVerification(
        email!,
        otp,
      );
      if (!emailSent) {
        console.error("Failed to send verification email for user:", userId);
      }
    }

    res.json({
      user: userResponse,
      message: emailChanged
        ? "Profile updated successfully. Please verify your new email address."
        : "Profile updated successfully",
      emailVerificationSent: emailChanged,
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    // Handle PostgreSQL unique constraint violation (23505)
    if (error?.code === "23505") {
      // Optionally check if it's the email constraint
      const isEmailConstraint =
        error?.constraint?.toLowerCase().includes("email") ||
        error?.detail?.toLowerCase().includes("email");
      
      if (isEmailConstraint || !error?.constraint) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update profile" });
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
    res.status(500).json({ error: "MFA setup failed" });
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
    res.status(500).json({ error: "MFA verification failed" });
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
    res.status(500).json({ error: "MFA disable failed" });
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
    res.status(500).json({ error: "Failed to get backup codes" });
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
    res.status(500).json({ error: "Failed to disable MFA" });
  }
});

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Get updated user info
    const result = await pool.query(
      "SELECT id, email, name, last_name, role, subscription_status, email_verified, mfa_enabled, updated_at FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];
    res.json({ 
      user: {
        ...user,
        lastName: user.last_name
      } 
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user info" });
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

// --- Invitation acceptance flows ---

// Get pending invitations for the logged-in user
router.get("/invitations/me", authenticateToken, async (req, res) => {
  try {
    const user = req.user!;
    console.log(`[DEBUG] Fetching invitations for user ID: [${user.id}]`);
    
    // Find all pending invitations for this user's email
    const result = await pool.query(
      `SELECT i.*, p.name as project_name, u.name as inviter_name 
       FROM project_invitations i
       JOIN projects p ON i.project_id = p.id
       LEFT JOIN users u ON i.inviter_id = u.id
       WHERE TRIM(LOWER(i.email)) = TRIM(LOWER($1)) 
       AND i.status = 'pending'
       AND (i.expires_at IS NULL OR i.expires_at > CURRENT_TIMESTAMP)
       ORDER BY i.created_at DESC`,
      [user.email]
    );

    console.log(`[DEBUG] Found ${result.rows.length} pending invitations for user ID: ${user.id}`);

    // Format the response structure
    const invitations = result.rows.map(row => ({
      id: row.id,
      token: row.token,
      project: {
        id: row.project_id,
        name: row.project_name
      },
      inviter: row.inviter_id ? {
        id: row.inviter_id,
        name: row.inviter_name || "Someone"
      } : null,
      role: row.role,
      expires_at: row.expires_at,
      created_at: row.created_at
    }));

    res.json({ invitations });
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    res.status(500).json({ error: "Failed to fetch user invitations" });
  }
});

// Get invitation metadata by token
router.get("/invitations/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await findInvitationByToken(token);

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const projectResult = await pool.query(
      "SELECT id, name FROM projects WHERE id = $1",
      [invitation.project_id],
    );
    const project = projectResult.rows[0];

    const inviter =
      invitation.inviter_id &&
      (
        await pool.query(
          "SELECT id, name, email FROM users WHERE id = $1",
          [invitation.inviter_id],
        )
      ).rows[0];

    const existingUserResult = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [invitation.email],
    );

    res.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        project: project
          ? { id: project.id, name: project.name }
          : { id: invitation.project_id },
        inviter: inviter
          ? { id: inviter.id, name: inviter.name, email: inviter.email }
          : null,
        hasAccount: existingUserResult.rows.length > 0,
      },
    });
  } catch (error) {
    console.error("Error fetching invitation by token:", error);
    res.status(500).json({ error: "Failed to load invitation" });
  }
});

// Decline an invitation
router.post("/invitations/:token/decline", authenticateToken, async (req, res) => {
  try {
    const { token } = req.params;
    const user = req.user!;

    // Update status to revoked/declined atomically
    const { rows } = await pool.query(
      `UPDATE project_invitations 
       SET status = 'revoked', updated_at = CURRENT_TIMESTAMP 
       WHERE token = $1 
       AND TRIM(LOWER(email)) = TRIM(LOWER($2)) 
       AND status = 'pending'
       RETURNING *`,
      [token, user.email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Invitation not found or already processed" });
    }

    res.json({ message: "Invitation declined successfully" });
  } catch (error) {
    console.error("Error declining invitation:", error);
    res.status(500).json({ error: "Failed to decline invitation" });
  }
});

// Accept invitation as an already-logged-in user
router.post(
  "/invitations/:token/accept",
  authenticateToken,
  async (req, res) => {
    try {
      const { token } = req.params;
      const user = req.user!;

      const invitation = await findInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        return res.status(403).json({
          error:
            "This invitation was sent to a different email address. Please log in with the invited email.",
        });
      }

      const { invitation: acceptedInvitation, membership } =
        await acceptInvitation(token, user.id);

      await recordEvent({
        projectId: acceptedInvitation.project_id,
        actorId: user.id,
        action: "project.invitation.accepted",
        objectType: "MEMBERSHIP",
        objectId: membership.id,
        metadata: { email: acceptedInvitation.email },
      });

      res.json({
        message: "Invitation accepted",
        projectId: membership.project_id,
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(400).json({ error: "Failed to accept invitation" });
    }
  },
);

// Sign up via invitation token
router.post("/invitations/:token/signup", async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await findInvitationByToken(token);
    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    const { email } = invitation;
    const { password, name } = registerSchema
      .pick({ password: true, name: true })
      .parse(req.body);

    // Check if a verified user already exists for this email (case-insensitive)
    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email],
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        error:
          "An account with this email already exists. Please log in instead.",
      });
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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create user with default free subscription
      const result = await client.query(
        "INSERT INTO users (email, password_hash, name, email_verified) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, subscription_status, email_verified",
        [email, passwordHash, name, true],
      );

      const user = result.rows[0];

      // Attach to project via invitation within the same transaction
      const { invitation: acceptedInvitation, membership } =
        await acceptInvitation(token, user.id, client);

      await client.query("COMMIT");

      try {
        await recordEvent({
          projectId: acceptedInvitation.project_id,
          actorId: user.id,
          action: "project.invitation.accepted",
          objectType: "MEMBERSHIP",
          objectId: membership.id,
          metadata: { email: acceptedInvitation.email },
        });
      } catch (logError) {
        console.error("Failed to record audit log for invitation signup", {
          error: logError,
          projectId: acceptedInvitation.project_id,
          actorId: user.id,
          objectId: membership.id,
        });
      }

      // Generate JWT
      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email, emailVerified: true },
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
        token: jwtToken,
        projectId: membership.project_id,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Invitation signup error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: error.errors });
    }
    res.status(400).json({ error: "Registration via invitation failed" });
  }
});

export default router;
