import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { INITIAL_PROFILE, Profile } from "@/data/initialData";


export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM profile WHERE id = 1 LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json(INITIAL_PROFILE);
    }
    const row = rows[0];
    const profile: Profile = {
      name: row.name || INITIAL_PROFILE.name,
      title: row.role || INITIAL_PROFILE.title,
      location: row.location || INITIAL_PROFILE.location,
      timezone: row.timezone || INITIAL_PROFILE.timezone,
      email: row.email || INITIAL_PROFILE.email,
      github: row.github || INITIAL_PROFILE.github,
      githubUrl: `https://github.com/${row.github || INITIAL_PROFILE.github}`,
      linkedin: row.linkedin || INITIAL_PROFILE.linkedin,
      linkedinUrl: row.linkedin?.startsWith("http")
        ? row.linkedin
        : `https://linkedin.com/in/${row.linkedin || INITIAL_PROFILE.linkedin}`,
      bioHeadline: row.bio_headline || row.summary || INITIAL_PROFILE.bioHeadline,
      bioSub: row.bio_sub || row.summary || INITIAL_PROFILE.bioSub,
      status: row.status || INITIAL_PROFILE.status,
      uptime: row.uptime || INITIAL_PROFILE.uptime,
      latencyAvg: row.latency_avg || INITIAL_PROFILE.latencyAvg,
      architectureStyle: row.architecture_style || INITIAL_PROFILE.architectureStyle,
      provenance: row.provenance || INITIAL_PROFILE.provenance,
    };
    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(INITIAL_PROFILE, { status: 200 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    await sql`
      UPDATE profile SET
        name = COALESCE(${body.name ?? null}, name),
        role = COALESCE(${body.title ?? null}, role),
        location = COALESCE(${body.location ?? null}, location),
        timezone = COALESCE(${body.timezone ?? null}, timezone),
        email = COALESCE(${body.email ?? null}, email),
        github = COALESCE(${body.github ?? null}, github),
        linkedin = COALESCE(${body.linkedin ?? null}, linkedin),
        bio_headline = COALESCE(${body.bioHeadline ?? null}, bio_headline),
        bio_sub = COALESCE(${body.bioSub ?? null}, bio_sub),
        status = COALESCE(${body.status ?? null}, status),
        uptime = COALESCE(${body.uptime ?? null}, uptime),
        latency_avg = COALESCE(${body.latencyAvg ?? null}, latency_avg),
        architecture_style = COALESCE(${body.architectureStyle ?? null}, architecture_style),
        provenance = COALESCE(${body.provenance ?? null}, provenance),
        updated_at = NOW()
      WHERE id = 1
    `;
    return NextResponse.json({ success: true, profile: body });
  } catch (error: any) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
