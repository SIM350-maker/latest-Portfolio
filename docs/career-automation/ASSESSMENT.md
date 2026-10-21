# Career Automation Centre — Phase 0 Engineering Assessment

Date: 2026-10-20 · Branch: `main` · Verified against actual repository files.

## 1. FACTS (discovered, with evidence)

### Stack
- Next.js `16.4.2` (App Router, Turbopack), React `19.3.0`, TypeScript `^5`, Tailwind CSS v4 — `package.json`.
- `next.config.ts` sets `cacheComponents: true` + `partialPrefetching: true`. No rewrites/redirects configured.
- No ORM: raw SQL through `@neondatabase/serverless` via `query()` in `src/lib/db.ts:10`.
  - EVIDENCE: `db.ts` contains a hardcoded `DATABASE_URL` fallback with credentials (pre-existing RISK, out of scope but recorded).
- Migrations: ad-hoc scripts in `scripts/`; a `_migrations(filename, applied_at)` table exists in the live DB (no runner found in repo — UNKNOWN who populated it). Our migrations follow this convention: idempotent DDL + record filename.

### Authentication / authorization
- Custom HMAC-SHA256 session cookie `cms_session_token`, verified by `verifySessionToken()` and re-checked against `cms_users` with `is_authorized = true` — `src/lib/auth.ts:66-110`.
- Mutations guard with `getCurrentUser()` (returns null → 401). No middleware.ts; no role escalation checks beyond `can_manage_access` used only for Access UI.
- DECISION: Career Automation endpoints reuse `getCurrentUser()` guards exactly like `src/app/api/certifications/route.ts:32-35`.

### Database schema (live, dumped via information_schema)
Canonical professional records already exist and are reused (no competing profile DB):
- `profile` (singleton id=1: name, role, summary, email, phone, location, github, linkedin, portfolio…)
- `education`, `experience` (highlights/skills jsonb), `project` (technologies, decisions, key_metrics…), `skill` (+`person_skills`), `certifications` (verification_status, is_visible/is_posted), `claim` (+`claim_evidence`), `evidence` (sha256, access, verification_status), `cv_references`, `recommendations`, `academic_qualification/period/semester/unit`.
- CMS: `cms_users`, `audit_log`, `contact_messages`, `population_warnings`, `_migrations`.
- Absent (must be created): job adverts, applications, requirements, evidence matches, generated documents/versions, packages, delivery attempts, automation settings.

### CMS / UI conventions
- CMS pages: `"use client"` + `<CMSLayout>` wrapper, Tailwind tokens (`surface-container*`, `on-surface*`, `border`, `primary`, `tertiary`), `font-mono` labels, lucide-react icons, raw `fetch`, inline banner feedback (no toast lib), `confirm()` for destructive ops — e.g. `src/app/manage/page.tsx`, `src/app/manage/academics/page.tsx`.
- Sidebar nav groups in `src/components/CMSLayout.tsx:89-124` (Career Automation entries must be added here).
- Dynamic route params are Promises: `params: Promise<{id:string}>` — `src/app/api/manage/academics/[id]/route.ts:21-28`.
- Public Qualifications page: client page `/qualifications` → `/api/academics` (publication-filtered) + `/api/certifications`.

### Qualifications publication (Feature I baseline)
- `academic_qualification/semester/unit` have `publication_status ∈ {Draft, Published, Archived}` and `visibility ∈ {Private, Public, Restricted}`; certifications use `is_visible/is_posted` booleans.
- Public SQL filters `publication_status='Published' AND visibility='Public'` — `src/lib/academics-public.ts:86,98,123,149…`. EVIDENCE: public semester/unit queries do NOT check the parent qualification (doc `PUBLICATION-RULES.md:56-68` claims they do) — GAP to close.
- CMS academics page shows publication badges but has **no wired publish/unpublish controls for qualifications/semesters/units** (edit modal state exists but no modal renders) — `src/app/manage/academics/page.tsx` (explore report). GAP for Feature I.
- No `revalidatePath/revalidateTag` anywhere (public page is fully client-fetched `cache:"no-store"`) — DECISION: public reads stay dynamic; we add explicit `revalidatePath("/qualifications")` on publication mutations as defense-in-depth (harmless for client fetches, correct if the page later becomes a server component).

