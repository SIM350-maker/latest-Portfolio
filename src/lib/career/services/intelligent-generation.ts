// Intelligent Document Generation Service
// Evidence-grounded, AI-powered document generation with human-in-the-loop

import { createAIProvider, type AIProvider, type StructuredCompletionParams, type JSONSchema } from "./ai-provider";
import { getAutomationSettings } from "../automation-settings";
import { runEvidenceMatching, type MatchResult } from "./evidence-matching";
import { getJobAdvert } from "../job-advert";
import { getJobRequirementsByAdvert } from "../job-requirement";
import { fetchAllProfessionalRecords, type ProfessionalRecord } from "./evidence-matching";

export interface GenerationContext {
  ownerId: number;
  applicationId: number;
  advertId: number;
  mode: 'FULL' | 'SECTION';
  sectionId?: string;
  existingContent?: any;
}

export interface CVGenerationResult {
  content: any;
  provenance: {
    sources: Array<{ table: string; id: number; field: string }>;
    aiGenerated: boolean;
    generatedAt: string;
    model: string;
    sectionSources: Record<string, Array<{ table: string; id: number }>>;
  };
  unverifiedCount: number;
}

export interface CoverLetterResult {
  content: string;
  provenance: {
    sources: Array<{ table: string; id: number; field: string }>;
    aiGenerated: boolean;
    generatedAt: string;
    model: string;
  };
  unverifiedCount: number;
}

export interface EmailResult {
  subject: string;
  body: string;
  provenance: {
    sources: Array<{ table: string; id: number; field: string }>;
    aiGenerated: boolean;
    generatedAt: string;
    model: string;
  };
}

/**
 * Get AI provider from settings
 */
async function getAIProvider(ownerId: number): Promise<AIProvider | null> {
  const settings = await getAutomationSettings(ownerId);
  if (!settings?.ai_provider || !settings.ai_model) return null;
  
  const apiKey = process.env[`${settings.ai_provider.toUpperCase()}_API_KEY`] || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  
  return createAIProvider({
    name: settings.ai_provider,
    model: settings.ai_model,
    baseUrl: settings.ai_base_url || undefined,
    apiKey,
  });
}

/**
 * Build context for generation from professional records and matches
 */
async function buildGenerationContext(context: GenerationContext): Promise<{
  profile: ProfessionalRecord[];
  matches: MatchResult[];
  vacancy: any;
  requirements: any[];
}> {
  const [profile, matches, advert, requirements] = await Promise.all([
    fetchAllProfessionalRecords(context.ownerId),
    runEvidenceMatching({ ownerId: context.ownerId, advertId: context.advertId, applicationId: context.applicationId }),
    getJobAdvert(context.advertId),
    getJobRequirementsByAdvert(context.advertId),
  ]);

  return {
    profile,
    matches,
    vacancy: advert?.extracted_json || advert?.analysis_json || {},
    requirements,
  };
}

/**
 * Generate CV using AI with evidence grounding
 */
export async function generateCVIntelligent(context: GenerationContext): Promise<CVGenerationResult> {
  const aiProvider = await getAIProvider(context.ownerId);
  const genContext = await buildGenerationContext(context);

  if (!aiProvider) {
    // Fallback to deterministic template-based generation
    return generateCVDeterministic(genContext);
  }

  try {
    // Prepare evidence summary for the prompt
    const evidenceSummary = buildEvidenceSummary(genContext.matches, genContext.profile);
    const vacancySummary = formatVacancyForPrompt(genContext.vacancy);
    const existingContent = context.existingContent || null;

    const systemPrompt = `You are an expert CV writer. Generate a professional, ATS-friendly CV tailored to the specific job vacancy.
Use ONLY the provided professional evidence. Do not invent qualifications, employers, dates, or achievements.
Every factual claim must be traceable to the supplied evidence records.
Mark any section where evidence is insufficient as needing owner verification.
Return structured JSON matching the CV schema.`;

    const userPrompt = `JOB VACANCY:
${vacancySummary}

PROFESSIONAL EVIDENCE:
${evidenceSummary}

${existingContent ? `EXISTING CV CONTENT (preserve approved sections):\n${JSON.stringify(existingContent, null, 2)}` : ''}

INSTRUCTIONS:
1. Generate a complete CV with sections: contact, headline, summary, skills, experience, education, projects, certifications
2. For each entry, include: title, subtitle, meta, date, bullets[], evidenceRefs[]
3. evidenceRefs must reference the source records from the evidence summary (format: {table: "...", id: ...})
4. If evidence is missing for a required skill/qualification, include the entry but mark with evidenceRefs: [] and add "UNVERIFIED" flag in bullets
5. Tailor language to match vacancy keywords
6. Keep professional, concise, achievement-oriented tone
7. Return valid JSON only`;

    const schema: JSONSchema = {
      type: 'object',
      properties: {
        contact: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, location: { type: 'string' }, linkedin: { type: 'string' }, github: { type: 'string' }, portfolio: { type: 'string' } } },
        headline: { type: 'string' },
        summary: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['skills', 'experience', 'education', 'projects', 'certifications', 'custom'] },
              title: { type: 'string' },
              visible: { type: 'boolean' },
              order: { type: 'number' },
              entries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    subtitle: { type: 'string' },
                    meta: { type: 'string' },
                    date: { type: 'string' },
                    bullets: { type: 'array', items: { type: 'string' } },
                    evidenceRefs: { type: 'array', items: { type: 'object', properties: { table: { type: 'string' }, id: { type: 'number' } } } },
                  },
                },
              },
            },
          },
        },
      },
      required: ['contact', 'sections'],
      additionalProperties: false,
    };

    const params: StructuredCompletionParams<any> = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      schema,
      temperature: 0.2,
      maxTokens: 6000,
    };

    const result = await aiProvider.structuredCompletion(params);
    
    // Calculate provenance
    const provenance = calculateProvenance(result.data, genContext.matches);
    const unverifiedCount = countUnverified(result.data);

    return {
      content: result.data,
      provenance: {
        ...provenance,
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        model: result.model,
      },
      unverifiedCount,
    };
  } catch (error) {
    console.warn('AI CV generation failed, falling back to deterministic:', error);
    return generateCVDeterministic(genContext);
  }
}

