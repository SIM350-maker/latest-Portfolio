# Academics & Certifications Subsystem — Implementation Plan

**Repository:** `site` (Next.js 16.4.2, App Router, Neon PostgreSQL, Tailwind v4)
**Date:** 2026-10-20
**Author:** Kilo (Principal Engineer)

---

## 0. Executive Summary

This plan details the complete re-engineering of the Academics and Certifications subsystem — public pages, CMS management, database schema, and data import from `src/results.md`. The current implementation stores only a single "education" row per degree (Chuka University + a placeholder State University), losing the semester-by-semester, unit-level granularity that `results.md` contains (8 semesters, ~45 units, grades, credits). The certifications table exists but is disconnected from academic structure.

**Goal:** Transform into a premium, evidence-driven, recruiter-oriented experience with full CMS control and zero data loss from the authoritative source (`src/results.md`).

---

## 1. Repository Findings (Stage 1 Complete)

### 1.1 Stack & Architecture

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.4.2 (App Router, Server Components by default) |
| Database | Neon PostgreSQL (serverless), `neon` driver via `sql.query()` |
| ORM | None (raw SQL via tagged templates / `sql.query()`) |
| Auth | JWT in httpOnly cookie (`cms_session_token`), HS256, 7-day expiry |
| Roles | `cms_users` table: `owner` (can_manage_access), future `admin` |
| Styling | Tailwind v4 (CSS-first), custom design tokens in `globals.css` |
| Fonts | Inter + JetBrains Mono (Google Fonts) |
| Icons | Lucide React |
| TypeScript | Strict mode, path aliases `@/*` |
| Scripts | `npm run dev`, `build`, `start`, `lint` |

### 1.2 Current Database Schema (Relevant Tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `education` | Degree-level records (2 rows) | `id`, `institution`, `degree`, `field_of_study`, `start_date`, `end_date`, `grade`, `description`, `skills`, `document_url`, `is_visible`, `is_posted`, `display_order` |
| `certifications` | Professional credentials (7 rows) | `id`, `person_id`, `title`, `issuer`, `category`, `issue_date`, `credential_id`, `file_url`, `verification_status`, `skills`, `is_visible`, `is_posted`, `display_order` |
| `cms_users` | Auth | `id`, `email`, `password_hash`, `role`, `is_authorized`, `can_manage_access` |

**Missing:** Semester table, Academic Unit table, Qualification grouping, Publication/visibility hierarchy, Academic-year grouping.

### 1.3 Current Public Pages

| Route | Component | Data Source | Notes |
|-------|-----------|-------------|-------|
| `/education` | `src/app/education/page.tsx` (Client) | `/api/education`, `/api/certifications` | Tabbed UI: "Academic Degrees" + "Professional Certifications" |
| `/certifications` | `src/app/certifications/page.tsx` (Client) | Same APIs | Duplicate education section + category filter for certs |
| `/manage/education` | `src/app/manage/education/page.tsx` (Client) | `/api/education?all=true`, `/api/certifications?all=true` | Full CRUD modals, toggles, PDF preview |

**Issues:** 
- Client Components for data fetching (should be Server Components)
- No semester/unit granularity
- `results.md` not imported
- Education table only stores degree-level summary
- Redirect `/education → /certifications` in `next.config.ts` is confusing

### 1.4 Source Data: `src/results.md`

**Structure:** Markdown table with 8 semester sections (Y1S1 through Y4S2), each with a header row and unit rows (code, title, credits, grade).

**Extraction Inventory:**

| Semester | Label | Units | Credits Total | Notes |
|----------|-------|-------|---------------|-------|
| Y1S1-SEM1-22/23 | Year 1 Semester 1 | 6 | 270 | All 45 credits |
| Y1S2-SEM2-22/23 | Year 1 Semester 2 | 5 + 2 merged | 322.5 | PHYS 131 (52.5), MATH 141 (45) marked with `>` (supplementary?) |
| Y2S1-SEM1-23/24 | Year 2 Semester 1 | 5 + 1 merged | 270 | MATH 241 merged |
| Y2S2-SEM2-23/24 | Year 2 Semester 2 | 6 | 270 | |
| Y3S1-SEM1-24/25 | Year 3 Semester 1 | 6 | 270 | |
| Y3S2-SEM2-24/25 | Year 3 Semester 2 | 6 | 270 | |
| Y4S1-SEM1-25/26 | Year 4 Semester 1 | 8 | 390 | ACSC 385 = 90 credits (Industrial Attachment) |
| Y4S2-SEM2-25/26 | Year 4 Semester 2 | 6 | 270 | |

