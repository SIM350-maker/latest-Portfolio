import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // Check if tables exist
  const tables = ['service_category', 'service_package', 'engagement_model', 'pricing_faq', 'service_feature', 'service_deliverable', 'service_technology'];
  
  for (const t of tables) {
    // Try multiple approaches
    const r1 = await sql`SELECT to_regclass(${t}) as exists`;
    console.log(`to_regclass ${t}:`, r1[0].exists);
    
    const r2 = await sql`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ${t}) as exists`;
    console.log(`information_schema ${t}:`, r2[0].exists);
    
    try {
      const r3 = await sql.unsafe(`SELECT COUNT(*) as count FROM ${t}`);
      console.log(`COUNT ${t}:`, r3[0]?.count);
    } catch (e: any) {
      console.log(`COUNT ${t}: ERROR -`, e.message?.substring(0, 100));
    }
  }
  
  // Also check the billing_cycle type
  const r = await sql`SELECT typname FROM pg_type WHERE typname = 'billing_cycle'`;
  console.log('billing_cycle type:', r.length > 0);
}

main();