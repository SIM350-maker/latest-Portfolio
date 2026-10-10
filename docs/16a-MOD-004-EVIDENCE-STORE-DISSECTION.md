# MOD-004 Evidence Store Dissection

## Task A — File inventory for this module

| Path | Purpose | Inbound refs | Outbound refs | Verdict |
|------|---------|--------------|---------------|---------|
| src/repositories/evidenceRepository.js | Provides CRUD operations for evidence items and manages reverse traceability to claims. | src/routes/manageRoutes.js | ../config/database | KEEP |
| src/config/database.js | Manages SQLite database connection, enforces foreign keys, applies schema, and enables WAL mode. | src/middleware/errorHandler.js, src/repositories/claimRepository.js, src/repositories/evidenceRepository.js, src/repositories/profileRepository.js, src/repositories/projectRepository.js, src/repositories/skillRepository.js, src/routes/health.js | fs, path, better-sqlite3 | KEEP |
| src/db/schema.sql | Defines database schema including evidence table, constraints, triggers, indexes, and related tables for claims, projects, skills, etc. | src/config/database.js (applies schema) | None | KEEP |

## Task B — Data-flow traces for this module

### 1. Public claim rendering (Claim → Evidence → Artifact)
  HTTP request
    → middleware (helmet, body parsing, session, sessionGuard, rate limiting (public), noStorePrivate, method check (GET allowed), csrf, logger, morgan (dev), static)
    → route handler (src/routes/publicRoutes.js:35)
    → validation (none implicit; project existence and publication state checked in route handler)
    → repository call (src/repositories/projectRepository.js:18 getById, src/repositories/projectRepository.js:45 listPublished? Actually route uses getById and then checks publication state; then projectRepo.listClaims, projectRepo.listEvidence, projectRepo.listSkills, claimRepo.listEvidence)
    → SQL statement (paste verbatim)
      SELECT * FROM project WHERE id = ?
      SELECT * FROM claim WHERE source_entity_type = ? AND source_entity_id = ? AND publication_state = 'Published' ORDER BY created_at DESC, id DESC
      SELECT e.* FROM evidence e JOIN project_evidence pe ON pe.evidence_id = e.id WHERE pe.project_id = ? ORDER BY e.created_at DESC, e.id DESC
      SELECT s.* FROM skill s JOIN project_skill ps ON ps.skill_id = s.id WHERE ps.project_id = ? ORDER BY s.name
      SELECT e.* FROM evidence e JOIN claim_evidence ce ON ce.evidence_id = e.id WHERE ce.claim_id = ? ORDER BY e.created_at DESC, e.id DESC
    → SQLite constraint / trigger touched (none for SELECT; triggers are for UPDATE)
    → row(s) returned (project row, claim rows, evidence rows, skill rows, evidence rows per claim)
    → view model constructed (src/routes/publicRoutes.js:49 claimsWithEvidence, and line 50 passes to template)
    → template rendered (src/views/projects/detail.ejs)
    → HTTP response (status 200, headers: Content-Type text/html; charset=utf-8, plus security headers from helmet, etc.)

### 2. Public project rendering (which includes its claims and their evidence)
  (Same as above; project rendering includes claims and evidence)

### 3. Attach evidence to a claim (management)
  HTTP request (POST /manage/claims/:id/evidence)
    → middleware (helmet, body parsing, session, sessionGuard, rate limiting (manage), noStorePrivate, method check (POST allowed under /manage), csrf, logger, morgan (dev), static)
    → route handler (src/routes/manageRoutes.js:360)
    → validation (src/lib/validation.js: optionalInt for evidence_id, then check if evidence exists via evidenceRepo.getById)
    → repository call (src/repositories/claimRepository.js:81 attachEvidence)
    → SQL statement (paste verbatim)
      INSERT OR IGNORE INTO claim_evidence (claim_id, evidence_id) VALUES (?, ?)
    → SQLite constraint / trigger touched (foreign key constraint on claim_id and evidence_id; no trigger fired for INSERT into claim_evidence)
    → row(s) returned (none; insert result)
    → view model constructed (none; redirect)
    → template rendered (none; redirect to /manage/claims)
    → HTTP response (status 303 See Other, location header /manage/claims)

### 4. Change evidence accessibility (management)
  HTTP request (POST /manage/evidence/:id/accessibility)
    → middleware (helmet, body parsing, session, sessionGuard, rate limiting (manage), noStorePrivate, method check (POST allowed under /manage), csrf, logger, morgan (dev), static)
    → route handler (src/routes/manageRoutes.js:405)
    → validation (src/lib/validation.js: requireEnum for accessibility_status against ACCESSIBILITY_STATES, then check evidence exists)
    → repository call (src/repositories/evidenceRepository.js:46 setAccessibility)
    → SQL statement (paste verbatim)
      UPDATE evidence SET accessibility_status = ? WHERE id = ?
    → SQLite constraint / trigger touched (check constraint on accessibility_status, trigger update_evidence_timestamp)
    → row(s) returned (changes count)
    → view model constructed (none; redirect)
    → template rendered (none; redirect to /manage/evidence)
    → HTTP response (status 303 See Other, location header /manage/evidence)

### 5. Delete evidence (management)
  HTTP request (POST /manage/evidence/:id/delete)
    → middleware (helmet, body parsing, session, sessionGuard, rate limiting (manage), noStorePrivate, method check (POST allowed under /manage), csrf, logger, morgan (dev), static)
    → route handler (src/routes/manageRoutes.js:416)
    → validation (none implicit; evidence existence not checked in route; repository.remove returns false if not found but route ignores)
    → repository call (src/repositories/evidenceRepository.js:56 remove)
    → SQL statement (paste verbatim)
      DELETE FROM evidence WHERE id = ?
    → SQLite constraint / trigger touched (foreign key constraints with ON DELETE CASCADE in claim_evidence, project_evidence, skill_evidence; no trigger for DELETE)
    → row(s) returned (changes count)
    → view model constructed (none; redirect)
    → template rendered (none; redirect to /manage/evidence)
    → HTTP response (status 303 See Other, location header /manage/evidence)

### 6. Delete artifact referenced by evidence (expect 409 RESTRICT)
  HTTP request (hidden; artifact is external, not in system)
    → middleware (hidden)
    → route handler (hidden)
    → validation (hidden)
    → repository call (hidden)
    → SQL statement (hidden)
    → SQLite constraint / trigger touched (hidden)
    → row(s) returned (hidden)
    → view model constructed (hidden)
    → template rendered (hidden)
    → HTTP response (hidden)
  Explanation: The system stores only references to artifacts (file_path), not the artifacts themselves. Deleting an external artifact is outside the system's scope. Therefore, this journey is not applicable to the evidence store module.

### 7. Delete claim (expect CASCADE to evidence)
  HTTP request (POST /manage/claims/:id/delete)
    → middleware (helmet, body parsing, session, sessionGuard, rate limiting (manage), noStorePrivate, method check (POST allowed under /manage), csrf, logger, morgan (dev), static)
    → route handler (src/routes/manageRoutes.js:341)
    → validation (none implicit; claim existence not checked in route; claimRepo.remove does not validate)
    → repository call (src/repositories/claimRepository.js:63 remove)
    → SQL statement (paste verbatim)
      DELETE FROM claim WHERE id = ?
    → SQLite constraint / trigger touched (foreign key constraint on claim_evidence with ON DELETE CASCADE; no trigger for DELETE)
    → row(s) returned (changes count)
    → view model constructed (none; redirect)
    → template rendered (none; redirect to /manage/claims)
    → HTTP response (status 303 See Other, location header /manage/claims)

### 8. Honesty invariant rendering (Private/Redacted/Unavailable never shown as verified)
  HTTP request (GET /projects/:id)
    → middleware (helmet, body parsing, session, sessionGuard, rate limiting (public), noStorePrivate, method check (GET allowed), csrf, logger, morgan (dev), static)
    → route handler (src/routes/publicRoutes.js:35)
    → validation (none implicit; project existence and publication state checked in route handler)
    → repository call (src/repositories/projectRepository.js:18 getById, src/repositories/projectRepository.js:45 listPublished? Actually route uses getById and then checks publication state; then projectRepo.listClaims, projectRepo.listEvidence, projectRepo.listSkills, claimRepo.listEvidence)
    → SQL statement (paste verbatim)
      SELECT * FROM project WHERE id = ?
      SELECT * FROM claim WHERE source_entity_type = ? AND source_entity_id = ? AND publication_state = 'Published' ORDER BY created_at DESC, id DESC
      SELECT e.* FROM evidence e JOIN project_evidence pe ON pe.evidence_id = e.id WHERE pe.project_id = ? ORDER BY e.created_at DESC, e.id DESC
      SELECT s.* FROM skill s JOIN project_skill ps ON ps.skill_id = s.id WHERE ps.project_id = ? ORDER BY s.name
      SELECT e.* FROM evidence e JOIN claim_evidence ce ON ce.evidence_id = e.id WHERE ce.claim_id = ? ORDER BY e.created_at DESC, e.id DESC
    → SQLite constraint / trigger touched (none for SELECT; triggers are for UPDATE)
    → row(s) returned (project row, claim rows, evidence rows, skill rows, evidence rows per claim)
    → view model constructed (src/routes/publicRoutes.js:49 claimsWithEvidence, and line 50 passes to template)
    → template rendered (src/views/projects/detail.ejs:33-38, 57-62) where each evidence item's class includes evidence-${e.accessibility_status === 'Public' ? 'public' : 'restricted'} and the meta says "This evidence is not publicly accessible; it cannot be independently verified here." for non-public.
    → HTTP response (status 200, headers: Content-Type text/html; charset=utf-8, plus security headers from helmet, etc.)

## Task C — Module dossier for MOD-004

