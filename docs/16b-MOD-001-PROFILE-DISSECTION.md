# MOD-001 Professional Profile Dissection

Methodology: the dissection methodology as corrected by ADJ-004-013 (see docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5, corrected abstraction test with the mandatory scope qualifier). The scope qualifier is applied to every abstraction-test result in this dossier.

## Task A — File inventory for this module

| Path | Purpose | Inbound refs | Outbound refs | Verdict |
|------|---------|--------------|---------------|---------|
| src/repositories/profileRepository.js | CRUD for the singleton profile; application-level singleton guard (ConflictError on duplicate create); FK-RESTRICT mapping for delete | src/routes/publicRoutes.js, src/routes/manageRoutes.js, tests/constraints.test.js | ../config/database, ../lib/validation | KEEP |
| src/views/index.ejs | Homepage view: published profile + published overview (FR-001) | src/routes/publicRoutes.js:24 | partials/header, partials/footer | KEEP |
| src/views/manage/profile.ejs | Profile edit form (private) | src/routes/manageRoutes.js:74, 87 | partials/header, partials/footer | KEEP |
| src/views/manage/dashboard.ejs | Dashboard: profile + content counts | src/routes/manageRoutes.js:66 | partials/header, partials/footer | KEEP |

## Task B — Data-flow traces for this module

### 1. Public homepage (FR-001)
  HTTP request (GET /)
    → middleware (helmet app.js:51, urlencoded app.js:54, json app.js:55, session app.js:59, sessionGuard app.js:74, rate limiter public branch app.js:77-80, noStorePrivate app.js:83 (no-op for non-/manage), GET-method boundary app.js:88-92 (GET passes), csrf app.js:95 (GET passes), logger app.js:98, morgan app.js:99, static app.js:102)
    → route handler (src/routes/publicRoutes.js:18-26)
    → repository call (src/repositories/profileRepository.js:11-14 getProfile; src/repositories/projectRepository.js listPublished; src/repositories/skillRepository.js listPublished)
    → SQL statement (paste verbatim)
      SELECT * FROM profile LIMIT 1
    → SQLite constraint / trigger touched (none for SELECT)
    → row(s) returned (profile row or null)
    → publication gate in route handler (src/routes/publicRoutes.js:21: profile exposed only when publication_state === 'Published')
    → view model constructed (src/routes/publicRoutes.js:24: { isAuthenticated, title: 'Home', profile, projects, skills })
    → template rendered (src/views/index.ejs)
    → HTTP response (status 200, Content-Type text/html; charset=utf-8, helmet security headers)

### 2. Profile edit form (GET /manage/profile)
    → middleware (as trace 1, plus manage rate limiter app.js:78, noStorePrivate sets Cache-Control: no-store app.js:83/noStore.js:4-8)
    → route handler (src/routes/manageRoutes.js:71-76)
    → auth guard (router.use(requireAuth) manageRoutes.js:52; auth.js:40-52)
    → repository call (src/repositories/profileRepository.js:11-14 getProfile, manageRoutes.js:73)
    → SQL statement: SELECT * FROM profile LIMIT 1
    → view model constructed (manageRoutes.js:74: { title: 'Edit profile', profile, fieldErrors: {}, values: profile || {} })
    → template rendered (src/views/manage/profile.ejs)
    → HTTP response (status 200; Cache-Control: no-store)

### 3. Profile create/update (POST /manage/profile)
    → middleware (as trace 2, plus csrf verification app.js:95)
    → route handler (src/routes/manageRoutes.js:78-100)
    → validation (src/lib/validation.js requireText/optionalText, manageRoutes.js:81-84: name, role, summary required; contact_info optional; length caps)
    → repository call (getProfile manageRoutes.js:92 → updateProfile manageRoutes.js:94 or createProfile manageRoutes.js:96)
    → SQL statement (paste verbatim)
      INSERT INTO profile (name, role, summary, contact_info, publication_state) VALUES (?, ?, ?, ?, ?)
      UPDATE profile SET name = ?, role = ?, summary = ?, contact_info = ? WHERE id = ?   (fields built dynamically, allowed list profileRepository.js:43)
    → SQLite constraint / trigger touched (profile CHECK constraints; UNIQUE(singleton); singleton guard)
    → row(s) returned (lastInsertRowid or changes count)
    → view model constructed (none; redirect)
    → HTTP response (status 303 See Other, location /manage/profile)

