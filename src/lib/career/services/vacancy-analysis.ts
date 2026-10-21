// Vacancy Analysis Service
// Deterministic rule-based parser + optional AI enrichment

import { createAIProvider, type AIProvider, type StructuredCompletionParams } from "./ai-provider";
import { getAutomationSettings } from "../automation-settings";

export interface ExtractedVacancy {
  employer: string | null;
  title: string | null;
  department: string | null;
  location: string | null;
  work_arrangement: 'remote' | 'hybrid' | 'onsite' | null;
  reference_number: string | null;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary' | null;
  description: string | null;
  responsibilities: string[];
  essential_qualifications: string[];
  preferred_qualifications: string[];
  required_technical_skills: string[];
  preferred_technical_skills: string[];
  experience_requirements: string[];
  certifications: string[];
  required_documents: string[];
  deadline: string | null;
  hiring_manager: string | null;
  recruitment_email: string | null;
  application_instructions: string | null;
  source_url: string | null;
  source_date: string | null;
}

export interface VacancyRequirement {
  category: 'technical_skill' | 'qualification' | 'experience' | 'certification' | 'responsibility' | 'soft_skill' | 'other';
  text: string;
  is_mandatory: boolean;
  source_span: { start: number; end: number; context: string };
  confidence: number;
}

const VACANCY_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    employer: { type: 'string' },
    title: { type: 'string' },
    department: { type: 'string' },
    location: { type: 'string' },
    work_arrangement: { type: 'string', enum: ['remote', 'hybrid', 'onsite', ''] },
    reference_number: { type: 'string' },
    employment_type: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'internship', 'temporary', ''] },
    description: { type: 'string' },
    responsibilities: { type: 'array', items: { type: 'string' } },
    essential_qualifications: { type: 'array', items: { type: 'string' } },
    preferred_qualifications: { type: 'array', items: { type: 'string' } },
    required_technical_skills: { type: 'array', items: { type: 'string' } },
    preferred_technical_skills: { type: 'array', items: { type: 'string' } },
    experience_requirements: { type: 'array', items: { type: 'string' } },
    certifications: { type: 'array', items: { type: 'string' } },
    required_documents: { type: 'array', items: { type: 'string' } },
    deadline: { type: 'string' },
    hiring_manager: { type: 'string' },
    recruitment_email: { type: 'string' },
    application_instructions: { type: 'string' },
  },
  required: [],
  additionalProperties: false,
} as const;

function getAIProviderFromSettings(ownerId: number): Promise<AIProvider | null> {
  return getAutomationSettings(ownerId).then(settings => {
    if (!settings?.ai_provider || !settings.ai_model) return null;
    const apiKey = process.env[`${settings.ai_provider.toUpperCase()}_API_KEY`] || process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    return createAIProvider({
      name: settings.ai_provider,
      model: settings.ai_model,
      baseUrl: settings.ai_base_url || undefined,
      apiKey,
    });
  });
}