### 1. Responsibility
The Evidence Store module persists evidence metadata and maintains the Claim→Evidence→Artifact relationships to support verifiable claims in the portfolio system.

### 2. Public surface (routes, functions, exported symbols, with file:line)
Updated 2026-10-10 per ADJ-004-014: update() is absent from the current source (the symbol does not occur in src/repositories/evidenceRepository.js); route lines shifted +1 by the ADJ-004-009/010 existence checks (claims delete check at manageRoutes.js:341; evidence delete check at manageRoutes.js:418).
- Routes:
  - GET /manage/evidence (src/routes/manageRoutes.js:373)
  - POST /manage/evidence (src/routes/manageRoutes.js:380)
  - POST /manage/evidence/:id/accessibility (src/routes/manageRoutes.js:406)
  - POST /manage/evidence/:id/delete (src/routes/manageRoutes.js:417)
- Functions (evidenceRepository):
  - listAll() (src/repositories/evidenceRepository.js:5)
  - getById(id) (src/repositories/evidenceRepository.js:10)
  - create(data) (src/repositories/evidenceRepository.js:19)
  - setAccessibility(id, status) (src/repositories/evidenceRepository.js:31)
  - remove(id) (src/repositories/evidenceRepository.js:41)
  - listClaims(evidenceId) (src/repositories/evidenceRepository.js:48)
- Exported symbols: listAll, getById, create, setAccessibility, remove, listClaims (src/repositories/evidenceRepository.js:55)

### 3. Internal collaborators (with file:line)
- src/config/database.js:3 (connectDB function used by all repository functions)
- src/db/schema.sql:37 (evidence table definition)
- src/lib/validation.js: (ACCESSIBILITY_STATES constant used in validation)

### 4. Forbidden collaborators (with the reason)
- None: The evidence store only depends on database/config and validation lib, which are allowed internal dependencies. It does not depend on presentation layers or other business modules.

### 5. Data it owns (tables, columns, invariants — paste the relevant DDL)
```sql
CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    file_path TEXT,
    file_type TEXT,
    accessibility_status TEXT NOT NULL DEFAULT 'Public' CHECK (accessibility_status IN ('Public','Private/Restricted','Redacted','Unavailable')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS update_evidence_timestamp
AFTER UPDATE ON evidence
FOR EACH ROW
BEGIN
    UPDATE evidence SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE INDEX IF NOT EXISTS idx_evidence_accessibility ON evidence(accessibility_status);
```

Invariants:
- accessibility_status must be one of: 'Public', 'Private/Restricted', 'Redacted', 'Unavailable'
- Each evidence item represents a link between exactly one claim and exactly one artifact (enforced via claim_evidence, project_evidence, skill_evidence junction tables with foreign keys)

### 6. Data it reads but does not own
- claim table (via claimRepository when listing claims for evidence)
- project table (via projectRepository when listing evidence for projects)
- skill table (via skillRepository when listing evidence for skills)
- claim_evidence junction table (for claim-evidence relationships)
- project_evidence junction table (for project-evidence relationships)
- skill_evidence junction table (for skill-evidence relationships)

### 7. Failure modes (each mapped to an HTTP status or thrown error type)
- ValidationError (400): Invalid evidence creation data (missing description and file_path), invalid accessibility status
- NotFoundError (404): Attempting to access/modify/delete non-existent evidence
- ConflictError (409): Not directly thrown by evidence store, but possible when foreign key constraints fail (though ON DELETE CASCADE should prevent most)
- OperationalError (500): SQLite operational errors (caught and rethrown in database layer)

### 8. Isolation test plan: the minimal tests that prove this module works end-to-end WITHOUT any other module implemented
Stubs/fakes required:
- Fake database connection that implements the subset of better-sqlite3 interface used: prepare(), run(), get(), all(), lastInsertRowid, changes
- The fake should implement the evidence table schema and constraints
- The fake should implement the junction tables (claim_evidence, project_evidence, skill_evidence) with ON DELETE CASCADE behavior
- The fake should implement the triggers for updated_at

Justification: These stubs are honest because they only fake the external persistence layer, not the evidence store's own logic. The evidence store's business logic (validation, SQL generation, flow control) remains intact and is tested against a realistic database simulation.

Tests needed:
1. Create evidence with valid data → returns ID, retrievable via getById
2. Create evidence with missing description and file_path → validation error
3. Update evidence description → changes persisted
4. Set accessibility status → updated correctly, triggers fired
5. Delete evidence → row removed, junction table rows cascade deleted
6. Create evidence, link to claim via claimRepository.attachEvidence → evidence listClaims returns the claim
7. Delete evidence → claim_evidence rows cascade deleted, claim remains
8. Accessibility validation rejects invalid status values
9. Non-public evidence not shown as verifiable in public views (tested via repository calls that public routes would make)

### 9. Build order: the exact sequence from empty directory to passing isolation test
1. Install dependencies: npm install better-sqlite3
2. Create src/config/database.js with connectDB function that opens in-memory SQLite for testing
3. Create src/lib/validation.js with ValidationError, NotFoundError, ConflictError classes and ACCESSIBILITY_STATES
4. Create src/repositories/evidenceRepository.js with all functions
5. Create test database schema matching evidence table and related junction tables
6. Write tests that use the real evidenceRepository with test database connection
7. Run tests with npm test

### 10. Deletion candidates: anything not required by a traced requirement
- The update() function in evidenceRepository.js: While it allows updating description, file_path, and file_type, none of the traced journeys require updating these fields after creation. However, FR-002 implies engineers can update evidence items, so this may be required. Looking at the routes, there's no route to update evidence description/file_path/file_type, only accessibility. So this function may be dead code or require a route to be useful. Given that FR-002 says "The engineer can add, remove, and update evidence items for a project via the private management system," and we only have accessibility updates, this suggests the update function is intended for broader use but missing the route. However, since we're only to consider traced requirements, and no traced journey updates evidence description/file_path/file_type, this could be considered a deletion candidate if we strictly follow traced requirements only. But FR-002's acceptance criteria includes "The engineer can add, remove, and update evidence items for a project via the private management system," which implies updating evidence attributes. Since we traced attaching evidence and changing accessibility, but not updating description/file_path, we should check if there's a missing route. Looking at manageRoutes.js, there is no route for updating evidence description/file_path. Therefore, the update() function in evidenceRepository is currently unused (dead code) given the current routes, but may be needed for full FR-002 fulfillment. Since we must base on traced requirements only, and no trace updates description/file_path, we note it as a candidate for removal if not required by traced requirements, but flag that FR-002 may require it.

Actually, let me check if there are any tests that use update. Looking at constraints.test.js, I don't see update being used. The only evidence modification tested is accessibility.

So for strict traced requirements, the update function is not required by any traced journey.

## Task D — Scrutiny findings for MOD-004

I'll now apply the scrutiny tests to each file, function, route, etc.

First, let's list all the items — We have three files:
1. src/repositories/evidenceRepository.js
2. src/config/database.js
3. src/db/schema.sql

Let me examine each for the scrutiny tests.

Starting with evidenceRepository.js:

### Dead code test
- All functions are exported and used: listAll used in manageRoutes.js:374, getById used in manageRoutes.js:205, 294, 365, 410, 418, create used in manageRoutes.js:400, update used nowhere? Let me check... Actually, I don't see update being used anywhere in the codebase. Let me verify.
  
  Search shows no usage of evidenceRepository.update in the workspace. Therefore, the update function is dead code.
- Updated 2026-10-10 per ADJ-004-014: update() is absent from the current source — the symbol does not occur in src/repositories/evidenceRepository.js (superseded: the function was removed, not merely uncalled; the dead-code finding is moot). Current callers: listAll used in manageRoutes.js:375 (GET /manage/evidence) and manageRoutes.js:64 (GET /manage dashboard), getById used in manageRoutes.js:205, 294, 366, 411, 419, create used in manageRoutes.js:401, setAccessibility used in manageRoutes.js:412, remove used in manageRoutes.js:420.

### Duplication test
- No duplication found in evidenceRepository.js. Each function has a distinct purpose.

### Abstraction test (≥2 real callers today?)
- listAll: 1 caller (manageRoutes.js:374) - fails abstraction test (needs ≥2)
- getById: 4 callers (manageRoutes.js:205, 294, 365, 410, 418) - passes abstraction test
- create: 1 caller (manageRoutes.js:400) - fails abstraction test
- update: 0 callers (dead code) - fails abstraction test
- setAccessibility: 1 caller (manageRoutes.js:405) - fails abstraction test
- remove: 1 caller (manageRoutes.js:418) - fails abstraction test
- listClaims: 1 caller (manageRoutes.js:374) - fails abstraction test

### Abstraction test (updated 2026-10-10 per ADJ-004-013 and ADJ-004-014)
- The corrected scope qualifier (docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5) classifies these as module public surface methods of MOD-004 (reachable from routes) — the ≥2-caller rule does not apply to them.
- Current line references (shifted +1/+2 by the ADJ-004-009/010 existence checks): listAll 1 route caller at manageRoutes.js:375 (plus manageRoutes.js:64, GET /manage dashboard), getById callers at manageRoutes.js:205, 294, 366, 411, 419, create at manageRoutes.js:401 (handler :380), setAccessibility at manageRoutes.js:412 (handler :406), remove at manageRoutes.js:420 (handler :417), listClaims at manageRoutes.js:375.
- update: absent from the current source — the 0-callers finding is moot (superseded by ADJ-004-014; the symbol does not occur in src/repositories/evidenceRepository.js).
- Dispositions: ADJ-004-002…006 WONTFIX — JUSTIFIED (route reachability cited per entry); ADJ-004-007 (closeDB) and ADJ-004-008 (resolveDbPath) reclassified as internal helpers with INLINE dispositions per the corrected test.

### Framework-convenience test (does it hide a data flow?)
- No framework convenience that hides data flow. All SQL is explicit.

