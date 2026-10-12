'use strict';

const { query, one, all, isConstraintError } = require('../config/database');
const { ConflictError } = require('../lib/validation');

async function listAll() {
  return all('SELECT * FROM claim ORDER BY created_at DESC, id DESC');
}

async function getById(id) {
  return one('SELECT * FROM claim WHERE id = $1', [id]);
}

/**
 * Create a claim. A claim may exist without evidence (frozen business rule).
 * source: { type: 'profile'|'project'|'skill', id } — optional; linkage
 * integrity is enforced at application level (polymorphic target).
 */
async function create(data) {
  const { rows } = await query(
    "INSERT INTO claim (statement, justification, source_entity_type, source_entity_id, publication_state) VALUES ($1, $2, $3, $4, 'Draft') RETURNING id",
    [
      data.statement,
      data.justification || null,
      data.source ? data.source.type : null,
      data.source ? data.source.id : null,
    ]
  );
  return rows[0].id;
}

async function update(id, changes) {
  const allowed = ['statement', 'justification'];
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
    'UPDATE claim SET ' + fields.join(', ') + ' WHERE id = $' + n, values
  );
  return rowCount;
}

async function setPublicationState(id, state) {
  const { rowCount } = await query(
    'UPDATE claim SET publication_state = $1 WHERE id = $2', [state, id]
  );
  return rowCount > 0;
}

/**
 * Delete a claim. Claim deletion cascades to its claim_evidence links only
 * (schema ON DELETE CASCADE); evidence rows themselves survive.
 */
async function remove(id) {
  try {
    const { rowCount } = await query('DELETE FROM claim WHERE id = $1', [id]);
    return rowCount > 0;
  } catch (err) {
    if (isConstraintError(err)) {
      throw new ConflictError('Claim cannot be deleted while related records exist.');
    }
    throw err;
  }
}

/** Evidence linked to this claim (bidirectional traceability). */
async function listEvidence(claimId) {
  return all(
    'SELECT e.* FROM evidence e JOIN claim_evidence ce ON ce.evidence_id = e.id WHERE ce.claim_id = $1 AND e.deleted_at IS NULL ORDER BY e.created_at DESC, e.id DESC',
    [claimId]
  );
}

/** Link existing evidence to this claim (idempotent). */
async function attachEvidence(claimId, evidenceId) {
  const { rowCount } = await query(
    'INSERT INTO claim_evidence (claim_id, evidence_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [claimId, evidenceId]
  );
  return rowCount > 0;
}

module.exports = {
  listAll, getById, create, update, setPublicationState, remove,
  listEvidence, attachEvidence,
};

