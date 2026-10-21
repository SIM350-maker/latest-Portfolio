#!/usr/bin/env tsx
/**
 * Migration: Academic Qualifications, Periods, Semesters, Units
 * Run: npx tsx scripts/migrate-academics.ts
 * Requires: DATABASE_URL in environment (.env.local)
 */

import { createRequire } from "module";
const req = createRequire(process.cwd() + "/package.json");
const { neon } = req("@neondatabase/serverless");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_P1s3LRXYJoZQ@ep-wild-bread-b5a2u322-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(databaseUrl);

async function main() {
  console.log("🚀 Starting academic schema migration...");

  // 1. Academic Qualification table
  console.log("\n📋 Creating academic_qualification table...");
  await sql`
    CREATE TABLE IF NOT EXISTS academic_qualification (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      institution TEXT NOT NULL,
      faculty TEXT,
      department TEXT,
      field_of_study TEXT,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      qualification_status TEXT DEFAULT 'Completed',
      display_order INT DEFAULT 0,
      publication_status TEXT DEFAULT 'Draft',
      visibility TEXT DEFAULT 'Private',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 2. Academic Period table
  console.log("📅 Creating academic_period table...");
  await sql`
    CREATE TABLE IF NOT EXISTS academic_period (
      id BIGSERIAL PRIMARY KEY,
      qualification_id BIGINT NOT NULL REFERENCES academic_qualification(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      display_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 3. Academic Semester table
  console.log("📚 Creating academic_semester table...");
  await sql`
    CREATE TABLE IF NOT EXISTS academic_semester (
      id BIGSERIAL PRIMARY KEY,
      period_id BIGINT NOT NULL REFERENCES academic_period(id) ON DELETE CASCADE,
      qualification_id BIGINT NOT NULL REFERENCES academic_qualification(id) ON DELETE CASCADE,
      source_label TEXT NOT NULL,
      semester_number INT,
      academic_year_label TEXT,
      start_date TEXT,
      end_date TEXT,
      display_order INT DEFAULT 0,
      publication_status TEXT DEFAULT 'Draft',
      visibility TEXT DEFAULT 'Private',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 4. Academic Unit table
  console.log("📝 Creating academic_unit table...");
  await sql`
    CREATE TABLE IF NOT EXISTS academic_unit (
      id BIGSERIAL PRIMARY KEY,
      semester_id BIGINT NOT NULL REFERENCES academic_semester(id) ON DELETE CASCADE,
      unit_code TEXT NOT NULL,
      unit_title TEXT NOT NULL,
      credit_hours NUMERIC(6,2),
      grade TEXT,
      result_status TEXT,
      source_reference TEXT,
      source_managed BOOLEAN DEFAULT TRUE,
      display_order INT DEFAULT 0,
      publication_status TEXT DEFAULT 'Draft',
      visibility TEXT DEFAULT 'Private',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (semester_id, unit_code)
    );
  `;

  // 5. Indexes
  console.log("🔍 Creating indexes...");
  await sql`CREATE INDEX IF NOT EXISTS idx_academic_unit_semester ON academic_unit(semester_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_academic_unit_code ON academic_unit(unit_code);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_academic_semester_qual ON academic_semester(qualification_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_academic_period_qual ON academic_period(qualification_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_academic_semester_period ON academic_semester(period_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_academic_unit_pub ON academic_unit(publication_status, visibility) WHERE publication_status = 'Published' AND visibility = 'Public';`;

  // 6. Triggers for updated_at (reuse existing set_updated_at function)
  console.log("⚡ Creating updated_at triggers...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_academic_qualification_timestamp') THEN
        CREATE TRIGGER update_academic_qualification_timestamp
        BEFORE UPDATE ON academic_qualification
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_academic_period_timestamp') THEN
        CREATE TRIGGER update_academic_period_timestamp
        BEFORE UPDATE ON academic_period
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_academic_semester_timestamp') THEN
        CREATE TRIGGER update_academic_semester_timestamp
        BEFORE UPDATE ON academic_semester
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_academic_unit_timestamp') THEN
        CREATE TRIGGER update_academic_unit_timestamp
        BEFORE UPDATE ON academic_unit
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$;
  `;

  // 7. Audit triggers (reuse existing fn_audit_row)
  console.log("📋 Creating audit triggers...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_academic_qualification') THEN
        CREATE TRIGGER audit_academic_qualification
        AFTER INSERT OR UPDATE OR DELETE ON academic_qualification
        FOR EACH ROW EXECUTE FUNCTION fn_audit_row();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_academic_period') THEN
        CREATE TRIGGER audit_academic_period
        AFTER INSERT OR UPDATE OR DELETE ON academic_period
        FOR EACH ROW EXECUTE FUNCTION fn_audit_row();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_academic_semester') THEN
        CREATE TRIGGER audit_academic_semester
        AFTER INSERT OR UPDATE OR DELETE ON academic_semester
        FOR EACH ROW EXECUTE FUNCTION fn_audit_row();
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_academic_unit') THEN
        CREATE TRIGGER audit_academic_unit
        AFTER INSERT OR UPDATE OR DELETE ON academic_unit
        FOR EACH ROW EXECUTE FUNCTION fn_audit_row();
      END IF;
    END $$;
  `;

  // 8. Verify
  console.log("\n✅ Verifying migration...");
  const tables = await sql.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'academic_%' ORDER BY table_name`,
    []
  );
  console.log("Tables created:", tables.map((t: any) => t.table_name).join(", "));

  for (const t of tables) {
    const cols = await sql.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [t.table_name]
    );
    console.log(`  ${t.table_name}:`, cols.map((c: any) => `${c.column_name}:${c.data_type}`).join(", "));
  }

  console.log("\n🎉 Academic schema migration completed successfully!");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});