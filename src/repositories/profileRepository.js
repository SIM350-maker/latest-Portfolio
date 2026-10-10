'use strict';

const { connectDB } = require('../config/database');
const { ConflictError } = require('../lib/validation');

/**
 * Profile repository. The profile is a singleton (schema CHECK singleton = 1).
 * Returns plain row objects; all statements are parameterized.
 */

function getProfile() {
  const db = connectDB();
  return db.prepare('SELECT * FROM profile LIMIT 1').get() || null;
}

function getProfileById(id) {
  const db = connectDB();
  return db.prepare('SELECT * FROM profile WHERE id = ?').get(id) || null;
}

/**
 * Create the single profile. Fails with ConflictError if one already exists
 * (application-level singleton guard in addition to the schema constraint).
 */
function createProfile(data) {
  const db = connectDB();
  const existing = db.prepare('SELECT id FROM profile LIMIT 1').get();
  if (existing) {
    throw new ConflictError('A profile already exists. Use update instead.');
  }
  const stmt = db.prepare(
    'INSERT INTO profile (name, role, summary, contact_info, publication_state) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(data.name, data.role, data.summary, data.contact_info || null, data.publication_state || 'Draft');
  return info.lastInsertRowid;
}

/** Update allowed fields. Returns number of rows updated (0 or 1). */
function updateProfile(id, changes) {
  const db = connectDB();
  const fields = [];
  const values = [];
  const allowed = ['name', 'role', 'summary', 'contact_info', 'publication_state'];
  for (const key of allowed) {
    if (changes[key] !== undefined) {
      fields.push(key + ' = ?');
      values.push(changes[key]);
    }
  }
  if (fields.length === 0) return 0;
  values.push(id);
  const info = db.prepare('UPDATE profile SET ' + fields.join(', ') + ' WHERE id = ?').run(...values);
  return info.changes;
}

function setPublicationState(id, state) {
  const db = connectDB();
  const info = db.prepare('UPDATE profile SET publication_state = ? WHERE id = ?').run(state, id);
  return info.changes > 0;
}

module.exports = { getProfile, getProfileById, createProfile, updateProfile, setPublicationState };
