import nodemailer from "nodemailer";
import { generateSecurePassword } from "../utils/passwordValidation";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"MATUR.ai" <${process.env.GMAIL_USER}>`,
        to: options.to,
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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - MATUR.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">MATUR.ai</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">AI Maturity Assessment Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            <p>Thank you for signing up for MATUR.ai! To complete your registration and start assessing your AI maturity, please verify your email address.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">Your Verification Code</h3>
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: monospace; margin: 15px 0;">
                ${otp}
              </div>
              <p style="font-size: 14px; color: #666; margin: 10px 0 0 0;">
                Enter this code on the verification page or click the button below
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${otpVerificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Verify with OTP
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${otpVerificationUrl}" style="color: #667eea; word-break: break-all;">${otpVerificationUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #666;">
              This verification code will expire in 15 minutes. If you didn't create an account with MATUR.ai, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© 2024 MATUR.ai. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Verify Your Email Address - MATUR.ai
      
      Thank you for signing up for MATUR.ai! To complete your registration, please verify your email address.
      
      Your verification code is: ${otp}
      
      Or visit: ${otpVerificationUrl}
      
      This verification code will expire in 15 minutes.
      
      If you didn't create an account with MATUR.ai, you can safely ignore this email.
      
      © 2024 MATUR.ai. All rights reserved.
    `;

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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - MATUR.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">MATUR.ai</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">AI Maturity Assessment Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            <p>We received a request to reset your password for your MATUR.ai account. Click the button below to create a new password.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #666;">
              This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© 2024 MATUR.ai. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Reset Your Password - MATUR.ai
      
      We received a request to reset your password. Click the link below to create a new password:
      
      ${resetUrl}
      
      This password reset link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
      
      © 2024 MATUR.ai. All rights reserved.
    `;

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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Set Up Two-Factor Authentication - MATUR.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">MATUR.ai</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">AI Maturity Assessment Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Set Up Two-Factor Authentication</h2>
            <p>To enhance the security of your MATUR.ai account, please set up two-factor authentication (2FA).</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin-top: 0;">Scan this QR code with your authenticator app:</h3>
              <img src="${qrCodeUrl}" alt="QR Code for 2FA Setup" style="max-width: 200px; height: auto; border: 1px solid #ddd; border-radius: 4px;">
              <p style="font-size: 14px; color: #666; margin: 10px 0 0 0;">
                <strong>Secret Key:</strong> ${secret}
              </p>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;">Instructions:</h4>
              <ol style="margin: 0; padding-left: 20px;">
                <li>Install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator</li>
                <li>Scan the QR code above or manually enter the secret key</li>
                <li>Enter the 6-digit code from your app to complete setup</li>
              </ol>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              This setup is required for enhanced security. If you have any questions, please contact our support team.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© 2024 MATUR.ai. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: "Set Up Two-Factor Authentication - MATUR.ai",
      html,
    });
  }

  /**
   * Send MFA code email
   */
  async sendMFACode(email: string, code: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your 2FA Code - MATUR.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">MATUR.ai</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">AI Maturity Assessment Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Your Two-Factor Authentication Code</h2>
            <p>Use this code to complete your login:</p>
            
            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: monospace;">
                ${code}
              </div>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              This code will expire in 5 minutes. If you didn't request this code, please secure your account immediately.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© 2024 MATUR.ai. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: "Your 2FA Code - MATUR.ai",
      html,
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

    // Validate and normalize the invite URL to prevent javascript: URIs or malformed values
    let normalizedInviteUrl: string;
    try {
      const parsed = new URL(inviteUrl);

      const isLocalhost =
        parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
      const allowInsecureLocal =
        process.env.NODE_ENV !== "production" ||
        process.env.ALLOW_INSECURE_URLS === "true";

      // Require a safe protocol and a valid hostname.
      // In non-production (or when ALLOW_INSECURE_URLS is true), allow http for localhost-style URLs.
      const isHttps = parsed.protocol === "https:";
      const isAllowedLocalHttp =
        parsed.protocol === "http:" && isLocalhost && allowInsecureLocal;

      if (!parsed.hostname || (!isHttps && !isAllowedLocalHttp)) {
        throw new Error("Unsafe invitation URL");
      }

      normalizedInviteUrl = parsed.toString();
    } catch {
      const fallbackBase =
        process.env.FRONTEND_URL || "https://app.matur.ai";
      try {
        const base = new URL(fallbackBase);

        // Best effort: if the original inviteUrl parses relative to the base,
        // preserve its path/query while anchoring to the trusted FRONTEND_URL host.
        try {
          const relative = new URL(inviteUrl, base);
          normalizedInviteUrl = new URL(
            relative.pathname + relative.search + relative.hash,
            base,
          ).toString();
        } catch {
          normalizedInviteUrl = base.toString();
        }
      } catch {
        normalizedInviteUrl = "https://app.matur.ai";
      }
    }

    const safeInviteUrlText = escapeHtml(normalizedInviteUrl);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You've been invited to a MATUR.ai project</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">MATUR.ai</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">AI Maturity Assessment Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Project Invitation</h2>
            <p><strong>${safeInviterName}</strong> has invited you to collaborate on the project <strong>${safeProjectName}</strong> in MATUR.ai.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${normalizedInviteUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        display: inline-block;">
                Accept invitation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${normalizedInviteUrl}" style="color: #667eea; word-break: break-all;">${safeInviteUrlText}</a>
            </p>
            
            <p style="font-size: 14px; color: #666;">
              If you were not expecting this invitation, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© 2024 MATUR.ai. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `You've been invited to a MATUR.ai project`,
      html,
    });
  }

  /**
   * Private helper to send invitation response notification (accepted/declined)
   */
  private async sendInvitationResponseNotification(
    inviterEmail: string,
    projectName: string,
    inviteeEmail: string,
    type: "accepted" | "declined",
  ): Promise<boolean> {
    const safeProjectName = escapeHtml(projectName);
    const safeInviteeEmail = escapeHtml(inviteeEmail);
    const title =
      type === "accepted" ? "Invitation Accepted" : "Invitation Declined";
    const statusText =
      type === "accepted"
        ? `Good news! <strong>${safeInviteeEmail}</strong> has accepted your invitation to join the project <strong>${safeProjectName}</strong>.`
        : `<strong>${safeInviteeEmail}</strong> has declined your invitation to join the project <strong>${safeProjectName}</strong>.`;
    const followUpText =
      type === "accepted"
        ? `<p>They can now collaborate with you on this project.</p>`
        : "";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title} - MATUR.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">MATUR.ai</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">${title}</h2>
            <p>${statusText}</p>
            ${followUpText}
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© 2024 MATUR.ai. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: inviterEmail,
      subject: `${title}: ${projectName}`,
      html,
    });
  }

  /**
   * Send notification to inviter when an invitation is accepted
   */
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

  /**
   * Send notification to inviter when an invitation is declined
   */
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

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unlock the Full Potential of MATUR.ai</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">MATUR.ai</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">AI Governance Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${safeName}, you're only seeing part of the picture 👀</h2>
            <p>You started your AI Maturity Assessment (AIMA), which is a great first step! But MATUR.ai offers much more than just assessment questions.</p>
            
            <p style="font-weight: bold; color: #333; margin-top: 20px;">Here's what you're missing:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">🛡️ Compliance Readiness Controls (CRC)</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Track your compliance across EU AI Act, NIST AI RMF, and ISO 42001 with actionable controls, evidence management, and a real-time readiness dashboard.</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #764ba2;">
              <h3 style="margin-top: 0; color: #764ba2;">🔍 AI Vulnerability Assessment</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Automated security scanning for your AI models — identify risks before they become problems.</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">⚖️ Automated Bias & Fairness Testing</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Test your AI systems for bias using manual prompts, API endpoints, or dataset uploads — with detailed reports and scoring.</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #764ba2;">
              <h3 style="margin-top: 0; color: #764ba2;">📊 Enhanced Reporting & Team Collaboration</h3>
              <p style="margin-bottom: 0; font-size: 14px;">Export detailed PDF/Excel reports, invite team members, and manage unlimited projects.</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 16px; font-weight: bold; color: #333;">Try everything free for 7 days — no credit card required.</p>
              <a href="${dashboardUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: bold; 
                        font-size: 16px;
                        display: inline-block;">
                Start Your 7-Day Free Trial
              </a>
            </div>
            
            <p style="font-size: 13px; color: #888; text-align: center;">
              AIMA is just the beginning. See what a complete AI governance platform can do for you.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© 2024 MATUR.ai. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = `
      Hi ${userName || "there"},

      You started your AI Maturity Assessment (AIMA) on MATUR.ai — great first step!

      But AIMA is just the beginning. Here's what you're missing:

      🛡️ Compliance Readiness Controls (CRC)
      Track compliance across EU AI Act, NIST AI RMF, and ISO 42001.

      🔍 AI Vulnerability Assessment  
      Automated security scanning for your AI models.

      ⚖️ Automated Bias & Fairness Testing
      Test for bias using prompts, API endpoints, or datasets.

      📊 Enhanced Reporting & Team Collaboration
      Export reports, invite team members, manage unlimited projects.

      Try everything free for 7 days — no credit card required.

      Start your trial: ${dashboardUrl}

      © 2024 MATUR.ai. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject: "You're only seeing part of MATUR.ai — unlock the full platform",
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