**Totals:** 45 units (including merged), 2,227.5 credits, grades A–D.

**Ambiguities:**
- `>` prefix on PHYS 131, MATH 141, MATH 241 — likely supplementary/retake units
- No explicit academic year boundaries beyond semester labels
- No qualification title in source (inferred: BSc Applied Computer Science, Chuka University)
- Credit weights: mostly 45, some 52.5, 90

---

## 2. Design Decisions

### 2.1 Data Model (New Tables)

```sql
-- 1. Academic Qualification (degree programme)
CREATE TABLE academic_qualification (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,                    -- "Bachelor of Science in Applied Computer Science"
  institution TEXT NOT NULL,              -- "Chuka University"
  faculty TEXT,                           -- "Faculty of Science"
  department TEXT,                        -- "Department of Computer Science"
  field_of_study TEXT,                    -- "Applied Computer Science"
  description TEXT,
  start_date TEXT,                        -- "2022-09"
  end_date TEXT,                          -- "2026-04"
  qualification_status TEXT,              -- "Completed", "In Progress"
  display_order INT DEFAULT 0,
  publication_status TEXT DEFAULT 'Draft', -- 'Draft' | 'Published' | 'Archived'
  visibility TEXT DEFAULT 'Private',       -- 'Public' | 'Private' | 'Restricted'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Academic Period (academic year, e.g., "2022/23")
CREATE TABLE academic_period (
  id BIGSERIAL PRIMARY KEY,
  qualification_id BIGINT REFERENCES academic_qualification(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                    -- "2022/23"
  start_date TEXT,
  end_date TEXT,
  display_order INT DEFAULT 0
);

-- 3. Academic Semester (maps to Y1S1, Y1S2, etc.)
CREATE TABLE academic_semester (
  id BIGSERIAL PRIMARY KEY,
  period_id BIGINT REFERENCES academic_period(id) ON DELETE CASCADE,
  qualification_id BIGINT REFERENCES academic_qualification(id) ON DELETE CASCADE,
  source_label TEXT NOT NULL,             -- "Y1S1-SEM1-22/23"
  semester_number INT,                    -- 1, 2, 3...
  academic_year_label TEXT,               -- "2022/23"
  start_date TEXT,
  end_date TEXT,
  display_order INT DEFAULT 0,
  publication_status TEXT DEFAULT 'Draft',
  visibility TEXT DEFAULT 'Private'
);

-- 4. Academic Unit (individual course unit with grade)
CREATE TABLE academic_unit (
  id BIGSERIAL PRIMARY KEY,
  semester_id BIGINT REFERENCES academic_semester(id) ON DELETE CASCADE,
  unit_code TEXT NOT NULL,                -- "ACSC 101"
  unit_title TEXT NOT NULL,               -- "Introduction to Information Technology"
  credit_hours NUMERIC(6,2),              -- 45, 52.5, 90
  grade TEXT,                             -- "A", "B", "C", "D"
  result_status TEXT,                     -- "Pass", "Supplementary", null
  source_reference TEXT,                  -- raw markdown row for traceability
  display_order INT DEFAULT 0,
  publication_status TEXT DEFAULT 'Draft',
  visibility TEXT DEFAULT 'Private',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_academic_unit_semester ON academic_unit(semester_id);
CREATE INDEX idx_academic_unit_code ON academic_unit(unit_code);
CREATE INDEX idx_academic_semester_qual ON academic_semester(qualification_id);
CREATE INDEX idx_academic_period_qual ON academic_period(qualification_id);

-- Trigger for updated_at (reuses existing fn)
CREATE TRIGGER update_academic_qualification_timestamp ...
CREATE TRIGGER update_academic_semester_timestamp ...
CREATE TRIGGER update_academic_unit_timestamp ...
```

**Migration Strategy:**
- Add new tables (no destructive changes to existing `education`/`certifications`)
- Migrate existing `education` row → `academic_qualification` + 1 period + 8 semesters + 45 units
- Keep `education` table for backward compatibility (degrees UI can read from either)
- Deprecate `education` API over time; new public academics page reads from new schema

### 2.2 Publication & Visibility Rules

Three independent dimensions (per Phase 3.3):

| Dimension | Values | Inheritance |
|-----------|--------|-------------|
| `publication_status` | `Draft` → `Published` → `Archived` | Parent unpublished ⇒ children hidden |
| `visibility` | `Public` | `Private` | `Restricted` | Same |
| `evidence_access` | `Available` | `Unavailable` | `Restricted` | Per-document |

**Enforcement:** All server-side queries (public APIs, page components) must filter `WHERE publication_status = 'Published' AND visibility = 'Public'`. Draft previews require authenticated CMS session + explicit preview token.

