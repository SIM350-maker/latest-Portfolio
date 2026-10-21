// ATS Analysis and Document Quality Engine
// Evaluates job adverts and generated CVs for ATS readability and relevance

import { extractPDFText } from "./pdf-extract";
import { runEvidenceMatching, type MatchResult } from "./evidence-matching";

export interface JobAnalysisResult {
  requiredKeywords: string[];
  preferredKeywords: string[];
  technicalSkills: string[];
  qualifications: string[];
  experienceExpectations: string[];
  responsibilities: string[];
  applicationRequirements: string[];
  mandatoryVsPreferred: { mandatory: string[]; preferred: string[] };
  terminology: string[];
}

export interface CVAnalysisResult {
  structureScore: number;
  sectionsFound: string[];
  sectionsMissing: string[];
  contactInfoComplete: boolean;
  skillCoverage: { covered: string[]; missing: string[]; partial: string[] };
  experienceEvidence: { evidenced: string[]; claimed: string[]; missing: string[] };
  educationRelevance: { relevant: string[]; missing: string[] };
  keywordAlignment: { included: string[]; missing: string[]; density: number };
  formattingWarnings: string[];
  dateConsistency: boolean;
  duplicateContent: boolean;
  unsubstantiatedClaims: string[];
  missingRequestedSections: string[];
  pdfTextExtraction: { extractable: boolean; readingOrder: boolean; textLength: number };
}

export interface MatchingReport {
  requirements: Array<{
    requirement: string;
    category: string;
    mandatory: boolean;
    supported: boolean;
    partiallySupported: boolean;
    unsupported: boolean;
    evidenceCount: number;
    topEvidence: string;
  }>;
  keywordsIncluded: string[];
  keywordsMissing: string[];
  improvements: string[];
  formattingWarnings: string[];
  score: {
    overall: number;
    keywordCoverage: number;
    evidenceCoverage: number;
    structureQuality: number;
    formatCompliance: number;
  };
  limitations: string[];
}

/**
 * Analyze job description for ATS-relevant elements
 */
export async function analyzeJobDescription(text: string): Promise<JobAnalysisResult> {
  const lower = text.toLowerCase();
  
  // Extract mandatory vs preferred requirements
  const mandatoryKeywords = extractSectionKeywords(text, ['required', 'must have', 'essential', 'mandatory', 'minimum', 'need']);
  const preferredKeywords = extractSectionKeywords(text, ['preferred', 'desired', 'nice to have', 'bonus', 'asset', 'advantage', 'plus']);
  
  // Technical skills
  const technicalSkills = extractTechnicalSkills(text);
  
  // Qualifications
  const qualifications = extractQualifications(text);
  
  // Experience expectations
  const experienceExpectations = extractExperience(text);
  
  // Responsibilities
  const responsibilities = extractResponsibilities(text);
  
  // Application requirements
  const applicationRequirements = extractApplicationRequirements(text);
  
  // General terminology
  const terminology = extractTerminology(text);
  
  return {
    requiredKeywords: mandatoryKeywords,
    preferredKeywords: preferredKeywords,
    technicalSkills,
    qualifications,
    experienceExpectations,
    responsibilities,
    applicationRequirements,
    mandatoryVsPreferred: {
      mandatory: mandatoryKeywords,
      preferred: preferredKeywords,
    },
    terminology,
  };
}

function extractSectionKeywords(text: string, triggers: string[]): string[] {
  const keywords = new Set<string>();
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const hasTrigger = triggers.some(t => line.includes(t));
    
    if (hasTrigger) {
      // Extract keywords from this line and following lines
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const words = extractSkillTokens(lines[j]);
        words.forEach(w => keywords.add(w));
      }
    }
  }
  
  return Array.from(keywords).slice(0, 50);
}

function extractSkillTokens(text: string): string[] {
  // Tokenize and filter for skill-like terms
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s+.#-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !/^(the|and|for|with|you|your|our|are|have|has|will|can|must|should|will|experience|years|skills|knowledge|understanding|ability|proficient|strong|excellent|good|solid|deep|broad)$/.test(w));
  
  return tokens;
}

