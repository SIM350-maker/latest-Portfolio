# Data Model Documentation

## Overview
This document describes the database schema for the Academics & Certifications subsystem.

## Tables

### 1. academic_qualification
Degree programmes (e.g., BSc Applied Computer Science at Chuka University).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique identifier |
| title | TEXT | NOT NULL | Degree title |
| institution | TEXT | NOT NULL | Institution name |
| faculty | TEXT | | Faculty name |
| department | TEXT | | Department name |
| field_of_study | TEXT | | Field of study |
| description | TEXT | | Detailed description |
| start_date | TEXT | | Programme start (YYYY-MM) |
| end_date | TEXT | | Programme end (YYYY-MM) |
| qualification_status | TEXT | DEFAULT 'Completed' | Status (Completed, In Progress, etc.) |
| display_order | INT | DEFAULT 0 | Display ordering |
| publication_status | TEXT | DEFAULT 'Draft' | Draft / Published / Archived |
| visibility | TEXT | DEFAULT 'Private' | Public / Private / Restricted |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:** Primary key on `id`

### 2. academic_period
Academic years (e.g., "2022/2023").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique identifier |
| qualification_id | BIGINT | NOT NULL, FK → academic_qualification.id | Parent qualification |
| label | TEXT | NOT NULL | Year label (e.g., "2022/2023") |
| start_date | TEXT | | Period start |
| end_date | TEXT | | Period end |
| display_order | INT | DEFAULT 0 | Display ordering |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:** Primary key on `id`, FK index on `qualification_id`

### 3. academic_semester
Semesters within periods (e.g., "Y1S1-SEM1-22/23").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique identifier |
| period_id | BIGINT | NOT NULL, FK → academic_period.id | Parent period |
| qualification_id | BIGINT | NOT NULL, FK → academic_qualification.id | Parent qualification |
| source_label | TEXT | NOT NULL | Original label from source |
| semester_number | INT | | Sequential number (1, 2, ...) |
| academic_year_label | TEXT | | Year label for display |
| start_date | TEXT | | Semester start |
| end_date | TEXT | | Semester end |
| display_order | INT | DEFAULT 0 | Display ordering |
| publication_status | TEXT | DEFAULT 'Draft' | Draft / Published / Archived |
| visibility | TEXT | DEFAULT 'Private' | Public / Private / Restricted |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:** Primary key on `id`, FK indexes on `period_id`, `qualification_id`, unique constraint on `(qualification_id, source_label)`

### 4. academic_unit
Individual course units with grades.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique identifier |
| semester_id | BIGINT | NOT NULL, FK → academic_semester.id | Parent semester |
| unit_code | TEXT | NOT NULL | Unit code (e.g., "ACSC 101") |
| unit_title | TEXT | NOT NULL | Unit title |
| credit_hours | NUMERIC(6,2) | | Credit value (45, 52.5, 90, etc.) |
| grade | TEXT | | Letter grade (A, B, C, D) |
| result_status | TEXT | | Pass / Supplementary |
| source_reference | TEXT | | Original markdown row for traceability |
| source_managed | BOOLEAN | DEFAULT TRUE | Whether seed script manages this row |
| display_order | INT | DEFAULT 0 | Display ordering |
| publication_status | TEXT | DEFAULT 'Draft' | Draft / Published / Archived |
| visibility | TEXT | DEFAULT 'Private' | Public / Private / Restricted |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:** Primary key on `id`, FK index on `semester_id`, unique constraint on `(semester_id, unit_code)`, composite index on `(publication_status, visibility)` for public queries

### 5. certifications (existing, enhanced)
Professional certifications and credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique identifier |
| person_id | BIGINT | FK → profile.id | Owner profile |
| title | TEXT | NOT NULL | Credential title |
| issuer | TEXT | | Issuing organization |
| category | TEXT | DEFAULT 'Certification' | Category grouping |
| issue_date | TEXT | | Issue date |
| credential_id | TEXT | | External credential ID |
| credential_url | TEXT | | Verification URL |
| file_url | TEXT | | Local PDF path |
| verification_status | TEXT | DEFAULT 'VERIFIED' | Verification status |
| skills | JSONB | DEFAULT '[]' | Associated skills |
| is_visible | BOOLEAN | DEFAULT TRUE | Public visibility |
| is_posted | BOOLEAN | DEFAULT TRUE | Publication status |
| display_order | INT | DEFAULT 0 | Display ordering |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

## Relationships

```
academic_qualification (1) ──< (N) academic_period
academic_period (1) ──< (N) academic_semester
academic_qualification (1) ──< (N) academic_semester (direct)
academic_semester (1) ──< (N) academic_unit
```

## Publication & Visibility Rules

Three independent dimensions control what appears publicly:

1. **publication_status**: `Draft` → `Published` → `Archived`
2. **visibility**: `Public` | `Private` | `Restricted`
3. **evidence_access** (for documents): `Available` | `Unavailable` | `Restricted`

**Inheritance**: Child records cannot be more visible than their parent.
- If qualification is `Draft`/`Private`, all periods/semesters/units are hidden.
- If period is `Draft`/`Private`, all its semesters/units are hidden.
- If semester is `Draft`/`Private`, all its units are hidden.

**Public queries** must filter: `WHERE publication_status = 'Published' AND visibility = 'Public'`

## Triggers

All tables have:
- `updated_at` trigger (reuses `set_updated_at()` function)
- Audit trigger (reuses `fn_audit_row()` function)

## Source Data Traceability

- `academic_unit.source_reference`: Stores the original markdown row
- `academic_unit.source_managed`: When `TRUE`, seed script can overwrite; when `FALSE`, owner edits are preserved
- Import reconciliation report stored in `docs/academics-certifications/IMPORT-RECONCILIATION.md`