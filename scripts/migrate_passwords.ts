import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_P1s3LRXYJoZQ@ep-wild-bread-b5a2u322-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(databaseUrl);

async function main() {
  console.log("🔄 Migrating cms_users to plain text passwords...\n");
  
  // Step 1: Add password column if not exists
  console.log("1. Adding 'password' column...");
  await sql`ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS password TEXT`;
  
  // Step 2: Convert existing hashed passwords to plain text
  // The original seed used "Admin@2026!" as the password
  console.log("2. Converting existing hashed passwords to plain text...");
  const plainPassword = "Admin@2026!";
  
  const updateResult = await sql`
    UPDATE cms_users 
    SET password = ${plainPassword}, updated_at = NOW()
    RETURNING id, email
  `;
  
  console.log(`   Updated ${updateResult.length} users:`);
  for (const u of updateResult) {
    console.log(`   - ${u.email}`);
  }
  
  // Step 3: Show final result
  console.log("\n3. Final table state:");
  const users = await sql`SELECT id, name, email, role, is_authorized, can_manage_access, password FROM cms_users`;
  console.log(JSON.stringify(users, null, 2));
  
  console.log("\n✅ Migration complete! Passwords are now stored as plain text.");
}

main().catch(console.error);