'use strict';

const { connectDB } = require('../config/database');
const { ConflictError } = require('../lib/validation');

function listAll() {
  const db = connectDB();
  return db.prepare('SELECT * FROM education ORDER BY start_date DESC, id DESC').all();
}

function getById(id) {
  const db = connectDB();
  return db.prepare('SELECT * FROM education WHERE id = ?').get(id) || null;
}

function create(data) {
  const db = connectDB();
  const profile = db.prepare('SELECT id FROM profile LIMIT 1').get();
  if (!profile) {
    throw new ConflictError('Create a profile before adding education entries.');
  }
  const stmt = db.prepare(
    'INSERT INTO education (profile_id, institution, degree, field_of_study, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const info = stmt.run(
    profile.id, data.institution, data.degree, data.field_of_study || null,
    data.start_date, data.end_date || null, data.description || null
  );
  return info.lastInsertRowid;
}

function update(id, changes) {
  const db = connectDB();
  const fields = [];
  const values = [];
  const allowed = ['institution', 'degree', 'field_of_study', 'start_date', 'end_date', 'description'];
  for (const key of allowed) {
    if (changes[key] !== undefined) {
      fields.push(key + ' = ?');
      values.push(changes[key]);
    }
  }
  if (fields.length === 0) return 0;
  values.push(id);
  const info = db.prepare('UPDATE education SET ' + fields.join(', ') + ' WHERE id = ?').run(...values);
  return info.changes;
}

/** education rows cascade on profile delete; standalone rows have no dependents. */
function remove(id) {
  const db = connectDB();
  const info = db.prepare('DELETE FROM education WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = { listAll, getById, create, update, remove };
