'use strict';

const { query, one, all } = require('../config/database');
const { ConflictError } = require('../lib/validation');

async function listAll() {
  return all('SELECT * FROM experience ORDER BY start_date DESC, id DESC');
}

async function getById(id) {
  return one('SELECT * FROM experience WHERE id = $1', [id]) || null;
}

async function create(data) {
  const profile = await one('SELECT id FROM profile LIMIT 1');
  if (!profile) {
    throw new ConflictError('Create a profile before adding experience entries.');
  }
  const { rows } = await query(
    'INSERT INTO experience (profile_id, title, company, location, start_date, end_date, is_current, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
    [profile.id, data.title, data.company, data.location || null, data.start_date, data.end_date || null, Boolean(data.is_current), data.description || null]
  );
  return rows[0].id;
}

async function update(id, changes) {
  const allowed = ['title', 'company', 'location', 'start_date', 'end_date', 'is_current', 'description'];
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
    'UPDATE experience SET ' + fields.join(', ') + ' WHERE id = $' + n, values
  );
  return rowCount;
}

/** experience rows cascade on profile delete; standalone rows have no dependents. */
async function remove(id) {
  const { rowCount } = await query('DELETE FROM experience WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listAll, getById, create, update, remove };

