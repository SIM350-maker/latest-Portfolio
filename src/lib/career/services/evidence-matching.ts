// Evidence Matching Engine
// Core domain service for mapping vacancy requirements to professional records
// Explainable, traceable, evidence-grounded matching

import { query } from "@/lib/db";
import type { ApplicationEvidenceMatch, MatchClass, MatchCreateInput } from "@/lib/career/evidence-match";
import { getJobRequirementsByAdvert } from "@/lib/career/job-requirement";

export interface ProfessionalRecord {
  table: 'education' | 'experience' | 'project' | 'skill' | 'certification' | 'claim' | 'cv_reference' | 'recommendation';
  id: number;
  title: string;
  description: string | null;
  skills: string[];
  highlights: string[];
  dates: { start: string | null; end: string | null; current: boolean };
  verification_status: string | null;
  source_metadata: Record<string, any>;
}

export interface MatchResult {
  requirement_id: number;
  requirement_text: string;
  is_mandatory: boolean;
  matches: MatchDetail[];
  overall_class: MatchClass;
  missing: boolean;
  recommended_action: string;
}

export interface MatchDetail {
  source_table: ProfessionalRecord['table'];
  source_id: number;
  match_class: MatchClass;
  evidence: Record<string, any>;
  reason: string;
  confidence: number;
}

export interface MatchingContext {
  ownerId: number;
  advertId: number;
  applicationId: number;
}

/**
 * Main entry point: run evidence matching for an application
 */
export async function runEvidenceMatching(context: MatchingContext): Promise<MatchResult[]> {
  // 1. Get requirements for this advert
  const requirements = await getJobRequirementsByAdvert(context.advertId);
  if (requirements.length === 0) return [];

  // 2. Fetch all professional records for the owner
  const professionalRecords = await fetchAllProfessionalRecords(context.ownerId);

  // 3. Match each requirement against records
  const results: MatchResult[] = [];
  for (const req of requirements) {
    const matches = matchRequirement(req, professionalRecords);
    const overallClass = determineOverallClass(matches, req.is_mandatory);
    const missing = matches.length === 0 || matches.every(m => m.match_class === 'NO_EVIDENCE');

    results.push({
      requirement_id: req.id,
      requirement_text: req.requirement_text,
      is_mandatory: req.is_mandatory,
      matches,
      overall_class: overallClass,
      missing,
      recommended_action: generateRecommendedAction(overallClass, req.is_mandatory, matches),
    });
  }

  // 4. Persist matches to database
  await persistMatches(context, results);

  return results;
}

/**
 * Fetch all professional records from existing tables for the owner
 */
