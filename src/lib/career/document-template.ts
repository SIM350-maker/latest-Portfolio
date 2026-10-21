import { query } from "@/lib/db";
import type { DocumentType } from "./generated-document";

export { type DocumentType };
export type DocumentStatus = 'DRAFT' | 'GENERATED' | 'EDITED' | 'REVIEWED' | 'APPROVED';

export interface DocumentTemplate {
  id: number;
  owner_id: number;
  type: DocumentType;
  name: string;
  description: string | null;
  content_json: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplateCreateInput {
  owner_id: number;
  type: DocumentType;
  name: string;
  description?: string | null;
  content_json: Record<string, any>;
  is_default?: boolean;
}

export async function createDocumentTemplate(input: DocumentTemplateCreateInput): Promise<DocumentTemplate> {
  if (input.is_default) {
    await query(
      `UPDATE document_template SET is_default = FALSE WHERE owner_id = $1 AND type = $2`,
      [input.owner_id, input.type]
    );
  }
  const result = await query<DocumentTemplate>(
    `INSERT INTO document_template (
      owner_id, type, name, description, content_json, is_default, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW(), NOW()) RETURNING *`,
    [input.owner_id, input.type, input.name, input.description ?? null, JSON.stringify(input.content_json), input.is_default ?? false]
  );
  return result[0];
}

export async function getDocumentTemplatesByOwner(ownerId: number, type?: DocumentType): Promise<DocumentTemplate[]> {
  let sql = `SELECT * FROM document_template WHERE owner_id = $1`;
  const params: any[] = [ownerId];
  if (type) {
    sql += ` AND type = $2`;
    params.push(type);
  }
  sql += ` ORDER BY is_default DESC, name`;
  return query<DocumentTemplate>(sql, params);
}

export async function getDefaultDocumentTemplate(ownerId: number, type: DocumentType): Promise<DocumentTemplate | null> {
  const rows = await query<DocumentTemplate>(
    `SELECT * FROM document_template WHERE owner_id = $1 AND type = $2 AND is_default = TRUE LIMIT 1`,
    [ownerId, type]
  );
  return rows[0] ?? null;
}

export async function getDocumentTemplate(id: number): Promise<DocumentTemplate | null> {
  const rows = await query<DocumentTemplate>(
    `SELECT * FROM document_template WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateDocumentTemplate(
  id: number,
  updates: Partial<Pick<DocumentTemplate, 'name' | 'description' | 'content_json' | 'is_default'>>
): Promise<DocumentTemplate | null> {
  const fields: string[] = [];
  const params: any[] = [id];
  let idx = 2;

  if (updates.name !== undefined) { fields.push(`name = $${idx++}`); params.push(updates.name); }
  if (updates.description !== undefined) { fields.push(`description = $${idx++}`); params.push(updates.description); }
  if (updates.content_json !== undefined) { fields.push(`content_json = $${idx++}::jsonb`); params.push(JSON.stringify(updates.content_json)); }
  if (updates.is_default !== undefined) {
    if (updates.is_default) {
      // First unset other defaults of same type
      const tpl = await getDocumentTemplate(id);
      if (tpl) {
        await query(
          `UPDATE document_template SET is_default = FALSE WHERE owner_id = $1 AND type = $2 AND id != $3`,
          [tpl.owner_id, tpl.type, id]
        );
      }
    }
    fields.push(`is_default = $${idx++}`);
    params.push(updates.is_default);
  }

  if (fields.length === 0) return getDocumentTemplate(id);

  fields.push(`updated_at = NOW()`);
  const rows = await query<DocumentTemplate>(
    `UPDATE document_template SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return rows[0] ?? null;
}

export async function deleteDocumentTemplate(id: number): Promise<boolean> {
  const result = await query(`DELETE FROM document_template WHERE id = $1`, [id]);
  return (result as any).rowCount > 0;
}