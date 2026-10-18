import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { mapProjectRow } from "@/lib/mappers";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isNumeric = /^\d+$/.test(id);

    let rows;
    if (isNumeric) {
      rows = await sql`SELECT * FROM project WHERE id = ${Number(id)} OR slug = ${id} LIMIT 1`;
    } else {
      rows = await sql`SELECT * FROM project WHERE slug = ${id} LIMIT 1`;
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(mapProjectRow(rows[0]));
  } catch (error: any) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const isNumeric = /^\d+$/.test(id);

    const techString = body.technologies ? JSON.stringify(body.technologies) : null;
    const decisionsJson = body.decisions ? JSON.stringify(body.decisions) : null;
    const metricsJson = body.keyMetrics ? JSON.stringify(body.keyMetrics) : null;
    const demoUrl = body.demoUrl && body.demoUrl.startsWith("http") ? body.demoUrl : null;
    const repoUrl = body.repoUrl && body.repoUrl.startsWith("http") ? body.repoUrl : null;

    let rows;
    if (isNumeric) {
      rows = await sql`
        UPDATE project SET
          title = COALESCE(${body.title ?? null}, title),
          subtitle = COALESCE(${body.subtitle ?? null}, subtitle),
          summary = COALESCE(${body.summary ?? null}, summary),
          description = COALESCE(${body.summary ?? null}, description),
          category = COALESCE(${body.category ?? null}, category),
          publication_state = COALESCE(${body.status ?? null}, publication_state),
          evidence_access = COALESCE(${body.evidenceAccess ?? null}, evidence_access),
          role = COALESCE(${body.role ?? null}, role),
          roles = COALESCE(${body.role ?? null}, roles),
          timeline = COALESCE(${body.timeline ?? null}, timeline),
          featured = COALESCE(${body.featured !== undefined ? Boolean(body.featured) : null}, featured),
          technologies = COALESCE(${techString}, technologies),
          repo_url = COALESCE(${repoUrl}, repo_url),
          demo_url = COALESCE(${demoUrl}, demo_url),
          deploy_url = COALESCE(${demoUrl}, deploy_url),
          architecture_note = COALESCE(${body.architectureNote ?? null}, architecture_note),
          problem = COALESCE(${body.problem ?? null}, problem),
          solution = COALESCE(${body.solution ?? null}, solution),
          decisions = COALESCE(${decisionsJson}::jsonb, decisions),
          key_metrics = COALESCE(${metricsJson}::jsonb, key_metrics),
          evidence_sha = COALESCE(${body.evidenceSha ?? null}, evidence_sha),
          updated_at = NOW()
        WHERE id = ${Number(id)} OR slug = ${id}
        RETURNING *
      `;
    } else {
      rows = await sql`
        UPDATE project SET
          title = COALESCE(${body.title ?? null}, title),
          subtitle = COALESCE(${body.subtitle ?? null}, subtitle),
          summary = COALESCE(${body.summary ?? null}, summary),
          description = COALESCE(${body.summary ?? null}, description),
          category = COALESCE(${body.category ?? null}, category),
          publication_state = COALESCE(${body.status ?? null}, publication_state),
          evidence_access = COALESCE(${body.evidenceAccess ?? null}, evidence_access),
          role = COALESCE(${body.role ?? null}, role),
          roles = COALESCE(${body.role ?? null}, roles),
          timeline = COALESCE(${body.timeline ?? null}, timeline),
          featured = COALESCE(${body.featured !== undefined ? Boolean(body.featured) : null}, featured),
          technologies = COALESCE(${techString}, technologies),
          repo_url = COALESCE(${repoUrl}, repo_url),
          demo_url = COALESCE(${demoUrl}, demo_url),
          deploy_url = COALESCE(${demoUrl}, deploy_url),
          architecture_note = COALESCE(${body.architectureNote ?? null}, architecture_note),
          problem = COALESCE(${body.problem ?? null}, problem),
          solution = COALESCE(${body.solution ?? null}, solution),
          decisions = COALESCE(${decisionsJson}::jsonb, decisions),
          key_metrics = COALESCE(${metricsJson}::jsonb, key_metrics),
          evidence_sha = COALESCE(${body.evidenceSha ?? null}, evidence_sha),
          updated_at = NOW()
        WHERE slug = ${id}
        RETURNING *
      `;
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(mapProjectRow(rows[0]));
  } catch (error: any) {
    console.error("PUT /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isNumeric = /^\d+$/.test(id);

    if (isNumeric) {
      await sql`DELETE FROM project WHERE id = ${Number(id)} OR slug = ${id}`;
    } else {
      await sql`DELETE FROM project WHERE slug = ${id}`;
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
