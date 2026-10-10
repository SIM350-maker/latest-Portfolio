# MOD-007 Public API/Views Dissection

Methodology: the dissection methodology as corrected by ADJ-004-013 (docs/16-SYSTEM-DISSECTION-AND-ADJUSTMENT-LEDGER.md Section 5, corrected abstraction test with the mandatory scope qualifier). The scope qualifier is applied to every abstraction-test result in this dossier.

## Task A — File inventory for this module

| Path | Purpose | Inbound refs | Outbound refs | Verdict |
|------|---------|--------------|---------------|---------|
| src/routes/publicRoutes.js | Public read routes: homepage, projects, skills (GET-only) | src/app.js:107 (mount) | repositories (read-only queries), views | KEEP |
| src/views/index.ejs | Homepage: published profile + overview (FR-001) | publicRoutes.js:24 | partials | KEEP |
| src/views/projects/list.ejs | Published projects list (FR-002) | publicRoutes.js:31 | partials | KEEP |
| src/views/projects/detail.ejs | Project detail with claims/evidence/skills, honest accessibility rendering (FR-002, FR-003, FR-006) | publicRoutes.js:50 | partials | KEEP |
| src/views/skills/list.ejs | Published skills list (FR-004) | publicRoutes.js:59 | partials | KEEP |
| src/views/skills/detail.ejs | Skill detail with claims/evidence, honest accessibility rendering (FR-004, FR-003, FR-006) | publicRoutes.js:76 | partials | KEEP |
| src/views/error.ejs | Error page (404/401/403/409/500) | manageRoutes.js:38, errorHandler.js:30-53, app.js:112 | partials | KEEP |
| src/views/partials/header.ejs, footer.ejs | Shared layout partials | all templates | — | KEEP |
| public/css/styles.css | Presentation (responsive, focus-visible, reduced-motion) | partials/header.ejs | — | KEEP |

## Task B — Data-flow traces for this module

### 1. Homepage (FR-001) — see docs/16b Task B trace 1
  GET / → publicRoutes.js:18-26 → getProfile (publication gate publicRoutes.js:21) → projectRepo.listPublished / skillRepo.listPublished → view model (publicRoutes.js:24) → index.ejs → 200 text/html.

### 2. Project detail (FR-002, FR-003, FR-006) — see docs/16c Task B trace 2
  GET /projects/:id → publicRoutes.js:35-54 → publication gate (404 unless Published, publicRoutes.js:38-44) → claimsWithEvidence map (publicRoutes.js:49) → projects/detail.ejs → 200 text/html.

### 3. Skill detail (FR-004, FR-003, FR-006) — see docs/16d Task B trace 2
  GET /skills/:id → publicRoutes.js:63-80 → publication gate (404 unless Published, publicRoutes.js:66-72) → claimsWithEvidence map (publicRoutes.js:75) → skills/detail.ejs → 200 text/html.

### 4. Error rendering
  404 (unknown route): app.js:110-120 → error.ejs with '404 — Not found' (HTML) or JSON error (non-HTML).
  404/401/403/409 (typed errors): errorHandler.js:28-53 → error.ejs with the typed heading.
  500: errorHandler.js:45-53 → error.ejs, message generic, issue logged (never credentials).

## Task C — Module dossier for MOD-007

### 1. Responsibility
MOD-007 Public API/Views provides the server-rendered HTML public presentation: responsive design, accessibility, and the honest evidence-accessibility rendering (FR-001, FR-002, FR-003, FR-004, FR-006, FR-008, FR-009).

### 2. Public surface (routes, templates, with file:line)
- Routes: GET / (publicRoutes.js:18), GET /projects (:28), GET /projects/:id (:35), GET /skills (:56), GET /skills/:id (:63); baseLocals (:13-15)
- Templates: index.ejs, projects/list.ejs, projects/detail.ejs, skills/list.ejs, skills/detail.ejs, error.ejs, partials/header.ejs, partials/footer.ejs
- Static assets: public/css/styles.css (express.static, app.js:102)

