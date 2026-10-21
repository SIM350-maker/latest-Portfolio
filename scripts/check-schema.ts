import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const migrationSQL = readFileSync("src/scripts/migrate-services.sql", "utf-8");
  
  // First check if enum type exists
  let r = await sql`SELECT typname FROM pg_type WHERE typname = 'billing_cycle'`;
  console.log('billing_cycle type exists:', r.length > 0);
  
  // Check current schema
  r = await sql`SELECT current_schema()`;
  console.log('Current schema:', r[0].current_schema);
  
  // Check if _migrations table exists
  r = await sql`SELECT to_regclass('_migrations') as exists`;
  console.log('_migrations table:', r[0].exists ? 'EXISTS' : 'MISSING');
  
  // Check if any tables exist in public schema
  r = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('All tables in public schema:', r.map(x => x.table_name));
}

main();