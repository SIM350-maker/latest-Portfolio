import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("all") === "true";

    let sql = `
      SELECT id, title, issuer, category, issue_date, credential_id, credential_url,
             file_url, verification_status, skills, is_visible, is_posted, display_order, created_at, updated_at
      FROM certifications
    `;

    if (!showAll) {
      sql += ` WHERE (is_visible IS NULL OR is_visible = TRUE) AND (is_posted IS NULL OR is_posted = TRUE)`;
    }

    sql += ` ORDER BY display_order ASC, id ASC`;

    const certifications = await query(sql);
    return NextResponse.json({ certifications });
  } catch (error) {
    console.error("GET /api/certifications error:", error);
    return NextResponse.json({ error: "Failed to fetch certifications" }, { status: 500 });
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
      title,
      issuer,
      category = "Certification",
      issue_date,
      credential_id,
      credential_url,
      file_url,
      verification_status = "VERIFIED",
      skills = [],
      is_visible = true,
      is_posted = true,
      display_order = 0,
    } = body;

    if (!title || !issuer) {
      return NextResponse.json(
        { error: "Title and issuer are required fields." },
        { status: 400 }
      );
    }

    const skillsJson = JSON.stringify(Array.isArray(skills) ? skills : []);

    const result = await query(
      `INSERT INTO certifications (
        person_id, title, issuer, category, issue_date, credential_id, credential_url,
        file_url, verification_status, skills, is_visible, is_posted, display_order, created_at, updated_at
      ) VALUES (
        1, $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, NOW(), NOW()
      ) RETURNING *`,
      [
        title,
        issuer,
        category,
        issue_date || null,
        credential_id || null,
        credential_url || null,
        file_url || null,
        verification_status,
        skillsJson,
        Boolean(is_visible),
        Boolean(is_posted),
        Number(display_order) || 0,
      ]
    );

    return NextResponse.json({ success: true, item: result[0] });
  } catch (error) {
    console.error("POST /api/certifications error:", error);
    return NextResponse.json({ error: "Failed to create certification" }, { status: 500 });
  }
}
