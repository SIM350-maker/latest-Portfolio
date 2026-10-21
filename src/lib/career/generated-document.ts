import { query } from "@/lib/db";

export type DocumentType = 'CV' | 'COVER_LETTER' | 'EMAIL' | 'OTHER';
export type GeneratedDocumentStatus = 'DRAFT' | 'GENERATED' | 'EDITED' | 'REVIEWED' | 'APPROVED';

export interface GeneratedDocument {
  id: number;
  application_id: number;
  template_id: number | null;
  type: DocumentType;
  title: string;
  content_json: Record<string, any>;
  html_content: string | null;
  pdf_bytes: Buffer | null;
  docx_bytes: Buffer | null;
  txt_content: string | null;
  version: number;
  status: GeneratedDocumentStatus;
  provenance_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GeneratedDocumentCreateInput {
  application_id: number;
  template_id?: number | null;
  type: DocumentType;
  title: string;
  content_json: Record<string, any>;
  html_content?: string | null;
  pdf_bytes?: Buffer | null;
  docx_bytes?: Buffer | null;
  txt_content?: string | null;
  status?: GeneratedDocumentStatus;
  provenance_json?: Record<string, any>;
}

export async function createGeneratedDocument(input: GeneratedDocumentCreateInput): Promise<GeneratedDocument> {
  // Get next version number for this application + type
  const versionRows = await query<{max_version: number | null}>(
    `SELECT MAX(version) as max_version FROM generated_document WHERE application_id = $1 AND type = $2`,
    [input.application_id, input.type]
  );
  const nextVersion = (versionRows[0]?.max_version ?? 0) + 1;

  const result = await query<GeneratedDocument>(
    `INSERT INTO generated_document (
      application_id, template_id, type, title, content_json, html_content,
      pdf_bytes, docx_bytes, txt_content, version, status, provenance_json, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12::jsonb, NOW(), NOW()) RETURNING *`,
    [
      input.application_id,
      input.template_id ?? null,
      input.type,
      input.title,
      JSON.stringify(input.content_json),
      input.html_content ?? null,
      input.pdf_bytes ?? null,
      input.docx_bytes ?? null,
      input.txt_content ?? null,
      nextVersion,
      input.status ?? 'DRAFT',
      JSON.stringify(input.provenance_json ?? {}),
    ]
  );
  return result[0];
}

export async function getGeneratedDocument(id: number): Promise<GeneratedDocument | null> {
  const rows = await query<GeneratedDocument>(
    `SELECT * FROM generated_document WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getGeneratedDocumentsByApplication(
  applicationId: number,
  type?: DocumentType,
  status?: GeneratedDocumentStatus
): Promise<GeneratedDocument[]> {
  let sql = `SELECT * FROM generated_document WHERE application_id = $1`;
  const params: any[] = [applicationId];
  let idx = 2;

  if (type) {
    sql += ` AND type = $${idx++}`;
    params.push(type);
  }
  if (status) {
    sql += ` AND status = $${idx++}`;
    params.push(status);
  }

  sql += ` ORDER BY type, version DESC`;
  return query<GeneratedDocument>(sql, params);
}

export async function getLatestGeneratedDocumentByApplication(
  applicationId: number,
  type: DocumentType
): Promise<GeneratedDocument | null> {
  const rows = await query<GeneratedDocument>(
    `SELECT * FROM generated_document
     WHERE application_id = $1 AND type = $2
     ORDER BY version DESC LIMIT 1`,
    [applicationId, type]
  );
  return rows[0] ?? null;
}

export async function getApprovedGeneratedDocumentByApplication(
  applicationId: number,
  type: DocumentType
): Promise<GeneratedDocument | null> {
  const rows = await query<GeneratedDocument>(
    `SELECT * FROM generated_document
     WHERE application_id = $1 AND type = $2 AND status = 'APPROVED'
     ORDER BY version DESC LIMIT 1`,
    [applicationId, type]
  );
  return rows[0] ?? null;
}

export async function updateGeneratedDocument(
  id: number,
  updates: Partial<Pick<GeneratedDocument,
    'content_json' | 'html_content' | 'pdf_bytes' | 'docx_bytes' | 'txt_content' |
    'status' | 'provenance_json' | 'title'
  >>
): Promise<GeneratedDocument | null> {
  const fields: string[] = [];
  const params: any[] = [id];
  let idx = 2;

  if (updates.title !== undefined) { fields.push(`title = $${idx++}`); params.push(updates.title); }
  if (updates.content_json !== undefined) { fields.push(`content_json = $${idx++}::jsonb`); params.push(JSON.stringify(updates.content_json)); }
  if (updates.html_content !== undefined) { fields.push(`html_content = $${idx++}`); params.push(updates.html_content); }
  if (updates.pdf_bytes !== undefined) { fields.push(`pdf_bytes = $${idx++}`); params.push(updates.pdf_bytes); }
  if (updates.docx_bytes !== undefined) { fields.push(`docx_bytes = $${idx++}`); params.push(updates.docx_bytes); }
  if (updates.txt_content !== undefined) { fields.push(`txt_content = $${idx++}`); params.push(updates.txt_content); }
  if (updates.status !== undefined) { fields.push(`status = $${idx++}`); params.push(updates.status); }
  if (updates.provenance_json !== undefined) { fields.push(`provenance_json = $${idx++}::jsonb`); params.push(JSON.stringify(updates.provenance_json)); }

  if (fields.length === 0) return getGeneratedDocument(id);

  fields.push(`updated_at = NOW()`);
  const rows = await query<GeneratedDocument>(
    `UPDATE generated_document SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

export async function createNewVersion(
  sourceId: number,
  updates: Partial<Pick<GeneratedDocument, 'content_json' | 'html_content' | 'title' | 'provenance_json'>>
): Promise<GeneratedDocument> {
  const source = await getGeneratedDocument(sourceId);
  if (!source) throw new Error('Source document not found');

  return createGeneratedDocument({
    application_id: source.application_id,
    template_id: source.template_id,
    type: source.type,
    title: updates.title ?? `${source.title} (v${source.version + 1})`,
    content_json: updates.content_json ?? source.content_json,
    html_content: updates.html_content ?? source.html_content,
    pdf_bytes: null, // Reset binaries on new version
    docx_bytes: null,
    txt_content: null,
    status: 'DRAFT',
    provenance_json: {
      ...source.provenance_json,
      ...updates.provenance_json,
      derived_from: sourceId,
      derived_at: new Date().toISOString(),
    },
  });
}