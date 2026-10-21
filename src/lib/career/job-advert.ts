import { query } from "@/lib/db";

export interface JobAdvert {
  id: number;
  owner_id: number;
  source: 'manual' | 'pdf' | 'image';
  original_filename: string | null;
  original_mime: string | null;
  original_bytes: Buffer | null;
  raw_text: string;
  extracted_json: Record<string, any>;
  analysis_json: Record<string, any>;
  status: JobAdvertStatus;
  created_at: string;
  updated_at: string;
}

export type JobAdvertStatus =
  | 'IMPORTED' | 'ANALYZED' | 'MATCHED' | 'DOCUMENTS_IN_PROGRESS'
  | 'READY_FOR_REVIEW' | 'APPROVED' | 'SENT' | 'DRAFT' | 'REJECTED' | 'ARCHIVED' | 'FAILED';

export interface JobAdvertCreateInput {
  owner_id: number;
  source?: 'manual' | 'pdf' | 'image';
  original_filename?: string | null;
  original_mime?: string | null;
  original_bytes?: Buffer | null;
  raw_text: string;
  extracted_json?: Record<string, any>;
  analysis_json?: Record<string, any>;
  status?: JobAdvertStatus;
}

export async function createJobAdvert(input: JobAdvertCreateInput): Promise<JobAdvert> {
  const result = await query<JobAdvert>(
    `INSERT INTO job_advert (
      owner_id, source, original_filename, original_mime, original_bytes,
      raw_text, extracted_json, analysis_json, status, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, NOW(), NOW()
    ) RETURNING *`,
    [
      input.owner_id,
      input.source ?? 'manual',
      input.original_filename ?? null,
      input.original_mime ?? null,
      input.original_bytes ?? null,
      input.raw_text,
      JSON.stringify(input.extracted_json ?? {}),
      JSON.stringify(input.analysis_json ?? {}),
      input.status ?? 'IMPORTED',
    ]
  );
  return result[0];
}

export async function getJobAdvert(id: number): Promise<JobAdvert | null> {
  const rows = await query<JobAdvert>(
    `SELECT * FROM job_advert WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getJobAdvertsByOwner(ownerId: number, limit = 50, offset = 0): Promise<JobAdvert[]> {
  return query<JobAdvert>(
    `SELECT * FROM job_advert WHERE owner_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [ownerId, limit, offset]
  );
}

export async function updateJobAdvert(
  id: number,
  updates: Partial<Pick<JobAdvert, 'extracted_json' | 'analysis_json' | 'status' | 'raw_text'>>
): Promise<JobAdvert | null> {
  const fields: string[] = [];
  const params: any[] = [id];
  let idx = 2;

  if (updates.raw_text !== undefined) {
    fields.push(`raw_text = $${idx++}`);
    params.push(updates.raw_text);
  }
  if (updates.extracted_json !== undefined) {
    fields.push(`extracted_json = $${idx++}::jsonb`);
    params.push(JSON.stringify(updates.extracted_json));
  }
  if (updates.analysis_json !== undefined) {
    fields.push(`analysis_json = $${idx++}::jsonb`);
    params.push(JSON.stringify(updates.analysis_json));
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${idx++}`);
    params.push(updates.status);
  }

  if (fields.length === 0) return getJobAdvert(id);

  fields.push(`updated_at = NOW()`);
  const rows = await query<JobAdvert>(
    `UPDATE job_advert SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

export async function deleteJobAdvert(id: number): Promise<boolean> {
  const result = await query(`DELETE FROM job_advert WHERE id = $1`, [id]);
  return (result as any).rowCount > 0;
}