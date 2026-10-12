'use strict';

const { query, one } = require('../config/database');
const { ConflictError } = require('../lib/validation');

/**
 * Profile repository. The profile is a singleton (schema CHECK singleton = 1).
 * Returns plain row objects; all statements are parameterized ($1/$2/…
 * placeholders run on both drivers — see src/config/database.js query()).
 */

async function getProfile() {
  return one('SELECT * FROM profile LIMIT 1');
}

async function getProfileById(id) {
  return one('SELECT * FROM profile WHERE id = $1', [id]);
}

/**
 * Create the single profile. Fails with ConflictError if one already exists
 * (application-level singleton guard in addition to the schema constraint).
 */
async function createProfile(data) {
  const existing = await one('SELECT id FROM profile LIMIT 1');
  if (existing) {
    throw new ConflictError('A profile already exists. Use update instead.');
  }
  const { rows } = await query(
    'INSERT INTO profile (name, role, summary, contact_info, publication_state) VALUES ($1, $2, $3, $4, $5) RETURNING id',
    [data.name, data.role, data.summary, data.contact_info || null, data.publication_state || 'Draft']
  );
  return rows[0].id;
}

/** Update allowed fields. Returns number of rows updated (0 or 1). */
async function updateProfile(id, changes) {
  const allowed = ['name', 'role', 'summary', 'contact_info', 'publication_state'];
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
    'UPDATE profile SET ' + fields.join(', ') + ' WHERE id = $' + n, values
  );
  return rowCount;
}

async function setPublicationState(id, state) {
  const { rowCount } = await query(
    'UPDATE profile SET publication_state = $1 WHERE id = $2', [state, id]
  );
  return rowCount > 0;
}

module.exports = { getProfile, getProfileById, createProfile, updateProfile, setPublicationState };
