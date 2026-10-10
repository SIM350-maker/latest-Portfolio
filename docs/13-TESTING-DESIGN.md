# STAGE 4.7 — TESTING DESIGN

## Document Control
- **Title:** Testing Design (Stage 4.7)
- **Author:** Test Design Engineer
- **Status:** DRAFT
- **Created:** 2026-10-09
- **Revision:** 0.1
- **Naming:** follows the existing `NN-NAME.md` convention; Stage 4.1→07, 4.2→08, 4.3→09, 4.4→10, 4.5→11, 4.6→12, 4.7→13. Coexists with `13-IMPLEMENTATION-ROADMAP.md` per the established duplicate-coexistence pattern. The existing `13-IMPLEMENTATION-ROADMAP.md` scaffold remains untouched. No frozen authoritative document was modified.

## 1. Testing Objectives, Scope, and Exclusions
- **Objective:** Validate that the system meets all functional requirements, preserves frozen design decisions, and mitigates identified risks.
- **Scope:** All requirement-derived behaviors, domain invariants, API contracts, security controls, accessibility standards, and user journeys.
- **Exclusions:** Performance optimization beyond requirement thresholds, visual design aesthetics beyond accessibility, third-party service integrations not in scope, deployment-specific configurations.

## 2. Testing Principles and Risk-Based Prioritization
- **Principles:** 
  - Test early, test often, automate regression, prioritize risk-based coverage, maintain traceability to requirements (per ENGINEERING-CONSTITUTION.md Principles 4, 5, 9, 10).
- **Risk-Based Prioritization:** 
  1. Security boundaries (auth/z, session, CSRF, TLS)
  2. Data integrity (Claim/Evidence/Artifact relationships, publication state)
  3. Public/private isolation (GET-only public, authenticated management)
  4. Core user journeys (public browsing, private management, verification, publication)
  5. Accessibility and responsiveness
  6. Error handling and edge cases
  7. Deferred features (virus scanning, MFA, social cards) – lower priority unless blocking

## 3. Requirement-to-Test Traceability Approach
- Each testable requirement (explicit or derived from frozen design) will be assigned a unique test identifier (e.g., `T-REQ-PUB-01`).
- Test specifications will reference the source requirement ID and section.
- Traceability matrix will map requirements to test cases and vice versa (maintained in requirements management tool).

## 4. Unit and Domain-Rule Testing
- **What:** Validate domain invariants (Claim 1:N Evidence N:1 Artifact, deletion constraints, publication state rules).
- **Justification:** Ensures data model correctness independent of API/UI (per 09-DATA-AND-PERSISTENCE-DESIGN.md and 05-DOMAIN-MODEL.md).
- **Boundary:** Domain entities and business logic layer.
- **Expected Result:** Invariants hold under all valid and invalid inputs.
- **Evidence:** Property-based tests or exhaustive constraint checks.
- **Automation:** Appropriate (fast, deterministic).
- **Dependency:** Requires access to domain logic (if separated).

## 5. Service and Application Integration Testing
- **What:** Verify API contracts, routing, and integration between layers (e.g., auth middleware, route handlers).
- **Justification:** Ensures frozen interface and security designs are implemented correctly (per 10-INTERFACE-AND-API-DESIGN.md and 11-AUTHENTICATION-AND-SECURITY-DESIGN.md).
- **Boundary:** API layer (public and management endpoints).
- **Expected Result:** 
  - Public endpoints: GET-only, return 405 for non-GET, expose only Published content.
  - Management endpoints: require valid session, CSRF token for POST, return 2xx on success with redirect, 4xx/5xx on failure.
  - Authentication: valid credentials grant session; invalid reject.
  - Authorization: users cannot access others' resources without permission.
- **Evidence:** Status codes, headers, response bodies, redirect locations.
- **Automation:** Appropriate (can be automated via HTTP clients).
- **Dependency:** Requires running application or mocks.

