# MOD-003 Skill Presentation Dissection

Methodology: the dissection methodology as corrected by ADJ-004-013 (docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5, corrected abstraction test with the mandatory scope qualifier). The scope qualifier is applied to every abstraction-test result in this dossier.

## Task A — File inventory for this module

| Path | Purpose | Inbound refs | Outbound refs | Verdict |
|------|---------|--------------|---------------|---------|
| src/repositories/skillRepository.js | CRUD for skills; publication-state management; claims, evidence, and project association (skill_evidence, project_skill junctions) | src/routes/publicRoutes.js, src/routes/manageRoutes.js, tests/constraints.test.js | ../config/database, ../lib/validation | KEEP |
| src/views/skills/list.ejs | Published skills list (public) | src/routes/publicRoutes.js:59 | partials | KEEP |
| src/views/skills/detail.ejs | Skill detail with claims and evidence (public and preview) | src/routes/publicRoutes.js:76; src/routes/manageRoutes.js:443 | partials | KEEP |
| src/views/manage/skills/list.ejs | All skills incl. drafts, create form (private) | src/routes/manageRoutes.js:226, 237 | partials | KEEP |

## Task B — Data-flow traces for this module

### 1. Public skills list (FR-004)
  HTTP request (GET /skills)
    → middleware (helmet app.js:51 … csrf app.js:95, logger app.js:98, static app.js:102)
    → route handler (src/routes/publicRoutes.js:56-61)
    → repository call (src/repositories/skillRepository.js:13-16 listPublished)
    → SQL statement (paste verbatim)
      SELECT * FROM skill WHERE publication_state = 'Published' ORDER BY name ASC
    → view model constructed (publicRoutes.js:59)
    → template rendered (src/views/skills/list.ejs)
    → HTTP response (200, text/html)

### 2. Public skill detail with claims and evidence (FR-004, FR-003, FR-006)
  HTTP request (GET /skills/:id)
    → route handler (src/routes/publicRoutes.js:63-80)
    → publication gate in route handler (publicRoutes.js:66-72: 404 unless Published)
    → repository calls (skillRepository.js:18-21 getById; :79-86 listClaims(onlyPublished=true); :88-93 listEvidence; claimRepository.js listEvidence per claim at publicRoutes.js:75)
    → SQL statements (paste verbatim)
      SELECT * FROM skill WHERE id = ?
      SELECT * FROM claim WHERE source_entity_type = ? AND source_entity_id = ? AND publication_state = 'Published' ORDER BY created_at DESC, id DESC
      SELECT e.* FROM evidence e JOIN skill_evidence se ON se.evidence_id = e.id WHERE se.skill_id = ? ORDER BY e.created_at DESC, e.id DESC
      SELECT e.* FROM evidence e JOIN claim_evidence ce ON ce.evidence_id = e.id WHERE ce.claim_id = ? ORDER BY e.created_at DESC, e.id DESC
    → view model constructed (publicRoutes.js:75-78: claimsWithEvidence map)
    → template rendered (src/views/skills/detail.ejs)
    → HTTP response (200, text/html; non-public or missing → 404 error view)

### 3. Skill create/update/delete (management)
    → route handlers (src/routes/manageRoutes.js:230-248 create, :250-266 update, :268-273 delete)
    → validation (src/lib/validation.js requireText/optionalText, manageRoutes.js:233-234, 255-256) plus duplicate-name guard (findByName, manageRoutes.js:242, 259)
    → repository calls (skillRepository.js:28-33 create — INSERT with publication_state 'Draft'; :35-50 update — dynamic UPDATE; :59-77 remove — claim-count guard then DELETE, ConflictError 409)
    → SQL statements (paste verbatim)
      INSERT INTO skill (name, description, publication_state) VALUES (?, ?, 'Draft')
      UPDATE skill SET name = ?, description = ? WHERE id = ?
      SELECT COUNT(*) AS n FROM claim WHERE source_entity_type = 'skill' AND source_entity_id = ?
      DELETE FROM skill WHERE id = ?
    → HTTP response (303 See Other to /manage/skills; 409 on blocked delete; 400 with field errors on validation failure)

