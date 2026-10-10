'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let dbInstance = null;

function applySchema(db) {
  const schemaPath = path.resolve(__dirname, '..', 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

/**
 * Open (once) and return the SQLite database connection.
 * - Enforces PRAGMA foreign_keys = ON and verifies it (fails fast otherwise).
 * - Enables WAL journal mode for reliability (data design section 25).
 * - Applies schema.sql idempotently.
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
  } else {
    const dataDir = path.resolve(__dirname, '..', '..', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    const fileName = env === 'test' ? 'test.db' : 'dev.db';
    dbPath = path.join(dataDir, fileName);
  }
  const db = new Database(dbPath);
  try {
    db.pragma('foreign_keys = ON');
    const fk = db.pragma('foreign_keys', { simple: true });
    if (fk !== 1) {
      throw new Error('Foreign keys pragma not enabled: got ' + fk);
    }
    db.pragma('journal_mode = WAL');
    applySchema(db);
    dbInstance = db;
    return dbInstance;
  } catch (err) {
    try { db.close(); } catch (_) { /* ignore close failure */ }
    throw new Error('Database initialization failed (' + dbPath + '): ' + err.message);
  }
}

function isOperationalError(err) {
  if (!err || typeof err.code !== 'string') return false;
  return err.code.startsWith('SQLITE_');
}

module.exports = { connectDB, isOperationalError };
