import { NextRequest, NextResponse } from "next/server";
import {
  getPublishedQualifications,
  getPublishedQualification,
  getPublishedPeriods,
  getPublishedSemesters,
  getPublishedUnits,
  getAllPublishedUnits,
  getAcademicMetrics,
  getSemesterWithUnits,
} from "@/lib/academics-public";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "qualifications";
    const id = searchParams.get("id");
    const qualificationId = searchParams.get("qualificationId");
    const semesterId = searchParams.get("semesterId");

    if (action === "qualifications") {
      const qualifications = await getPublishedQualifications();
      return NextResponse.json({ qualifications });
    }

    if (action === "qualification" && id) {
      const qualification = await getPublishedQualification(Number(id));
      if (!qualification) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ qualification });
    }

    if (action === "periods" && qualificationId) {
      const periods = await getPublishedPeriods(Number(qualificationId));
      return NextResponse.json({ periods });
    }

    if (action === "semesters" && qualificationId) {
      const semesters = await getPublishedSemesters(Number(qualificationId));
      return NextResponse.json({ semesters });
    }

    if (action === "units" && semesterId) {
      const units = await getPublishedUnits(Number(semesterId));
      return NextResponse.json({ units });
    }

    if (action === "all-units" && qualificationId) {
      const units = await getAllPublishedUnits(Number(qualificationId));
      return NextResponse.json({ units });
    }

    if (action === "metrics" && qualificationId) {
      const metrics = await getAcademicMetrics(Number(qualificationId));
      return NextResponse.json({ metrics });
    }

    if (action === "semester-with-units" && semesterId) {
      const data = await getSemesterWithUnits(Number(semesterId));
      if (!data.semester) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action or missing params" }, { status: 400 });
  } catch (error) {
    console.error("GET /api/academics error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}