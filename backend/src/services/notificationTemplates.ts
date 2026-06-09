import jwt from "jsonwebtoken";

export interface WeeklyDigestData {
  projectName: string;
  readinessPercentage: number;
  changesCount: number;
  quickWins: Array<{ controlCode: string; title: string }>;
  riskSummary: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
  dashboardUrl: string;
}

export interface CriticalRiskData {
  projectName: string;
  riskCode: string;
  riskTitle: string;
  rating: string;
  description: string;
  mitigationPlan: string;
  projectUrl: string;
}

export interface VendorReassessmentData {
  projectName: string;
  vendorName: string;
  assessmentUrl: string;
}

/**
 * Generate a secure, one-click unsubscribe token for a user and notification type
 */
export function generateUnsubscribeToken(userId: string, notificationType: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is missing. Cannot call jwt.sign for unsubscribe token.");
  }
  return jwt.sign(
    { userId, notificationType },
    secret,
    { expiresIn: "365d" } // long-lived
  );
}

/**
 * Safe origin validator and normalizer
 */
function getSafeOrigin(urlStr: string, fallback: string): string {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
  } catch (e) {
    // Ignore error and use fallback
  }
  return fallback;
}

/**
 * Build unsubscribe, preferences, and privacy policy URLs
 */
function getFooterUrls(userId: string, type: string) {
  const token = generateUnsubscribeToken(userId, type);
  const rawBackend = process.env.BACKEND_URL || "http://localhost:4000";
  const rawFrontend = process.env.FRONTEND_URL || "http://localhost:3000";
  
  const backendUrl = getSafeOrigin(rawBackend, "http://localhost:4000");
  const frontendUrl = getSafeOrigin(rawFrontend, "http://localhost:3000");
  
  return {
    unsubscribeUrl: `${backendUrl}/notifications/unsubscribe/${encodeURIComponent(token)}`,
    preferencesUrl: `${frontendUrl}/settings?tab=notifications`,
    privacyUrl: `${frontendUrl}/privacy`,
  };
}

/**
 * Helper to escape HTML characters
 */
