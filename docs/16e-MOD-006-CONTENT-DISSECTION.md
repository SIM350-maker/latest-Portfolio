# MOD-006 Content Management Dissection

Methodology: the dissection methodology as corrected by ADJ-004-013 (docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5, corrected abstraction test with the mandatory scope qualifier). The scope qualifier is applied to every abstraction-test result in this dossier.

## Task A — File inventory for this module

| Path | Purpose | Inbound refs | Outbound refs | Verdict |
|------|---------|--------------|---------------|---------|
| src/repositories/claimRepository.js | CRUD for claims (content-managed per docs/09 §13); publication-state management; evidence linkage (claim_evidence junction) | src/routes/manageRoutes.js, tests/constraints.test.js | ../config/database | KEEP |
| src/views/manage/claims/list.ejs | All claims incl. drafts, create form, evidence linking (private) | src/routes/manageRoutes.js:304, 325 | partials | KEEP |
| src/routes/manageRoutes.js (claim, publish/unpublish, preview sections) | Private management surface for claims, publication state, and previews | src/app.js:106 (mount) | repositories, views | KEEP |

## Task B — Data-flow traces for this module

### 1. Claims dashboard (GET /manage/claims)
  HTTP request → middleware chain (app.js) → auth guard (manageRoutes.js:52)
    → route handler (src/routes/manageRoutes.js:301-306)
    → repository calls (claimRepository.js:5-8 listAll; :73-78 listEvidence per claim at manageRoutes.js:303)
    → SQL statements (paste verbatim)
      SELECT * FROM claim ORDER BY created_at DESC, id DESC
      SELECT e.* FROM evidence e JOIN claim_evidence ce ON ce.evidence_id = e.id WHERE ce.claim_id = ? ORDER BY e.created_at DESC, e.id DESC
    → view model (manageRoutes.js:304) → template (src/views/manage/claims/list.ejs)
    → HTTP response (200; Cache-Control: no-store)

### 2. Claim create (POST /manage/claims)
    → route handler (src/routes/manageRoutes.js:308-337)
    → validation (requireText/optionalText manageRoutes.js:310-311; requireEnum for source_entity_type :315; source-existence check :318-321 via projectRepo/skillRepo/profileRepo)
    → repository call (claimRepository.js:25-37 create — INSERT with publication_state 'Draft')
    → SQL statement: INSERT INTO claim (statement, justification, source_entity_type, source_entity_id, publication_state) VALUES (?, ?, ?, ?, 'Draft')
    → HTTP response (303 See Other to /manage/claims; 400 with field errors on validation failure)

### 3. Claim delete (POST /manage/claims/:id/delete) — existence check added per ADJ-004-010
    → route handler (src/routes/manageRoutes.js:339-344)
    → repository call (claimRepository.js:66-70 remove)
    → SQL statement: DELETE FROM claim WHERE id = ?
    → SQLite constraint touched: claim_evidence ON DELETE CASCADE (claims deletion cascades to its evidence links only; evidence rows survive)
    → HTTP response (303 See Other to /manage/claims; 404 when the claim does not exist — verified per ADJ-004-010)

### 4. Claim publish/unpublish (POST /manage/claims/:id/publish, /unpublish)
    → route handlers (src/routes/manageRoutes.js:346-358)
    → repository call (claimRepository.js:56-60 setPublicationState)
    → SQL statement: UPDATE claim SET publication_state = ? WHERE id = ?
    → HTTP response (303 See Other to /manage/claims)

### 5. Attach evidence to claim (POST /manage/claims/:id/evidence)
    → route handler (src/routes/manageRoutes.js:360-369)
    → validation (claim existence :362-363; evidence existence :364-365)
    → repository call (claimRepository.js:81-85 attachEvidence — INSERT OR IGNORE into claim_evidence)
    → SQL statement: INSERT OR IGNORE INTO claim_evidence (claim_id, evidence_id) VALUES (?, ?)
    → HTTP response (303 See Other to /manage/claims)

### 6. Preview draft (GET /manage/preview/project/:id, /preview/skill/:id)
    → route handlers (src/routes/manageRoutes.js:424-446)
    → repository calls (projectRepo/skillRepo getById + listClaims(onlyPublished=false) + listEvidence + listSkills)
    → HTTP response (200; drafts visible only behind the authenticated /manage boundary)

