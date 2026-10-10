# STAGE 4.11 — CORE IMPLEMENTATION AND FEATURE DEVELOPMENT

## Document Control
- **Title:** Core Implementation and Feature Development (Stage 4.11)
- **Author:** Implementation Engineer
- **Status:** DRAFT
- **Created:** 2026-10-13
- **Revision:** 0.1
- **Naming:** follows the existing `NN-NAME.md` convention; Stage 4.1→07, 4.2→08, 4.3→09, 4.4→10, 4.5→11, 4.6→12, 4.7→13, 4.8→14, 4.9→15, 4.10→16, 4.11→17. 

## 1. Purpose and Scope
This stage defines the core implementation and feature development for the portfolio system, translating the approved designs into a structured implementation plan. It covers the project structure, coding standards, feature decomposition, database schema, API endpoints, security mechanisms, testing strategies, and verification gates for feature development.

This stage is DESIGN ONLY. No implementation artifacts are created — no HTML, CSS, JavaScript, templates, components, stylesheets, client scripts, tests, or configuration that would be part of the final application. The output is a design document that guides implementation in Stage 4.12 (if any) or directly informs the implementation phase.

## 2. Authoritative Inputs
- **Authoritative requirements:** `docs/03-REQUIREMENTS.md` — ACCEPTED (Stage 1.1); FR-001 through FR-010, NFR-001, NFR-002, C-001, C-002 govern this design.
- **Frozen architectural/design decisions:** 
  - `docs/05-DOMAIN-MODEL.md` (ACCEPTED); 
  - `docs/06-SYSTEM-ARCHITECTURE.md` (ACCEPTED); 
  - `docs/07-TECHNOLOGY-AND-IMPLEMENTATION-STRATEGY.md` (Stage 4.1: Express + server-rendered HTML); 
  - `docs/08-APPLICATION-AND-USE-CASE-DESIGN.md` (Stage 4.2: use cases, commands, queries, business rules, error semantics); 
  - `docs/09-DATA-AND-PERSISTENCE-DESIGN.md` — **ACCEPTED AND FROZEN** (Stage 4.3, 253 lines verified from disk); 
  - `docs/10-INTERFACE-AND-API-DESIGN.md` — **AUDITED, ACCEPTED AND FROZEN** (Stage 4.4, 192 lines verified from disk); 
  - `docs/11-AUTHENTICATION-AND-SECURITY-DESIGN.md` — **ACCEPTED AND FROZEN** (Stage 4.5, 195 lines verified from disk).
  - `docs/12-UX-AND-INTERACTION-DESIGN.md` — **ACCEPTED AND FROZEN** (Stage 4.6, 42.5 KB verified from disk).
  - `docs/13-TESTING-DESIGN.md` — **ACCEPTED AND FROZEN** (Stage 4.7, 16.7 KB verified from disk).
  - `docs/12-TECHNOLOGY-DECISIONS.md` — **ACCEPTED AND FROZEN** (Stage 4.9, 31.2 KB verified from disk).
  - `docs/16-IMPLEMENTATION-FRAMEWORK-AND-ENVIRONMENT-SETUP.md` — **ACCEPTED** (Stage 4.10, accepted but not frozen).
- **Governance:** `docs/14-DECISION-LOG.md` (2026-10-12 entry: Stage 4.10 ACCEPTED; Stage 4.11 is the next authorized design stage); `docs/15-GOVERNANCE-AND-STAGE-LIFECYCLE.md`; `docs/ENGINEERING-CONSTITUTION.md`.

## 3. Implementation Phases and Increments
This stage is decomposed into small, independently verifiable increments, each delivering a coherent set of features that can be developed, tested, and integrated incrementally.

### Phase 1: Project Setup and Foundations
- Set up the repository structure (src/, tests/, public/).
- Configure build tools (npm scripts) and dependencies (as per `12-TECHNOLOGY-DECISIONS.md`).
- Implement basic server scaffolding (Node.js/Express) with routing middleware.
- Establish database connection (to be defined based on final selection: SQLite for dev, PostgreSQL for prod).
- Implement basic error handling and logging middleware.
- Implement security middleware (helmet, csurf, express-rate-limit).
- Implement session management (express-session).
- Create basic health-check endpoint.
- Create basic logging configuration.

