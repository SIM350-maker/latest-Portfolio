'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let dbInstance = null;

/**
 * Active driver (Phase 3 cutover):
 *  - explicit DB_DRIVER=sqlite|postgres always wins;
 *  - otherwise: postgres when DATABASE_URL is present (Neon is the primary
 *    data layer), sqlite fallback for fresh local checkouts without config.
 * Tests force DB_DRIVER=sqlite (hermetic; see tests/helpers.js).
 */
function getDriver() {
  const explicit = (process.env.DB_DRIVER || '').toLowerCase();
  if (explicit === 'postgres' || explicit === 'sqlite') return explicit;
  return process.env.DATABASE_URL && process.env.DATABASE_URL.trim() ? 'postgres' : 'sqlite';
}

/** Parameterized query. $1/$2 placeholders; returns pg-style { rows, rowCount }.
 * Successful mutations publish a 'data-changed' event (SSE near-real-time).
 * JS booleans are normalized per driver (pg BOOLEAN vs SQLite INTEGER). */
async function query(sql, params = []) {
  const isMutation = /^\s*(INSERT|UPDATE|DELETE|REPLACE)/i.test(sql);
  const returnsRows = /^\s*(SELECT|WITH)/i.test(sql) || /\bRETURNING\b/i.test(sql);
  const driver = getDriver();
  const norm = params.map((p) => (typeof p === 'boolean' ? (driver === 'postgres' ? p : Number(p)) : p));
  let result;
  if (driver === 'postgres') {
    const pg = require('../db/postgres');
    const { getRequestUser } = require('../lib/requestContext');
    const opts = isMutation ? { user: getRequestUser() } : undefined;
    result = await pg.pgQuery(sql, params, opts);
  } else {
    const db = connectDB();
    const text = sql.replace(/\$(\d+)/g, '?');
    // $N placeholders may repeat (e.g. one search term across three columns):
    // expand the positional array to match each placeholder occurrence.
    const positions = [...sql.matchAll(/\$(\d+)/g)].map((m) => Number(m[1]) - 1);
    const sqliteParams = positions.map((i) => norm[i]);
    if (returnsRows) {
      const rows = db.prepare(text).all(...sqliteParams);
      result = { rows, rowCount: rows.length };
    } else {
      const info = db.prepare(text).run(...sqliteParams);
      result = { rows: [], rowCount: info.changes };
    }
  }
  if (isMutation && result.rowCount > 0 && !/_migrations/.test(sql)) {
    const { publishDataChanged, entityFromSql } = require('../lib/events');
    publishDataChanged(entityFromSql(sql));
  }
  return result;
}

/** First row or null. */
async function one(sql, params = []) {
  const { rows } = await query(sql, params);
  return rows[0] || null;
}

/** All rows. */
async function all(sql, params = []) {
  const { rows } = await query(sql, params);
  return rows;
}

/**
 * Driver-aware boot initialization:
 *  - sqlite: opens the connection, applies schema + migrations (sync).
 *  - postgres: pool + retry + idempotent schema application (async).
 * Safe to call repeatedly. server.js awaits this before listening.
 */
async function initDatabase() {
  if (getDriver() === 'postgres') {
    const pg = require('../db/postgres');
    await pg.initPostgres();
    return 'postgres';
  }
  connectDB();
  return 'sqlite';
}

/** Graceful shutdown for the active driver. Safe to call repeatedly. */
async function closeDatabase() {
  if (getDriver() === 'postgres') {
    const pg = require('../db/postgres');
    await pg.closePostgres();
    return;
  }
  if (dbInstance) {
    const db = dbInstance;
    dbInstance = null;
    try { db.close(); } catch (_) { /* already closed */ }
  }
}

/** True when err is a database constraint violation (FK/unique/check). */
function isConstraintError(err) {
  if (!err || typeof err.code !== 'string') return false;
  return err.code.startsWith('SQLITE_CONSTRAINT') || err.code.startsWith('23');
}

/**
 * Open (once) and return the SQLite database connection.
 * - Enforces PRAGMA foreign_keys = ON and verifies it (fails fast otherwise).
 * - Enables WAL journal mode for reliability.
 * - Applies schema migrations idempotently.
 * Throws on any failure so the process can exit with a clear error.
 */
function connectDB() {
  if (dbInstance) {
    return dbInstance;
  }
  
  const env = process.env.NODE_ENV || 'development';
  let dbPath;
  if (process.env.DB_PATH && process.env.DB_PATH.trim() !== '') {
    dbPath = path.resolve(process.cwd(), process.env.DB_PATH);
    // Ensure the parent directory exists — fresh checkouts (CI, containers with
    // a mounted DB_PATH) may not have it yet; SQLITE_CANTOPEN otherwise.
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  } else {
    const dataDir = path.resolve(__dirname, '..', '..', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    const fileName = env === 'test' ? 'test.db' : 'dev.db';
    dbPath = path.join(dataDir, fileName);
  }
  
  let db = null;
  try {
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    const fk = db.pragma('foreign_keys', { simple: true });
    if (fk !== 1) {
      throw new Error('Foreign keys pragma not enabled: got ' + fk);
    }
    db.pragma('journal_mode = WAL');
    
    // Initialize migrations system
    initializeMigrationsTable(db);
    applyPendingMigrations(db);
    
    dbInstance = db;
    return dbInstance;
  } catch (err) {
    try { if (db) db.close(); } catch (_) { /* ignore close failure */ }
    throw new Error('Database initialization failed (' + dbPath + '): ' + err.message);
  }
}

/**
 * Initialize the _migrations table if it doesn't exist.
 */
function initializeMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Get list of applied migration filenames.
 */
function getAppliedMigrations(db) {
  const rows = db.prepare('SELECT filename FROM _migrations ORDER BY filename').all();
  return rows.map(row => row.filename);
}

/**
 * Apply any pending migrations.
 */
function applyPendingMigrations(db) {
  const applied = getAppliedMigrations(db);
  const migrationsDir = path.resolve(__dirname, '..', 'db', 'migrations');
  
  // Ensure migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
  
  // Get all migration files, sorted by name
  const allFiles = fs.readdirSync(migrationsDir);
  const migrationFiles = allFiles
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  // Apply each migration that hasn't been applied yet
  for (const file of migrationFiles) {
    if (!applied.includes(file)) {
      console.log(`Applying migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      // Run migration in a transaction
      db.transaction(() => {
        db.exec(sql);
        // Record that this migration was applied
        db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
      })();
      
      console.log(`Applied migration: ${file}`);
    }
  }
}

function isOperationalError(err) {
  if (!err || typeof err.code !== 'string') return false;
  return err.code.startsWith('SQLITE_') || /^[0-9]/.test(err.code);
}

module.exports = {
  connectDB, isOperationalError,
  getDriver, query, one, all, initDatabase, closeDatabase, isConstraintError,
};