### Integrations
- FACT: no AI, OCR, PDF, or email integration exists anywhere in the repo (grep: `openai|resend|nodemailer|smtp|tesseract|pdf-parse|ocr` → 0 code hits).
- Env available: `DATABASE_URL`, `VERCEL_OIDC_TOKEN` only (`.env.local`).

## 2. Baseline verification results (recorded before any change)
| Check | Command | Outcome |
|---|---|---|
| Type check | `npx tsc --noEmit` | PASS (exit 0) |
| Lint | `npm run lint` | **FAIL — 220 pre-existing problems (85 errors, 135 warnings)** in existing files (baseline, not ours) |
| Production build | `npm run build` | PASS (exit 0) |
| CI | `.github/workflows/ci.yml` | runs `npm ci` + `npm run build` only |

## 3. RISK register
- R1: No AI/email/OCR credentials in env → implement provider boundaries + config status UI; verify with mocks; report required config. Never fabricate external success.
- R2: Pre-existing lint debt (85 errors) → new code must be lint-clean; do not "fix" unrelated files.
- R3: Hardcoded DB credentials in `src/lib/db.ts` and CI fallback → recorded, not modified (changing it risks breaking deployments; flagged in final report).
- R4: `cacheComponents: true` → server components reading cookies need Suspense/dynamic handling; we keep new CMS pages client-rendered (consistent with existing CMS) and route handlers dynamic.
- R5: Uploaded adverts contain recruiter PII → stored server-side only (private `bytea` ≤5 MB + extracted text), never exposed through public routes.
- R6: Scanned/image PDFs cannot be rasterized without heavy deps → OCR boundary: image OCR via configured AI vision provider, else explicit "OCR not configured → paste text" path (documented limitation).

## 4. DECISIONS
- D1: **Zero new runtime dependencies.** Pure-TS implementations: PDF text extractor (Node `zlib` FlateDecode + text operators), PDF writer (multi-page, selectable text, Helvetica/WinAnsi), Word-compatible `.doc` HTML export, `.txt` export, hand-rolled validators. Rationale: minimal-install rule in brain §4.2; all are well-specified formats; ATS requirement favors selectable text.
- D2: Vacancy analysis = deterministic rule-based parser (always available) + optional AI enrichment through a provider interface (`AI_PROVIDER`/`OPENAI_API_KEY`/`OPENAI_BASE_URL`/`OPENAI_MODEL`, OpenAI-compatible `/chat/completions` via `fetch`).
- D3: Email = provider abstraction: `console` (default, clearly labelled test mode, records real attempt rows with `SIMULATED` status) + `resend` (real HTTP API when `RESEND_API_KEY` set). Idempotency key unique index + rate limit + retry classification.
- D4: Tests use Node's built-in `node:test` runner via `tsx` (no new dev dependency) — unit + integration (live DB in *new tables only*) + route-handler-level workflow tests as E2E substitute (Playwright not installable within scope; documented).
- D5: Reuse `audit_log` table for audit events (extend existing model, don't create `AuditEvent`).
- D6: Domain tables created by `scripts/migrate-career.ts` (idempotent, records into `_migrations`), preserving all existing rows; no destructive SQL.

## 5. Integration points (what will change)
- New: `src/lib/career/**` (services), `src/app/api/career/**` (routes), `src/app/manage/career/**` (workspace UI), `scripts/migrate-career.ts`, `tests/**`, `docs/career-automation/**`.
- Modified (surgical): `src/components/CMSLayout.tsx` (sidebar group), `src/app/manage/page.tsx` (career card), `src/lib/academics-public.ts` (parent-chain publication check), `src/app/manage/academics/page.tsx` (publication controls), `package.json` (scripts: `migrate:career`, `test*`), `.github/workflows/ci.yml` (add type check + tests, keep build).
