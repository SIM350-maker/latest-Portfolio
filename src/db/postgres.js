'use strict';

// Neon PostgreSQL connection layer.
//
// Responsibilities (data-architecture plan, requirement 1):
//   - single shared pg Pool (pooled connections; Neon pooler-friendly sizing)
//   - TLS: Neon requires SSL; sslmode=require => encrypt without cert pinning
//     unless the URL explicitly asks for verify-full
//   - boot retry with exponential backoff (transient DNS/TLS/pooler hiccups)
//   - idempotent schema application (src/db/schema.postgres.sql)
//   - health probe for /health and scripts
//   - transaction helper for multi-statement units of work
//
// The application's repositories call pgQuery(sql, params) with $1/$2
// placeholders; this module owns everything connection-related.

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

let pool = null;
let initPromise = null;

function connectionString() {
  const url = process.env.TEST_POSTGRES_URL || process.env.DATABASE_URL;
  if (!url || !url.trim()) {
    throw new Error(
      'No PostgreSQL connection string. Set DATABASE_URL (Neon) or TEST_POSTGRES_URL.'
    );
  }
  return url.trim();
}

function buildPool() {
  const cs = connectionString();
  const needsSsl = /sslmode=(?!disable)/.test(cs);
  const verifyFull = /sslmode=verify-full/.test(cs);
  // pg 8 already treats sslmode=require as verify-full; keep that posture
  // (rejectUnauthorized: true) with an escape hatch for unusual setups.
  const rejectUnauthorized = process.env.PG_ALLOW_SELF_SIGNED === '1' ? false : true;
  return new Pool({
    connectionString: cs,
    max: Number.parseInt(process.env.PG_POOL_MAX || '5', 10), // Neon free tier friendly
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: needsSsl ? { rejectUnauthorized: verifyFull || rejectUnauthorized } : undefined,
  });
}

/** Apply the idempotent schema (tables, triggers, indexes, _migrations). */
async function applySchema(p) {
  const schemaPath = path.resolve(__dirname, 'schema.postgres.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await p.query(sql);
}

/**
 * Initialize the pool and schema. Safe to call repeatedly (single flight).
 * Retries transient boot failures (DNS, TLS, pooler cold start) with
 * exponential backoff; throws a clear error after `retries` attempts.
 */
function initPostgres({ retries = 5, baseDelayMs = 400 } = {}) {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    pool = buildPool();
    pool.on('error', (err) => {
      // Idle-client errors (network blips); the pool replaces clients itself.
      console.error('PostgreSQL pool error:', err.message);
    });

    let lastErr = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await pool.query('SELECT 1');
        await applySchema(pool);
        return pool;
      } catch (err) {
        lastErr = err;
        if (attempt < retries) {
          const delay = baseDelayMs * 2 ** (attempt - 1);
          console.error(
            `PostgreSQL not ready (attempt ${attempt}/${retries}): ${err.message} — retrying in ${delay}ms`
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    await closePostgres();
    throw new Error('PostgreSQL initialization failed after ' + retries + ' attempts: ' + (lastErr && lastErr.message));
  })();
  return initPromise;
}

/** Parameterized query ($1/$2/… placeholders). Returns pg-style { rows, rowCount }. */
/** Parameterized query ($1/$2/… placeholders). Returns pg-style { rows, rowCount }.
 * opts.user: when present (mutations from request context), the statement runs
 * on a dedicated client with app.user_id set (session scope) so audit triggers
 * can attribute the change. */
async function pgQuery(sql, params = [], opts = {}) {
  await initPostgres();
  let result;
  if (opts && opts.user) {
    const client = await pool.connect();
    try {
      await client.query('SELECT set_config($1, $2, false)', ['app.user_id', String(opts.user)]);
      result = await client.query(sql, params);
    } finally {
      client.release();
    }
  } else {
    result = await pool.query(sql, params);
  }
  // Data contract: rows are JSON-safe plain objects on both drivers.
  // node-pg materializes TIMESTAMPTZ as Date instances; normalize to ISO
  // strings so SQLite (strings) and PostgreSQL (Dates) read identically.
  for (const row of result.rows) {
    for (const key of Object.keys(row)) {
      if (row[key] instanceof Date) row[key] = row[key].toISOString();
    }
  }
  return result;
}

/** Convenience: first row or null. */
async function pgOne(sql, params = []) {
  const { rows } = await pgQuery(sql, params);
  return rows[0] || null;
}

/** Convenience: all rows. */
async function pgAll(sql, params = []) {
  const { rows } = await pgQuery(sql, params);
  return rows;
}

/** Transaction: fn receives a client with .query(); commits or rolls back. */
async function withTransaction(fn) {
  await initPostgres();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* connection already gone */ }
    throw err;
  } finally {
    client.release();
  }
}

/** Health probe: true when the server answers SELECT 1. Never throws. */
async function pgHealth() {
  try {
    await pgQuery('SELECT 1');
    return true;
  } catch (_) {
    return false;
  }
}

/** Pool stats for /health and scripts. Null before init. */
function poolStats() {
  if (!pool) return null;
  return { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount };
}

/** Close the pool (graceful shutdown, scripts). Safe to call repeatedly. */
async function closePostgres() {
  initPromise = null;
  if (pool) {
    const p = pool;
    pool = null;
    await p.end().catch(() => {});
  }
}

module.exports = {
  initPostgres,
  pgQuery,
  pgOne,
  pgAll,
  withTransaction,
  pgHealth,
  poolStats,
  closePostgres,
};
