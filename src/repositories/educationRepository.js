'use strict';

const { query, one, all } = require('../config/database');
const { ConflictError } = require('../lib/validation');

async function listAll() {
  return all('SELECT * FROM education ORDER BY start_date DESC, id DESC');
}

/** Paginated + case-insensitive search across institution/degree/field_of_study/description. */
async function listPaged({ q = '', limit = 20, offset = 0 } = {}) {
  const params = [];
  let where = '';
  if (q) {
    params.push('%' + String(q).toLowerCase().replace(/([%_\\])/g, '\\$1') + '%');
    where = "WHERE lower(institution) LIKE $1 ESCAPE '\\' OR lower(degree) LIKE $1 ESCAPE '\\' OR lower(COALESCE(field_of_study, '')) LIKE $1 ESCAPE '\\' OR lower(COALESCE(description, '')) LIKE $1 ESCAPE '\\'";
  }
  const total = Number((await one('SELECT COUNT(*) AS n FROM education ' + where, params)).n);
  const rows = await all(
    'SELECT * FROM education ' + where + ' ORDER BY start_date DESC, id DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2),
    [...params, limit, offset]
  );
  return { rows, total };
}

async function getById(id) {
  return one('SELECT * FROM education WHERE id = $1', [id]) || null;
}

async function create(data) {
  const profile = await one('SELECT id FROM profile LIMIT 1');
  if (!profile) {
    throw new ConflictError('Create a profile before adding education entries.');
  }
  const { rows } = await query(
    'INSERT INTO education (profile_id, institution, degree, field_of_study, start_date, end_date, grade, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
    [profile.id, data.institution, data.degree, data.field_of_study || null, data.start_date, data.end_date || null, data.grade || null, data.description || null]
  );
  return rows[0].id;
}

async function update(id, changes) {
  const allowed = ['institution', 'degree', 'field_of_study', 'start_date', 'end_date', 'grade', 'description'];
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
    'UPDATE education SET ' + fields.join(', ') + ' WHERE id = $' + n, values
  );
  return rowCount;
}

/** education rows cascade on profile delete; standalone rows have no dependents. */
async function remove(id) {
  const { rowCount } = await query('DELETE FROM education WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listAll, listPaged, getById, create, update, remove };
