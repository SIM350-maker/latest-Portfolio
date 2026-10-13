'use strict';

// Audit trail repository (read side). Writes happen exclusively through the
// database audit triggers (dba remediation P3-1).

const { all } = require('../config/database');

function listRecent(limit = 50) {
  return all('SELECT * FROM audit_log ORDER BY changed_at DESC, id DESC LIMIT $1', [limit]);
}

function countAll() {
  const { one } = require('../config/database');
  return one('SELECT COUNT(*) AS n FROM audit_log').then((r) => Number(r.n));
}

module.exports = { listRecent, countAll };