function extractTechnicalSkills(text: string): string[] {
  const skillPatterns = [
    /\b(JavaScript|TypeScript|Python|Java|C#|C\+\+|Go|Rust|Ruby|PHP|Swift|Kotlin|Scala)\b/gi,
    /\b(React|Vue|Angular|Svelte|Next\.js|Nuxt|Remix|Astro)\b/gi,
    /\b(Node\.js|Express|NestJS|Fastify|Django|Flask|FastAPI|Spring|Rails|Laravel|ASP\.NET)\b/gi,
    /\b(PostgreSQL|MySQL|MongoDB|Redis|Elasticsearch|DynamoDB|Cassandra|SQLite)\b/gi,
    /\b(AWS|Azure|GCP|Docker|Kubernetes|Terraform|Ansible|CI\/CD|GitHub Actions|GitLab)\b/gi,
    /\b(GraphQL|REST|gRPC|WebSocket|Microservices|Serverless)\b/gi,
    /\b(Tailwind|CSS|HTML|Sass|Less|Styled Components|Emotion)\b/gi,
    /\b(Testing|Jest|Vitest|Cypress|Playwright|TDD|BDD)\b/gi,
    /\b(Git|GitHub|GitLab|Bitbucket|Jira|Confluence|Agile|Scrum|Kanban)\b/gi,
  ];
  
  const skills = new Set<string>();
  for (const pattern of skillPatterns) {
    const matches = text.match(pattern);
    if (matches) matches.forEach(m => skills.add(m));
  }
  
  return Array.from(skills);
}

function extractQualifications(text: string): string[] {
  const qualPatterns = [
    /\b(Bachelor|Master|PhD|Doctorate|Degree|Diploma|Certificate|Certification)\b/gi,
    /\b(BS|MS|MBA|Ph\.D|B\.S|M\.S|B\.A|M\.A)\b/gi,
    /\b(Computer Science|Software Engineering|Information Technology|Data Science|Engineering|Mathematics|Physics)\b/gi,
  ];
  
  const quals = new Set<string>();
  for (const pattern of qualPatterns) {
    const matches = text.match(pattern);
    if (matches) matches.forEach(m => quals.add(m));
  }
  
  return Array.from(quals);
}

function extractExperience(text: string): string[] {
  const expPatterns = [
    /\b(\d+\+?\s*years?\s*(of\s*)?experience)\b/gi,
    /\b(senior|lead|principal|staff|junior|entry.level|mid.level)\b/gi,
    /\b(team.lead|management|mentoring|architect)\b/gi,
  ];
  
  const exp = new Set<string>();
  for (const pattern of expPatterns) {
    const matches = text.match(pattern);
    if (matches) matches.forEach(m => exp.add(m));
  }
  
  return Array.from(exp);
}

function extractResponsibilities(text: string): string[] {
  const lines = text.split('\n');
  const responsibilities: string[] = [];
  let inResponsibilitiesSection = false;
  
  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    
    if (/(responsib|duties|accountabil|role includes|you will|key tasks)/.test(lower)) {
      inResponsibilitiesSection = true;
    }
    
    if (inResponsibilitiesSection) {
      if (lower.length === 0 || /^(requirements|qualifications|skills|experience|education|benefits|about us)/.test(lower)) {
        inResponsibilitiesSection = false;
        continue;
      }
      const clean = line.replace(/^[-•*]\s*/, '').trim();
      if (clean.length > 10) responsibilities.push(clean);
    }
  }
  
  return responsibilities.slice(0, 20);
}

function extractApplicationRequirements(text: string): string[] {
  const lines = text.split('\n');
  const requirements: string[] = [];
  let inAppSection = false;
  
  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    
    if (/(apply|application|submit|send|attach|include|provide|cover letter|resume|cv|portfolio|references|transcript)/.test(lower)) {
      inAppSection = true;
    }
    
    if (inAppSection && lower.length > 10) {
      const clean = line.replace(/^[-•*]\s*/, '').trim();
      if (clean.length > 5) requirements.push(clean);
    }
  }
  
  return requirements.slice(0, 15);
}

function extractTerminology(text: string): string[] {
  // Industry-specific terminology
  const terms = new Set<string>();
  const patterns = [
    /\b[A-Z]{2,}\b/g, // Acronyms
    /\b\w+\.\w+/g, // Dot notation (e.g., Node.js, REST API)
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) matches.forEach(m => terms.add(m));
  }
  
  return Array.from(terms).slice(0, 30);
}

/**
 * Analyze CV for ATS compatibility and quality
 */
