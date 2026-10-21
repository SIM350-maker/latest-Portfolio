import { query } from "@/lib/db";

export type PackageStatus =
  | 'ASSEMBLING' | 'READY_FOR_REVIEW' | 'APPROVED' | 'SENDING' | 'SENT' | 'FAILED';

export interface ApplicationPackage {
  id: number;
  application_id: number;
  cv_document_id: number | null;
  cover_letter_document_id: number | null;
  email_document_id: number | null;
  attachment_ids: number[];
  status: PackageStatus;
  approval_json: Record<string, any>;
  approved_at: string | null;
  approved_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface PackageCreateInput {
  application_id: number;
  cv_document_id?: number | null;
  cover_letter_document_id?: number | null;
  email_document_id?: number | null;
  attachment_ids?: number[];
  status?: PackageStatus;
  approval_json?: Record<string, any>;
}

export async function createApplicationPackage(input: PackageCreateInput): Promise<ApplicationPackage> {
  const result = await query<ApplicationPackage>(
    `INSERT INTO application_package (
      application_id, cv_document_id, cover_letter_document_id, email_document_id,
      attachment_ids, status, approval_json, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW()) RETURNING *`,
    [
      input.application_id,
      input.cv_document_id ?? null,
      input.cover_letter_document_id ?? null,
      input.email_document_id ?? null,
      input.attachment_ids ?? [],
      input.status ?? 'ASSEMBLING',
      JSON.stringify(input.approval_json ?? {}),
    ]
  );
  return result[0];
}

export async function getApplicationPackage(id: number): Promise<ApplicationPackage | null> {
  const rows = await query<ApplicationPackage>(
    `SELECT * FROM application_package WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getApplicationPackageByApplication(applicationId: number): Promise<ApplicationPackage | null> {
  const rows = await query<ApplicationPackage>(
    `SELECT * FROM application_package WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [applicationId]
  );
  return rows[0] ?? null;
}

export async function updateApplicationPackage(
  id: number,
  updates: Partial<Pick<ApplicationPackage,
    'cv_document_id' | 'cover_letter_document_id' | 'email_document_id' |
    'attachment_ids' | 'status' | 'approval_json' | 'approved_at' | 'approved_by'
  >>
): Promise<ApplicationPackage | null> {
  const fields: string[] = [];
  const params: any[] = [id];
  let idx = 2;

  if (updates.cv_document_id !== undefined) { fields.push(`cv_document_id = $${idx++}`); params.push(updates.cv_document_id); }
  if (updates.cover_letter_document_id !== undefined) { fields.push(`cover_letter_document_id = $${idx++}`); params.push(updates.cover_letter_document_id); }
  if (updates.email_document_id !== undefined) { fields.push(`email_document_id = $${idx++}`); params.push(updates.email_document_id); }
  if (updates.attachment_ids !== undefined) { fields.push(`attachment_ids = $${idx++}`); params.push(updates.attachment_ids); }
  if (updates.status !== undefined) { fields.push(`status = $${idx++}`); params.push(updates.status); }
  if (updates.approval_json !== undefined) { fields.push(`approval_json = $${idx++}::jsonb`); params.push(JSON.stringify(updates.approval_json)); }
  if (updates.approved_at !== undefined) { fields.push(`approved_at = $${idx++}`); params.push(updates.approved_at); }
  if (updates.approved_by !== undefined) { fields.push(`approved_by = $${idx++}`); params.push(updates.approved_by); }

  if (fields.length === 0) return getApplicationPackage(id);

  fields.push(`updated_at = NOW()`);
  const rows = await query<ApplicationPackage>(
    `UPDATE application_package SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

export async function approveApplicationPackage(
  id: number,
  approvedBy: number,
  approvalJson: Record<string, any>
): Promise<ApplicationPackage | null> {
  const rows = await query<ApplicationPackage>(
    `UPDATE application_package
     SET status = 'APPROVED', approval_json = $1::jsonb, approved_at = NOW(), approved_by = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [JSON.stringify(approvalJson), approvedBy, id]
  );
  return rows[0] ?? null;
}