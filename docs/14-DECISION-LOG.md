# DECISION LOG

STATUS: DRAFT
AUTHORITY: PROJECT ENGINEERING BRAIN
IMPLEMENTATION STATUS: NOT STARTED
VALIDATION STATUS: NOT YET VALIDED

## Format
- Date: YYYY-MM-DD
- Decision: 
- Rationale:
- Alternatives Considered:
- Impact:

## Entries
- Date: 2026-10-07
- Decision: Stage 4.5 (Authentication & Security Design, `docs/11-AUTHENTICATION-AND-SECURITY-DESIGN.md`, 195 lines) is ACCEPTED AND FROZEN. Its design decisions are authoritative for subsequent stages; implementation must conform to them. Stage 4.6 is the next authorized design stage.
- Rationale: The design satisfies NFR-001 and FR-005 at design level and is consistent with frozen Stages 4.1-4.4 (verified from disk: `09-DATA-AND-PERSISTENCE-DESIGN.md`, 253 lines, unchanged; `10-INTERFACE-AND-API-DESIGN.md`, 192 lines, unchanged). The independent audit returned PASS WITH NON-BLOCKING FINDINGS with only two low-severity documentation observations: F-1 (threat-table mitigation classification precision) and F-2 (PreviewDraft citation precision) — neither is an architectural defect and neither blocks freezing.
- Alternatives Considered: Blocking the freeze until F-1/F-2 were corrected (rejected — both are non-blocking documentation precision issues, recorded as deferred documentation cleanup, not architectural defects); reopening earlier architectural decisions (rejected — not authorized by this stage).
- Impact: No implementation has begun. Stage 4.3 and Stage 4.4 remain frozen and unchanged. F-1 and F-2 remain non-blocking documentation observations, not architectural defects. Implementation-time choices marked DEFERRED in the Stage 4.5 document (exact hashing library, session store, timeout values, CSRF mechanism, rate limiting, security headers, credential secret location, optional audit logging) remain implementation decisions, not frozen technology choices. Next authorized design stage: Stage 4.6.
- Date: 2026-10-08
- Decision: Stage 4.6 — UX and Interaction Design (`docs/12-UX-AND-INTERACTION-DESIGN.md`) is ACCEPTED AND FROZEN. Its design decisions are authoritative for subsequent stages; implementation must conform to them. Stage 4.7 is the next authorized design stage.
- Rationale: Formal audit returned PASS — ELIGIBLE FOR FORMAL ACCEPTANCE.
- Alternatives Considered: None (the audit found the document compliant and eligible for acceptance).
- Impact: Stage 4.6 is now frozen; the UX design document is authoritative for Stage 4.7 and later stages. No implementation has begun. Stage 4.7 remains the next authorized design stage, subject to governance prerequisites.
- Date: 2026-10-09
- Decision: Stage 4.7 — Testing Design (`docs/13-TESTING-DESIGN.md`) is ACCEPTED AND FROZEN. Its decision decisions are authoritative for subsequent stages; implementation must conform to them. Stage 4.8 is a potential subsequent design stage. It has not been authorized by this decision. Any further work requires separate definition, satisfaction of governance prerequisites, and explicit authorization.
- Rationale: Formal audit returned PASS — ELIGIBLE FOR FORMAL ACCEPTANCE and final governance check returned CLEAR — ELIGIBLE FOR ACCEPTANCE.
- Alternatives Considered: None (the audit found the document compliant and eligible for acceptance).
- Impact: Stage 4.7 is now frozen; the testing-decision document is authoritative for Stage 4.8 and later stages. No implementation has begun. Stage 4.8 remains the next authorized design stage, subject to governance prerequisites.
- Date: 2026-10-10
- Decision: Stage 4.8 — Governance Authority and Stage Lifecycle Definition (`docs/15-GOVERNANCE-AND-STAGE-LIFECYCLE.md`) is ACCEPTED AND FROZEN. Its decision decisions are authoritative for subsequent stages; implementation must conform to them. Stage 4.9 is the next authorized design stage.
- Rationale: Formal audit returned PASS — ELIGIBLE FOR FORMAL ACCEPTANCE.
- Alternatives Considered: None (the audit found the document compliant and eligible for acceptance).
- Impact: Stage 4.8 is now frozen; the governance authority and state lifecycle document is authoritative for Stage 4.9 and later stages. No implementation has begun. Stage 4.9 remains the next authorized design stage, subject to governance prerequisites.
- Date: 2026-10-11
- Decision: Stage 4.9 — Technology Decisions and Architecture Selection (`docs/12-TECHNOLOGY-DECISIONS.md`) is ACCEPTED AND FROZEN. Its design decisions are authoritative for subsequent stages; implementation must conform to them. Stage 4.10 is the next authorized design stage.
- Rationale: Formal audit returned PASS — ELIGIBLE FOR FORMAL ACCEPTANCE.
- Alternatives Considered: None (the audit found the document compliant and eligible for acceptance).
- Impact: Stage 4.9 is now frozen; the technology decisions document is authoritative for Stage 4.10 and later stages. No implementation has begun. Stage 4.10 remains the next authorized design stage, subject to governance prerequisites.
- Date: 2026-10-12
- Decision: Stage 4.10 — Implementation Framework and Environment Setup (`docs/16-IMPLEMENTATION-FRAMEWORK-AND-ENVIRONMENT-SETUP.md`) is ACCEPTED. Its design decisions are authoritative for subsequent stages; implementation must conform to them. Stage 4.11 is not authorized or started; explicit authorization required.
- Rationale: Formal audit returned PASS — ELIGIBLE FOR FORMAL ACCEPTANCE.
- Alternatives Considered: None (the audit found the document compliant and eligible for acceptance).
- Impact: Stage 4.10 is now accepted; the implementation framework and environment setup document is authoritative for Stage 4.11 and later stages. No implementation has begun. Stage 4.11 remains the next authorized design stage, subject to governance prerequisites.
- Date: 2026-10-13
- Decision: Stage 4.11 — Core Implementation and Feature Development (`docs/17-IMPLEMENTATION-AND-FEATURE-DEVELOPMENT.md`) is ACCEPTED. Its design decisions are authoritative for subsequent stages; implementation must conform to them. Stage 4.12 is the next authorized design stage.
- Rationale: Formal audit returned PASS — ELIGIBLE FOR FORMAL ACCEPTANCE (see `docs/STAGE_4_11_AUDIT_REPORT.md`).
- Alternatives Considered: None (the audit found the document compliant and eligible for acceptance).
- Impact: Stage 4.11 is now accepted; the core implementation and feature development document is authoritative for Stage 4.12 and later stages. No implementation has begun. Stage 4.12 remains the next authorized design stage, subject to governance prerequisites.
- Date: 2026-10-09
- Decision: Stage 4.11 — Core Implementation and Feature Development (`docs/17-IMPLEMENTATION-AND-FEATURE-DEVELOPMENT.md`) is ACCEPTED AND FROZEN. Its accepted design decisions are authoritative and must be followed by subsequent authorized stages.
- Rationale: The formal Stage 4.11 acceptance decision exists in the decision log, and the audit report records `PASS — ELIGIBLE FOR FORMAL ACCEPTANCE`. The lifecycle freeze criteria were verified before this action.
- Alternatives Considered: Do not freeze; rejected because the required acceptance and freeze criteria were verified.
- Impact: Stage 4.11 is frozen. Changes to it must follow the applicable governance and correction procedures. No application implementation is authorized by this freeze action. Stage 4.12 must not begin without its required separate authorization and governance prerequisites.

