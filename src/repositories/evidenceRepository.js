'use strict';

const { query, one, all } = require('../config/database');

const LIVE = 'deleted_at IS NULL';

async function listAll() {
  return all('SELECT * FROM evidence WHERE ' + LIVE + ' ORDER BY created_at DESC, id DESC');
}

/** Paginated + case-insensitive search across description/file_path/file_type. */
async function listPaged({ q = '', limit = 20, offset = 0 } = {}) {
  const params = [];
  let where = 'WHERE ' + LIVE;
  if (q) {
    params.push('%' + String(q).toLowerCase().replace(/([%_\\])/g, '\\$1') + '%');
    where = 'WHERE ' + LIVE + " AND (lower(COALESCE(description, '')) LIKE $1 ESCAPE '\\' OR lower(COALESCE(file_path, '')) LIKE $1 ESCAPE '\\' OR lower(COALESCE(file_type, '')) LIKE $1 ESCAPE '\\')";
  }
  const total = Number((await one('SELECT COUNT(*) AS n FROM evidence ' + where, params)).n);
  const rows = await all(
    'SELECT * FROM evidence ' + where + ' ORDER BY created_at DESC, id DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2),
    [...params, limit, offset]
  );
  return { rows, total };
}

async function getById(id) {
  return one('SELECT * FROM evidence WHERE id = $1 AND ' + LIVE, [id]) || null;
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
    'UPDATE evidence SET accessibility_status = $1 WHERE id = $2 AND ' + LIVE, [status, id]
  );
  return rowCount > 0;
}

/**
 * Soft delete (dba remediation P3-2): evidence is the verification chain —
 * removing a row would break claim traceability permanently. Joins cascade
 * visibility through the LIVE filter; rows and history remain.
 */
async function remove(id) {
  const { rowCount } = await query(
    'UPDATE evidence SET deleted_at = now() WHERE id = $1 AND ' + LIVE, [id]
  );
  return rowCount > 0;
}

/** Claims this evidence supports (reverse traceability, FR-003). */
async function listClaims(evidenceId) {
  return all(
    'SELECT c.* FROM claim c JOIN claim_evidence ce ON ce.claim_id = c.id WHERE ce.evidence_id = $1 ORDER BY c.created_at DESC',
    [evidenceId]
  );
}

module.exports = { listAll, listPaged, getById, create, setAccessibility, remove, listClaims };
