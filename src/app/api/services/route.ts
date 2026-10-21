import { NextRequest, NextResponse } from "next/server";
import { publicListCategories } from "@/lib/services-cms";

export async function GET() {
  try {
    const categories = await publicListCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/services error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}