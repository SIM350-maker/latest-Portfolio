import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { INITIAL_SKILLS, SkillCategory } from "@/data/initialData";


export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM skill 
      WHERE publication_state = 'Published' OR publication_state IS NULL
      ORDER BY category ASC, id ASC
    `;

    if (rows.length === 0) {
      return NextResponse.json(INITIAL_SKILLS);
    }

    // Group skills by category
    const categoryMap = new Map<string, { category: string; description: string; skills: any[] }>();

    for (const row of rows) {
      const catName = row.category || "General Engineering";
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, {
          category: catName,
          description: `Technical competencies, frameworks, and system proficiencies in ${catName}.`,
          skills: [],
        });
      }
      categoryMap.get(catName)!.skills.push({
        name: row.name,
        level: row.level || "Production",
        evidenceCount: Number(row.evidence_count) || 1,
        description: row.description || `Practical application and production engineering with ${row.name}.`,
      });
    }

    const categories: SkillCategory[] = Array.from(categoryMap.values());
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET /api/skills error:", error);
    return NextResponse.json(INITIAL_SKILLS, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rows = await sql`
      INSERT INTO skill (
        name, category, description, level, evidence_count, publication_state, created_at, updated_at
      ) VALUES (
        ${body.name}, ${body.category || "Languages"}, ${body.description || ""},
        ${body.level || "Production"}, ${Number(body.evidenceCount) || 1},
        'Published', NOW(), NOW()
      )
      RETURNING *
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error("POST /api/skills error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
