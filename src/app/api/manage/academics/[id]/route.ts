import { NextRequest, NextResponse } from "next/server";
import {
  cmsGetQualification,
  cmsUpdateQualification,
  cmsDeleteQualification,
  cmsGetSemester,
  cmsUpdateSemester,
  cmsDeleteSemester,
  cmsGetUnit,
  cmsUpdateUnit,
  cmsDeleteUnit,
  cmsBulkUpdateUnitPublication,
  cmsReorderUnits,
  cmsReorderSemesters,
  cmsReorderPeriods,
  cmsUpdatePeriod,
  cmsDeletePeriod,
  cmsGetPeriod,
} from "@/lib/academics-cms";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getId(params: Promise<{ id: string }>): Promise<number> {
  const { id } = await params;
  return Number(id);
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "qualification";
    const id = await getId(params);

    if (type === "qualification") {
      const item = await cmsGetQualification(id);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ qualification: item });
    }

    if (type === "semester") {
      const item = await cmsGetSemester(id);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ semester: item });
    }

    if (type === "unit") {
      const item = await cmsGetUnit(id);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ unit: item });
    }

    if (type === "period") {
      const item = await cmsGetPeriod(id);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ period: item });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/manage/academics/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "qualification";
    const body = await req.json();
    const id = await getId(params);

    if (type === "qualification") {
      const item = await cmsUpdateQualification(id, body);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ qualification: item });
    }

    if (type === "semester") {
      const item = await cmsUpdateSemester(id, body);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ semester: item });
    }

    if (type === "unit") {
      const item = await cmsUpdateUnit(id, body);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ unit: item });
    }

    if (type === "period") {
      const item = await cmsUpdatePeriod(id, body);
      if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ period: item });
    }

    if (type === "bulk-unit-publication") {
      const { unitIds, publicationStatus, visibility } = body;
      const count = await cmsBulkUpdateUnitPublication(unitIds, publicationStatus, visibility);
      return NextResponse.json({ updated: count });
    }

    if (type === "reorder-units") {
      await cmsReorderUnits(body.updates);
      return NextResponse.json({ success: true });
    }

    if (type === "reorder-semesters") {
      await cmsReorderSemesters(body.updates);
      return NextResponse.json({ success: true });
    }

    if (type === "reorder-periods") {
      await cmsReorderPeriods(body.updates);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("PUT /api/manage/academics/[id] error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "qualification";
    const id = await getId(params);

    if (type === "qualification") {
      await cmsDeleteQualification(id);
      return NextResponse.json({ success: true });
    }

    if (type === "semester") {
      await cmsDeleteSemester(id);
      return NextResponse.json({ success: true });
    }

    if (type === "unit") {
      await cmsDeleteUnit(id);
      return NextResponse.json({ success: true });
    }

    if (type === "period") {
      await cmsDeletePeriod(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("DELETE /api/manage/academics/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}