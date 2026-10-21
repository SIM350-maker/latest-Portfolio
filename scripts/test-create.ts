import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY)`;
    console.log('Test table created');
    const r = await sql`SELECT to_regclass('test_table') as exists`;
    console.log('test_table', r[0].exists ? 'EXISTS' : 'MISSING');
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

main();