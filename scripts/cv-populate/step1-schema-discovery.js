'use strict';
// STEP 1 — SCHEMA DISCOVERY (READ-ONLY). No writes are performed.

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');

const url = process.env.TEST_POSTGRES_URL || process.env.DATABASE_URL;
if (!url) { console.error('FATAL: no DATABASE_URL'); process.exit(1); }

const pool = new Pool({
  connectionString: url,
  max: 2,
  ssl: /sslmode=(?!disable)/.test(url)
    ? { rejectUnauthorized: process.env.PG_ALLOW_SELF_SIGNED === '1' ? false : true }
    : undefined,
});

async function main() {
  // 1. Columns
  const cols = await pool.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  // 2. PK / FK / UNIQUE constraints
  const constraints = await pool.query(`
    SELECT tc.table_name, tc.constraint_type, tc.constraint_name, kcu.column_name,
           ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type IN ('PRIMARY KEY','FOREIGN KEY','UNIQUE')
    ORDER BY tc.table_name, tc.constraint_type, kcu.column_name
  `);

  // 3. CHECK constraints
  const checks = await pool.query(`
    SELECT tc.table_name, cc.constraint_name, cc.check_clause
    FROM information_schema.check_constraints cc
    JOIN information_schema.table_constraints tc
      ON cc.constraint_name = tc.constraint_name AND cc.constraint_schema = tc.constraint_schema
    WHERE cc.constraint_schema = 'public' AND tc.constraint_type = 'CHECK'
    ORDER BY tc.table_name, cc.constraint_name
  `);

  // Current row counts (context for the population report)
  const tables = [...new Set(cols.rows.map((r) => r.table_name))];
  const counts = {};
  for (const t of tables) {
    if (t.startsWith('_') || t.includes('evidence') || t.includes('claim')) continue;
    const r = await pool.query('SELECT COUNT(*)::int AS n FROM ' + t);
    counts[t] = r.rows[0].n;
  }

  const out = {
    columns: cols.rows,
    constraints: constraints.rows,
    check_constraints: checks.rows,
    current_row_counts: counts,
  };
  require('fs').writeFileSync(require('path').resolve(__dirname, 'schema-discovery.json'), JSON.stringify(out, null, 2)); console.log('written: schema-discovery.json');
}

main()
  .catch((e) => { console.error('FATAL: ' + e.message); process.exitCode = 1; })
  .finally(() => pool.end().catch(() => {}));


