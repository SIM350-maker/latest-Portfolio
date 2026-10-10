'use strict';

const { connectDB } = require('../config/database');

function listAll() {
  const db = connectDB();
  return db.prepare('SELECT * FROM evidence ORDER BY created_at DESC, id DESC').all();
}

function getById(id) {
  const db = connectDB();
  return db.prepare('SELECT * FROM evidence WHERE id = ?').get(id) || null;
}

/**
 * Create an evidence item. file_path is an external reference (URL or
 * identifier); the system stores references only, never artifact content.
 */
function create(data) {
  const db = connectDB();
  const stmt = db.prepare(
    "INSERT INTO evidence (description, file_path, file_type, accessibility_status) VALUES (?, ?, ?, 'Public')"
  );
  const info = stmt.run(data.description || null, data.file_path || null, data.file_type || null);
  return info.lastInsertRowid;
}



/** Update accessibility status only (never touches other fields). */
function setAccessibility(id, status) {
  const db = connectDB();
  const info = db.prepare('UPDATE evidence SET accessibility_status = ? WHERE id = ?').run(status, id);
  return info.changes > 0;
}

/**
 * Delete evidence. Join-table rows cascade (project_evidence, skill_evidence,
 * claim_evidence all ON DELETE CASCADE); claims and projects survive.
 */
function remove(id) {
  const db = connectDB();
  const info = db.prepare('DELETE FROM evidence WHERE id = ?').run(id);
  return info.changes > 0;
}

/** Claims this evidence supports (reverse traceability, FR-003). */
function listClaims(evidenceId) {
  const db = connectDB();
  return db.prepare(
    'SELECT c.* FROM claim c JOIN claim_evidence ce ON ce.claim_id = c.id WHERE ce.evidence_id = ? ORDER BY c.created_at DESC'
  ).all(evidenceId);
}

module.exports = { listAll, getById, create, setAccessibility, remove, listClaims };
