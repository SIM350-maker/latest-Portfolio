// Application Package Assembly Service
// Combines approved documents into send-ready packages with validation

import { query } from "@/lib/db";
import {
  getApprovedGeneratedDocumentByApplication,
  getGeneratedDocumentsByApplication,
  type GeneratedDocument,
} from "../generated-document";
import { getApplicationPackage, createApplicationPackage, updateApplicationPackage, type ApplicationPackage } from "../application-package";
import { getAttachment, getAttachmentsByOwner, type ApplicationAttachment } from "../attachment";
import { getJobAdvert } from "../job-advert";
import { getJobRequirementsByAdvert } from "../job-requirement";
import { getAutomationSettings } from "../automation-settings";

export interface PackageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  attachmentsValid: boolean;
  recipientValid: boolean;
}

export interface PackageAssemblyInput {
  applicationId: number;
  cvDocumentId?: number;
  coverLetterDocumentId?: number;
  emailDocumentId?: number;
  attachmentIds?: number[];
  recipientEmail?: string;
  subject?: string;
  customMessage?: string;
}

/**
 * Assemble application package from approved documents
 */
export async function assembleApplicationPackage(input: PackageAssemblyInput): Promise<ApplicationPackage> {
  // Get approved documents if not specified
  let cvDocId = input.cvDocumentId;
  let clDocId = input.coverLetterDocumentId;
  let emailDocId = input.emailDocumentId;
  const attachmentIds = input.attachmentIds || [];

  if (!cvDocId) {
    const cv = await getApprovedGeneratedDocumentByApplication(input.applicationId, 'CV');
    if (cv) cvDocId = cv.id;
  }
  if (!clDocId) {
    const cl = await getApprovedGeneratedDocumentByApplication(input.applicationId, 'COVER_LETTER');
    if (cl) clDocId = cl.id;
  }
  if (!emailDocId) {
    const email = await getApprovedGeneratedDocumentByApplication(input.applicationId, 'EMAIL');
    if (email) emailDocId = email.id;
  }

  // Create package
  const pkg = await createApplicationPackage({
    application_id: input.applicationId,
    cv_document_id: cvDocId || null,
    cover_letter_document_id: clDocId || null,
    email_document_id: emailDocId || null,
    attachment_ids: attachmentIds,
    status: 'ASSEMBLING',
  });

  return pkg;
}

/**
 * Validate package before approval
 */
