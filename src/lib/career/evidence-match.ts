import { query } from "@/lib/db";

export type MatchClass =
  | 'STRONG' | 'PARTIAL' | 'TRANSFERABLE' | 'NO_EVIDENCE' | 'REQUIRES_VERIFICATION';

export interface ApplicationEvidenceMatch {
  id: number;
  application_id: number;
  requirement_id: number;
  source_table: 'education' | 'experience' | 'project' | 'skill' | 'certification' | 'claim' | 'cv_reference' | 'recommendation';
  source_id: number;
  match_class: MatchClass;
  evidence_json: Record<string, any>;
  reason: string | null;
  recommended_action: string | null;
  verified_by_owner: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchCreateInput {
  application_id: number;
  requirement_id: number;
  source_table: ApplicationEvidenceMatch['source_table'];
  source_id: number;
  match_class: MatchClass;
  evidence_json: Record<string, any>;
  reason?: string | null;
  recommended_action?: string | null;
  verified_by_owner?: boolean;
}

export async function createEvidenceMatch(input: MatchCreateInput): Promise<ApplicationEvidenceMatch> {
  const result = await query<ApplicationEvidenceMatch>(
    `INSERT INTO application_evidence_match (
      application_id, requirement_id, source_table, source_id, match_class,
      evidence_json, reason, recommended_action, verified_by_owner, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, NOW(), NOW())
    ON CONFLICT (application_id, requirement_id, source_table, source_id) DO UPDATE SET
      match_class = EXCLUDED.match_class,
      evidence_json = EXCLUDED.evidence_json,
      reason = EXCLUDED.reason,
      recommended_action = EXCLUDED.recommended_action,
      verified_by_owner = EXCLUDED.verified_by_owner,
      updated_at = NOW()
    RETURNING *`,
    [
      input.application_id,
      input.requirement_id,
      input.source_table,
      input.source_id,
      input.match_class,
      JSON.stringify(input.evidence_json),
      input.reason ?? null,
      input.recommended_action ?? null,
      input.verified_by_owner ?? false,
    ]
  );
  return result[0];
}

export async function createEvidenceMatchesBulk(inputs: MatchCreateInput[]): Promise<ApplicationEvidenceMatch[]> {
  if (inputs.length === 0) return [];
  const appId = inputs[0].application_id;
  if (!inputs.every(i => i.application_id === appId)) throw new Error('All matches must belong to same application');

  const valuePlaceholders = inputs.map((_, i) => {
    const base = i * 9;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}::jsonb, $${base + 7}, $${base + 8}, $${base + 9}, NOW(), NOW())`;
  }).join(', ');

  const flatParams: any[] = [];
  for (const input of inputs) {
    flatParams.push(
      input.application_id,
      input.requirement_id,
      input.source_table,
      input.source_id,
      input.match_class,
      JSON.stringify(input.evidence_json),
      input.reason ?? null,
      input.recommended_action ?? null,
      input.verified_by_owner ?? false
    );
  }

  const result = await query<ApplicationEvidenceMatch>(
    `INSERT INTO application_evidence_match (
      application_id, requirement_id, source_table, source_id, match_class,
      evidence_json, reason, recommended_action, verified_by_owner, created_at, updated_at
    ) VALUES ${valuePlaceholders}
    ON CONFLICT (application_id, requirement_id, source_table, source_id) DO UPDATE SET
      match_class = EXCLUDED.match_class,
      evidence_json = EXCLUDED.evidence_json,
      reason = EXCLUDED.reason,
      recommended_action = EXCLUDED.recommended_action,
      verified_by_owner = EXCLUDED.verified_by_owner,
      updated_at = NOW()
    RETURNING *`,
    flatParams
  );
  return result;
}

export async function getEvidenceMatchesByApplication(applicationId: number): Promise<ApplicationEvidenceMatch[]> {
  return query<ApplicationEvidenceMatch>(
    `SELECT * FROM application_evidence_match WHERE application_id = $1 ORDER BY requirement_id, match_class`,
    [applicationId]
  );
}

export async function getEvidenceMatchesByRequirement(requirementId: number): Promise<ApplicationEvidenceMatch[]> {
  return query<ApplicationEvidenceMatch>(
    `SELECT * FROM application_evidence_match WHERE requirement_id = $1 ORDER BY
      CASE match_class
        WHEN 'STRONG' THEN 1
        WHEN 'PARTIAL' THEN 2
        WHEN 'TRANSFERABLE' THEN 3
        WHEN 'REQUIRES_VERIFICATION' THEN 4
        ELSE 5 END,
      created_at`,
    [requirementId]
  );
}

export async function updateEvidenceMatchOwnerVerification(
  applicationId: number,
  requirementId: number,
  sourceTable: ApplicationEvidenceMatch['source_table'],
  sourceId: number,
  verified: boolean
): Promise<ApplicationEvidenceMatch | null> {
  const rows = await query<ApplicationEvidenceMatch>(
    `UPDATE application_evidence_match
     SET verified_by_owner = $1, updated_at = NOW()
     WHERE application_id = $2 AND requirement_id = $3 AND source_table = $4 AND source_id = $5
     RETURNING *`,
    [verified, applicationId, requirementId, sourceTable, sourceId]
  );
  return rows[0] ?? null;
}