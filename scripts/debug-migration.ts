import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const migrationSQL = readFileSync("src/scripts/migrate-services.sql", "utf-8");
  const statements = migrationSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  console.log(`Total statements: ${statements.length}`);
  
  // Print first few statements
  for (let i = 0; i < Math.min(5, statements.length); i++) {
    console.log(`Statement ${i+1}:`, statements[i].substring(0, 100) + "...");
  }

  // Try the first CREATE TABLE statement
  console.log("\n--- Trying first CREATE TABLE ---");
  const firstStmt = statements[0];
  console.log("Executing:", firstStmt.substring(0, 200));
  try {
    await sql.unsafe(firstStmt + ";");
    console.log("  OK");
  } catch (e: any) {
    console.error("  ERROR:", e.message);
  }

  // Check if service_category exists now
  const r = await sql`SELECT to_regclass('service_category') as exists`;
  console.log('service_category', r[0].exists ? 'EXISTS' : 'MISSING');
}

main();