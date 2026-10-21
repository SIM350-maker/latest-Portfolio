import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cmsListCategories, cmsCreateCategory } from "@/lib/services-cms";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const categories = await cmsListCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/manage/services error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();
    const category = await cmsCreateCategory({
      title: body.title,
      slug: body.slug,
      icon: body.icon,
      description: body.description,
      long_description: body.long_description,
      display_order: body.display_order,
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/manage/services error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}