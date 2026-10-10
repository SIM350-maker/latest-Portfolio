# MOD-005 Security & Authentication Dissection

Methodology: the dissection methodology as corrected by ADJ-004-013 (docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5, corrected abstraction test with the mandatory scope qualifier). The scope qualifier is applied to every abstraction-test result in this dossier.

## Task A — File inventory for this module

| Path | Purpose | Inbound refs | Outbound refs | Verdict |
|------|---------|--------------|---------------|---------|
| src/middleware/auth.js | Session lifecycle guard (30m idle / 24h absolute), requireAuth guard for /manage/*, verifyCredential (constant-time bcrypt comparison) | src/app.js:9 (sessionGuard, ABSOLUTE_TIMEOUT_MS consumed), src/routes/manageRoutes.js:6 (requireAuth, verifyCredential) | — | KEEP |
| src/middleware/csrf.js | Session-stored synchronizer-token CSRF protection (403 on invalid/missing token) | src/app.js:10, :95 | crypto | KEEP |
| src/middleware/rateLimiters.js | 100/min public, 10/min management (relaxed under NODE_ENV=test) | src/app.js:11, :77-80 | express-rate-limit | KEEP |
| src/middleware/noStore.js | Cache-Control: no-store on /manage responses | src/app.js:12, :83 | — | KEEP |
| src/middleware/logger.js | Request logging: method, path (no query string), status; never credentials/cookies | src/app.js:13, :98 | — | KEEP |
| src/middleware/errorHandler.js | Centralized error handler: typed errors → 4xx statuses; 500s logged, never sent | src/app.js:14, :123 | ../config/database (isOperationalError) | KEEP |

## Task B — Data-flow traces for this module

### 1. Login (POST /manage/login) — NFR-001
  HTTP request → middleware (helmet, body parsing, session app.js:59, sessionGuard app.js:74, manage rate limiter app.js:78, noStorePrivate app.js:83, method boundary app.js:88-92 (/manage POST passes), csrf app.js:95, logger app.js:98)
    → route handler (src/routes/manageRoutes.js:27-45)
    → validation/credential check (trimmedString manageRoutes.js:28; verifyCredential manageRoutes.js:29 — auth.js:55-63, constant-time bcrypt.compareSync against OWNER_BCRYPT_HASH)
    → invalid → 401 re-render of the login page (manageRoutes.js:30)
    → valid → session fixation protection: session.regenerate (manageRoutes.js:37, frozen security design section 8), authenticated=true, csrfToken re-bound (manageRoutes.js:39-42)
    → HTTP response (303 See Other to returnTo or /manage/manage)

### 2. Management access control (all /manage/*)
    → router.use(requireAuth) (src/routes/manageRoutes.js:52; auth.js:40-52)
    → authenticated sessions pass (auth.js:41); unauthenticated GET/HEAD → 302 to /manage/login (auth.js:42-45); unauthenticated state-changing POST → 401 (auth.js:46-51)

### 3. CSRF verification (every state-changing request)
    → csrfMiddleware (src/app.js:95; csrf.js:12-32)
    → per-session token issued on first request (csrf.js:14-16); non-GET/HEAD/OPTIONS must present _csrf or x-csrf-token (csrf.js:19-23); invalid/missing → 403 with no command side effects (csrf.js:24-30)

### 4. Session lifecycle (every request)
    → sessionGuard (src/app.js:74; auth.js:12-33): 24h absolute since creation, 30m idle since last request (rolling); expired → destroy + fresh anonymous session; destroyed sessions force re-authentication

### 5. Rate limiting (every request)
    → branch (src/app.js:77-80): /manage → manageLimiter (10/min/IP, rateLimiters.js:19-25); else publicLimiter (100/min/IP, rateLimiters.js:10-16); relaxed to 10000/min under NODE_ENV=test (rateLimiters.js:7,11,21)

### 6. Private response no-store (every /manage response)
    → noStorePrivate (src/app.js:83; noStore.js:4-10): Cache-Control: no-store + Pragma: no-cache on /manage paths

### 7. Error handling (terminal)
    → errorHandler (src/app.js:123; errorHandler.js:11-59): typed errors → ValidationError 400 / NotFoundError 404 / ConflictError 409; 500s logged with context (never credentials); stack traces never sent; HTML vs JSON by req.accepts

## Task C — Module dossier for MOD-005

### 1. Responsibility
MOD-005 Security & Authentication implements session-based authentication, CSRF protection, rate limiting, security headers, and centralized error handling (NFR-001, FR-005), protecting the private management boundary.

### 2. Public surface (routes, functions, exported symbols, with file:line)
- Routes: POST /manage/login (src/routes/manageRoutes.js:27); POST /manage/logout (manageRoutes.js:47); the /manage/* guard (manageRoutes.js:52)
- Middleware (registered in src/app.js in order): helmet (app.js:51), session (app.js:59), sessionGuard (app.js:74; auth.js:12-33), rate limiter branch (app.js:77-80), noStorePrivate (app.js:83; noStore.js:4-10), GET-method boundary (app.js:88-92), csrfMiddleware (app.js:95; csrf.js:12-32), logger (app.js:98; logger.js:8-19), errorHandler (app.js:123; errorHandler.js:11-59)
- Functions (auth.js): sessionGuard (:12), requireAuth (:40), verifyCredential (:55); constants IDLE_TIMEOUT_MS (:3), ABSOLUTE_TIMEOUT_MS (:4)
- Exports: auth.js:65 (sessionGuard, requireAuth, verifyCredential, IDLE_TIMEOUT_MS, ABSOLUTE_TIMEOUT_MS); csrf.js:33 (csrfMiddleware); rateLimiters.js:28 (publicLimiter, manageLimiter); noStore.js:12 (noStorePrivate); logger.js:21 (logger); errorHandler.js:61 (errorHandler); app.js:147 (createApp, startServer, requireConfiguration, verifyCredential, requireAuth, IDLE_TIMEOUT_MS, ABSOLUTE_TIMEOUT_MS — re-exports)

### 3. Internal collaborators (with file:line)
- express-session, helmet, express-rate-limit, morgan, bcryptjs (app.js, manageRoutes.js)
- process.env: SESSION_SECRET, OWNER_BCRYPT_HASH (validated at boot by requireConfiguration app.js:26-37), NODE_ENV (rateLimiters.js:7)

### 4. Forbidden collaborators (with the reason)
- None: the security middleware depends only on the documented npm packages and environment variables.

### 5. Data it owns
- No persistence: sessions live in the express-session memory store (acceptable for single-instance, docs/16 ledger Section 8); no credentials persisted (OWNER_BCRYPT_HASH is an environment variable, .env.example).

### 6. Data it reads but does not own
- OWNER_BCRYPT_HASH, SESSION_SECRET, NODE_ENV (environment; validated at boot)

### 7. Failure modes (each mapped to an HTTP status or thrown error type)
- 401: invalid credentials (manageRoutes.js:30); unauthenticated management POST (auth.js:46)
- 403: invalid/missing CSRF token (csrf.js:24)
- 429: rate limit exceeded (rateLimiters.js:15, 24)
- 500: unexpected failures (errorHandler.js:12, 21-26); configuration errors fail fast at boot (app.js:34-36)

### 8. Isolation test plan: the minimal tests that prove this module works end-to-end WITHOUT any other module implemented
Stubs/fakes required: none — the middleware is tested over HTTP with the real express stack and a per-process test environment (tests/helpers.js:14-19).
Justification: no collaborator fakes are needed; the middleware chain is exercised end-to-end over HTTP.
Tests needed (all covered by the existing suite, tests/auth.test.js): 302 redirect for unauthenticated GET /manage (:12-16); 403 for management POST lacking CSRF (:18-21); 401 for management POST with valid CSRF but no session (:23-29); 403 for missing/wrong tokens (:31-42); 401 for wrong password (:44-51); session rotation on login (:53-60); logout revokes access (:62-69); no-store on private responses (:71-75); helmet headers (:77-81); HttpOnly/SameSite cookie (:83-88); GET-only login form (:90-95).

### 9. Build order: the exact sequence from empty directory to passing isolation test
1. Install dependencies (express-session, helmet, express-rate-limit, bcryptjs)
2. Create src/middleware/auth.js, csrf.js, rateLimiters.js, noStore.js, logger.js, errorHandler.js
3. Wire the chain in src/app.js with the documented order
4. Create src/views/manage/login.ejs and error.ejs
5. Write HTTP tests (tests/auth.test.js, tests/helpers.js)
6. npm test

### 10. Deletion candidates: anything not required by a traced requirement
- app.js's re-exports of verifyCredential, requireAuth, IDLE_TIMEOUT_MS, ABSOLUTE_TIMEOUT_MS (app.js:147) and the corresponding dead imports (app.js:9 imports requireAuth and verifyCredential solely to re-export them; IDLE_TIMEOUT_MS is not used inside app.js at all): 0 external consumers — server.js imports only startServer (server.js:10); all six test files import only createApp. Recorded as ADJ-005-001 with disposition DELETE.

## Task D — Scrutiny findings for MOD-005

Files examined: src/middleware/auth.js, csrf.js, rateLimiters.js, noStore.js, logger.js, errorHandler.js, src/app.js (middleware chain and exports), src/routes/manageRoutes.js (login/logout/guard).

### Dead code test
- sessionGuard, csrfMiddleware, noStorePrivate, publicLimiter, manageLimiter, logger, errorHandler: all registered in app.js (74, 95, 83, 77-80, 98, 123). Live.
- requireAuth, verifyCredential: consumed via manageRoutes.js:6, :29, :52 (direct import from middleware/auth). Live.
- IDLE_TIMEOUT_MS, ABSOLUTE_TIMEOUT_MS: live inside auth.js (auth.js:3-4, :23); ABSOLUTE_TIMEOUT_MS consumed in app.js:69.
- app.js's re-exports (app.js:147: verifyCredential, requireAuth, IDLE_TIMEOUT_MS, ABSOLUTE_TIMEOUT_MS) and the corresponding imports (app.js:9: requireAuth, verifyCredential, IDLE_TIMEOUT_MS): 0 external consumers — rg "require('./src/app')" tests → 6 files, all destructuring createApp only; server.js:10 destructures startServer only. Dead re-exports/dead imports. → ADJ-005-001.

### Duplication test
- No duplication. Each middleware has a single, clear responsibility.

### Framework-convenience test (does it hide a data flow?)
- No. helmet/session/express-rate-limit are configured explicitly; the security flow (CSRF before routes, auth guard at the router level) is visible in app.js/manageRoutes.js order and comments.

### Dependency test (actually imported?)
- Yes: every middleware is imported and registered (app.js:9-14).

### Abstraction test (corrected — scope qualifier mandatory)
Classification applied before the ≥2-caller rule:
- All six middleware functions and both rate limiters: module public surface methods reachable from the app chain (registered in app.js) — reachable → KEEP.
- requireAuth/verifyCredential: reachable from manageRoutes.js:6/:29/:52 — reachable → KEEP. Their app.js re-exports are unreachable (0 consumers) → DELETE. → ADJ-005-001.
- IDLE_TIMEOUT_MS/ABSOLUTE_TIMEOUT_MS: live inside auth.js; ABSOLUTE_TIMEOUT_MS consumed at app.js:69; their app.js re-exports are unreachable → DELETE. → ADJ-005-001.

### Template test (rendered by a route?)
- manage/login.ejs by manageRoutes.js:24, 30; error.ejs by manageRoutes.js:38, errorHandler.js:30-53, and the app-level 404 handler (app.js:112). Pass.

### Route test (handler + test + documented contract?)
- POST /manage/login: documented docs/10 §7 (line 59); the authentication mechanism deferred to Stage 4.5 in docs/10 is implemented per the frozen security design (docs/11 — session fixation protection manageRoutes.js:33, 30m/24h timeouts auth.js:3-4); tested extensively (tests/auth.test.js). Pass.
- POST /manage/logout: tested (tests/auth.test.js:62-69). Pass.
- The /manage/* guard: tested (tests/auth.test.js:12-29). Pass.

### Middleware test (registered? order justified?)
- All registered (app.js:51-123); order documented in comments (body parsing before CSRF app.js:53; method boundary before CSRF app.js:85-87; errorHandler last app.js:122). Verified by tests/auth.test.js:18-21 (403 precedes 401) and tests/manageEvidenceList.test.js (404 fall-through). Pass.

### Configuration test (env var read, documented, validated at boot?)
- SESSION_SECRET, OWNER_BCRYPT_HASH: validated at boot by requireConfiguration (app.js:26-37, fail-fast); documented in .env.example; never logged. NODE_ENV: read by rateLimiters.js:7 (test relaxation, documented in the comment) and app.js:20. Pass.

### Naming test (matches domain vocabulary in docs/05?)
- Pass (auth/csrf/rate limiting/no-store are the frozen security design's vocabulary).

### Honesty test (any public rendering implying verifiability?)
- The login page and error pages carry no verifiability implication. Security headers set on all responses (helmet app.js:51); no-store on private responses (noStore.js). Pass.

## Task E — Ledger entries for MOD-005

### ADJ-005-001
  - Status: PROPOSED → DONE (2026-10-10) — DELETE disposition executed.
  - Result: app.js's dead surface trimmed: app.js:9 now reads `const { sessionGuard, ABSOLUTE_TIMEOUT_MS } = require('./middleware/auth');` (requireAuth, verifyCredential, IDLE_TIMEOUT_MS removed — requireAuth/verifyCredential are consumed via manageRoutes.js:6 from middleware/auth directly; IDLE_TIMEOUT_MS had no internal use); app.js:147 now reads `module.exports = { createApp, startServer };` (requireConfiguration remains live internally, called by createApp at app.js:41; its unused export removed). No consumer was added. The middleware module's own exports (auth.js:65) are unchanged and remain live.
  - Verification output, pasted verbatim:
    Command: rg -n "verifyCredential|requireAuth|IDLE_TIMEOUT_MS" src/app.js — no output (exit 1; zero occurrences).
    Command: npm test — "Test Suites: 6 passed, 6 total / Tests: 38 passed, 38 total / Time: 8.156 s".
    Command: npm run lint — clean.
  - Type: Dead code (dead re-exports and dead imports)
  - Module: MOD-005
  - Layer: application composition root (src/app.js)
  - Traces to: docs/10 §7 (the /manage/* guard is consumed via src/routes/manageRoutes.js:6, the middleware module's own surface); docs/13 §8 (the auth constants are auth.js internals)
  - Problem: app.js re-exports verifyCredential, requireAuth, IDLE_TIMEOUT_MS, and ABSOLUTE_TIMEOUT_MS (app.js:147) with 0 external consumers: server.js imports only startServer (server.js:10) and all six test files destructure only createApp. app.js:9 correspondingly imports requireAuth and verifyCredential solely to re-export them (unused inside app.js), and IDLE_TIMEOUT_MS is imported without any internal use. The dead surface invites divergence between the middleware module's real exports and app.js's stale copies.
  - Evidence: rg -n "require\('\.\./src/app'\)" tests → tests/auth.test.js:7, content.test.js:7, publication.test.js:7, constraints.test.js:7, manageEvidenceList.test.js:7, health.test.js:5 — all six files destructure `{ createApp }` only; server.js:10 destructures `{ startServer }` only; rg "IDLE_TIMEOUT_MS|requireConfiguration|verifyCredential" tests → no matches; requireAuth/verifyCredential consumed via manageRoutes.js:6 (direct import from ../middleware/auth); IDLE_TIMEOUT_MS/ABSOLUTE_TIMEOUT_MS live inside auth.js (auth.js:3-4, :23); ABSOLUTE_TIMEOUT_MS consumed at app.js:69.
  - Proposed change: Trim app.js's dead surface: app.js:9 → `const { sessionGuard, ABSOLUTE_TIMEOUT_MS } = require('./middleware/auth');`; app.js:147 → `module.exports = { createApp, startServer };` (requireConfiguration remains live internally, called by createApp at app.js:41). Per the corrected abstraction test: the re-exports are unreachable → DELETE. Do not add consumers to justify them.
  - Data-flow impact: None — no consumer exists; the middleware module's own exports (auth.js:65) are unchanged and remain live.
  - Isolation impact: None — the middleware chain is unchanged.
  - Risk if skipped: Stale re-exports diverge from the middleware module's real surface; future passes could import the dead copies.
  - Verification: rg -n "verifyCredential|requireAuth|IDLE_TIMEOUT_MS" src/app.js → no matches after the change (except none); rg "IDLE_TIMEOUT_MS|ABSOLUTE_TIMEOUT_MS|requireConfiguration|verifyCredential" tests → no matches (unchanged).
  - Rollback: restore the imports and exports at app.js:9 and :147.

## Task F — Verification matrix for MOD-005

| Ledger entry | Test that proves it | Command to run | Expected output |
|--------------|---------------------|----------------|-----------------|
| ADJ-005-001 | Search for app.js re-export consumers | `rg -n "require\('\.\./src/app'\)" tests` | 6 files, all `{ createApp }` |
| ADJ-005-001 | Search for dead-constant consumers | `rg "IDLE_TIMEOUT_MS\|requireConfiguration\|verifyCredential" tests` | No matches found |
| ADJ-005-001 | Confirm live consumption path | `rg -n "requireAuth\|verifyCredential" src/routes/manageRoutes.js` | Lines 6, 29, 52 (direct import from middleware/auth) |

## Task G — What I could not verify

- TLS enforcement (docs/13 §8: "if testable in environment"): not testable in this environment; secure-cookie behaviour is NODE_ENV-gated (app.js:67) and tested for HttpOnly/SameSite (tests/auth.test.js:83-88). Deferred to the deployment stage.
- Session store persistence beyond the memory store: acceptable for single-instance per the frozen design (docs/16 ledger Section 8); no open work recorded in this dossier.

## Pass Closure — MOD-005 dissection, 2026-10-10
- Methodology: the corrected dissection methodology (ADJ-004-013; scope qualifier mandatory).
- ADJ-005-001: DONE — DELETE disposition executed (app.js:9 trimmed to `{ sessionGuard, ABSOLUTE_TIMEOUT_MS }`; app.js:147 trimmed to `{ createApp, startServer }`; rg "verifyCredential|requireAuth|IDLE_TIMEOUT_MS" src/app.js → zero occurrences; 38/38 tests pass; lint clean).
- Source files changed by this pass: src/app.js (dead-surface removal only; no behaviour change — no consumer existed for the removed imports/exports).
- MOD-005 entry status: DONE 1 (ADJ-005-001); WONTFIX — JUSTIFIED 0; PROPOSED 0; BLOCKED 0.
- MOD-005 ledger complete; all seven module ledgers are complete.
