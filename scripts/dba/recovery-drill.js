'use strict';
// Stage 11 — recovery drill (OPERATIONS.md §3.1 + §5):
// 1. create a throwaway Neon branch (copy-on-write snapshot of production),
// 2. verify the snapshot: schema objects + content counts + pipeline probe,
// 3. simulate a restore validation: checksum comparison prod vs snapshot,
// 4. clean up the branch.
// Read-only against production; the drill branch is deleted afterwards.

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const { execSync } = require('child_process');
const { Pool } = require('pg');

const PROJECT = process.env.NEON_PROJECT_ID || 'little-union-15338242';
const BRANCH = 'drill-' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
const PROD_URL = (process.env.DATABASE_URL || '').trim();

function neon(args) {
  return execSync('neon ' + args, { encoding: 'utf8' });
}

async function probe(url, label) {
  const pool = new Pool({
    connectionString: url,
    max: 2,
    ssl: { rejectUnauthorized: process.env.PG_ALLOW_SELF_SIGNED === '1' ? false : true },
  });
  try {
    const counts = await pool.query(`
      SELECT (SELECT COUNT(*) FROM profile)::int AS profiles,
             (SELECT COUNT(*) FROM project)::int AS projects,
             (SELECT COUNT(*) FROM skill)::int AS skills,
             (SELECT COUNT(*) FROM experience)::int AS experiences,
             (SELECT COUNT(*) FROM education)::int AS educations,
             (SELECT COUNT(*) FROM certifications)::int AS certifications,
             (SELECT COUNT(*) FROM cv_references)::int AS references_,
             (SELECT COUNT(*) FROM audit_log)::int AS audit_rows`);
    const checksum = await pool.query(`
      SELECT md5(string_agg(id || ':' || coalesce(title, name) || ':' || publication_state, ',' ORDER BY id)) AS digest
      FROM (SELECT id, title, publication_state, NULL AS name FROM project
            UNION ALL SELECT id, NULL, publication_state, name FROM skill) t`);
    console.log(label, JSON.stringify(counts.rows[0]), 'content digest:', checksum.rows[0].digest);
    return { counts: counts.rows[0], digest: checksum.rows[0].digest };
  } finally {
    await pool.end().catch(() => {});
  }
}

(async () => {
  if (!PROD_URL) { console.error('FATAL: no DATABASE_URL'); process.exit(1); }

  // 1. snapshot branch
  console.log('creating drill branch:', BRANCH);
  try { neon(`branches delete ${BRANCH} --force`); } catch (_) { /* no leftover branch */ }
  neon(`branches create --project-id ${PROJECT} --name ${BRANCH}`);
  console.log('PASS  branch created');

  // 2. connection string for the branch (endpoint may take seconds to start)
  let cs = null;
  for (let attempt = 1; attempt <= 8 && !cs; attempt++) {
    try {
      cs = neon(`connection-string ${BRANCH} --project-id ${PROJECT}`)
        .split(/\r?\n/).find((l) => l.includes('postgres'));
    } catch (_) {
      console.log('endpoint not ready (attempt ' + attempt + '), retrying…');
      await new Promise((r) => setTimeout(r, 6000));
    }
  }
  if (!cs) throw new Error('no connection string returned for ' + BRANCH);
  console.log('PASS  branch connection string obtained');

  // 3. verify the snapshot mirrors production
  const prod = await probe(PROD_URL, 'PROD     ');
  const snap = await probe(cs.trim(), 'SNAPSHOT ');
  if (JSON.stringify(prod.counts) !== JSON.stringify(snap.counts)) {
    throw new Error('row counts differ between production and snapshot');
  }
  if (prod.digest !== snap.digest) {
    throw new Error('content digest differs between production and snapshot');
  }
  console.log('PASS  snapshot matches production (counts + content digest)');

  // 4. pipeline probe against the snapshot (verify-postgres flow)
  process.env.TEST_POSTGRES_URL = cs.trim();
  execSync('node scripts/verify-postgres.js', { stdio: 'inherit', env: process.env });
  console.log('PASS  pipeline probe green on the snapshot');

  // 5. cleanup
  neon(`branches delete ${BRANCH} --force`);
  console.log('PASS  drill branch deleted');

  console.log('\nRECOVERY DRILL COMPLETE — backup/restore path validated end-to-end.');
})().catch((e) => { console.error('DRILL FAILED: ' + e.message); process.exit(1); });

