import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("--- Final verification ---");
  const tables = ['service_category', 'service_package', 'service_feature', 'service_deliverable', 'service_technology', 'engagement_model', 'pricing_faq'];
  
  for (const t of tables) {
    const r = await sql`SELECT to_regclass(${t}) as exists`;
    try {
      const count = await sql.unsafe(`SELECT COUNT(*) as count FROM ${t}`);
      console.log(t, r[0].exists ? 'EXISTS' : 'MISSING', '| rows:', count);
    } catch (e: any) {
      console.log(t, r[0].exists ? 'EXISTS' : 'MISSING', '| rows: ERROR -', e.message?.substring(0, 100));
    }
  }
  
  // Check specific data
  console.log("\n--- Sample data ---");
  const cats = await sql`SELECT title, slug FROM service_category ORDER BY display_order`;
  console.log("Categories:", cats);
  
  const pkgs = await sql`SELECT name, category_id, price_kes FROM service_package ORDER BY category_id, display_order`;
  console.log("Packages:", pkgs);
  
  const eng = await sql`SELECT title, slug FROM engagement_model ORDER BY display_order`;
  console.log("Engagements:", eng);
  
  const faqs = await sql`SELECT question FROM pricing_faq ORDER BY display_order`;
  console.log("FAQs:", faqs);
}

main();