'use strict';

const { connectDB, isOperationalError } = require('../config/database');
const { ConflictError } = require('../lib/validation');

const PUBLIC_FILTER = "publication_state = 'Published'";

function listAll() {
  const db = connectDB();
  return db.prepare('SELECT * FROM project ORDER BY updated_at DESC, id DESC').all();
}

function listPublished() {
  const db = connectDB();
  return db.prepare('SELECT * FROM project WHERE ' + PUBLIC_FILTER + ' ORDER BY updated_at DESC, id DESC').all();
}

function getById(id) {
  const db = connectDB();
  return db.prepare('SELECT * FROM project WHERE id = ?').get(id) || null;
}

function create(data) {
  const db = connectDB();
  const stmt = db.prepare(
    "INSERT INTO project (title, description, outcomes, roles, technologies, publication_state) VALUES (?, ?, ?, ?, ?, 'Draft')"
  );
  const info = stmt.run(data.title, data.description || null, data.outcomes || null, data.roles || null, data.technologies || null);
  return info.lastInsertRowid;
}

function update(id, changes) {
  const db = connectDB();
  const fields = [];
  const values = [];
  const allowed = ['title', 'description', 'outcomes', 'roles', 'technologies'];
  for (const key of allowed) {
    if (changes[key] !== undefined) {
      fields.push(key + ' = ?');
      values.push(changes[key]);
    }
  }
  if (fields.length === 0) return 0;
  values.push(id);
  const info = db.prepare('UPDATE project SET ' + fields.join(', ') + ' WHERE id = ?').run(...values);
  return info.changes;
}

function setPublicationState(id, state) {
  const db = connectDB();
  const info = db.prepare('UPDATE project SET publication_state = ? WHERE id = ?').run(state, id);
  return info.changes > 0;
}

/**
 * Delete a project. RESTRICT: blocked while claims reference it
 * (frozen data design section 20); blocked claims surface as 409.
 */
function remove(id) {
  const db = connectDB();
  const claims = db.prepare(
    "SELECT COUNT(*) AS n FROM claim WHERE source_entity_type = 'project' AND source_entity_id = ?"
  ).get(id);
  if (claims.n > 0) {
    throw new ConflictError('Project cannot be deleted while ' + claims.n + ' claim(s) reference it. Delete the claims first.');
  }
  try {
    const info = db.prepare('DELETE FROM project WHERE id = ?').run(id);
    return info.changes > 0;
  } catch (err) {
    if (isOperationalError(err) && err.code.startsWith('SQLITE_CONSTRAINT')) {
      throw new ConflictError('Project cannot be deleted while related records exist.');
    }
    throw err;
  }
}

/** Claims made within this project (source link), newest first. */
function listClaims(projectId, onlyPublished) {
  const db = connectDB();
  let sql = 'SELECT * FROM claim WHERE source_entity_type = ? AND source_entity_id = ?';
  const params = ['project', projectId];
  if (onlyPublished) sql += " AND publication_state = 'Published'";
  sql += ' ORDER BY created_at DESC, id DESC';
  return db.prepare(sql).all(...params);
}

/** Evidence attached to this project via the project_evidence join. */
function listEvidence(projectId) {
  const db = connectDB();
  return db.prepare(
    'SELECT e.* FROM evidence e JOIN project_evidence pe ON pe.evidence_id = e.id WHERE pe.project_id = ? ORDER BY e.created_at DESC, e.id DESC'
  ).all(projectId);
}

/** Attach existing evidence to this project (idempotent). Returns true if inserted. */
function attachEvidence(projectId, evidenceId) {
  const db = connectDB();
  const info = db.prepare('INSERT OR IGNORE INTO project_evidence (project_id, evidence_id) VALUES (?, ?)').run(projectId, evidenceId);
  return info.changes > 0;
}

function listSkills(projectId) {
  const db = connectDB();
  return db.prepare(
    'SELECT s.* FROM skill s JOIN project_skill ps ON ps.skill_id = s.id WHERE ps.project_id = ? ORDER BY s.name'
  ).all(projectId);
}

function attachSkill(projectId, skillId) {
  const db = connectDB();
  const info = db.prepare('INSERT OR IGNORE INTO project_skill (project_id, skill_id) VALUES (?, ?)').run(projectId, skillId);
  return info.changes > 0;
}

module.exports = {
  listAll, listPublished, getById, create, update, setPublicationState, remove,
  listClaims, listEvidence, attachEvidence, listSkills, attachSkill,
};
