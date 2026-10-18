import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("all") === "true";

    let sql = `
      SELECT id, profile_id, institution, degree, field_of_study, start_date, end_date,
             grade, description, activities, skills, document_url, is_visible, is_posted, display_order, created_at, updated_at
      FROM education
    `;

    if (!showAll) {
      sql += ` WHERE (is_visible IS NULL OR is_visible = TRUE) AND (is_posted IS NULL OR is_posted = TRUE)`;
    }

    sql += ` ORDER BY display_order ASC, start_date DESC`;

    const education = await query(sql);
    return NextResponse.json({ education });
  } catch (error) {
    console.error("GET /api/education error:", error);
    return NextResponse.json({ error: "Failed to fetch education records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please login to CMS." }, { status: 401 });
    }

    const body = await req.json();
    const {
      institution,
      degree,
      field_of_study,
      start_date,
      end_date,
      grade,
      description,
      activities,
      skills = [],
      document_url = "/certificates/Transcript.pdf",
      is_visible = true,
      is_posted = true,
      display_order = 0,
    } = body;

    if (!institution || !degree || !start_date) {
      return NextResponse.json(
        { error: "Institution, degree, and start date are required fields." },
        { status: 400 }
      );
    }

    const skillsJson = JSON.stringify(Array.isArray(skills) ? skills : []);

    const result = await query(
      `INSERT INTO education (
        profile_id, institution, degree, field_of_study, start_date, end_date,
        grade, description, activities, skills, document_url, is_visible, is_posted, display_order, created_at, updated_at
      ) VALUES (
        1, $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, NOW(), NOW()
      ) RETURNING *`,
      [
        institution,
        degree,
        field_of_study || null,
        start_date,
        end_date || null,
        grade || null,
        description || null,
        activities || null,
        skillsJson,
        document_url || null,
        Boolean(is_visible),
        Boolean(is_posted),
        Number(display_order) || 0,
      ]
    );

    return NextResponse.json({ success: true, item: result[0] });
  } catch (error) {
    console.error("POST /api/education error:", error);
    return NextResponse.json({ error: "Failed to create education record" }, { status: 500 });
  }
}