// Deterministic rule-based extraction (works without AI)
export function extractVacancyDeterministic(text: string): ExtractedVacancy {
  const lower = text.toLowerCase();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const result: ExtractedVacancy = {
    employer: null,
    title: null,
    department: null,
    location: null,
    work_arrangement: null,
    reference_number: null,
    employment_type: null,
    description: null,
    responsibilities: [],
    essential_qualifications: [],
    preferred_qualifications: [],
    required_technical_skills: [],
    preferred_technical_skills: [],
    experience_requirements: [],
    certifications: [],
    required_documents: [],
    deadline: null,
    hiring_manager: null,
    recruitment_email: null,
    application_instructions: null,
    source_url: null,
    source_date: null,
  };

  // Email extraction
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) result.recruitment_email = emailMatch[0];

  // Reference number patterns
  const refPatterns = [
    /(?:ref|reference|job\s*(?:id|#|number))\s*[:\-]\s*([A-Z0-9\-]+)/i,
    /(?:vacancy|position)\s*(?:id|#|number)\s*[:\-]\s*([A-Z0-9\-]+)/i,
  ];
  for (const p of refPatterns) {
    const m = text.match(p);
    if (m) { result.reference_number = m[1]; break; }
  }

  // Work arrangement
  if (/\bremote\b/i.test(text) && !/\bhybrid\b/i.test(text)) result.work_arrangement = 'remote';
  else if (/\bhybrid\b/i.test(text)) result.work_arrangement = 'hybrid';
  else if (/\bonsite\b/i.test(text) || /\bon.site\b/i.test(text) || /\bin.?office\b/i.test(text)) result.work_arrangement = 'onsite';

  // Employment type
  if (/\bfull.?time\b/i.test(text)) result.employment_type = 'full-time';
  else if (/\bpart.?time\b/i.test(text)) result.employment_type = 'part-time';
  else if (/\bcontract\b/i.test(text)) result.employment_type = 'contract';
  else if (/\bintern\b/i.test(text)) result.employment_type = 'internship';
  else if (/\btemp(?:orary)?\b/i.test(text)) result.employment_type = 'temporary';

  // Deadline patterns
  const deadlinePatterns = [
    /(?:deadline|closing|apply\s+by)\s*[:\-]\s*([^\n]+)/i,
    /(?:by|before)\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
  ];
  for (const p of deadlinePatterns) {
    const m = text.match(p);
    if (m) { result.deadline = m[1].trim(); break; }
  }

  // Section-based extraction
  const sections = splitIntoSections(text);
  for (const [heading, content] of Object.entries(sections)) {
    const h = heading.toLowerCase();
    const items = content.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

    if (h.includes('responsib') || h.includes('dut') || h.includes('role')) {
      result.responsibilities.push(...items);
    } else if (h.includes('essential') || h.includes('require') || h.includes('must have') || h.includes('mandatory')) {
      result.essential_qualifications.push(...items);
      // Also extract skills from requirements
      for (const item of items) extractSkillsFromText(item, result.required_technical_skills);
    } else if (h.includes('prefer') || h.includes('desir') || h.includes('nice') || h.includes('asset') || h.includes('bonus')) {
      result.preferred_qualifications.push(...items);
      for (const item of items) extractSkillsFromText(item, result.preferred_technical_skills);
    } else if (h.includes('experience') || h.includes('background')) {
      result.experience_requirements.push(...items);
    } else if (h.includes('certif') || h.includes('licen')) {
      result.certifications.push(...items);
    } else if (h.includes('document') || h.includes('attach') || h.includes('submit') || h.includes('apply')) {
      result.required_documents.push(...items);
      result.application_instructions = content;
    } else if (h.includes('about') || h.includes('company') || h.includes('employer') || h.includes('who we are')) {
      if (!result.employer) result.employer = content.split('\n')[0].slice(0, 200);
    }
  }

  // Title extraction - first substantial line often contains it
  for (const line of lines.slice(0, 10)) {
    if (line.length > 5 && line.length < 120 && /(engineer|developer|manager|analyst|architect|lead|senior|junior|principal|director|head|chief)/i.test(line)) {
      result.title = line;
      break;
    }
  }

  // Location extraction
  const locationPatterns = [
    /(?:location|based in|office in)\s*[:\-]\s*([^\n,]+)/i,
    /\b(remote|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b/,
  ];
  for (const p of locationPatterns) {
    const m = text.match(p);
    if (m) { result.location = m[1]?.trim() || m[0]; break; }
  }

  // Description = largest text block that isn't a list
  const blocks = text.split('\n\n').map(b => b.trim()).filter(b => b.length > 100);
  if (blocks.length > 0) {
    result.description = blocks.reduce((a, b) => a.length > b.length ? a : b).slice(0, 5000);
  }

  // Deduplicate arrays
  for (const key of Object.keys(result) as (keyof ExtractedVacancy)[]) {
    const val = result[key];
    if (Array.isArray(val)) {
      const strArray = val as string[];
      const deduped = Array.from(new Set(strArray.map(v => v.trim()))).filter(Boolean);
      (result as any)[key] = deduped;
    }
  }

  return result;
}

function splitIntoSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = text.split('\n');
  let currentHeading = 'general';
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Heuristic: heading = short line, ends with :, or all caps, or followed by list items
    const isHeading = trimmed.length > 0 && trimmed.length < 80 &&
      (trimmed.endsWith(':') || trimmed === trimmed.toUpperCase() ||
       /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:?$/.test(trimmed));

    if (isHeading && currentContent.length > 0) {
      sections[currentHeading] = currentContent.join('\n');
      currentContent = [];
      currentHeading = trimmed.replace(/:$/, '');
    } else {
      currentContent.push(line);
    }
  }
  if (currentContent.length > 0) {
    sections[currentHeading] = currentContent.join('\n');
  }
  return sections;
}

function extractSkillsFromText(text: string, targetArray: string[]): void {
  // Common tech skills patterns
  const skillPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C\#|C\+\+|Go|Rust|Ruby|PHP|Swift|Kotlin|Scala)\b/gi,
    /\b(React|Vue|Angular|Svelte|Next\.js|Nuxt|Remix|Astro)\b/gi,
    /\b(Node\.js|Express|NestJS|Fastify|Django|Flask|FastAPI|Spring|Rails|Laravel|ASP\.NET)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|DynamoDB|Cassandra|SQLite)\b/gi,
    /\b(AWS|Azure|GCP|Docker|Kubernetes|Terraform|Ansible|CI\/CD|GitHub Actions|GitLab)\b/gi,
    /\b(GraphQL|REST|gRPC|WebSocket|Microservices|Serverless)\b/gi,
    /\b(Tailwind|CSS|HTML|Sass|Less|Styled Components|Emotion)\b/gi,
    /\b(Testing|Jest|Vitest|Cypress|Playwright|TDD|BDD)\b/gi,
    /\b(Git|GitHub|GitLab|Bitbucket|Jira|Confluence|Agile|Scrum|Kanban)\b/gi,
  ];

  for (const pattern of skillPatterns) {
    const matches = text.match(pattern);
    if (matches) targetArray.push(...matches);
  }
}