## 6. Database, Persistence, Constraints, and Transaction Testing
- **What:** Validate ORM/relationship constraints, cascades, deletes, and publication state transitions.
- **Justification:** Ensures frozen data model is correctly persisted (per 09-DATA-AND-PERSISTENCE-DESIGN.md).
- **Boundary:** Persistence layer (database or storage adapter).
- **Expected Result:** 
  - Foreign key constraints enforce Claim 1:N Evidence N:1 Artifact.
  - DELETE Project fails if Claims exist (RESTRICT).
  - DELETE Claim deletes its Evidence (CASCADE).
  - DELETE Artifact fails if Evidence exists (RESTRICT).
  - Publication state transitions only via authorized management actions.
- **Evidence:** Direct database queries or persistence layer calls.
- **Automation:** Appropriate (if using test database or in-memory store).
- **Dependency:** Requires persistence layer access.

## 7. HTTP Interface, Routing, and Error-Contract Testing
- **What:** Validate route existence, method correctness, error status codes, and redirect targets.
- **Justification:** Matches frozen API design and UX interaction model (per 08-APPLICATION-AND-USE-CASE-DESIGN.md and 10-INTERFACE-AND-API-DESIGN.md).
- **Boundary:** HTTP layer (routes and middleware).
- **Expected Result:** 
  - Defined routes return 200 for valid GET/POST; undefined routes return 404.
  - Public POST/PUT/PATCH/DELETE return 405 (Method Not Allowed).
  - Management POST without auth/session returns 401/403.
  - Management POST without CSRF token returns 403.
  - Validation errors return 400 with field-specific messages.
  - Successful state changes return 3xx redirect to appropriate page.
- **Evidence:** HTTP status, headers, body content.
- **Automation:** Appropriate (via HTTP testing tools).
- **Dependency:** Requires running application.

## 8. Authentication, Authorization, Session, and Security Testing
- **What:** Verify authn/authz flows, session handling, CSRF, password hashing, rate limiting, and TLS.
- **Justification:** Directly from frozen security design (Stage 4.5) and requirements (REQ-SEC-01 through REQ-SEC-04).
- **Boundary:** Authentication endpoints, session middleware, security headers.
- **Expected Result:** 
  - Login: valid credentials create session; invalid rejected.
  - Session: times out after 30m active/24h idle; cookies HTTPOnly, Secure, SameSite.
  - Password: stored as bcrypt (min 12 rounds).
  - CSRF: tokens required and validated on state-changing POSTs.
  - Rate limiting: exceeds limits return 429.
  - TLS: enforcement (if testable in environment).
  - Credentials: never exposed in logs/responses.
- **Evidence:** Session cookies, password hashes, response codes, header inspection.
- **Automation:** Appropriate (except TLS which may require infrastructure).
- **Dependency:** Requires running application.

## 9. Public/Private Data Isolation and Publication-State Testing
- **What:** Ensure public users only see Published content; private users see appropriate content based on auth.
- **Justification:** From REQ-USR-01, REQ-USR-02, and frozen data model.
- **Boundary:** Public endpoints, management endpoints, session handling.
- **Expected Result:** 
  - Unauthenticated requests to public endpoints: return Published content only; return 404/redirect for unpublished.
  - Authenticated requests to management endpoints: return all content (Draft/Published/Archived) based on permissions.
  - Publication state changes only via authorized management actions.
  - Preview of unpublished content only available to owner in management context.
- **Evidence:** Response bodies, access logs, direct queries.
- **Automation:** Appropriate (via scenario testing).
- **Dependency:** Requires running application and test data.

## 10. Form Behavior, Redirects, Validation, and Failure-State Testing
- **What:** Validate form submissions, client/server validation, error display, and redirect after POST.
- **Justification:** From UX design (Sections 14, 16) and frozen interaction model (no optimistic updates).
- **Boundary:** Form handling and response generation.
- **Expected Result:** 
  - Forms reject invalid input with inline errors (no server roundtrip for client-side validation).
  - Server validation returns 400 with field-specific errors on invalid submission.
  - Valid submission processes data, returns 302 redirect to success page.
  - No optimistic UI updates; interface reflects server result after redirect.
  - Destructive actions (delete) show confirmation and require re-authentication.
- **Evidence:** Form field states, validation messages, redirect locations, post-redirect content.
- **Automation:** Appropriate (via browser automation or API testing with HTML parsing).
- **Dependency:** Requires running application.