- Date: 2026-10-09
- Decision: Stage 4.12 — Testing, Verification, and Release Preparation is explicitly authorized to begin its Draft Phase as the next authorized design stage.
- Rationale: Stage 4.11 is recorded as accepted and frozen, the authoritative roadmap identifies Stage 4.12 as the next stage, and the user has explicitly authorized this action.
- Alternatives Considered: Defer authorization; rejected in favor of proceeding with controlled Stage 4.12 design work subject to the applicable governance requirements.
- Impact: Stage 4.12 may begin design and requirements work under the governing constitution and lifecycle. This decision does not authorize application implementation, release execution, or bypassing required audits, acceptance, or freeze procedures. Any subsequent stage transition must satisfy its applicable governance requirements.

- Date: 2026-10-09
- Decision: Stage 4.12 — Testing, Verification, and Release Preparation (`docs/18-TESTING-VERIFICATION-RELEASE.md`) is ACCEPTED. Its design decisions are authoritative for subsequent stages; implementation must conform to them. Stage 4.13 is the next authorized design stage.
- Rationale: Formal audit returned PASS — ELIGIBLE FOR FORMAL ACCEPTANCE (see `docs/STAGE_4_12_AUDIT_REPORT.md`).
- Alternatives Considered: None (the audit found the document compliant and eligible for acceptance).
- Impact: Stage 4.12 is now accepted; the testing, verification, and release preparation document is authoritative for Stage 4.13 and later stages. No implementation has begun. Stage 4.13 remains the next authorized design stage, subject to governance prerequisites.
- Date: 2026-10-09
- Decision: Stage 4.12 — Testing, Verification, and Release Preparation (`docs/18-TESTING-VERIFICATION-RELEASE.md`) is ACCEPTED AND FROZEN. Its design decisions are authoritative for subsequent stages; implementation must conform to them. Stage 4.13 is the next authorized design stage.
- Rationale: Formal audit returned PASS — ELIGIBLE FOR FORMAL ACCEPTANCE (see `docs/STAGE_4_12_AUDIT_REPORT.md`).
- Alternatives Considered: None (the audit found the document compliant and eligible for acceptance).
- Impact: Stage 4.12 is now frozen; the testing, verification, and release preparation document is authoritative for Stage 4.13 and later stages. No implementation has begun. Stage 4.13 remains the next authorized design stage, subject to governance prerequisites.