/**
 * Generate cover letter using AI
 */
export async function generateCoverLetterIntelligent(context: GenerationContext): Promise<CoverLetterResult> {
  const aiProvider = await getAIProvider(context.ownerId);
  const genContext = await buildGenerationContext(context);

  if (!aiProvider) {
    return generateCoverLetterDeterministic(genContext);
  }

  try {
    const evidenceSummary = buildEvidenceSummary(genContext.matches, genContext.profile);
    const vacancySummary = formatVacancyForPrompt(genContext.vacancy);

    const systemPrompt = `You are an expert cover letter writer. Generate a tailored, professional cover letter that connects the candidate's genuine experience to the employer's stated requirements.
Use ONLY the provided professional evidence. Do not invent relationships with the hiring manager, company research, or achievements.
Address the employer by name if available. Reference specific requirements from the vacancy.
Return plain text only (no JSON).`;

    const userPrompt = `EMPLOYER: ${genContext.vacancy?.employer || 'Hiring Manager'}
POSITION: ${genContext.vacancy?.title || 'the position'}
COMPANY: ${genContext.vacancy?.employer || 'your organization'}

VACANCY REQUIREMENTS:
${vacancySummary}

CANDIDATE EVIDENCE:
${evidenceSummary}

Write a compelling cover letter (3-4 paragraphs) that:
1. Opens with the specific position and company
2. Connects 2-3 key experiences/skills directly to the top requirements
3. Shows genuine enthusiasm without fabrication
4. Closes professionally with call to action`;

    const result = await aiProvider.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      maxTokens: 1500,
    });

    const provenance = calculateCoverLetterProvenance(result.content, genContext.matches);
    
    return {
      content: result.content,
      provenance: {
        ...provenance,
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        model: result.model,
      },
      unverifiedCount: 0, // Cover letters are narrative, harder to quantify
    };
  } catch (error) {
    console.warn('AI cover letter generation failed, falling back:', error);
    return generateCoverLetterDeterministic(genContext);
  }
}

/**
 * Generate application email using AI
 */
export async function generateEmailIntelligent(context: GenerationContext): Promise<EmailResult> {
  const aiProvider = await getAIProvider(context.ownerId);
  const genContext = await buildGenerationContext(context);

  if (!aiProvider) {
    return generateEmailDeterministic(genContext);
  }

  try {
    const evidenceSummary = buildEvidenceSummary(genContext.matches, genContext.profile);
    const vacancySummary = formatVacancyForPrompt(genContext.vacancy);
    const recipientEmail = genContext.vacancy?.recruitment_email || genContext.vacancy?.hiring_manager || 'hiring manager';

    const systemPrompt = `You are an expert at writing professional job application emails. Generate a concise, polite email that references the position, attaches documents, and provides contact info.`;

    const userPrompt = `TO: ${recipientEmail}
POSITION: ${genContext.vacancy?.title || 'the advertised position'}
EMPLOYER: ${genContext.vacancy?.employer || 'your company'}

VACANCY: ${vacancySummary}

Write a professional application email with:
- Appropriate subject line
- Professional greeting
- Brief introduction (2-3 sentences max)
- Reference to attached CV and cover letter
- Professional closing with contact info
Return as plain text with clear subject line.`;

    const result = await aiProvider.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      maxTokens: 800,
    });

    // Parse subject and body
    const lines = result.content.split('\n');
    const subjectLine = lines.find(l => l.toLowerCase().startsWith('subject:')) || `Application for ${genContext.vacancy?.title || 'Position'}`;
    const subject = subjectLine.replace(/^subject:\s*/i, '').trim();
    const body = lines.filter(l => !l.toLowerCase().startsWith('subject:')).join('\n').trim();

    return {
      subject,
      body,
      provenance: {
        sources: genContext.matches.flatMap(m => m.matches.map(mm => ({ table: mm.source_table, id: mm.source_id, field: 'evidence' }))),
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        model: result.model,
      },
    };
  } catch (error) {
    console.warn('AI email generation failed, falling back:', error);
    return generateEmailDeterministic(genContext);
  }
}

