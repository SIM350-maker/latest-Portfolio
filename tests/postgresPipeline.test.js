'use strict';

// PostgreSQL pipeline test (data-architecture plan, requirement 7).
//
// Proves the Neon/PostgreSQL connection layer end-to-end: boot with retry,
// idempotent schema, and a full CREATE → READ → UPDATE → DELETE roundtrip
// using the exact $1-placeholder + RETURNING SQL pattern the repositories
// use in phase 2 of the migration. Runs only when a PostgreSQL URL is
// provided (TEST_POSTGRES_URL or DATABASE_URL with DB_DRIVER=postgres);
// the standard 70-test suite stays on SQLite and skips this file.

const path = require('path');

// Load .env (same loader semantics as src/server.js) BEFORE gating.
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const loadedEnv = require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
for (const [key, value] of Object.entries(loadedEnv.parsed || {})) {
  if (typeof value === 'string' && value.includes('$$')) {
    process.env[key] = value.replace(/\$\$/g, '$');
  }
}

const HAS_PG = Boolean(process.env.TEST_POSTGRES_URL ||
  (process.env.DB_DRIVER === 'postgres' && process.env.DATABASE_URL));

const describePg = HAS_PG ? describe : describe.skip;

describePg('PostgreSQL data pipeline (Neon)', () => {
  const pg = require('../src/db/postgres');

  beforeAll(async () => {
    if (process.env.TEST_POSTGRES_URL) process.env.DATABASE_URL = process.env.TEST_POSTGRES_URL;
    await pg.initPostgres();
  });

  afterAll(async () => {
    await pg.closePostgres();
  });

  it('boots the pool, applies the schema, and answers a health probe', async () => {
    const ok = await pg.pgHealth();
    expect(ok).toBe(true);
  });

  it('enforces the singleton profile rule at the database level', async () => {
    await expect(pg.pgQuery(
      "INSERT INTO profile (name, role, summary) VALUES ('A', 'r', 's'), ('B', 'r', 's')"
    )).rejects.toThrow(/unique|duplicate/i);
  });

  it('maintains updated_at via trigger and cascades deletes across joins', async () => {
    await pg.withTransaction(async (client) => {
      const proj = await client.query(
        "INSERT INTO project (title, publication_state) VALUES ('__pipeline__', 'Draft') RETURNING id"
      );
      const skill = await client.query(
        "INSERT INTO skill (name, publication_state) VALUES ('__pipeline__', 'Draft') RETURNING id"
      );
      const pid = proj.rows[0].id;
      const sid = skill.rows[0].id;

      // join table + cascade semantics (project_skill ON DELETE CASCADE)
      await client.query('INSERT INTO project_skill (project_id, skill_id) VALUES ($1, $2)', [pid, sid]);
      const before = await client.query('SELECT COUNT(*)::int AS n FROM project_skill WHERE project_id = $1', [pid]);
      expect(before.rows[0].n).toBe(1);

      // updated_at trigger fires on UPDATE
      const upd = await client.query(
        'UPDATE project SET description = $1 WHERE id = $2 RETURNING updated_at, created_at',
        ['changed', pid]
      );
      expect(new Date(upd.rows[0].updated_at).getTime())
        .toBeGreaterThanOrEqual(new Date(upd.rows[0].created_at).getTime());

      await client.query('DELETE FROM project WHERE id = $1', [pid]);
      const after = await client.query('SELECT COUNT(*)::int AS n FROM project_skill WHERE project_id = $1', [pid]);
      expect(after.rows[0].n).toBe(0); // cascade removed the join row

      await client.query('DELETE FROM skill WHERE id = $1', [sid]);
    });
  });

  it('CHECK constraints reject invalid publication states', async () => {
    await expect(pg.pgQuery(
      "INSERT INTO skill (name, publication_state) VALUES ('__bad__', 'Bogus')"
    )).rejects.toThrow(/check|violat/i);
  });
});

describePg('audit trail attribution (db remediation P3-1)', () => {
  const requestContext = require('../src/lib/requestContext');
  const { query, one, closeDatabase } = require('../src/config/database');

  afterAll(async () => {
    await closeDatabase();
  });

  it('attributes mutations to the request principal via app.user_id', async () => {
    await requestContext.runContext({ user: 'owner' }, async () => {
      const { rows } = await query(
        "INSERT INTO skill (name, description, publication_state) VALUES ('__audit_attr__', NULL, 'Draft') RETURNING id"
      );
      const id = rows[0].id;
      const row = await one(
        "SELECT action, changed_by FROM audit_log WHERE table_name = 'skill' AND row_id = $1 ORDER BY id DESC LIMIT 1",
        [id]
      );
      expect(row).toBeTruthy();
      expect(row.action).toBe('INSERT');
      expect(row.changed_by).toBe('owner');
      await query('DELETE FROM skill WHERE id = $1', [id]);
      await query("DELETE FROM audit_log WHERE table_name = 'skill' AND row_id = $1", [id]);
    });
  });

  it('evidence soft delete hides rows from reads while retaining them', async () => {
    const evidenceRepo = require('../src/repositories/evidenceRepository');
    const id = await evidenceRepo.create({ description: '__softdel__', file_path: 'https://example.com/s.png' });
    expect(await evidenceRepo.remove(id)).toBe(true);
    expect(await evidenceRepo.getById(id)).toBeNull();
    const retained = await one('SELECT deleted_at FROM evidence WHERE id = $1', [id]);
    expect(retained && retained.deleted_at).toBeTruthy();
    await query('DELETE FROM evidence WHERE id = $1', [id]);
  });
});
