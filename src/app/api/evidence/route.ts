import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { mapEvidenceRow } from "@/lib/mappers";
import { INITIAL_EVIDENCE } from "@/data/initialData";


export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM evidence 
      ORDER BY id ASC
    `;
    if (rows.length === 0) {
      return NextResponse.json(INITIAL_EVIDENCE);
    }
    return NextResponse.json(rows.map(mapEvidenceRow));
  } catch (error: any) {
    console.error("GET /api/evidence error:", error);
    return NextResponse.json(INITIAL_EVIDENCE, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug =
      body.slug ||
      (body.title
        ? body.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        : `evd-${Date.now()}`);

    const rows = await sql`
      INSERT INTO evidence (
        slug, title, project_slug, project_name, type, access, accessibility_status,
        sha256, description, date, verification_status, created_at, updated_at
      ) VALUES (
        ${slug}, ${body.title || "Cryptographic Artifact"},
        ${body.projectSlug || "general"}, ${body.projectName || "General Engineering"},
        ${body.type || "Code Repository"}, ${body.access || "Public"}, ${body.access || "Public"},
        ${body.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},
        ${body.description || ""}, ${body.date || new Date().toISOString().split("T")[0]},
        ${body.verificationStatus || "VERIFIED"}, NOW(), NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(mapEvidenceRow(rows[0]), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/evidence error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
