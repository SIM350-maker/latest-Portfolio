import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const tables = ['service_category', 'service_package', 'engagement_model', 'pricing_faq', 'service_feature', 'service_deliverable', 'service_technology'];

  for (const t of tables) {
    const r = await sql`SELECT to_regclass(${t}) as exists`;
    console.log(t, r[0].exists ? 'EXISTS' : 'MISSING');
  }
}

main();