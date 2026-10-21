import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getApplicationPackageByApplication } from "@/lib/career/application-package";
import { getJobApplicationByOwnerAndAdvert } from "@/lib/career/job-application";
import { sendApplicationPackage } from "@/lib/career/services/email-sender";

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
    const { testMode } = body;

    const application = await getJobApplicationByOwnerAndAdvert(ownerId, advertId);
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const pkg = await getApplicationPackageByApplication(application.id);
    if (!pkg) return NextResponse.json({ error: 'No package found' }, { status: 404 });

    if (pkg.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Package not approved' }, { status: 400 });
    }

    const result = await sendApplicationPackage({
      packageId: pkg.id,
      testMode: testMode || false,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Update package status
    const { updateApplicationPackage } = await import("@/lib/career/application-package");
    await updateApplicationPackage(pkg.id, { status: result.simulated ? 'APPROVED' : 'SENT' });

    return NextResponse.json({ 
      success: true, 
      attemptId: result.attemptId,
      providerMessageId: result.providerMessageId,
      simulated: result.simulated,
    });
  } catch (error) {
    console.error('POST /api/career/adverts/[id]/package/send error:', error);
    return NextResponse.json({ error: 'Failed to send package' }, { status: 500 });
  }
}