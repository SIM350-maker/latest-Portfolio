# MOD-002 Project Presentation Dissection

Methodology: the dissection methodology as corrected by ADJ-004-013 (docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5, corrected abstraction test with the mandatory scope qualifier). The scope qualifier is applied to every abstraction-test result in this dossier.

## Task A — File inventory for this module

| Path | Purpose | Inbound refs | Outbound refs | Verdict |
|------|---------|--------------|---------------|---------|
| src/repositories/projectRepository.js | CRUD for projects; publication-state management; claims, evidence, and skills association (project_evidence, project_skill junctions) | src/routes/publicRoutes.js, src/routes/manageRoutes.js, tests/constraints.test.js | ../config/database, ../lib/validation | KEEP |
| src/views/projects/list.ejs | Published projects list (public) | src/routes/publicRoutes.js:31 | partials | KEEP |
| src/views/projects/detail.ejs | Project detail with claims, evidence, skills (public and preview) | src/routes/publicRoutes.js:50; src/routes/manageRoutes.js:431 | partials | KEEP |
| src/views/manage/projects/list.ejs | All projects incl. drafts (private) | src/routes/manageRoutes.js:124 | partials | KEEP |
| src/views/manage/projects/form.ejs | New/edit project form (private) | src/routes/manageRoutes.js:129, 142, 154, 169 | partials | KEEP |

## Task B — Data-flow traces for this module

### 1. Public projects list (FR-002)
  HTTP request (GET /projects)
    → middleware (helmet app.js:51 … csrf app.js:95, logger app.js:98, static app.js:102)
    → route handler (src/routes/publicRoutes.js:28-33)
    → repository call (src/repositories/projectRepository.js:13-16 listPublished)
    → SQL statement (paste verbatim)
      SELECT * FROM project WHERE publication_state = 'Published' ORDER BY updated_at DESC, id DESC
    → view model constructed (publicRoutes.js:31: { isAuthenticated, title: 'Projects', projects })
    → template rendered (src/views/projects/list.ejs)
    → HTTP response (200, text/html)

### 2. Public project detail with claims and evidence (FR-002, FR-003, FR-006)
  HTTP request (GET /projects/:id)
    → route handler (src/routes/publicRoutes.js:35-54)
    → publication gate in route handler (publicRoutes.js:38-44: 404 unless Published)
    → repository calls (projectRepository.js:18-21 getById; :79-86 listClaims(onlyPublished=true); :89-94 listEvidence; :109-114 listSkills; claimRepository.js listEvidence per claim at publicRoutes.js:49)
    → SQL statements (paste verbatim)
      SELECT * FROM project WHERE id = ?
      SELECT * FROM claim WHERE source_entity_type = ? AND source_entity_id = ? AND publication_state = 'Published' ORDER BY created_at DESC, id DESC
      SELECT e.* FROM evidence e JOIN project_evidence pe ON pe.evidence_id = e.id WHERE pe.project_id = ? ORDER BY e.created_at DESC, e.id DESC
      SELECT s.* FROM skill s JOIN project_skill ps ON ps.skill_id = s.id WHERE ps.project_id = ? ORDER BY s.name
      SELECT e.* FROM evidence e JOIN claim_evidence ce ON ce.evidence_id = e.id WHERE ce.claim_id = ? ORDER BY e.created_at DESC, e.id DESC
    → view model constructed (publicRoutes.js:49-52: claimsWithEvidence map)
    → template rendered (src/views/projects/detail.ejs)
    → HTTP response (200, text/html; non-public or missing → 404 error view)

### 3. Project create/update/delete (management)
    → route handlers (src/routes/manageRoutes.js:132-148 create, :158-177 update, :179-184 delete)
    → validation (src/lib/validation.js requireText/optionalText, manageRoutes.js:135-139, 161-166)
    → repository calls (projectRepository.js:23-30 create — INSERT with publication_state 'Draft'; :32-47 update — dynamic UPDATE; :59-76 remove — claim-count guard then DELETE, ConflictError 409 when claims reference the project)
    → SQL statements (paste verbatim)
      INSERT INTO project (title, description, outcomes, roles, technologies, publication_state) VALUES (?, ?, ?, ?, ?, 'Draft')
      UPDATE project SET title = ?, … WHERE id = ?
      SELECT COUNT(*) AS n FROM claim WHERE source_entity_type = 'project' AND source_entity_id = ?
      DELETE FROM project WHERE id = ?
    → HTTP response (303 See Other to /manage/projects; 409 on blocked delete via errorHandler)