/**
 * Deterministic fallback generators
 */
function generateCVDeterministic(genContext: any): CVGenerationResult {
  const content = buildCVFromEvidence(genContext.profile, genContext.matches, genContext.vacancy);
  const provenance = calculateProvenance(content, genContext.matches);
  return { content, provenance: { ...provenance, aiGenerated: false, generatedAt: new Date().toISOString(), model: 'deterministic' }, unverifiedCount: countUnverified(content) };
}

function generateCoverLetterDeterministic(genContext: any): CoverLetterResult {
  const employer = genContext.vacancy?.employer || 'Hiring Manager';
  const title = genContext.vacancy?.title || 'the position';
  const topMatches = genContext.matches.filter((m: any) => m.matches.some((mm: any) => mm.match_class === 'STRONG')).slice(0, 3);
  
  let content = `Dear ${employer},\n\n`;
  content += `I am writing to express my interest in the ${title} position at ${employer}. `;
  
  if (topMatches.length > 0) {
    const fields = topMatches.map((m: any) => m.matches[0]?.source_table || 'relevant field').join(', ');
    const reqs = topMatches.map((m: any) => m.requirement_text).join(', ');
    const topReqs = topMatches.map((m: any) => m.requirement_text).slice(0, 2).join(' and ');
    
    content += `With my background in ${fields}, I believe I can contribute significantly to your team.\n\n`;
    content += `In particular, my experience with ${reqs} aligns closely with your requirements for ${topReqs}.\n\n`;
  } else {
    content += `My professional experience and qualifications make me a strong candidate for this role.\n\n`;
  }
  
  content += `I have attached my CV and cover letter for your review. I would welcome the opportunity to discuss how my skills and experience align with your needs.\n\n`;
  content += `Thank you for your time and consideration.\n\n`;
  content += `Sincerely,\n[Your Name]`;

  return { content, provenance: { sources: [], aiGenerated: false, generatedAt: new Date().toISOString(), model: 'deterministic' }, unverifiedCount: 0 };
}

function generateEmailDeterministic(genContext: any): EmailResult {
  const title = genContext.vacancy?.title || 'the position';
  const employer = genContext.vacancy?.employer || 'your company';
  const recipient = genContext.vacancy?.recruitment_email || 'hiring manager';
  
  return {
    subject: `Application for ${title} - ${(genContext.profile[0] as any)?.title || 'Candidate'}`,
    body: `Dear ${recipient},\n\nPlease find attached my application for the ${title} position at ${employer}.\n\nMy CV and cover letter are attached for your review. I believe my background in ${genContext.profile.slice(0,3).map((p: any) => p.table).join(', ')} makes me a strong candidate for this role.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]\n[Phone]\n[Email]`,
    provenance: { sources: [], aiGenerated: false, generatedAt: new Date().toISOString(), model: 'deterministic' },
  };
}

/**
 * Build evidence summary for prompt
 */
function buildEvidenceSummary(matches: any[], profile: any[]): string {
  let summary = '';
  for (const match of matches) {
    if (match.matches.length === 0) continue;
    summary += `\nREQUIREMENT: ${match.requirement_text} (${match.is_mandatory ? 'Mandatory' : 'Preferred'})\n`;
    for (const m of match.matches.slice(0, 3)) {
      const record = profile.find((p: any) => p.table === m.source_table && p.id === m.source_id);
      if (record) {
        summary += `  - ${m.match_class}: ${record.title} — ${m.reason}\n`;
        if (record.skills.length) summary += `    Skills: ${record.skills.slice(0,5).join(', ')}\n`;
        if (record.highlights.length) summary += `    Highlights: ${record.highlights.slice(0,3).join('; ')}\n`;
      }
    }
  }
  return summary || 'No matching evidence found.';
}

/**
 * Format vacancy for prompt
 */