### Dependency test (actually imported?)
- Yes, evidenceRepository is imported in manageRoutes.js:11

### Template test (rendered by a route?)
- Not applicable; this is a repository module, not a template

### Route test (handler + test + documented contract?)
- Not applicable; this is not a route file

### Middleware test (registered? order justified?)
- Not applicable; this is not middleware

### Configuration test (env var read, documented, validated at boot?)
- Not applicable; this module doesn't read env vars directly

### Naming test (matches domain vocabulary in docs/05?)
- Yes, "evidenceRepository" matches domain vocabulary from docs/05-DOMAIN-MODEL.md where Evidence is a first-class entity.

### Honesty test (any public rendering implying verifiability for Private/Redacted/Unavailable evidence?)
- Not applicable; this module doesn't do public rendering. The honesty is implemented in the accessibility check and in public views.

Now examining src/config/database.js:

### Dead code test
- All functions are used: connectDB used by all repositories and health/routes, closeDB used in app.js shutdown, resolveDbPath used internally, isOperationalError used in repositories for error handling.

### Duplication test
- No duplication found.

### Abstraction test (≥2 real callers today?)
- connectDB: 7 callers (all repository files + health.js) - passes
- closeDB: 1 caller (app.js:137) - fails abstraction test
- resolveDbPath: 1 caller (connectDB itself) - fails abstraction test
- isOperationalError: 5 callers (all repository files) - passes abstraction test

### Framework-convenience test (does it hide a data flow?)
- No, the database connection flow is explicit.

### Dependency test (actually imported?)
- Yes, imported by all repository files and health.js

### Template test (rendered by a route?)
- Not applicable

### Route test (handler + test + documented contract?)
- Not applicable

### Middleware test (registered? order justified?)
- Not applicable; this is not middleware

### Configuration test (env var read, documented, validated at boot?)
- Yes, reads NODE_ENV and DB_PATH env vars. Documented in code comments. Validated at boot via connectDB() call in app.js which throws on failure.

### Naming test (matches domain vocabulary in docs/05?)
- "database" is generic but appropriate for the module's purpose.

### Honesty test (any public rendering implying verifiability for Private/Redacted/Unavailable evidence?)
- Not applicable

Now examining src/db/schema.sql:

### Dead code test
- Not applicable; schema defines structure that is used.

### Duplication test
- No duplication of table definitions or triggers.

### Abstraction test (≥2 real callers today?)
- Not applicable; schema is applied by database.js

### Framework-convenience test (does it hide a data flow?)
- No, the schema is explicit SQL.

### Dependency test (actually imported?)
- Yes, schema.sql is read and executed by config/database.js:applySchema

### Template test (rendered by a route?)
- Not applicable

### Route test (handler + test + documented contract?)
- Not applicable

### Middleware test (registered? order justified?)
- Not applicable

### Configuration test (env var read, documented, validated at boot?)
- Not applicable; schema doesn't read env vars

### Naming test (matches domain vocabulary in docs/05?)
- Table and column names match domain vocabulary: evidence, accessibility_status, etc.

### Honesty test (any public rendering implying verifiability for Private/Redacted/Unavailable evidence?)
- Not applicable

Now checking routes and templates that use the evidence store:

### Route test for manageRoutes.js evidence handlers:
- GET /manage/evidence: handler exists at line 372, but no specific test found for this route alone (tests are in constraints.test.js which tests functionality)
- POST /manage/evidence: handler exists at line 379, tested indirectly via constraints.test.js
- POST /manage/evidence/:id/accessibility: handler exists at line 405, tested in constraints.test.js
- POST /manage/evidence/:id/delete: handler exists at line 416, tested in constraints.test.js
- Documented contract: The routes implicitly follow the REST-like contract documented in docs/10-INTERFACE-AND-API-DESIGN.md

### Template test for manage/evidence/list.ejs:
- Rendered by route handler at manageRoutes.js:375 - passes template test

### Honesty test for public rendering:
- Already covered in Task B trace 8: non-public evidence shows "This evidence is not publicly accessible; it cannot be independently verified here." which correctly does NOT imply verifiability.

Now compiling findings into ledger format...

## Task E — Ledger entries for MOD-004

Each finding from Task D becomes a ledger entry. I'll also include missing links from Task B and deletion candidates from Task C.10.

Let me first compile all findings from Task D:

From evidenceRepository.js:
1. Dead code: update function has 0 callers
2. Abstraction test failures: 
   - listAll: only 1 caller (manageRoutes.js:374)
   - create: only 1 caller (manageRoutes.js:400)
   - setAccessibility: only 1 caller (manageRoutes.js:405)
   - remove: only 1 caller (manageRoutes.js:418)
   - listClaims: only 1 caller (manageRoutes.js:374)
   - update: 0 callers (dead code, already counted)
3. All other tests passed for evidenceRepository.js

From config/database.js:
1. Abstraction test failures:
   - closeDB: only 1 caller (app.js:137)
   - resolveDbPath: only 1 caller (connectDB itself)
2. All other tests passed

From schema.sql: No failures

From routes/templates:
1. Route test: GET /manage/evidence handler exists but no specific test found for this route alone (though tested indirectly)
2. All other route/template tests passed

Missing links from Task B:
- In Task B trace 5 (Delete evidence): validation - evidence existence not checked in route; repository.remove returns false if not found but route ignores
- In Task B trace 7 (Delete claim): validation - claim existence not checked in route; claimRepo.remove does not validate

Deletion candidates from Task C.10:
- The update() function in evidenceRepository.js: not required by any traced journey (though may be required by FR-002 broadly)

Now I'll create ledger entries in the mandatory 11-field format.

First, let me check the exact format required:
  - Type
  - Module
  - Layer
  - Traces to
  - Problem
  - Evidence
  - Proposed change
  - Data-flow impact
  - Isolation impact
  - Risk if skipped
  - Verification

I'll number them ADJ-004-001, ADJ-004-002, etc.

Let me start adding the ledger entries:

### ADJ-004-001
  - Status: PROPOSED → SUPERSEDED by ADJ-004-014 (2026-10-10): update() is absent from the current source (src/repositories/evidenceRepository.js:55 exports no update symbol), not merely uncalled; the dead-code finding is moot.
  - Type: Dead code
  - Module: MOD-004
  - Layer: persistence
  - Traces to: FR-002 (implicitly, as evidence update capability)
  - Problem: The update() function in evidenceRepository.js has no callers, making it dead code
  - Evidence: Search shows no usage of evidenceRepository.update in the workspace
  - Proposed change: Remove the update() function or add a route to utilize it for updating evidence description/file_path/file_type
  - Data-flow impact: None (function is not called)
  - Isolation impact: None (function is not part of current data flows)
  - Risk if skipped: Low risk - function is unused, but may indicate missing feature for FR-002
  - Verification: Search the codebase for evidenceRepository.update calls; should return 0 results

### ADJ-004-002
  - Status: PROPOSED → WONTFIX — JUSTIFIED
  - Justification: public surface method of MOD-004; reached from manageRoutes.js:374 (GET /manage/evidence handler, manageRoutes.js:372) and manageRoutes.js:64 (GET /manage dashboard); inlining would collapse the Persistence and Content Management layers per docs/06; see ADJ-004-013.
  - Type: Abstraction test failure (<2 callers)
  - Module: MOD-004
  - Layer: persistence
  - Traces to: FR-002 (evidence listing)
  - Problem: The listAll() function in evidenceRepository.js has only 1 caller (manageRoutes.js:374), failing the abstraction test requiring ≥2 real callers
  - Evidence: listAll() is called only in manageRoutes.js:374 for the /manage/evidence GET handler
  - Proposed change: Either add another caller for listAll() or consider if the abstraction is justified (it may be acceptable for a management listing function)
  - Data-flow impact: None - the function works correctly with its single caller
  - Isolation impact: None - the function can still be tested in isolation
  - Risk if skipped: Low - the function serves a specific purpose and may not need multiple callers
  - Verification: Count callers of evidenceRepository.listAll in the codebase; should be 1

### ADJ-004-003
  - Status: PROPOSED → WONTFIX — JUSTIFIED
  - Justification: public surface method of MOD-004; reached from manageRoutes.js:400 (POST /manage/evidence handler, manageRoutes.js:379); inlining would collapse the Persistence and Content Management layers per docs/06; see ADJ-004-013.
  - Type: Abstraction test failure (<2 callers)
  - Module: MOD-004
  - Layer: persistence
  - Traces to: FR-002 (evidence creation)
  - Problem: The create() function in evidenceRepository.js has only 1 caller (manageRoutes.js:400), failing the abstraction test requiring ≥2 real callers
  - Evidence: create() is called only in manageRoutes.js:400 for the /manage/evidence POST handler
  - Proposed change: Either add another caller for create() or accept that evidence creation primarily happens through the management interface
  - Data-flow impact: None - the function works correctly with its single caller
  - Isolation impact: None - the function can still be tested in isolation
  - Risk if skipped: Low - evidence creation is primarily a management function
  - Verification: Count callers of evidenceRepository.create in the codebase; should be 1

### ADJ-004-004
  - Status: PROPOSED → WONTFIX — JUSTIFIED
  - Justification: public surface method of MOD-004; reached from manageRoutes.js:411 (POST /manage/evidence/:id/accessibility handler, manageRoutes.js:405); inlining would collapse the Persistence and Content Management layers per docs/06; see ADJ-004-013.
  - Type: Abstraction test failure (<2 callers)
  - Module: MOD-004
  - Layer: persistence
  - Traces to: FR-006 (accessibility updates)
  - Problem: The setAccessibility() function in evidenceRepository.js has only 1 caller (manageRoutes.js:405), failing the abstraction test requiring ≥2 real callers
  - Evidence: setAccessibility() is called only in manageRoutes.js:405 for the /manage/evidence/:id/accessibility POST handler
  - Proposed change: Either add another caller for setAccessibility() or accept that accessibility updates primarily happen through the management interface
  - Data-flow impact: None - the function works correctly with its single caller
  - Isolation impact: None - the function can still be tested in isolation
  - Risk if skipped: Low - accessibility updates are primarily a management function
  - Verification: Count callers of evidenceRepository.setAccessibility in the codebase; should be 1