### 4. Project publish/unpublish and evidence/skills association (management)
    → route handlers (manageRoutes.js:186-198 publish/unpublish, :200-209 evidence, :211-220 skills)
    → repository calls (setPublicationState :49-53; attachEvidence :97-101 INSERT OR IGNORE into project_evidence; attachSkill :116-120 INSERT OR IGNORE into project_skill)
    → HTTP response (303 See Other to /manage/projects)

## Task C — Module dossier for MOD-002

### 1. Responsibility
MOD-002 Project Presentation displays projects with descriptions, outcomes, roles, technologies, and attached evidence (FR-002, FR-003, FR-006), and persists project content for the management interface (NFR-002).

### 2. Public surface (routes, functions, exported symbols, with file:line)
- Routes:
  - GET /projects (src/routes/publicRoutes.js:28)
  - GET /projects/:id (src/routes/publicRoutes.js:35)
  - GET /manage/projects (src/routes/manageRoutes.js:121)
  - GET /manage/projects/new (src/routes/manageRoutes.js:128)
  - POST /manage/projects (src/routes/manageRoutes.js:132)
  - GET /manage/projects/:id/edit (src/routes/manageRoutes.js:150)
  - POST /manage/projects/:id (src/routes/manageRoutes.js:158)
  - POST /manage/projects/:id/delete (src/routes/manageRoutes.js:179)
  - POST /manage/projects/:id/publish (src/routes/manageRoutes.js:186)
  - POST /manage/projects/:id/unpublish (src/routes/manageRoutes.js:193)
  - POST /manage/projects/:id/evidence (src/routes/manageRoutes.js:200)
  - POST /manage/projects/:id/skills (src/routes/manageRoutes.js:211)
  - GET /preview/project/:id (src/routes/manageRoutes.js:424)
- Functions (projectRepository):
  - listAll() (src/repositories/projectRepository.js:8)
  - listPublished() (src/repositories/projectRepository.js:13)
  - getById(id) (src/repositories/projectRepository.js:18)
  - create(data) (src/repositories/projectRepository.js:23)
  - update(id, changes) (src/repositories/projectRepository.js:32)
  - setPublicationState(id, state) (src/repositories/projectRepository.js:49)
  - remove(id) (src/repositories/projectRepository.js:59)
  - listClaims(projectId, onlyPublished) (src/repositories/projectRepository.js:79)
  - listEvidence(projectId) (src/repositories/projectRepository.js:89)
  - attachEvidence(projectId, evidenceId) (src/repositories/projectRepository.js:97)
  - detachEvidence(projectId, evidenceId) (src/repositories/projectRepository.js:103)
  - listSkills(projectId) (src/repositories/projectRepository.js:109)
  - attachSkill(projectId, skillId) (src/repositories/projectRepository.js:116)
  - detachSkill(projectId, skillId) (src/repositories/projectRepository.js:122)
- Exported symbols (src/repositories/projectRepository.js:128-131): listAll, listPublished, getById, create, update, setPublicationState, remove, listClaims, listEvidence, attachEvidence, detachEvidence, listSkills, attachSkill, detachSkill

### 3. Internal collaborators (with file:line)
- src/config/database.js:22 (connectDB; singleton connection)
- src/db/schema.sql:16-26 (project DDL), :85-92 (project_skill), :94-101 (project_evidence), :129+ (update_project_timestamp trigger)
- src/lib/validation.js (ValidationError, ConflictError)

### 4. Forbidden collaborators (with the reason)
- None: database/config and validation lib only. No cross-module business dependencies (publicRoutes composes read-only queries of sibling repositories at the route layer, which is the composition point, not a repository dependency).

