import { neon } from "@neondatabase/serverless";
import {
  INITIAL_PROFILE,
  INITIAL_PROJECTS,
  INITIAL_SKILLS,
  INITIAL_EVIDENCE,
  INITIAL_EXPERIENCE
} from "../src/data/initialData";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_P1s3LRXYJoZQ@ep-wild-bread-b5a2u322-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(databaseUrl);

async function main() {
  console.log("🌱 Starting Neon Database schema verification and data seeding...");

  // 1. Ensure columns exist on tables
  console.log("🛠️ Verifying database columns...");
  await sql`
    ALTER TABLE profile
    ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'EAT (UTC+3)',
    ADD COLUMN IF NOT EXISTS bio_headline TEXT,
    ADD COLUMN IF NOT EXISTS bio_sub TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN TO ROLES & COLLABORATION',
    ADD COLUMN IF NOT EXISTS uptime TEXT DEFAULT '99.98%',
    ADD COLUMN IF NOT EXISTS latency_avg TEXT DEFAULT '0.8ms API Avg',
    ADD COLUMN IF NOT EXISTS architecture_style TEXT DEFAULT 'Micro-modular Next.js / PostgreSQL / REST / Cloudflare Edge',
    ADD COLUMN IF NOT EXISTS provenance TEXT DEFAULT 'Ed25519 Signed / Cryptographic Audit Trail Active';
  `;

  await sql`
    ALTER TABLE project
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS subtitle TEXT,
    ADD COLUMN IF NOT EXISTS summary TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Full Stack',
    ADD COLUMN IF NOT EXISTS evidence_access TEXT DEFAULT 'Public',
    ADD COLUMN IF NOT EXISTS role TEXT,
    ADD COLUMN IF NOT EXISTS timeline TEXT,
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS repo_url TEXT,
    ADD COLUMN IF NOT EXISTS demo_url TEXT,
    ADD COLUMN IF NOT EXISTS architecture_note TEXT,
    ADD COLUMN IF NOT EXISTS problem TEXT,
    ADD COLUMN IF NOT EXISTS solution TEXT,
    ADD COLUMN IF NOT EXISTS decisions JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS key_metrics JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS evidence_sha TEXT;
  `;

  await sql`
    ALTER TABLE evidence
    ADD COLUMN IF NOT EXISTS slug TEXT,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS project_slug TEXT,
    ADD COLUMN IF NOT EXISTS project_name TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Code Repository',
    ADD COLUMN IF NOT EXISTS access TEXT DEFAULT 'Public',
    ADD COLUMN IF NOT EXISTS sha256 TEXT,
    ADD COLUMN IF NOT EXISTS date TEXT,
    ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'VERIFIED';
  `;

  await sql`
    ALTER TABLE experience
    ADD COLUMN IF NOT EXISTS role TEXT,
    ADD COLUMN IF NOT EXISTS organization TEXT,
    ADD COLUMN IF NOT EXISTS period TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Work',
    ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
  `;

  await sql`
    ALTER TABLE skill
    ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Proficient',
    ADD COLUMN IF NOT EXISTS evidence_count INTEGER DEFAULT 1;
  `;

  await sql`
    ALTER TABLE contact_messages
    ADD COLUMN IF NOT EXISTS subject TEXT;
  `;

  // 2. Seed / Update Profile (singleton row 1)
  console.log("👤 Syncing Profile data in Neon...");
  const existingProfiles = await sql`SELECT id FROM profile WHERE id = 1 LIMIT 1`;
  if (existingProfiles.length === 0) {
    await sql`
      INSERT INTO profile (
        id, name, role, summary, contact_info, email, location, phone, github, portfolio, linkedin,
        timezone, bio_headline, bio_sub, status, uptime, latency_avg, architecture_style, provenance,
        publication_state, singleton
      ) VALUES (
        1, ${INITIAL_PROFILE.name}, ${INITIAL_PROFILE.title}, ${INITIAL_PROFILE.bioSub},
        ${INITIAL_PROFILE.location + " • " + INITIAL_PROFILE.email},
        ${INITIAL_PROFILE.email}, ${INITIAL_PROFILE.location}, '+254 791 267 482',
        ${INITIAL_PROFILE.github}, 'https://simonipara.dev', ${INITIAL_PROFILE.linkedin},
        ${INITIAL_PROFILE.timezone}, ${INITIAL_PROFILE.bioHeadline}, ${INITIAL_PROFILE.bioSub},
        ${INITIAL_PROFILE.status}, ${INITIAL_PROFILE.uptime}, ${INITIAL_PROFILE.latencyAvg},
        ${INITIAL_PROFILE.architectureStyle}, ${INITIAL_PROFILE.provenance},
        'Published', 1
      )
    `;
  } else {
    await sql`
      UPDATE profile SET
        name = ${INITIAL_PROFILE.name},
        role = ${INITIAL_PROFILE.title},
        summary = ${INITIAL_PROFILE.bioSub},
        email = ${INITIAL_PROFILE.email},
        location = ${INITIAL_PROFILE.location},
        github = ${INITIAL_PROFILE.github},
        linkedin = ${INITIAL_PROFILE.linkedin},
        timezone = ${INITIAL_PROFILE.timezone},
        bio_headline = ${INITIAL_PROFILE.bioHeadline},
        bio_sub = ${INITIAL_PROFILE.bioSub},
        status = ${INITIAL_PROFILE.status},
        uptime = ${INITIAL_PROFILE.uptime},
        latency_avg = ${INITIAL_PROFILE.latencyAvg},
        architecture_style = ${INITIAL_PROFILE.architectureStyle},
        provenance = ${INITIAL_PROFILE.provenance},
        publication_state = 'Published',
        updated_at = NOW()
      WHERE id = 1
    `;
  }

  // 3. Seed / Update Projects
  console.log("📁 Syncing Projects data in Neon...");
  for (const proj of INITIAL_PROJECTS) {
    const existing = await sql`
      SELECT id FROM project 
      WHERE slug = ${proj.slug} OR title ILIKE ${'%' + proj.slug.replace('-', '%') + '%'} 
      LIMIT 1
    `;

    const techString = JSON.stringify(proj.technologies);
    const decisionsJson = JSON.stringify(proj.decisions || []);
    const metricsJson = JSON.stringify(proj.keyMetrics || []);

    const demoUrl = proj.demoUrl && proj.demoUrl.startsWith("http") ? proj.demoUrl : null;
    const repoUrl = proj.repoUrl && proj.repoUrl.startsWith("http") ? proj.repoUrl : null;

    if (existing.length > 0) {
      await sql`
        UPDATE project SET
          slug = ${proj.slug},
          title = ${proj.title},
          subtitle = ${proj.subtitle},
          summary = ${proj.summary},
          description = ${proj.summary},
          category = ${proj.category},
          publication_state = ${proj.status},
          evidence_access = ${proj.evidenceAccess},
          role = ${proj.role},
          roles = ${proj.role},
          timeline = ${proj.timeline},
          featured = ${proj.featured},
          technologies = ${techString},
          repo_url = ${repoUrl},
          demo_url = ${demoUrl},
          deploy_url = ${demoUrl},
          architecture_note = ${proj.architectureNote || null},
          problem = ${proj.problem},
          solution = ${proj.solution},
          decisions = ${decisionsJson}::jsonb,
          key_metrics = ${metricsJson}::jsonb,
          evidence_sha = ${proj.evidenceSha || null},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO project (
          slug, title, subtitle, summary, description, category, publication_state,
          evidence_access, role, roles, timeline, featured, technologies,
          repo_url, demo_url, deploy_url, architecture_note, problem, solution,
          decisions, key_metrics, evidence_sha, profile_id, created_at, updated_at
        ) VALUES (
          ${proj.slug}, ${proj.title}, ${proj.subtitle}, ${proj.summary}, ${proj.summary},
          ${proj.category}, ${proj.status}, ${proj.evidenceAccess}, ${proj.role}, ${proj.role},
          ${proj.timeline}, ${proj.featured}, ${techString}, ${repoUrl},
          ${demoUrl}, ${demoUrl}, ${proj.architectureNote || null},
          ${proj.problem}, ${proj.solution}, ${decisionsJson}::jsonb, ${metricsJson}::jsonb,
          ${proj.evidenceSha || null}, 1, NOW(), NOW()
        )
      `;
    }
  }

  // 4. Seed / Update Evidence
  console.log("🛡️ Syncing Evidence ledger in Neon...");
  for (const evd of INITIAL_EVIDENCE) {
    const existing = await sql`SELECT id FROM evidence WHERE slug = ${evd.slug} LIMIT 1`;
    if (existing.length > 0) {
      await sql`
        UPDATE evidence SET
          title = ${evd.title},
          project_slug = ${evd.projectSlug},
          project_name = ${evd.projectName},
          type = ${evd.type},
          access = ${evd.access},
          accessibility_status = ${evd.access},
          sha256 = ${evd.sha256},
          description = ${evd.description},
          date = ${evd.date},
          verification_status = ${evd.verificationStatus},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO evidence (
          slug, title, project_slug, project_name, type, access, accessibility_status,
          sha256, description, date, verification_status, created_at, updated_at
        ) VALUES (
          ${evd.slug}, ${evd.title}, ${evd.projectSlug}, ${evd.projectName},
          ${evd.type}, ${evd.access}, ${evd.access}, ${evd.sha256}, ${evd.description},
          ${evd.date}, ${evd.verificationStatus}, NOW(), NOW()
        )
      `;
    }
  }

  // 5. Seed Skills
  console.log("⚡ Syncing Skills taxonomy in Neon...");
  for (const cat of INITIAL_SKILLS) {
    for (const sk of cat.skills) {
      const existing = await sql`SELECT id FROM skill WHERE name = ${sk.name} LIMIT 1`;
      if (existing.length > 0) {
        await sql`
          UPDATE skill SET
            category = ${cat.category},
            description = ${sk.description},
            level = ${sk.level},
            evidence_count = ${sk.evidenceCount},
            publication_state = 'Published',
            updated_at = NOW()
          WHERE id = ${existing[0].id}
        `;
      } else {
        await sql`
          INSERT INTO skill (
            name, category, description, level, evidence_count, publication_state, created_at, updated_at
          ) VALUES (
            ${sk.name}, ${cat.category}, ${sk.description}, ${sk.level}, ${sk.evidenceCount}, 'Published', NOW(), NOW()
          )
        `;
      }
    }
  }

  // 6. Seed Experience
  console.log("📜 Syncing Experience history in Neon...");
  for (const exp of INITIAL_EXPERIENCE) {
    const existing = await sql`
      SELECT id FROM experience 
      WHERE (role = ${exp.role} OR title = ${exp.role}) 
      AND (organization = ${exp.organization} OR company = ${exp.organization})
      LIMIT 1
    `;
    const highlightsJson = JSON.stringify(exp.highlights);
    const skillsJson = JSON.stringify(exp.skills);

    const rawYear = exp.period.split('—')[0].trim();
    const startDate = /^\d{4}-\d{2}$/.test(rawYear) ? rawYear : `${rawYear.slice(0, 4)}-01`;

    if (existing.length > 0) {
      await sql`
        UPDATE experience SET
          title = ${exp.role},
          role = ${exp.role},
          company = ${exp.organization},
          organization = ${exp.organization},
          location = ${exp.location},
          period = ${exp.period},
          type = ${exp.type},
          description = ${exp.highlights.join(' ')},
          highlights = ${highlightsJson}::jsonb,
          skills = ${skillsJson}::jsonb,
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO experience (
          profile_id, title, role, company, organization, location,
          period, start_date, is_current, type, description, highlights, skills,
          created_at, updated_at
        ) VALUES (
          1, ${exp.role}, ${exp.role}, ${exp.organization}, ${exp.organization},
          ${exp.location}, ${exp.period}, ${startDate},
          ${exp.period.includes('Present')}, ${exp.type}, ${exp.highlights.join(' ')},
          ${highlightsJson}::jsonb, ${skillsJson}::jsonb, NOW(), NOW()
        )
      `;
    }
  }

  console.log("✅ Neon Database seeding and synchronization completed successfully!");
}

main().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});
