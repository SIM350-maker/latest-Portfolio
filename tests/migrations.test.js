'use strict';

const { configureTestEnv } = require('./helpers');
configureTestEnv();

const { connectDB } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

describe('Migration runner', () => {
  let db;
  const testDbPath = path.resolve(__dirname, '..', 'data', 'test_migrations.db');

  beforeAll(() => {
    // Set environment to use a test database
    process.env.DB_PATH = testDbPath;
    process.env.NODE_ENV = 'test';
    
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Initialize database (this should run migrations)
    db = connectDB();
  });

  afterAll(() => {
    // Close the database connection first
    if (db && typeof db.close === 'function') {
      db.close();
    }
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Reset environment variables
    delete process.env.DB_PATH;
    delete process.env.NODE_ENV;
  });

  describe('_migrations table', () => {
    it('should exist after database initialization', () => {
      const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'").get();
      
      expect(tableExists).toBeDefined();
    });

    it('should have correct schema', () => {
      const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='_migrations'").get();
      
      expect(schema.sql).toMatch(/id INTEGER PRIMARY KEY AUTOINCREMENT/);
      expect(schema.sql).toMatch(/filename TEXT NOT NULL UNIQUE/);
      expect(schema.sql).toMatch(/applied_at DATETIME DEFAULT CURRENT_TIMESTAMP/);
    });
  });

  describe('baseline migration (001_baseline.sql)', () => {
    it('should be recorded as applied', () => {
      const applied = db.prepare("SELECT filename FROM _migrations WHERE filename = ?").get('001_baseline.sql');
      
      expect(applied).toBeDefined();
      expect(applied.filename).toBe('001_baseline.sql');
    });

    it('should create all expected tables', () => {
      const expectedTables = [
        'profile',
        'project', 
        'skill',
        'evidence',
        'claim',
        'experience',
        'education',
        'project_skill',
        'project_evidence',
        'skill_evidence',
        'claim_evidence'
      ];
      
      for (const table of expectedTables) {
        const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(table);
        
        expect(tableExists).toBeDefined();
        expect(tableExists.name).toBe(table);
      }
    });

    it('should create triggers', () => {
      const expectedTriggers = [
        'update_profile_timestamp',
        'update_project_timestamp',
        'update_skill_timestamp',
        'update_evidence_timestamp',
        'update_claim_timestamp',
        'update_experience_timestamp',
        'update_education_timestamp'
      ];
      
      for (const trigger of expectedTriggers) {
        const triggerExists = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name = ?").get(trigger);
        
        expect(triggerExists).toBeDefined();
        expect(triggerExists.name).toBe(trigger);
      }
    });

    it('should create indexes', () => {
      const expectedIndexes = [
        'idx_project_publication_state',
        'idx_evidence_accessibility',
        'idx_skill_publication_state',
        'idx_claim_publication_state',
        'idx_claim_source'
      ];
      
      for (const index of expectedIndexes) {
        const indexExists = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name = ?").get(index);
        
        expect(indexExists).toBeDefined();
        expect(indexExists.name).toBe(index);
      }
    });
  });

  describe('migration idempotency', () => {
    it('should not reapply the same migration on second connection', () => {
      // This test verifies that connecting again doesn't try to reapply migrations
      // We can check by ensuring the _migrations table still has only one entry
      // for 001_baseline.sql
      
      const count = db.prepare("SELECT COUNT(*) as count FROM _migrations").get();
      
      expect(count.count).toBe(1);
      
      // Reconnect to simulate second boot
      const db2 = connectDB();
      
      const countAfter = db2.prepare("SELECT COUNT(*) as count FROM _migrations").get();
      
      expect(countAfter.count).toBe(1);
    });
  });

  describe('foreign keys', () => {
    it('should have foreign keys enabled', () => {
      const fkStatus = db.pragma('foreign_keys', { simple: true });
      expect(fkStatus).toBe(1);
    });
  });

  describe('journal mode', () => {
    it('should use WAL journal mode', () => {
      const journalMode = db.pragma('journal_mode', { simple: true });
      expect(journalMode).toBe('wal');
    });
  });
});