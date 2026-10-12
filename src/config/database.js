'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let dbInstance = null;

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
  
  try {
    const db = new Database(dbPath);
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
    try { db.close(); } catch (_) { /* ignore close failure */ }
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
  return err.code.startsWith('SQLITE_');
}

module.exports = { connectDB, isOperationalError };