### 2.3 Public Page Architecture

| Page | Pattern | Data Access |
|------|---------|-------------|
| `/academics` (new) | Server Component (RSC) | Direct DB query via `query()` in async component |
| `/certifications` (enhance) | Server Component | Direct DB query |
| `/manage/academics` (replace `/manage/education`) | Client Component (CMS) | `/api/academics/*` routes |

**Server Components by default** — only interactive filters/modals are Client Components.

### 2.4 Import / Seed Strategy

**Script:** `scripts/seed-academics.ts` (new)

1. Parse `src/results.md` → structured JSON
2. Validate every row (required: unit_code, unit_title, grade)
3. Upsert qualification → periods → semesters → units
4. Use transaction for atomicity
5. Reconcile: count source rows vs. DB rows, report gaps
6. Idempotent: natural key `(semester.source_label, unit_code)` prevents duplicates
7. Preserve owner edits: only `source_managed` fields overwritten on re-seed (`unit_code`, `unit_title`, `credit_hours`, `grade`, `result_status`); owner-managed fields (`description`, `display_order`, `publication_status`, `visibility`) untouched

**Reconciliation Report:** `docs/academics-certifications/IMPORT-RECONCILIATION.md`

---

## 3. Implementation Phases

### Stage 1 — Discovery & Audit ✅ COMPLETE

- [x] Repository structure, stack, DB schema, auth, existing pages, CMS, `results.md` parsed
- [x] Baseline: `npx tsc --noEmit` passes, `npm run lint` has pre-existing errors only

### Stage 2 — Academic Data Extraction ✅ COMPLETE (Inventory Above)

- [x] Full `results.md` read, 45 units extracted, 8 semesters identified, ambiguities documented

### Stage 3 — Database Schema & Migration (IN PROGRESS)

**Tasks:**
1. Create migration file: `scripts/migrate-academics.ts` (or SQL in seed script)
2. Add 4 new tables with FKs, indexes, triggers
3. Add `source_managed` boolean column to `academic_unit` to protect owner edits
4. Run against dev DB, verify

### Stage 4 — Seed Script & Reconciliation

**Tasks:**
1. Write `scripts/seed-academics.ts`
2. Parse markdown → structured data
3. Upsert qualification (Chuka University, BSc Applied Computer Science)
4. Create 4 academic periods (2022/23, 2023/24, 2024/25, 2025/26)
5. Create 8 semesters linked to periods
6. Insert 45 units with grades, credits, `result_status` ('Supplementary' for `>` rows)
7. Output reconciliation counts
8. Verify idempotency (run twice)

### Stage 5 — Server-Side Data Access & Publication Rules

**Files:**
- `src/lib/academics.ts` — repository functions (Server-only)
- `src/lib/academics-public.ts` — public queries with publication filters
- `src/app/api/academics/route.ts` — public API (optional, if needed for client components)
- `src/app/api/manage/academics/route.ts` — CMS CRUD API

**Functions:**
```ts
// Public (Server Component)
async function getPublishedQualifications()
async function getPublishedSemesters(qualificationId)
async function getPublishedUnits(semesterId)
async function getAcademicMetrics(qualificationId) // counts, averages (documented formula)

// CMS (authenticated)
async function createQualification(data)
async function updateQualification(id, data)
async function createSemester(qualificationId, data)
async function upsertUnit(semesterId, data)
async function deleteUnit(id)
async function togglePublication(id, status)
```

### Stage 6 — Public Academics Page (`/academics`)

**New Route:** `src/app/academics/page.tsx` (Server Component)

**Sections (per Phase 1.2):**
- A. Academic Profile Header (qualification card)
- B. Academic Overview (metrics cards: semesters, units, completed, avg grade — only if calculable)
- C. Semester Timeline (expandable panels, desktop table, mobile cards)
- D. Relevant Coursework (owner-tagged categories via CMS)
- E. Academic Evidence (transcript PDF, restricted by evidence_access)
- F. Recruiter Usability (search, filter, expand/collapse, print CSS)

**Responsive:** Desktop ≥1024px table; Tablet 768px accordion; Mobile <768px stacked cards.

### Stage 7 — Public Certifications Page (`/certifications`)

**Enhance existing:** Convert to Server Component, add:
- Credential cards with verification links
- Category filter (server-side or client-side)
- Expiry badge (if `expiry_date` added to schema)
- Cross-links to related academics/skills

### Stage 8 — CMS Implementation (`/manage/academics`)

**Replace** `/manage/education` with comprehensive CMS:

