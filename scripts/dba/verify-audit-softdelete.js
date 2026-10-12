'use strict';
// Verifies audit attribution (app.user_id via request context) and evidence
// soft delete through the real application data path.

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
process.env.DB_DRIVER = 'postgres';

const { runContext, getRequestUser } = require('../../src/lib/requestContext');
const { initDatabase, query, one, closeDatabase } = require('../../src/config/database');
const evidenceRepo = require('../../src/repositories/evidenceRepository');

(async () => {
  await initDatabase();
  console.log('driver:', require('../../src/config/database').getDriver());

  // 1. Audit attribution through the request context
  await runContext({ user: 'owner' }, async () => {
    console.log('context user:', getRequestUser());
    const id = await evidenceRepo.create({ description: '__audit_probe__', file_path: 'https://example.com/audit.png' });
    const row = await one(
      "SELECT action, changed_by, new_data->>'description' AS description FROM audit_log WHERE table_name='evidence' AND row_id=$1 ORDER BY id DESC LIMIT 1",
      [id]
    );
    if (!row) throw new Error('no audit row written');
    console.log('AUDIT row:', JSON.stringify(row));
    if (row.changed_by !== 'owner') throw new Error('changed_by expected "owner", got ' + row.changed_by);
    if (row.action !== 'INSERT') throw new Error('action expected INSERT');

    // 2. Soft delete: row hidden from reads, deleted_at stamped, row retained
    const removed = await evidenceRepo.remove(id);
    if (!removed) throw new Error('soft delete returned false');
    const stillThere = await one('SELECT deleted_at FROM evidence WHERE id = $1', [id]);
    if (!stillThere || !stillThere.deleted_at) throw new Error('deleted_at not stamped');
    const visible = await evidenceRepo.getById(id);
    if (visible !== null) throw new Error('soft-deleted row still visible to reads');
    const inList = (await evidenceRepo.listAll()).some((e) => e.id === id);
    if (inList) throw new Error('soft-deleted row still in listAll');
    console.log('SOFT DELETE verified: hidden from reads, row retained, deleted_at stamped');

    // 3. clean the probe (hard delete of our own probe only)
    await query('DELETE FROM evidence WHERE id = $1', [id]);
    await query("DELETE FROM audit_log WHERE table_name='evidence' AND row_id=$1", [id]);
    console.log('probe cleaned');
  });

  await closeDatabase();
  console.log('ALL AUDIT/SOFT-DELETE CHECKS PASSED');
})().catch((e) => { console.error('FATAL: ' + e.message); process.exit(1); });
