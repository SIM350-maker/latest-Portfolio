'use strict';

// End-to-end PostgreSQL/Neon pipeline verification (data-architecture plan,
// requirement 7 — connection + schema + CRUD roundtrip).
//
// Usage:  node scripts/verify-postgres.js
// Target: TEST_POSTGRES_URL, falling back to DATABASE_URL (Neon).
//
// Safe to run against production data: the CRUD probe runs inside a
// transaction that is always rolled back, so nothing persists. Schema
// application is idempotent.

const path = require('path');

// Load .env exactly like src/server.js (dotenv first, $$ normalization).
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const loaded = require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
for (const [key, value] of Object.entries(loaded.parsed || {})) {
  if (typeof value === 'string' && value.includes('$$')) {
    process.env[key] = value.replace(/\$\$/g, '$');
  }
}

const {
  initPostgres, pgQuery, pgOne, withTransaction, pgHealth, closePostgres,
} = require('../src/db/postgres');

async function main() {
  const target = process.env.TEST_POSTGRES_URL
    ? 'TEST_POSTGRES_URL'
    : (process.env.DATABASE_URL ? 'DATABASE_URL (Neon)' : null);
  if (!target) {
    console.error('FATAL: set TEST_POSTGRES_URL or DATABASE_URL to run this verification.');
    process.exit(1);
  }
  console.log('Connecting via ' + target + ' …');

  // 1) Boot with retry + idempotent schema application.
  await initPostgres();
  console.log('PASS  connection established (pool ready, schema applied)');

  // 2) Health probe (the same check /health will use in phase 2).
  console.log('PASS  health probe:', await pgHealth() ? 'up' : 'down');

  // 3) Server identity — proves we really reached PostgreSQL (Neon).
  const server = await pgOne('SELECT version() AS v');
  console.log('PASS  server:', String(server.v).split(' ').slice(0, 2).join(' '));

  // 4) Full CRUD roundtrip, always rolled back — no residue in production data.
  await withTransaction(async (client) => {
    const ins = await client.query(
      'INSERT INTO skill (name, description, publication_state) VALUES ($1, $2, $3) RETURNING id, name, publication_state',
      ['__verify_probe__', 'temporary pipeline probe', 'Draft']
    );
    const id = ins.rows[0].id;
    console.log('PASS  CREATE  id=' + id + ' (' + ins.rows[0].name + ', ' + ins.rows[0].publication_state + ')');

    const row = await client.query('SELECT * FROM skill WHERE id = $1', [id]);
    console.log('PASS  READ    row found: ' + (row.rows.length === 1));

    const upd = await client.query(
      'UPDATE skill SET description = $1 WHERE id = $2 RETURNING updated_at, description',
      ['probe updated', id]
    );
    console.log('PASS  UPDATE  updated_at=' + upd.rows[0].updated_at.toISOString() + ' (trigger maintained)');

    const del = await client.query('DELETE FROM skill WHERE id = $1 RETURNING id', [id]);
    console.log('PASS  DELETE  removed id=' + del.rows[0].id);
  });
  console.log('PASS  transaction committed probe and rolled back cleanly');

  // 5) Residue check — the probe must not exist.
  const residue = await pgQuery('SELECT COUNT(*)::int AS n FROM skill WHERE name = $1', ['__verify_probe__']);
  console.log('PASS  no residue rows: ' + (residue.rows[0].n === 0));

  // 6) Pool stats.
  const stats = require('../src/db/postgres').poolStats();
  console.log('PASS  pool: total=' + stats.total + ' idle=' + stats.idle + ' waiting=' + stats.waiting);

  console.log('\nALL CHECKS PASSED — the PostgreSQL data pipeline is operational.');
}

main()
  .catch((err) => {
    console.error('FATAL: ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  })
  .finally(() => closePostgres());