- Date: 2026-10-09
- Decision: Stage 5.1 — Application Implementation (`docs/19-APPLICATION-IMPLEMENTATION.md`) is explicitly authorized to begin its Draft Phase as the next authorized design stage.
- Rationale: Stage 4.12 is recorded as accepted and frozen, and the user has explicitly authorized this implementation stage to begin.
- Alternatives Considered: Defer authorization; rejected in favor of proceeding with controlled implementation work subject to the applicable governance requirements.
- Impact: Stage 5.1 may begin design and requirements work under the governing constitution and lifecycle. This decision does not authorize application implementation, release execution, or bypassing required audits, acceptance, or freeze procedures. Any subsequent stage transition must satisfy its applicable governance requirements.

- Date: 2026-10-09
- Decision: Stage 5.1 — Application Implementation (`docs/19-APPLICATION-IMPLEMENTATION.md`) is ACCEPTED. Its design decisions are authoritative for subsequent stages; implementation must conform to them. Stage 5.2 is the next authorized design stage.
- Rationale: Formal audit returned PASS — ELIGIBLE FOR FORMAL ACCEPTANCE (see `docs/STAGE_5_1_AUDIT_REPORT.md`).
- Alternatives Considered: None (the audit found the document compliant and eligible for acceptance).
- Impact: Stage 5.1 is now accepted; the application implementation document is authoritative for Stage 5.2 and later stages. No implementation has begun. Stage 5.2 remains the next authorized design stage, subject to governance prerequisites.

- Date: 2026-10-09
- Decision: Increment 2.1 — Database Schema Initialization (`src/db/schema.sql`) is ACCEPTED. Its design decisions are authoritative for subsequent increments; implementation must conform to them. Increment 2.2 is the next authorized increment.
- Rationale: The database schema initialization increment has been statically verified and corrected for foreign‑key enforcement per connection, singleton profile invariant, Experience and Education tables, updated_at maintenance, and test dependency declaration. Runtime verification remains outstanding.
- Alternatives Considered: None (the increment was found compliant and acceptable for static review).
- Impact: Increment 2.1 is now accepted; the database schema initialization increment is authoritative for Increment 2.2 and later increments. No implementation has begun. Increment 2.2 remains the next authorized increment, subject to governance prerequisites.