| Feature | Implementation |
|---------|----------------|
| Qualification CRUD | Modal form, all fields |
| Period/Semester management | Nested accordion UI, drag-drop reorder |
| Unit CRUD | Inline table edit, bulk import preview |
| Grade editing | Select with source-preserved values |
| Publication controls | Three-state badges, parent-child enforcement |
| Evidence management | Link to existing `/manage/evidence` |
| Preview | "View Public Preview" button → `/academics?preview=true` with signed token |
| Import UI | "Re-import from results.md" button (runs seed, shows diff) |

### Stage 9 — Integration & Polish

- Update Navbar: `/academics` link
- Remove `/education → /certifications` redirect
- Cache invalidation: `revalidatePath('/academics')` after CMS mutations
- Accessibility audit (WCAG 2.2 AA)
- Responsive testing (3 breakpoints)
- Print stylesheet for academic summary

### Stage 10 — Final Verification

| Check | Command |
|-------|---------|
| TypeScript | `npx tsc --noEmit` |
| Lint | `npm run lint` (pre-existing errors acceptable) |
| Build | `npm run build` |
| DB Migration | Run migration, verify tables |
| Seed | Run seed, verify 45 units |
| Public Page | Manual browse `/academics`, `/certifications` |
| CMS | Login, create/edit/publish, verify public visibility |
| Reconciliation | Compare IMPORT-RECONCILIATION counts |

---

## 4. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `>` prefix units (supplementary) misinterpreted | Medium | Data accuracy | Store `result_status = 'Supplementary'`, exclude from completion counts |
| No official GPA/weighting in source | High | Metric credibility | Do NOT calculate GPA; show raw grade distribution only |
| Existing `education` table consumers break | Low | Regression | Keep table, add view/compat layer if needed |
| CMS preview token leakage | Low | Security | Short-lived signed JWT, validate server-side |
| Neon dev DB unavailable | Low | Blocked | Document exact blocker, wait for user confirmation |

---

## 5. Acceptance Criteria (from Master Prompt)

- [ ] Existing portfolio audited before implementation
- [ ] `src/results.md` remains intact
- [ ] Every valid academic record accounted for
- [ ] All 45 course units + grades imported
- [ ] Academic years & semester relationships correct
- [ ] Missing/ambiguous values reported, not fabricated
- [ ] Migrations use existing DB tooling (raw SQL via `neon`)
- [ ] Seed repeatable, no duplicates
- [ ] CMS auth/authorization intact
- [ ] Public Academics page uses DB data
- [ ] Public Certifications page uses credential records
- [ ] Owner manages both via CMS
- [ ] Drafts/restricted never leak to public
- [ ] Parent-child publication enforced
- [ ] Supporting documents respect permissions
- [ ] Premium, accessible, responsive, recruiter-oriented design
- [ ] Academic metrics accurate & transparently calculated
- [ ] Existing routes functional
- [ ] Automated checks executed (TS, lint, build)
- [ ] Verification report reflects actual results

---

## 6. File Map (Planned Changes)

```
docs/academics-certifications/
  IMPLEMENTATION-PLAN.md          (this file)
  DATA-MODEL.md                   (schema docs)
  IMPORT-RECONCILIATION.md        (seed output)
  PUBLICATION-RULES.md            (visibility logic)
  VERIFICATION-REPORT.md          (final)

scripts/
  migrate-academics.ts            (DDL)
  seed-academics.ts               (import + reconcile)

src/
  lib/
    academics.ts                  (server repo - CMS)
    academics-public.ts           (server repo - public)
  app/
    academics/
      page.tsx                    (NEW: Server Component public page)
    certifications/
      page.tsx                    (ENHANCE: Server Component)
    api/
      academics/
        route.ts                  (public API if needed)
      manage/
        academics/
          route.ts                (CMS CRUD)
          [id]/route.ts
    manage/
      academics/
        page.tsx                  (REPLACE manage/education)
        AcademicsQualificationEditor.tsx
        SemesterManager.tsx
        UnitTable.tsx
```

---

## 7. Open Questions for User

1. **Qualification title:** Confirm "Bachelor of Science in Applied Computer Science" at Chuka University (2022–2026) is correct?
2. **Supplementary units:** Treat `>` rows as `result_status = 'Supplementary'` and exclude from "completed" count?
3. **Grade average:** Do you want an unweighted letter-grade average displayed? (I recommend NOT showing GPA — source has no weights)
4. **Certification expiry:** Add `expiry_date` column to `certifications` table?
5. **Redirect:** Remove `/education → /certifications` redirect in `next.config.ts`?

---

*Proceed to Stage 3 upon confirmation or if no blockers.*