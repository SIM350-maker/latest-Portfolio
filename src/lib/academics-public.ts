/**
 * Server-side Academic Data Access Layer
 * Public queries with publication/visibility filtering
 * Used by Server Components (RSC) for public pages
 */

import { query } from "@/lib/db";

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

export interface AcademicMetrics {
  totalSemesters: number;
  totalUnits: number;
  completedUnits: number; // Pass units (excludes Supplementary)
  supplementaryUnits: number;
  totalCredits: number;
  gradeDistribution: Record<string, number>;
}

/**
 * Get all published qualifications (public API)
 */
export async function getPublishedQualifications(): Promise<AcademicQualification[]> {
  return query<AcademicQualification>(
    `SELECT * FROM academic_qualification
     WHERE publication_status = 'Published' AND visibility = 'Public'
     ORDER BY display_order ASC, start_date DESC`,
    []
  );
}

/**
 * Get a single published qualification by ID
 */
export async function getPublishedQualification(id: number): Promise<AcademicQualification | null> {
  const rows = await query<AcademicQualification>(
    `SELECT * FROM academic_qualification
     WHERE id = $1 AND publication_status = 'Published' AND visibility = 'Public'
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Get published periods for a qualification
 * Periods are visible if their parent qualification is published and public
 */
export async function getPublishedPeriods(qualificationId: number): Promise<AcademicPeriod[]> {
  return query<AcademicPeriod>(
    `SELECT p.* FROM academic_period p
     JOIN academic_qualification q ON p.qualification_id = q.id
     WHERE p.qualification_id = $1
       AND q.publication_status = 'Published' AND q.visibility = 'Public'
     ORDER BY p.display_order ASC`,
    [qualificationId]
  );
}

/**
 * Get published semesters for a qualification
 * Semesters are visible if their parent qualification is published and public
 */
export async function getPublishedSemesters(qualificationId: number): Promise<AcademicSemester[]> {
  return query<AcademicSemester>(
    `SELECT s.* FROM academic_semester s
     JOIN academic_qualification q ON s.qualification_id = q.id
     WHERE s.qualification_id = $1
       AND q.publication_status = 'Published' AND q.visibility = 'Public'
       AND s.publication_status = 'Published' AND s.visibility = 'Public'
     ORDER BY s.display_order ASC`,
    [qualificationId]
  );
}

/**
 * Get published semesters grouped by period for a qualification
 */
export async function getPublishedSemestersByPeriod(qualificationId: number): Promise<Map<number, AcademicSemester[]>> {
  const semesters = await getPublishedSemesters(qualificationId);
  const byPeriod = new Map<number, AcademicSemester[]>();
  for (const s of semesters) {
    if (!byPeriod.has(s.period_id)) byPeriod.set(s.period_id, []);
    byPeriod.get(s.period_id)!.push(s);
  }
  return byPeriod;
}

/**
 * Get published units for a semester
 */
export async function getPublishedUnits(semesterId: number): Promise<AcademicUnit[]> {
  return query<AcademicUnit>(
    `SELECT * FROM academic_unit
     WHERE semester_id = $1
       AND publication_status = 'Published' AND visibility = 'Public'
     ORDER BY display_order ASC`,
    [semesterId]
  );
}

/**
 * Get all published units for a qualification (joined through semesters)
 */
export async function getAllPublishedUnits(qualificationId: number): Promise<AcademicUnit[]> {
  return query<AcademicUnit>(
    `SELECT u.* FROM academic_unit u
     JOIN academic_semester s ON u.semester_id = s.id
     WHERE s.qualification_id = $1
       AND s.publication_status = 'Published' AND s.visibility = 'Public'
       AND u.publication_status = 'Published' AND u.visibility = 'Public'
     ORDER BY s.display_order ASC, u.display_order ASC`,
    [qualificationId]
  );
}

/**
 * Compute academic metrics for a qualification
 * Only includes non-supplementary units in completion count
 */
export async function getAcademicMetrics(qualificationId: number): Promise<AcademicMetrics> {
  const units = await getAllPublishedUnits(qualificationId);
  
  const gradeDist: Record<string, number> = {};
  let totalCredits = 0;
  let completedUnits = 0;
  let supplementaryUnits = 0;
  
  for (const u of units) {
    if (u.grade) {
      gradeDist[u.grade] = (gradeDist[u.grade] || 0) + 1;
    }
    if (u.credit_hours) {
      totalCredits += Number(u.credit_hours);
    }
    if (u.result_status === 'Supplementary') {
      supplementaryUnits++;
    } else {
      completedUnits++;
    }
  }
  
  const semesters = await getPublishedSemesters(qualificationId);
  
  return {
    totalSemesters: semesters.length,
    totalUnits: units.length,
    completedUnits,
    supplementaryUnits,
    totalCredits,
    gradeDistribution: gradeDist,
  };
}

/**
 * Get semester with its units (for public page rendering)
 */
export async function getSemesterWithUnits(semesterId: number): Promise<{
  semester: AcademicSemester | null;
  units: AcademicUnit[];
}> {
  const semesterRows = await query<AcademicSemester>(
    `SELECT * FROM academic_semester
     WHERE id = $1 AND publication_status = 'Published' AND visibility = 'Public'
     LIMIT 1`,
    [semesterId]
  );
  
  if (semesterRows.length === 0) {
    return { semester: null, units: [] };
  }
  
  const units = await getPublishedUnits(semesterId);
  return { semester: semesterRows[0], units };
}

/**
 * Search units by code or title (public)
 */
export async function searchUnits(qualificationId: number, searchTerm: string): Promise<AcademicUnit[]> {
  const term = `%${searchTerm.toLowerCase()}%`;
  return query<AcademicUnit>(
    `SELECT u.* FROM academic_unit u
     JOIN academic_semester s ON u.semester_id = s.id
     WHERE s.qualification_id = $1
       AND s.publication_status = 'Published' AND s.visibility = 'Public'
       AND u.publication_status = 'Published' AND u.visibility = 'Public'
       AND (LOWER(u.unit_code) LIKE $2 OR LOWER(u.unit_title) LIKE $2)
     ORDER BY s.display_order ASC, u.display_order ASC`,
    [qualificationId, term]
  );
}

/**
 * Filter units by grade (public)
 */
export async function filterUnitsByGrade(qualificationId: number, grade: string): Promise<AcademicUnit[]> {
  return query<AcademicUnit>(
    `SELECT u.* FROM academic_unit u
     JOIN academic_semester s ON u.semester_id = s.id
     WHERE s.qualification_id = $1
       AND s.publication_status = 'Published' AND s.visibility = 'Public'
       AND u.publication_status = 'Published' AND u.visibility = 'Public'
       AND u.grade = $2
     ORDER BY s.display_order ASC, u.display_order ASC`,
    [qualificationId, grade]
  );
}