export async function validatePackage(packageId: number): Promise<PackageValidationResult> {
  const pkg = await getApplicationPackage(packageId);
  if (!pkg) return { valid: false, errors: ['Package not found'], warnings: [], missingRequired: [], attachmentsValid: false, recipientValid: false };

  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];

  // Check required documents
  if (!pkg.cv_document_id) {
    missingRequired.push('CV (required for all applications)');
  }
  if (!pkg.cover_letter_document_id) {
    warnings.push('Cover letter not included (recommended)');
  }
  if (!pkg.email_document_id) {
    warnings.push('Application email not included (recommended)');
  }

  // Check document statuses
  const docIds = [pkg.cv_document_id, pkg.cover_letter_document_id, pkg.email_document_id].filter(Boolean) as number[];
  for (const docId of docIds) {
    const doc = await query<{status: string, title: string}>(`SELECT status, title FROM generated_document WHERE id = $1`, [docId]);
    if (doc[0]?.status !== 'APPROVED') {
      errors.push(`Document "${doc[0]?.title || docId}" is not approved (status: ${doc[0]?.status})`);
    }
  }

  // Check attachments
  let attachmentsValid = true;
  for (const attId of pkg.attachment_ids) {
    const att = await query<{sha256: string, filename: string, mime_type: string}>(`SELECT sha256, filename, mime_type FROM application_attachment WHERE id = $1`, [attId]);
    if (att.length === 0) {
      errors.push(`Attachment ${attId} not found`);
      attachmentsValid = false;
    }
  }

  // Check recipient
  let recipientValid = true;
  if (!pkg.approval_json?.recipient_email) {
    warnings.push('No recipient email specified');
    recipientValid = false;
  } else {
    const email = pkg.approval_json.recipient_email;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Invalid recipient email format: ${email}`);
      recipientValid = false;
    }
  }

  // Check subject
  if (!pkg.approval_json?.subject) {
    warnings.push('No email subject specified');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
    attachmentsValid,
    recipientValid,
  };
}

/**
 * Prepare package for approval (set approval details)
 */
export async function preparePackageForApproval(
  packageId: number,
  approvalData: {
    recipient_email: string;
    subject: string;
    custom_message?: string;
    send_as_test?: boolean;
  }
): Promise<ApplicationPackage> {
  const pkg = await getApplicationPackage(packageId);
  if (!pkg) throw new Error('Package not found');

  // Update approval JSON
  const approvalJson = {
    ...pkg.approval_json,
    recipient_email: approvalData.recipient_email,
    subject: approvalData.subject,
    custom_message: approvalData.custom_message || '',
    prepared_at: new Date().toISOString(),
    send_as_test: approvalData.send_as_test || false,
  };

  const updated = await updateApplicationPackage(packageId, {
    approval_json: approvalJson,
    status: 'READY_FOR_REVIEW',
  });

  return updated!;
}

/**
 * Approve package for sending
 */
export async function approvePackage(packageId: number, approvedBy: number): Promise<ApplicationPackage> {
  const pkg = await getApplicationPackage(packageId);
  if (!pkg) throw new Error('Package not found');

  // Validate first
  const validation = await validatePackage(packageId);
  if (!validation.valid) {
    throw new Error(`Package validation failed: ${validation.errors.join('; ')}`);
  }

  const updated = await updateApplicationPackage(packageId, {
    status: 'APPROVED',
    approval_json: {
      ...pkg.approval_json,
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
    },
    approved_at: new Date().toISOString(),
    approved_by: approvedBy,
  });

  return updated!;
}

/**
 * Get package details with all related documents
 */
export async function getPackageDetails(packageId: number): Promise<{
  package: ApplicationPackage;
  cv?: GeneratedDocument;
  coverLetter?: GeneratedDocument;
  email?: GeneratedDocument;
  attachments: ApplicationAttachment[];
  advert?: any;
  requirements?: any[];
} | null> {
  const pkg = await getApplicationPackage(packageId);
  if (!pkg) return null;

  const appQuery = pkg.application_id ? await query<{advert_id: number}>(`SELECT advert_id FROM job_application WHERE id = $1`, [pkg.application_id]) : [];
const advertId = appQuery[0]?.advert_id;

  const [cv, coverLetter, email, attachments, advert, requirements] = await Promise.all([
    pkg.cv_document_id ? getApprovedGeneratedDocumentByApplication(pkg.application_id, 'CV') : null,
    pkg.cover_letter_document_id ? getApprovedGeneratedDocumentByApplication(pkg.application_id, 'COVER_LETTER') : null,
    pkg.email_document_id ? getApprovedGeneratedDocumentByApplication(pkg.application_id, 'EMAIL') : null,
    Promise.all(pkg.attachment_ids.map(id => getAttachment(id))),
    advertId ? getJobAdvert(advertId) : null,
    advertId ? getJobRequirementsByAdvert(advertId) : [],
  ]);

  return {
    package: pkg,
    cv: cv || undefined,
    coverLetter: coverLetter || undefined,
    email: email || undefined,
    attachments: attachments.filter(Boolean) as ApplicationAttachment[],
    advert,
    requirements,
  };
}

/**
 * Check if package is ready to send
 */
export async function isPackageReadyToSend(packageId: number): Promise<{ ready: boolean; reason?: string }> {
  const pkg = await getApplicationPackage(packageId);
  if (!pkg) return { ready: false, reason: 'Package not found' };

  if (pkg.status !== 'APPROVED') {
    return { ready: false, reason: `Package status is ${pkg.status}, must be APPROVED` };
  }

  const validation = await validatePackage(packageId);
  if (!validation.valid) {
    return { ready: false, reason: `Validation failed: ${validation.errors.join('; ')}` };
  }

  // Check rate limits
  const settings = await getAutomationSettings(pkg.application_id); // need ownerId
  // This would check daily/hourly limits
  
  return { ready: true };
}