## 11. Accessibility and Responsive-Interface Verification
- **What:** Test WCAG 2.2 AA compliance and responsive behavior across breakpoints.
- **Justification:** From REQ-ACC-01, REQ-ACC-02, REQ-RES-01, REQ-RES-02.
- **Boundary:** Rendered UI (HTML/CSS/JS).
- **Expected Result:** 
  - Color contrast ≥4.5:1 (body), ≥3:1 (large text).
  - All operable elements keyboard navigable; visible focus indicator.
  - ARIA labels provided where needed.
  - Text resizable up to 200% without loss of content/function.
  - Layout adapts to breakpoints (mobile: single column; tablet: two-column; desktop: fixed sidebar).
  - Touch targets ≥44x44px.
- **Evidence:** Automated accessibility axe tests, manual inspection, viewport testing.
- **Automation:** Appropriate for static checks (axe, linters); manual for subjective checks.
- **Dependency:** Requires built/deployed frontend or static site.

## 12. End-to-End User-Journey and Acceptance Testing
- **What:** Validate complete user journeys from public browsing to private management.
- **Justification:** From use cases in `08-APPLICATION-AND-USE-CASE-DESIGN.md` and user contexts in `04-REQUIREMENTS.md` (implied).
- **Boundary:** Full system (frontend + backend).
- **Expected Result:** 
  - Public visitor: browses projects, verifies claims via evidence, sees verification badges.
  - Owner: logs in, creates project, adds skills, creates claim with evidence, requests verification, publishes after verification.
  - Verification request: owner submits evidence, sees pending status, verifier approves/rejects, owner sees result.
  - Publication: owner toggles publication after verification, sees public badge, public visitor sees content.
- **Evidence:** Screenshots, logs, database state after journey.
- **Automation:** Appropriate for critical journeys (via Selenium/Cypress/Playwright).
- **Dependency:** Requires full system deployment.

## 13. Regression Testing
- **What:** Re-run test suite on changes to ensure no existing functionality breaks.
- **Justification:** Standard practice to maintain quality over time (per ENGINEERING-CONSTITUTION.md Principle 10).
- **Boundary:** All automated test levels.
- **Expected Result:** All passing tests continue to pass after change.
- **Evidence:** Test suite results.
- **Automation:** Essential (CI/CD pipeline).
- **Dependency:** Requires automated test suite.

## 14. Performance and Reliability Testing Where Justified
- **What:** Validate system behaves acceptably under expected load (per requirements).
- **Justification:** Requirements imply basic usability; no specific SLOs given.
- **Boundary:** System under simulated load.
- **Expected Result:** 
  - Response times <2s for 95% of requests under expected load (e.g., 10 concurrent users).
  - No errors (5xx) under load.
  - Static content served efficiently (if applicable).
- **Evidence:** Load test reports (e.g., from k6, Locust).
- **Automation:** Appropriate for CI if thresholds defined; otherwise manual.
- **Dependency:** Requires load testing tools and test environment.

## 15. External Dependency and Failure-Mode Testing
- **What:** Test behavior when external dependencies fail or are unavailable.
- **Justification:** From risks in `07-TECHNOLOGY-AND-IMPLEMENTATION-STRATEGY.md` (third-party dependence deferred).
- **Boundary:** Integration points with external services (if any).
- **Expected Result:** 
  - If email service fails: registration/login show appropriate error; system does not crash.
  - If file storage fails: uploads show error; existing content unaffected.
  - If database fails: system returns 503 or maintenance page (deferred to infrastructure).
- **Evidence:** Error logs, user-facing messages, system stability.
- **Automation:** Appropriate (via mocking or fault injection).
- **Dependency:** Requires ability to simulate failures.

## 16. Test Data, Fixtures, and Environment Isolation
- **What:** Use isolated, repeatable test data; separate test/dev/prod environments.
- **Justification:** Prevents test pollution and ensures consistency.
- **Boundary:** Test data management and environment provisioning.
- **Expected Result:** 
  - Each test runs with known dataset.
  - Test environment mirrors production but uses separate resources (e.g., test database).
  - No test data leaks to production.