### 5. Data it owns (tables, columns, invariants — paste the relevant DDL)
```sql
CREATE TABLE IF NOT EXISTS project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    outcomes TEXT,
    roles TEXT,
    technologies TEXT,
    publication_state TEXT NOT NULL DEFAULT 'Draft' CHECK (publication_state IN ('Draft','Published','Archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
Invariants: publication_state ∈ ('Draft','Published','Archived'); projects create as 'Draft' (projectRepository.js:26); project deletion blocked while claims reference it (projectRepository.js:61-66, RESTRICT per docs/09 §20).

### 6. Data it reads but does not own
- claim table (listClaims, and claim-count guard in remove)
- evidence table (listEvidence via project_evidence join)
- skill table (listSkills via project_skill join)

### 7. Failure modes (each mapped to an HTTP status or thrown error type)
- ValidationError (400): missing/over-length fields on create/update (manageRoutes.js:135-139, 161-166)
- NotFoundError (404): unknown project detail (publicRoutes.js:38-44); missing project on edit/update/evidence/skills/preview routes
- ConflictError (409): delete blocked while claims reference the project (projectRepository.js:64-66)
- OperationalError (500): SQLite errors (caught and rethrown in database.js:47-50)

### 8. Isolation test plan: the minimal tests that prove this module works end-to-end WITHOUT any other module implemented
Stubs/fakes required: fake better-sqlite3 connection implementing prepare/run/get/all/lastInsertRowid/changes with the project, claim, evidence, project_evidence, project_skill DDL and CASCADE/RESTRICT behaviour.
Justification: the stub fakes only the external persistence layer, not the module's logic.
Tests needed: CRUD over HTTP with a session; publication gate (draft invisible publicly, 404 for unpublished detail); blocked delete with claims → 409; attach evidence/skills. Note: the existing suite covers the core of this (tests/constraints.test.js, tests/content.test.js) — no new test file is required for MOD-002's isolation beyond what exists.

### 9. Build order: the exact sequence from empty directory to passing isolation test
1. Install dependencies
2. src/config/database.js (connectDB)
3. src/lib/validation.js
4. src/db/schema.sql (project, claim, evidence, junction tables)
5. src/repositories/projectRepository.js
6. src/views/projects/* and src/views/manage/projects/*
7. HTTP tests with tests/helpers.js
8. npm test

### 10. Deletion candidates: anything not required by a traced requirement
- detachEvidence (src/repositories/projectRepository.js:103-107) and detachSkill (:122-126): 0 callers — no route, no test, no documented use case reaches them; the frozen management contract (docs/10 §7) defines no detach operations (evidence/skills association is attach-only). Recorded as ADJ-002-001 with disposition DELETE.

## Task D — Scrutiny findings for MOD-002

Files examined: src/repositories/projectRepository.js, src/views/projects/list.ejs, src/views/projects/detail.ejs, src/views/manage/projects/list.ejs, src/views/manage/projects/form.ejs (plus the project routes in publicRoutes.js and manageRoutes.js).

### Dead code test
- detachEvidence: 0 callers; detachSkill: 0 callers (rg -n "projectRepo\.(detachEvidence|detachSkill)" src tests → no matches). Dead code. → ADJ-002-001.
- All other functions are used: getById (7), listPublished (3), listAll (2), listClaims (2), listEvidence (2), listSkills (2), setPublicationState (2), create (1), update (1), remove (1), attachEvidence (1), attachSkill (1).

### Duplication test
- update() builds its SET clause dynamically (projectRepository.js:32-47); setPublicationState (:49-53) is a dedicated publication-state write with different semantics — distinct purposes. The dynamic-SQL pattern is duplicated with profileRepository.updateProfile but across modules at the same layer; acceptable, parameterized. No in-module duplication found.

### Framework-convenience test (does it hide a data flow?)
- No. All SQL is explicit and parameterized; the publication filter is a named constant (projectRepository.js:6).

### Dependency test (actually imported?)
- Yes: projectRepository is imported in publicRoutes.js:5 and manageRoutes.js:8.

### Abstraction test (corrected — scope qualifier mandatory)
Classification applied before the ≥2-caller rule:
- listAll, listPublished, getById, setPublicationState, listClaims, listEvidence, listSkills: module public surface methods reachable from routes — reachable → KEEP (caller counts 2-7 in any case).
- create, update, remove, attachEvidence, attachSkill: module public surface methods reachable from routes (manageRoutes.js:145, 172, 181, 206, 217) — reachable → KEEP-WITH-JUSTIFICATION. 1 caller each.
- detachEvidence, detachSkill: unreachable from a route, a test, or a documented use case → internal helpers → 0 callers → DELETE. → ADJ-002-001.

### Template test (rendered by a route?)
- projects/list.ejs by publicRoutes.js:31; projects/detail.ejs by publicRoutes.js:50 and manageRoutes.js:431 (preview); manage/projects/list.ejs by manageRoutes.js:124; manage/projects/form.ejs by manageRoutes.js:129, 142, 154, 169. All pass.

### Route test (handler + test + documented contract?)
- GET /projects and GET /projects/:id: documented docs/10 §6; tested tests/content.test.js:27-33 (404 for unknown detail).
- Management CRUD/publish/evidence/skills: documented docs/10 §7; tested across tests/content.test.js and tests/constraints.test.js. All pass.

### Middleware test (registered? order justified?)
- Public project routes run behind the app chain (public GET-only boundary app.js:88-92); management routes behind requireAuth (manageRoutes.js:52). Pass.

### Configuration test (env var read, documented, validated at boot?)
- Not applicable at module level. Pass.

### Naming test (matches domain vocabulary in docs/05?)
- "project" matches docs/05/09 domain vocabulary (Project with title, description, outcomes, roles, technologies, publication_state). Pass.

### Honesty test (any public rendering implying verifiability for Private/Redacted/Unavailable evidence?)
- Project detail renders evidence with accessibility status via the shared detail template; the honest-rendering invariant is enforced in the evidence rendering (MOD-004 dossier Task B trace 8). Draft/unpublished projects return 404 publicly (publicRoutes.js:38-44). Pass.

## Task E — Ledger entries for MOD-002

### ADJ-002-001
  - Status: PROPOSED → DONE (2026-10-10) — DELETE disposition executed.
  - Result: detachEvidence() and detachSkill() removed from src/repositories/projectRepository.js (functions and exports removed; module.exports is now `{ listAll, listPublished, getById, create, update, setPublicationState, remove, listClaims, listEvidence, attachEvidence, listSkills, attachSkill }`). No route or caller was added.
  - Verification output, pasted verbatim:
    Command: rg -n "detachEvidence|detachSkill" src tests --glob "!node_modules" — remaining matches are in src/repositories/skillRepository.js:101,109 and src/repositories/claimRepository.js:87,103 (the same dead-code pattern in sibling repositories — each module's own dissection pass governs them; no references to projectRepository's detach functions remain).
    Command: npm test — "Test Suites: 6 passed, 6 total / Tests: 35 passed, 35 total / Time: 7.044 s".
    Command: npm run lint — clean.
  - Type: Dead code
  - Module: MOD-002
  - Layer: persistence
  - Traces to: docs/10 §7 (management interface table — no detach operations defined); docs/09 §20 (deletion and lifecycle rules)
  - Problem: detachEvidence() and detachSkill() in projectRepository.js have 0 callers; no route, no test, and no documented use case reaches them. The frozen management contract defines no detach operations (evidence/skills association is attach-only). The functions are dead code.
  - Evidence: rg -n "projectRepo\.(detachEvidence|detachSkill)" src tests → no matches; rg -n "detachEvidence|detachSkill" src → only the definitions at src/repositories/projectRepository.js:103 and :122.
  - Proposed change: Remove detachEvidence() and detachSkill() from projectRepository.js (and their exports). Per the corrected abstraction test: unreachable → DELETE. Do not add routes or callers to justify them (no traced requirement demands detach operations).
  - Data-flow impact: None — the functions are not called.
  - Isolation impact: None — the functions are not part of any data flow.
  - Risk if skipped: Dead code remains; a future pass could mistake the junction-table DELETE statements for a live detach path.
  - Verification: rg -n "detachEvidence|detachSkill" src/ → no matches after removal.
  - Rollback: restore both functions and their exports.

No entries for the single-caller functions (create, update, remove, attachEvidence, attachSkill) — all are route-reachable module public surface methods; the corrected test's ≥2-caller rule does not apply to them, and no caller count is a test of a public surface method.

## Task F — Verification matrix for MOD-002

| Ledger entry | Test that proves it | Command to run | Expected output |
|--------------|---------------------|----------------|-----------------|
| ADJ-002-001 | Search for detach usage | `rg -n "projectRepo\.(detachEvidence\|detachSkill)" src tests` | No matches found |
| ADJ-002-001 | Search for the definitions | `rg -n "detachEvidence\|detachSkill" src/repositories/projectRepository.js` | Lines 103, 122 (definitions) until removed |

## Task G — What I could not verify

- Pagination: FR-010 is P1-deferred (docs/16 ledger Section 8); listAll/listPublished return unbounded result sets. Deferred per the frozen design; no open work recorded in this dossier.

## Pass Closure — MOD-002 dissection, 2026-10-10
- Methodology: the corrected dissection methodology (ADJ-004-013; scope qualifier mandatory).
- ADJ-002-001: DONE — DELETE disposition executed (detachEvidence()/detachSkill() and their exports removed from src/repositories/projectRepository.js; rg "detachEvidence|detachSkill" → zero references to the project repository's detach functions remain; 35/35 tests pass; lint clean). Open finding carried to sibling modules: the same dead-code pattern exists in skillRepository.js:101 (detachEvidence, 0 callers) and claimRepository.js:87 (detachEvidence, 0 callers) — each module's own dissection pass governs them.
- Source files changed by this pass: src/repositories/projectRepository.js (dead-code removal only; no behaviour change — the removed functions had 0 callers).
- MOD-002 entry status: DONE 1 (ADJ-002-001); WONTFIX — JUSTIFIED 0; PROPOSED 0; BLOCKED 0.
- MOD-002 ledger complete; next module is MOD-003.
