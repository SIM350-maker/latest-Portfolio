import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("--- Counts ---");
  const tables = ['service_category', 'service_package', 'service_feature', 'service_deliverable', 'service_technology', 'engagement_model', 'pricing_faq'];
  for (const t of tables) {
    const r = await sql.unsafe(`SELECT COUNT(*) as count FROM ${t}`);
    console.log(t, "count:", r);
  }
}

main();