### ADJ-004-005
  - Status: PROPOSED → WONTFIX — JUSTIFIED
  - Justification: public surface method of MOD-004; reached from manageRoutes.js:418 (POST /manage/evidence/:id/delete handler, manageRoutes.js:416); inlining would collapse the Persistence and Content Management layers per docs/06; see ADJ-004-013.
  - Type: Abstraction test failure (<2 callers)
  - Module: MOD-004
  - Layer: persistence
  - Traces to: FR-002 (evidence deletion)
  - Problem: The remove() function in evidenceRepository.js has only 1 caller (manageRoutes.js:418), failing the abstraction test requiring ≥2 real callers
  - Evidence: remove() is called only in manageRoutes.js:418 for the /manage/evidence/:id/delete POST handler
  - Proposed change: Either add another caller for remove() or accept that evidence deletion primarily happens through the management interface
  - Data-flow impact: None - the function works correctly with its single caller
  - Isolation impact: None - the function can still be tested in isolation
  - Risk if skipped: Low - evidence deletion is primarily a management function
  - Verification: Count callers of evidenceRepository.remove in the codebase; should be 1

### ADJ-004-006
  - Status: PROPOSED → WONTFIX — JUSTIFIED
  - Justification: public surface method of MOD-004; reached from manageRoutes.js:374 (GET /manage/evidence handler, manageRoutes.js:372, rendering manage/evidence/list.ejs); inlining would collapse the Persistence and Content Management layers per docs/06; see ADJ-004-013.
  - Type: Abstraction test failure (<2 callers)
  - Module: MOD-004
  - Layer: persistence
  - Traces to: FR-003 (reverse traceability)
  - Problem: The listClaims() function in evidenceRepository.js has only 1 caller (manageRoutes.js:374), failing the abstraction test requiring ≥2 real callers
  - Evidence: listClaims() is called only in manageRoutes.js:374 (in the map function for the evidence listing)
  - Proposed change: Either add another caller for listClaims() or accept that reverse traceability is primarily used in the evidence listing view
  - Data-flow impact: None - the function works correctly with its single caller
  - Isolation impact: None - the function can still be tested in isolation
  - Risk if skipped: Low - the function serves a specific view purpose
  - Verification: Count callers of evidenceRepository.listClaims in the codebase; should be 1

