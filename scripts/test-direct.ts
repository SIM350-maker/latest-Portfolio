import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // Try creating a simple table without IF NOT EXISTS
  try {
    await sql`CREATE TABLE test_simple (id SERIAL PRIMARY KEY, name TEXT)`;
    console.log('test_simple created');
  } catch (e: any) {
    console.error('Create test_simple error:', e.message);
  }
  
  // Check if it exists
  let r = await sql`SELECT to_regclass('test_simple') as exists`;
  console.log('test_simple exists:', r[0].exists);
  
  // Now try service_category without IF NOT EXISTS
  try {
    await sql`CREATE TABLE service_category (id SERIAL PRIMARY KEY, title TEXT)`;
    console.log('service_category created directly');
  } catch (e: any) {
    console.error('Create service_category error:', e.message);
  }
  
  r = await sql`SELECT to_regclass('service_category') as exists`;
  console.log('service_category exists:', r[0].exists);
}

main();