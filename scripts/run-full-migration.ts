import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const migrationSQL = readFileSync("src/scripts/migrate-services.sql", "utf-8");
  
  console.log("Executing entire migration as single unsafe call...");
  try {
    await sql.unsafe(migrationSQL);
    console.log("Migration executed successfully");
  } catch (e: any) {
    console.error("ERROR:", e.message);
  }

  // Check if tables exist now
  const tables = ['service_category', 'service_package', 'engagement_model', 'pricing_faq', 'service_feature', 'service_deliverable', 'service_technology'];
  for (const t of tables) {
    const r = await sql`SELECT to_regclass(${t}) as exists`;
    console.log(t, r[0].exists ? 'EXISTS' : 'MISSING');
  }
}

main();