### 4. Profile publish/unpublish (POST /manage/profile/publish, POST /manage/profile/unpublish)
    → route handlers (src/routes/manageRoutes.js:102-109, 111-118)
    → repository call (src/repositories/profileRepository.js:56-60 setPublicationState, manageRoutes.js:106 and :115)
    → SQL statement: UPDATE profile SET publication_state = ? WHERE id = ?
    → HTTP response (status 303 See Other, location /manage/profile)

### 5. Delete profile — no route
  deleteProfile (src/repositories/profileRepository.js:66-77) has 0 callers: no route, no test, no documented use case reaches it. The frozen management contract (docs/10 §7) defines no DELETE /manage/profile route. Recorded as ADJ-001-001.

## Task C — Module dossier for MOD-001

### 1. Responsibility
MOD-001 Professional Profile displays and manages the engineer's name, role, summary, and contact information (FR-001, NFR-002). The profile is a singleton (schema.sql:10,13 UNIQUE(singleton); application-level guard profileRepository.js:25-30).

### 2. Public surface (routes, functions, exported symbols, with file:line)
- Routes:
  - GET / (src/routes/publicRoutes.js:18)
  - GET /manage/profile (src/routes/manageRoutes.js:71)
  - POST /manage/profile (src/routes/manageRoutes.js:78)
  - POST /manage/profile/publish (src/routes/manageRoutes.js:102)
  - POST /manage/profile/unpublish (src/routes/manageRoutes.js:111)
- Functions (profileRepository):
  - getProfile() (src/repositories/profileRepository.js:11)
  - getProfileById(id) (src/repositories/profileRepository.js:16)
  - createProfile(data) (src/repositories/profileRepository.js:25)
  - updateProfile(id, changes) (src/repositories/profileRepository.js:39)
  - setPublicationState(id, state) (src/repositories/profileRepository.js:56)
  - deleteProfile(id) (src/repositories/profileRepository.js:66)
- Exported symbols: getProfile, getProfileById, createProfile, updateProfile, setPublicationState, deleteProfile (src/repositories/profileRepository.js:79)

### 3. Internal collaborators (with file:line)
- src/config/database.js:22 (connectDB — resolveDbPath inlined per ADJ-004-008; singleton connection)
- src/db/schema.sql:3-14 (profile table DDL, CHECK constraints, UNIQUE(singleton))
- src/lib/validation.js:3-10 (ValidationError), 12-18 (ConflictError)

### 4. Forbidden collaborators (with the reason)
- None: the module depends on database/config and the validation lib only. No presentation-layer or cross-module business dependencies.

### 5. Data it owns (tables, columns, invariants — paste the relevant DDL)
```sql
CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    summary TEXT NOT NULL,
    contact_info TEXT,
    publication_state TEXT NOT NULL DEFAULT 'Draft' CHECK (publication_state IN ('Draft','Published','Archived')),
    singleton INTEGER NOT NULL DEFAULT 1 CHECK (singleton = 1),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (singleton)
);
```
Invariants: publication_state ∈ ('Draft','Published','Archived'); at most one profile row (UNIQUE(singleton) + application-level guard).

### 6. Data it reads but does not own
- project and skill tables via projectRepository.listPublished / skillRepository.listPublished (homepage overview, publicRoutes.js:22-23)

### 7. Failure modes (each mapped to an HTTP status or thrown error type)
- ValidationError (400): missing required fields on POST /manage/profile (manageRoutes.js:81-84)
- ConflictError (409): createProfile when a profile already exists (profileRepository.js:28-30); deleteProfile with FK RESTRICT violated (profileRepository.js:72-74)
- OperationalError (500): SQLite errors (caught and rethrown in database.js:47-50; routes pass to errorHandler via next(err))

