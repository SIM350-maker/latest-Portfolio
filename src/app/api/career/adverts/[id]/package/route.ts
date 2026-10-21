import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getJobApplicationByOwnerAndAdvert } from "@/lib/career/job-application";
import { getJobAdvert } from "@/lib/career/job-advert";
import { 
  assembleApplicationPackage, 
  getPackageDetails, 
  validatePackage, 
  preparePackageForApproval, 
  approvePackage,
  isPackageReadyToSend 
} from "@/lib/career/services/package-assembly";
import { sendApplicationPackage } from "@/lib/career/services/email-sender";

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

    // Get package if exists
    const { getApplicationPackageByApplication } = await import("@/lib/career/application-package");
    const pkg = await getApplicationPackageByApplication(application.id);
    
    if (!pkg) {
      return NextResponse.json({ package: null });
    }

    const details = await getPackageDetails(pkg.id);
    return NextResponse.json({ package: details });
  } catch (error) {
    console.error('GET /api/career/adverts/[id]/package error:', error);
    return NextResponse.json({ error: 'Failed to fetch package' }, { status: 500 });
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
    const { action, ...data } = body;

    const application = await getJobApplicationByOwnerAndAdvert(ownerId, advertId);
    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    switch (action) {
      case 'assemble': {
        const pkg = await assembleApplicationPackage({
          applicationId: application.id,
          cvDocumentId: data.cvDocumentId,
          coverLetterDocumentId: data.coverLetterDocumentId,
          emailDocumentId: data.emailDocumentId,
          attachmentIds: data.attachmentIds,
          recipientEmail: data.recipientEmail,
          subject: data.subject,
          customMessage: data.customMessage,
        });
        return NextResponse.json({ success: true, package: pkg });
      }

      case 'validate': {
        const { getApplicationPackageByApplication } = await import("@/lib/career/application-package");
        const pkg = await getApplicationPackageByApplication(application.id);
        if (!pkg) return NextResponse.json({ error: 'No package found' }, { status: 404 });
        
        const validation = await validatePackage(pkg.id);
        return NextResponse.json({ validation });
      }

      case 'prepare_approval': {
        const { getApplicationPackageByApplication } = await import("@/lib/career/application-package");
        const pkg = await getApplicationPackageByApplication(application.id);
        if (!pkg) return NextResponse.json({ error: 'No package found' }, { status: 404 });
        
        const updated = await preparePackageForApproval(pkg.id, {
          recipient_email: data.recipientEmail,
          subject: data.subject,
          custom_message: data.customMessage,
          send_as_test: data.testMode,
        });
        return NextResponse.json({ success: true, package: updated });
      }

      case 'approve': {
        const { getApplicationPackageByApplication } = await import("@/lib/career/application-package");
        const pkg = await getApplicationPackageByApplication(application.id);
        if (!pkg) return NextResponse.json({ error: 'No package found' }, { status: 404 });
        
        const updated = await approvePackage(pkg.id, ownerId);
        return NextResponse.json({ success: true, package: updated });
      }

      case 'ready_check': {
        const { getApplicationPackageByApplication } = await import("@/lib/career/application-package");
        const pkg = await getApplicationPackageByApplication(application.id);
        if (!pkg) return NextResponse.json({ ready: false, reason: 'No package found' });
        
        const ready = await isPackageReadyToSend(pkg.id);
        return NextResponse.json(ready);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/career/adverts/[id]/package error:', error);
    return NextResponse.json({ error: 'Failed to process package action' }, { status: 500 });
  }
}