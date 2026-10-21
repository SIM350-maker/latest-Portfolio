/**
 * Server-side Services Data Access Layer (CMS)
 * Full CRUD with authentication checks
 * Used by API routes for CMS management
 */

import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export interface ServiceCategory {
  id: number;
  title: string;
  slug: string;
  icon: string;
  description: string;
  long_description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicePackage {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price_kes: number;
  currency: string;
  billing_cycle: "one_time" | "monthly" | "quarterly" | "yearly";
  features: string[];
  highlights: string[];
  cta_text: string;
  cta_url: string | null;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceFeature {
  id: number;
  category_id: number;
  title: string;
  description: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

export interface ServiceDeliverable {
  id: number;
  category_id: number;
  title: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

export interface ServiceTechnology {
  id: number;
  category_id: number;
  name: string;
  logo_url: string | null;
  display_order: number;
  is_active: boolean;
}

export interface EngagementModel {
  id: number;
  title: string;
  slug: string;
  description: string;
  features: string[];
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

export interface PricingFAQ {
  id: number;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

// ============================================================
// AUTHENTICATION HELPER
// ============================================================

async function assertCmsAuth(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
}

// ============================================================
// CATEGORY CRUD
// ============================================================

export async function cmsListCategories(): Promise<ServiceCategory[]> {
  await assertCmsAuth();
  return query<ServiceCategory>(
    `SELECT * FROM service_category WHERE is_active = true ORDER BY display_order ASC, title ASC`,
    []
  );
}

export async function cmsGetCategory(id: number): Promise<ServiceCategory | null> {
  await assertCmsAuth();
  const rows = await query<ServiceCategory>(
    `SELECT * FROM service_category WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function cmsGetCategoryBySlug(slug: string): Promise<ServiceCategory | null> {
  await assertCmsAuth();
  const rows = await query<ServiceCategory>(
    `SELECT * FROM service_category WHERE slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

export async function cmsCreateCategory(input: {
  title: string;
  slug: string;
  icon: string;
  description: string;
  long_description?: string;
  display_order?: number;
}): Promise<ServiceCategory> {
  await assertCmsAuth();
  const rows = await query<ServiceCategory>(
    `INSERT INTO service_category (title, slug, icon, description, long_description, display_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING *`,
    [input.title, input.slug, input.icon, input.description, input.long_description || null, input.display_order || 0]
  );
  return rows[0];
}

export async function cmsUpdateCategory(id: number, input: Partial<{
  title: string;
  slug: string;
  icon: string;
  description: string;
  long_description: string | null;
  display_order: number;
  is_active: boolean;
}>): Promise<ServiceCategory | null> {
  await assertCmsAuth();
  const set: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      set.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (set.length === 0) return null;

  set.push(`updated_at = NOW()`);
  params.push(id);

  const rows = await query<ServiceCategory>(
    `UPDATE service_category SET ${set.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return rows[0] || null;
}

export async function cmsDeleteCategory(id: number): Promise<void> {
  await assertCmsAuth();
  await query(`DELETE FROM service_category WHERE id = $1`, [id]);
}

// ============================================================
// PACKAGE CRUD
// ============================================================

export async function cmsListPackages(categoryId?: number): Promise<ServicePackage[]> {
  await assertCmsAuth();
  const where = categoryId ? `WHERE category_id = $1 AND is_active = true` : `WHERE is_active = true`;
  const params = categoryId ? [categoryId] : [];
  return query<ServicePackage>(
    `SELECT * FROM service_package ${where} ORDER BY display_order ASC, price_kes ASC`,
    params
  );
}

export async function cmsGetPackage(id: number): Promise<ServicePackage | null> {
  await assertCmsAuth();
  const rows = await query<ServicePackage>(
    `SELECT * FROM service_package WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function cmsCreatePackage(input: {
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price_kes: number;
  currency?: string;
  billing_cycle?: "one_time" | "monthly" | "quarterly" | "yearly";
  features: string[];
  highlights?: string[];
  cta_text?: string;
  cta_url?: string | null;
  is_popular?: boolean;
  display_order?: number;
}): Promise<ServicePackage> {
  await assertCmsAuth();
  const rows = await query<ServicePackage>(
    `INSERT INTO service_package (
      category_id, name, slug, description, price_kes, currency, billing_cycle,
      features, highlights, cta_text, cta_url, is_popular, is_active, display_order
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13)
    RETURNING *`,
    [
      input.category_id,
      input.name,
      input.slug,
      input.description,
      input.price_kes,
      input.currency || "KES",
      input.billing_cycle || "one_time",
      input.features,
      input.highlights || [],
      input.cta_text || "Get Started",
      input.cta_url || null,
      input.is_popular || false,
      input.display_order || 0,
    ]
  );
  return rows[0];
}

export async function cmsUpdatePackage(id: number, input: Partial<{
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price_kes: number;
  currency: string;
  billing_cycle: "one_time" | "monthly" | "quarterly" | "yearly";
  features: string[];
  highlights: string[];
  cta_text: string;
  cta_url: string | null;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
}>): Promise<ServicePackage | null> {
  await assertCmsAuth();
  const set: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      set.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (set.length === 0) return null;

  set.push(`updated_at = NOW()`);
  params.push(id);

  const rows = await query<ServicePackage>(
    `UPDATE service_package SET ${set.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return rows[0] || null;
}

export async function cmsDeletePackage(id: number): Promise<void> {
  await assertCmsAuth();
  await query(`DELETE FROM service_package WHERE id = $1`, [id]);
}

// ============================================================
// FEATURE CRUD
// ============================================================

export async function cmsListFeatures(categoryId: number): Promise<ServiceFeature[]> {
  await assertCmsAuth();
  return query<ServiceFeature>(
    `SELECT * FROM service_feature WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC`,
    [categoryId]
  );
}

export async function cmsCreateFeature(input: {
  category_id: number;
  title: string;
  description: string;
  icon?: string | null;
  display_order?: number;
}): Promise<ServiceFeature> {
  await assertCmsAuth();
  const rows = await query<ServiceFeature>(
    `INSERT INTO service_feature (category_id, title, description, icon, display_order, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING *`,
    [input.category_id, input.title, input.description, input.icon || null, input.display_order || 0]
  );
  return rows[0];
}

export async function cmsUpdateFeature(id: number, input: Partial<{
  title: string;
  description: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}>): Promise<ServiceFeature | null> {
  await assertCmsAuth();
  const set: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      set.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (set.length === 0) return null;

  set.push(`updated_at = NOW()`);
  params.push(id);

  const rows = await query<ServiceFeature>(
    `UPDATE service_feature SET ${set.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return rows[0] || null;
}

export async function cmsDeleteFeature(id: number): Promise<void> {
  await assertCmsAuth();
  await query(`DELETE FROM service_feature WHERE id = $1`, [id]);
}

// ============================================================
// DELIVERABLE CRUD
// ============================================================

export async function cmsListDeliverables(categoryId: number): Promise<ServiceDeliverable[]> {
  await assertCmsAuth();
  return query<ServiceDeliverable>(
    `SELECT * FROM service_deliverable WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC`,
    [categoryId]
  );
}

export async function cmsCreateDeliverable(input: {
  category_id: number;
  title: string;
  description?: string | null;
  display_order?: number;
}): Promise<ServiceDeliverable> {
  await assertCmsAuth();
  const rows = await query<ServiceDeliverable>(
    `INSERT INTO service_deliverable (category_id, title, description, display_order, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING *`,
    [input.category_id, input.title, input.description || null, input.display_order || 0]
  );
  return rows[0];
}

// ============================================================
// TECHNOLOGY CRUD
// ============================================================

export async function cmsListTechnologies(categoryId: number): Promise<ServiceTechnology[]> {
  await assertCmsAuth();
  return query<ServiceTechnology>(
    `SELECT * FROM service_technology WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC`,
    [categoryId]
  );
}

export async function cmsCreateTechnology(input: {
  category_id: number;
  name: string;
  logo_url?: string | null;
  display_order?: number;
}): Promise<ServiceTechnology> {
  await assertCmsAuth();
  const rows = await query<ServiceTechnology>(
    `INSERT INTO service_technology (category_id, name, logo_url, display_order, is_active)
     VALUES ($1, $2, $3, $4, true)
     RETURNING *`,
    [input.category_id, input.name, input.logo_url || null, input.display_order || 0]
  );
  return rows[0];
}

// ============================================================
// ENGAGEMENT MODEL CRUD
// ============================================================

export async function cmsListEngagementModels(): Promise<EngagementModel[]> {
  await assertCmsAuth();
  return query<EngagementModel>(
    `SELECT * FROM engagement_model WHERE is_active = true ORDER BY display_order ASC`,
    []
  );
}

export async function cmsCreateEngagementModel(input: {
  title: string;
  slug: string;
  description: string;
  features: string[];
  icon?: string | null;
  display_order?: number;
}): Promise<EngagementModel> {
  await assertCmsAuth();
  const rows = await query<EngagementModel>(
    `INSERT INTO engagement_model (title, slug, description, features, icon, display_order, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING *`,
    [input.title, input.slug, input.description, input.features, input.icon || null, input.display_order || 0]
  );
  return rows[0];
}

// ============================================================
// FAQ CRUD
// ============================================================

export async function cmsListFAQs(): Promise<PricingFAQ[]> {
  await assertCmsAuth();
  return query<PricingFAQ>(
    `SELECT * FROM pricing_faq WHERE is_active = true ORDER BY display_order ASC`,
    []
  );
}

export async function cmsCreateFAQ(input: {
  question: string;
  answer: string;
  display_order?: number;
}): Promise<PricingFAQ> {
  await assertCmsAuth();
  const rows = await query<PricingFAQ>(
    `INSERT INTO pricing_faq (question, answer, display_order, is_active)
     VALUES ($1, $2, $3, true)
     RETURNING *`,
    [input.question, input.answer, input.display_order || 0]
  );
  return rows[0];
}

// ============================================================
// PUBLIC READ API (no auth required)
// ============================================================

export async function publicListCategories(): Promise<ServiceCategory[]> {
  return query<ServiceCategory>(
    `SELECT * FROM service_category WHERE is_active = true ORDER BY display_order ASC, title ASC`,
    []
  );
}

export async function publicGetCategoryWithDetails(slug: string) {
  const category = await query<ServiceCategory>(
    `SELECT * FROM service_category WHERE slug = $1 AND is_active = true LIMIT 1`,
    [slug]
  );
  if (!category[0]) return null;

  const cat = category[0];
  const [packages, features, deliverables, technologies] = await Promise.all([
    query<ServicePackage>(
      `SELECT * FROM service_package WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC, price_kes ASC`,
      [cat.id]
    ),
    query<ServiceFeature>(
      `SELECT * FROM service_feature WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC`,
      [cat.id]
    ),
    query<ServiceDeliverable>(
      `SELECT * FROM service_deliverable WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC`,
      [cat.id]
    ),
    query<ServiceTechnology>(
      `SELECT * FROM service_technology WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC`,
      [cat.id]
    ),
  ]);

  return {
    category: cat,
    packages,
    features,
    deliverables,
    technologies,
  };
}

export async function publicListPackages(categoryId?: number): Promise<ServicePackage[]> {
  if (categoryId) {
    return query<ServicePackage>(
      `SELECT * FROM service_package WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC, price_kes ASC`,
      [categoryId]
    );
  }
  return query<ServicePackage>(
    `SELECT * FROM service_package WHERE is_active = true ORDER BY category_id ASC, display_order ASC, price_kes ASC`,
    []
  );
}

export async function publicListEngagementModels(): Promise<EngagementModel[]> {
  return query<EngagementModel>(
    `SELECT * FROM engagement_model WHERE is_active = true ORDER BY display_order ASC`,
    []
  );
}

export async function publicListFAQs(): Promise<PricingFAQ[]> {
  return query<PricingFAQ>(
    `SELECT * FROM pricing_faq WHERE is_active = true ORDER BY display_order ASC`,
    []
  );
}

export async function publicGetHomepageData() {
  const [categories, engagementModels, faqs] = await Promise.all([
    publicListCategories(),
    publicListEngagementModels(),
    publicListFAQs(),
  ]);
  return { categories, engagementModels, faqs };
}