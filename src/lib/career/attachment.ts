import { query } from "@/lib/db";
import crypto from "crypto";

export type AttachmentCategory =
  | 'certificate' | 'transcript' | 'portfolio' | 'reference' | 'id_document' | 'other';

export interface ApplicationAttachment {
  id: number;
  owner_id: number;
  filename: string;
  mime_type: string;
  file_bytes: Buffer;
  sha256: string;
  category: AttachmentCategory | null;
  created_at: string;
}

export interface AttachmentCreateInput {
  owner_id: number;
  filename: string;
  mime_type: string;
  file_bytes: Buffer;
  category?: AttachmentCategory;
}

export function computeSha256(bytes: Buffer): string {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export async function createAttachment(input: AttachmentCreateInput): Promise<ApplicationAttachment> {
  const sha256 = computeSha256(input.file_bytes);

  // Check for existing (dedup by owner+sha256)
  const existing = await query<ApplicationAttachment>(
    `SELECT * FROM application_attachment WHERE owner_id = $1 AND sha256 = $2 LIMIT 1`,
    [input.owner_id, sha256]
  );
  if (existing.length > 0) return existing[0];

  const result = await query<ApplicationAttachment>(
    `INSERT INTO application_attachment (
      owner_id, filename, mime_type, file_bytes, sha256, category, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
    [input.owner_id, input.filename, input.mime_type, input.file_bytes, sha256, input.category ?? null]
  );
  return result[0];
}

export async function getAttachment(id: number): Promise<ApplicationAttachment | null> {
  const rows = await query<ApplicationAttachment>(
    `SELECT * FROM application_attachment WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getAttachmentsByOwner(ownerId: number): Promise<ApplicationAttachment[]> {
  return query<ApplicationAttachment>(
    `SELECT * FROM application_attachment WHERE owner_id = $1 ORDER BY created_at DESC`,
    [ownerId]
  );
}

export async function deleteAttachment(id: number): Promise<boolean> {
  const result = await query(`DELETE FROM application_attachment WHERE id = $1`, [id]);
  return (result as any).rowCount > 0;
}