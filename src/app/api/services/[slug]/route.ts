import { NextRequest, NextResponse } from "next/server";
import { publicGetCategoryWithDetails } from "@/lib/services-cms";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await publicGetCategoryWithDetails(slug);
    if (!data) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/services/[slug] error:", error);
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 });
  }
}