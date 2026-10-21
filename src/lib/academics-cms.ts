/**
 * Server-side Academic Data Access Layer (CMS)
 * Full CRUD with authentication checks
 * Used by API routes for CMS management
 */

import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export interface AcademicQualification {
  id: number;
  title: string;
  institution: string;
  faculty: string | null;
  department: string | null;
  field_of_study: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  qualification_status: string | null;
  display_order: number;
  publication_status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicPeriod {
  id: number;
  qualification_id: number;
  label: string;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AcademicSemester {
  id: number;
  period_id: number;
  qualification_id: number;
  source_label: string;
  semester_number: number | null;
  academic_year_label: string | null;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
  publication_status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicUnit {
  id: number;
  semester_id: number;
  unit_code: string;
  unit_title: string;
  credit_hours: number | null;
  grade: string | null;
  result_status: string | null;
  source_reference: string | null;
  source_managed: boolean;
  display_order: number;
  publication_status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
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
// QUALIFICATION CRUD
// ============================================================

export async function cmsListQualifications(): Promise<AcademicQualification[]> {
  await assertCmsAuth();
  return query<AcademicQualification>(
    `SELECT * FROM academic_qualification ORDER BY display_order ASC, start_date DESC`,
    []
  );
}

export async function cmsGetQualification(id: number): Promise<AcademicQualification | null> {
  await assertCmsAuth();
  const rows = await query<AcademicQualification>(
    `SELECT * FROM academic_qualification WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function cmsCreateQualification(data: {
  title: string;
  institution: string;
  faculty?: string;
  department?: string;
  field_of_study?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  qualification_status?: string;
  display_order?: number;
  publication_status?: string;
  visibility?: string;
}): Promise<AcademicQualification> {
  await assertCmsAuth();
  const result = await query<AcademicQualification>(
    `INSERT INTO academic_qualification (
      title, institution, faculty, department, field_of_study, description,
      start_date, end_date, qualification_status, display_order,
      publication_status, visibility
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      data.title, data.institution, data.faculty || null, data.department || null,
      data.field_of_study || null, data.description || null,
      data.start_date || null, data.end_date || null,
      data.qualification_status || 'Completed',
      data.display_order || 0,
      data.publication_status || 'Draft',
      data.visibility || 'Private'
    ]
  );
  return result[0];
}

export async function cmsUpdateQualification(id: number, data: Partial<AcademicQualification>): Promise<AcademicQualification | null> {
  await assertCmsAuth();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  
  const allowedFields = [
    'title', 'institution', 'faculty', 'department', 'field_of_study',
    'description', 'start_date', 'end_date', 'qualification_status',
    'display_order', 'publication_status', 'visibility'
  ];
  
  for (const field of allowedFields) {
    if (data[field as keyof AcademicQualification] !== undefined) {
      fields.push(`${field} = $${idx++}`);
      values.push(data[field as keyof AcademicQualification]);
    }
  }
  
  if (fields.length === 0) return cmsGetQualification(id);
  
  fields.push(`updated_at = NOW()`);
  values.push(id);
  
  const result = await query<AcademicQualification>(
    `UPDATE academic_qualification SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result[0] || null;
}

export async function cmsDeleteQualification(id: number): Promise<boolean> {
  await assertCmsAuth();
  await query(`DELETE FROM academic_qualification WHERE id = $1`, [id]);
  return true;
}

// ============================================================
// PERIOD CRUD
// ============================================================

export async function cmsListPeriods(qualificationId: number): Promise<AcademicPeriod[]> {
  await assertCmsAuth();
  return query<AcademicPeriod>(
    `SELECT * FROM academic_period WHERE qualification_id = $1 ORDER BY display_order ASC`,
    [qualificationId]
  );
}

export async function cmsGetPeriod(id: number): Promise<AcademicPeriod | null> {
  await assertCmsAuth();
  const rows = await query<AcademicPeriod>(`SELECT * FROM academic_period WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function cmsCreatePeriod(data: {
  qualification_id: number;
  label: string;
  start_date?: string;
  end_date?: string;
  display_order?: number;
}): Promise<AcademicPeriod> {
  await assertCmsAuth();
  const result = await query<AcademicPeriod>(
    `INSERT INTO academic_period (qualification_id, label, start_date, end_date, display_order)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.qualification_id, data.label, data.start_date || null, data.end_date || null, data.display_order || 0]
  );
  return result[0];
}

export async function cmsUpdatePeriod(id: number, data: Partial<AcademicPeriod>): Promise<AcademicPeriod | null> {
  await assertCmsAuth();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  
  const allowedFields = ['label', 'start_date', 'end_date', 'display_order'];
  for (const field of allowedFields) {
    if (data[field as keyof AcademicPeriod] !== undefined) {
      fields.push(`${field} = $${idx++}`);
      values.push(data[field as keyof AcademicPeriod]);
    }
  }
  
  if (fields.length === 0) {
    const rows = await query<AcademicPeriod>(`SELECT * FROM academic_period WHERE id = $1 LIMIT 1`, [id]);
    return rows[0] || null;
  }
  
  fields.push(`updated_at = NOW()`);
  values.push(id);
  
  const result = await query<AcademicPeriod>(
    `UPDATE academic_period SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result[0] || null;
}

export async function cmsDeletePeriod(id: number): Promise<boolean> {
  await assertCmsAuth();
  await query(`DELETE FROM academic_period WHERE id = $1`, [id]);
  return true;
}

// ============================================================
// SEMESTER CRUD
// ============================================================

export async function cmsListSemesters(qualificationId: number): Promise<AcademicSemester[]> {
  await assertCmsAuth();
  return query<AcademicSemester>(
    `SELECT * FROM academic_semester WHERE qualification_id = $1 ORDER BY display_order ASC`,
    [qualificationId]
  );
}

export async function cmsGetSemester(id: number): Promise<AcademicSemester | null> {
  await assertCmsAuth();
  const rows = await query<AcademicSemester>(`SELECT * FROM academic_semester WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function cmsCreateSemester(data: {
  period_id: number;
  qualification_id: number;
  source_label: string;
  semester_number?: number;
  academic_year_label?: string;
  start_date?: string;
  end_date?: string;
  display_order?: number;
  publication_status?: string;
  visibility?: string;
}): Promise<AcademicSemester> {
  await assertCmsAuth();
  const result = await query<AcademicSemester>(
    `INSERT INTO academic_semester (
      period_id, qualification_id, source_label, semester_number,
      academic_year_label, start_date, end_date, display_order,
      publication_status, visibility
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      data.period_id, data.qualification_id, data.source_label,
      data.semester_number || null, data.academic_year_label || null,
      data.start_date || null, data.end_date || null,
      data.display_order || 0,
      data.publication_status || 'Draft',
      data.visibility || 'Private'
    ]
  );
  return result[0];
}

export async function cmsUpdateSemester(id: number, data: Partial<AcademicSemester>): Promise<AcademicSemester | null> {
  await assertCmsAuth();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  
  const allowedFields = [
    'period_id', 'source_label', 'semester_number', 'academic_year_label',
    'start_date', 'end_date', 'display_order', 'publication_status', 'visibility'
  ];
  for (const field of allowedFields) {
    if (data[field as keyof AcademicSemester] !== undefined) {
      fields.push(`${field} = $${idx++}`);
      values.push(data[field as keyof AcademicSemester]);
    }
  }
  
  if (fields.length === 0) return cmsGetSemester(id);
  
  fields.push(`updated_at = NOW()`);
  values.push(id);
  
  const result = await query<AcademicSemester>(
    `UPDATE academic_semester SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result[0] || null;
}

export async function cmsDeleteSemester(id: number): Promise<boolean> {
  await assertCmsAuth();
  await query(`DELETE FROM academic_semester WHERE id = $1`, [id]);
  return true;
}

// ============================================================
// UNIT CRUD
// ============================================================

export async function cmsListUnits(semesterId: number): Promise<AcademicUnit[]> {
  await assertCmsAuth();
  return query<AcademicUnit>(
    `SELECT * FROM academic_unit WHERE semester_id = $1 ORDER BY display_order ASC`,
    [semesterId]
  );
}

export async function cmsGetUnit(id: number): Promise<AcademicUnit | null> {
  await assertCmsAuth();
  const rows = await query<AcademicUnit>(`SELECT * FROM academic_unit WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function cmsCreateUnit(data: {
  semester_id: number;
  unit_code: string;
  unit_title: string;
  credit_hours?: number;
  grade?: string;
  result_status?: string;
  source_reference?: string;
  source_managed?: boolean;
  display_order?: number;
  publication_status?: string;
  visibility?: string;
}): Promise<AcademicUnit> {
  await assertCmsAuth();
  const result = await query<AcademicUnit>(
    `INSERT INTO academic_unit (
      semester_id, unit_code, unit_title, credit_hours, grade,
      result_status, source_reference, source_managed, display_order,
      publication_status, visibility
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      data.semester_id, data.unit_code, data.unit_title,
      data.credit_hours || null, data.grade || null,
      data.result_status || null, data.source_reference || null,
      data.source_managed ?? true, data.display_order || 0,
      data.publication_status || 'Draft', data.visibility || 'Private'
    ]
  );
  return result[0];
}

export async function cmsUpdateUnit(id: number, data: Partial<AcademicUnit>): Promise<AcademicUnit | null> {
  await assertCmsAuth();
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
  
  const allowedFields = [
    'semester_id', 'unit_code', 'unit_title', 'credit_hours', 'grade',
    'result_status', 'source_reference', 'source_managed', 'display_order',
    'publication_status', 'visibility'
  ];
  for (const field of allowedFields) {
    if (data[field as keyof AcademicUnit] !== undefined) {
      fields.push(`${field} = $${idx++}`);
      values.push(data[field as keyof AcademicUnit]);
    }
  }
  
  if (fields.length === 0) return cmsGetUnit(id);
  
  fields.push(`updated_at = NOW()`);
  values.push(id);
  
  const result = await query<AcademicUnit>(
    `UPDATE academic_unit SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result[0] || null;
}

export async function cmsDeleteUnit(id: number): Promise<boolean> {
  await assertCmsAuth();
  await query(`DELETE FROM academic_unit WHERE id = $1`, [id]);
  return true;
}

// ============================================================
// BULK OPERATIONS
// ============================================================

export async function cmsBulkUpdateUnitPublication(unitIds: number[], publicationStatus: string, visibility: string): Promise<number> {
  await assertCmsAuth();
  const placeholders = unitIds.map((_, i) => `$${i + 1}`).join(",");
  const result = await query(
    `UPDATE academic_unit SET publication_status = $${unitIds.length + 1}, visibility = $${unitIds.length + 2}, updated_at = NOW() WHERE id IN (${placeholders})`,
    [...unitIds, publicationStatus, visibility]
  );
  return result.length;
}

export async function cmsReorderUnits(updates: Array<{ id: number; display_order: number }>): Promise<void> {
  await assertCmsAuth();
  for (const u of updates) {
    await query(`UPDATE academic_unit SET display_order = $1, updated_at = NOW() WHERE id = $2`, [u.display_order, u.id]);
  }
}

export async function cmsReorderSemesters(updates: Array<{ id: number; display_order: number }>): Promise<void> {
  await assertCmsAuth();
  for (const u of updates) {
    await query(`UPDATE academic_semester SET display_order = $1, updated_at = NOW() WHERE id = $2`, [u.display_order, u.id]);
  }
}

export async function cmsReorderPeriods(updates: Array<{ id: number; display_order: number }>): Promise<void> {
  await assertCmsAuth();
  for (const u of updates) {
    await query(`UPDATE academic_period SET display_order = $1, updated_at = NOW() WHERE id = $2`, [u.display_order, u.id]);
  }
}