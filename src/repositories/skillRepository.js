'use strict';

const { connectDB, isOperationalError } = require('../config/database');
const { ConflictError } = require('../lib/validation');

const PUBLIC_FILTER = "publication_state = 'Published'";

function listAll() {
  const db = connectDB();
  return db.prepare('SELECT * FROM skill ORDER BY name ASC').all();
}

function listPublished() {
  const db = connectDB();
  return db.prepare('SELECT * FROM skill WHERE ' + PUBLIC_FILTER + ' ORDER BY name ASC').all();
}

function getById(id) {
  const db = connectDB();
  return db.prepare('SELECT * FROM skill WHERE id = ?').get(id) || null;
}

function findByName(name) {
  const db = connectDB();
  return db.prepare('SELECT * FROM skill WHERE lower(name) = lower(?)').get(name) || null;
}

function create(data) {
  const db = connectDB();
  const stmt = db.prepare("INSERT INTO skill (name, description, publication_state) VALUES (?, ?, 'Draft')");
  const info = stmt.run(data.name, data.description || null);
  return info.lastInsertRowid;
}

function update(id, changes) {
  const db = connectDB();
  const fields = [];
  const values = [];
  const allowed = ['name', 'description'];
  for (const key of allowed) {
    if (changes[key] !== undefined) {
      fields.push(key + ' = ?');
      values.push(changes[key]);
    }
  }
  if (fields.length === 0) return 0;
  values.push(id);
  const info = db.prepare('UPDATE skill SET ' + fields.join(', ') + ' WHERE id = ?').run(...values);
  return info.changes;
}

function setPublicationState(id, state) {
  const db = connectDB();
  const info = db.prepare('UPDATE skill SET publication_state = ? WHERE id = ?').run(state, id);
  return info.changes > 0;
}

/** RESTRICT default: blocked while claims reference the skill. */
function remove(id) {
  const db = connectDB();
  const claims = db.prepare(
    "SELECT COUNT(*) AS n FROM claim WHERE source_entity_type = 'skill' AND source_entity_id = ?"
  ).get(id);
  if (claims.n > 0) {
    throw new ConflictError('Skill cannot be deleted while ' + claims.n + ' claim(s) reference it. Delete the claims first.');
  }
  try {
    // project_skill and skill_evidence join rows cascade (schema).
    const info = db.prepare('DELETE FROM skill WHERE id = ?').run(id);
    return info.changes > 0;
  } catch (err) {
    if (isOperationalError(err) && err.code.startsWith('SQLITE_CONSTRAINT')) {
      throw new ConflictError('Skill cannot be deleted while related records exist.');
    }
    throw err;
  }
}

function listClaims(skillId, onlyPublished) {
  const db = connectDB();
  let sql = 'SELECT * FROM claim WHERE source_entity_type = ? AND source_entity_id = ?';
  const params = ['skill', skillId];
  if (onlyPublished) sql += " AND publication_state = 'Published'";
  sql += ' ORDER BY created_at DESC, id DESC';
  return db.prepare(sql).all(...params);
}

function listEvidence(skillId) {
  const db = connectDB();
  return db.prepare(
    'SELECT e.* FROM evidence e JOIN skill_evidence se ON se.evidence_id = e.id WHERE se.skill_id = ? ORDER BY e.created_at DESC, e.id DESC'
  ).all(skillId);
}

function attachEvidence(skillId, evidenceId) {
  const db = connectDB();
  const info = db.prepare('INSERT OR IGNORE INTO skill_evidence (skill_id, evidence_id) VALUES (?, ?)').run(skillId, evidenceId);
  return info.changes > 0;
}

module.exports = {
  listAll, listPublished, getById, findByName, create, update, setPublicationState, remove,
  listClaims, listEvidence, attachEvidence,
};
