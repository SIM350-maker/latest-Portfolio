import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getJobApplicationsByOwner, getJobApplication, updateJobApplication, type JobApplicationStatus } from "@/lib/career/job-application";
import { getJobAdvert } from "@/lib/career/job-advert";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ownerId = Number(user.id);

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = (searchParams.get('status') as JobApplicationStatus) || undefined;
    const advertId = searchParams.get('advert_id') || undefined;

    let applications = await getJobApplicationsByOwner(ownerId, status, limit, offset);

    if (advertId) {
      applications = applications.filter(a => a.advert_id === parseInt(advertId, 10));
    }

    // Fetch advert info for each application
    const advertIds = [...new Set(applications.map(a => a.advert_id))];
    const advertsMap = new Map<number, any>();
    for (const id of advertIds) {
      const advert = await getJobAdvert(id);
      if (advert) advertsMap.set(id, advert);
    }

    // NOTE: Maps serialize to `{}` in JSON — convert to a plain object keyed by advert id
    const adverts: Record<number, any> = {};
    for (const [id, advert] of advertsMap) adverts[id] = advert;

    return NextResponse.json({ applications, adverts });
  } catch (error) {
    console.error('GET /api/career/applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, status, mode, settings } = body;

    if (!id) return NextResponse.json({ error: 'Application ID required' }, { status: 400 });

    const application = await getJobApplication(id);
    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (application.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates: any = {};
    if (status) updates.status = status;
    if (mode) updates.mode = mode;
    if (settings) updates.settings_json = settings;

    const updated = await updateJobApplication(id, updates);
    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error('PUT /api/career/applications error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}