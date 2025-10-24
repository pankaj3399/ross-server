import nodemailer from "nodemailer";
import { generateSecurePassword } from "../utils/passwordValidation";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
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
}

export const emailService = new EmailService();
