import nodemailer from "nodemailer";
import { generateSecurePassword } from "../utils/passwordValidation";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  fromEmail?: string;
  fromName?: string;
}

interface BrandedEmailLayoutOptions {
  title: string;
  preheader?: string;
  headline?: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNotes?: string;
}

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Generates unified branded HTML emails with official MATUR.ai styling,
 * high-contrast accessible typography, and standard 2026 footer lockup.
 */
function renderBrandedEmail(options: BrandedEmailLayoutOptions): string {
  const ctaBlock = options.ctaText && options.ctaUrl ? `
    <div style="text-align: center; margin: 32px 0 20px 0;">
      <a href="${options.ctaUrl}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; letter-spacing: 0.01em; box-shadow: 0 1px 3px rgba(37,99,235,0.2);">
        ${options.ctaText}
      </a>
    </div>
  ` : "";

  const preheaderBlock = options.preheader ? `
    <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #ffffff;">
      ${options.preheader}
    </div>
  ` : "";

  const headlineBlock = options.headline ? `
    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.3;">
      ${options.headline}
    </h2>
  ` : "";

  const footerNotesBlock = options.footerNotes ? `
    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; line-height: 1.5;">
      ${options.footerNotes}
    </div>
  ` : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.title} - MATUR.ai</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 32px 16px;">
        ${preheaderBlock}
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);">
          <!-- Header Lockup -->
          <tr>
            <td style="background-color: #0b0f17; padding: 26px 32px; text-align: left; border-bottom: 2px solid #2563eb;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">MATUR<span style="color: #3b82f6;">.ai</span></span>
                    <div style="color: #94a3b8; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;">AI Governance & Compliance Readiness</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              ${headlineBlock}
              <div style="font-size: 15px; color: #334155; line-height: 1.6;">
                ${options.contentHtml}
              </div>
              ${ctaBlock}
              ${footerNotesBlock}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 6px 0; font-weight: 500;">MATUR.ai Enterprise AI Governance Platform</p>
              <p style="margin: 0 0 6px 0;">Questions? Contact us at <a href="mailto:hello@matur.ai" style="color: #2563eb; text-decoration: none;">hello@matur.ai</a></p>
              <p style="margin: 0; color: #cbd5e1;">© 2026 MATUR.ai. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      console.warn("[EmailService] GMAIL_USER or GMAIL_APP_PASSWORD missing in ENV variables.");
    }
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const fromEmail =
        options.fromEmail ||
        process.env.MAIL_FROM ||
        process.env.EMAIL_FROM ||
        process.env.GMAIL_USER ||
        "noreply@matur.ai";
      const fromName =
        options.fromName ||
        process.env.MAIL_FROM_NAME ||
        process.env.EMAIL_FROM_NAME ||
        "MATUR.ai";
      const replyTo =
        options.replyTo ||
        process.env.MAIL_REPLY_TO ||
        process.env.EMAIL_REPLY_TO ||
        "hello@matur.ai";

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Send email verification with OTP
   */
  async sendEmailVerification(
    email: string,
    otp: string,
  ): Promise<boolean> {
    const otpVerificationUrl = `${process.env.FRONTEND_URL}/auth/verify-otp?email=${encodeURIComponent(email)}`;

    const contentHtml = `
      <p>Thank you for signing up for MATUR.ai! To complete your registration and activate your workspace, please verify your email address.</p>
      
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center; border: 1px solid #e2e8f0;">
        <div style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Verification Code</div>
        <div style="font-size: 36px; font-weight: 800; color: #2563eb; letter-spacing: 6px; font-family: monospace;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #64748b; margin: 10px 0 0 0;">
          This verification code expires in 15 minutes.
        </p>
      </div>
    `;

    const footerNotes = `
      If the button does not work, copy and paste this link into your browser:<br>
      <a href="${otpVerificationUrl}" style="color: #2563eb; word-break: break-all;">${otpVerificationUrl}</a>
      <br><br>
      If you did not create an account on MATUR.ai, you can safely ignore this message.
    `;

    const html = renderBrandedEmail({
      title: "Verify Your Email",
      preheader: `Your MATUR.ai verification code is ${otp}`,
      headline: "Verify Your Email Address",
      contentHtml,
      ctaText: "Enter Verification Code",
      ctaUrl: otpVerificationUrl,
      footerNotes,
    });

    const text = `
Verify Your Email Address - MATUR.ai

Thank you for signing up for MATUR.ai! To complete your registration, please verify your email address.

Your verification code is: ${otp}
Or visit: ${otpVerificationUrl}

This verification code will expire in 15 minutes.
If you didn't create an account with MATUR.ai, you can safely ignore this email.

© 2026 MATUR.ai. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: "Verify Your Email - MATUR.ai",
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    const contentHtml = `
      <p>We received a request to reset your password for your MATUR.ai account. Click the button below to choose a new password.</p>
    `;

    const footerNotes = `
      This password reset link will expire in 1 hour.<br>
      If the button does not work, copy and paste this URL into your browser:<br>
      <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
      <br><br>
      If you did not request a password reset, please contact us immediately at <a href="mailto:hello@matur.ai" style="color: #2563eb;">hello@matur.ai</a>.
    `;

    const html = renderBrandedEmail({
      title: "Reset Your Password",
      preheader: "Reset instructions for your MATUR.ai account",
      headline: "Reset Your Password",
      contentHtml,
      ctaText: "Reset Password",
      ctaUrl: resetUrl,
      footerNotes,
    });

    const text = `
Reset Your Password - MATUR.ai

We received a request to reset your password for your MATUR.ai account.

Reset link: ${resetUrl}

This link will expire in 1 hour.
If you did not request a password reset, please contact hello@matur.ai.

© 2026 MATUR.ai. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: "Reset Your Password - MATUR.ai",
      html,
      text,
    });
  }

  /**
   * Send MFA setup email
   */
  async sendMFASetup(
    email: string,
    qrCodeUrl: string,
    secret: string,
  ): Promise<boolean> {
    const contentHtml = `
      <p>To enhance the security of your MATUR.ai account, two-factor authentication (2FA) is required.</p>
      
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a;">Scan with your authenticator app:</h3>
        <img src="${qrCodeUrl}" alt="2FA QR Code" style="max-width: 180px; height: auto; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px;">
        <p style="font-size: 13px; color: #64748b; margin: 12px 0 0 0;">
          <strong>Manual Secret Key:</strong> <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #0f172a;">${secret}</code>
        </p>
      </div>
      
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; font-size: 13px; color: #475569;">
        <strong>Quick Steps:</strong>
        <ol style="margin: 8px 0 0 0; padding-left: 20px;">
          <li>Open Google Authenticator, Authy, or Microsoft Authenticator.</li>
          <li>Scan the QR code or manually enter the secret key above.</li>
          <li>Enter the 6-digit confirmation code on MATUR.ai to complete enrollment.</li>
        </ol>
      </div>
    `;

    const html = renderBrandedEmail({
      title: "Set Up Two-Factor Authentication",
      preheader: "Two-factor authentication enrollment for MATUR.ai",
      headline: "Set Up Two-Factor Authentication (2FA)",
      contentHtml,
    });

    const text = `
Set Up Two-Factor Authentication - MATUR.ai

Two-factor authentication is required for your MATUR.ai account.

Manual Secret Key: ${secret}

1. Open your authenticator app (Google Authenticator, Authy, etc.).
2. Add a new account using the secret key above.
3. Enter the 6-digit code on the setup screen.

© 2026 MATUR.ai. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: "Set Up Two-Factor Authentication - MATUR.ai",
      html,
      text,
    });
  }

  /**
   * Send MFA code email
   */
  async sendMFACode(email: string, code: string): Promise<boolean> {
    const contentHtml = `
      <p>Use the following one-time code to complete your MATUR.ai authentication challenge:</p>
      
      <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <div style="font-size: 36px; font-weight: 800; color: #2563eb; letter-spacing: 6px; font-family: monospace;">
          ${code}
        </div>
      </div>
      
      <p style="font-size: 13px; color: #64748b;">
        This code expires in 5 minutes. If you did not initiate this login request, please reset your password and contact support.
      </p>
    `;

    const html = renderBrandedEmail({
      title: "Your 2FA Code",
      preheader: `Your MATUR.ai authentication code is ${code}`,
      headline: "Two-Factor Verification Code",
      contentHtml,
    });

    const text = `
Your 2FA Code - MATUR.ai

Use this code to complete your login:
${code}

This code will expire in 5 minutes.

© 2026 MATUR.ai. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: "Your 2FA Code - MATUR.ai",
      html,
      text,
    });
  }

  /**
   * Send project invitation email
   */
  async sendProjectInvitation(
    email: string,
    projectName: string,
    inviterName: string,
    inviteUrl: string,
  ): Promise<boolean> {
    const safeProjectName = escapeHtml(projectName);
    const safeInviterName = escapeHtml(inviterName);

    let normalizedInviteUrl = inviteUrl;
    try {
      const parsed = new URL(inviteUrl);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        normalizedInviteUrl = parsed.toString();
      }
    } catch {
      normalizedInviteUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}`;
    }

    const safeInviteUrlText = escapeHtml(normalizedInviteUrl);

    const contentHtml = `
      <p><strong>${safeInviterName}</strong> has invited you to collaborate on the project <strong>${safeProjectName}</strong> in MATUR.ai.</p>
      <p>As a team member, you will have read-only Viewer access to inspect AI system profiles, Compliance Readiness Controls (CRC), risk registers, and verification reports.</p>
    `;

    const footerNotes = `
      If the button above does not work, copy and paste this link into your browser:<br>
      <a href="${normalizedInviteUrl}" style="color: #2563eb; word-break: break-all;">${safeInviteUrlText}</a>
      <br><br>
      If you were not expecting this invitation, you can safely ignore this email.
    `;

    const html = renderBrandedEmail({
      title: "Project Invitation",
      preheader: `${safeInviterName} invited you to collaborate on ${safeProjectName}`,
      headline: "You're Invited to Collaborate",
      contentHtml,
      ctaText: "Accept Invitation",
      ctaUrl: normalizedInviteUrl,
      footerNotes,
    });

    const text = `
