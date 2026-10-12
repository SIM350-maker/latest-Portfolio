'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: { rejectUnauthorized: true },
});

(async () => {
  const r = await pool.query(`
    SELECT 'experience' AS t, 'start_date' AS col, start_date AS v, title AS ctx FROM experience WHERE start_date !~ '^\d{4}-\d{2}$'
    UNION ALL SELECT 'experience', 'end_date', end_date, title FROM experience WHERE end_date IS NOT NULL AND end_date !~ '^\d{4}-\d{2}$'
    UNION ALL SELECT 'education', 'start_date', start_date, degree FROM education WHERE start_date !~ '^\d{4}-\d{2}$'
    UNION ALL SELECT 'education', 'end_date', end_date, degree FROM education WHERE end_date IS NOT NULL AND end_date !~ '^\d{4}-\d{2}$'`);
  r.rows.forEach((x) => console.log(x.t + '.' + x.col + ' = ' + JSON.stringify(x.v) + ' (' + x.ctx + ')'));
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
