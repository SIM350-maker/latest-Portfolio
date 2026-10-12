'use strict';

// One-time data migration: SQLite (local dev database) → PostgreSQL (Neon).
//
// Usage:  node scripts/migrate-sqlite-to-postgres.js [--sqlite <path>]
// Target: TEST_POSTGRES_URL, falling back to DATABASE_URL (Neon).
//
// Semantics:
//  - idempotent: every INSERT is ON CONFLICT DO NOTHING (by primary key /
//    unique key), so re-runs are safe and partial failures resume cleanly.
//  - dependency-ordered: profile → project, skill, evidence, claim →
//    experience, education → join tables.
//  - explicit ids are inserted (identity columns are BY DEFAULT), and every
//    identity sequence is reset past the max id afterwards.
//  - the whole run is one transaction: all-or-nothing.

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const loaded = require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
for (const [key, value] of Object.entries(loaded.parsed || {})) {
  if (typeof value === 'string' && value.includes('$$')) {
    process.env[key] = value.replace(/\$\$/g, '$');
  }
}

const Database = require('better-sqlite3');
const { Pool } = require('pg');

function targetConnectionString() {
  return (process.env.TEST_POSTGRES_URL || process.env.DATABASE_URL || '').trim();
}

function sqlitePath() {
  const idx = process.argv.indexOf('--sqlite');
  if (idx !== -1 && process.argv[idx + 1]) return path.resolve(process.argv[idx + 1]);
  const explicit = process.env.DB_PATH && process.env.DB_PATH.trim();
  if (explicit) return path.resolve(process.cwd(), explicit);
  return path.resolve(__dirname, '..', 'data', 'dev.db');
}

// column order matches each SQLite table; INSERT lists columns explicitly so
// NULLs and defaults behave identically across drivers.
const TABLES = [
  {
    name: 'profile',
    cols: ['id', 'name', 'role', 'summary', 'contact_info', 'publication_state', 'created_at', 'updated_at'],
    conflict: '(id) DO NOTHING',
  },
  {
    name: 'project',
    cols: ['id', 'title', 'description', 'outcomes', 'roles', 'technologies', 'publication_state', 'created_at', 'updated_at'],
    conflict: '(id) DO NOTHING',
  },
  {
    name: 'skill',
    cols: ['id', 'name', 'description', 'publication_state', 'created_at', 'updated_at'],
    conflict: '(id) DO NOTHING',
  },
  {
    name: 'evidence',
    cols: ['id', 'description', 'file_path', 'file_type', 'accessibility_status', 'created_at', 'updated_at'],
    conflict: '(id) DO NOTHING',
  },
  {
    name: 'claim',
    cols: ['id', 'statement', 'justification', 'source_entity_type', 'source_entity_id', 'publication_state', 'created_at', 'updated_at'],
    conflict: '(id) DO NOTHING',
  },
  {
    name: 'experience',
    cols: ['id', 'profile_id', 'title', 'company', 'start_date', 'end_date', 'description', 'created_at', 'updated_at'],
    conflict: '(id) DO NOTHING',
  },
  {
    name: 'education',
    cols: ['id', 'profile_id', 'institution', 'degree', 'field_of_study', 'start_date', 'end_date', 'description', 'created_at', 'updated_at'],
    conflict: '(id) DO NOTHING',
  },
  {
    name: 'project_skill',
    cols: ['project_id', 'skill_id', 'created_at'],
    conflict: '(project_id, skill_id) DO NOTHING',
    noSeq: true,
  },
  {
    name: 'project_evidence',
    cols: ['project_id', 'evidence_id', 'created_at'],
    conflict: '(project_id, evidence_id) DO NOTHING',
    noSeq: true,
  },
  {
    name: 'skill_evidence',
    cols: ['skill_id', 'evidence_id', 'created_at'],
    conflict: '(skill_id, evidence_id) DO NOTHING',
    noSeq: true,
  },
  {
    name: 'claim_evidence',
    cols: ['claim_id', 'evidence_id', 'created_at'],
    conflict: '(claim_id, evidence_id) DO NOTHING',
    noSeq: true,
  },
];

async function main() {
  const cs = targetConnectionString();
  if (!cs) {
    console.error('FATAL: set TEST_POSTGRES_URL or DATABASE_URL for the migration target.');
    process.exit(1);
  }
  const sPath = sqlitePath();
  if (!require('fs').existsSync(sPath)) {
    console.error('FATAL: SQLite database not found at ' + sPath);
    process.exit(1);
  }

  const sqlite = new Database(sPath, { readonly: true });
  sqlite.pragma('foreign_keys = OFF'); // read-only dump; FK order handled by insert order
  const pg = new Pool({
    connectionString: cs,
    max: 2,
    // Only negotiate TLS when the connection string asks for it (Neon) —
    // local/CI service containers do not support SSL.
    ssl: /sslmode=(?!disable)/.test(cs)
      ? { rejectUnauthorized: process.env.PG_ALLOW_SELF_SIGNED === '1' ? false : true }
      : undefined,
  });

  const client = await pg.connect();
  let totalRows = 0;
  try {
    await client.query('BEGIN');

    for (const t of TABLES) {
      const hasTable = sqlite.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
      ).get(t.name);
      if (!hasTable) {
        console.log('SKIP  ' + t.name + ' (not present in SQLite source)');
        continue;
      }
      const rows = sqlite.prepare('SELECT ' + t.cols.join(', ') + ' FROM ' + t.name).all();
      let inserted = 0;
      for (const row of rows) {
        const placeholders = t.cols.map((_, i) => '$' + (i + 1));
        const res = await client.query(
          'INSERT INTO ' + t.name + ' (' + t.cols.join(', ') + ') VALUES (' + placeholders.join(', ') + ') ON CONFLICT ' + t.conflict,
          t.cols.map((c) => row[c] ?? null)
        );
        inserted += res.rowCount;
      }
      totalRows += inserted;
      console.log((rows.length === 0 ? 'EMPTY ' : 'OK    ') + t.name + ': ' + rows.length + ' rows, ' + inserted + ' newly inserted');

      if (!t.noSeq && rows.length > 0) {
        const maxId = Math.max(...rows.map((r) => Number(r.id) || 0));
        await client.query(
          "SELECT setval(pg_get_serial_sequence('" + t.name + "', 'id'), $1, false)",
          [maxId + 1]
        );
      }
    }

    await client.query('COMMIT');
    console.log('\nMigration committed. ' + totalRows + ' row(s) newly stored in PostgreSQL.');
    const counts = await client.query(
      "SELECT (SELECT COUNT(*) FROM profile) AS profiles, (SELECT COUNT(*) FROM project) AS projects, " +
      "(SELECT COUNT(*) FROM skill) AS skills, (SELECT COUNT(*) FROM experience) AS experiences, " +
      "(SELECT COUNT(*) FROM education) AS educations"
    );
    const c = counts.rows[0];
    console.log('Neon now holds: ' + c.profiles + ' profile(s), ' + c.projects + ' project(s), ' +
      c.skills + ' skill(s), ' + c.experiences + ' experience, ' + c.educations + ' education.');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* already rolled back */ }
    console.error('FATAL: migration failed and was rolled back — ' + (err && err.message));
    process.exitCode = 1;
  } finally {
    client.release();
    sqlite.close();
    await pg.end().catch(() => {});
  }
}

main();
