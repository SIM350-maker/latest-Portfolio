import { query } from "@/lib/db";

export interface JobRequirement {
  id: number;
  advert_id: number;
  category: JobRequirementCategory;
  requirement_text: string;
  is_mandatory: boolean;
  source_span: Record<string, any>;
  confidence: number;
  created_at: string;
}

export type JobRequirementCategory =
  | 'technical_skill' | 'qualification' | 'experience'
  | 'certification' | 'responsibility' | 'soft_skill' | 'other';

export interface JobRequirementCreateInput {
  advert_id: number;
  category: JobRequirementCategory;
  requirement_text: string;
  is_mandatory?: boolean;
  source_span?: Record<string, any>;
  confidence?: number;
}

export async function createJobRequirement(input: JobRequirementCreateInput): Promise<JobRequirement> {
  const result = await query<JobRequirement>(
    `INSERT INTO job_requirement (
      advert_id, category, requirement_text, is_mandatory, source_span, confidence, created_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW()) RETURNING *`,
    [
      input.advert_id,
      input.category,
      input.requirement_text,
      input.is_mandatory ?? true,
      JSON.stringify(input.source_span ?? {}),
      input.confidence ?? 1.0,
    ]
  );
  return result[0];
}

export async function createJobRequirementsBulk(inputs: JobRequirementCreateInput[]): Promise<JobRequirement[]> {
  if (inputs.length === 0) return [];
  const advertId = inputs[0].advert_id;
  if (!inputs.every(i => i.advert_id === advertId)) throw new Error('All requirements must belong to same advert');

  const valuePlaceholders = inputs.map((_, i) => {
    const base = i * 6;
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}::jsonb, $${base + 6}, NOW())`;
  }).join(', ');

  const flatParams: any[] = [];
  for (const input of inputs) {
    flatParams.push(input.advert_id, input.category, input.requirement_text, input.is_mandatory ?? true, JSON.stringify(input.source_span ?? {}), input.confidence ?? 1.0);
  }

  const result = await query<JobRequirement>(
    `INSERT INTO job_requirement (advert_id, category, requirement_text, is_mandatory, source_span, confidence, created_at)
     VALUES ${valuePlaceholders} RETURNING *`,
    flatParams
  );
  return result;
}

export async function getJobRequirementsByAdvert(advertId: number): Promise<JobRequirement[]> {
  return query<JobRequirement>(
    `SELECT * FROM job_requirement WHERE advert_id = $1 ORDER BY is_mandatory DESC, category, id`,
    [advertId]
  );
}

export async function getJobRequirementsByApplication(applicationId: number): Promise<JobRequirement[]> {
  // Join through job_application -> job_advert -> job_requirement
  return query<JobRequirement>(
    `SELECT jr.* FROM job_requirement jr
     JOIN job_application ja ON ja.advert_id = jr.advert_id
     WHERE ja.id = $1
     ORDER BY jr.is_mandatory DESC, jr.category, jr.id`,
    [applicationId]
  );
}

export async function deleteJobRequirementsByAdvert(advertId: number): Promise<boolean> {
  const result = await query(`DELETE FROM job_requirement WHERE advert_id = $1`, [advertId]);
  return (result as any).rowCount > 0;
}