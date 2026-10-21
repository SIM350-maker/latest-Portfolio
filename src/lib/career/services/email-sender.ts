// Email Sending Service
// Provider abstraction with console (test), Resend, and extensible architecture

import { query } from "@/lib/db";
import { getApplicationPackage, updateApplicationPackage, type ApplicationPackage } from "@/lib/career/application-package";
import { getAttachment, type ApplicationAttachment } from "@/lib/career/attachment";
import { getGeneratedDocument, type GeneratedDocument } from "@/lib/career/generated-document";
import { getAutomationSettings } from "@/lib/career/automation-settings";
import { createDeliveryAttempt, getDeliveryAttemptByIdempotencyKey, updateDeliveryAttemptStatus, type EmailDeliveryAttempt, type DeliveryStatus, type EmailProvider } from "@/lib/career/email-delivery";
import crypto from "crypto";

export interface SendEmailOptions {
  packageId: number;
  provider?: EmailProvider;
  testMode?: boolean;
  force?: boolean; // bypass idempotency
}

export interface SendResult {
  success: boolean;
  attemptId?: number;
  providerMessageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Send application package email
 */
export async function sendApplicationPackage(options: SendEmailOptions): Promise<SendResult> {
  const { packageId, provider: requestedProvider, testMode = false, force = false } = options;

  const pkg = await getApplicationPackage(packageId);
  if (!pkg) return { success: false, error: 'Package not found' };

  // Check status
  if (pkg.status !== 'APPROVED') {
    return { success: false, error: `Package not approved (status: ${pkg.status})` };
  }

  // Get approval details
  const approval = pkg.approval_json || {};
  const recipientEmail = approval.recipient_email;
  const subject = approval.subject;
  const customMessage = approval.custom_message;

  if (!recipientEmail) {
    return { success: false, error: 'No recipient email configured' };
  }

  // Determine provider
  const settings = await getAutomationSettings(1); // TODO: get from package owner
  const actualProvider: EmailProvider = requestedProvider || (settings?.email_provider as EmailProvider) || 'console';

  // Check idempotency
  const idempotencyKey = `pkg-${packageId}-${recipientEmail}-${subject}`;
  if (!force) {
    const existing = await getDeliveryAttemptByIdempotencyKey(idempotencyKey);
    if (existing && (existing.status === 'SENT' || existing.status === 'DELIVERED' || existing.status === 'SIMULATED')) {
      return { success: false, error: 'Duplicate send prevented by idempotency', attemptId: existing.id };
    }
  }

  // Prepare email content
  const pkgDetails = await getPackageDetails(packageId);
  if (!pkgDetails) return { success: false, error: 'Package details not found' };

  const { cv, coverLetter, email: emailDoc, attachments, advert } = pkgDetails;
  const approvalJson = pkg.approval_json || {};

  // Build email body
  const emailBody = buildEmailBody(pkgDetails, approval);
  const emailSubject = approval.subject || `Application for ${advert?.extracted_json?.title || 'Position'}`;

  // Get attachment SHA256s
  const attachmentSha256s: string[] = [];
  const attachmentFiles: Array<{ filename: string; content: Buffer; mimeType: string }> = [];

  // Add document attachments
  for (const [doc, label] of [
    [pkgDetails.cv, 'CV'],
    [pkgDetails.coverLetter, 'Cover Letter'],
  ] as Array<[any, string]>) {
    if (doc?.pdf_bytes) {
      attachmentFiles.push({
        filename: `${label.replace(/\s+/g, '_')}.pdf`,
        content: doc.pdf_bytes,
        mimeType: 'application/pdf',
      });
      const sha256 = crypto.createHash('sha256').update(doc.pdf_bytes).digest('hex');
      attachmentSha256s.push(sha256);
    }
  }

  // Add custom attachments
  for (const att of pkgDetails.attachments) {
    if (att.file_bytes) {
      attachmentFiles.push({
        filename: att.filename,
        content: att.file_bytes,
        mimeType: att.mime_type,
      });
      attachmentSha256s.push(att.sha256);
    }
  }

  // Create delivery attempt record
  const attempt = await createDeliveryAttempt({
    package_id: packageId,
    provider: testMode ? 'console' : actualProvider,
    to_email: approval.recipient_email,
    cc_email: approval.cc_email || [],
    bcc_email: approval.bcc_email || [],
    subject: emailSubject,
    body_text: emailBody.text,
    body_html: emailBody.html,
    attachment_sha256s: attachmentSha256s,
    idempotency_key: idempotencyKey,
  });

  // Send via provider
  let result: SendResult;
  try {
    if (actualProvider === 'console' || testMode) {
      result = await sendViaConsole(attempt.id, approval.recipient_email, emailSubject, emailBody, attachmentFiles);
    } else if (actualProvider === 'resend') {
      result = await sendViaResend(attempt.id, approval.recipient_email, emailSubject, emailBody, attachmentFiles);
    } else {
      throw new Error(`Unsupported provider: ${actualProvider}`);
    }
  } catch (error) {
    await updateDeliveryAttemptStatus(attempt.id, 'FAILED', {
      error_code: 'SEND_ERROR',
      error_message: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }

  return result;
}

/**
 * Build email body from package details
 */
function buildEmailBody(pkgDetails: any, approval: any): { text: string; html: string } {
  const { cv, coverLetter, email: emailDoc, advert } = pkgDetails;
  const customMessage = approval.custom_message || '';

  // Use email document if available, otherwise build from template
  let bodyText = '';
  let bodyHtml = '';

  if (emailDoc?.content_json?.body) {
    bodyText = emailDoc.content_json.body;
  } else if (emailDoc?.content_json?.closing) {
    // Template-based
    const greeting = emailDoc.content_json.greeting || 'Dear Hiring Manager,';
    const closing = emailDoc.content_json.closing || 'Sincerely,\n[Name]';
    bodyText = `${greeting}\n\n${customMessage}\n\n${closing}`;
  } else {
    bodyText = `Dear Hiring Manager,\n\n${customMessage || 'Please find my application attached for your review.'}\n\nSincerely,\n[Your Name]`;
  }

  // HTML version
  bodyHtml = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      ${bodyText.split('\n').map(line => `<p>${line}</p>`).join('')}
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666;">
        This application was sent via Career Automation Centre.<br>
        Application ID: ${approval.package_id || 'N/A'}
      </p>
    </body>
    </html>
  `;

  return { text: bodyText, html: bodyHtml };
}

/**
 * Console provider - logs email and marks as simulated
 */
async function sendViaConsole(
  attemptId: number,
  to: string,
  subject: string,
  body: { text: string; html: string },
  attachments: Array<{ filename: string; content: Buffer; mimeType: string }>
): Promise<SendResult> {
  console.log('═══════════════════════════════════════');
  console.log('📧 EMAIL DELIVERY (CONSOLE MODE)');
  console.log('═══════════════════════════════════════');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Attachments: ${attachments.map(a => a.filename).join(', ') || 'None'}`);
  console.log('--- TEXT BODY ---');
  console.log(body.text);
  console.log('═══════════════════════════════════════');

  // Update attempt
  await updateDeliveryAttemptStatus(attemptId, 'SIMULATED', {
    sent_at: new Date().toISOString(),
    provider_message_id: `console-${Date.now()}`,
  });

  return { success: true, attemptId, simulated: true, providerMessageId: `console-${Date.now()}` };
}

/**
 * Resend provider - sends via Resend API
 */
async function sendViaResend(
  attemptId: number,
  to: string,
  subject: string,
  body: { text: string; html: string },
  attachments: Array<{ filename: string; content: Buffer; mimeType: string }>
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const from = process.env.EMAIL_FROM_ADDRESS || 'Career Automation <noreply@career-automation.local>';
  const fromName = process.env.EMAIL_FROM_NAME || 'Career Automation Centre';

  const formData = new FormData();
  formData.append('from', `${fromName} <${from}>`);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('text', body.text);
  formData.append('html', body.html);

  // Add attachments
  for (const att of attachments) {
    const uint8Array = new Uint8Array(att.content);
    const blob = new Blob([uint8Array], { type: att.mimeType });
    formData.append('attachments', blob, att.filename);
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${error}`);
  }

  const result = await response.json();

  await updateDeliveryAttemptStatus(attemptId, 'SENT', {
    provider_message_id: result.id,
    sent_at: new Date().toISOString(),
  });

  return { success: true, attemptId, providerMessageId: result.id };
}

/**
 * Get package details for sending
 */
async function getPackageDetails(packageId: number): Promise<{
  cv?: any;
  coverLetter?: any;
  email?: any;
  attachments: any[];
  advert?: any;
} | null> {
  // This would be imported from package-assembly
  // For now, inline implementation
  const { getApplicationPackage } = await import("@/lib/career/application-package");
  const { getApprovedGeneratedDocumentByApplication } = await import("@/lib/career/generated-document");
  const { getAttachment } = await import("@/lib/career/attachment");
  const { getJobAdvert } = await import("@/lib/career/job-advert");
  const { query } = await import("@/lib/db");

  const pkg = await getApplicationPackage(packageId);
  if (!pkg) return null;

  const [cv, coverLetter, emailDoc, attachments, application] = await Promise.all([
    pkg.cv_document_id ? getApprovedGeneratedDocumentByApplication(pkg.application_id, 'CV') : null,
    pkg.cover_letter_document_id ? getApprovedGeneratedDocumentByApplication(pkg.application_id, 'COVER_LETTER') : null,
    pkg.email_document_id ? getApprovedGeneratedDocumentByApplication(pkg.application_id, 'EMAIL') : null,
    Promise.all(pkg.attachment_ids.map(id => getAttachment(id))),
    query<{advert_id: number}>(`SELECT advert_id FROM job_application WHERE id = $1`, [pkg.application_id]),
  ]);

  let advert = null;
  if (application[0]?.advert_id) {
    const { getJobAdvert } = await import("@/lib/career/job-advert");
    advert = await getJobAdvert(application[0].advert_id);
  }

  return {
    cv: cv || undefined,
    coverLetter: pkg.cover_letter_document_id ? getApprovedGeneratedDocumentByApplication(pkg.application_id, 'COVER_LETTER') : undefined,
    email: pkg.email_document_id ? getApprovedGeneratedDocumentByApplication(pkg.application_id, 'EMAIL') : undefined,
    attachments: attachments.filter(Boolean),
    advert,
  };
}