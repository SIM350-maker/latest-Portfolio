'use strict';

const { query, one, all } = require('../config/database');

async function listAll() {
  return all('SELECT * FROM evidence ORDER BY created_at DESC, id DESC');
}

async function getById(id) {
  return one('SELECT * FROM evidence WHERE id = $1', [id]);
}

/**
 * Create an evidence item. file_path is an external reference (URL or
 * identifier); the system stores references only, never artifact content.
 */
async function create(data) {
  const { rows } = await query(
    "INSERT INTO evidence (description, file_path, file_type, accessibility_status) VALUES ($1, $2, $3, 'Public') RETURNING id",
    [data.description || null, data.file_path || null, data.file_type || null]
  );
  return rows[0].id;
}

/** Update accessibility status only (never touches other fields). */
async function setAccessibility(id, status) {
  const { rowCount } = await query(
    'UPDATE evidence SET accessibility_status = $1 WHERE id = $2', [status, id]
  );
  return rowCount > 0;
}

/**
 * Delete evidence. Join-table rows cascade (project_evidence, skill_evidence,
 * claim_evidence all ON DELETE CASCADE); claims and projects survive.
 */
async function remove(id) {
  const { rowCount } = await query('DELETE FROM evidence WHERE id = $1', [id]);
  return rowCount > 0;
}

/** Claims this evidence supports (reverse traceability, FR-003). */
async function listClaims(evidenceId) {
  return all(
    'SELECT c.* FROM claim c JOIN claim_evidence ce ON ce.claim_id = c.id WHERE ce.evidence_id = $1 ORDER BY c.created_at DESC',
    [evidenceId]
  );
}

module.exports = { listAll, getById, create, setAccessibility, remove, listClaims };
