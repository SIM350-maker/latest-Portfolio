'use strict';

const { query, one, all } = require('../config/database');
const { ConflictError } = require('../lib/validation');

async function listAll() {
  return all('SELECT * FROM certifications ORDER BY created_at DESC, id DESC');
}

async function getById(id) {
  return one('SELECT * FROM certifications WHERE id = $1', [id]) || null;
}

async function create(data) {
  const profile = await one('SELECT id FROM profile LIMIT 1');
  if (!profile) {
    throw new ConflictError('Create a profile before adding certifications.');
  }
  const { rows } = await query(
    'INSERT INTO certifications (person_id, title, issuer) VALUES ($1, $2, $3) RETURNING id',
    [profile.id, data.title, data.issuer || null]
  );
  return rows[0].id;
}

async function update(id, changes) {
  const allowed = ['title', 'issuer'];
  const fields = [];
  const values = [];
  let n = 1;
  for (const key of allowed) {
    if (changes[key] !== undefined) {
      fields.push(key + ' = $' + n++);
      values.push(changes[key]);
    }
  }
  if (fields.length === 0) return 0;
  values.push(id);
  const { rowCount } = await query(
    'UPDATE certifications SET ' + fields.join(', ') + ' WHERE id = $' + n, values
  );
  return rowCount;
}

/** Standalone rows: no dependents. */
async function remove(id) {
  const { rowCount } = await query('DELETE FROM certifications WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listAll, getById, create, update, remove };