- Date: 2026-10-09
- Decision: Implementation of the portfolio system may now begin, using the frozen Stage 5.1 design (`docs/19-APPLICATION-IMPLEMENTATION.md`) as the authoritative input.
- Rationale: Stage 5.1 is recorded as accepted and frozen, and the user has explicitly authorized the commencement of implementation.
- Alternatives Considered: Delay implementation until further design stages are completed; rejected because the design is complete and authorized, and the user has authorized immediate commencement.
- Impact: Implementation work may now commence, starting with the first increment (Project Setup and Foundations). No application implementation has begun prior to this authorization. Subsequent increments must be authorized separately or follow the implementation stage's internal governance.
- Date: 2026-10-11
- Decision: MODULE-013 (Experience & Education management) implemented per SYS-BUILD-001. New repositories (`src/repositories/experienceRepository.js`, `src/repositories/educationRepository.js`), manage routes (CRUD under `requireAuth`, 404/400/401/403 contracts), list views, dashboard counts, and a 15-test suite (`tests/manageExperienceEducation.test.js`). Public CV rendering remains deferred to the FR-007 future module.
- Rationale: MODULE-012 (migration runner) was complete and verified; the schema already contained the orphaned `experience`/`education` tables, so no migration was needed. Existing patterns (whitelisted columns, singleton profile, CSRF-protected forms) were mirrored exactly.
- Alternatives Considered: adding publication_state columns to experience/education (rejected — schema has no such column and roadmap does not require it for this module); separate edit pages (rejected — list-with-inline-form pattern matches skills module).
- Impact: Dashboard now surfaces experience/education counts; owner can manage career history without code changes (NFR-002). 62/62 tests green, lint clean. Unblocks FR-007 CV generation.

- Date: 2026-10-11
- Decision: Session cookie `secure` flag changed from `isProd()` (boolean) to `'auto'` (express-session) with the existing production `trust proxy = 1`. Additionally fixed `sessionGuard` to clear the correct cookie name (`portfolio.sid`, was `connect.sid`).
- Rationale: Container verification (MODULE-010) showed that `secure: true` under plain HTTP suppresses `Set-Cookie` entirely, so production HTTP deployments could not hold sessions at all. `'auto'` keeps the Secure flag whenever the request is HTTPS (honoring X-Forwarded-Proto via trust proxy), satisfying the frozen "Secure in production (TLS)" design, while allowing the first-release HTTP demo the roadmap explicitly anticipated (SYS-BUILD-001 §MODULE-010 risk note).
- Alternatives Considered: TLS-only deployment via reverse proxy before any container demo (deferred — G-9 decision remains open); disabling secure cookies entirely (rejected — weakens the frozen design when TLS is present).
- Impact: Production HTTP demo deployments get working sessions; TLS deployments retain Secure cookies. New regression test `tests/productionCookie.test.js` proves anonymous session issuance in production HTTP.

- Date: 2026-10-11
- Decision: FR-007 CV generation implemented as authenticated HTML download (`GET /manage/cv` preview + `GET /manage/cv/download` attachment) with print/PDF-ready styling; no PDF binary dependency. Also fixed CI: `connectDB()` now creates the `DB_PATH` parent directory, repairing fresh-checkout (CI) SQLITE_CANTOPEN failures.
- Rationale: HTML satisfies the requirement's "PDF or formatted text" via browser print-to-PDF with zero heavyweight dependencies; single source of truth is preserved by rendering from the same repositories (published skills only, all experience/education). CI had failed on every push since the baseline because `migrations.test.js` referenced `data/test_migrations.db` on a checkout without a `data/` directory — reproduced in a clean node:20 Linux container and fixed at the source.
- Alternatives Considered: server-side PDF generation via Puppeteer/wkhtmltopdf (rejected — large native/Chromium dependency for a P1 feature); public CV route (rejected — requirement specifies trigger/download via the private management system).
- Impact: CI verify job expected green on next push (fix verified in clean Linux repro: 70/70 tests, lint clean, audit 0). Owner can download a live-data CV from the dashboard; CV updates immediately when data changes (covered by tests/cv.test.js).

- Date: 2026-10-12
- Decision: Management rate limiter scoped by request class: mutations and credential endpoints keep the frozen 10/min budget; management navigation (GET/HEAD) gets 60/min (`manageGetLimiter`).
- Rationale: Live verification showed the undifferentiated 10/min limiter blocked normal dashboard browsing (~9 page views exhaust it), making the manage UI effectively unusable in real use — the frozen budget's stated purpose is throttling credential guessing, which only applies to POSTs. Frozen numbers are preserved where they matter; no limits were loosened on any state-changing or credential path.
- Alternatives Considered: raising the single management limiter to 60/min (rejected — weakens the frozen anti-guessing budget); leaving as-is (rejected — breaks the owner's core workflow).
- Impact: Owner can browse all manage pages freely; POST abuse remains throttled at 10/min. Verified live: full 13-page manage crawl 200, full CRUD journey (profile/experience/education/project/skill create + publish) end-to-end, public pages reflect published data.
