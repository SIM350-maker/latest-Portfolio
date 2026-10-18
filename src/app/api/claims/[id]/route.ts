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
    const { statement, justification, publication_state } = body;

    const updated = await query(
      `UPDATE claim SET
        statement = COALESCE($1, statement),
        justification = COALESCE($2, justification),
        publication_state = COALESCE($3, publication_state),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *`,
      [statement || null, justification || null, publication_state || null, id]
    );

    if (updated.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item: updated[0] });
  } catch (error) {
    console.error("PUT /api/claims/[id] error:", error);
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 });
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
    await query("DELETE FROM claim WHERE id = $1", [id]);

    return NextResponse.json({ success: true, message: "Claim deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/claims/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete claim" }, { status: 500 });
  }
}
