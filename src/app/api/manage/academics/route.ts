import { NextRequest, NextResponse } from "next/server";
import {
  cmsListQualifications,
  cmsCreateQualification,
  cmsListPeriods,
  cmsCreatePeriod,
  cmsListSemesters,
  cmsCreateSemester,
  cmsListUnits,
  cmsCreateUnit,
} from "@/lib/academics-cms";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "qualifications";
    const qualificationId = searchParams.get("qualificationId");
    const periodId = searchParams.get("periodId");
    const semesterId = searchParams.get("semesterId");

    if (type === "qualifications") {
      const qualifications = await cmsListQualifications();
      return NextResponse.json({ qualifications });
    }

    if (type === "periods" && qualificationId) {
      const periods = await cmsListPeriods(Number(qualificationId));
      return NextResponse.json({ periods });
    }

    if (type === "semesters" && qualificationId) {
      const semesters = await cmsListSemesters(Number(qualificationId));
      return NextResponse.json({ semesters });
    }

    if (type === "units" && semesterId) {
      const units = await cmsListUnits(Number(semesterId));
      return NextResponse.json({ units });
    }

    return NextResponse.json({ error: "Invalid type or missing required params" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/manage/academics error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "qualification";
    const body = await req.json();

    if (type === "qualification") {
      const qualification = await cmsCreateQualification(body);
      return NextResponse.json({ qualification }, { status: 201 });
    }

    if (type === "period") {
      const period = await cmsCreatePeriod(body);
      return NextResponse.json({ period }, { status: 201 });
    }

    if (type === "semester") {
      const semester = await cmsCreateSemester(body);
      return NextResponse.json({ semester }, { status: 201 });
    }

    if (type === "unit") {
      const unit = await cmsCreateUnit(body);
      return NextResponse.json({ unit }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/manage/academics error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}