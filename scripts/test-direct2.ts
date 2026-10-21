import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  // Try creating service_package directly
  try {
    console.log("Creating service_package directly...");
    await sql`CREATE TABLE service_package (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES service_category(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price_kes INTEGER NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'KES',
      billing_cycle TEXT NOT NULL DEFAULT 'one_time',
      features TEXT[] NOT NULL DEFAULT '{}',
      highlights TEXT[] NOT NULL DEFAULT '{}',
      cta_text VARCHAR(100) NOT NULL DEFAULT 'Get Started',
      cta_url VARCHAR(500),
      is_popular BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    console.log("  CREATE TABLE OK");
  } catch (e: any) {
    console.error("Error:", e.message);
  }
  
  // Check
  const r = await sql`SELECT to_regclass('service_package') as exists`;
  console.log('service_package:', r[0].exists);
  
  if (!r[0].exists) {
    // Try with unsafe
    console.log("Trying unsafe...");
    await sql.unsafe(`
      CREATE TABLE service_package (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES service_category(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price_kes INTEGER NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'KES',
        billing_cycle TEXT NOT NULL DEFAULT 'one_time',
        features TEXT[] NOT NULL DEFAULT '{}',
        highlights TEXT[] NOT NULL DEFAULT '{}',
        cta_text VARCHAR(100) NOT NULL DEFAULT 'Get Started',
        cta_url VARCHAR(500),
        is_popular BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Unsafe CREATE TABLE OK");
    
    const r2 = await sql`SELECT to_regclass('service_package') as exists`;
    console.log('service_package after unsafe:', r2[0].exists);
  }
}

main();