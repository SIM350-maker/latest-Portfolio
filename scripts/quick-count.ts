import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const tables = ['service_category', 'service_package', 'service_feature', 'service_deliverable', 'service_technology', 'engagement_model', 'pricing_faq'];
  for (const t of tables) {
    const r = await sql`SELECT COUNT(*) as count FROM ${sql(t)}`;
    console.log(t, r[0].count);
  }
}

main();