import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const r = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'engagement_model'`;
  console.log(r);
  
  // Also check pricing_faq
  const r2 = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pricing_faq'`;
  console.log('pricing_faq:', r2);
  
  // Check service_feature
  const r3 = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'service_feature'`;
  console.log('service_feature:', r3);
}

main();