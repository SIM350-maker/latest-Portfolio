import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const migrationSQL = readFileSync("src/scripts/migrate-services.sql", "utf-8");
  
  // Remove IF NOT EXISTS from CREATE TABLE statements
  const fixedSQL = migrationSQL
    .replace(/CREATE TABLE IF NOT EXISTS/gi, 'CREATE TABLE')
    .replace(/CREATE INDEX IF NOT EXISTS/gi, 'CREATE INDEX')
    .replace(/CREATE UNIQUE INDEX IF NOT EXISTS/gi, 'CREATE UNIQUE INDEX')
    .replace(/CREATE TYPE.*IF NOT EXISTS/gi, 'CREATE TYPE');
  
  // But keep triggers with IF NOT EXISTS
  // Actually, let's just split and execute
  const statements = [];
  let current = "";
  let inFunction = false;
  let parenCount = 0;
  
  for (const line of fixedSQL.split('\n')) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('--')) continue;
    if (!trimmed && !current) continue;
    
    current += line + '\n';
    
    for (const ch of line) {
      if (ch === '(') parenCount++;
      else if (ch === ')') parenCount--;
    }
    
    if (trimmed.includes('RETURNS TRIGGER') || trimmed.includes('language')) {
      inFunction = true;
    }
    
    if (trimmed.endsWith(';') && !inFunction && parenCount <= 0) {
      statements.push(current.trim());
      current = "";
      inFunction = false;
    } else if (trimmed === '$$ language \'plpgsql\';') {
      inFunction = false;
    }
  }
  
  if (current.trim() && !current.trim().startsWith('--')) {
    statements.push(current.trim());
  }
  
  console.log(`Total statements: ${statements.length}`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    
    console.log(`[${i+1}/${statements.length}] ${stmt.substring(0, 80)}...`);
    try {
      await sql.unsafe(stmt);
      console.log("  OK");
    } catch (e: any) {
      // Ignore "already exists" errors
      if (e.message?.includes('already exists') || e.message?.includes('duplicate key')) {
        console.log("  ALREADY EXISTS (ignored)");
      } else {
        console.error("  ERROR:", e.message?.substring(0, 200) || e);
      }
    }
  }
  
  // Verify
  console.log("\n--- Verification ---");
  const tables = ['service_category', 'service_package', 'engagement_model', 'pricing_faq', 'service_feature', 'service_deliverable', 'service_technology'];
  for (const t of tables) {
    const r = await sql`SELECT to_regclass(${t}) as exists`;
    console.log(t, r[0].exists ? 'EXISTS' : 'MISSING');
  }
}

main();