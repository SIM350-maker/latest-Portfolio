import { NextRequest, NextResponse } from "next/server";
import { publicListPackages, publicListEngagementModels, publicListFAQs } from "@/lib/services-cms";

export async function GET() {
  try {
    const [packages, engagementModels, faqs] = await Promise.all([
      publicListPackages(),
      publicListEngagementModels(),
      publicListFAQs(),
    ]);
    return NextResponse.json({ packages, engagementModels, faqs });
  } catch (error) {
    console.error("GET /api/services/packages error:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}