Project Invitation - MATUR.ai

${inviterName} has invited you to collaborate on the project "${projectName}" in MATUR.ai.

Accept invitation: ${normalizedInviteUrl}

© 2026 MATUR.ai. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: `You've been invited to collaborate on ${projectName} - MATUR.ai`,
      html,
      text,
    });
  }

  /**
   * Send notification to inviter when an invitation is accepted or declined
   */
  private async sendInvitationResponseNotification(
    inviterEmail: string,
    projectName: string,
    inviteeEmail: string,
    type: "accepted" | "declined",
  ): Promise<boolean> {
    const safeProjectName = escapeHtml(projectName);
    const safeInviteeEmail = escapeHtml(inviteeEmail);
    const title = type === "accepted" ? "Invitation Accepted" : "Invitation Declined";
    const statusText =
      type === "accepted"
        ? `<strong>${safeInviteeEmail}</strong> has accepted your invitation to join the project <strong>${safeProjectName}</strong>.`
        : `<strong>${safeInviteeEmail}</strong> has declined your invitation to join the project <strong>${safeProjectName}</strong>.`;

    const contentHtml = `
      <p>${statusText}</p>
      ${type === "accepted" ? "<p>They can now review assessments, risks, and reports for this project.</p>" : ""}
    `;

    const html = renderBrandedEmail({
      title,
      headline: title,
      contentHtml,
      ctaText: "Open Project Dashboard",
      ctaUrl: `${process.env.FRONTEND_URL}/dashboard`,
    });

    const text = `
${title}: ${projectName}

${type === "accepted" ? `${inviteeEmail} accepted your invitation to join ${projectName}.` : `${inviteeEmail} declined your invitation to join ${projectName}.`}

© 2026 MATUR.ai. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: inviterEmail,
      subject: `${title}: ${projectName} - MATUR.ai`,
      html,
      text,
    });
  }

  async sendInvitationAcceptedNotification(
    inviterEmail: string,
    projectName: string,
    inviteeEmail: string,
  ): Promise<boolean> {
    return this.sendInvitationResponseNotification(
      inviterEmail,
      projectName,
      inviteeEmail,
      "accepted",
    );
  }

  async sendInvitationDeclinedNotification(
    inviterEmail: string,
    projectName: string,
    inviteeEmail: string,
  ): Promise<boolean> {
    return this.sendInvitationResponseNotification(
      inviterEmail,
      projectName,
      inviteeEmail,
      "declined",
    );
  }

  /**
   * Send premium follow-up email to free users who chose AIMA path
   */
  async sendPremiumFollowUpEmail(
    email: string,
    userName: string,
  ): Promise<boolean> {
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    const safeName = escapeHtml(userName || "there");

    const contentHtml = `
      <p>Hi ${safeName},</p>
      <p>You recently started your AI Maturity Assessment (AIMA), which is a great first step! But MATUR.ai offers a complete AI Governance and Audit Readiness suite to take you all the way to compliance:</p>
      
      <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2563eb;">
        <strong style="color: #0f172a; font-size: 14px;">Compliance Readiness Controls (CRC)</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">138 operational controls mapped directly to EU AI Act, NIST AI RMF, and ISO/IEC 42001 with audit evidence management.</p>
      </div>

      <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6;">
        <strong style="color: #0f172a; font-size: 14px;">Living Risk Register & Component Inventory</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">Central asset inventory and automatic risk generation derived from control responses and model criticality.</p>
      </div>

      <div style="background-color: #f8fafc; padding: 18px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #60a5fa;">
        <strong style="color: #0f172a; font-size: 14px;">Automated Vulnerability & Bias Audits</strong>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">Automated OWASP LLM Top 10 security scanning and dataset demographic parity testing.</p>
      </div>
    `;

    const html = renderBrandedEmail({
      title: "Unlock the Full Potential of MATUR.ai",
      preheader: "Discover comprehensive AI compliance and risk controls",
      headline: "Take Your AI Governance Beyond Baseline Assessment",
      contentHtml,
      ctaText: "Upgrade to Bloom Plan ($100/mo)",
      ctaUrl: dashboardUrl,
      footerNotes: "Upgrade anytime directly from your Project Settings or Compare Plans modal.",
    });

    const text = `
Unlock the Full Potential of MATUR.ai

Hi ${userName || "there"},

You started your AI Maturity Assessment (AIMA) on MATUR.ai.
Upgrade to BLOOM ($100/mo) for:
- 138 CRC Controls mapped to EU AI Act, NIST AI RMF, ISO 42001
- Living Risk Register & Component Inventory
- Automated Vulnerability & Bias Testing
- Executive Audit Reports & PDF Exports

Visit your dashboard: ${dashboardUrl}

© 2026 MATUR.ai. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: "You're only seeing part of MATUR.ai — unlock the full platform",
      html,
      text,
    });
  }

  /**
   * Send welcome email after email verification
   */
  async sendWelcomeEmail(
    email: string,
    userName?: string,
  ): Promise<boolean> {
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;
    const safeName = escapeHtml(userName || "there");

    const contentHtml = `
      <p>Welcome, <strong>${safeName}</strong>!</p>
      <p>Your email has been verified and your MATUR.ai workspace is active. You now have access to industry-leading AI governance, risk assessment, and regulatory compliance tools tailored for the EU AI Act, NIST AI RMF, and ISO/IEC 42001.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="color: #0f172a; margin-top: 0; font-size: 14px; font-weight: 700;">Recommended First Steps:</h3>
        <ul style="padding-left: 20px; color: #475569; margin-bottom: 0; font-size: 13px;">
          <li style="margin-bottom: 8px;"><strong>Create your first project:</strong> Scope your AI model or organizational deployment.</li>
          <li style="margin-bottom: 8px;"><strong>Complete the AI System Profile:</strong> Automatically classify risk tiers under EU AI Act Article 5 / Annex III.</li>
          <li style="margin-bottom: 8px;"><strong>Track Readiness Controls:</strong> Manage compliance evidence across 8 operational domains.</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #64748b;">
        Need assistance along the way? Ask <strong>Mira</strong>, your contextual AI Copilot, directly inside your project dashboard.
      </p>
    `;

    const html = renderBrandedEmail({
      title: "Welcome to MATUR.ai",
      preheader: "Your AI Governance and Compliance workspace is ready",
      headline: "Welcome to MATUR.ai",
      contentHtml,
      ctaText: "Open Your Dashboard",
      ctaUrl: dashboardUrl,
    });

    const text = `
Welcome to MATUR.ai, ${userName || "there"}!

Your email has been verified and your workspace is ready. You now have access to industry-leading AI governance, risk assessment, and compliance tools tailored for the EU AI Act, NIST AI RMF, and ISO/IEC 42001.

Quick-Start Steps:
- Create your first project to scope your AI system.
- Complete the AI System Profile for automatic regulatory classification.
- Track Compliance Readiness Controls (CRC) and generate audit-ready documentation.

Open your dashboard: ${dashboardUrl}

© 2026 MATUR.ai. All rights reserved.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: "Welcome to MATUR.ai - AI Governance Platform",
      html,
      text,
    });
  }

  /**
   * Send signup confirmation email
   */
  async sendSignupConfirmation(
    email: string,
    userName?: string,
  ): Promise<boolean> {
    return this.sendWelcomeEmail(email, userName);
  }
}

export const emailService = new EmailService();
