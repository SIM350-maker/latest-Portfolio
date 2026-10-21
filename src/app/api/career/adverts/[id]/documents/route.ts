import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobApplication, updateJobApplication } from "@/lib/career/job-application";
import { getGeneratedDocumentsByApplication, createGeneratedDocument, getGeneratedDocument, updateGeneratedDocument, createNewVersion } from "@/lib/career/generated-document";
import { getJobApplicationByOwnerAndAdvert } from "@/lib/career/job-application";
import { getJobAdvert } from "@/lib/career/job-advert";

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

    const documents = await getGeneratedDocumentsByApplication(application.id);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('GET /api/career/adverts/[id]/documents error:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
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
    const { type, title, content, template_id } = body;

    if (!type || !title || !content) {
      return NextResponse.json({ error: 'type, title, and content are required' }, { status: 400 });
    }

    const application = await getJobApplicationByOwnerAndAdvert(ownerId, advertId);
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const document = await createGeneratedDocument({
      application_id: application.id,
      template_id: template_id || null,
      type: type.toUpperCase(),
      title,
      content_json: content,
      status: 'DRAFT',
      provenance_json: { source: 'manual', created_by: user.id, created_at: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('POST /api/career/adverts/[id]/documents error:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}