export async function analyzeCV(cvContent: any, cvPdfBytes?: Buffer): Promise<CVAnalysisResult> {
  // Structure analysis
  const requiredSections = ['contact', 'summary', 'skills', 'experience', 'education'];
  const sectionsFound = requiredSections.filter(s => 
    cvContent.sections?.some((sec: any) => sec.type === s || sec.title.toLowerCase().includes(s))
  );
  const sectionsMissing = requiredSections.filter(s => !sectionsFound.includes(s));
  
  // Contact info
  const contact = cvContent.contact || {};
  const contactInfoComplete = !!(contact.name && contact.email && (contact.phone || contact.linkedin));
  
  // Skill coverage (would need job analysis for comparison)
  const allSkills = cvContent.sections
    ?.filter((s: any) => s.type === 'skills')
    .flatMap((s: any) => s.entries?.flatMap((e: any) => e.bullets || [e.title]) || []) || [];
  
  // Experience evidence
  const experienceEntries = cvContent.sections
    ?.find((s: any) => s.type === 'experience')
    ?.entries || [];
  
  const evidenced: string[] = [];
  const claimed: string[] = [];
  for (const entry of experienceEntries) {
    if (entry.evidenceRefs && entry.evidenceRefs.length > 0) {
      evidenced.push(entry.title);
    } else {
      claimed.push(entry.title);
    }
  }
  
  // Education relevance
  const educationEntries = cvContent.sections
    ?.find((s: any) => s.type === 'education')
    ?.entries || [];
  const relevant = educationEntries.map((e: any) => e.title).filter(Boolean);
  
  // Keyword density (simplified)
  const cvText = JSON.stringify(cvContent).toLowerCase();
  const wordCount = cvText.split(/\s+/).length;
  
  // Formatting warnings
  const formattingWarnings: string[] = [];
  if (!cvContent.contact?.name) formattingWarnings.push('Missing candidate name');
  if (!cvContent.contact?.email) formattingWarnings.push('Missing email address');
  if (sectionsMissing.length > 0) formattingWarnings.push(`Missing recommended sections: ${sectionsMissing.join(', ')}`);
  if (cvText.length < 500) formattingWarnings.push('CV appears very short (< 500 chars)');
  
  // Date consistency
  let dateConsistency = true;
  for (const entry of experienceEntries) {
    if (entry.date && !/^\d{4}(-\d{2})?\s*[-–—]\s*(\d{4}(-\d{2})?|present|current)/i.test(entry.date)) {
      dateConsistency = false;
    }
  }
  
  // Duplicate content
  const allText = experienceEntries.map((e: any) => e.bullets.join(' ')).join(' ');
  const words = allText.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
  const wordFreq = new Map<string, number>();
  for (const w of words) wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  const duplicates = Array.from(wordFreq.entries()).filter(([, c]) => c > 5).map(([w]) => w);
  const duplicateContent = duplicates.length > 0;
  
  // Unsubstantiated claims
  const unsubstantiatedClaims = experienceEntries
    .filter((e: any) => !e.evidenceRefs || e.evidenceRefs.length === 0)
    .map((e: any) => e.title)
    .filter(Boolean);
  
  // PDF text extraction
  let pdfTextExtraction = { extractable: false, readingOrder: false, textLength: 0 };
  if (cvPdfBytes) {
    try {
      const extracted = await extractPDFText(cvPdfBytes);
      pdfTextExtraction = {
        extractable: extracted.text.length > 100,
        readingOrder: extracted.text.split('\n').length > 3,
        textLength: extracted.text.length,
      };
    } catch {
      pdfTextExtraction = { extractable: false, readingOrder: false, textLength: 0 };
    }
  }
  
  return {
    structureScore: calculateStructureScore(sectionsFound.length, requiredSections.length, contactInfoComplete),
    sectionsFound,
    sectionsMissing,
    contactInfoComplete,
    skillCoverage: { covered: allSkills, missing: [], partial: [] },
    experienceEvidence: { evidenced, claimed, missing: [] },
    educationRelevance: { relevant, missing: [] },
    keywordAlignment: { included: [], missing: [], density: 0 },
    formattingWarnings,
    dateConsistency,
    duplicateContent,
    unsubstantiatedClaims,
    missingRequestedSections: [],
    pdfTextExtraction,
  };
}

function calculateStructureScore(found: number, required: number, contactComplete: boolean): number {
  let score = (found / required) * 70;
  if (contactComplete) score += 20;
  return Math.min(100, Math.round(score));
}

/**
 * Generate comprehensive matching report
 */
