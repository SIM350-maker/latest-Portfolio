'use strict';
// Senior DBA discovery — READ-ONLY against the production database.
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const fs = require('fs');
const { Pool } = require('pg');
const url = (process.env.TEST_POSTGRES_URL || process.env.DATABASE_URL || '').trim();
if (!url) { console.error('FATAL: no DATABASE_URL'); process.exit(1); }
const pool = new Pool({
  connectionString: url,
  max: 2,
  ssl: /sslmode=(?!disable)/.test(url) ? { rejectUnauthorized: process.env.PG_ALLOW_SELF_SIGNED === '1' ? false : true } : undefined,
});

async function main() {
  const out = {};

  out.tables = (await pool.query(`
    SELECT c.relname AS table_name, c.reltuples::bigint AS est_rows,
           pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' ORDER BY c.relname`)).rows;

  out.columns = (await pool.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns WHERE table_schema='public'
    ORDER BY table_name, ordinal_position`)).rows;

  out.constraints = (await pool.query(`
    SELECT tc.table_name, tc.constraint_type, tc.constraint_name,
           string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS columns,
           ccu.table_name AS ref_table, ccu.column_name AS ref_column,
           cc.check_clause
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name=kcu.constraint_name AND tc.constraint_schema=kcu.constraint_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name=ccu.constraint_name AND tc.constraint_schema=ccu.constraint_schema
    LEFT JOIN information_schema.check_constraints cc
      ON tc.constraint_type='CHECK' AND cc.constraint_name=tc.constraint_name AND cc.constraint_schema=tc.constraint_schema
    WHERE tc.table_schema='public' AND tc.constraint_type IN ('PRIMARY KEY','FOREIGN KEY','UNIQUE','CHECK')
    GROUP BY tc.table_name, tc.constraint_type, tc.constraint_name, ccu.table_name, ccu.column_name, cc.check_clause
    ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name`)).rows;

  out.indexes = (await pool.query(`
    SELECT tablename, indexname, indexdef FROM pg_indexes
    WHERE schemaname='public' ORDER BY tablename, indexname`)).rows;

  out.triggers = (await pool.query(`
    SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation
    FROM information_schema.triggers WHERE trigger_schema='public'
    ORDER BY event_object_table, trigger_name`)).rows;

  out.functions = (await pool.query(`
    SELECT routine_name, data_type AS return_type FROM information_schema.routines
    WHERE routine_schema='public' AND routine_type='FUNCTION' ORDER BY routine_name`)).rows;

  out.sequences = (await pool.query(`
    SELECT sequencename, last_value FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename`)).rows;

  out.extensions = (await pool.query(`SELECT extname, extversion FROM pg_extension ORDER BY extname`)).rows;

  // FK columns lacking a leading index (join/lookup performance risk)
  out.fk_columns_without_index = (await pool.query(`
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name=kcu.constraint_name AND tc.constraint_schema=kcu.constraint_schema
    WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relname=tc.table_name AND i.indkey[0]::int = kcu.ordinal_position
      )
    ORDER BY tc.table_name, kcu.column_name`)).rows;

  // Data-quality probes
  out.date_format_distribution = (await pool.query(`
    SELECT 'experience.start_date' AS col, start_date AS value, COUNT(*)::int AS n FROM experience GROUP BY start_date
    UNION ALL SELECT 'experience.end_date', end_date, COUNT(*)::int FROM experience WHERE end_date IS NOT NULL GROUP BY end_date
    UNION ALL SELECT 'education.start_date', start_date, COUNT(*)::int FROM education GROUP BY start_date
    UNION ALL SELECT 'education.end_date', end_date, COUNT(*)::int FROM education WHERE end_date IS NOT NULL GROUP BY end_date
    ORDER BY col, value`)).rows;

  out.nullable_audit = (await pool.query(`
    SELECT 'project' AS t, COUNT(*) FILTER (WHERE profile_id IS NULL)::int AS null_fk_rows, COUNT(*)::int AS total FROM project
    UNION ALL SELECT 'skill', COUNT(*) FILTER (WHERE category IS NULL)::int, COUNT(*)::int FROM skill
    UNION ALL SELECT 'evidence', COUNT(*) FILTER (WHERE description IS NULL)::int, COUNT(*)::int FROM evidence
    UNION ALL SELECT 'profile', COUNT(*) FILTER (WHERE email IS NULL)::int, COUNT(*)::int FROM profile
    UNION ALL SELECT 'certifications', COUNT(*) FILTER (WHERE issuer IS NULL)::int, COUNT(*)::int FROM certifications
    ORDER BY t`)).rows;

  out.claim_integrity = (await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE source_entity_type IS NOT NULL AND source_entity_id IS NULL)::int AS type_without_id,
      COUNT(*) FILTER (WHERE source_entity_id IS NOT NULL AND source_entity_type IS NULL)::int AS id_without_type,
      COUNT(*) FILTER (WHERE source_entity_type='project' AND source_entity_id IS NOT NULL AND source_entity_id NOT IN (SELECT id FROM project))::int AS orphan_project,
      COUNT(*) FILTER (WHERE source_entity_type='skill' AND source_entity_id IS NOT NULL AND source_entity_id NOT IN (SELECT id FROM skill))::int AS orphan_skill
    FROM claim`)).rows[0];

  out.evidence_completeness = (await pool.query(`
    SELECT COUNT(*) FILTER (WHERE description IS NULL AND file_path IS NULL)::int AS both_null,
           COUNT(*) FILTER (WHERE file_path IS NOT NULL AND file_path !~* '^https?://')::int AS non_url_paths
    FROM evidence`)).rows[0];

  out.published_rows = (await pool.query(`
    SELECT (SELECT COUNT(*) FROM project WHERE publication_state='Published')::int AS projects,
           (SELECT COUNT(*) FROM skill WHERE publication_state='Published')::int AS skills,
           (SELECT COUNT(*) FROM profile WHERE publication_state='Published')::int AS profiles`)).rows[0];

  out.db_meta = (await pool.query(`
    SELECT version() AS version,
           pg_size_pretty(pg_database_size(current_database())) AS db_size,
           current_setting('autovacuum') AS autovacuum`)).rows[0];

  fs.writeFileSync(require('path').resolve(__dirname, 'dba-discovery.json'), JSON.stringify(out, null, 2));
  console.log('written: dba-discovery.json (' + out.tables.length + ' tables, ' + out.indexes.length + ' indexes)');
}

main()
  .catch((e) => { console.error('FATAL: ' + e.message); process.exitCode = 1; })
  .finally(() => pool.end().catch(() => {}));