### 4. Skill publish/unpublish and evidence association (management)
    → route handlers (manageRoutes.js:275-287 publish/unpublish, :289-298 evidence)
    → repository calls (setPublicationState :52-56; attachEvidence :95-99 INSERT OR IGNORE into skill_evidence)
    → HTTP response (303 See Other to /manage/skills)

## Task C — Module dossier for MOD-003

### 1. Responsibility
MOD-003 Skill Presentation displays skills with associated projects and evidence (FR-004, FR-003, FR-006), and persists skill content for the management interface (NFR-002).

### 2. Public surface (routes, functions, exported symbols, with file:line)
- Routes:
  - GET /skills (src/routes/publicRoutes.js:56)
  - GET /skills/:id (src/routes/publicRoutes.js:63)
  - GET /manage/skills (src/routes/manageRoutes.js:223)
  - POST /manage/skills (src/routes/manageRoutes.js:230)
  - POST /manage/skills/:id (src/routes/manageRoutes.js:250)
  - POST /manage/skills/:id/delete (src/routes/manageRoutes.js:268)
  - POST /manage/skills/:id/publish (src/routes/manageRoutes.js:275)
  - POST /manage/skills/:id/unpublish (src/routes/manageRoutes.js:282)
  - POST /manage/skills/:id/evidence (src/routes/manageRoutes.js:289)
  - GET /preview/skill/:id (src/routes/manageRoutes.js:436)
- Functions (skillRepository):
  - listAll() (src/repositories/skillRepository.js:8)
  - listPublished() (src/repositories/skillRepository.js:13)
  - getById(id) (src/repositories/skillRepository.js:18)
  - findByName(name) (src/repositories/skillRepository.js:23)
  - create(data) (src/repositories/skillRepository.js:28)
  - update(id, changes) (src/repositories/skillRepository.js:35)
  - setPublicationState(id, state) (src/repositories/skillRepository.js:52)
  - remove(id) (src/repositories/skillRepository.js:59)
  - listClaims(skillId, onlyPublished) (src/repositories/skillRepository.js:79)
  - listEvidence(skillId) (src/repositories/skillRepository.js:88)
  - attachEvidence(skillId, evidenceId) (src/repositories/skillRepository.js:95)
  - detachEvidence(skillId, evidenceId) (src/repositories/skillRepository.js:101)
- Exported symbols (src/repositories/skillRepository.js:107-110): listAll, listPublished, getById, findByName, create, update, setPublicationState, remove, listClaims, listEvidence, attachEvidence, detachEvidence

### 3. Internal collaborators (with file:line)
- src/config/database.js:22 (connectDB; singleton connection)
- src/db/schema.sql:28-35 (skill DDL), :85-92 (project_skill), skill_evidence table, update_skill_timestamp trigger
- src/lib/validation.js (ValidationError, ConflictError)

### 4. Forbidden collaborators (with the reason)
- None: database/config and validation lib only.

