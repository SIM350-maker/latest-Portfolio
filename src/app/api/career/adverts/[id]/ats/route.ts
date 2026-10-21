import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobApplicationByOwnerAndAdvert } from "@/lib/career/job-application";
import { getJobAdvert } from "@/lib/career/job-advert";
import { getGeneratedDocumentsByApplication, getApprovedGeneratedDocumentByApplication } from "@/lib/career/generated-document";
import { runEvidenceMatching } from "@/lib/career/services/evidence-matching";
import { analyzeJobDescription, analyzeCV, generateMatchingReport, type JobAnalysisResult, type CVAnalysisResult } from "@/lib/career/services/ats-analysis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ownerId = Number(user.id);

    const { id } = await params;
    const advertId = parseInt(id, 10);
    if (isNaN(advertId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const application = await getJobApplicationByOwnerAndAdvert(ownerId, advertId);
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    // Get job analysis from advert
    const advert = await getJobAdvert(advertId);
    if (!advert) return NextResponse.json({ error: 'Advert not found' }, { status: 404 });

    // Run job analysis
    const jobAnalysis = await analyzeJobDescription(advert.raw_text);

    // Get CV document (prefer approved, fallback to latest)
    const cvDocs = await getGeneratedDocumentsByApplication(application.id, 'CV');
    const approvedCV = await getApprovedGeneratedDocumentByApplication(application.id, 'CV');
    const cvDoc = approvedCV || cvDocs[0];

    let cvAnalysis: CVAnalysisResult;
    if (cvDoc) {
      cvAnalysis = await analyzeCV(cvDoc.content_json, cvDoc.pdf_bytes || undefined);
    } else {
      cvAnalysis = {
        structureScore: 0,
        sectionsFound: [],
        sectionsMissing: ['contact', 'summary', 'skills', 'experience', 'education'],
        contactInfoComplete: false,
        skillCoverage: { covered: [], missing: [], partial: [] },
        experienceEvidence: { evidenced: [], claimed: [], missing: [] },
        educationRelevance: { relevant: [], missing: [] },
        keywordAlignment: { included: [], missing: [], density: 0 },
        formattingWarnings: ['No CV document generated yet'],
        dateConsistency: true,
        duplicateContent: false,
        unsubstantiatedClaims: [],
        missingRequestedSections: [],
        pdfTextExtraction: { extractable: false, readingOrder: false, textLength: 0 },
      };
    }

    // Run evidence matching
    const matches = await runEvidenceMatching({ ownerId, advertId, applicationId: application.id });

    // Generate matching report
    const report = await generateMatchingReport(jobAnalysis, cvAnalysis, matches);

    return NextResponse.json({
      jobAnalysis,
      cvAnalysis,
      report,
    });
  } catch (error) {
    console.error('GET /api/career/adverts/[id]/ats error:', error);
    return NextResponse.json({ error: 'Failed to generate ATS analysis' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ownerId = Number(user.id);

    const { id } = await params;
    const advertId = parseInt(id, 10);
    if (isNaN(advertId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const { cvContent, cvPdfBase64 } = body;

    const advert = await getJobAdvert(advertId);
    if (!advert) return NextResponse.json({ error: 'Advert not found' }, { status: 404 });

    const jobAnalysis = await analyzeJobDescription(advert.raw_text);
    
    const cvPdfBytes = cvPdfBase64 ? Buffer.from(cvPdfBase64, 'base64') : undefined;
    const cvAnalysis = await analyzeCV(cvContent, cvPdfBytes);

    const matches = await runEvidenceMatching({ ownerId, advertId, applicationId: 0 }); // applicationId 0 for standalone

    const report = await generateMatchingReport(jobAnalysis, cvAnalysis, matches);

    return NextResponse.json({ jobAnalysis, cvAnalysis, report });
  } catch (error) {
    console.error('POST /api/career/adverts/[id]/ats error:', error);
    return NextResponse.json({ error: 'Failed to analyze CV' }, { status: 500 });
  }
}