### Phase 2: Core Data Models and Persistence
- Define database schema based on the frozen data model (`09-DATA-AND-PERSISTENCE-DESIGN.md`):
  - Tables: professional_identity, project, skill, claim, evidence, artifact, project_skill (many-to-many).
  - Define relationships: foreign keys, constraints (CASCADE/RESTRICT as per domain model).
  - Implement data access layer (DAO or repository pattern) using an ORM (e.g., Sequelize, TypeORM, Knex.js).
  - Implement basic CRUD operations for each entity.
  - Ensure foreign key constraints are enforced (either via database constraints or application logic).
  - Implement basic queries for fetching related data (e.g., project with its claims and evidence).

### Phase 3: API Endpoints and Serialization
- Implement RESTful API endpoints as per the frozen API design (`10-INTERFACE-AND-API-DESIGN.md`):
  - Public endpoints: GET only (for professional identity, projects, skills, claims, evidence, artifacts).
  - Management endpoints: POST for state changes (create, update, delete) with POST→redirect pattern.
  - Implement proper HTTP status codes (200, 201, 302, 400, 401, 403, 404, 405, 429, 503).
  - Implement input validation and sanitization.
  - Implement output serialization (JSON for API, HTML for server-rendered views).
  - Implement CSRF token generation and validation for management POST endpoints.
  - Implement session-based authentication middleware.

### Phase 4: Server-Rendered Views and Templates
- Implement server-rendered HTML views using a templating engine (EJS, Pug, or Handlebars).
- Implement views for:
  - Professional identity page (home).
  - Project list and detail pages.
  - Skill list and detail pages.
  - Evidence and artifact display (as part of project/skill detail).
  - Management dashboard and entity lists (projects, skills, claims, evidence, artifacts).
  - Entity create/edit forms.
  - Error pages (404, 500).
  - Health-check endpoint (simple text or JSON).
- Implement responsive design (CSS media queries) and accessibility features (semantic HTML, ARIA labels, focus management, keyboard navigation, color contrast, touch targets ≥44px).
- Implement progressive enhancement (basic functionality works without JavaScript, enhanced with JS).

### Phase 5: Feature Development
- Implement core features incrementally, each as a small, testable unit:
  - Professional identity CRUD.
  - Project CRUD with associated skills and evidence.
  - Skill CRUD with associated projects and evidence.
  - Claim CRUD with associated evidence.
  - Evidence CRUD (upload, metadata, association).
  - Artifact CRUD (metadata, association, external link or file reference).
  - Evidence accessibility status (Public, Private/Restricted, Redacted, Unavailable) and display logic.
  - Claim-to-evidence traceability (bidirectional links).
  - Publication state management (Draft/Published/Archived) for projects, with publication logic (only Published projects visible publicly).
  - Evidence verification workflow (request, pending, approved/rejected, expired).
  - Search and filtering capabilities (by name, date, status, etc.).
  - Pagination for lists.
- Each feature includes:
  - Database schema updates (if needed) via migrations.
  - API endpoint updates.
  - Server-rendered view updates.
  - Unit tests for business logic and data access.
  - Integration tests for API endpoints.
  - End-to-end tests for user journeys.
  - Error handling and validation.
  - Security considerations (authentication, authorization, CSRF, etc.).

### Phase 6: Testing and Quality Assurance
- Implement testing strategy as per `13-TESTING-DESIGN.md`:
  - Unit tests with Jest or Vitest.
  - Integration tests with Supertest or similar.
  - End-to-end tests with Playwright.
  - Test coverage targets (informational, not strict).
  - Automated testing on every pull request and push to main (via GitHub Actions).
  - Linting (ESLint) and formatting (Prettier) in CI.
  - Dependency scanning (npm audit) in CI.
  - Health-check endpoint verification.
  - Accessibility testing (axe-core) and manual screening.
- Implement verification gates for each increment:
  - All unit tests pass.
  - All integration tests pass.
  - All end-to-end tests pass (if applicable).
  - Linting passes.
  - No high/critical vulnerabilities from npm audit.
  - Feature works as expected in manual verification.

### Phase 7: Deployment and Release Preparation
- Define deployment process (to be refined in Stage 4.12):
  - Build process (if applicable, e.g., for static assets).
  - Migration execution (database schema updates).
  - Start the application (via process manager: PM2, systemd, Docker, or direct Node.js).
  - Health-check verification.
  - Smoke testing.
- Define release criteria:
  - All features implemented and tested.
  - All tests pass (unit, integration, end-to-end).
  - Linting and formatting pass.
  - Dependency scan within acceptable limits.
  - Documentation updated.
  - Release notes prepared.