export async function generateMatchingReport(
  jobAnalysis: JobAnalysisResult,
  cvAnalysis: CVAnalysisResult,
  matches: MatchResult[]
): Promise<MatchingReport> {
  const requirements = matches.map(m => ({
    requirement: m.requirement_text,
    category: m.matches[0]?.evidence.category || 'unknown',
    mandatory: m.is_mandatory,
    supported: m.matches.some(mm => mm.match_class === 'STRONG'),
    partiallySupported: m.matches.some(mm => mm.match_class === 'PARTIAL' || mm.match_class === 'TRANSFERABLE'),
    unsupported: m.matches.every(mm => mm.match_class === 'NO_EVIDENCE' || mm.match_class === 'REQUIRES_VERIFICATION'),
    evidenceCount: m.matches.length,
    topEvidence: m.matches[0]?.reason || 'No evidence',
  }));
  
  const allJobKeywords = [...jobAnalysis.requiredKeywords, ...jobAnalysis.preferredKeywords];
  const cvKeywords = cvAnalysis.skillCoverage.covered;
  
  const keywordsIncluded = allJobKeywords.filter(k => 
    cvKeywords.some(cvk => cvk.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cvk.toLowerCase()))
  );
  const keywordsMissing = allJobKeywords.filter(k => 
    !cvKeywords.some(cvk => cvk.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cvk.toLowerCase()))
  );
  
  // Calculate scores
  const mandatoryReqs = matches.filter(m => m.is_mandatory).length;
  const supportedMandatory = matches.filter(m => m.is_mandatory && m.matches.some(mm => mm.match_class === 'STRONG')).length;
  const evidenceCoverage = mandatoryReqs > 0 ? supportedMandatory / mandatoryReqs : 1;
  
  const keywordCoverage = allJobKeywords.length > 0 ? keywordsIncluded.length / allJobKeywords.length : 1;
  
  const structureQuality = cvAnalysis.structureScore / 100;
  
  const formatCompliance = cvAnalysis.dateConsistency && !cvAnalysis.duplicateContent && cvAnalysis.contactInfoComplete ? 1 : 0.7;
  
  const overall = Math.round((keywordCoverage * 0.3 + evidenceCoverage * 0.4 + structureQuality * 0.2 + formatCompliance * 0.1) * 100);
  
  const improvements = generateImprovements(jobAnalysis, cvAnalysis, matches);
  const formattingWarnings = [...cvAnalysis.formattingWarnings];
  
  return {
    requirements,
    keywordsIncluded,
    keywordsMissing,
    improvements,
    formattingWarnings,
    score: {
      overall,
      keywordCoverage: Math.round(keywordCoverage * 100),
      evidenceCoverage: Math.round(evidenceCoverage * 100),
      structureQuality: Math.round(structureQuality * 100),
      formatCompliance: Math.round(formatCompliance * 100),
    },
    limitations: [
      'This analysis is based on automated keyword and pattern matching',
      'ATS systems vary significantly; this is a heuristic estimate',
      'Human review is essential for final quality assurance',
      'Scores do not guarantee interview or hiring outcomes',
    ],
  };
}

function generateImprovements(jobAnalysis: JobAnalysisResult, cvAnalysis: CVAnalysisResult, matches: MatchResult[]): string[] {
  const improvements: string[] = [];
  
  if (cvAnalysis.sectionsMissing.length > 0) {
    improvements.push(`Add missing sections: ${cvAnalysis.sectionsMissing.join(', ')}`);
  }
  
  if (!cvAnalysis.contactInfoComplete) {
    improvements.push('Complete contact information (name, email, phone/LinkedIn)');
  }
  
  const missingMandatory = matches.filter(m => m.is_mandatory && m.matches.every(mm => mm.match_class !== 'STRONG'));
  if (missingMandatory.length > 0) {
    improvements.push(`Strengthen evidence for mandatory requirements: ${missingMandatory.map(m => m.requirement_text).slice(0,3).join(', ')}`);
  }
  
  if (cvAnalysis.unsubstantiatedClaims.length > 0) {
    improvements.push(`Add evidence references for experience entries: ${cvAnalysis.unsubstantiatedClaims.slice(0,3).join(', ')}`);
  }
  
  if (!cvAnalysis.dateConsistency) {
    improvements.push('Standardize date formats (YYYY-MM or YYYY-MM-DD)');
  }
  
  if (cvAnalysis.duplicateContent) {
    improvements.push('Reduce repetitive language in bullet points');
  }
  
  return improvements;
}