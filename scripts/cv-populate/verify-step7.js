'use strict';
// STEP 7 — POST-POPULATION VERIFICATION (read-only, after COMMIT).

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');
const url = (process.env.TEST_POSTGRES_URL || process.env.DATABASE_URL).trim();
const pool = new Pool({
  connectionString: url,
  max: 2,
  ssl: /sslmode=(?!disable)/.test(url)
    ? { rejectUnauthorized: process.env.PG_ALLOW_SELF_SIGNED === '1' ? false : true }
    : undefined,
});

async function main() {
  const q = async (label, sql, params = []) => {
    const r = await pool.query(sql, params);
    console.log(label.padEnd(58), JSON.stringify(r.rows[0]));
    return r.rows[0];
  };

  await q('1. persons with email=simonipara428@gmail.com:',
    "SELECT COUNT(*)::int AS count FROM profile WHERE email='simonipara428@gmail.com'");
  await q('2. skills linked to person:',
    'SELECT COUNT(*)::int AS count FROM person_skills ps JOIN profile p ON p.id = ps.person_id WHERE p.email = \'simonipara428@gmail.com\'');
  await q('3. projects for person:',
    'SELECT COUNT(*)::int AS count FROM project WHERE profile_id = (SELECT id FROM profile WHERE email = \'simonipara428@gmail.com\')');
  await q('4. experiences (CV-matched):',
    "SELECT COUNT(*)::int AS count FROM experience WHERE profile_id = (SELECT id FROM profile WHERE email = 'simonipara428@gmail.com')");
  await q('5. education rows (CV-matched):',
    "SELECT COUNT(*)::int AS count FROM education WHERE profile_id = (SELECT id FROM profile WHERE email = 'simonipara428@gmail.com') AND institution = 'Chuka University'");
  await q('6. certifications:',
    'SELECT COUNT(*)::int AS count FROM certifications WHERE person_id = (SELECT id FROM profile WHERE email = \'simonipara428@gmail.com\')');
  await q('7. references:',
    'SELECT COUNT(*)::int AS count FROM cv_references WHERE person_id = (SELECT id FROM profile WHERE email = \'simonipara428@gmail.com\')');
  await q('7b. recommendations:',
    'SELECT COUNT(*)::int AS count FROM recommendations WHERE person_id = (SELECT id FROM profile WHERE email = \'simonipara428@gmail.com\')');
  await q('8. orphan FK rows (all relationships):',
    `SELECT (
      (SELECT COUNT(*) FROM person_skills ps LEFT JOIN profile p ON p.id = ps.person_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM person_skills ps LEFT JOIN skill s ON s.id = ps.skill_id WHERE s.id IS NULL) +
      (SELECT COUNT(*) FROM project_skill x LEFT JOIN project p ON p.id = x.project_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM project_skill x LEFT JOIN skill s ON s.id = x.skill_id WHERE s.id IS NULL) +
      (SELECT COUNT(*) FROM project_evidence x LEFT JOIN project p ON p.id = x.project_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM project_evidence x LEFT JOIN evidence e ON e.id = x.evidence_id WHERE e.id IS NULL) +
      (SELECT COUNT(*) FROM skill_evidence x LEFT JOIN skill s ON s.id = x.skill_id WHERE s.id IS NULL) +
      (SELECT COUNT(*) FROM skill_evidence x LEFT JOIN evidence e ON e.id = x.evidence_id WHERE e.id IS NULL) +
      (SELECT COUNT(*) FROM claim_evidence x LEFT JOIN claim c ON c.id = x.claim_id WHERE c.id IS NULL) +
      (SELECT COUNT(*) FROM claim_evidence x LEFT JOIN evidence e ON e.id = x.evidence_id WHERE e.id IS NULL) +
      (SELECT COUNT(*) FROM experience x LEFT JOIN profile p ON p.id = x.profile_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM education x LEFT JOIN profile p ON p.id = x.profile_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM certifications x LEFT JOIN profile p ON p.id = x.person_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM cv_references x LEFT JOIN profile p ON p.id = x.person_id WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM recommendations x LEFT JOIN profile p ON p.id = x.person_id WHERE p.id IS NULL)
    )::int AS orphans`);
  await q('9. duplicate persons by email:',
    'SELECT COUNT(*)::int AS count FROM (SELECT email FROM profile WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1) d');
  await q('population_warnings logged:',
    'SELECT COUNT(*)::int AS count FROM population_warnings');
}

main()
  .catch((e) => { console.error('FATAL: ' + e.message); process.exitCode = 1; })
  .finally(() => pool.end().catch(() => {}));