## 4. Implementation Boundaries and Constraints
- **Public Interface:** 
  - Must be GET-only, exposing only Published content (projects with publication status = Published).
  - Must not allow state changes via public endpoints (no POST, PUT, DELETE, PATCH).
  - Must not allow optimistic UI updates.
- **Private Management Interface:** 
  - Must be authenticated (session-based).
  - Must use POST for state-changing commands with POST→redirect.
  - Must include CSRF protection on all state-changing POSTs.
  - Must include input validation and sanitization.
  - Must include error handling and user feedback.
- **Data Model Constraints:** 
  - Must enforce Claim 1:N Evidence N:1 Artifact (foreign keys, CASCADE/RESTRICT deletes).
  - Must enforce publication state only on Project (Draft/Published/Archived).
  - Must not include a universal Content wrapper.
  - Must enforce that publication requires all Claims to have Verified Evidence.
  - Must restrict private preview to authenticated owners only.
- **Security Constraints:** 
  - Must implement server-side authentication and authorization.
  - Must use HTTPS in production (TLS 1.3 minimum).
  - Must implement CSRF protection via synchronizer token pattern.
  - Must implement rate limiting (100/min/IP public, 10/min/IP management).
  - Must implement secure session handling (HTTPOnly, Secure, SameSite cookies; timeout 30m active, 24h idle).
  - Must hash passwords with bcrypt (minimum 12 rounds).
  - Must not store sensitive data in plaintext (credentials, session data, PII).
  - Must implement security headers (CSP, X-Frame-Options, X-Content-Type-Options).
- **Accessibility Constraints:** 
  - Must conform to WCAG 2.2 AA.
  - Must be navigable via keyboard.
  - Must provide visible focus indicator.
  - Must provide ARIA labels where needed.
  - Must ensure text is resizable up to 200% without loss of content or function.
  - Must ensure touch targets are at least 44x44px.
  - Must respect reduced motion media query.
- **Technology Constraints:** 
  - Must use Node.js/Express as the runtime.
  - Must use server-rendered HTML for views.
  - Must use npm for package management.
  - Must use Git for version control.
  - Must use GitHub Actions for CI/CD (as per technology decisions).
  - Must use an ORM (Sequelize, TypeORM, Knex.js) for database interaction.
  - Must use environment variables for configuration (with .env.example template).
  - Must not leak secrets to logs or version control.

## 5. Error Handling, Validation, and Failure-State Testing
- **Error Handling:** 
  - Implement centralized error handling for the application.
  - Return appropriate HTTP status codes (4xx for client errors, 5xx for server errors).
  - Log errors with sufficient context for debugging but without exposing sensitive data.
  - Distinguish between validation errors (400) and authentication/authorization errors (401/403).
  - Implement retry logic for transient errors (where applicable).
- **Validation:** 
  - Implement client-side validation (where appropriate) for immediate feedback.
  - Implement server-side validation for all inputs (as the ultimate line of defense).
  - Provide inline error messages for form fields.
  - Provide summary banner for multiple errors.
  - Provide clear remediation guidance (e.g., "File must be PDF under 10MB").
- **Failure States:** 
  - Implement 404 page (friendly message, search bar, links to home/projects/skills, report broken link option).
  - Implement 500 page (apologetic message, error reference ID, contact admin link, no stack traces exposed).
  - Implement network error handling (offline detection, cached read-only content, warning for management actions offline).
  - Implement edge case handling (duplicate skill name prevention, evidence file type rejection with alternatives, claim text sanitization for XSS prevention).
  - Ensure error messages are announced via ARIA-live for accessibility.
  - Ensure focus is trapped in modal until resolved.
  - Ensure contrast is maintained in error states.

## 6. Feature Decomposition and Traceability
Each feature is decomposed into small, independently verifiable increments and traced to upstream requirements and design decisions:

- **FR-001 (Professional Profile Presentation):** 
  - Implemented in Phase 4 (views) and Phase 5 (CRUD features).
  - Traced to requirements and UX design (Section 7: Home Experience).
- **FR-002 (Project Evidence Presentation):** 
  - Implemented in Phase 2 (data model), Phase 3 (API), Phase 4 (views), Phase 5 (CRUD and evidence association).
  - Traced to requirements and UX design (Section 8: Projects Experience).
- **FR-003 (Claim-to-Evidence Traceability):** 
  - Implemented in Phase 2 (data model), Phase 4 (views), Phase 5 (CRUD and traceability features).
  - Traced to requirements and UX design (Section 10: Claim / Evidence Experience).
