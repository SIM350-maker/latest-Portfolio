'use strict';

const { connectDB } = require('../config/database');

function listAll() {
  const db = connectDB();
  return db.prepare('SELECT * FROM claim ORDER BY created_at DESC, id DESC').all();
}

function getById(id) {
  const db = connectDB();
  return db.prepare('SELECT * FROM claim WHERE id = ?').get(id) || null;
}

/**
 * Create a claim. A claim may exist without evidence (frozen business rule).
 * source: { type: 'profile'|'project'|'skill', id } — optional; linkage
 * integrity is enforced at application level (polymorphic target).
 */
function create(data) {
  const db = connectDB();
  const stmt = db.prepare(
    "INSERT INTO claim (statement, justification, source_entity_type, source_entity_id, publication_state) VALUES (?, ?, ?, ?, 'Draft')"
  );
  const info = stmt.run(
    data.statement,
    data.justification || null,
    data.source ? data.source.type : null,
    data.source ? data.source.id : null
  );
  return info.lastInsertRowid;
}

function update(id, changes) {
  const db = connectDB();
  const fields = [];
  const values = [];
  const allowed = ['statement', 'justification'];
  for (const key of allowed) {
    if (changes[key] !== undefined) {
      fields.push(key + ' = ?');
      values.push(changes[key]);
    }
  }
  if (fields.length === 0) return 0;
  values.push(id);
  const info = db.prepare('UPDATE claim SET ' + fields.join(', ') + ' WHERE id = ?').run(...values);
  return info.changes;
}

function setPublicationState(id, state) {
  const db = connectDB();
  const info = db.prepare('UPDATE claim SET publication_state = ? WHERE id = ?').run(state, id);
  return info.changes > 0;
}

/**
 * Delete a claim. Claim deletion cascades to its claim_evidence links only
 * (schema ON DELETE CASCADE); evidence rows themselves survive.
 */
function remove(id) {
  const db = connectDB();
  const info = db.prepare('DELETE FROM claim WHERE id = ?').run(id);
  return info.changes > 0;
}

/** Evidence linked to this claim (bidirectional traceability). */
function listEvidence(claimId) {
  const db = connectDB();
  return db.prepare(
    'SELECT e.* FROM evidence e JOIN claim_evidence ce ON ce.evidence_id = e.id WHERE ce.claim_id = ? ORDER BY e.created_at DESC, e.id DESC'
  ).all(claimId);
}

/** Link existing evidence to this claim (idempotent). */
function attachEvidence(claimId, evidenceId) {
  const db = connectDB();
  const info = db.prepare('INSERT OR IGNORE INTO claim_evidence (claim_id, evidence_id) VALUES (?, ?)').run(claimId, evidenceId);
  return info.changes > 0;
}

module.exports = {
  listAll, getById, create, update, setPublicationState, remove,
  listEvidence, attachEvidence,
};
