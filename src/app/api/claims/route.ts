import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const claims = await query(
      `SELECT id, statement, justification, source_entity_type, source_entity_id, publication_state, created_at, updated_at
       FROM claim
       ORDER BY id ASC`
    );
    return NextResponse.json({ claims });
  } catch (error) {
    console.error("GET /api/claims error:", error);
    return NextResponse.json({ error: "Failed to fetch technical claims" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please login to CMS." }, { status: 401 });
    }

    const body = await req.json();
    const { statement, justification, source_entity_type = "project", source_entity_id, publication_state = "Published" } = body;

    if (!statement) {
      return NextResponse.json({ error: "Claim statement is required." }, { status: 400 });
    }

    // Constraint chk_claim_source_pair: both source_entity_type and source_entity_id must be null or both non-null
    const sType = source_entity_type && source_entity_id ? source_entity_type : null;
    const sId = source_entity_type && source_entity_id ? source_entity_id : null;

    const result = await query(
      `INSERT INTO claim (statement, justification, source_entity_type, source_entity_id, publication_state, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [statement, justification || null, sType, sId, publication_state]
    );

    return NextResponse.json({ success: true, item: result[0] });
  } catch (error) {
    console.error("POST /api/claims error:", error);
    return NextResponse.json({ error: "Failed to create claim" }, { status: 500 });
  }
}
