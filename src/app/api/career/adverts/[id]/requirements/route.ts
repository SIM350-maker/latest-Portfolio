import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getJobAdvert } from "@/lib/career/job-advert";
import { getJobRequirementsByAdvert } from "@/lib/career/job-requirement";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const advertId = parseInt(id, 10);
    if (isNaN(advertId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const advert = await getJobAdvert(advertId);
    if (!advert) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (advert.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const requirements = await getJobRequirementsByAdvert(advertId);
    return NextResponse.json({ requirements });
  } catch (error) {
    console.error('GET /api/career/adverts/[id]/requirements error:', error);
    return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 });
  }
}