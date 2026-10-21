import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const databaseUrl = process.env.DATABASE_URL!;
const sql = neon(databaseUrl);

const MIGRATION_NAME = "002-services-schema";

async function alreadyApplied(): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM _migrations WHERE filename = ${MIGRATION_NAME} LIMIT 1`;
  return rows.length > 0;
}

async function markApplied() {
  await sql`INSERT INTO _migrations (filename, applied_at) VALUES (${MIGRATION_NAME}, NOW())`;
}

async function main() {
  console.log("🚀 Services Schema — migration");
  if (await alreadyApplied()) {
    console.log("✅ Migration already applied, skipping DDL");
    return;
  }

  // Read and execute the SQL migration file
  const migrationPath = join(process.cwd(), "src/scripts/migrate-services.sql");
  const migrationSQL = readFileSync(migrationPath, "utf-8");

  console.log("📄 Executing services schema migration...");
  await sql.unsafe(migrationSQL);

  await markApplied();
  console.log("✅ Services migration applied and recorded");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});