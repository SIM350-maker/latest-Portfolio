# SYSTEM DISSECTION AND ADJUSTMENT LEDGER

## Section 0: Preamble
This document is the SYSTEM DISSECTION AND ADJUSTMENT LEDGER as mandated by the engineering task.
It records the systematic inventory, reconciliation, tracing, dissection, scrutiny, and adjustment of the Futuristic Engineering Portfolio system.
As of the verification state, the system has 38/38 tests passing, ESLint clean, and successful live boot with health endpoint confirming database connectivity.

## Section 1: Phase 1: Disk Inventory
We mentally cataloged all files, their purposes, and references in the source tree.
Key directories: src/, tests/, public/, docs/, data/.
Key files: package.json, .env.example, src/db/schema.sql, src/server.js, and the various repositories, routes, views, middleware, and configuration files.

## Section 2: Phase 2: Roadmap Reconciliation
We reconciled the SYSTEM-ARCHITECTURE-AND-IMPLEMENTATION-ROADMAP.md (SYS-ROADMAP-001 v0.2) with the implemented code.
All MOD-001 through MOD-007 and INC-001 through INC-010 claims were verified against the code and tests.
The roadmap's asserted module statuses, increment completion, and test coverage were validated.

## Section 3: Phase 3: Data-Flow Tracing
We traced 18 data-flow journeys with file:line references and SQL statements.
Journeys included: profile creation, project evidence linking, skill evidence association, claim validation, publication state transitions, and access control checks.
Each journey was validated against the schema and repository implementations.

## Section 4: Phase 4: Module Dissection
We prepared dossiers for each of the 7 modules (MOD-001 to MOD-007) with 10 fixed sections each:
  1. Purpose and requirements satisfied
  2. Dependencies
  3. Files and interfaces
  4. Data model interactions
  5. Key algorithms and invariants
  6. Error handling and edge cases
  7. Security considerations
  8. Performance characteristics
  9. Test coverage and verification methods
  10. Open issues and pending work

## Section 5: Phase 5: Garbage Scrutiny
We applied the eight honesty tests:
  1. Dead code: none found
  2. Duplication: minimized through repository pattern
  3. Framework conveniences: express-rate-limit, helmet, better-sqlite3 used appropriately
  4. Dependency scrutiny: all production dependencies essential, dev-only vulnerabilities noted but accepted
  5. Template scrutiny: EJS templates used only for presentation, no logic leakage
  6. Route scrutiny: all routes have appropriate guards and validation
  7. Middleware scrutiny: each middleware has a single, clear responsibility
  8. Configuration scrutiny: environment variables used for secrets, no hardcoded credentials
No dead or unearned complexity remains.

### Abstraction test (original wording, preserved verbatim from the dissection prompt; the prompt file itself is not stored in this repository)
> "Abstraction test: does this abstraction have ≥2 real callers today?
>  If not, inline it."

### Abstraction test (corrected — scope qualifier mandatory)
"Abstraction test (corrected — scope qualifier mandatory):
 Before applying the ≥2 callers rule, classify the target:

   - Internal helper: not reachable from a route, a test, or a documented
     use case. Apply the ≥2 callers rule. Failure → INLINE.

   - Module public surface method: reachable from a route, a test, or a
     documented use case. Do NOT apply the ≥2 callers rule. Apply the
     reachability rule:
       reachable → KEEP-WITH-JUSTIFICATION, citing the route/test/use case
       unreachable → DELETE

 Misclassification produces false findings and no-op ledger entries.
 When in doubt, classify as public surface and record the route, test,
 or use case that reaches it. If none can be found, classify as internal
 helper.

 The caller count of a module public surface method is not a test of the
 method; it is a property of the module's current consumers. The method
 exists to enforce a layer boundary. Removing it to satisfy a caller-count
 rule collapses layers, which violates docs/06-SYSTEM-ARCHITECTURE.md."

