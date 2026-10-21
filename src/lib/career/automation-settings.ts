import { query } from "@/lib/db";

export interface AutomationSettings {
  owner_id: number;
  default_cv_template_id: number | null;
  default_cover_letter_template_id: number | null;
  default_email_template_id: number | null;
  preferred_formats: string[];
  ai_provider: string | null;
  ai_model: string | null;
  ai_base_url: string | null;
  email_provider: string;
  email_from_address: string | null;
  email_from_name: string | null;
  generation_limit_daily: number;
  require_approval_before_send: boolean;
  retain_documents_days: number;
  qualification_display_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SettingsUpdateInput {
  default_cv_template_id?: number | null;
  default_cover_letter_template_id?: number | null;
  default_email_template_id?: number | null;
  preferred_formats?: string[];
  ai_provider?: string | null;
  ai_model?: string | null;
  ai_base_url?: string | null;
  email_provider?: string;
  email_from_address?: string | null;
  email_from_name?: string | null;
  generation_limit_daily?: number;
  require_approval_before_send?: boolean;
  retain_documents_days?: number;
  qualification_display_settings?: Record<string, any>;
}

export async function getAutomationSettings(ownerId: number): Promise<AutomationSettings | null> {
  const rows = await query<AutomationSettings>(
    `SELECT * FROM automation_settings WHERE owner_id = $1 LIMIT 1`,
    [ownerId]
  );
  return rows[0] ?? null;
}

export async function upsertAutomationSettings(
  ownerId: number,
  input: SettingsUpdateInput
): Promise<AutomationSettings> {
  const fields: string[] = [];
  const params: any[] = [ownerId];
  let idx = 2;

  if (input.default_cv_template_id !== undefined) { fields.push(`default_cv_template_id = $${idx++}`); params.push(input.default_cv_template_id); }
  if (input.default_cover_letter_template_id !== undefined) { fields.push(`default_cover_letter_template_id = $${idx++}`); params.push(input.default_cover_letter_template_id); }
  if (input.default_email_template_id !== undefined) { fields.push(`default_email_template_id = $${idx++}`); params.push(input.default_email_template_id); }
  if (input.preferred_formats !== undefined) { fields.push(`preferred_formats = $${idx++}`); params.push(input.preferred_formats); }
  if (input.ai_provider !== undefined) { fields.push(`ai_provider = $${idx++}`); params.push(input.ai_provider); }
  if (input.ai_model !== undefined) { fields.push(`ai_model = $${idx++}`); params.push(input.ai_model); }
  if (input.ai_base_url !== undefined) { fields.push(`ai_base_url = $${idx++}`); params.push(input.ai_base_url); }
  if (input.email_provider !== undefined) { fields.push(`email_provider = $${idx++}`); params.push(input.email_provider); }
  if (input.email_from_address !== undefined) { fields.push(`email_from_address = $${idx++}`); params.push(input.email_from_address); }
  if (input.email_from_name !== undefined) { fields.push(`email_from_name = $${idx++}`); params.push(input.email_from_name); }
  if (input.generation_limit_daily !== undefined) { fields.push(`generation_limit_daily = $${idx++}`); params.push(input.generation_limit_daily); }
  if (input.require_approval_before_send !== undefined) { fields.push(`require_approval_before_send = $${idx++}`); params.push(input.require_approval_before_send); }
  if (input.retain_documents_days !== undefined) { fields.push(`retain_documents_days = $${idx++}`); params.push(input.retain_documents_days); }
  if (input.qualification_display_settings !== undefined) { fields.push(`qualification_display_settings = $${idx++}::jsonb`); params.push(JSON.stringify(input.qualification_display_settings)); }

  if (fields.length === 0) {
    const existing = await getAutomationSettings(ownerId);
    if (existing) return existing;
  }

  fields.push(`updated_at = NOW()`);

  const result = await query<AutomationSettings>(
    `INSERT INTO automation_settings (owner_id, ${fields.map((_, i) => {
      const name = fields[i].split(' = ')[0];
      return name;
    }).join(', ')}, created_at, updated_at)
     VALUES ($1, ${fields.map((_, i) => `$${i + 2}`).join(', ')}, NOW(), NOW())
     ON CONFLICT (owner_id) DO UPDATE SET
       ${fields.join(', ')}
     RETURNING *`,
    params
  );
  return result[0];
}

export async function getEffectiveSettings(ownerId: number): Promise<AutomationSettings> {
  let settings = await getAutomationSettings(ownerId);
  if (!settings) {
    // Create defaults
    settings = await upsertAutomationSettings(ownerId, {});
  }
  return settings;
}