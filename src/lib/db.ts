import { neon } from "@neondatabase/serverless";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_P1s3LRXYJoZQ@ep-wild-bread-b5a2u322-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require";

export const sql = neon(databaseUrl);

export async function query<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    const result = await (sql as any)(queryText, params);
    return result as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}
