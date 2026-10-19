import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_P1s3LRXYJoZQ@ep-wild-bread-b5a2u322-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(databaseUrl);

async function main() {
  console.log("🔍 Checking current cms_users table structure...");
  
  // Check current columns
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cms_users' ORDER BY ordinal_position`;
  console.log("Current columns:", JSON.stringify(cols, null, 2));
  
  // Check current users
  const users = await sql`SELECT id, name, email, role, is_authorized, can_manage_access FROM cms_users`;
  console.log("Current users:", JSON.stringify(users, null, 2));
}

main().catch(console.error);