## Task C — Module dossier for MOD-006

### 1. Responsibility
MOD-006 Content Management provides the private interface for CRUD operations on all content entities (profile, project, skill, claim) and publication state management (FR-005). Claims are content-managed (docs/09 §13). This dossier covers the claim repository and the claim/publish/preview management surface; the profile, project, and skill repositories are dissected in MOD-001 (docs/16b), MOD-002 (docs/16c), and MOD-003 (docs/16d) respectively.

### 2. Public surface (routes, functions, exported symbols, with file:line)
- Routes (claim, publication, preview):
  - GET /manage/claims (src/routes/manageRoutes.js:301)
  - POST /manage/claims (src/routes/manageRoutes.js:308)
  - POST /manage/claims/:id/delete (src/routes/manageRoutes.js:339)
  - POST /manage/claims/:id/publish (src/routes/manageRoutes.js:346)
  - POST /manage/claims/:id/unpublish (src/routes/manageRoutes.js:353)
  - POST /manage/claims/:id/evidence (src/routes/manageRoutes.js:360)
  - GET /manage/preview/project/:id (src/routes/manageRoutes.js:424)
  - GET /manage/preview/skill/:id (src/routes/manageRoutes.js:436)
- Functions (claimRepository):
  - listAll() (src/repositories/claimRepository.js:5)
  - listPublished() (src/repositories/claimRepository.js:10)
  - getById(id) (src/repositories/claimRepository.js:15)
  - create(data) (src/repositories/claimRepository.js:25)
  - update(id, changes) (src/repositories/claimRepository.js:39)
  - setPublicationState(id, state) (src/repositories/claimRepository.js:56)
  - remove(id) (src/repositories/claimRepository.js:66)
  - listEvidence(claimId) (src/repositories/claimRepository.js:73)
  - attachEvidence(claimId, evidenceId) (src/repositories/claimRepository.js:81)
  - detachEvidence(claimId, evidenceId) (src/repositories/claimRepository.js:87)
  - listByEvidence(evidenceId) (src/repositories/claimRepository.js:94)
- Exported symbols (src/repositories/claimRepository.js:101-104): listAll, listPublished, getById, create, update, setPublicationState, remove, listEvidence, attachEvidence, detachEvidence, listByEvidence

### 3. Internal collaborators (with file:line)
- src/config/database.js:22 (connectDB; singleton connection)
- src/db/schema.sql (claim DDL, claim_evidence with ON DELETE CASCADE)
- src/lib/validation.js (ValidationError; CLAIM_SOURCES)

### 4. Forbidden collaborators (with the reason)
- None within the module: claimRepository depends on database/config only. The claim-create route validates sources via projectRepo/skillRepo/profileRepo (manageRoutes.js:318-321) — route-layer composition of sibling repositories, not a repository dependency.