### 3. Internal collaborators (with file:line)
- Repositories (read-only queries): profileRepo (publicRoutes.js:20), projectRepo (:22, :30, :37, :45-47), skillRepo (:23, :58, :65, :73-74), claimRepo (:49, :75)
- Views layer only: no repository writes from the public routes

### 4. Forbidden collaborators (with the reason)
- No writes: the public boundary is GET-only (publicRoutes.js:11 comment; enforced globally at app.js:88-92 — non-/manage state-changing methods → 405)

### 5. Data it owns
- None: the public boundary is read-only; it reads all published domain data (docs/09 §5: "Public Presentation | Read‑only views | All published domain data (read‑only)")

### 6. Data it reads but does not own
- All published content: profile, projects, skills, claims, evidence (via the repositories' publication-filtered queries)

### 7. Failure modes (each mapped to an HTTP status or thrown error type)
- 404: unknown route (app.js:110-120); unpublished/missing project or skill detail (publicRoutes.js:38-44, 66-72)
- 405: non-GET methods outside /manage (app.js:88-92)
- 500: repository failures passed to errorHandler (publicRoutes.js:25, 33, 53, 60, 79)

### 8. Isolation test plan: the minimal tests that prove this module works end-to-end WITHOUT any other module implemented
Stubs/fakes required: none — the public routes are tested over HTTP with the real stack (tests/content.test.js, tests/publication.test.js).
Justification: no collaborator fakes are needed; the read flows are exercised end-to-end over HTTP.
Tests needed (all covered by the existing suite): homepage renders only after publish (tests/content.test.js:48-58); 404 for unknown project detail (tests/content.test.js:27-33); publication-state isolation (tests/publication.test.js); honest accessibility rendering (the invariant rendering in detail.ejs).

### 9. Build order: the exact sequence from empty directory to passing isolation test
1. Install dependencies (express, ejs)
2. src/routes/publicRoutes.js with the read-only queries
3. Views: index, projects/*, skills/*, error, partials
4. public/css/styles.css
5. Mount in src/app.js (publicRoutes last, app.js:107)
6. HTTP tests
7. npm test

### 10. Deletion candidates: anything not required by a traced requirement
- None: every template is rendered by a live route; baseLocals is used by every public route; public/css/styles.css is served by express.static and linked via partials/header.ejs.

## Task D — Scrutiny findings for MOD-007

Files examined: src/routes/publicRoutes.js, src/views/index.ejs, projects/list.ejs, projects/detail.ejs, skills/list.ejs, skills/detail.ejs, error.ejs, partials/header.ejs, partials/footer.ejs, public/css/styles.css (referenced).

### Dead code test
- All five public routes are registered (publicRoutes.js:18, 28, 35, 56, 63) and mounted (app.js:107). All templates are rendered by live routes. baseLocals is used by every public route (publicRoutes.js:24, 31, 51, 59, 77). No dead code.

### Duplication test
- The detail routes (publicRoutes.js:35-54 and 63-80) share the same publication-gate and claimsWithEvidence pattern — a repeated route-layer idiom across two routes, parameterized per entity; acceptable at the route layer. No in-template duplication of the honest-rendering invariant beyond the two detail templates' shared idiom (documented, presentation-only).

### Framework-convenience test (does it hide a data flow?)
- No. EJS templates are presentation-only: rg "require(|connectDB|prepare(|process." across all public views → no matches (no logic leakage; no business logic in templates).

### Dependency test (actually imported?)
- Yes: publicRoutes is imported and mounted last (app.js:107) so /manage routes take precedence.

### Abstraction test (corrected — scope qualifier mandatory)
Classification applied before the ≥2-caller rule:
- baseLocals: module public surface method (route-layer helper) — reachable from every public route (5 call sites) — reachable → KEEP. 5 callers in any case.
- All five route handlers: reachable (registered routes) → KEEP.
- No unreachable abstraction exists in this module.

### Template test (rendered by a route?)
- index.ejs by publicRoutes.js:24; projects/list.ejs by :31; projects/detail.ejs by :50; skills/list.ejs by :59; skills/detail.ejs by :76; error.ejs by app.js:112, manageRoutes.js:38, errorHandler.js:30-53; partials included by all. All pass.

### Route test (handler + test + documented contract?)
- GET /: documented docs/10 §6 (line 41); tested tests/content.test.js:48-58.
- GET /projects, /projects/:id, /skills, /skills/:id: documented docs/10 §6 (lines 42-45); tested tests/content.test.js:27-33 and tests/publication.test.js. Pass.
- Route-shape note: docs/10 §6 specifies `/projects/:idOrSlug`; the implementation uses `/projects/:id(\d+)` and `/skills/:id(\d+)`. docs/10 §6 states ":idOrSlug = identifier or optional slug per Stage 4.3 §15 (slugs are presentation attributes, not security boundaries)"; docs/09 §15 states slugs "may be stored as optional unique fields for readability only" — the optional slug decision was not taken (rg "slug" src/db/schema.sql src/repositories → no matches), so the identifier part of the contract is satisfied; no slug exists. Recorded as a contract-shape note, not a defect: the frozen design made slugs optional and none exist.

### Middleware test (registered? order justified?)
- The public boundary is GET-only, enforced globally before CSRF (app.js:85-92) so the method contract is not masked by token errors; publicRoutes is mounted last (app.js:107). Verified by tests across the suite. Pass.

### Configuration test (env var read, documented, validated at boot?)
- Not applicable at module level. Pass.

### Naming test (matches domain vocabulary in docs/05?)
- Pass: routes and templates use the domain vocabulary (projects, skills, claims, evidence).

### Honesty test (any public rendering implying verifiability for Private/Redacted/Unavailable evidence?)
- Verified: the honest-rendering invariant is present in projects/detail.ejs:42, :66 and skills/detail.ejs:27 — "This evidence is not publicly accessible; it cannot be independently verified here." for non-public evidence; Public evidence renders the actionable link with rel="noopener noreferrer" (projects/detail.ejs:36, :60). The homepage renders the profile only when Published (publicRoutes.js:21). Draft/unpublished details return 404 publicly. Pass.

## Task E — Ledger entries for MOD-007

No entries: all scrutiny tests pass. The route-shape note (idOrSlug vs :id) is recorded in Task D as a contract-shape note, not a defect: docs/09 §15 makes slugs optional and the frozen design's identifier requirement is satisfied. No behaviour is invented; no abstraction is unreachable.

## Task F — Verification matrix for MOD-007

| Ledger entry | Test that proves it | Command to run | Expected output |
|--------------|---------------------|----------------|-----------------|
| — (honesty test) | Honest-rendering invariant present | `rg -n "This evidence is not publicly accessible" src/views` | projects/detail.ejs:42, :66; skills/detail.ejs:27 |
| — (template test) | No logic leakage in views | `rg -n "require\(\|connectDB\|prepare\(\|process\." src/views` | No matches found |
| — (route-shape note) | No slug columns exist | `rg -n "slug" src/db/schema.sql src/repositories` | No matches found |

## Task G — What I could not verify

- WCAG 2.2 AA compliance in full (docs/13 §11): automated axe testing and manual screening are deferred to the testing stage per docs/13 §20 (DEFER-TEST-05/07); the CSS implements focus-visible outlines, 44px touch targets, and reduced-motion preferences (docs/16 ledger Section 7). Deferred; no open work recorded in this dossier.
- Responsive breakpoints across real devices: deferred per docs/13 §11; no open work recorded in this dossier.

## Pass Closure — MOD-007 dissection, 2026-10-10
- Methodology: the corrected dissection methodology (ADJ-004-013; scope qualifier mandatory).
- ADJ-007 entries: none required — all scrutiny tests pass; the route-shape note (idOrSlug vs :id) is recorded in Task D as a contract-shape note (slugs optional per docs/09 §15; no slug exists; the identifier satisfies the contract).
- Source files changed by this pass: none (dissection only).
- MOD-007 entry status: DONE 0; PROPOSED 0; WONTFIX — JUSTIFIED 0; BLOCKED 0.
- MOD-007 ledger complete; all seven module ledgers are complete.