function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildWeeklyDigestEmail(
  userId: string,
  data: WeeklyDigestData
): { html: string; text: string } {
  const { unsubscribeUrl, preferencesUrl, privacyUrl } = getFooterUrls(userId, "weekly_digest");
  const safeProjectName = escapeHtml(data.projectName);
  const readiness = Math.round(data.readinessPercentage);
  const changes = data.changesCount;
  
  // Format quick wins list
  let quickWinsHtml = "";
  let quickWinsText = "";
  if (data.quickWins && data.quickWins.length > 0) {
    quickWinsHtml = '<ul style="margin: 0; padding-left: 20px; color: #4a5568;">';
    data.quickWins.forEach(win => {
      const code = escapeHtml(win.controlCode);
      const title = escapeHtml(win.title);
      quickWinsHtml += `<li style="margin-bottom: 8px;"><strong>${code}</strong>: ${title}</li>`;
      quickWinsText += `- [${code}] ${title}\n`;
    });
    quickWinsHtml += "</ul>";
  } else {
    quickWinsHtml = '<p style="color: #718096; margin: 0; font-style: italic;">No quick wins identified for this period.</p>';
    quickWinsText = "No quick wins identified for this period.\n";
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Progress Digest - MATUR.ai</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fafc;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">MATUR.ai</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 15px;">Weekly Progress Digest</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1a202c; margin-top: 0; font-size: 20px; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
            Project: ${safeProjectName}
          </h2>
          
          <p style="font-size: 15px; color: #4a5568;">
            Here is your weekly summary of compliance activity and risk posture.
          </p>
          
          <!-- Key Metrics -->
          <div style="display: flex; flex-direction: row; margin: 24px 0; gap: 15px;">
            <div style="flex: 1; background: #ebf8ff; border: 1px solid #bee3f8; border-radius: 8px; padding: 15px; text-align: center;">
              <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #2b6cb0; letter-spacing: 0.5px;">Readiness Score</span>
              <span style="display: block; font-size: 32px; font-weight: 700; color: #2b6cb0; margin-top: 5px;">${readiness}%</span>
            </div>
            <div style="flex: 1; background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; padding: 15px; text-align: center;">
              <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #22543d; letter-spacing: 0.5px;">Activity This Week</span>
              <span style="display: block; font-size: 32px; font-weight: 700; color: #22543d; margin-top: 5px;">+${changes}</span>
            </div>
          </div>
          
          <!-- Risk Breakdown -->
          <div style="background: #fffaf0; border: 1px solid #feebc8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #dd6b20; margin-top: 0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px;">Current Risk Summary</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #4a5568;">🔴 Critical Risks</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #e53e3e;">${data.riskSummary.Critical}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #4a5568;">🟠 High Risks</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #dd6b20;">${data.riskSummary.High}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #4a5568;">🟡 Medium Risks</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #d69e2e;">${data.riskSummary.Medium}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #4a5568;">🟢 Low Risks</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #38a169;">${data.riskSummary.Low}</td>
              </tr>
            </table>
          </div>

          <!-- Quick Wins -->
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #4a5568; margin-top: 0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Quick Wins (Recommended Controls)</h3>
            <p style="font-size: 13px; color: #718096; margin-top: -5px; margin-bottom: 12px;">Implement these controls next to maximize your compliance score:</p>
            ${quickWinsHtml}
          </div>
          
          <!-- CTA -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 14px 28px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: 600; 
                      font-size: 15px;
                      box-shadow: 0 4px 6px rgba(118, 75, 162, 0.25);
                      display: inline-block;">
              Open Project Dashboard
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #a0aec0; line-height: 1.8;">
          <p style="margin: 0;">This email was sent to you as the project owner of <strong>${safeProjectName}</strong>.</p>
          <p style="margin: 5px 0 0 0;">
            <a href="${unsubscribeUrl}" style="color: #4a5568; text-decoration: underline;">One-click Unsubscribe</a>
            &nbsp;•&nbsp;
            <a href="${preferencesUrl}" style="color: #4a5568; text-decoration: underline;">Manage Preferences</a>
            &nbsp;•&nbsp;
            <a href="${privacyUrl}" style="color: #4a5568; text-decoration: underline;">Privacy Policy</a>
          </p>
          <p style="margin: 15px 0 0 0;">© 2026 MATUR.ai. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
MATUR.ai - Weekly Progress Digest

Project: ${data.projectName}

Here is your weekly summary of compliance activity and risk posture.

Readiness Score: ${readiness}%
Activity This Week: +${changes}

Current Risk Summary:
- Critical Risks: ${data.riskSummary.Critical}
- High Risks: ${data.riskSummary.High}
- Medium Risks: ${data.riskSummary.Medium}
- Low Risks: ${data.riskSummary.Low}

Quick Wins (Recommended Controls):
${quickWinsText}
Open Project Dashboard: ${data.dashboardUrl}

---
Manage preferences: ${preferencesUrl}
One-click unsubscribe: ${unsubscribeUrl}
Privacy policy: ${privacyUrl}
© 2026 MATUR.ai. All rights reserved.
`;

  return { html, text };
}

export function buildCriticalAlertEmail(
  userId: string,
  data: CriticalRiskData
): { html: string; text: string } {
  const { unsubscribeUrl, preferencesUrl, privacyUrl } = getFooterUrls(userId, "critical_alerts");
  const safeProjectName = escapeHtml(data.projectName);
  const safeRiskCode = escapeHtml(data.riskCode);
  const safeRiskTitle = escapeHtml(data.riskTitle);
  const rating = escapeHtml(data.rating);
  const safeDesc = escapeHtml(data.description);
  const safeMitigation = escapeHtml(data.mitigationPlan);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CRITICAL RISK ALERT - MATUR.ai</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fafc;">
        <div style="background: #e53e3e; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">CRITICAL RISK ALERT</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">Action Required on MATUR.ai</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-left: 4px solid #e53e3e; border-right: 4px solid #e53e3e;">
          <h2 style="color: #1a202c; margin-top: 0; font-size: 18px; font-weight: 600; margin-bottom: 8px;">
            Project: ${safeProjectName}
          </h2>
          <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <span style="display: inline-block; background-color: #e53e3e; color: white; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 10px;">
              ${rating}
            </span>
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #9b2c2c;">
              [${safeRiskCode}] ${safeRiskTitle}
            </h3>
            <p style="margin: 0; font-size: 14px; color: #742a2a; line-height: 1.5;">
              ${safeDesc || "No description provided."}
            </p>
          </div>
          
          <h3 style="color: #2d3748; font-size: 15px; font-weight: 600; margin-top: 24px; margin-bottom: 10px;">
            Recommended Mitigation Plan:
          </h3>
          <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; font-size: 14px; color: #4a5568; margin-bottom: 30px; white-space: pre-wrap;">${safeMitigation || "No mitigation plan defined yet. Please configure a response immediately."}</div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.projectUrl}" 
               style="background: #e53e3e; 
                      color: white; 
                      padding: 14px 28px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: 600; 
                      font-size: 15px;
                      box-shadow: 0 4px 6px rgba(229, 62, 62, 0.25);
                      display: inline-block;">
              Review Risk Mitigation
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #a0aec0; line-height: 1.8;">
          <p style="margin: 0;">This email was sent to you as the project owner of <strong>${safeProjectName}</strong>.</p>
          <p style="margin: 5px 0 0 0;">
            <a href="${unsubscribeUrl}" style="color: #4a5568; text-decoration: underline;">One-click Unsubscribe</a>
            &nbsp;•&nbsp;
            <a href="${preferencesUrl}" style="color: #4a5568; text-decoration: underline;">Manage Preferences</a>
            &nbsp;•&nbsp;
            <a href="${privacyUrl}" style="color: #4a5568; text-decoration: underline;">Privacy Policy</a>
          </p>
          <p style="margin: 15px 0 0 0;">© 2026 MATUR.ai. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
CRITICAL RISK ALERT - ACTION REQUIRED

Project: ${data.projectName}
Severity: ${rating}

Risk: [${data.riskCode}] ${data.riskTitle}
Description: ${data.description || "No description provided."}

Recommended Mitigation Plan:
${data.mitigationPlan || "No mitigation plan defined yet. Please configure a response immediately."}

Review Risk Mitigation: ${data.projectUrl}

---
Manage preferences: ${preferencesUrl}
One-click unsubscribe: ${unsubscribeUrl}
Privacy policy: ${privacyUrl}
© 2026 MATUR.ai. All rights reserved.
`;

  return { html, text };
}

export function buildVendorReassessmentEmail(
  userId: string,
  data: VendorReassessmentData
): { html: string; text: string } {
  const { unsubscribeUrl, preferencesUrl, privacyUrl } = getFooterUrls(userId, "vendor_reassessment");
  const safeProjectName = escapeHtml(data.projectName);
  const safeVendorName = escapeHtml(data.vendorName);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Annual Vendor Reassessment Reminder - MATUR.ai</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #2d3748; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7fafc;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">MATUR.ai</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 15px;">Vendor Reassessment Reminder</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1a202c; margin-top: 0; font-size: 18px; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
            Reassessment Due: ${safeVendorName}
          </h2>
          
          <p style="font-size: 15px; color: #4a5568;">
            A vendor risk assessment for <strong>${safeVendorName}</strong> in project <strong>${safeProjectName}</strong> was completed over 12 months ago.
          </p>
          
          <div style="background: #ebf8ff; border-left: 4px solid #3182ce; padding: 15px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #2b6cb0;">
            <strong>Compliance Tip:</strong> Continuous vendor monitoring is a core requirement of ISO 42001 (A.9 Vendor Relationships) and NIST AI RMF. Running an annual reassessment ensures the vendor's controls still align with your risk threshold.
          </div>
          
          <p style="font-size: 15px; color: #4a5568;">
            Please re-run or review the assessment to keep your maturity assessment current and compliant.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.assessmentUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 14px 28px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: 600; 
                      font-size: 15px;
                      box-shadow: 0 4px 6px rgba(118, 75, 162, 0.25);
                      display: inline-block;">
              Start Reassessment
            </a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #a0aec0; line-height: 1.8;">
          <p style="margin: 0;">This email was sent to you as the project owner of <strong>${safeProjectName}</strong>.</p>
          <p style="margin: 5px 0 0 0;">
            <a href="${unsubscribeUrl}" style="color: #4a5568; text-decoration: underline;">One-click Unsubscribe</a>
            &nbsp;•&nbsp;
            <a href="${preferencesUrl}" style="color: #4a5568; text-decoration: underline;">Manage Preferences</a>
            &nbsp;•&nbsp;
            <a href="${privacyUrl}" style="color: #4a5568; text-decoration: underline;">Privacy Policy</a>
          </p>
          <p style="margin: 15px 0 0 0;">© 2026 MATUR.ai. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
MATUR.ai - Vendor Reassessment Reminder

Reassessment Due: ${data.vendorName}
Project: ${data.projectName}

A vendor risk assessment for ${data.vendorName} was completed over 12 months ago.

Compliance Tip: Continuous vendor monitoring is a core requirement of ISO 42001 (A.9 Vendor Relationships) and NIST AI RMF. Running an annual reassessment ensures the vendor's controls still align with your risk threshold.

Start Reassessment: ${data.assessmentUrl}

---
Manage preferences: ${preferencesUrl}
One-click unsubscribe: ${unsubscribeUrl}
Privacy policy: ${privacyUrl}
© 2026 MATUR.ai. All rights reserved.
`;

  return { html, text };
}
