'use strict';

// Display formatting helpers (view layer). Database stores ISO `YYYY-MM`
// (dba remediation P2-5); human-readable rendering happens here — never in
// the data layer.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * '2026-07' -> 'July 2026'. Values already in another shape (e.g. legacy
 * prose or full dates) pass through unchanged rather than being mangled.
 */
function formatMonth(value) {
  if (typeof value !== 'string') return value;
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return value;
  const monthIndex = Number(m[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) return value;
  return MONTHS[monthIndex] + ' ' + m[1];
}

/** Range renderer: 'July 2026 – present' / 'May 2025 – August 2025'. */
function formatRange(start, end) {
  return formatMonth(start) + ' – ' + (end ? formatMonth(end) : 'present');
}

/**
 * Human summary of an audit_log entry. new_data is a JSONB object on
 * PostgreSQL and a JSON string on SQLite — parse defensively and surface the
 * most identifying field available.
 */
function auditSummary(entry) {
  let data = entry.new_data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (_) { data = null; }
  }
  if (data && typeof data === 'object') {
    const label = data.name || data.title || data.statement || data.institution
      || data.company || data.description || data.file_path;
    if (label) return String(label).slice(0, 120);
  }
  return 'row #' + entry.row_id;
}

module.exports = { formatMonth, formatRange, auditSummary };
