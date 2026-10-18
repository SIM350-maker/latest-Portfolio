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
      institution,
      degree,
      field_of_study,
      start_date,
      end_date,
      grade,
      description,
      activities,
      skills,
      document_url,
      is_visible,
      is_posted,
      display_order,
    } = body;

    const skillsJson = skills !== undefined ? JSON.stringify(Array.isArray(skills) ? skills : []) : null;

    const updated = await query(
      `UPDATE education SET
        institution = COALESCE($1, institution),
        degree = COALESCE($2, degree),
        field_of_study = COALESCE($3, field_of_study),
        start_date = COALESCE($4, start_date),
        end_date = COALESCE($5, end_date),
        grade = COALESCE($6, grade),
        description = COALESCE($7, description),
        activities = COALESCE($8, activities),
        skills = CASE WHEN $9::text IS NOT NULL THEN $9::jsonb ELSE skills END,
        document_url = COALESCE($10, document_url),
        is_visible = COALESCE($11, is_visible),
        is_posted = COALESCE($12, is_posted),
        display_order = COALESCE($13, display_order),
        updated_at = NOW()
      WHERE id = $14
      RETURNING *`,
      [
        institution || null,
        degree || null,
        field_of_study || null,
        start_date || null,
        end_date || null,
        grade || null,
        description || null,
        activities || null,
        skillsJson,
        document_url !== undefined ? document_url : null,
        is_visible !== undefined ? Boolean(is_visible) : null,
        is_posted !== undefined ? Boolean(is_posted) : null,
        display_order !== undefined ? Number(display_order) : null,
        id,
      ]
    );

    if (updated.length === 0) {
      return NextResponse.json({ error: "Education record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated[0] });
  } catch (error) {
    console.error("PUT /api/education/[id] error:", error);
    return NextResponse.json({ error: "Failed to update education record" }, { status: 500 });
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
    await query("DELETE FROM education WHERE id = $1", [id]);

    return NextResponse.json({ success: true, message: "Education record deleted" });
  } catch (error) {
    console.error("DELETE /api/education/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete education record" }, { status: 500 });
  }
}
