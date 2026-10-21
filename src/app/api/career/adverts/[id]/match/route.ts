import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobApplicationByOwnerAndAdvert } from "@/lib/career/job-application";
import { getJobAdvert } from "@/lib/career/job-advert";
import { runEvidenceMatching, getMatchesForApplication } from "@/lib/career/services/evidence-matching";

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

    // Find or create application
    let application = await getJobApplicationByOwnerAndAdvert(ownerId, advertId);
    if (!application) {
      // Need to create it first - but this endpoint assumes application exists
      return NextResponse.json({ error: 'Application not found. Create application first.' }, { status: 404 });
    }

    // Run evidence matching
    const results = await runEvidenceMatching({
      ownerId,
      advertId,
      applicationId: application.id,
    });

    return NextResponse.json({ success: true, matches: results });
  } catch (error) {
    console.error('POST /api/career/adverts/[id]/match error:', error);
    return NextResponse.json({ error: 'Failed to run evidence matching' }, { status: 500 });
  }
}

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

    const matches = await getMatchesForApplication(application.id);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('GET /api/career/adverts/[id]/match error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}