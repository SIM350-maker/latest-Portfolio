'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: true },
});

(async () => {
  const one = async (sql) => (await pool.query(sql)).rows[0];
  const idx = await one("SELECT COUNT(*)::int AS n FROM pg_indexes WHERE schemaname='public'");
  const fk = await one("SELECT COUNT(*)::int AS n FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_type='FOREIGN KEY'");
  const chk = await one("SELECT COUNT(*)::int AS n FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_type='CHECK'");
  const uq = await one("SELECT COUNT(*)::int AS n FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_type='UNIQUE'");
  const trg = await one("SELECT COUNT(*)::int AS n FROM information_schema.triggers WHERE trigger_schema='public'");
  const audit = await one('SELECT COUNT(*)::int AS n FROM audit_log');
  const nn = await one("SELECT COUNT(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name='project' AND column_name='profile_id' AND is_nullable='NO'");
  const notNullFks = await one(`
    SELECT COUNT(*)::int AS n FROM information_schema.columns
    WHERE table_schema='public' AND is_nullable='NO' AND column_default IS NULL
      AND column_name IN ('profile_id','person_id')`);
  const dupes = await one("SELECT COUNT(*)::int AS n FROM (SELECT email FROM profile WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1) d");
  const orphans = await one(`
    SELECT (
      (SELECT COUNT(*) FROM experience x LEFT JOIN profile p ON p.id=x.profile_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM education x LEFT JOIN profile p ON p.id=x.profile_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM project x LEFT JOIN profile p ON p.id=x.profile_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM certifications x LEFT JOIN profile p ON p.id=x.person_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM cv_references x LEFT JOIN profile p ON p.id=x.person_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM recommendations x LEFT JOIN profile p ON p.id=x.person_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM person_skills x LEFT JOIN profile p ON p.id=x.person_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM person_skills x LEFT JOIN skill s ON s.id=x.skill_id WHERE s.id IS NULL) +
      (SELECT COUNT(*) FROM project_skill x LEFT JOIN project p ON p.id=x.project_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM project_skill x LEFT JOIN skill s ON s.id=x.skill_id WHERE s.id IS NULL) +
      (SELECT COUNT(*) FROM project_evidence x LEFT JOIN project p ON p.id=x.project_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM project_evidence x LEFT JOIN evidence e ON e.id=x.evidence_id WHERE e.id IS NULL) +
      (SELECT COUNT(*) FROM skill_evidence x LEFT JOIN skill s ON s.id=x.skill_id WHERE s.id IS NULL) +
      (SELECT COUNT(*) FROM skill_evidence x LEFT JOIN evidence e ON e.id=x.evidence_id WHERE e.id IS NULL) +
      (SELECT COUNT(*) FROM claim_evidence x LEFT JOIN claim c ON c.id=x.claim_id WHERE c.id IS NULL) +
      (SELECT COUNT(*) FROM claim_evidence x LEFT JOIN evidence e ON e.id=x.evidence_id WHERE e.id IS NULL)
    )::int AS orphans`);
  const dateFormats = await one(`
    SELECT
      COUNT(*) FILTER (WHERE start_date !~ '^\\d{4}-\\d{2}$')::int AS non_iso
    FROM (SELECT start_date FROM experience UNION ALL SELECT start_date FROM education) d`);

  console.log('=== FINAL DATABASE STATE ===');
  console.log('indexes:', idx.n, '| FK constraints:', fk.n, '| CHECK:', chk.n, '| UNIQUE:', uq.n, '| triggers:', trg.n);
  console.log('audit_log rows:', audit.n);
  console.log('project.profile_id NOT NULL:', nn.n === 1, '| NOT NULL ownership FKs:', notNullFks.n);
  console.log('duplicate persons by email:', dupes.n, '| orphan FK rows:', orphans.orphans, '| non-ISO dates:', dateFormats.non_iso);
  await pool.end();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