- **FR-004 (Skills Representation with Evidence Traceability):** 
  - Implemented in Phase 2 (data model), Phase 4 (views), Phase 5 (CRUD and skill-evidence associations).
  - Traced to requirements and UX design (Section 9: Skills Experience).
- **FR-005 (Content Management System):** 
  - Implemented in all phases (data model, API, views, CRUD features).
  - Traced to requirements and UX design (Sections 7-10).
- **FR-006 (Evidence Accessibility Status Representation):** 
  - Implemented in Phase 2 (data model attributes), Phase 4 (views), Phase 5 (CRUD and evidence features).
  - Traced to requirements and UX design (Section 10: Claim / Evidence Experience).
- **FR-007 (CV/Resume Generation):** 
  - Deferred to Stage 4.12 (not implemented in this stage).
- **FR-008 (Responsive Design):** 
  - Implemented in Phase 4 (CSS media queries, responsive layouts).
  - Traced to requirements and UX design (Section 19: Responsive Design).
- **FR-009 (Accessibility Compliance):** 
  - Implemented in Phase 4 (semantic HTML, ARIA, focus visible, touch targets ≥44px, text resizable up to 200%).
  - Traced to requirements and UX design (Sections 13, 19, 20: Accessibility Experience, Responsive Design, Accessibility Standards / Recommendations).
- **FR-010 (Performance Optimization):** 
  - Implemented through efficient code, database indexing, caching strategies (to be defined in implementation), and asset optimization.
  - Traced to requirements and UX design (Section 10: Claim / Evidence Experience, Section 19: Responsive Design, Section 20: Accessibility Standards / Recommendations).
- **NFR-001 (Security - Data Protection):** 
  - Implemented through authentication, authorization, secure session handling, CSRF protection, rate limiting, security headers, input validation/sanitization, output escaping, secure password hashing, and dependency scanning.
  - Traced to requirements and UX design (Section 20: Security Consistency, Section 11: Accessibility Experience, Section 16: Form Interaction Model, Section 8: API and Security Consistency).
- **NFR-002 (Maintainability - Content Updates):** 
  - Implemented through separation of concerns (data model, API, views, business logic), use of ORM, clear project structure, and dependency management.
  - Traced to requirements and UX design (Section 2: Authoritative Inputs, Section 16: Form Interaction Model, Section 20: Security Consistency).
- **C-001 (Technology Selection Constraint):** 
  - Satisfied by selecting technologies based on fitness-for-purpose (Node.js/Express, server-rendered HTML, ORM, etc.) rather than popularity.
  - Traced to requirements and UX design (Section 2: Authoritative Inputs, Section 20: Security Consistency).
- **C-002 (Evidence-First Constraint):** 
  - Satisfied by evaluating every feature/design decision against its ability to support evidence presentation and verification.
  - Traced to requirements and UX design (Section 2: Authoritative Inputs, Section 20: Security Consistency).

## 7. Progress Tracking, Decision Recording, and Change-Control Rules
- **Progress Tracking:** 
  - Use a project management tool (e.g., Jira, Trello, or simple Kanban board) to track features, bugs, and tasks.
  - Link commits to issues or tickets via commit messages (e.g., "feat: add user login #123").
  - Use burndown charts or velocity tracking if desired.
- **Decision Recording:** 
  - Record significant architectural or design decisions in this document or in a separate architecture decision log (ADR).
  - For minor decisions, rely on commit messages and code comments.
  - Ensure decisions are evidence-based and traceable to requirements or risks.
- **Change-Control Rules:** 
  - Use Git for version control.
  - Require pull requests for all changes to main.
  - Require at least one approval before merging.
  - Require all checks to pass (CI, tests, linting) before merging.
  - Squash or merge commits as per team preference (squash preferred for clean history).
  - Tag releases (e.g., v1.0.0) for traceability.
  - Maintain a changelog for users.

## 8. Exit Criteria
Stage 4.11 is considered complete when:
- The draft document is complete (all sections present with substantive content).
- The document ends with the exact line: `DRAFT — STAGE 4.11 COMPLETE — AWAITING AUDIT`.
- All claims are traceable to authoritative sources (requirements, frozen design documents, technology decisions, testing design, implementation framework, governance documents).
- No unsupported requirements are presented as mandatory.
- All proposals, recommendations, unresolved questions, and deferred decisions are explicitly labeled as such.
- The draft is internally consistent and does not contradict any frozen design document (Stages 3-4.10).
- The draft does not introduce new binding requirements or implementation details that should be reserved for Stage 4.12 (if any).

