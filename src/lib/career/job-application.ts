import { query } from "@/lib/db";

export interface JobApplication {
  id: number;
  owner_id: number;
  advert_id: number;
  status: JobApplicationStatus;
  mode: 'MANUAL' | 'AUTOMATED';
  settings_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type JobApplicationStatus =
  | 'DRAFT' | 'MATCHED' | 'DOCUMENTS_IN_PROGRESS' | 'READY_FOR_REVIEW'
  | 'APPROVED' | 'SENT' | 'REJECTED' | 'ARCHIVED' | 'FAILED';

export interface JobApplicationCreateInput {
  owner_id: number;
  advert_id: number;
  status?: JobApplicationStatus;
  mode?: 'MANUAL' | 'AUTOMATED';
  settings_json?: Record<string, any>;
}

export async function createJobApplication(input: JobApplicationCreateInput): Promise<JobApplication> {
  const result = await query<JobApplication>(
    `INSERT INTO job_application (
      owner_id, advert_id, status, mode, settings_json, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
    ON CONFLICT (owner_id, advert_id) DO UPDATE SET
      status = EXCLUDED.status,
      mode = EXCLUDED.mode,
      settings_json = EXCLUDED.settings_json,
      updated_at = NOW()
    RETURNING *`,
    [
      input.owner_id,
      input.advert_id,
      input.status ?? 'DRAFT',
      input.mode ?? 'MANUAL',
      JSON.stringify(input.settings_json ?? {}),
    ]
  );
  return result[0];
}

export async function getJobApplication(id: number): Promise<JobApplication | null> {
  const rows = await query<JobApplication>(
    `SELECT * FROM job_application WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getJobApplicationByOwnerAndAdvert(ownerId: number, advertId: number): Promise<JobApplication | null> {
  const rows = await query<JobApplication>(
    `SELECT * FROM job_application WHERE owner_id = $1 AND advert_id = $2 LIMIT 1`,
    [ownerId, advertId]
  );
  return rows[0] ?? null;
}

export async function getJobApplicationsByOwner(
  ownerId: number,
  status?: JobApplicationStatus,
  limit = 50,
  offset = 0
): Promise<JobApplication[]> {
  let sql = `SELECT * FROM job_application WHERE owner_id = $1`;
  const params: any[] = [ownerId];
  let idx = 2;

  if (status) {
    sql += ` AND status = $${idx++}`;
    params.push(status);
  }

  sql += ` ORDER BY updated_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  return query<JobApplication>(sql, params);
}

export async function updateJobApplication(
  id: number,
  updates: Partial<Pick<JobApplication, 'status' | 'mode' | 'settings_json'>>
): Promise<JobApplication | null> {
  const fields: string[] = [];
  const params: any[] = [id];
  let idx = 2;

  if (updates.status !== undefined) {
    fields.push(`status = $${idx++}`);
    params.push(updates.status);
  }
  if (updates.mode !== undefined) {
    fields.push(`mode = $${idx++}`);
    params.push(updates.mode);
  }
  if (updates.settings_json !== undefined) {
    fields.push(`settings_json = $${idx++}::jsonb`);
    params.push(JSON.stringify(updates.settings_json));
  }

  if (fields.length === 0) return getJobApplication(id);

  fields.push(`updated_at = NOW()`);
  const rows = await query<JobApplication>(
    `UPDATE job_application SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return rows[0] ?? null;
}