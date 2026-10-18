import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { mapExperienceRow } from "@/lib/mappers";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const highlightsJson = body.highlights ? JSON.stringify(body.highlights) : null;
    const skillsJson = body.skills ? JSON.stringify(body.skills) : null;

    const rawYear = body.period ? body.period.split("—")[0].trim() : null;
    const startDate = rawYear
      ? /^\d{4}-\d{2}$/.test(rawYear)
        ? rawYear
        : `${rawYear.slice(0, 4)}-01`
      : null;

    const rows = await sql`
      UPDATE experience SET
        role = COALESCE(${body.role ?? null}, role),
        title = COALESCE(${body.role ?? null}, title),
        organization = COALESCE(${body.organization ?? null}, organization),
        company = COALESCE(${body.organization ?? null}, company),
        location = COALESCE(${body.location ?? null}, location),
        period = COALESCE(${body.period ?? null}, period),
        start_date = COALESCE(${startDate}, start_date),
        is_current = COALESCE(${body.period ? body.period.includes("Present") : null}, is_current),
        type = COALESCE(${body.type ?? null}, type),
        highlights = COALESCE(${highlightsJson}::jsonb, highlights),
        skills = COALESCE(${skillsJson}::jsonb, skills),
        updated_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    return NextResponse.json(mapExperienceRow(rows[0]));
  } catch (error: any) {
    console.error("PUT /api/experience/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await sql`DELETE FROM experience WHERE id = ${Number(id)}`;
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("DELETE /api/experience/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