function formatVacancyForPrompt(vacancy: any): string {
  const parts = [];
  if (vacancy?.employer) parts.push(`Employer: ${vacancy.employer}`);
  if (vacancy?.title) parts.push(`Position: ${vacancy.title}`);
  if (vacancy?.location) parts.push(`Location: ${vacancy.location}`);
  if (vacancy?.employment_type) parts.push(`Type: ${vacancy.employment_type}`);
  if (vacancy?.required_technical_skills?.length) parts.push(`Required Skills: ${vacancy.required_technical_skills.join(', ')}`);
  if (vacancy?.preferred_technical_skills?.length) parts.push(`Preferred Skills: ${vacancy.preferred_technical_skills.join(', ')}`);
  if (vacancy?.essential_qualifications?.length) parts.push(`Essential Qualifications: ${vacancy.essential_qualifications.join(', ')}`);
  if (vacancy?.experience_requirements?.length) parts.push(`Experience: ${vacancy.experience_requirements.join(', ')}`);
  if (vacancy?.responsibilities?.length) parts.push(`Responsibilities: ${vacancy.responsibilities.join('; ')}`);
  return parts.join('\n');
}

/**
 * Build CV from evidence (deterministic)
 */
function buildCVFromEvidence(profile: any[], matches: any[], vacancy: any): any {
  // Simplified deterministic CV builder
  const name = profile.find(p => p.table === 'experience')?.source_metadata?.organization || 'Candidate';
  
  return {
    contact: { name, email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
    headline: vacancy?.title || 'Professional',
    summary: `Experienced professional with background in ${profile.slice(0,3).map(p => p.table).join(', ')}.`,
    sections: [
      { type: 'skills', title: 'Technical Skills', visible: true, order: 1, entries: [{ id: 's1', title: 'Core Skills', bullets: profile.flatMap(p => p.skills).slice(0,10), evidenceRefs: [] }] },
      { type: 'experience', title: 'Professional Experience', visible: true, order: 2, entries: profile.filter(p => p.table === 'experience').map((p, i) => ({ id: `e${i}`, title: p.title, subtitle: p.source_metadata.company, meta: p.source_metadata.location, date: `${p.dates.start} - ${p.dates.current ? 'Present' : p.dates.end}`, bullets: p.highlights, evidenceRefs: [{ table: 'experience', id: p.id }] })) },
      { type: 'education', title: 'Education', visible: true, order: 3, entries: profile.filter(p => p.table === 'education').map((p, i) => ({ id: `ed${i}`, title: p.title, subtitle: p.source_metadata.institution, meta: p.source_metadata.degree, date: `${p.dates.start} - ${p.dates.end}`, bullets: [], evidenceRefs: [{ table: 'education', id: p.id }] })) },
      { type: 'projects', title: 'Projects', visible: true, order: 4, entries: profile.filter(p => p.table === 'project').map((p, i) => ({ id: `pr${i}`, title: p.title, meta: p.source_metadata.roles, bullets: p.highlights, evidenceRefs: [{ table: 'project', id: p.id }] })) },
      { type: 'certifications', title: 'Certifications', visible: true, order: 5, entries: profile.filter(p => p.table === 'certification').map((p, i) => ({ id: `c${i}`, title: p.title, subtitle: p.source_metadata.issuer, meta: p.source_metadata.category, date: p.dates.start, bullets: [], evidenceRefs: [{ table: 'certification', id: p.id }] })) },
    ],
  };
}

/**
 * Calculate provenance metadata
 */
function calculateProvenance(content: any, matches: MatchResult[]) {
  const sources: Array<{ table: string; id: number; field: string }> = [];
  const sectionSources: Record<string, Array<{ table: string; id: number }>> = {};
  
  for (const section of content.sections || []) {
    for (const entry of section.entries || []) {
      for (const ref of entry.evidenceRefs || []) {
        sources.push({ table: ref.table, id: ref.id, field: entry.title });
        if (!sectionSources[section.title]) sectionSources[section.title] = [];
        sectionSources[section.title].push({ table: ref.table, id: ref.id });
      }
    }
  }
  
  return { sources, sectionSources };
}

function calculateCoverLetterProvenance(content: string, matches: MatchResult[]) {
  return { sources: matches.flatMap(m => m.matches.map(mm => ({ table: mm.source_table, id: mm.source_id, field: 'evidence' }))) };
}

function countUnverified(content: any): number {
  let count = 0;
  for (const section of content.sections || []) {
    for (const entry of section.entries || []) {
      if ((entry.evidenceRefs || []).length === 0 && (entry.bullets || []).some((b: string) => b.includes('UNVERIFIED'))) {
        count++;
      }
    }
  }
  return count;
}