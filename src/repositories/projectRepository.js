'use strict';

const { query, one, all, isConstraintError } = require('../config/database');
const { ConflictError } = require('../lib/validation');

const PUBLIC_FILTER = "publication_state = 'Published'";

async function listAll() {
  return all('SELECT * FROM project ORDER BY updated_at DESC, id DESC');
}

async function listPublished() {
  return all('SELECT * FROM project WHERE ' + PUBLIC_FILTER + ' ORDER BY updated_at DESC, id DESC');
}

/** Paginated + case-insensitive search across title/description/technologies/roles. */
async function listPaged({ q = '', limit = 20, offset = 0 } = {}) {
  const params = [];
  let where = '';
  if (q) {
    params.push('%' + String(q).toLowerCase().replace(/([%_\\])/g, '\\$1') + '%');
    where = "WHERE lower(title) LIKE $1 ESCAPE '\\' OR lower(COALESCE(description, '')) LIKE $1 ESCAPE '\\' OR lower(COALESCE(technologies, '')) LIKE $1 ESCAPE '\\' OR lower(COALESCE(roles, '')) LIKE $1 ESCAPE '\\'";
  }
  const total = Number((await one('SELECT COUNT(*) AS n FROM project ' + where, params)).n);
  const rows = await all(
    'SELECT * FROM project ' + where + ' ORDER BY updated_at DESC, id DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2),
    [...params, limit, offset]
  );
  return { rows, total };
}

async function getById(id) {
  return one('SELECT * FROM project WHERE id = $1', [id]) || null;
}

async function create(data) {
  const profile = await one('SELECT id FROM profile LIMIT 1');
  if (!profile) {
    throw new ConflictError('Create a profile before adding projects.');
  }
  const { rows } = await query(
    "INSERT INTO project (title, description, outcomes, roles, technologies, deploy_url, profile_id, publication_state) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Draft') RETURNING id",
    [data.title, data.description || null, data.outcomes || null, data.roles || null, data.technologies || null, data.deploy_url || null, profile.id]
  );
  return rows[0].id;
}

async function update(id, changes) {
  const allowed = ['title', 'description', 'outcomes', 'roles', 'technologies', 'deploy_url'];
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
    'UPDATE project SET ' + fields.join(', ') + ' WHERE id = $' + n, values
  );
  return rowCount;
}

async function setPublicationState(id, state) {
  const { rowCount } = await query(
    'UPDATE project SET publication_state = $1 WHERE id = $2', [state, id]
  );
  return rowCount > 0;
}

/**
 * Delete a project. RESTRICT: blocked while claims reference it
 * (frozen data design section 20); blocked claims surface as 409.
 */
async function remove(id) {
  const claims = await one(
    "SELECT COUNT(*) AS n FROM claim WHERE source_entity_type = 'project' AND source_entity_id = $1", [id]
  );
  if (claims && Number(claims.n) > 0) {
    throw new ConflictError('Project cannot be deleted while ' + Number(claims.n) + ' claim(s) reference it. Delete the claims first.');
  }
  try {
    const { rowCount } = await query('DELETE FROM project WHERE id = $1', [id]);
    return rowCount > 0;
  } catch (err) {
    if (isConstraintError(err)) {
      throw new ConflictError('Project cannot be deleted while related records exist.');
    }
    throw err;
  }
}

/** Claims made within this project (source link), newest first. */
async function listClaims(projectId, onlyPublished) {
  let sql = 'SELECT * FROM claim WHERE source_entity_type = $1 AND source_entity_id = $2';
  const params = ['project', projectId];
  if (onlyPublished) sql += " AND publication_state = 'Published'";
  sql += ' ORDER BY created_at DESC, id DESC';
  return all(sql, params);
}

/** Evidence attached to this project via the project_evidence join. */
async function listEvidence(projectId) {
  return all(
    'SELECT e.* FROM evidence e JOIN project_evidence pe ON pe.evidence_id = e.id WHERE pe.project_id = $1 AND e.deleted_at IS NULL ORDER BY e.created_at DESC, e.id DESC',
    [projectId]
  );
}

/** Attach existing evidence to this project (idempotent). Returns true if inserted. */
async function attachEvidence(projectId, evidenceId) {
  const { rowCount } = await query(
    'INSERT INTO project_evidence (project_id, evidence_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [projectId, evidenceId]
  );
  return rowCount > 0;
}

async function listSkills(projectId) {
  return all(
    'SELECT s.* FROM skill s JOIN project_skill ps ON ps.skill_id = s.id WHERE ps.project_id = $1 ORDER BY s.name',
    [projectId]
  );
}

async function attachSkill(projectId, skillId) {
  const { rowCount } = await query(
    'INSERT INTO project_skill (project_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [projectId, skillId]
  );
  return rowCount > 0;
}

module.exports = {
  listAll, listPublished, listPaged, getById, create, update, setPublicationState, remove,
  listClaims, listEvidence, attachEvidence, listSkills, attachSkill,
};
