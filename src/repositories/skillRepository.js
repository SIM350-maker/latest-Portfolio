'use strict';

const { query, one, all, isConstraintError } = require('../config/database');
const { ConflictError } = require('../lib/validation');

const PUBLIC_FILTER = "publication_state = 'Published'";

async function listAll() {
  return all('SELECT * FROM skill ORDER BY name ASC');
}

async function listPublished() {
  return all('SELECT * FROM skill WHERE ' + PUBLIC_FILTER + ' ORDER BY name ASC');
}

async function getById(id) {
  return one('SELECT * FROM skill WHERE id = $1', [id]) || null;
}

async function findByName(name) {
  return one('SELECT * FROM skill WHERE lower(name) = lower($1)', [name]) || null;
}

async function create(data) {
  const { rows } = await query(
    "INSERT INTO skill (name, description, publication_state) VALUES ($1, $2, 'Draft') RETURNING id",
    [data.name, data.description || null]
  );
  return rows[0].id;
}

async function update(id, changes) {
  const allowed = ['name', 'description'];
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
    'UPDATE skill SET ' + fields.join(', ') + ' WHERE id = $' + n, values
  );
  return rowCount;
}

async function setPublicationState(id, state) {
  const { rowCount } = await query(
    'UPDATE skill SET publication_state = $1 WHERE id = $2', [state, id]
  );
  return rowCount > 0;
}

/** RESTRICT default: blocked while claims reference the skill. */
async function remove(id) {
  const claims = await one(
    "SELECT COUNT(*) AS n FROM claim WHERE source_entity_type = 'skill' AND source_entity_id = $1", [id]
  );
  if (claims && Number(claims.n) > 0) {
    throw new ConflictError('Skill cannot be deleted while ' + Number(claims.n) + ' claim(s) reference it. Delete the claims first.');
  }
  try {
    // project_skill and skill_evidence join rows cascade (schema).
    const { rowCount } = await query('DELETE FROM skill WHERE id = $1', [id]);
    return rowCount > 0;
  } catch (err) {
    if (isConstraintError(err)) {
      throw new ConflictError('Skill cannot be deleted while related records exist.');
    }
    throw err;
  }
}

async function listClaims(skillId, onlyPublished) {
  let sql = 'SELECT * FROM claim WHERE source_entity_type = $1 AND source_entity_id = $2';
  const params = ['skill', skillId];
  if (onlyPublished) sql += " AND publication_state = 'Published'";
  sql += ' ORDER BY created_at DESC, id DESC';
  return all(sql, params);
}

async function listEvidence(skillId) {
  return all(
    'SELECT e.* FROM evidence e JOIN skill_evidence se ON se.evidence_id = e.id WHERE se.skill_id = $1 ORDER BY e.created_at DESC, e.id DESC',
    [skillId]
  );
}

async function attachEvidence(skillId, evidenceId) {
  const { rowCount } = await query(
    'INSERT INTO skill_evidence (skill_id, evidence_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [skillId, evidenceId]
  );
  return rowCount > 0;
}

module.exports = {
  listAll, listPublished, getById, findByName, create, update, setPublicationState, remove,
  listClaims, listEvidence, attachEvidence,
};


