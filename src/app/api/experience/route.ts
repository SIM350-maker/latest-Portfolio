import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { mapExperienceRow } from "@/lib/mappers";
import { INITIAL_EXPERIENCE } from "@/data/initialData";


export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM experience 
      ORDER BY id ASC
    `;
    if (rows.length === 0) {
      return NextResponse.json(INITIAL_EXPERIENCE);
    }
    return NextResponse.json(rows.map(mapExperienceRow));
  } catch (error: any) {
    console.error("GET /api/experience error:", error);
    return NextResponse.json(INITIAL_EXPERIENCE, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const highlightsJson = JSON.stringify(body.highlights || []);
    const skillsJson = JSON.stringify(body.skills || []);

    const rawYear = body.period ? body.period.split("—")[0].trim() : "2026";
    const startDate = /^\d{4}-\d{2}$/.test(rawYear) ? rawYear : `${rawYear.slice(0, 4)}-01`;

    const rows = await sql`
      INSERT INTO experience (
        profile_id, title, role, company, organization, location,
        period, start_date, is_current, type, description, highlights, skills,
        created_at, updated_at
      ) VALUES (
        1, ${body.role || "Software Engineer"}, ${body.role || "Software Engineer"},
        ${body.organization || "Company"}, ${body.organization || "Company"},
        ${body.location || "Nairobi, Kenya"}, ${body.period || "2026 — Present"},
        ${startDate}, ${body.period ? body.period.includes("Present") : true},
        ${body.type || "Work"}, ${body.highlights?.join(" ") || ""},
        ${highlightsJson}::jsonb, ${skillsJson}::jsonb, NOW(), NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(mapExperienceRow(rows[0]), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/experience error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
