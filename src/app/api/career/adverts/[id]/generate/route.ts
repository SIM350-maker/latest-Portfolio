import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobApplicationByOwnerAndAdvert } from "@/lib/career/job-application";
import { getJobApplication, updateJobApplication } from "@/lib/career/job-application";
import { getGeneratedDocumentsByApplication, createGeneratedDocument, getGeneratedDocument, updateGeneratedDocument } from "@/lib/career/generated-document";
import { generateCVIntelligent, generateCoverLetterIntelligent, generateEmailIntelligent, type CVGenerationResult, type CoverLetterResult, type EmailResult } from "@/lib/career/services/intelligent-generation";

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
    const { type, sectionId, regenerateAll } = body;

    if (!type) return NextResponse.json({ error: 'type is required (CV | COVER_LETTER | EMAIL)' }, { status: 400 });

    const application = await getJobApplicationByOwnerAndAdvert(ownerId, advertId);
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    // Update application status
    await updateJobApplication(application.id, { status: 'DOCUMENTS_IN_PROGRESS' });

    let result: CVGenerationResult | CoverLetterResult | EmailResult;
    let docType: 'CV' | 'COVER_LETTER' | 'EMAIL';

    switch (type.toUpperCase()) {
      case 'CV':
        result = await generateCVIntelligent({ ownerId, advertId, applicationId: application.id, mode: regenerateAll ? 'FULL' : 'SECTION', sectionId });
        docType = 'CV';
        break;
      case 'COVER_LETTER':
        result = await generateCoverLetterIntelligent({ ownerId, advertId, applicationId: application.id, mode: regenerateAll ? 'FULL' : 'SECTION', sectionId });
        docType = 'COVER_LETTER';
        break;
      case 'EMAIL':
        result = await generateEmailIntelligent({ ownerId, advertId, applicationId: application.id, mode: regenerateAll ? 'FULL' : 'SECTION', sectionId });
        docType = 'EMAIL';
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Create or update document
    const existingDocs = await getGeneratedDocumentsByApplication(application.id, docType);
    let document;

    if (existingDocs.length > 0 && !regenerateAll) {
      // Update latest version
      const latest = existingDocs[0];
      let contentJson: any;
      if ('content' in result) {
        contentJson = result.content;
      } else {
        // EmailResult has subject and body
        contentJson = { subject: result.subject, body: result.body };
      }
      document = await updateGeneratedDocument(latest.id, {
        content_json: contentJson,
        status: 'GENERATED',
        provenance_json: result.provenance,
      });
    } else {
      // Create new document
      let contentJson: any;
      if ('content' in result) {
        contentJson = result.content;
      } else {
        contentJson = { subject: result.subject, body: result.body };
      }
      document = await createGeneratedDocument({
        application_id: application.id,
        type: docType,
        title: `${docType} - ${new Date().toLocaleDateString()}`,
        content_json: contentJson,
        status: 'GENERATED',
        provenance_json: result.provenance,
      });
    }

    // Update application status
    await updateJobApplication(application.id, { status: 'DOCUMENTS_IN_PROGRESS' });

    const unverifiedCount = 'unverifiedCount' in result ? result.unverifiedCount : 0;

    return NextResponse.json({
      success: true,
      document,
      unverifiedCount,
      provenance: result.provenance,
    });
  } catch (error) {
    console.error('POST /api/career/adverts/[id]/generate error:', error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}