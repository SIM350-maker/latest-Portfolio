import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cmsGetCategory, cmsUpdateCategory, cmsDeleteCategory } from "@/lib/services-cms";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    const category = await cmsGetCategory(Number(id));
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    return NextResponse.json({ category });
  } catch (error) {
    console.error("GET /api/manage/services/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    const body = await req.json();
    const category = await cmsUpdateCategory(Number(id), body);
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    return NextResponse.json({ category });
  } catch (error) {
    console.error("PUT /api/manage/services/[id] error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id } = await params;
    await cmsDeleteCategory(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/manage/services/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}