## 9. Risks, Deferred Decisions, and Unresolved Questions
- **RISK-IMPL-01:** Feature creep — Mitigation: Strict adherence to feature decomposition and increment planning; prioritize based on evidence and value.
- **RISK-IMPL-02:** Technical debt accumulation — Mitigation: Regular refactoring, code reviews, and adherence to coding standards.
- **RISK-IMPL-03:** Performance bottlenecks — Mitigation: Profile and optimize during implementation; use caching and indexing as needed.
- **RISK-IMPL-04:** Security vulnerabilities — Mitigation: Follow secure coding practices, regular audits, and dependency scanning.
- **RISK-IMPL-05:** Integration issues — Mitigation: Define clear interfaces (API, data access) and test integrations early.
- **RISK-IMPL-06:** Data migration complexity — Mitigation: Design migrations early, test backup and restore procedures, use version-controlled migration scripts.
- **DEFER-IMPL-01:** Advanced features (e.g., real-time collaboration, AI-assisted evidence analysis) — Defer to Stage 4.12 or later.
- **DEFER-IMPL-02:** Advanced performance optimizations (e.g., HTTP/2, server-side pushing, CDN) — Defer to Stage 4.12 or later.
- **DEFER-IMPL-03:** Advanced security features (e.g., Web Application Firewall, runtime application self-protection) — Defer to Stage 4.12 or later.
- **DEFER-IMPL-04:** Advanced observability (e.g., distributed tracing, APM, user behavior analytics) — Defer to Stage 4.12 or later.
- **UNQ-IMPL-01:** Exact ORM choice (Sequelize, TypeORM, Knex.js) — Resolution: define during implementation based on features and compatibility.
- **UNQ-IMPL-02:** Exact database version and configuration (e.g., PostgreSQL version, authentication method) — Resolution: define during implementation based on compatibility and features.
- **UNQ-IMPL-03:** Exact templating engine (EJS, Pug, Handlebars) — Resolution: define during implementation based on team expertise and performance needs.
- **UNQ-IMPL-04:** Exact CSS methodology (e.g., BEM, utility-first, CSS-in-JS) — Resolution: define during implementation based on team needs.
- **UNQ-IMPL-05:** Exact JavaScript framework or vanilla JS extent — Resolution: define during implementation; vanilla JS selected for simplicity.
- **UNQ-IMPL-06:** Exact logging configuration (levels, formats, transports) — Resolution: define during implementation based on operational needs.
- **UNQ-IMPL-07:** Exact health-check implementation (what it checks, how it responds) — Resolution: define during implementation based on system requirements.
- **UNQ-IMPL-08:** Exact session store (memory vs Redis vs database) — Resolution: define during implementation based on scaling needs.
- **UNQ-IMPL-09:** Exact rate-limiting strategy (global vs per-user/IP) — Resolution: define during implementation based on abuse patterns.
- **UNQ-IMPL-10:** Exact CSRF token storage (cookie vs header) — Resolution: define during implementation based on security best practices.
- **UNQ-IMPL-11:** Exact pagination strategy (limit, offset vs keyset) — Resolution: define during implementation based on performance needs.
- **UNQ-IMPL-12:** Exact search algorithm (full-text vs filtered) — Resolution: define during implementation based on data volume and query patterns.
- **UNQ-IMPL-13:** Exact file upload handling (local storage vs cloud storage) — Resolution: define during implementation based on scalability and security needs.
- **UNQ-IMPL-14:** Exact evidence verification workflow (manual vs automated) — Resolution: define during implementation based on feasibility and cost.
- **UNQ-IMPL-15:** Exact publication workflow (manual vs automated social sharing) — Resolution: define during implementation based on requirements and resources.
- **UNQ-IMPL-16:** Exact CV/Resume generation (if implemented) — Resolution: defer to Stage 4.12 if implemented.
- **UNQ-IMPL-17:** Exact API versioning strategy (if needed) — Resolution: define during implementation stage; current scope does not require versioning.
- **UNQ-IMPL-18:** Exact CI/CD deployment strategy (e.g., deploy to staging on PR, production on main) — Resolution: define during implementation stage based on release process.
- **UNQ-IMPL-19:** Whether to include performance testing in CI — Resolution: defer to implementation stage; consider basic performance checks.
- **UNQ-IMPL-20:** Exact dependency management policy (e.g., lockfile policy, update frequency) — Resolution: define during implementation based on security and maintenance needs.

## 10. Final Status
ACCEPTED AND FROZEN — STAGE 4.11 COMPLETE