### 5. Data it owns (tables, columns, invariants — paste the relevant DDL)
```sql
CREATE TABLE IF NOT EXISTS claim (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_entity_type TEXT CHECK (source_entity_type IN ('profile','project','skill')),
    source_entity_id INTEGER,
    statement TEXT NOT NULL,
    justification TEXT,
    publication_state TEXT NOT NULL DEFAULT 'Draft' CHECK (publication_state IN ('Draft','Published','Archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
Invariants: publication_state ∈ ('Draft','Published','Archived'); claims create as 'Draft' (claimRepository.js:28); a claim may exist without evidence (frozen business rule, claimRepository.js:21); claim deletion cascades to claim_evidence links only (schema ON DELETE CASCADE).

### 6. Data it reads but does not own
- evidence table (listEvidence via claim_evidence join)
- profile/project/skill tables (source-existence validation at the claim-create route, manageRoutes.js:318-321)

### 7. Failure modes (each mapped to an HTTP status or thrown error type)
- ValidationError (400): missing statement, invalid source type, non-existent source (manageRoutes.js:310-321)
- NotFoundError (404): claim not found on delete (added per ADJ-004-010), evidence not found on attach (manageRoutes.js:365), preview of missing record
- OperationalError (500): SQLite errors (caught and rethrown in database.js:47-50)

### 8. Isolation test plan: the minimal tests that prove this module works end-to-end WITHOUT any other module implemented
Stubs/fakes required: fake better-sqlite3 connection implementing prepare/run/get/all/lastInsertRowid/changes with the claim, evidence, claim_evidence DDL and CASCADE behaviour.
Justification: the stub fakes only the external persistence layer, not the module's logic.
Tests needed: claim create/list/delete over HTTP with a session; existence check on delete (404, added per ADJ-004-010 and verified in tests/content.test.js); validation failures (400); publication state transitions. Note: the existing suite covers the core of this (tests/content.test.js, tests/constraints.test.js).

### 9. Build order: the exact sequence from empty directory to passing isolation test
1. Install dependencies
2. src/config/database.js (connectDB)
3. src/lib/validation.js
4. src/db/schema.sql (claim, evidence, claim_evidence)
5. src/repositories/claimRepository.js
6. src/views/manage/claims/list.ejs
7. HTTP tests with tests/helpers.js
8. npm test

### 10. Deletion candidates: anything not required by a traced requirement
- detachEvidence (src/repositories/claimRepository.js:87-91): 0 callers; the frozen contract (docs/10 §7) defines no detach operations. → ADJ-006-002.
- listByEvidence (src/repositories/claimRepository.js:94-99): 0 callers; duplicates evidenceRepository.listClaims (the live reverse-traceability query, manageRoutes.js:375). → ADJ-006-003.
- listPublished (src/repositories/claimRepository.js:10-13): 0 callers; public claim rendering is embedded via projectRepo.listClaims/skillRepo.listClaims (filtered to Published with onlyPublished=true); no public route lists claims standalone. → ADJ-006-004.

## Task D — Scrutiny findings for MOD-006

Files examined: src/repositories/claimRepository.js, src/views/manage/claims/list.ejs, the claim/publish/preview sections of src/routes/manageRoutes.js.

### Dead code test
- detachEvidence: 0 callers. → ADJ-006-002.
- listByEvidence: 0 callers (rg -n "claimRepo\.listByEvidence" src tests → no matches); duplicates evidenceRepository.listClaims (SELECT c.* FROM claim c JOIN claim_evidence ce … WHERE ce.evidence_id = ? — the same query, live at manageRoutes.js:375). → ADJ-006-003.
- listPublished: 0 callers (rg -n "claimRepo\.listPublished" src tests → no matches). → ADJ-006-004.
- update: 0 callers — but this is NOT dead code: the frozen contract defines its consumer. → ADJ-006-001.
- All other functions are used: listEvidence (6), listAll (3), getById (2), setPublicationState (2), create (1), remove (1), attachEvidence (1).

### Missing-route test (implementation vs frozen contract)
- docs/10 §7 line 74 defines `POST /manage/claims/:id` (Update claim → UpdateContent, FR-003). The implementation has no such route (manageRoutes.js claim section defines only delete/publish/unpublish/evidence for claims/:id). claimRepo.update (claimRepository.js:39-54) is consequently unreachable. → ADJ-006-001. The frozen design speaks: the route is defined in the contract, so the change is to implement it, not to delete the repository method.

### Duplication test
- listByEvidence duplicates evidenceRepository.listClaims (identical SQL, reverse traceability) — a cross-repository duplication where only one copy is live. Resolved by the ADJ-006-003 DELETE disposition.

### Framework-convenience test (does it hide a data flow?)
- No. All SQL is explicit and parameterized.

### Dependency test (actually imported?)
- Yes: claimRepository is imported in manageRoutes.js:10.

### Abstraction test (corrected — scope qualifier mandatory)
Classification applied before the ≥2-caller rule:
- listAll, getById, setPublicationState, listEvidence: module public surface methods reachable from routes — reachable → KEEP (caller counts 2-6 in any case).
- create, remove, attachEvidence: module public surface methods reachable from routes (manageRoutes.js:334, 341, 366) — reachable → KEEP-WITH-JUSTIFICATION. 1 caller each.
- update: unreachable from a route today, BUT the frozen contract (docs/10 §7 line 74) defines the route that reaches it — classified public surface per the documented use case; the finding is the missing route (ADJ-006-001), not the method.
- detachEvidence, listByEvidence, listPublished: unreachable from a route, a test, or a documented use case → internal helpers → 0 callers → DELETE. → ADJ-006-002, 003, 004.

### Template test (rendered by a route?)
- manage/claims/list.ejs by manageRoutes.js:304 and :325. Pass.

### Route test (handler + test + documented contract?)
- POST /manage/claims/:id/delete: documented docs/10 §7 line 75; existence check added and verified per ADJ-004-010 (tests/content.test.js).
- POST /manage/claims, GET /manage/claims: documented docs/10 §7; tested across the suite.
- POST /manage/claims/:id: documented docs/10 §7 line 74 — NOT implemented. → ADJ-006-001.

### Middleware test (registered? order justified?)
- All claim/publish/preview routes run behind requireAuth (manageRoutes.js:52). Pass.

### Configuration test (env var read, documented, validated at boot?)
- Not applicable at module level. Pass.

### Naming test (matches domain vocabulary in docs/05?)
- "claim" matches docs/05/09 domain vocabulary (Claim with source_entity_type/source_entity_id, statement, justification, publication_state). Pass.

### Honesty test (any public rendering implying verifiability for Private/Redacted/Unavailable evidence?)
- Claim rendering is embedded in public detail views via onlyPublished=true queries; drafts never render publicly. Preview is behind the authenticated boundary. Pass.

## Task E — Ledger entries for MOD-006

### ADJ-006-001
  - Status: PROPOSED → DONE (2026-10-10) — the route was implemented per the frozen contract.
  - Result: POST /manage/claims/:id implemented (src/routes/manageRoutes.js:339-357), mirroring the claims section's create-route pattern: requireText/optionalText validation on statement/justification (1000/5000 caps), 400 with the claims list view and field errors on validation failure, then `claimRepo.update(id, { statement, justification })` with a NotFoundError (404) when the claim does not exist (manageRoutes.js:354), 303 redirect to /manage/claims. claimRepo.update (claimRepository.js:39-54) is now reachable. No GET counterpart added (docs/10 §7 defines no GET /manage/claims/:id route).
  - Verification output, pasted verbatim:
    Command: npx jest tests/content.test.js — "Test Suites: 1 passed, 1 total / Tests: 9 passed, 9 total" (three new tests: "updates an existing claim via POST /manage/claims/:id (MOD-006-001)" asserting 303 + location /manage/claims + the persisted change; "returns 400 with field errors when updating a claim without a statement (MOD-006-001)" asserting 400 + 'This field is required.'; "returns 404 when updating a non-existent claim (MOD-006-001)" asserting 404 + '404 — Not found').
    Command: npm test — "Test Suites: 6 passed, 6 total / Tests: 38 passed, 38 total / Time: 6.241 s".
    Command: npm run lint — clean.
    Command: rg -n "claimRepo\.update" src tests — "src\routes\manageRoutes.js:354:    if (claimRepo.update(id, { statement, justification }) === 0 && !claimRepo.getById(id)) {" (the method is now reachable from the route).
  - Type: Missing route (implementation gap vs frozen contract)
  - Module: MOD-006
  - Layer: presentation (management)
  - Traces to: docs/10 §7 line 74 (`POST /manage/claims/:id` — Update claim → UpdateContent, FR-003); docs/10 §8 (UpdateContent command handler)
  - Problem: The frozen contract defines POST /manage/claims/:id (Update claim) but the implementation has no such route. claimRepo.update (claimRepository.js:39-54) is consequently unreachable (0 callers).
  - Evidence: docs/10-INTERFACE-AND-API-DESIGN.md line 74, quoted verbatim: "| POST | `/manage/claims/:id` | Update claim | UpdateContent | FR-003 |"; rg -n "claims/:id" src/routes/manageRoutes.js → only delete (339), publish (347), unpublish (354), evidence (361) — no update route; rg -n "claimRepo\.update" src tests → no matches.
  - Proposed change: Implement POST /manage/claims/:id per docs/10 §7 — claim-edit flow rendering the claim form (GET counterpart is not in the contract; reuse the POST /manage/claims list view pattern with a claim-edit mode), requireText/optionalText validation on statement/justification, then claimRepo.update(id, changes), 303 redirect to /manage/claims, 404 when the claim does not exist. Do NOT delete claimRepo.update: the frozen contract defines its consumer.
  - Data-flow impact: Adds the UpdateContent claim flow; claimRepo.update becomes reachable.
  - Isolation impact: None — one route plus its repository call.
  - Risk if skipped: The frozen contract (docs/10 §7) is unimplemented; FR-003 claim CRUD is incomplete (create/delete/publish exist; update does not); claimRepo.update remains unreachable.
  - Verification: a test that POSTs an update to an existing claim via /manage/claims/:id and asserts 303 plus the persisted change; a test that POSTs to a non-existent claim id and asserts 404.
  - Rollback: remove the route; claimRepo.update returns to unreachable.

### ADJ-006-002
  - Status: PROPOSED → DONE (2026-10-10) — DELETE disposition executed.
  - Result: detachEvidence() removed from src/repositories/claimRepository.js (function and export removed; module.exports is now `{ listAll, getById, create, update, setPublicationState, remove, listEvidence, attachEvidence }`). No route or caller was added.
  - Verification output, pasted verbatim:
    Command: rg -n "detachEvidence|listByEvidence|listPublished" src/repositories/claimRepository.js — no output (exit 1; zero occurrences of all three removed symbols).
    Command: npm test — "Test Suites: 6 passed, 6 total / Tests: 38 passed, 38 total / Time: 6.798 s".
    Command: npm run lint — clean.
  - Type: Dead code
  - Module: MOD-006
  - Layer: persistence
  - Traces to: docs/10 §7 (management interface table — no detach operations defined)
  - Problem: detachEvidence() in claimRepository.js has 0 callers; no route, no test, and no documented use case reaches it. The frozen contract defines no detach operations (evidence association is attach-only). The function is dead code.
  - Evidence: rg -n "claimRepo\.detachEvidence" src tests → no matches; rg -n "detachEvidence" src → definitions at src/repositories/claimRepository.js:87 (this entry) and src/repositories/skillRepository.js (removed per ADJ-003-001).
  - Proposed change: Remove detachEvidence() from claimRepository.js (and its export). Per the corrected abstraction test: unreachable → DELETE. Do not add routes or callers to justify it.
  - Data-flow impact: None — the function is not called.
  - Isolation impact: None.
  - Risk if skipped: Dead code remains; a future pass could mistake the junction-table DELETE statement for a live detach path.
  - Verification: rg -n "detachEvidence" src/repositories/claimRepository.js → no matches after removal.
  - Rollback: restore the function and its export.

### ADJ-006-003
  - Status: PROPOSED → DONE (2026-10-10) — DELETE disposition executed.
  - Result: listByEvidence() removed from src/repositories/claimRepository.js (function and export removed). The cross-repository duplication is resolved: the reverse-traceability direction is served by the live evidenceRepository.listClaims (manageRoutes.js:375). No route or caller was added.
  - Verification output, pasted verbatim:
    Command: rg -n "detachEvidence|listByEvidence|listPublished" src/repositories/claimRepository.js — no output (exit 1; zero occurrences of all three removed symbols).
    Command: npm test — "Test Suites: 6 passed, 6 total / Tests: 38 passed, 38 total / Time: 6.798 s".
    Command: npm run lint — clean.
  - Type: Dead code (and duplication)
  - Module: MOD-006
  - Layer: persistence
  - Traces to: FR-003 (bidirectional traceability — served by evidenceRepository.listClaims, the live copy); docs/10 §7 (no reverse-direction public operation defined)
  - Problem: listByEvidence() in claimRepository.js has 0 callers and duplicates evidenceRepository.listClaims (identical SQL: SELECT c.* FROM claim c JOIN claim_evidence ce … WHERE ce.evidence_id = ?). The reverse traceability direction is served live by evidenceRepository.listClaims (manageRoutes.js:375); no route, test, or documented use case reaches claimRepository's copy.
  - Evidence: rg -n "claimRepo\.listByEvidence" src tests → no matches; evidenceRepository.js:48-53 (listClaims, live caller manageRoutes.js:375); claimRepository.js:94-99 (listByEvidence, identical SQL shape).
  - Proposed change: Remove listByEvidence() from claimRepository.js (and its export). Per the corrected abstraction test: unreachable → DELETE; the duplication is resolved by keeping the live copy.
  - Data-flow impact: None — the function is not called.
  - Isolation impact: None.
  - Risk if skipped: A duplicate dead copy of a live query remains; future passes could maintain both copies and diverge them.
  - Verification: rg -n "listByEvidence" src/repositories/claimRepository.js → no matches after removal.
  - Rollback: restore the function and its export.

### ADJ-006-004
  - Status: PROPOSED → DONE (2026-10-10) — DELETE disposition executed.
  - Result: listPublished() removed from src/repositories/claimRepository.js (function and export removed). Public claim rendering remains embedded via the publication-filtered queries (publicRoutes.js:45, 73). No route or caller was added; no behaviour invented for the docs/10 §8 "GetClaims" listing.
  - Verification output, pasted verbatim:
    Command: rg -n "detachEvidence|listByEvidence|listPublished" src/repositories/claimRepository.js — no output (exit 1; zero occurrences of all three removed symbols).
    Command: npm test — "Test Suites: 6 passed, 6 total / Tests: 38 passed, 38 total / Time: 6.798 s".
    Command: npm run lint — clean.
  - Type: Dead code
  - Module: MOD-006
  - Layer: persistence
  - Traces to: docs/10 §6 (public read table — no standalone claims-list route); docs/10 §8 (GetClaims is consumed via the embedded, publication-filtered claim queries)
  - Problem: listPublished() in claimRepository.js has 0 callers. Public claim rendering is embedded: projectRepo.listClaims(project.id, true) and skillRepo.listClaims(skill.id, true) (publicRoutes.js:45, 73) filter to Published at the SQL level; no public route lists claims standalone.
  - Evidence: rg -n "claimRepo\.listPublished" src tests → no matches; publicRoutes.js:45, 73 (onlyPublished=true embedded queries); docs/10 §6 public read table has no GET /claims route.
  - Proposed change: Remove listPublished() from claimRepository.js (and its export). Per the corrected abstraction test: unreachable from a route, test, or documented use case → DELETE. Note on the docs/10 §8 "GetClaims" listing: the embedded publication-filtered claim queries implement claim retrieval; the standalone all-published-claims query is not consumed.
  - Data-flow impact: None — the function is not called.
  - Isolation impact: None.
  - Risk if skipped: Dead code remains.
  - Verification: rg -n "listPublished" src/repositories/claimRepository.js → no matches after removal.
  - Rollback: restore the function and its export.

## Task F — Verification matrix for MOD-006

| Ledger entry | Test that proves it | Command to run | Expected output |
|--------------|---------------------|----------------|-----------------|
| ADJ-006-001 | Search for the claims/:id update route | `rg -n "claims/:id\(\d" src/routes/manageRoutes.js` | Only delete/publish/unpublish/evidence until implemented |
| ADJ-006-001 | Search for claimRepo.update callers | `rg -n "claimRepo\.update" src tests` | No matches found |
| ADJ-006-002 | Search for claim detach usage | `rg -n "claimRepo\.detachEvidence" src tests` | No matches found |
| ADJ-006-003 | Search for listByEvidence callers | `rg -n "claimRepo\.listByEvidence" src tests` | No matches found |
| ADJ-006-004 | Search for listPublished callers | `rg -n "claimRepo\.listPublished" src tests` | No matches found |

## Task G — What I could not verify

- Whether docs/10 §8's "GetClaims" public query name maps to a future standalone claims endpoint or to the embedded queries: the implementation uses the embedded publication-filtered queries (publicRoutes.js:45, 73); docs/10 §6 defines no standalone claims route. Recorded in ADJ-006-004; no behaviour invented.

## Pass Closure — MOD-006 dissection, 2026-10-10
- Methodology: the corrected dissection methodology (ADJ-004-013; scope qualifier mandatory).
- ADJ-006-001: DONE — POST /manage/claims/:id implemented per docs/10 §7 line 74 (manageRoutes.js:339-357; claimRepo.update now reachable; 38/38 tests pass; lint clean).
- ADJ-006-002, ADJ-006-003, ADJ-006-004: DONE — DELETE dispositions executed (detachEvidence, listByEvidence, listPublished removed from src/repositories/claimRepository.js; rg "detachEvidence|listByEvidence|listPublished" src/repositories/claimRepository.js → zero occurrences; 38/38 tests pass; lint clean).
- Source files changed by this pass: src/routes/manageRoutes.js (one new route per the frozen contract); src/repositories/claimRepository.js (dead-code removal only; no behaviour change — the removed functions had 0 callers); tests/content.test.js (three new tests).
- MOD-006 entry status: DONE 4 (ADJ-006-001, 002, 003, 004); WONTFIX — JUSTIFIED 0; PROPOSED 0; BLOCKED 0.
- MOD-006 ledger complete; next module is MOD-005.
