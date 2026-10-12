'use strict';
// DBA Remediation execution — applies scripts/dba/001-dba-remediation.sql
// in the documented order: date normalization → DDL → verification.
// Idempotent; additive-only; never deletes data.

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const url = (process.env.TEST_POSTGRES_URL || process.env.DATABASE_URL || '').trim();
if (!url) { console.error('FATAL: no DATABASE_URL'); process.exit(1); }
const pool = new Pool({
  connectionString: url,
  max: 2,
  ssl: /sslmode=(?!disable)/.test(url) ? { rejectUnauthorized: process.env.PG_ALLOW_SELF_SIGNED === '1' ? false : true } : undefined,
});

const NORMALIZATIONS = [
  ["UPDATE experience SET start_date = '2025-05' WHERE start_date = 'May 2025'", 'experience.start_date May 2025'],
  ["UPDATE experience SET start_date = '2026-07' WHERE start_date = 'July 2026'", 'experience.start_date July 2026'],
  ["UPDATE experience SET end_date = '2025-08' WHERE end_date = 'August 2025'", 'experience.end_date August 2025'],
  ["UPDATE education SET start_date = '2022-09' WHERE start_date = 'September 2022'", 'education.start_date September 2022'],
  ["UPDATE education SET end_date = '2026-04' WHERE end_date = 'April 2026'", 'education.end_date April 2026'],
];

async function main() {
  const client = await pool.connect();
  try {
    // 1. Date normalization (gate for the ISO CHECK constraints)
    await client.query('BEGIN');
    for (const [sql, label] of NORMALIZATIONS) {
      const r = await client.query(sql);
      console.log('NORMALIZE ' + label + ' — rows: ' + r.rowCount);
    }
    await client.query('COMMIT');

    // 2. Remediation DDL
    const ddl = fs.readFileSync(path.resolve(__dirname, '001-dba-remediation.sql'), 'utf8');
    await client.query(ddl);
    console.log('DDL   001-dba-remediation.sql applied');

    // 3. Content hygiene: backfill project ownership, unpublish legacy rows
    await client.query('BEGIN');
    const backfill = await client.query(
      'UPDATE project SET profile_id = (SELECT id FROM profile ORDER BY id LIMIT 1) WHERE profile_id IS NULL'
    );
    console.log('BACKFILL project.profile_id — rows: ' + backfill.rowCount);
    const unpublishLegacyProject = await client.query(
      "UPDATE project SET publication_state = 'Draft' WHERE title = 'Evidence-Based Portfolio System'"
    );
    console.log('UNPUBLISH legacy project — rows: ' + unpublishLegacyProject.rowCount);
    const unpublishLegacySkill = await client.query(
      "UPDATE skill SET publication_state = 'Draft' WHERE name = 'Node.js'"
    );
    console.log('UNPUBLISH legacy skill — rows: ' + unpublishLegacySkill.rowCount);
    await client.query(
      'ALTER TABLE project ALTER COLUMN profile_id SET NOT NULL'
    );
    console.log('CONSTRAINT project.profile_id SET NOT NULL');
    await client.query('COMMIT');

    // 4. Refresh planner statistics
    await client.query('ANALYZE');
    console.log('ANALYZE executed');
  } catch (err) {
    console.error('FATAL: ' + err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

main();