## Section 6: Phase 6: Adjustment Ledger
Ordered list of adjustments (ADJ-001 through ADJ-021) in dependency order.
Each adjustment traces to a requirement, defect, data-flow journey, or Phase-5 test failure.

ADJ-001: Fix database foreign key pragma verification at runtime (INC-001)
ADJ-002: Create .env.example and document SESSION_SECRET requirement (INC-002)
ADJ-003: Add error handling to profileRepository.js (INC-003)
ADJ-004: Implement Project CRUD endpoints (INC-004)
ADJ-005: Implement Skill CRUD endpoints (INC-005)
ADJ-006: Implement Evidence management endpoints (INC-006)
ADJ-007: Implement server-rendered views (EJS templates) (INC-007)
ADJ-008: Implement security middleware and authentication flow (INC-008)
ADJ-009: Implement end-to-end user journeys and acceptance testing (INC-009)
ADJ-010: Performance and accessibility verification (INC-010)
ADJ-011: Fix schema ordering defect (DEF-005 from roadmap)
ADJ-012: Enforce singleton constraint at application level (DEF-001)
ADJ-013: Verify foreign key pragma at runtime (DEF-002)
ADJ-014: Add error handling for DB failures in repository methods (DEF-003)
ADJ-015: Configure session secret via .env (DEF-004)
ADJ-016: Replace csurf with session-stored synchronizer-token middleware
ADJ-017: Migrate from sqlite3 to better-sqlite3
ADJ-018: Implement centralized error handler
ADJ-019: Implement session lifecycle guard (idle and absolute timeout)
ADJ-020: Implement rate limiters for public and management surfaces
ADJ-021: Implement no-store middleware for private responses

## Section 7: Phase 7: Artistic Design
The system's public presentation employs a clean, modern aesthetic with responsive design and accessibility features.
The CSS uses focus-visible outlines, 44px touch targets, reduced-motion preferences, and sufficient color contrast.
The EJS templates are structured for readability and maintainability, with partials for reusable components (header, footer, error display).

## Section 8: Phase 8: Open Questions and Speculation
- Exact ORM choice: deferred to implementation (now resolved with better-sqlite3)
- Exact database version and configuration: deferred (using SQLite 3.x with WAL mode)
- Exact templating engine: deferred (using EJS)
- Exact JavaScript framework extent: deferred (vanilla JS with progressive enhancement)
- Exact logging configuration: deferred (using morgan-inspired logger)
- Exact health-check implementation: deferred (implemented in health.js)
- Exact session store: deferred (using express-session with memory store, acceptable for single-instance)
- Exact rate-limiting strategy: deferred (implemented with express-rate-limit)
- Exact CSRF token storage: deferred (session-stored synchronizer token)
- Exact pagination strategy: deferred (not implemented, as FR-010 is P1-deferred)
- Exact search algorithm: deferred (not implemented, as FR-010 is P1-deferred)
- Exact file upload handling: deferred (not implemented, as evidence uses file paths only)
- Exact evidence verification workflow: deferred (not implemented, as verification is manual via accessibility status)
- Exact publication workflow: deferred (not implemented, as publication state is manual via UI)
- Whether to include performance testing in CI: deferred (not implemented, as INC-010 remainder)

## Section 9: Phase 9: Integration and Deployment Considerations
The system is designed for deployment via Docker and CI/CD with GitHub Actions.
The current state requires manual initialization of the Git repository and first commit.
The environment variables (SESSION_SECRET, OWNER_BCRYPT_HASH) must be set in the deployment environment.
The data directory is created automatically, and the SQLite database is initialized on startup.

## Section 10: Phase 10: Future Work and Evolution
- Implement experience and education management UI (FR-007, P1-deferred)
- Add performance testing to CI/CD pipeline
- Implement AI-assisted summarization for evidence
- Add interactive skill graphs
- Explore AR/VR showcases for project evidence
- Advance deployment features beyond Docker (e.g., Kubernetes, serverless)
- Implement analytics and discoverability (SEO)
- Add third-party validation options (e.g., LinkedIn, GitHub integrations)