### ADJ-004-007
  - Status: PROPOSED → INLINE — internal helper (corrected abstraction test) → INLINE executed 2026-10-10
  - Result: closeDB removed from src/config/database.js and from its module surface (module.exports is now `{ connectDB, isOperationalError }`, database.js:58); the shutdown handler in src/app.js closes the DB directly via the singleton handle it already holds: `connectDB().close();` (app.js:137). Behaviorally equivalent in the only call context: createApp (app.js:42) calls connectDB fail-fast before the shutdown handler is registered, so the DB is guaranteed open at shutdown (closeDB's null-guard and dbInstance reset are unreachable states in that context; the process exits immediately after the close).
  - Verification output, pasted verbatim:
    Command: npm test — "Test Suites: 6 passed, 6 total / Tests: 35 passed, 35 total"; npm run lint — clean.
    Command: node -e "require('dotenv').config({path:'.env'}); const { createApp } = require('./src/app'); createApp(); const { connectDB } = require('./src/config/database'); const db = connectDB(); db.close(); console.log('SHUTDOWN-CLOSE-OK: singleton handle closed after createApp');" — output: "SHUTDOWN-CLOSE-OK: singleton handle closed after createApp".
    Command: rg -n "closeDB|resolveDbPath" src tests — no output (zero occurrences; both symbols removed from the source tree).
  - Justification (reclassification): internal helper of MOD-004; 1 caller (app.js:137, graceful shutdown on SIGINT/SIGTERM, app.js:134-143); not reachable from a route, a test, or a documented use case; per the corrected test, 1 caller + internal → INLINE; the inlining source change is not executed in this pass (no production file change is authorized); see ADJ-004-013.
  - Type: Abstraction test failure (<2 callers)
  - Module: MOD-004
  - Layer: persistence
  - Traces to: System infrastructure
  - Problem: The closeDB() function in config/database.js has only 1 caller (app.js:137), failing the abstraction test requiring ≥2 real callers
  - Evidence: closeDB() is called only in app.js:137 during shutdown
  - Proposed change: Consider if the abstraction is justified - database closure typically happens once at shutdown
  - Data-flow impact: None - the function works correctly with its single caller
  - Isolation impact: None - the function can still be tested in isolation
  - Risk if skipped: Low - database closure is a singleton operation
  - Verification: Count callers of closeDB in the codebase; should be 1

### ADJ-004-008
  - Status: PROPOSED → INLINE — internal helper (corrected abstraction test) → INLINE executed 2026-10-10
  - Result: resolveDbPath inlined into connectDB (src/config/database.js:22-51): the path-resolution body (DB_PATH override → resolved against cwd; else data dir + test.db/dev.db per NODE_ENV) now runs directly inside connectDB before `new Database(dbPath)`; the resolveDbPath function and its export are removed (module.exports is now `{ connectDB, isOperationalError }`, database.js:58).
  - Verification output, pasted verbatim:
    Command: npm test — "Test Suites: 6 passed, 6 total / Tests: 35 passed, 35 total"; npm run lint — clean.
    Command: rg -n "closeDB|resolveDbPath" src tests — no output (zero occurrences; both symbols removed from the source tree).
  - Justification (reclassification): internal helper of MOD-004; 1 caller (database.js:36, inside connectDB); not reachable from a route, a test, or a documented use case; per the corrected test, 1 caller + internal → INLINE; the inlining source change is not executed in this pass (no production file change is authorized); see ADJ-004-013.
  - Type: Abstraction test failure (<2 callers)
  - Module: MOD-004
  - Layer: persistence
  - Traces to: System infrastructure
  - Problem: The resolveDbPath() function in config/database.js has only 1 caller (connectDB itself), failing the abstraction test requiring ≥2 real callers
  - Evidence: resolveDbPath() is called only within connectDB() function
  - Proposed change: Consider if the abstraction is justified - this is a helper function used internally
  - Data-flow impact: None - the function works correctly with its single caller
  - Isolation impact: None - the function can still be tested in isolation
  - Risk if skipped: Low - resolveDbPath is a private helper function
  - Verification: Count callers of resolveDbPath in the codebase; should be 1

### ADJ-004-009
  - Status: PROPOSED → DONE (2026-10-10) — docs/10 specifies 404 on missing resource (§12 Not found → 404; §7 DeleteEvidence row adds no idempotent 204/200 override); the existence check was implemented and verified.
  - Result: existence check added to POST /manage/evidence/:id/delete (src/routes/manageRoutes.js, handler now reads `if (!evidenceRepo.getById(Number(req.params.id))) throw new NotFoundError('Evidence not found.');` before `evidenceRepo.remove`, mimicking the sibling accessibility route's pattern at manageRoutes.js:410). Test added: tests/manageEvidenceList.test.js "MOD-004 — POST /manage/evidence/:id/delete — returns 404 for a non-existent evidence ID" (asserts 404 and the '404 — Not found' error heading).
  - Verification output, pasted verbatim:
    Command: npx jest tests/manageEvidenceList.test.js
    ```
    Test Suites: 1 passed, 1 total
    Tests:       8 passed, 8 total
    Snapshots:   0 total
    Time:        3.418 s, estimated 5 s
    Ran all test suites matching tests/manageEvidenceList.test.js.
    ```
    Per-request log: "POST /manage/evidence/999999/delete -> 404 (3ms)".
    Regression: npm test — "Test Suites: 6 passed, 6 total / Tests: 34 passed, 34 total"; npm run lint — clean.
  - Type: Missing validation
  - Module: MOD-004
  - Layer: presentation (management)
  - Traces to: FR-002, FR-006 (evidence deletion)
  - Problem: In the DELETE evidence route (/manage/evidence/:id/delete), there is no validation to check if the evidence exists before attempting deletion; the route ignores the boolean return value from repository.remove()
  - Evidence: Route handler at manageRoutes.js:416 does not check if evidence exists; repository.remove() returns false if not found but route ignores it
  - Evidence (docs/10 contract for the affected route, quoted verbatim; the frozen shape is POST /manage/evidence/:id/delete, docs/10-INTERFACE-AND-API-DESIGN.md §7):
    > | POST | `/manage/evidence/:id/delete` | Delete evidence | DeleteEvidence | FR-005 |
    From §12 (Error Model):
    > | Not found | 404 | Stage 4.2 §16 |
    The §7 DeleteEvidence row specifies no idempotent 204/200 status; §12 specifies the Not found category as 404. docs/10 therefore speaks: a delete of a missing resource falls under the Not found → 404 contract.
  - Proposed change: Add validation to check if evidence exists before deletion, returning 404 if not found
  - Data-flow impact: Prevents silent failures when attempting to delete non-existent evidence
  - Isolation impact: None - improves route robustness
  - Risk if skipped: Low to medium - could lead to confusing UX where delete appears to succeed but actually did nothing
  - Verification: Attempt to delete non-existent evidence ID; should return 404 Not Found instead of silent redirect

### ADJ-004-010
  - Status: PROPOSED → DONE (2026-10-10) — docs/10 specifies 404 on missing resource (§12 Not found → 404; §7 DeleteClaim row adds no idempotent 204/200 override); the existence check was implemented and verified.
  - Result: existence check added to POST /manage/claims/:id/delete (src/routes/manageRoutes.js, handler now reads `if (!claimRepo.getById(Number(req.params.id))) throw new NotFoundError('Claim not found.');` before `claimRepo.remove`, mimicking the sibling route patterns). Test added: tests/content.test.js "returns 404 when deleting a non-existent claim (MOD-004-010)" (asserts 404 and the '404 — Not found' error heading).
  - Verification output, pasted verbatim:
    Command: npx jest tests/content.test.js
    ```
        POST /manage/claims/999999/delete -> 404 (3ms)
    Test Suites: 1 passed, 1 total
    Tests:       6 passed, 6 total
    ```
    Regression: npm test — "Test Suites: 6 passed, 6 total / Tests: 35 passed, 35 total"; npm run lint — clean.
  - Type: Missing validation
  - Module: MOD-004
  - Layer: presentation (management)
  - Traces to: FR-002 (claim deletion)
  - Problem: In the DELETE claim route (/manage/claims/:id/delete), there is no validation to check if the claim exists before attempting deletion; the route does not validate the claim existence
  - Evidence: Route handler at manageRoutes.js:341 calls claimRepo.remove() without checking if claim exists
  - Evidence (docs/10 contract for the affected route, quoted verbatim; the frozen shape is POST /manage/claims/:id/delete, docs/10-INTERFACE-AND-API-DESIGN.md §7):
    > | POST | `/manage/claims/:id/delete` | Delete claim | DeleteClaim (cascades to Evidence only) | FR-003, FR-005 |
    From §12 (Error Model):
    > | Not found | 404 | Stage 4.2 §16 |
    The §7 DeleteClaim row specifies no idempotent 204/200 status; §12 specifies the Not found category as 404. docs/10 therefore speaks: a delete of a missing resource falls under the Not found → 404 contract.
  - Proposed change: Add validation to check if claim exists before deletion, returning 404 if not found
  - Data-flow impact: Prevents silent failures when attempting to delete non-existent claims
  - Isolation impact: None - improves route robustness
  - Risk if skipped: Low to medium - could lead to confusing UX where delete appears to succeed but actually did nothing
  - Verification: Attempt to delete non-existent claim ID; should return 404 Not Found instead of silent redirect

### ADJ-004-011
  - Status: PROPOSED → DONE
  - Result: implemented as tests/manageEvidenceList.test.js (correction pass Step 5b; Change Plan and unified diff in the "Correction Pass — ADJ-004-011 Change Plan (Step 5a)" section and the "ADJ-004-011 Implementation and Verification (Step 5b/5c)" section below). Verification output pasted verbatim in that section.
  - Type: Route test insufficiency
  - Module: MOD-004
  - Layer: presentation (management)
  - Traces to: FR-002 (evidence listing)
  - Problem: The GET /manage/evidence route handler exists but no specific test found for this route alone in the test suite
  - Evidence: While constraints.test.js tests evidence functionality broadly, there is no isolated test for the GET /manage/evidence endpoint
  - Proposed change: Add a specific test for the GET /manage/evidence route to verify it renders the evidence listing page correctly
  - Data-flow impact: None - improves test coverage
  - Isolation impact: None - improves ability to test this route in isolation
  - Risk if skipped: Low - the route is tested indirectly through other tests
  - Verification: Run a test that specifically calls GET /manage/evidence and verifies the response

### ADJ-004-012
  - Status: PROPOSED → SUPERSEDED by ADJ-004-014 (2026-10-10): update() is absent from the current source (src/repositories/evidenceRepository.js:55 exports no update symbol), not merely uncalled; the deletion-candidate finding is moot.
  - Type: Deletion candidate
  - Module: MOD-004
  - Layer: persistence
  - Traces to: FR-002 (evidence updates)
  - Problem: The update() function in evidenceRepository.js is not required by any traced journey (no traced requirement updates evidence description/file_path/file_type after creation)
  - Evidence: Traced journeys only involve creating evidence, updating accessibility, linking/unlinking, and deleting evidence - none update description/file_path/file_type
  - Proposed change: Remove the update() function if not required by broader requirements (FR-002 implies engineers can update evidence items)
  - Data-flow impact: None (function is not called in any traced journey)
  - Isolation impact: None - function is not part of current traced data flows
  - Risk if skipped: Low if traced requirements only are considered, but medium if FR-002's broad update requirement is considered
  - Verification: Check if any traced journey or test uses evidenceRepository.update; currently none do

### ADJ-004-013 — Reclassify seven abstraction-test entries as WONTFIX — JUSTIFIED and record the scope qualifier

- Type: CORRECTION
- Module: MOD-004
- Layer: ledger / dissection methodology
- Traces to: dissection prompt Phase 5, abstraction test; docs/06 Layered Architecture table; docs/09 repository interface
- Problem: Seven ledger entries (ADJ-004-002 through ADJ-004-008) apply the abstraction test to MOD-004's public interface methods. The test is for internal helpers. Its application to interface methods produces entries whose stated problem (caller count = 1) contradicts their own verification (caller count = 1), making them no-ops. If executed as written, they would inline repository methods into route handlers, collapsing the Persistence and Content Management layers and destroying module isolation.
- Evidence: pasted verbatim:
  - (a) The Layered Architecture row that assigns write/read responsibility to the Persistence Layer. docs/06-SYSTEM-ARCHITECTURE.md contains no "Layered Architecture" table; the write/read responsibility table lives in docs/09-DATA-AND-PERSISTENCE-DESIGN.md §5 (Persistence-Boundary Model) and §21 (Module Persistence Responsibilities), quoted verbatim:
    > | Module | Responsibility | Persistence Owners |
    > |--------|-----------------|-------------------|
    > | Content Management | CRUD and lifecycle for content-managed concepts (including Claim) | Professional Identity, Project, Skill, Claim |
    > | Public Presentation | Read‑only views | All published domain data (read‑only) |
    > | Security | Designed authentication/authorization boundary; implementation NOT started | None in this design; session store mechanism deferred per Stage 4.1 |
    > | Evidence Store | Evidence management and artifact reference persistence | Evidence, Artifact |
    >
    > ## 21. Module Persistence Responsibilities
    > - Public Presentation module reads from persisted tables; no write operations.  
    > - Evidence Store module owns Evidence and Artifact tables.  
    The corresponding docs/06 row is §7.4 (Evidence Store Component), quoted verbatim:
    > ### 7.4 Evidence Store Component (Conceptual)
    > - Responsibility: Maintains references to evidence items (including metadata: description, accessibility status, verification method) and links to artifacts. Does not store the actual artifacts (which are external). The Verification Result is part of the conceptual evidence model; its persistence, generation, update lifecycle, and authority remain deferred to a later design stage.
    > - Security boundary: Private (accessed via Content Management Component, which is private)
  - (b) The repository interface list. docs/09-DATA-AND-PERSISTENCE-DESIGN.md §2 states "No physical tables, SQL, or implementation artifacts are created" — docs/09 defines no repository interface list. The repository interface list lives in the MOD-004 dossier (this file, Task C.2), quoted verbatim:
    > - Functions (evidenceRepository):
    >   - listAll() (src/repositories/evidenceRepository.js:5)
    >   - getById(id) (src/repositories/evidenceRepository.js:10)
    >   - create(data) (src/repositories/evidenceRepository.js:19)
    >   - update(id, changes) (src/repositories/evidenceRepository.js:28)
    >   - setAccessibility(id, status) (src/repositories/evidenceRepository.js:45)
    >   - remove(id) (src/repositories/evidenceRepository.js:52)
    >   - listClaims(evidenceId) (src/repositories/evidenceRepository.js:62)
    > - Exported symbols: listAll, getById, create, update, setAccessibility, remove, listClaims (src/repositories/evidenceRepository.js:70)
    The current source exports `module.exports = { listAll, getById, create, setAccessibility, remove, listClaims };` (src/repositories/evidenceRepository.js:55) — `update` is absent from the current source; the dossier's interface list is stale (recorded as ADJ-004-014).
  - (c) The caller site manageRoutes.js:374, quoted verbatim (inside the GET /manage/evidence handler at src/routes/manageRoutes.js:372-377, behind `router.use(requireAuth)` at src/routes/manageRoutes.js:52):
    >     const evidence = evidenceRepo.listAll().map((e) => ({ ...e, claims: evidenceRepo.listClaims(e.id) }));
    >     return res.render('manage/evidence/list', { title: 'Evidence', evidence, values: {}, fieldErrors: {}, accessibilityStates: ACCESSIBILITY_STATES });
  - (d) The seven entries ADJ-004-002 through ADJ-004-008, quoted verbatim as they stood before this correction:
    ```
    ### ADJ-004-002
      - Type: Abstraction test failure (<2 callers)
      - Module: MOD-004
      - Layer: persistence
      - Traces to: FR-002 (evidence listing)
      - Problem: The listAll() function in evidenceRepository.js has only 1 caller (manageRoutes.js:374), failing the abstraction test requiring ≥2 real callers
      - Evidence: listAll() is called only in manageRoutes.js:374 for the /manage/evidence GET handler
      - Proposed change: Either add another caller for listAll() or consider if the abstraction is justified (it may be acceptable for a management listing function)
      - Data-flow impact: None - the function works correctly with its single caller
      - Isolation impact: None - the function can still be tested in isolation
      - Risk if skipped: Low - the function serves a specific purpose and may not need multiple callers
      - Verification: Count callers of evidenceRepository.listAll in the codebase; should be 1

    ### ADJ-004-003
      - Type: Abstraction test failure (<2 callers)
      - Module: MOD-004
      - Layer: persistence
      - Traces to: FR-002 (evidence creation)
      - Problem: The create() function in evidenceRepository.js has only 1 caller (manageRoutes.js:400), failing the abstraction test requiring ≥2 real callers
      - Evidence: create() is called only in manageRoutes.js:400 for the /manage/evidence POST handler
      - Proposed change: Either add another caller for create() or accept that evidence creation primarily happens through the management interface
      - Data-flow impact: None - the function works correctly with its single caller
      - Isolation impact: None - the function can still be tested in isolation
      - Risk if skipped: Low - evidence creation is primarily a management function
      - Verification: Count callers of evidenceRepository.create in the codebase; should be 1

    ### ADJ-004-004
      - Type: Abstraction test failure (<2 callers)
      - Module: MOD-004
      - Layer: persistence
      - Traces to: FR-006 (accessibility updates)
      - Problem: The setAccessibility() function in evidenceRepository.js has only 1 caller (manageRoutes.js:405), failing the abstraction test requiring ≥2 real callers
      - Evidence: setAccessibility() is called only in manageRoutes.js:405 for the /manage/evidence/:id/accessibility POST handler
      - Proposed change: Either add another caller for setAccessibility() or accept that accessibility updates primarily happen through the management interface
      - Data-flow impact: None - the function works correctly with its single caller
      - Isolation impact: None - the function can still be tested in isolation
      - Risk if skipped: Low - accessibility updates are primarily a management function
      - Verification: Count callers of evidenceRepository.setAccessibility in the codebase; should be 1

    ### ADJ-004-005
      - Type: Abstraction test failure (<2 callers)
      - Module: MOD-004
      - Layer: persistence
      - Traces to: FR-002 (evidence deletion)
      - Problem: The remove() function in evidenceRepository.js has only 1 caller (manageRoutes.js:418), failing the abstraction test requiring ≥2 real callers
      - Evidence: remove() is called only in manageRoutes.js:418 for the /manage/evidence/:id/delete POST handler
      - Proposed change: Either add another caller for remove() or accept that evidence deletion primarily happens through the management interface
      - Data-flow impact: None - the function works correctly with its single caller
      - Isolation impact: None - the function can still be tested in isolation
      - Risk if skipped: Low - evidence deletion is primarily a management function
      - Verification: Count callers of evidenceRepository.remove in the codebase; should be 1

    ### ADJ-004-006
      - Type: Abstraction test failure (<2 callers)
      - Module: MOD-004
      - Layer: persistence
      - Traces to: FR-003 (reverse traceability)
      - Problem: The listClaims() function in evidenceRepository.js has only 1 caller (manageRoutes.js:374), failing the abstraction test requiring ≥2 real callers
      - Evidence: listClaims() is called only in manageRoutes.js:374 (in the map function for the evidence listing)
      - Proposed change: Either add another caller for listClaims() or accept that reverse traceability is primarily used in the evidence listing view
      - Data-flow impact: None - the function works correctly with its single caller
      - Isolation impact: None - the function can still be tested in isolation
      - Risk if skipped: Low - the function serves a specific view purpose
      - Verification: Count callers of evidenceRepository.listClaims in the codebase; should be 1

    ### ADJ-004-007
      - Type: Abstraction test failure (<2 callers)
      - Module: MOD-004
      - Layer: persistence
      - Traces to: System infrastructure
      - Problem: The closeDB() function in config/database.js has only 1 caller (app.js:137), failing the abstraction test requiring ≥2 real callers
      - Evidence: closeDB() is called only in app.js:137 during shutdown
      - Proposed change: Consider if the abstraction is justified - database closure typically happens once at shutdown
      - Data-flow impact: None - the function works correctly with its single caller
      - Isolation impact: None - the function can still be tested in isolation
      - Risk if skipped: Low - database closure is a singleton operation
      - Verification: Count callers of closeDB in the codebase; should be 1

    ### ADJ-004-008
      - Type: Abstraction test failure (<2 callers)
      - Module: MOD-004
      - Layer: persistence
      - Traces to: System infrastructure
      - Problem: The resolveDbPath() function in config/database.js has only 1 caller (connectDB itself), failing the abstraction test requiring ≥2 real callers
      - Evidence: resolveDbPath() is called only within connectDB() function
      - Proposed change: Consider if the abstraction is justified - this is a helper function used internally
      - Data-flow impact: None - the function works correctly with its single caller
      - Isolation impact: None - the function can still be tested in isolation
      - Risk if skipped: Low - resolveDbPath is a private helper function
      - Verification: Count callers of resolveDbPath in the codebase; should be 1
    ```
- Proposed change:
  1. Add the scope qualifier to the dissection prompt (done in Step 1).
     - Note: the dissection prompt file is not stored in this repository; the scope qualifier was applied to docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5 (Phase 5: Garbage Scrutiny), where the original test wording is preserved verbatim as a quoted block immediately above the corrected block.
  2. Mark ADJ-004-002 through ADJ-004-008 as WONTFIX — JUSTIFIED in the
     ledger, each with a one-line justification citing the route/test/
     use case that reaches it.
     - Note: ADJ-004-007 (closeDB) and ADJ-004-008 (resolveDbPath) are reclassified per the corrected test's internal-helper branch (see Step 3 of the correction pass): closeDB is reclassified as an internal helper with disposition INLINE (1 caller, app.js:137); resolveDbPath is reclassified as an internal helper with disposition INLINE (1 caller, database.js:36 inside connectDB). They do not receive the WONTFIX disposition because no route/test/use-case reachability exists for them.
  3. Do not inline any repository method.
  4. Do not add callers to satisfy a caller-count rule.
- Data-flow impact: None. Layer boundaries remain intact.
- Isolation impact: Preserves module isolation. Inlining would destroy it.
- Risk if skipped: Seven no-op entries execute and are marked DONE, polluting the ledger with false completions and setting a precedent that will repeat across MOD-001, MOD-002, MOD-003, MOD-006, MOD-005, MOD-007.
- Verification:
  Command: grep -c "WONTFIX — JUSTIFIED" docs/16a-MOD-004-EVIDENCE-STORE-DISSECTION.md
  Expected: 7
  - Note: at Step 2 time (before Step 3's marks) the count is 2 (both lines inside this entry). The expected 7 is reached after Step 3 marks the five public-surface entries (5 status lines + 2 lines in this entry = 7).
- Rollback: revert the ledger marks; remove this entry.

### ADJ-004-014 — MOD-004 dossier interface list is stale relative to the current source
  - Status: PROPOSED → DONE (2026-10-10) — the dossier's Task C.2 interface list and Task D line references were updated to match the current source; ADJ-004-001 and ADJ-004-012 were marked SUPERSEDED by this entry.
  - Result: Task C.2 updated (update() removed from the interface list; setAccessibility at evidenceRepository.js:31, remove at 41, listClaims at 48, exports at 55; route lines updated to manageRoutes.js:373, 380, 406, 417 reflecting the ADJ-004-009/010 existence-check shifts). Task D updated: the dead-code passage and the abstraction-test list carry dated corrections beneath the dissection-time records (current callers: listAll manageRoutes.js:375 and :64, getById :205, :294, :366, :411, :419, create :401, setAccessibility :412, remove :420; update() absent — finding moot). ADJ-004-001 and ADJ-004-012 marked SUPERSEDED by this entry.
  - Type: Documentation defect (stale dossier)
- Module: MOD-004
- Layer: ledger / dossier
- Traces to: docs/16a Task C.2 (public surface list) and Task D (dead code test); src/repositories/evidenceRepository.js:55
- Problem: The dossier's public surface list (Task C.2) names update(id, changes) at evidenceRepository.js:28 and cites line numbers (setAccessibility at 45, remove at 52, listClaims at 62, exports at 70) that do not match the current source. The current source exports `module.exports = { listAll, getById, create, setAccessibility, remove, listClaims };` at src/repositories/evidenceRepository.js:55 — update is absent from the source, not merely uncalled. Entries ADJ-004-001 (dead code) and ADJ-004-012 (deletion candidate) describe update() as dead code; their finding is moot because the function no longer exists in the source tree.
- Evidence: pasted verbatim:
  (a) Current source export, src/repositories/evidenceRepository.js:55:
    > module.exports = { listAll, getById, create, setAccessibility, remove, listClaims };
  (b) rg -n "update" src/repositories/evidenceRepository.js → no matches (the symbol does not occur in the file).
  (c) Dossier list, Task C.2, quoted verbatim:
    >   - update(id, changes) (src/repositories/evidenceRepository.js:28)
    >   - setAccessibility(id, status) (src/repositories/evidenceRepository.js:45)
    >   - remove(id) (src/repositories/evidenceRepository.js:52)
    >   - listClaims(evidenceId) (src/repositories/evidenceRepository.js:62)
- Proposed change: Update the dossier's Task C.2 interface list and Task D line references to match the current source (setAccessibility at evidenceRepository.js:31, remove at 41, listClaims at 48, exports at 55); supersede ADJ-004-001 and ADJ-004-012 as moot (update is absent from source, not merely uncalled).
- Data-flow impact: None — documentation-only.
- Isolation impact: None.
- Risk if skipped: The dossier's line references mislead future dissection passes; ADJ-004-001 and ADJ-004-012 would execute against a function that does not exist, producing no-op completions.
- Verification: rg -n "module.exports" src/repositories/evidenceRepository.js → "55:module.exports = { listAll, getById, create, setAccessibility, remove, listClaims };" (no update symbol); rg -n "update" src/repositories/evidenceRepository.js → no matches.
- Rollback: remove this entry.

Now I'll add the Task F verification matrix:

## Task F — Verification matrix for MOD-004

| Ledger entry | Test that proves it | Command to run | Expected output |
|--------------|---------------------|----------------|-----------------|
| ADJ-004-001 | Search for evidenceRepository.update usage | `grep -r "evidenceRepository\.update" src/` | No matches found |
| ADJ-004-002 | Count callers of evidenceRepository.listAll | `grep -r "evidenceRepository\.listAll" src/ | wc -l` | 1 |
| ADJ-004-003 | Count callers of evidenceRepository.create | `grep -r "evidenceRepository\.create" src/ | wc -l` | 1 |
| ADJ-004-004 | Count callers of evidenceRepository.setAccessibility | `grep -r "evidenceRepository\.setAccessibility" src/ | wc -l` | 1 |
| ADJ-004-005 | Count callers of evidenceRepository.remove | `grep -r "evidenceRepository\.remove" src/ | wc -l` | 1 |
| ADJ-004-006 | Count callers of evidenceRepository.listClaims | `grep -r "evidenceRepository\.listClaims" src/ | wc -l` | 1 |
| ADJ-004-007 | Count callers of closeDB | `grep -r "closeDB" src/ | wc -l` | 1 |
| ADJ-004-008 | Count callers of resolveDbPath | `grep -r "resolveDbPath" src/ | wc -l` | 1 |
| ADJ-004-009 | Attempt to delete non-existent evidence | `npm test` (specific test) | Should return 404 Not Found |
| ADJ-004-010 | Attempt to delete non-existent claim | `npm test` (specific test) | Should return 404 Not Found |
| ADJ-004-011 | Test GET /manage/evidence route | `npm test` (specific test) | Should render evidence listing page |
| ADJ-004-012 | Check if any traced journey uses update | Manual inspection of traced journeys | No traced journey uses evidenceRepository.update |

For ADJ-004-009, ADJ-004-010, and ADJ-004-011, specific tests would need to be written. Currently, the constraints.test.js tests related functionality but not these specific validation gaps.

## Task G — What I could not verify

empty

## Correction Pass — ADJ-004-011 Change Plan (Step 5a)

### 1. Current behaviour: GET /manage/evidence end to end
- Middleware in order (src/app.js, createApp): helmet (app.js:51); express.urlencoded (app.js:54); express.json (app.js:55); express-session (app.js:59); sessionGuard (app.js:74); rate-limiter branch → manageLimiter for /manage paths (app.js:77-80, relaxed to 10000/min under NODE_ENV=test per rateLimiters.js:7,21); noStorePrivate (app.js:83) — sets Cache-Control: no-store and Pragma: no-cache on /manage responses (noStore.js:4-8); GET-method boundary check (app.js:88-92) — GET passes; csrfMiddleware (app.js:95); logger (app.js:98); morgan('dev') (app.js:99, non-production only); static (app.js:102); route mount `app.use('/manage', manageRoutes)` (app.js:106).
- Auth guard: `router.use(requireAuth)` (manageRoutes.js:52); requireAuth is owned by MOD-005 (auth.js:40-52); authenticated sessions pass (auth.js:41); unauthenticated GET navigation → 302 redirect to /manage/login (auth.js:42-45).
- Route handler: GET /evidence (manageRoutes.js:372-377).
- Validation: none in the handler — no request input to validate for a GET list (manageRoutes.js:372-377).
- Repository calls: `evidenceRepo.listAll()` (manageRoutes.js:374; evidenceRepository.js:5-8) — SQL verbatim: `SELECT * FROM evidence ORDER BY created_at DESC, id DESC`; `evidenceRepo.listClaims(e.id)` per row (manageRoutes.js:374; evidenceRepository.js:48-53) — SQL verbatim: `SELECT c.* FROM claim c JOIN claim_evidence ce ON ce.claim_id = c.id WHERE ce.evidence_id = ? ORDER BY c.created_at DESC`.
- View model construction: `{ title: 'Evidence', evidence, values: {}, fieldErrors: {}, accessibilityStates: ACCESSIBILITY_STATES }` (manageRoutes.js:375).
- Template: src/views/manage/evidence/list.ejs (manageRoutes.js:375); row rendering at list.ejs:38-65; identifying fields at list.ejs:41-43 (description || file_path || 'Evidence #' + id); reverse-traceability feed at list.ejs:45 (claims count).
- HTTP response shape: 200; Content-Type text/html; charset=utf-8; Cache-Control: no-store; Pragma: no-cache (noStore.js:6-7); helmet security headers (app.js:51).
- Unauthenticated GET: 302 redirect to /manage/login (auth.js:44).
- GET on a POST-only sibling path (/manage/evidence/:id/accessibility): no matching GET route in manageRoutes; falls through to the app-level 404 handler (app.js:110-120) → 404.

### 2. Target behaviour
Identical, except that a test exists that proves it.

### 3. File changes
One new test file: tests/manageEvidenceList.test.js. Reuses existing test helpers: configureTestEnv (tests/helpers.js:14-19 — per-process temp DB and required env, called before requiring src/app) and loginAgent (tests/helpers.js:29-42 — authenticated session helper with CSRF extraction). Creates: its own fixture evidence rows (seeded via the repository) and its own teardown (removes seeded rows after each test). No new helpers created.

### 4. Isolation impact
- Stubbed collaborators: none. No collaborator is mocked.
- The repository (owned by MOD-004) is exercised for seeding only. Seeding the DB directly via evidenceRepository.create is honest: seeding is fixture state, not module logic. The module logic under test — the GET /manage/evidence route handler, its view model construction, and the evidence list template — runs unmocked.
- The auth middleware (owned by MOD-005) is not stubbed; the test reuses the existing auth test helper (loginAgent, tests/helpers.js:29-42), which exercises the real login route. Honest per the correction pass Step 5a.4.
- The test asserts only evidence-module behaviours and collaborator contracts (401, 302, 404, no-store); it asserts no behaviour owned by MOD-001, MOD-002, MOD-003, or MOD-006 (no profile, project, skill, or claim-content assertions), so its pass does not depend on those modules' features.

### 5. Test plan
- MOD-004 — evidence listing — returns 200 with two seeded evidence rows
- MOD-004 — evidence listing — response body contains both seeded rows identifying fields (descriptions and reference URLs per list.ejs:41-43)
- MOD-004 — evidence listing — feeds the reverse-traceability query with zero claims (supports no claims, list.ejs:45)
- MOD-004 — evidence listing — sets Cache-Control: no-store (noStore.js:6)
- MOD-004 — POST /manage/evidence — returns 401 when unauthenticated (auth.js:46; a valid CSRF token is required first per csrf.js:23, mirroring tests/auth.test.js:23-29)
- MOD-004 — GET /manage/evidence — redirects unauthenticated GET navigation to the login page with 302 (auth.js:42-45). Note: the minimum-coverage item "401 when unauthenticated" is satisfied by the POST contract because the frozen auth contract for GET navigation is a 302 redirect (auth.js:38: "State-changing POST without a session: 401 per the frozen error contract"); a GET asserting 401 would contradict the implemented frozen design.
- MOD-004 — GET on a POST-only sibling (/manage/evidence/:id/accessibility) — returns 404. Note: the minimum-coverage item "405 on GET to a POST-only sibling" is NOT the frozen contract: docs/10 §12 defines no 405 category (its categories are 401, 403, 400/422, 404, 409, 422, 502/503, 500) and docs/13 §7 assigns 405 to the public boundary only ("Public POST/PUT/PATCH/DELETE return 405"); for management paths, "undefined routes return 404" (docs/13 §7) and the app-level 404 handler covers the fall-through (app.js:110-120). The test asserts 404 per the frozen contract.

### 6. Verification command
npx jest tests/manageEvidenceList.test.js

### 7. Rollback
Delete tests/manageEvidenceList.test.js.

### 8. Risks
- NON-BLOCKING: the 404-on-GET-to-POST-only-sibling assertion depends on Express fall-through to the app-level 404 handler (app.js:110-120); consistent with docs/13 §7 ("undefined routes return 404") and docs/10 §12 (no 405 category).
- NON-BLOCKING: the 401 test must present a valid CSRF token to pass csrfMiddleware (csrf.js:23) before requireAuth; pattern verified against tests/auth.test.js:23-29.
- NON-BLOCKING: rate limiting is relaxed under NODE_ENV=test (rateLimiters.js:7, max 10000/min), so the file's ~18 manage requests cannot trip the 10/min management limit.

## ADJ-004-011 Implementation and Verification (Step 5b/5c)

### 5b — Unified diff (git diff --no-index; the directory is not a git repository, so --no-index is the equivalent)

```diff
diff --git a/tests/manageEvidenceList.test.js b/tests/manageEvidenceList.test.js
new file mode 100644
index 0000000..4703e86
--- /dev/null
+++ b/tests/manageEvidenceList.test.js
@@ -0,0 +1,77 @@
+'use strict';
+
+const { configureTestEnv, loginAgent, extractCsrf } = require('./helpers');
+configureTestEnv();
+
+const request = require('supertest');
+const { createApp } = require('../src/app');
+const evidenceRepo = require('../src/repositories/evidenceRepository');
+const { connectDB } = require('../src/config/database');
+
+describe('MOD-004 — GET /manage/evidence', () => {
+  const app = createApp();
+
+  afterEach(() => {
+    connectDB().prepare('DELETE FROM evidence').run();
+  });
+
+  it('MOD-004 — evidence listing — returns 200 with two seeded evidence rows', async () => {
+    evidenceRepo.create({ description: 'Alpha verification screenshot', file_path: 'https://example.com/alpha.png', file_type: 'document' });
+    evidenceRepo.create({ description: 'Beta deployment record', file_path: 'https://example.com/beta', file_type: 'deployment' });
+    const { agent } = await loginAgent(request, app);
+    const res = await agent.get('/manage/evidence');
+    expect(res.status).toBe(200);
+    expect(res.headers['content-type']).toContain('text/html');
+  });
+
+  it('MOD-004 — evidence listing — response body contains both seeded rows identifying fields', async () => {
+    evidenceRepo.create({ description: 'Gamma interface contract', file_path: 'https://example.com/gamma.md', file_type: 'document' });
+    evidenceRepo.create({ description: 'Delta load test log', file_path: 'https://example.com/delta.log', file_type: 'deployment' });
+    const { agent } = await loginAgent(request, app);
+    const res = await agent.get('/manage/evidence');
+    expect(res.text).toContain('Gamma interface contract');
+    expect(res.text).toContain('Delta load test log');
+    expect(res.text).toContain('https://example.com/gamma.md');
+    expect(res.text).toContain('https://example.com/delta.log');
+  });
+
+  it('MOD-004 — evidence listing — feeds the reverse-traceability query with zero claims (supports no claims)', async () => {
+    evidenceRepo.create({ description: 'Epsilon unlinked record', file_path: null, file_type: null });
+    const { agent } = await loginAgent(request, app);
+    const res = await agent.get('/manage/evidence');
+    expect(res.text).toContain('Epsilon unlinked record');
+    expect(res.text).toContain('supports no claims');
+  });
+
+  it('MOD-004 — evidence listing — sets Cache-Control: no-store', async () => {
+    evidenceRepo.create({ description: 'Zeta cache check', file_path: 'https://example.com/zeta', file_type: 'deployment' });
+    const { agent } = await loginAgent(request, app);
+    const res = await agent.get('/manage/evidence');
+    expect(res.headers['cache-control']).toBe('no-store');
+    expect(res.headers['pragma']).toBe('no-cache');
+  });
+
+  it('MOD-004 — POST /manage/evidence — returns 401 when unauthenticated', async () => {
+    const agent = request.agent(app);
+    const page = await agent.get('/manage/login');
+    const token = extractCsrf(page.text);
+    const res = await agent
+      .post('/manage/evidence')
+      .type('form')
+      .redirects(0)
+      .send({ _csrf: token, description: 'unauthenticated attempt' });
+    expect(res.status).toBe(401);
+  });
+
+  it('MOD-004 — GET /manage/evidence — redirects unauthenticated GET navigation to the login page with 302', async () => {
+    const res = await request(app).get('/manage/evidence').redirects(0);
+    expect(res.status).toBe(302);
+    expect(res.headers.location).toBe('/manage/login');
+  });
+
+  it('MOD-004 — GET on a POST-only sibling (/manage/evidence/:id/accessibility) — returns 404 per the frozen error contract', async () => {
+    const { agent } = await loginAgent(request, app);
+    const res = await agent.get('/manage/evidence/1/accessibility');
+    expect(res.status).toBe(404);
+  });
+});
```

diff --stat equivalent: `1 file changed, 77 insertions(+)` — exactly one new file in tests/; zero production files changed. (`git status` returns "fatal: not a git repository" — the directory is not a git repository; `git diff --no-index --stat -- /dev/null tests/manageEvidenceList.test.js` is the equivalent and reports exactly one new file.)

### 5c — Verification output (pasted verbatim)

Command: `npx jest tests/manageEvidenceList.test.js`

stdout (final summary; per-request middleware logs elided above in the transcript, all showed the expected statuses 200/303/401/302/404):
```
Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        2.993 s, estimated 7 s
Ran all test suites matching tests/manageEvidenceList.test.js.
```
stderr: none (no errors or warnings on stderr).

Result: PASS (7/7).

Regression check — full suite, `npm test`:
```
Test Suites: 6 passed, 6 total
Tests:       33 passed, 33 total
Snapshots:   0 total
Time:        5.183 s, estimated 7 s
Ran all test suites.
```
Result: PASS — all 26 pre-existing tests still pass; 7 new tests added (33 total).

Lint — `npm run lint` (eslint src tests): clean, no output.

### Pass Closure — 2026-10-10
- Step 1 note: the corrected abstraction test is in the dissection prompt file, not this ledger. The dissection prompt file is not stored in this repository; the scope qualifier was applied to docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5 (Phase 5: Garbage Scrutiny), where the original wording is preserved verbatim as a quoted block immediately above the corrected block. Verification: rg -A2 "Abstraction test (corrected" docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md → present; rg -c "scope qualifier" → 2.
- ADJ-004-013: DONE. Verification: rg -c "WONTFIX — JUSTIFIED" docs/16a-MOD-004-EVIDENCE-STORE-DISSECTION.md → 8 lines: 5 status marks (ADJ-004-002…006, lines 440/455/470/485/500) + 3 verbatim-mandated self-referential lines inside ADJ-004-013 itself (title, proposed-change item 2, verification command). Excluding the entry's own self-references, exactly 5 lines carry the mark, matching the 5 WONTFIX entries; closeDB and resolveDbPath are reclassified per Step 3's internal-helper branch. rg -c "ADJ-004-013" → 1 (≥ 1).
- ADJ-004-002 … ADJ-004-006: WONTFIX — JUSTIFIED, each citing its route reachability with file:line (manageRoutes.js:374, 400, 411, 418, 374).
- ADJ-004-007 (closeDB) and ADJ-004-008 (resolveDbPath): reclassified per Step 3's internal-helper branch → INLINE — internal helper (corrected abstraction test: 1 caller each — app.js:137 and database.js:36 — and no route/test/use-case reachability); the inlining source change is not executed in this pass (no production file change is authorized in this pass).
- ADJ-004-009: PROPOSED, citing docs/10 (§7 DeleteEvidence row; §12 Not found → 404).
- ADJ-004-010: PROPOSED, citing docs/10 (§7 DeleteClaim row; §12 Not found → 404).
- ADJ-004-011: DONE. Verification: npx jest tests/manageEvidenceList.test.js — output "Test Suites: 1 passed, 1 total / Tests: 7 passed, 7 total / Snapshots: 0 total / Time: 2.993 s, estimated 7 s"; regression: npm test — "Test Suites: 6 passed, 6 total / Tests: 33 passed, 33 total"; npm run lint — clean.
- Source files changed: tests/manageEvidenceList.test.js (one test file only).
- Production files changed: none.
- Next eligible entry in MOD-004: ADJ-004-009 — Missing validation on POST /manage/evidence/:id/delete (add the existence check returning 404 per docs/10 §12, with a test asserting 404 on a non-existent ID).

## Handoff Note — MOD-004 correction pass, 2026-10-10

### 1. Entries closed this pass
- ADJ-004-013 — DONE (correction entry; scope qualifier recorded).
- ADJ-004-002 … ADJ-004-006 — WONTFIX — JUSTIFIED (route reachability cited per entry).
- ADJ-004-011 — DONE (isolation test tests/manageEvidenceList.test.js; 7/7 pass; full suite 33/33; lint clean).

### 2. Entries superseded this pass
- ADJ-004-001 (dead code: update()) and ADJ-004-012 (deletion candidate: update()) — superseded by ADJ-004-014: update() is absent from the current source (src/repositories/evidenceRepository.js:55 exports no update symbol), so the dead-code/deletion-candidate findings are moot, not merely uncalled.

### 3. Entries left PROPOSED with their next-action
- ADJ-004-009: add the existence check to POST /manage/evidence/:id/delete (manageRoutes.js:416-421) returning 404 per docs/10 §12; add a test that deletes a non-existent ID and asserts 404.
- ADJ-004-010: add the existence check to POST /manage/claims/:id/delete (manageRoutes.js:339-344) returning 404 per docs/10 §12; add a test that deletes a non-existent ID and asserts 404.
- ADJ-004-014: update the dossier's Task C.2 interface list and Task D line references to match the current source; supersede ADJ-004-001 and ADJ-004-012 as moot.
- ADJ-004-007 and ADJ-004-008 carry INLINE dispositions (not PROPOSED): the inlining source changes are pending — no production file change was authorized in this pass.

### 4. Open findings spawned this pass
- ADJ-004-014 — MOD-004 dossier interface list is stale relative to the current source — PROPOSED, 11 fields (Task E ledger section, appended after ADJ-004-013).

### 5. Module progress: MOD-004 entries
- DONE: 2 (ADJ-004-011, ADJ-004-013)
- WONTFIX — JUSTIFIED: 5 (ADJ-004-002, 003, 004, 005, 006)
- INLINE — internal helper (pending source change): 2 (ADJ-004-007, ADJ-004-008)
- PROPOSED: 5 (ADJ-004-009, ADJ-004-010, ADJ-004-014 actionable; ADJ-004-001, ADJ-004-012 superseded by ADJ-004-014)
- BLOCKED: 0

### 6. Next action
Execute ADJ-004-009: add the existence check returning 404 to POST /manage/evidence/:id/delete and the test asserting 404 on a non-existent ID.

## Pass Closure Addendum — 2026-10-10 (ADJ-004-007/008 inline execution, ADJ-004-009/010/014 completion)
- ADJ-004-007 (closeDB) and ADJ-004-008 (resolveDbPath): INLINE dispositions executed. closeDB removed from database.js and its module surface (module.exports = { connectDB, isOperationalError }, database.js:58); the shutdown handler closes the DB via the singleton handle (connectDB().close(), app.js:137). resolveDbPath inlined into connectDB (database.js:22-51). Verification: npm test — 35/35 pass; npm run lint — clean; node -e shutdown-close check — "SHUTDOWN-CLOSE-OK: singleton handle closed after createApp"; rg -n "closeDB|resolveDbPath" src tests — zero occurrences.
- ADJ-004-009, ADJ-004-010, ADJ-004-014: DONE (existence checks on POST /manage/evidence/:id/delete and POST /manage/claims/:id/delete returning 404 per docs/10 §12; dossier Task C.2/Task D updated to current source; ADJ-004-001 and ADJ-004-012 superseded as moot).
- MOD-004 entry status: DONE 7 (ADJ-004-007, 008, 009, 010, 011, 013, 014); WONTFIX — JUSTIFIED 5 (ADJ-004-002…006); SUPERSEDED 2 (ADJ-004-001, 012); PROPOSED 0; BLOCKED 0.
- MOD-004 ledger complete; next module is MOD-001.