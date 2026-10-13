'use strict';

const { query, one, all } = require('../config/database');

/** Newest first; both handled and unhandled (admin triage view). */
async function listAll() {
  return all('SELECT * FROM contact_messages ORDER BY created_at DESC, id DESC');
}

async function listUnhandled() {
  return all('SELECT * FROM contact_messages WHERE handled = FALSE ORDER BY created_at DESC, id DESC');
}

async function getById(id) {
  return one('SELECT * FROM contact_messages WHERE id = $1', [id]) || null;
}

/** Public contact form intake (name/email/message validated by the route). */
async function create(data) {
  const { rows } = await query(
    'INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3) RETURNING id',
    [data.name, data.email, data.message]
  );
  return rows[0].id;
}

async function markHandled(id) {
  const { rowCount } = await query(
    'UPDATE contact_messages SET handled = TRUE, handled_at = now() WHERE id = $1 AND handled = FALSE', [id]
  );
  return rowCount > 0;
}

/** Contact messages are disposable correspondence (unlike evidence): hard delete. */
async function remove(id) {
  const { rowCount } = await query('DELETE FROM contact_messages WHERE id = $1', [id]);
  return rowCount > 0;
}

async function countUnhandled() {
  const r = await one('SELECT COUNT(*) AS n FROM contact_messages WHERE handled = FALSE');
  return Number(r.n);
}

module.exports = { listAll, listUnhandled, getById, create, markHandled, remove, countUnhandled };
