'use strict';

// Jest global setup. Runs once per test run, before any worker boots.
//
// SQLite lane: nothing to do — each test file gets its own throwaway file DB.
// PostgreSQL lane (DB_DRIVER=postgres, e.g. the CI matrix job or a Neon
// rehearsal branch): wipe and recreate the schema so the whole run starts
// from a clean database (initPostgres re-applies schema.postgres.sql lazily
// on the first query).

module.exports = async function globalSetup() {
  if ((process.env.DB_DRIVER || '').toLowerCase() !== 'postgres') {
    return;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DB_DRIVER=postgres requires DATABASE_URL (CI service or Neon rehearsal branch).');
  }
  const { Pool } = require('pg');
  const url = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString: url,
    max: 2,
    // Only negotiate TLS when the connection string asks for it — local/CI
    // service containers do not support SSL.
    ssl: /sslmode=(?!disable)/.test(url)
      ? { rejectUnauthorized: process.env.PG_ALLOW_SELF_SIGNED === '1' ? false : true }
      : undefined,
  });
  try {
    // Fresh schema for the entire run; initPostgres re-applies it on first query.
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('[jest-global-setup] PostgreSQL schema reset for the test run.');
  } finally {
    await pool.end().catch(() => {});
  }
};