### 8. Isolation test plan: the minimal tests that prove this module works end-to-end WITHOUT any other module implemented
Stubs/fakes required:
- Fake database connection implementing the better-sqlite3 subset used: prepare(), run(), get(), lastInsertRowid, changes
- The fake should implement the profile DDL and CHECK/UNIQUE constraints
Justification: the stub fakes only the external persistence layer, not the module's own logic (validation, SQL generation, singleton guard).
Tests needed: create/update/publish flows over HTTP with a session; singleton guard rejects a second profile (409); unauthenticated POST → 401; validation failures → 400. Note: the existing suite covers these (tests/constraints.test.js:15-16 singleton guard; tests/content.test.js:35-58 profile CRUD + publish) — no new test file is required for MOD-001's isolation beyond what exists.

### 9. Build order: the exact sequence from empty directory to passing isolation test
1. Install dependencies (better-sqlite3, bcryptjs, express-session, ejs)
2. Create src/config/database.js (connectDB with pragma verification and schema apply)
3. Create src/lib/validation.js (ValidationError, ConflictError, NotFoundError)
4. Create src/repositories/profileRepository.js
5. Create src/views/manage/profile.ejs and src/views/index.ejs
6. Write tests over HTTP with the test environment helper (tests/helpers.js)
7. Run npm test

### 10. Deletion candidates: anything not required by a traced requirement
- deleteProfile (src/repositories/profileRepository.js:66-77): 0 callers — no route, no test, no documented use case reaches it; the frozen contract (docs/10 §7) defines no DELETE /manage/profile route; docs/09 §20 governs Professional Identity deletion by the RESTRICT default but defines no interface operation for it. Recorded as ADJ-001-001 with disposition DELETE.

## Task D — Scrutiny findings for MOD-001

Files examined: src/repositories/profileRepository.js, src/views/index.ejs, src/views/manage/profile.ejs, src/views/manage/dashboard.ejs (plus the profile routes in src/routes/manageRoutes.js and src/routes/publicRoutes.js).

### Dead code test
- deleteProfile: 0 callers (rg -n "profileRepo\.deleteProfile" src tests → no matches; rg -n "deleteProfile" src → only the definition at profileRepository.js:66). Dead code. → ADJ-001-001.
- All other functions are used: getProfile (6 callers), getProfileById (1), createProfile (2), updateProfile (1), setPublicationState (2).

### Duplication test
- updateProfile builds its SET clause dynamically (profileRepository.js:41-52); setPublicationState (profileRepository.js:56-60) duplicates a subset of that capability but with different semantics (boolean return, dedicated publication-state write) — distinct purposes, not duplication. No other duplication found.

### Framework-convenience test (does it hide a data flow?)
- No. All SQL is explicit and parameterized.

### Dependency test (actually imported?)
- Yes: profileRepository is imported in publicRoutes.js:4 and manageRoutes.js:7.

### Abstraction test (corrected — scope qualifier mandatory; see docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5)
Classification applied before the ≥2-caller rule:
- getProfile: module public surface method — reachable from routes (publicRoutes.js:20; manageRoutes.js:57, 73, 88, 92, 104, 113). Reachable → KEEP. 6 callers in any case.
- getProfileById: module public surface method — reachable from a route (manageRoutes.js:319, POST /manage/claims source validation). Reachable → KEEP-WITH-JUSTIFICATION. 1 caller.
- createProfile: module public surface method — reachable from a route (manageRoutes.js:96) and a test (tests/constraints.test.js:15-16). Reachable → KEEP. 2 callers.
- updateProfile: module public surface method — reachable from a route (manageRoutes.js:94, POST /manage/profile). Reachable → KEEP-WITH-JUSTIFICATION. 1 caller.
- setPublicationState: module public surface method — reachable from routes (manageRoutes.js:106, 115). Reachable → KEEP. 2 callers.
- deleteProfile: unreachable from a route, a test, or a documented use case → classified internal helper → 0 callers → DELETE. → ADJ-001-001.

### Template test (rendered by a route?)
- index.ejs rendered by publicRoutes.js:24; manage/profile.ejs by manageRoutes.js:74 and :87; manage/dashboard.ejs by manageRoutes.js:66. All pass.

### Route test (handler + test + documented contract?)
- GET /: handler publicRoutes.js:18; documented in docs/10 §6 (GET / — homepage); tested in tests/content.test.js:48-58.
- GET+POST /manage/profile: handlers manageRoutes.js:71, 78; documented docs/10 §7; tested tests/content.test.js:35-46.
- POST /manage/profile/publish and /unpublish: handlers manageRoutes.js:102, 111; documented docs/10 §7 (`/manage/:entityType/:id/publish` with entityType ∈ {profile, project, skill, claim}); tested tests/content.test.js:48-58 (publish path).
- All pass.