// AI-enhanced extraction
export async function extractVacancyWithAI(
  text: string,
  ownerId: number
): Promise<{ vacancy: ExtractedVacancy; usedAI: boolean }> {
  const aiProvider = await getAIProviderFromSettings(ownerId);

  if (!aiProvider) {
    return { vacancy: extractVacancyDeterministic(text), usedAI: false };
  }

  try {
    const prompt = `Analyze this job advertisement and extract structured information. Be precise and only extract what is explicitly stated.\n\nAdvertisement:\n${text.slice(0, 12000)}`;

    const params: StructuredCompletionParams<ExtractedVacancy> = {
      messages: [
        { role: 'system', content: 'You are a precise job advertisement analyzer. Extract only explicitly stated information. Use null for missing fields.' },
        { role: 'user', content: prompt },
      ],
      schema: VACANCY_EXTRACTION_SCHEMA as any,
      temperature: 0,
      maxTokens: 3000,
    };

    const result = await aiProvider.structuredCompletion(params);
    return { vacancy: result.data, usedAI: true };
  } catch (error) {
    console.warn('AI extraction failed, falling back to deterministic:', error);
    return { vacancy: extractVacancyDeterministic(text), usedAI: false };
  }
}

// Convert extracted vacancy to normalized requirements
export function vacancyToRequirements(vacancy: ExtractedVacancy): VacancyRequirement[] {
  const requirements: VacancyRequirement[] = [];
  let charIndex = 0;

  const addReqs = (items: string[], category: VacancyRequirement['category'], mandatory: boolean) => {
    for (const item of items) {
      const start = charIndex;
      charIndex += item.length + 1;
      requirements.push({
        category,
        text: item,
        is_mandatory: mandatory,
        source_span: { start, end: charIndex, context: item.slice(0, 200) },
        confidence: mandatory ? 0.95 : 0.7,
      });
    }
  };

  // Mandatory requirements
  addReqs(vacancy.required_technical_skills, 'technical_skill', true);
  addReqs(vacancy.essential_qualifications, 'qualification', true);
  addReqs(vacancy.experience_requirements, 'experience', true);
  addReqs(vacancy.certifications, 'certification', true);

  // Preferred requirements
  addReqs(vacancy.preferred_technical_skills, 'technical_skill', false);
  addReqs(vacancy.preferred_qualifications, 'qualification', false);

  // Responsibilities (neither mandatory nor preferred - they're expectations)
  for (const resp of vacancy.responsibilities) {
    const start = charIndex;
    charIndex += resp.length + 1;
    requirements.push({
      category: 'responsibility',
      text: resp,
      is_mandatory: false,
      source_span: { start, end: charIndex, context: resp.slice(0, 200) },
      confidence: 0.8,
    });
  }

  // Required documents
  for (const doc of vacancy.required_documents) {
    const start = charIndex;
    charIndex += doc.length + 1;
    requirements.push({
      category: 'other',
      text: `Required document: ${doc}`,
      is_mandatory: true,
      source_span: { start, end: charIndex, context: doc },
      confidence: 0.9,
    });
  }

  return requirements;
}

// Public API
export async function analyzeJobAdvert(
  rawText: string,
  ownerId: number
): Promise<{ vacancy: ExtractedVacancy; requirements: VacancyRequirement[]; usedAI: boolean }> {
  const { vacancy, usedAI } = await extractVacancyWithAI(rawText, ownerId);
  const requirements = vacancyToRequirements(vacancy);
  return { vacancy, requirements, usedAI };
}