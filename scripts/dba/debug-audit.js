'use strict';
const { configureTestEnv } = require('../../tests/helpers');
configureTestEnv();
(async () => {
  const { initDatabase, query, all } = require('../../src/config/database');
  await initDatabase();
  await query("INSERT INTO skill (name, publication_state) VALUES ('Probe X', 'Draft')");
  const rows = await all('SELECT table_name, row_id, action, changed_by FROM audit_log ORDER BY id DESC LIMIT 3');
  console.log('audit rows:', JSON.stringify(rows));
  process.exit(0);
})().catch((e) => { console.error(e.stack); process.exit(1); });