export async function fetchAllProfessionalRecords(ownerId: number): Promise<ProfessionalRecord[]> {
  const records: ProfessionalRecord[] = [];

  // Education
  const education = await query<any>(`
    SELECT id, institution as title, degree, field_of_study, description,
           start_date, end_date, grade, skills, document_url,
           is_visible, is_posted, verification_status
    FROM education WHERE profile_id = $1
  `, [ownerId]);
  records.push(...education.map(e => ({
    table: 'education' as const,
    id: e.id,
    title: `${e.degree} in ${e.field_of_study || 'Unknown'} at ${e.institution}`,
    description: e.description,
    skills: Array.isArray(e.skills) ? e.skills : [],
    highlights: [],
    dates: { start: e.start_date, end: e.end_date, current: false },
    verification_status: e.verification_status || 'VERIFIED',
    source_metadata: { institution: e.institution, degree: e.degree, grade: e.grade, document_url: e.document_url },
  })));

  // Experience
  const experience = await query<any>(`
    SELECT id, title, company, description, start_date, end_date, is_current,
           highlights, skills, location, role, type
    FROM experience WHERE profile_id = $1
  `, [ownerId]);
  records.push(...experience.map(e => ({
    table: 'experience' as const,
    id: e.id,
    title: `${e.title} at ${e.company}`,
    description: e.description,
    skills: Array.isArray(e.skills) ? e.skills : [],
    highlights: Array.isArray(e.highlights) ? e.highlights : [],
    dates: { start: e.start_date, end: e.end_date, current: e.is_current },
    verification_status: 'VERIFIED',
    source_metadata: { company: e.company, location: e.location, role: e.role, type: e.type },
  })));

  // Projects
  const projects = await query<any>(`
    SELECT id, title, description, technologies, outcomes, roles, key_metrics, decisions, evidence_sha
    FROM project WHERE profile_id = $1
  `, [ownerId]);
  records.push(...projects.map(p => ({
    table: 'project' as const,
    id: p.id,
    title: p.title,
    description: p.description,
    skills: Array.isArray(p.technologies) ? p.technologies : [],
    highlights: Array.isArray(p.outcomes) ? p.outcomes : [],
    dates: { start: null, end: null, current: false },
    verification_status: 'VERIFIED',
    source_metadata: { roles: p.roles, key_metrics: p.key_metrics, decisions: p.decisions, evidence_sha: p.evidence_sha },
  })));

  // Skills
  const skills = await query<any>(`
    SELECT s.id, s.name, s.category, s.level, s.description, s.evidence_count
    FROM skill s
    JOIN person_skills ps ON ps.skill_id = s.id
    WHERE ps.person_id = $1
  `, [ownerId]);
  records.push(...skills.map(s => ({
    table: 'skill' as const,
    id: s.id,
    title: s.name,
    description: s.description,
    skills: [s.name],
    highlights: [],
    dates: { start: null, end: null, current: true },
    verification_status: 'VERIFIED',
    source_metadata: { category: s.category, level: s.level, evidence_count: s.evidence_count },
  })));

  // Certifications
  const certs = await query<any>(`
    SELECT id, title, issuer, category, issue_date, credential_id, credential_url,
           file_url, verification_status, skills, is_visible, is_posted
    FROM certifications WHERE person_id = $1
  `, [ownerId]);
  records.push(...certs.map(c => ({
    table: 'certification' as const,
    id: c.id,
    title: c.title,
    description: `Issued by ${c.issuer}`,
    skills: Array.isArray(c.skills) ? c.skills : [],
    highlights: [],
    dates: { start: c.issue_date, end: null, current: false },
    verification_status: c.verification_status,
    source_metadata: { issuer: c.issuer, category: c.category, credential_id: c.credential_id, credential_url: c.credential_url, file_url: c.file_url },
  })));

  // Claims
  const claims = await query<any>(`
    SELECT id, claim_text as statement, claim_type, confidence_level, justification, source_entity_type, source_entity_id
    FROM claim WHERE is_active = TRUE
  `, []);
  records.push(...claims.map(c => ({
    table: 'claim' as const,
    id: c.id,
    title: c.claim_type || 'Technical Claim',
    description: c.statement,
    skills: [],
    highlights: [c.justification || ''],
    dates: { start: null, end: null, current: true },
    verification_status: c.confidence_level,
    source_metadata: { claim_type: c.claim_type, source_entity_type: c.source_entity_type, source_entity_id: c.source_entity_id },
  })));

  // CV References
  const refs = await query<any>(`
    SELECT id, name, role, organization, email, phone
    FROM cv_references WHERE person_id = $1
  `, [ownerId]);
  records.push(...refs.map(r => ({
    table: 'cv_reference' as const,
    id: r.id,
    title: `Reference: ${r.name}`,
    description: `${r.role} at ${r.organization}`,
    skills: [],
    highlights: [],
    dates: { start: null, end: null, current: true },
    verification_status: 'VERIFIED',
    source_metadata: { role: r.role, organization: r.organization, email: r.email, phone: r.phone },
  })));

  // Recommendations
  const recs = await query<any>(`
    SELECT id, title, issuer
    FROM recommendations WHERE person_id = $1
  `, [ownerId]);
  records.push(...recs.map(r => ({
    table: 'recommendation' as const,
    id: r.id,
    title: r.title,
    description: `Recommended by ${r.issuer}`,
    skills: [],
    highlights: [],
    dates: { start: null, end: null, current: true },
    verification_status: 'VERIFIED',
    source_metadata: { issuer: r.issuer },
  })));

  return records;
}

