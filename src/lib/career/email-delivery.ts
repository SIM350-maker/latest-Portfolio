import { query } from "@/lib/db";

export type EmailProvider = 'console' | 'resend' | 'smtp' | 'other';
export type DeliveryStatus =
  | 'QUEUED' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'REJECTED' | 'DEFERRED' | 'FAILED' | 'SIMULATED';

export interface EmailDeliveryAttempt {
  id: number;
  package_id: number;
  provider: EmailProvider;
  provider_message_id: string | null;
  to_email: string;
  cc_email: string[];
  bcc_email: string[];
  subject: string;
  body_text: string;
  body_html: string | null;
  attachment_sha256s: string[];
  status: DeliveryStatus;
  error_code: string | null;
  error_message: string | null;
  idempotency_key: string;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface DeliveryCreateInput {
  package_id: number;
  provider: EmailProvider;
  to_email: string;
  cc_email?: string[];
  bcc_email?: string[];
  subject: string;
  body_text: string;
  body_html?: string | null;
  attachment_sha256s?: string[];
  idempotency_key: string;
}

export async function createDeliveryAttempt(input: DeliveryCreateInput): Promise<EmailDeliveryAttempt> {
  const result = await query<EmailDeliveryAttempt>(
    `INSERT INTO email_delivery_attempt (
      package_id, provider, to_email, cc_email, bcc_email, subject,
      body_text, body_html, attachment_sha256s, status, idempotency_key, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'QUEUED', $10, NOW()) RETURNING *`,
    [
      input.package_id,
      input.provider,
      input.to_email,
      input.cc_email ?? [],
      input.bcc_email ?? [],
      input.subject,
      input.body_text,
      input.body_html ?? null,
      input.attachment_sha256s ?? [],
      input.idempotency_key,
    ]
  );
  return result[0];
}

export async function getDeliveryAttempt(id: number): Promise<EmailDeliveryAttempt | null> {
  const rows = await query<EmailDeliveryAttempt>(
    `SELECT * FROM email_delivery_attempt WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getDeliveryAttemptByIdempotencyKey(key: string): Promise<EmailDeliveryAttempt | null> {
  const rows = await query<EmailDeliveryAttempt>(
    `SELECT * FROM email_delivery_attempt WHERE idempotency_key = $1 LIMIT 1`,
    [key]
  );
  return rows[0] ?? null;
}

export async function getDeliveryAttemptsByPackage(packageId: number): Promise<EmailDeliveryAttempt[]> {
  return query<EmailDeliveryAttempt>(
    `SELECT * FROM email_delivery_attempt WHERE package_id = $1 ORDER BY created_at DESC`,
    [packageId]
  );
}

export async function updateDeliveryAttemptStatus(
  id: number,
  status: DeliveryStatus,
  updates: Partial<Pick<EmailDeliveryAttempt, 'provider_message_id' | 'error_code' | 'error_message' | 'sent_at' | 'delivered_at'>> = {}
): Promise<EmailDeliveryAttempt | null> {
  const fields: string[] = [`status = $2`];
  const params: any[] = [id, status];
  let idx = 3;

  if (updates.provider_message_id !== undefined) { fields.push(`provider_message_id = $${idx++}`); params.push(updates.provider_message_id); }
  if (updates.error_code !== undefined) { fields.push(`error_code = $${idx++}`); params.push(updates.error_code); }
  if (updates.error_message !== undefined) { fields.push(`error_message = $${idx++}`); params.push(updates.error_message); }
  if (updates.sent_at !== undefined) { fields.push(`sent_at = $${idx++}`); params.push(updates.sent_at); }
  if (updates.delivered_at !== undefined) { fields.push(`delivered_at = $${idx++}`); params.push(updates.delivered_at); }

  const rows = await query<EmailDeliveryAttempt>(
    `UPDATE email_delivery_attempt SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return rows[0] ?? null;
}