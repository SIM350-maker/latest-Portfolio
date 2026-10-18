import { NextResponse } from "next/server";
import { sql } from "@/lib/db";


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isNumeric = /^\d+$/.test(id);

    if (isNumeric) {
      await sql`DELETE FROM evidence WHERE id = ${Number(id)} OR slug = ${id}`;
    } else {
      await sql`DELETE FROM evidence WHERE slug = ${id}`;
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("DELETE /api/evidence/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
