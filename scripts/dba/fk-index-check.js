'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: true },
});

(async () => {
  // Correct FK-coverage check: a FK column is covered when ANY index on the
  // table LEADS with that column's attnum.
  const r = await pool.query(`
    SELECT tc.table_name, kcu.column_name, a.attnum
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema
    JOIN pg_class c ON c.relname = tc.table_name
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = kcu.column_name
    WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        WHERE i.indrelid = c.oid AND (i.indkey::int2[])[1] = a.attnum
      )
    ORDER BY tc.table_name, kcu.column_name`);
  console.log('TRUE missing leading FK indexes:');
  r.rows.forEach((x) => console.log('  ' + x.table_name + '.' + x.column_name));

  await pool.query('ANALYZE');
  console.log('ANALYZE executed — planner statistics refreshed');
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