/**
 * Match a single requirement against all professional records
 */
function matchRequirement(
  requirement: { id: number; category: string; requirement_text: string; is_mandatory: boolean },
  records: ProfessionalRecord[]
): MatchDetail[] {
  const matches: MatchDetail[] = [];
  const reqLower = requirement.requirement_text.toLowerCase();
  const reqKeywords = extractKeywords(reqLower);

  for (const record of records) {
    // Build searchable text from record
    const recordText = buildRecordSearchText(record);
    const recordKeywords = extractKeywords(recordText);

    // Calculate various similarity signals
    const keywordOverlap = calculateKeywordOverlap(reqKeywords, recordKeywords);
    const categoryMatch = checkCategoryMatch(requirement.category, record);
    const semanticScore = calculateSemanticSimilarity(reqLower, recordText);

    // Determine match class based on signals
    const matchClass = determineMatchClass(
      keywordOverlap,
      categoryMatch,
      semanticScore,
      record.verification_status,
      requirement.is_mandatory
    );

    if (matchClass !== 'NO_EVIDENCE') {
      matches.push({
        source_table: record.table,
        source_id: record.id,
        match_class: matchClass,
        evidence: {
          keywords_matched: [...keywordOverlap.matched],
          record_keywords: Array.from(recordKeywords).slice(0, 20),
          category_match: categoryMatch,
          semantic_score: semanticScore,
          verification_status: record.verification_status,
        },
        reason: generateMatchReason(matchClass, keywordOverlap, categoryMatch, record, requirement),
        confidence: calculateConfidence(matchClass, keywordOverlap, semanticScore, record.verification_status),
      });
    }
  }

  // Sort by match class priority, then confidence
  matches.sort((a, b) => {
    const classOrder = { STRONG: 0, PARTIAL: 1, TRANSFERABLE: 2, REQUIRES_VERIFICATION: 3, NO_EVIDENCE: 4 };
    if (classOrder[a.match_class] !== classOrder[b.match_class]) {
      return classOrder[a.match_class] - classOrder[b.match_class];
    }
    return b.confidence - a.confidence;
  });

  // Limit to top 5 matches per requirement
  return matches.slice(0, 5);
}

/**
 * Build searchable text from a professional record
 */