### 5. Data it owns (tables, columns, invariants — paste the relevant DDL)
```sql
CREATE TABLE IF NOT EXISTS skill (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    publication_state TEXT NOT NULL DEFAULT 'Draft' CHECK (publication_state IN ('Draft','Published','Archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
Invariants: publication_state ∈ ('Draft','Published','Archived'); skills create as 'Draft' (skillRepository.js:30); unique skill names enforced at the application level (findByName guard, manageRoutes.js:242, 259); skill deletion blocked while claims reference it (skillRepository.js:61-66, RESTRICT per docs/09 §20).

### 6. Data it reads but does not own
- claim table (listClaims, and the claim-count guard in remove)
- evidence table (listEvidence via skill_evidence join)

### 7. Failure modes (each mapped to an HTTP status or thrown error type)
- ValidationError (400): missing/over-length fields, duplicate skill name (manageRoutes.js:242-244, 259-262)
- NotFoundError (404): unknown skill detail (publicRoutes.js:66-72); missing skill on update/evidence/preview routes
- ConflictError (409): delete blocked while claims reference the skill (skillRepository.js:64-66)
- OperationalError (500): SQLite errors (caught and rethrown in database.js:47-50)

### 8. Isolation test plan: the minimal tests that prove this module works end-to-end WITHOUT any other module implemented
Stubs/fakes required: fake better-sqlite3 connection implementing prepare/run/get/all/lastInsertRowid/changes with the skill, claim, evidence, skill_evidence DDL and CASCADE/RESTRICT behaviour.
Justification: the stub fakes only the external persistence layer, not the module's logic.
Tests needed: CRUD over HTTP with a session; duplicate-name guard (400); publication gate (404 for unpublished detail); blocked delete with claims → 409; attach evidence. Note: the existing suite covers the core of this (tests/content.test.js:19-25 duplicate-name guard; tests/constraints.test.js) — no new test file is required for MOD-003's isolation beyond what exists.

### 9. Build order: the exact sequence from empty directory to passing isolation test
1. Install dependencies
2. src/config/database.js (connectDB)
3. src/lib/validation.js
4. src/db/schema.sql (skill, claim, evidence, junction tables)
5. src/repositories/skillRepository.js
6. src/views/skills/* and src/views/manage/skills/*
7. HTTP tests with tests/helpers.js
8. npm test

### 10. Deletion candidates: anything not required by a traced requirement
- detachEvidence (src/repositories/skillRepository.js:101-105): 0 callers — no route, no test, no documented use case reaches it; the frozen management contract (docs/10 §7) defines no detach operations (evidence association is attach-only). Recorded as ADJ-003-001 with disposition DELETE.

## Task D — Scrutiny findings for MOD-003

Files examined: src/repositories/skillRepository.js, src/views/skills/list.ejs, src/views/skills/detail.ejs, src/views/manage/skills/list.ejs (plus the skill routes in publicRoutes.js and manageRoutes.js).

### Dead code test
- detachEvidence: 0 callers (rg -n "skillRepo\.detachEvidence" src tests → no matches). Dead code. → ADJ-003-001.
- All other functions are used: getById (6), listAll (3), listPublished (3), findByName (2), listClaims (2), listEvidence (2), setPublicationState (2), create (1), update (1), remove (1), attachEvidence (1).

### Duplication test
- update() builds its SET clause dynamically (skillRepository.js:35-50); setPublicationState (:52-56) is a dedicated publication-state write — distinct purposes. The dynamic-SQL pattern is duplicated across repositories at the same layer; acceptable, parameterized. No in-module duplication found.

### Framework-convenience test (does it hide a data flow?)
- No. All SQL is explicit and parameterized; the publication filter is a named constant (skillRepository.js:6).

### Dependency test (actually imported?)
- Yes: skillRepository is imported in publicRoutes.js:6 and manageRoutes.js:9.

### Abstraction test (corrected — scope qualifier mandatory)
Classification applied before the ≥2-caller rule:
- listAll, listPublished, getById, findByName, setPublicationState, listClaims, listEvidence: module public surface methods reachable from routes — reachable → KEEP (caller counts 2-6 in any case).
- create, update, remove, attachEvidence: module public surface methods reachable from routes (manageRoutes.js:245, 263, 270, 295) — reachable → KEEP-WITH-JUSTIFICATION. 1 caller each.
- detachEvidence: unreachable from a route, a test, or a documented use case → internal helper → 0 callers → DELETE. → ADJ-003-001.

### Template test (rendered by a route?)
- skills/list.ejs by publicRoutes.js:59; skills/detail.ejs by publicRoutes.js:76 and manageRoutes.js:443 (preview); manage/skills/list.ejs by manageRoutes.js:226 and :237. All pass.

### Route test (handler + test + documented contract?)
- GET /skills and GET /skills/:id: documented docs/10 §6; tested across the suite.
- Management CRUD/publish/evidence: documented docs/10 §7; tested (duplicate-name guard tests/content.test.js:19-25). All pass.

### Middleware test (registered? order justified?)
- Public skill routes run behind the app chain (public GET-only boundary app.js:88-92); management routes behind requireAuth (manageRoutes.js:52). Pass.

### Configuration test (env var read, documented, validated at boot?)
- Not applicable at module level. Pass.

### Naming test (matches domain vocabulary in docs/05?)
- "skill" matches docs/05/09 domain vocabulary (Skill with name, description, publication_state). Pass.

### Honesty test (any public rendering implying verifiability for Private/Redacted/Unavailable evidence?)
- Skill detail renders evidence with accessibility status via the shared detail template; draft/unpublished skills return 404 publicly (publicRoutes.js:66-72). Pass.

## Task E — Ledger entries for MOD-003

### ADJ-003-001
  - Status: PROPOSED → DONE (2026-10-10) — DELETE disposition executed.
  - Result: detachEvidence() removed from src/repositories/skillRepository.js (function and export removed; module.exports is now `{ listAll, listPublished, getById, findByName, create, update, setPublicationState, remove, listClaims, listEvidence, attachEvidence }`). No route or caller was added.
  - Verification output, pasted verbatim:
    Command: rg -n "detachEvidence" src/repositories/skillRepository.js — no output (exit 1; zero occurrences).
    Command: npm test — "Test Suites: 6 passed, 6 total / Tests: 35 passed, 35 total / Time: 7.815 s".
    Command: npm run lint — clean.
  - Type: Dead code
  - Module: MOD-003
  - Layer: persistence
  - Traces to: docs/10 §7 (management interface table — no detach operations defined); docs/09 §20 (deletion and lifecycle rules)
  - Problem: detachEvidence() in skillRepository.js has 0 callers; no route, no test, and no documented use case reaches it. The frozen management contract defines no detach operations (evidence association is attach-only). The function is dead code.
  - Evidence: rg -n "skillRepo\.detachEvidence" src tests → no matches; rg -n "detachEvidence" src → definitions at src/repositories/skillRepository.js:101 and src/repositories/claimRepository.js:87 (the claimRepository copy is MOD-006's dossier concern).
  - Proposed change: Remove detachEvidence() from skillRepository.js (and its export). Per the corrected abstraction test: unreachable → DELETE. Do not add routes or callers to justify it (no traced requirement demands detach operations).
  - Data-flow impact: None — the function is not called.
  - Isolation impact: None — the function is not part of any data flow.
  - Risk if skipped: Dead code remains; a future pass could mistake the junction-table DELETE statement for a live detach path.
  - Verification: rg -n "detachEvidence" src/repositories/skillRepository.js → no matches after removal.
  - Rollback: restore the function and its export.

No entries for the single-caller functions (create, update, remove, attachEvidence) — all are route-reachable module public surface methods; the corrected test's ≥2-caller rule does not apply to them, and no caller count is a test of a public surface method.

## Task F — Verification matrix for MOD-003

| Ledger entry | Test that proves it | Command to run | Expected output |
|--------------|---------------------|----------------|-----------------|
| ADJ-003-001 | Search for skill detach usage | `rg -n "skillRepo\.detachEvidence" src tests` | No matches found |
| ADJ-003-001 | Search for the definition | `rg -n "detachEvidence" src/repositories/skillRepository.js` | Line 101 (definition) until removed |

## Task G — What I could not verify

- Pagination and search: FR-010 is P1-deferred (docs/16 ledger Section 8); listAll/listPublished return unbounded result sets. Deferred per the frozen design; no open work recorded in this dossier.

## Pass Closure — MOD-003 dissection, 2026-10-10
- Methodology: the corrected dissection methodology (ADJ-004-013; scope qualifier mandatory).
- ADJ-003-001: DONE — DELETE disposition executed (detachEvidence() and its export removed from src/repositories/skillRepository.js; rg "detachEvidence" src/repositories/skillRepository.js → zero occurrences; 35/35 tests pass; lint clean). Open finding carried forward: claimRepository.js:87 (detachEvidence, 0 callers) is MOD-006's dossier concern.
- Source files changed by this pass: src/repositories/skillRepository.js (dead-code removal only; no behaviour change — the removed function had 0 callers).
- MOD-003 entry status: DONE 1 (ADJ-003-001); WONTFIX — JUSTIFIED 0; PROPOSED 0; BLOCKED 0.
- MOD-003 ledger complete; next module is MOD-006.
