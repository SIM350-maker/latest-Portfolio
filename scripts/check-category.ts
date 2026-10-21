import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const r = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'service_category'`;
  console.log('service_category columns:', r);
  
  const cats = await sql`SELECT * FROM service_category`;
  console.log('service_category data:', cats);
}

main();