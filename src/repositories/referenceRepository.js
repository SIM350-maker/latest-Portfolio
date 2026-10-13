'use strict';

const { query, one, all } = require('../config/database');
const { ConflictError } = require('../lib/validation');

async function listAll() {
  return all('SELECT * FROM cv_references ORDER BY created_at DESC, id DESC');
}

async function getById(id) {
  return one('SELECT * FROM cv_references WHERE id = $1', [id]) || null;
}

async function create(data) {
  const profile = await one('SELECT id FROM profile LIMIT 1');
  if (!profile) {
    throw new ConflictError('Create a profile before adding references.');
  }
  const { rows } = await query(
    'INSERT INTO cv_references (person_id, name, role, organization, email, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
    [profile.id, data.name, data.role || null, data.organization || null, data.email || null, data.phone || null]
  );
  return rows[0].id;
}

async function update(id, changes) {
  const allowed = ['name', 'role', 'organization', 'email', 'phone'];
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
    'UPDATE cv_references SET ' + fields.join(', ') + ' WHERE id = $' + n, values
  );
  return rowCount;
}

/** Standalone rows: no dependents. Private contact data — never rendered publicly. */
async function remove(id) {
  const { rowCount } = await query('DELETE FROM cv_references WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listAll, getById, create, update, remove };
