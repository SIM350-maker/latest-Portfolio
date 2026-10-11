'use strict';

const { connectDB } = require('../config/database');
const { ConflictError } = require('../lib/validation');

function listAll() {
  const db = connectDB();
  return db.prepare('SELECT * FROM experience ORDER BY start_date DESC, id DESC').all();
}

function getById(id) {
  const db = connectDB();
  return db.prepare('SELECT * FROM experience WHERE id = ?').get(id) || null;
}

function create(data) {
  const db = connectDB();
  const profile = db.prepare('SELECT id FROM profile LIMIT 1').get();
  if (!profile) {
    throw new ConflictError('Create a profile before adding experience entries.');
  }
  const stmt = db.prepare(
    'INSERT INTO experience (profile_id, title, company, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const info = stmt.run(
    profile.id, data.title, data.company, data.start_date, data.end_date || null, data.description || null
  );
  return info.lastInsertRowid;
}

function update(id, changes) {
  const db = connectDB();
  const fields = [];
  const values = [];
  const allowed = ['title', 'company', 'start_date', 'end_date', 'description'];
  for (const key of allowed) {
    if (changes[key] !== undefined) {
      fields.push(key + ' = ?');
      values.push(changes[key]);
    }
  }
  if (fields.length === 0) return 0;
  values.push(id);
  const info = db.prepare('UPDATE experience SET ' + fields.join(', ') + ' WHERE id = ?').run(...values);
  return info.changes;
}

/** experience rows cascade on profile delete; standalone rows have no dependents. */
function remove(id) {
  const db = connectDB();
  const info = db.prepare('DELETE FROM experience WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = { listAll, getById, create, update, remove };