### Middleware test (registered? order justified?)
- The profile routes run behind the full app middleware chain (app.js) and requireAuth (manageRoutes.js:52). Order justified in app.js comments. Pass.

### Configuration test (env var read, documented, validated at boot?)
- Not applicable at module level: profileRepository reads no env vars directly; SESSION_SECRET/OWNER_BCRYPT_HASH are validated at boot by requireConfiguration (app.js:26-37). Pass.

### Naming test (matches domain vocabulary in docs/05?)
- "profile" matches docs/09 §7 "Professional Identity Persistence" (surrogate id, name, role, summary, contact_info, publication_state) — the storage name "profile" is the documented persistence spelling of Professional Identity. Pass.

### Honesty test (any public rendering implying verifiability for Private/Redacted/Unavailable evidence?)
- The homepage renders the profile only when publication_state === 'Published' (publicRoutes.js:21). No verifiability implication. Pass.

## Task E — Ledger entries for MOD-001

Entries in the mandatory 11-field format. Only failing tests produce entries; passing tests do not.

### ADJ-001-001
  - Status: PROPOSED → DONE (2026-10-10) — DELETE disposition executed.
  - Result: deleteProfile() removed from src/repositories/profileRepository.js (function, docstring, and export removed; module.exports is now `{ getProfile, getProfileById, createProfile, updateProfile, setPublicationState }`, profileRepository.js:65). The now-unused isOperationalError import was removed from profileRepository.js (its only use was deleteProfile's catch); ConflictError remains in use (profileRepository.js:29). No route or caller was added.
  - Verification output, pasted verbatim:
    Command: rg -n "deleteProfile" src --glob "!node_modules" — no output (exit 1; zero occurrences).
    Command: npm test — "Test Suites: 6 passed, 6 total / Tests: 35 passed, 35 total / Time: 5.985 s".
    Command: npm run lint — clean.
  - Type: Dead code
  - Module: MOD-001
  - Layer: persistence
  - Traces to: docs/09 §20 (Professional Identity deletion, RESTRICT default); docs/10 §7 (management interface table — no DELETE /manage/profile route defined)
  - Problem: deleteProfile() in profileRepository.js has 0 callers; no route, no test, and no documented use case reaches it. The frozen management contract defines no profile-delete route, and no traced requirement (FR-001, NFR-002) requires profile deletion. The function is dead code.
  - Evidence: rg -n "profileRepo\.deleteProfile" src tests → no matches; rg -n "deleteProfile" src → only the definition at src/repositories/profileRepository.js:66; docs/10 §7 defines no DELETE /manage/profile operation.
  - Proposed change: Remove deleteProfile() from profileRepository.js (and its export). Per the corrected abstraction test: unreachable → DELETE. Do not add a route or a caller to justify it (no traced requirement demands profile deletion).
  - Data-flow impact: None — the function is not called.
  - Isolation impact: None — the function is not part of any data flow.
  - Risk if skipped: Dead code remains; a future pass could mistake the RESTRICT mapping (profileRepository.js:72-74) for a live deletion path.
  - Verification: rg -n "deleteProfile" src/ → no matches after removal.
  - Rollback: restore deleteProfile() and its export.

### ADJ-001-002
  - Status: PROPOSED → WONTFIX — JUSTIFIED
  - Justification: public surface method of MOD-001; reached from manageRoutes.js:94 (POST /manage/profile handler, manageRoutes.js:78-100); the ≥2-caller rule does not apply to module public surface methods per the corrected abstraction test; see the corrected scope qualifier in docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5.
  - Type: Abstraction test result (1 caller, public surface)
  - Module: MOD-001
  - Layer: persistence
  - Traces to: FR-001, NFR-002 (profile updates)
  - Problem: updateProfile() has 1 caller (manageRoutes.js:94) — under the unqualified test this would read as an abstraction-test failure.
  - Evidence: manageRoutes.js:94 (`profileRepo.updateProfile(existing.id, values);`) inside the POST /manage/profile handler.
  - Proposed change: None — the corrected test classifies it as a module public surface method reachable from a route; KEEP-WITH-JUSTIFICATION. The caller count is a property of the module's consumers, not a test of the method.
  - Data-flow impact: None.
  - Isolation impact: None.
  - Risk if skipped: None — the finding does not exist under the corrected test.
  - Verification: rg -n "profileRepo\.updateProfile" src/ → 1 match (manageRoutes.js:94).
  - Rollback: not applicable (no change made).

### ADJ-001-003
  - Status: PROPOSED → WONTFIX — JUSTIFIED
  - Justification: public surface method of MOD-001; reached from manageRoutes.js:319 (POST /manage/claims handler, manageRoutes.js:308-337 — claim source validation); the ≥2-caller rule does not apply to module public surface methods per the corrected abstraction test; see the corrected scope qualifier in docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5.
  - Type: Abstraction test result (1 caller, public surface)
  - Module: MOD-001
  - Layer: persistence
  - Traces to: FR-003 (claim source validation consumes the profile lookup)
  - Problem: getProfileById() has 1 caller (manageRoutes.js:319) — under the unqualified test this would read as an abstraction-test failure.
  - Evidence: manageRoutes.js:319 (`: type === 'skill' ? skillRepo.getById(sourceId) : profileRepo.getProfileById(sourceId);`) inside the POST /manage/claims handler.
  - Proposed change: None — the corrected test classifies it as a module public surface method reachable from a route; KEEP-WITH-JUSTIFICATION.
  - Data-flow impact: None.
  - Isolation impact: None.
  - Risk if skipped: None — the finding does not exist under the corrected test.
  - Verification: rg -n "profileRepo\.getProfileById" src/ → 1 match (manageRoutes.js:319).
  - Rollback: not applicable (no change made).

No entries for getProfile (6 callers), createProfile (2 callers: route + test), setPublicationState (2 callers) — all pass the unqualified test as well.

## Task F — Verification matrix for MOD-001

| Ledger entry | Test that proves it | Command to run | Expected output |
|--------------|---------------------|----------------|-----------------|
| ADJ-001-001 | Search for deleteProfile usage | `rg -n "profileRepo\.deleteProfile" src tests` | No matches found |
| ADJ-001-001 | Search for the definition | `rg -n "deleteProfile" src/repositories/profileRepository.js` | Line 66 (definition) until removed |
| ADJ-001-002 | Count updateProfile callers | `rg -n "profileRepo\.updateProfile" src/` | 1 (manageRoutes.js:94) |
| ADJ-001-003 | Count getProfileById callers | `rg -n "profileRepo\.getProfileById" src/` | 1 (manageRoutes.js:319) |

## Task G — What I could not verify

- Roadmap DEF-003's "ensure db.close() in all error paths": the repositories use a singleton connection (database.js:7,22-25); closing on error paths would break the singleton and is not part of the frozen design. The deferred roadmap item remains DEFERRED at the roadmap level; the repository error paths throw and are handled by the centralized error handler (app.js:123, errorHandler.js).
- Roadmap DEF-001 (singleton constraint): implemented (application-level guard profileRepository.js:25-30 plus schema UNIQUE(singleton)); verified by tests/constraints.test.js:15-16. No open work recorded in this dossier.

## Pass Closure — MOD-001 dissection, 2026-10-10
- Methodology: the corrected dissection methodology (ADJ-004-013; scope qualifier mandatory).
- ADJ-001-001: DONE — DELETE disposition executed (deleteProfile() and its export removed from src/repositories/profileRepository.js; rg "deleteProfile" src → zero occurrences; 35/35 tests pass; lint clean).
- ADJ-001-002: WONTFIX — JUSTIFIED (updateProfile, public surface, manageRoutes.js:94).
- ADJ-001-003: WONTFIX — JUSTIFIED (getProfileById, public surface, manageRoutes.js:319).
- Source files changed by this pass: src/repositories/profileRepository.js (dead-code removal only; no behaviour change — the removed function had 0 callers).
- MOD-001 entry status: DONE 1 (ADJ-001-001); WONTFIX — JUSTIFIED 2 (ADJ-001-002, 003); PROPOSED 0; BLOCKED 0.
- MOD-001 ledger complete; next module is MOD-002.
