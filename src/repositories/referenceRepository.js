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

/** Paginated + case-insensitive search across name/role/organization/email/phone. */
async function listPaged({ q = '', limit = 20, offset = 0 } = {}) {
  const params = [];
  let where = '';
  if (q) {
    params.push('%' + String(q).toLowerCase().replace(/([%_\\])/g, '\\$1') + '%');
    where = "WHERE lower(name) LIKE $1 ESCAPE '\\' OR lower(COALESCE(role, '')) LIKE $1 ESCAPE '\\' OR lower(COALESCE(organization, '')) LIKE $1 ESCAPE '\\' OR lower(COALESCE(email, '')) LIKE $1 ESCAPE '\\' OR lower(COALESCE(phone, '')) LIKE $1 ESCAPE '\\'";
  }
  const total = Number((await one('SELECT COUNT(*) AS n FROM cv_references ' + where, params)).n);
  const rows = await all(
    'SELECT * FROM cv_references ' + where + ' ORDER BY created_at DESC, id DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2),
    [...params, limit, offset]
  );
  return { rows, total };
}

module.exports = { listAll, listPaged, getById, create, update, remove };
