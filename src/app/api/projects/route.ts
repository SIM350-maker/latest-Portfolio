import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { mapProjectRow } from "@/lib/mappers";
import { INITIAL_PROJECTS } from "@/data/initialData";


export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM project 
      ORDER BY featured DESC NULLS LAST, id ASC
    `;
    if (rows.length === 0) {
      return NextResponse.json(INITIAL_PROJECTS);
    }
    const projects = rows.map(mapProjectRow);
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(INITIAL_PROJECTS, { status: 200 });
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
        : `proj-${Date.now()}`);

    const techString = JSON.stringify(body.technologies || []);
    const decisionsJson = JSON.stringify(body.decisions || []);
    const metricsJson = JSON.stringify(body.keyMetrics || []);
    const demoUrl = body.demoUrl && body.demoUrl.startsWith("http") ? body.demoUrl : null;
    const repoUrl = body.repoUrl && body.repoUrl.startsWith("http") ? body.repoUrl : null;

    const rows = await sql`
      INSERT INTO project (
        slug, title, subtitle, summary, description, category, publication_state,
        evidence_access, role, roles, timeline, featured, technologies,
        repo_url, demo_url, deploy_url, architecture_note, problem, solution,
        decisions, key_metrics, evidence_sha, profile_id, created_at, updated_at
      ) VALUES (
        ${slug}, ${body.title || "New Project"}, ${body.subtitle || ""}, ${body.summary || ""},
        ${body.summary || body.description || ""}, ${body.category || "Full Stack"},
        ${body.status || "Draft"}, ${body.evidenceAccess || "Public"},
        ${body.role || "Software Engineer"}, ${body.role || "Software Engineer"},
        ${body.timeline || "2026"}, ${Boolean(body.featured)}, ${techString},
        ${repoUrl}, ${demoUrl}, ${demoUrl},
        ${body.architectureNote || null}, ${body.problem || ""}, ${body.solution || ""},
        ${decisionsJson}::jsonb, ${metricsJson}::jsonb,
        ${body.evidenceSha || null}, 1, NOW(), NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(mapProjectRow(rows[0]), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
