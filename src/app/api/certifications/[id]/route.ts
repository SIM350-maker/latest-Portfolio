import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please login to CMS." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const {
      title,
      issuer,
      category,
      issue_date,
      credential_id,
      credential_url,
      file_url,
      verification_status,
      skills,
      is_visible,
      is_posted,
      display_order,
    } = body;

    const skillsJson = skills !== undefined ? JSON.stringify(Array.isArray(skills) ? skills : []) : null;

    const updated = await query(
      `UPDATE certifications SET
        title = COALESCE($1, title),
        issuer = COALESCE($2, issuer),
        category = COALESCE($3, category),
        issue_date = COALESCE($4, issue_date),
        credential_id = COALESCE($5, credential_id),
        credential_url = COALESCE($6, credential_url),
        file_url = COALESCE($7, file_url),
        verification_status = COALESCE($8, verification_status),
        skills = CASE WHEN $9::text IS NOT NULL THEN $9::jsonb ELSE skills END,
        is_visible = COALESCE($10, is_visible),
        is_posted = COALESCE($11, is_posted),
        display_order = COALESCE($12, display_order),
        updated_at = NOW()
      WHERE id = $13
      RETURNING *`,
      [
        title || null,
        issuer || null,
        category || null,
        issue_date || null,
        credential_id || null,
        credential_url || null,
        file_url !== undefined ? file_url : null,
        verification_status || null,
        skillsJson,
        is_visible !== undefined ? Boolean(is_visible) : null,
        is_posted !== undefined ? Boolean(is_posted) : null,
        display_order !== undefined ? Number(display_order) : null,
        id,
      ]
    );

    if (updated.length === 0) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated[0] });
  } catch (error) {
    console.error("PUT /api/certifications/[id] error:", error);
    return NextResponse.json({ error: "Failed to update certification" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please login to CMS." }, { status: 401 });
    }

    const { id } = await params;
    await query("DELETE FROM certifications WHERE id = $1", [id]);

    return NextResponse.json({ success: true, message: "Certification deleted" });
  } catch (error) {
    console.error("DELETE /api/certifications/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete certification" }, { status: 500 });
  }
}