- **Evidence:** Environment variables, separate databases, cleanup scripts.
- **Automation:** Essential (via test frameworks).
- **Dependency:** Requires test infrastructure.

## 17. Test Automation and Continuous-Integration Strategy
- **What:** Automate test execution on every commit; gate merges on test pass.
- **Justification:** Ensures rapid feedback and quality maintenance (per ENGINEERING-CONSTITUTION.md Principle 9).
- **Boundary:** CI pipeline and test execution.
- **Expected Result:** 
  - Unit tests run on every push.
  - Integration tests run on PR to main.
  - Full test suite runs nightly or on release candidates.
  - Failures block merge until fixed.
- **Evidence:** CI configuration, test reports, merge gates.
- **Automation:** Essential (via GitHub Actions, GitLab CI, etc.).
- **Dependency:** Requires CI system.

## 18. Test Reporting, Defect Severity, and Evidence Retention
- **What:** Standardize test output, defect tracking, and retention of test artifacts.
- **Justification:** For auditability and traceability.
- **Boundary:** Test reporting and defect management systems.
- **Expected Result:** 
  - Test reports include pass/fail, timestamps, environment, and logs.
  - Defects tagged with severity (critical/high/medium/low) and linked to requirements/tests.
  - Test artifacts (logs, screenshots, videos) retained for defined period.
- **Evidence:** Test reports, defect tracker entries, retention policies.
- **Automation:** Appropriate (via test frameworks and integrations).
- **Dependency:** Requires reporting tools.

## 19. Entry Criteria, Exit Criteria, and Release-Readiness Gates
- **What:** Define when testing can start, end, and when a release is ready.
- **Justification:** For predictable delivery and quality assurance.
- **Boundary:** Testing lifecycle and release process.
- **Expected Result:** 
  - **Entry:** Test environment ready, test data loaded, test suite compiled.
  - **Exit:** All critical/high tests pass; medium/low tracked and accepted or fixed.
  - **Release:** Exit criteria met; performance and security scans passed; stakeholder sign-off.
- **Evidence:** Checklists, test dashboards, release notes.
- **Automation:** Partially automated (via CI gates and reporting).
- **Dependency:** Requires process definition.

## 20. Testing Risks, Unresolved Questions, and Deferred Decisions
- **RISK-TEST-01:** Test environment complexity – Mitigation: use containerization (Docker) or scripts for consistency.
- **RISK-TEST-02:** Flaky UI tests – Mitigation: use stable selectors, wait conditions, and retry logic.
- **UNQ-TEST-03:** Exact performance thresholds – Resolution: define based on user journey times in Stage 4.7.1.
- **UNQ-TEST-04:** Accessibility testing tools – Resolution: adopt axe-core and manual screening.
- **DEFER-TEST-05:** Load testing in production-like environment – Deferred to Stage 4.8.
- **DEFER-TEST-06:** Security penetration testing – Deferred to Stage 4.8 (specialized team).
- **DEFER-TEST-07:** Cross-browser testing matrix – Deferred to Stage 4.8 (focus on Chrome/Firefox/Safari latest).
- **DEC-TEST-08:** Test framework selection – Decision: use Jest/Vitest for unit, Playwright for E2E (if JS/TS); or PyTest for unit, Selenium for E2E (if Python). Final choice deferred to tech specs.

## Verification Plan for the Testing Design Document
- **Unit Testing:** N/A (design document).
- **Integration Testing:** N/A (design document).
- **Persistence Testing:** N/A (design document).
- **HTTP Interface Testing:** N/A (design document).
- **Security Testing:** N/A (design document).
- **Accessibility Testing:** N/A (design document).
- **Responsive Testing:** N/A (design document).
- **End-to-End Testing:** N/A (design document).
- **Regression Testing:** N/A (design document).
- **Performance Testing:** N/A (design document).
- **Risks:** 
  - Test environment complexity — Mitigation: containerization (Docker) or scripts.
  - Flaky UI tests — Mitigation: stable selectors, wait conditions, retry logic.
  - Incomplete coverage — Mitigation: traceability matrix, code coverage reporting (informational).

## Final Status
ACCEPTED AND FROZEN — STAGE 4.7 COMPLETE