function buildRecordSearchText(record: ProfessionalRecord): string {
  const parts: string[] = [
    record.title,
    record.description || '',
    ...record.skills,
    ...record.highlights,
    JSON.stringify(record.source_metadata),
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/**
 * Extract keywords from text (simple tokenization)
 */
function extractKeywords(text: string): Set<string> {
  const words = text
    .replace(/[^\w\s+.#-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .map(w => w.toLowerCase());
  return new Set(words);
}

/**
 * Calculate keyword overlap between requirement and record
 */
function calculateKeywordOverlap(reqKeywords: Set<string>, recordKeywords: Set<string>): {
  matched: string[];
  overlapRatio: number;
} {
  const matched = [...reqKeywords].filter(k => recordKeywords.has(k));
  const overlapRatio = reqKeywords.size > 0 ? matched.length / reqKeywords.size : 0;
  return { matched, overlapRatio };
}

/**
 * Check if requirement category aligns with record type
 */
function checkCategoryMatch(reqCategory: string, record: ProfessionalRecord): boolean {
  const categoryMap: Record<string, ProfessionalRecord['table'][]> = {
    technical_skill: ['skill', 'project', 'experience', 'certification', 'education'],
    qualification: ['education', 'certification'],
    experience: ['experience', 'project'],
    certification: ['certification', 'education'],
    responsibility: ['experience', 'project', 'claim'],
    soft_skill: ['experience', 'claim', 'cv_reference', 'recommendation'],
    other: ['education', 'experience', 'project', 'skill', 'certification', 'claim', 'cv_reference', 'recommendation'],
  };
  return (categoryMap[reqCategory] || []).includes(record.table);
}

/**
 * Simple semantic similarity (Jaccard on character n-grams for speed)
 */
function calculateSemanticSimilarity(text1: string, text2: string): number {
  const ngram = (str: string, n = 3) => {
    const grams = new Set<string>();
    for (let i = 0; i <= str.length - n; i++) grams.add(str.slice(i, i + n));
    return grams;
  };
  const g1 = ngram(text1);
  const g2 = ngram(text2);
  const intersection = [...g1].filter((x: string) => g2.has(x)).length;
  const union = g1.size + g2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Determine match class from signals
 */
function determineMatchClass(
  overlap: { matched: string[]; overlapRatio: number },
  categoryMatch: boolean,
  semanticScore: number,
  verificationStatus: string | null,
  isMandatory: boolean
): MatchClass {
  const verified = verificationStatus === 'VERIFIED';
  const highOverlap = overlap.overlapRatio >= 0.5 && overlap.matched.length >= 2;
  const mediumOverlap = overlap.overlapRatio >= 0.25 && overlap.matched.length >= 1;
  const highSemantic = semanticScore >= 0.3;

  if (highOverlap && categoryMatch && verified) return 'STRONG';
  if ((highOverlap || (mediumOverlap && highSemantic)) && categoryMatch) return 'PARTIAL';
  if (highSemantic && categoryMatch) return 'TRANSFERABLE';
  if (mediumOverlap && !verified) return 'REQUIRES_VERIFICATION';
  if (highOverlap && !categoryMatch) return 'TRANSFERABLE';

  return 'NO_EVIDENCE';
}

/**
 * Calculate confidence score (0-1)
 */
function calculateConfidence(
  matchClass: MatchClass,
  overlap: { overlapRatio: number },
  semanticScore: number,
  verificationStatus: string | null
): number {
  const verified = verificationStatus === 'VERIFIED' ? 0.15 : 0;
  const base = {
    STRONG: 0.9,
    PARTIAL: 0.7,
    TRANSFERABLE: 0.5,
    REQUIRES_VERIFICATION: 0.4,
    NO_EVIDENCE: 0,
  }[matchClass];
  return Math.min(1, base + overlap.overlapRatio * 0.1 + semanticScore * 0.1 + verified);
}

/**
 * Generate human-readable reason for the match
 */
function generateMatchReason(
  matchClass: MatchClass,
  overlap: { matched: string[]; overlapRatio: number },
  categoryMatch: boolean,
  record: ProfessionalRecord,
  requirement: { category: string; requirement_text: string }
): string {
  const keywords = overlap.matched.slice(0, 5).join(', ');
  const categoryLabel = requirement.category.replace('_', ' ');

  switch (matchClass) {
    case 'STRONG':
      return `Strong match: "${keywords}" found in ${record.table} "${record.title}" with verified evidence. Directly satisfies ${categoryLabel} requirement.`;
    case 'PARTIAL':
      return `Partial match: Some keywords (${keywords || 'related terms'}) found in ${record.table} "${record.title}". Covers part of the ${categoryLabel} requirement.`;
    case 'TRANSFERABLE':
      return `Transferable evidence: ${record.table} "${record.title}" demonstrates related ${categoryLabel} skills. May satisfy requirement through equivalent experience.`;
    case 'REQUIRES_VERIFICATION':
      return `Potential match found in ${record.table} "${record.title}", but evidence requires owner verification (status: ${record.verification_status || 'unverified'}).`;
    default:
      return `No supporting evidence found in current profile for this ${categoryLabel} requirement.`;
  }
}

/**
 * Determine overall match class for a requirement
 */
function determineOverallClass(matches: MatchDetail[], isMandatory: boolean): MatchClass {
  if (matches.length === 0) return 'NO_EVIDENCE';
  const best = matches[0].match_class;
  if (isMandatory && best === 'PARTIAL') return 'REQUIRES_VERIFICATION';
  return best;
}

/**
 * Generate recommended action for the owner
 */
function generateRecommendedAction(overallClass: MatchClass, isMandatory: boolean, matches: MatchDetail[]): string {
  switch (overallClass) {
    case 'STRONG':
      return 'Evidence is strong. Include in application.';
    case 'PARTIAL':
      return isMandatory
        ? 'Partial evidence. Consider adding supporting detail or supplementary experience.'
        : 'Good supporting evidence. Include in application.';
    case 'TRANSFERABLE':
      return 'Transferable experience identified. Frame it explicitly in the application to show relevance.';
    case 'REQUIRES_VERIFICATION':
      return 'Evidence needs verification. Please confirm or provide additional documentation.';
    case 'NO_EVIDENCE':
      return isMandatory
        ? 'Mandatory requirement with no supporting evidence. Consider acquiring this qualification or noting as gap.'
        : 'No evidence found. Optional - may omit or address in cover letter.';
  }
}

/**
 * Persist matches to database
 */
async function persistMatches(context: MatchingContext, results: MatchResult[]): Promise<void> {
  for (const result of results) {
    for (const match of result.matches) {
      await query(
        `INSERT INTO application_evidence_match (
          application_id, requirement_id, source_table, source_id, match_class,
          evidence_json, reason, recommended_action, verified_by_owner, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, FALSE, NOW(), NOW())
        ON CONFLICT (application_id, requirement_id, source_table, source_id) DO UPDATE SET
          match_class = EXCLUDED.match_class,
          evidence_json = EXCLUDED.evidence_json,
          reason = EXCLUDED.reason,
          recommended_action = EXCLUDED.recommended_action,
          updated_at = NOW()`,
        [
          context.applicationId,
          result.requirement_id,
          match.source_table,
          match.source_id,
          match.match_class,
          JSON.stringify(match.evidence),
          match.reason,
          result.recommended_action,
        ]
      );
    }
  }
}

/**
 * Get existing matches for an application (for UI display)
 */
export async function getMatchesForApplication(applicationId: number): Promise<{
  requirement_id: number;
  requirement_text: string;
  is_mandatory: boolean;
  matches: (ApplicationEvidenceMatch & { source_title: string })[];
}[]> {
  const rows = await query<any>(`
    SELECT
      jem.*,
      jr.requirement_text,
      jr.is_mandatory,
      jr.category
    FROM application_evidence_match jem
    JOIN job_requirement jr ON jr.id = jem.requirement_id
    WHERE jem.application_id = $1
    ORDER BY jr.is_mandatory DESC, jr.category, jem.match_class
  `, [applicationId]);

  // Group by requirement
  const grouped = new Map<number, any>();
  for (const row of rows) {
    if (!grouped.has(row.requirement_id)) {
      grouped.set(row.requirement_id, {
        requirement_id: row.requirement_id,
        requirement_text: row.requirement_text,
        is_mandatory: row.is_mandatory,
        matches: [],
      });
    }
    grouped.get(row.requirement_id).matches.push({
      ...row,
      source_title: await getSourceTitle(row.source_table, row.source_id),
    });
  }

  return Array.from(grouped.values());
}

async function getSourceTitle(table: string, id: number): Promise<string> {
  const columnMap: Record<string, string> = {
    education: 'degree',
    experience: 'title',
    project: 'title',
    skill: 'name',
    certification: 'title',
    claim: 'claim_text',
    cv_reference: 'name',
    recommendation: 'title',
  };
  const col = columnMap[table] || 'id';
  const rows = await query<{val: string}>(`SELECT ${col} as val FROM ${table} WHERE id = $1 LIMIT 1`, [id]);
  return rows[0]?.val || `${table}:${id}`;
}