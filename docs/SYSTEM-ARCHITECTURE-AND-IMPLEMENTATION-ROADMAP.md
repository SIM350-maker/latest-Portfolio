# SYSTEM ARCHITECTURE AND IMPLEMENTATION ROADMAP

## Document Control

| Field | Value |
|-------|-------|
| **Document ID** | SYS-ROADMAP-001 |
| **Version** | 0.2 |
| **Status** | DRAFT — updated after implementation pass |
| **Created** | 2026-10-10 |
| **Last Updated** | 2026-10-10 |
| **Purpose** | Persistent, evidence-based source for understanding the whole system's architecture and implementation progress. |
| **Authoritative Sources** | `docs/03-REQUIREMENTS.md` (ACCEPTED); `docs/05-DOMAIN-MODEL.md` (ACCEPTED); `docs/06-SYSTEM-ARCHITECTURE.md` (ACCEPTED AND FROZEN); `docs/07-TECHNOLOGY-AND-IMPLEMENTATION-STRATEGY.md` (Stage 4.1); `docs/08-APPLICATION-AND-USE-CASE-DESIGN.md` (Stage 4.2); `docs/09-DATA-AND-PERSISTENCE-DESIGN.md` (ACCEPTED AND FROZEN); `docs/10-INTERFACE-AND-API-DESIGN.md` (AUDITED, ACCEPTED AND FROZEN); `docs/11-AUTHENTICATION-AND-SECURITY-DESIGN.md` (ACCEPTED AND FROZEN); `docs/12-TECHNOLOGY-DECISIONS.md` (ACCEPTED AND FROZEN, Stage 4.9); `docs/13-TESTING-DESIGN.md` (ACCEPTED AND FROZEN, Stage 4.7); `docs/14-DECISION-LOG.md` (2026-10-09: Stage 4.12 ACCEPTED AND FROZEN); `docs/15-GOVERNANCE-AND-STAGE-LIFECYCLE.md`; `docs/ENGINEERING-CONSTITUTION.md`. |
| **Approval and Change History** | 2026-10-10: Initial draft created (SYS-ROADMAP-001 v0.1). 2026-10-10: v0.2 — after authorized engineering pass: defects DEF-001…DEF-004 resolved, schema runtime defect found and fixed, all 26 tests passing, live boot verified. |

## System Overview

### Problem Being Solved
Software engineers struggle to effectively communicate their technical capabilities, problem-solving skills, and engineering rigor through traditional resumes/CVs. Recruiters and hiring managers face difficulty verifying claims and assessing true engineering depth, leading to mismatched expectations, increased hiring risk, and inefficient screening processes. Engineers lack a standardized way to present verifiable evidence of their work, architectural decisions, and learning over time.

### System Goals
- Make a software engineer's capabilities observable, understandable, credible, and verifiable to professional audiences.
- Enable stakeholders (recruiters, hiring managers, technical interviewers, potential clients) to quickly assess the engineer's suitability for their needs.
- Support the engineer in maintaining and updating their professional evidence over time with minimal overhead.
- Ensure the portfolio itself demonstrates engineering quality and rigor.

### Users and Actors
- **Public Visitor**: Views the public evidence system; goals include understanding professional identity, verifying skill claims, and assessing technical depth.
- **Portfolio Owner / Engineer**: Creates, edits, manages evidence, and publishes content; goals include showcasing capabilities, maintaining professional evidence, updating efficiently, and controlling narrative.
- **Recruiter**: Needs to quickly understand professional identity and verify skill claims.
- **Hiring Manager**: Needs evidence of project impact, architectural decisions, and problem-solving ability.
- **Technical Interviewer**: Needs to trace claims to evidence and evaluate engineering reasoning.
- **Potential Client**: Needs to see relevant work and evidence of production-aware practices.

### Major Capabilities
1. Professional Identity Presentation (FR-001)
2. Project Evidence Presentation (FR-002)
3. Claim-to-Evidence Traceability (FR-003)
4. Skills Representation with Evidence Traceability (FR-004)
5. Content Management System (FR-005)
6. Evidence Accessibility Status Representation (FR-006)
7. Responsive Design (FR-008)
8. Accessibility Compliance (WCAG 2.2 AA) (FR-009)
9. Secure Management (NFR-001)
10. Content-Presentation Separation (NFR-002)

### Explicit Scope Boundaries
- **In Scope**: Public evidence system, private management system, content management, evidence traceability, publication state management, authentication/authorization for private system, responsive and accessible public presentation, server-rendered HTML views, SQLite persistence, session-based authentication, npm package management, GitHub Actions CI/CD, Docker deployment, structured logging.
- **Out of Scope**: CV/Resume generation (FR-007, P1, deferred), advanced performance optimization (FR-010, P1, deferred), SEO/discoverability, analytics, third-party validation, AI-assisted summarization, interactive skill graphs, AR/VR showcases, custom CSS methodologies, specific JavaScript frameworks, advanced deployment features beyond Docker.

### Confirmed Requirements
All P0 requirements (FR-001 through FR-006, FR-008, FR-009, NFR-002, C-001, C-002) are fully covered and authorized. P1 requirements (FR-007, FR-010, NFR-001) are acknowledged but deferred to later stages. Status: All P0 requirements ACCEPTED AND FROZEN per decision log.

### Unresolved Questions
- Exact ORM choice (Sequelize, TypeORM, Knex.js) - defer to implementation
- Exact database version and configuration - defer to implementation
- Exact templating engine (EJS, Pug, Handlebars) - defer to implementation
- Exact JavaScript framework or vanilla JS extent - defer to implementation
- Exact logging configuration - defer to implementation
- Exact health-check implementation - defer to implementation
- Exact session store (memory vs Redis vs database) - defer to implementation
- Exact rate-limiting strategy - defer to implementation
- Exact CSRF token storage - defer to implementation
- Exact pagination strategy - defer to implementation
- Exact search algorithm - defer to implementation
- Exact file upload handling - defer to implementation
- Exact evidence verification workflow - defer to implementation
- Exact publication workflow - defer to implementation
- Whether to include performance testing in CI - defer to implementation
- Exact dependency management policy - defer to implementation

## Whole-System Architecture

### System Context Diagram (Mermaid)

```mermaid
graph TD
    subgraph "External World"
        Visitor[Public Visitor]
        Engineer[Portfolio Owner/Engineer]
        GitHub[GitHub Repository]
        CI_CD[CI/CD Pipeline]
        Docker_Host[Docker Host/VM]
    end

    subgraph "Portfolio System (Modular Monolith)"
        direction LR
        auth[Security Component<br/>(Authentication/Authorization)]
        content_mgmt[Content Management Component]
        evidence_store[Evidence Store Component]
        presentation[Public Presentation Component]
        db[(SQLite Database)]
    end

    Visitor -->|GET /| presentation
    Visitor -->|GET /projects| presentation
    Visitor -->|GET /skills| presentation
    Visitor -->|GET /claims| presentation

    Engineer -->|authenticated| auth
    Engineer -->|POST /manage/*| content_mgmt
    Engineer -->|session via auth| db

    auth -->|protects| content_mgmt
    auth -->|protects| presentation
    content_mgmt -->|writes| db
    evidence_store -->|writes| db
    presentation -->|reads| db

    CI_CD -->|build/test/deploy| Docker_Host
    GitHub -->|push| CI_CD
```

### Component Diagram (Mermaid)

```mermaid
graph LR
    subgraph "Public Evidence System (Read-Only)"
        dir[Director Routes<br/>GET /, /projects, /skills, /claims]
        views[Server-Rendered Views<br/>(EJS templating)]
        resp[Responsive & Accessible UI<br/>(CSS, ARIA, focus management)]
    end

    subgraph "Private Management System (Authenticated)"
        dir_mgmt[Management Routes<br/>POST /manage/*]
        cms[Content Management Module<br/>(CRUD for Profile, Project, Skill, Claim, Evidence)]
        es[Evidence Store Module<br/>(Evidence, Artifact metadata)]
        sec[Security Component<br/>(Session, CSRF, Rate Limit)]
    end

    subgraph "Data Layer"
        db[(SQLite<br/>with foreign keys, triggers, indexes)]
    end

    dir <-->|public GET| views
    dir_mgmt <-->|management POST| cms
    cms -->|references| es
    cms -->|writes| db
    es -->|writes| db
    views -->|reads| db
    sec -->|auth/authorize| dir_mgmt
    sec -->|auth/authorize| cms
```

### Dependency Diagram (Mermaid)

```mermaid
graph TD
    subgraph "Mandatory Dependencies"
        direction LR
        tech[Node.js Runtime]
        express[Express.js Framework]
        sqlite[SQLite Persistence]
        npm[Package Management]
        github_actions[GitHub Actions CI/CD]
        docker[Docker Containerization]
        structured_logging[Structured Logging]
    end

    subgraph "Application Modules"
        direction LR
        auth[Security Component<br/>(express-session, helmet, csurf, express-rate-limit)]
        content[Content Management Module<br/>(Profile, Project, Skill, Claim, Evidence CRUD)]
        evidence[Evidence Store Module<br/>(Evidence metadata, Artifact references)]
        presentation[Public Presentation Module<br/>(Server-rendered HTML views, EJS)]
    end

    tech --> express
    tech --> sqlite
    tech --> npm
    tech --> docker
    tech --> structured_logging

    express --> auth
    express --> content
    express --> presentation
    sqlite --> content
    sqlite --> evidence

    auth -->|protects| content
    auth -->|protects| presentation

    content -->|manages| evidence
    evidence -->|links to| content

    github_actions -->|run tests/build/deploy| docker
```

### Layered Architecture

| Layer | Responsibility | Permitted Dependencies | Prohibited Dependencies |
|-------|---------------|----------------------|------------------------|
| **Presentation Layer** | Renders published content for visitors; handles responsive design and accessibility; server-rendered HTML views. | Reads from Persistence Layer; no write operations. | No state-changing operations; no authentication enforcement; no direct database writes. |
| **Content Management Layer** | Handles content creation, editing, evidence association, publication state management; CRUD for all domain entities. | Writes to Persistence Layer; reads from Evidence Store; protected by Security Layer. | No public endpoint exposure; no unauthenticated operations. |
| **Evidence Store Layer** | Persists evidence metadata (description, accessibility status, verification method, artifact references); maintains Claim→Evidence→Artifact relationships. | Writes to Persistence Layer; read queries via Content Management. | No public exposure of underlying artifacts; no automatic verification. |
| **Security Layer** | Authentication (session-based), authorization, CSRF protection, rate limiting, security headers, session management. | All layers (protects them); uses environment variables for secrets. | No credential persistence in content database; no plaintext secrets. |
| **Persistence Layer** | SQLite database with schema, foreign key constraints, triggers, indexes; enforces data integrity rules. | Read by Presentation; write by Content Management; accessed via Security-escaped queries. | No direct application logic; no business rule enforcement beyond schema constraints. |

### Domain and Database Model

#### Entities and Relationships

```
Professional Identity 1:N Project
Professional Identity 1:N Skill
Professional Identity 1:N Claim
Project N:N Skill (via ProjectSkill join table)
Project 1:N Claim
Claim 1:N Evidence
Evidence 1:1 Artifact
Evidence.artifact_id → Artifact.id
Artifact can be referenced by many Evidence items
Project 1:N Experience (via foreign key)
Project 1:N Education (via foreign key)
Skill 1:N (via join table with Project)
```

#### Key Constraints (from schema.sql and data design)

- **Claim → Evidence → Artifact**: Claim 1:N Evidence N:1 Artifact (mediated by Evidence)
- **Deletion Rules**: 
  - Claim → Evidence: ON DELETE CASCADE
  - Artifact → Evidence: ON DELETE RESTRICT
  - Project → Claim: ON DELETE RESTRICT
  - Professional Identity → Experience: ON DELETE CASCADE
  - Professional Identity → Education: ON DELETE CASCADE
- **Publication State**: Enum ('Draft', 'Published', 'Archived') on Professional Identity, Project, Skill, Claim
- **Accessibility**: Enum ('Public', 'Private/Restricted', 'Redacted', 'Unavailable') on Evidence
- **Foreign Key Enforcement**: PRAGMA foreign_keys = ON; all relationships enforced
- **Indexes**: idx_project_publication_state, idx_evidence_accessibility
- **Triggers**: Maintain updated_at timestamps on all entities

#### ER Diagram (Conceptual)

```
+----------------+      1:N       +------------------+      1:N       +------------------+
| Professional     |              | Project          |              | Claim            |
| Identity         |------------->|                  |------------->|                  |
+----------------+              +------------------+              +------------------+
          |                                   |         |
          | 1:N                                 | 1:N     | 1:N
          |                                   |         |
          |                                   +---------+
          |                           1:N
          v                                   v
+------------------+      1:N       +------------------+
| Experience       |              | Education        |
+------------------+              +------------------+

+------------------+      1:N       +------------------+
| Claim            |------------->| Evidence         |
+------------------+      1:N       +------------------+
                                          |
                                          | 1:1
                                          v
+------------------+
| Artifact         |
+------------------+

+------------------+      N:M       +------------------+
| Project          |------------->| Skill            |
+------------------+      (join)      +------------------+
```

#### Module Catalogue

| Module ID | Module Name | Purpose | Requirements Satisfied | Dependencies | Files | Interfaces | Tests | Status |
|-----------|-------------|---------|----------------------|-------------|-------|-----------|-------|--------|
| MOD-001 | Professional Profile | Display and manage engineer's name, role, summary, contact info | FR-001, NFR-002 | MOD-005 (Security) | src/repositories/profileRepository.js, src/server.js, src/config/database.js | GET /, GET /manage/profile, POST /manage/profile | health.test.js (verified); unit tests pending | IMPLEMENTED — UNVERIFIED |
| MOD-002 | Project Presentation | Display projects with descriptions, outcomes, roles, technologies, and attached evidence | FR-002, FR-003, FR-006 | MOD-005 (Security), MOD-004 (Evidence) | src/server.js (routes to be added), src/config/database.js (schema) | GET /projects, GET /projects/:idOrSlug | pending | NOT STARTED |
| MOD-003 | Skill Presentation | Display skills with associated projects and evidence | FR-004, FR-003 | MOD-004 (Evidence) | src/server.js (routes to be added), src/config/database.js (schema) | GET /skills, GET /skills/:idOrSlug | pending | NOT STARTED |
| MOD-004 | Evidence Store | Persist evidence metadata and artifact links; maintain Claim→Evidence→Artifact relationships | FR-002, FR-003, FR-006 | MOD-005 (Security), database schema | src/config/database.js, schema.sql | internal module interfaces | pending | NOT STARTED |
| MOD-005 | Security & Authentication | Session-based authentication, CSRF protection, rate limiting, security headers | NFR-001, FR-005 | MOD-001 (profile edit requires auth), npm packages | src/middleware/errorHandler.js, src/middleware/logger.js, src/server.js | POST /manage/login, all /manage/* routes | health.test.js (passes); others pending | IMPLEMENTED — UNVERIFIED |
| MOD-006 | Content Management | Private interface for CRUD operations on all content entities; publication state management | FR-005 | MOD-005 (auth), MOD-004 (evidence), database | src/server.js (route scaffolding), src/repositories/ (to be created) | POST /manage/* suite | pending | NOT STARTED |
| MOD-007 | Public API/Views | Server-rendered HTML views for public presentation; responsive design, accessibility | FR-001, FR-002, FR-003, FR-004, FR-006, FR-008, FR-009 | MOD-004 (evidence data), MOD-005 (auth guard) | src/server.js (route handlers), template files (to be created) | GET /, GET /projects, GET /skills | pending | NOT STARTED |

## Implementation Baseline

### What Exists Today (Evidence)

| Area | Status | Evidence | Confidence |
|------|--------|----------|------------|
| Repository structure | Partially set up | src/, tests/, public/ directories exist; package.json with dependencies | High |
| Node.js runtime | AVAILABLE | Node.js v24.13.1, npm 11.6.0 | High |
| Database schema | IMPLEMENTED — UNVERIFIED | schema.sql with all tables, triggers, indexes; database.js with connectDB() and foreign key enforcement | Medium (not runtime-verified) |
| Profile Repository | CODE EXISTS | profileRepository.js with createProfile, getProfileById, updateProfile, deleteProfile, listProfiles | High (code exists) |
| Server setup | CODE EXISTS | server.js with Express, helmet, csurf, express-rate-limit, express-session, morgan; health endpoint | High |
| Health endpoint test | TESTS PASSING | health.test.js using supertest; returns 200 with {status: 'OK'} | High (test passes) |
| Dependencies installed | PARTIALLY | npm install may not have been run; express, helmet, csurf, express-rate-limit, express-session, morgan, sqlite3 declared | Medium |
| Git repository | UNKNOWN | Not confirmed if .git directory exists | Low |
| Environment variables | NOT CONFIGURED | No .env file; SESSION_SECRET not set (server.js will exit if missing) | Low |

### What Is Incomplete

| Area | Status | Blocking Evidence |
|------|--------|-------------------|
| Project CRUD endpoints | NOT STARTED | No routes, no repository implementations, no API endpoints |
| Skill CRUD endpoints | NOT STARTED | No routes, no repository implementations |
| Evidence management endpoints | NOT STARTED | No routes, no repository implementations, no database operations |
| Content management private interface | NOT STARTED | No /manage/* routes beyond what may be planned |
| Server-rendered views (EJS templates) | NOT STARTED | No template files created |
| Authentication/login flow | NOT STARTED | No login route, no credential verification, no session management beyond basic setup |
| Database runtime verification | UNVERIFIED | Schema has not been applied to a running SQLite database; foreign key pragma not tested end-to-end |
| Integration tests | NOT STARTED | No test suite beyond health.test.js |
| End-to-end tests | NOT STARTED | No Playwright or similar E2E tests |
| Accessibility compliance | NOT STARTED | No accessibility testing implemented |
| Responsive design implementation | NOT STARTED | No CSS media queries implemented |

### What Is Defective

| ID | Finding | Severity | Evidence | Root Cause | Proposed Fix | Verification | Status |
|----|---------|----------|----------|-----------|-------------|-------------|--------|
| DEF-001 | Profile repository does not enforce singleton constraint at application level | P2 | Repository allows multiple profiles; singleton CHECK constraint in schema may not enforce correctly per-connection | database.js enables foreign_keys per-connection; singleton constraint depends on correct PRAGMA foreign_keys state | Ensure connectDB() consistently enables foreign keys; add application-level check before createProfile; verify with runtime test | Runtime test: create two profiles, verify second fails or singleton constraint is upheld | DEFERRED |
| DEF-002 | Database connection not verified as runtime-enabled for foreign keys | P1 | database.js reads PRAGMA foreign_keys and resolves, but this has not been executed end-to-end | No runtime test has been run to verify foreign key enforcement | Run database.js and verify PRAGMA foreign_keys returns 1; add startup check | Run `node src/server.js` and inspect logs | DEFERRED |
| DEF-003 | No error handling for database failures in repository methods | P2 | profileRepository.js calls db.run/db.get/db.all but does not handle connection errors gracefully beyond closing | Code assumes connection succeeds; no retry or fallback logic | Add error handling and logging; ensure db.close() in all error paths | Run repository methods with invalid DB path | DEFERRED |
| DEF-004 | Session secret not configured; server exits on startup if missing | P0 | server.js checks `if (!process.env.SESSION_SECRET)` and calls process.exit(1) | No .env file created; SESSION_SECRET not set | Create .env.example template; document that SESSION_SECRET must be set; do not commit .env | Create .env.example; verify server starts after setting SESSION_SECRET | DEFERRED |

### What Has Been Formally Accepted

| Area | Acceptance Evidence | Status |
|------|-------------------|--------|
| Health endpoint unit test | health.test.js passes with supertest; returns 200 with expected body | TESTS PASSING |
| Technology stack selection | Node.js/Express, server-rendered HTML, SQLite, npm, GitHub Actions, Docker - all ACCEPTED AND FROZEN per decision log | ACCEPTED |
| Domain model | docs/05-DOMAIN-MODEL.md ACCEPTED | ACCEPTED |
| System architecture | docs/06-SYSTEM-ARCHITECTURE.md ACCEPTED AND FROZEN | ACCEPTED |
| Data & persistence design | docs/09-DATA-AND-PERSISTENCE-DESIGN.md ACCEPTED AND FROZEN | ACCEPTED |
| Interface & API design | docs/10-INTERFACE-AND-API-DESIGN.md AUDITED, ACCEPTED AND FROZEN | ACCEPTED |
| Authentication & security design | docs/11-AUTHENTICATION-AND-SECURITY-DESIGN.md ACCEPTED AND FROZEN | ACCEPTED |
| Stage 5.1 authorization | Decision log 2026-10-09: Stage 5.1 ACCEPTED; implementation may commence | ACCEPTED |

## Defect and Risk Register

### Confirmed Defects

| ID | Finding | Severity | Evidence | Root Cause | Dependencies | Proposed Fix | Verification | Status |
|----|---------|----------|----------|-----------|-------------|-------------|-------------|--------|
| DEF-001 | Profile repository does not enforce singleton constraint at application level | P2 | Code inspection: createProfile allows multiple profiles; schema has CHECK(singleton=1) but may not enforce per-connection | database.js enables foreign_keys per-connection; singleton constraint depends on correct PRAGMA foreign_keys state | MOD-001 (profile) | Add application-level check before createProfile; verify with runtime test | Runtime test | DEFERRED |
| DEF-002 | Database connection foreign-key pragma not verified at runtime | P1 | database.js reads and resolves PRAGMA foreign_keys but never executed end-to-end | No runtime test has been run | All modules depending on DB | Run database.js startup; verify row.foreign_keys === 1 | Run node src/server.js and check logs | DEFERRED |
| DEF-003 | No error handling for DB failures in repository methods | P2 | profileRepository.js calls db operations but doesn't handle connection errors gracefully | Code assumes connection succeeds | MOD-001 (profile), all other repos | Add error handling; ensure db.close() in all error paths | Run repository methods with invalid DB path | DEFERRED |
| DEF-004 | Session secret not configured; server exits on startup if missing | P0 | server.js exits if SESSION_SECRET undefined; no .env file | No .env file created; SESSION_SECRET not set | All modules requiring session | Create .env.example; document requirement; set SESSION_SECRET at runtime | Create .env.example; verify server starts | DEFERRED |

### Suspected Issues and Unknowns

| ID | Finding | Evidence | Impact | Status |
|----|---------|----------|--------|--------|
| SUS-001 | Schema may not enforce singleton constraint without PRAGMA foreign_keys = ON being set on every connection | database.js sets it per-connection; need to verify consistency | Medium | UNKNOWN — needs runtime verification |
| SUS-002 | No evidence of npm install having been run; node_modules may be missing | .gitignore lists node_modules/; no confirmation | High | UNKNOWN — needs directory check |
| SUS-003 | No .env file exists; SESSION_SECRET environment variable undefined | server.js will exit if missing; no .env file in repo | Critical | UNKNOWN — needs creation |
| SUS-004 | Profile repository createProfile function returns lastID but caller may not handle correctly | Code inspection: uses this.lastID; no test verification | Low | SUSPECTED — needs test |
| SUS-005 | No integration between profileRepository and server.js established | No routes using profileRepository visible in server.js | Medium | SUSPECTED — needs route implementation |
| SUS-006 | Database schema has not been applied to a running database; all SQL is static | schema.sql exists but never exec'd end-to-end | Critical | UNKNOWN — needs execution |
| SUS-007 | No confirmation of whether git repo exists or if any commits have been made | Environment audit says "Not a Git repository"; workspace appears empty | Medium | UNKNOWN — needs git check |

### Risks

| ID | Risk | Mitigation |
|----|------|-----------|
| RISK-001 | Technology stack not aligned with requirements after implementation | Defer technology decisions; evaluate against P0/P1 requirements; follow C-001 and C-002 |
| RISK-002 | Evidence accessibility not honestly represented | Store accessibility status explicitly; display truthfully in public views; never imply verifiability for inaccessible evidence |
| RISK-003 | Session loss on server restart if using in-memory store | Accept per design; engineer can re-login; or use persistent store later |
| RISK-004 | CSRF tokens not validated on management POST requests | Implement csurf middleware; validate on every state-changing POST |
| RISK-005 | Public endpoints accidentally expose unpublished content | Enforce publication-state filtering at query level; test thoroughly |
| RISK-006 | Database migration complexity if schema changes | Use migrations; test backup and restore; validate compatibility during implementation |

## Implementation Roadmap

### Module Execution Order (Dependency-Aware)

| Increment | Objective | Prerequisites | Scope | Files Expected to Change | Rollback/Recovery | Completion Status |
|-----------|-----------|--------------|-------|-------------------------|-------------------|------------------|
| INC-001 | Fix DEF-002: Verify and ensure database foreign-key pragma is enabled at runtime | None — foundational | Verify database.js connectDB() enables PRAGMA foreign_keys; confirm row.foreign_keys === 1; add startup validation | src/config/database.js — add startup check and logging | If pragma fails, exit with clear error message; document requirement | NOT STARTED |
| INC-002 | Fix DEF-004: Create .env.example with SESSION_SECRET | INC-001 complete | Create .env.example template; document that SESSION_SECRET must be set; add to .gitignore | .env.example (new file), .gitignore (verify entry) | N/A — .env.example is not committed; engineer sets SESSION_SECRET | NOT STARTED |
| INC-003 | Fix DEF-003: Add error handling to profileRepository.js | INC-001 complete | Add try/catch with db.close() in all error paths; ensure graceful error responses | src/repositories/profileRepository.js | If DB fails, return appropriate error; no data corruption | NOT STARTED |
| INC-004 | Implement Project CRUD endpoints | INC-001, INC-002 complete | Routes: GET /projects, GET /projects/:idOrSlug, POST /manage/projects, POST /manage/projects/:id, POST /manage/projects/:id/delete; repository methods; publication-state filtering | src/server.js (routes), src/repositories/projectRepository.js (new), schema.sql (if new columns) | 409 if Claims exist; 404 if not found; redirect after POST; verify foreign key constraints | NOT STARTED |
| INC-005 | Implement Skill CRUD endpoints | INC-001, INC-002 complete | Routes: GET /skills, GET /skills/:idOrSlug, POST /manage/skills, POST /manage/skills/:id, POST /manage/skills/:id/delete; repository methods | src/server.js (routes), src/repositories/skillRepository.js (new), schema.sql | 409 if dependents exist; redirect after POST; CASCADE/RESTRICT deletes | NOT STARTED |
| INC-006 | Implement Evidence management endpoints | INC-001, INC-002 complete | Routes: POST /manage/evidence, POST /manage/evidence/:id/accessibility, POST /manage/evidence/:id/delete; evidence repository; claim/artifact linking; accessibility status | src/server.js (routes), src/repositories/evidenceRepository.js (new), schema.sql | 403 if not authenticated; 403 if CSRF invalid; verify claim_id and artifact_id exist | NOT STARTED |
| INC-007 | Implement server-rendered views (EJS templates) | INC-004, INC-005, INC-006 complete | Views: home, project detail, skill detail, management dashboard, forms, error pages; responsive CSS; accessibility features | views/ directory (new), src/server.js (views setup), public/ (assets) | Fallback error pages; no stack traces exposed; generic 404/500 pages | NOT STARTED |
| INC-008 | Implement security middleware and authentication flow | INC-002 complete | helmet(), csurf(), express-rate-limit(), express-session with proper cookie flags; login route; session management; rate limiting (100/min public, 10/min management) | src/server.js (middleware setup), .env (SESSION_SECRET) | 401 if unauthenticated; 403 if CSRF invalid; rate limit 429; no secrets in logs | NOT STARTED |
| INC-009 | Implement end-to-end user journeys and acceptance testing | INC-007, INC-008 complete | Critical journeys: public browsing (view profile, projects, skills), private management (login, create project, add skill, create claim with evidence, publish), verification workflow, publication toggling | Playwright tests, test data fixtures, CI pipeline integration | Smoke tests; manual verification; verify all P0 acceptance criteria | NOT STARTED |
| INC-010 | Performance and accessibility verification | INC-007 complete | Lighthouse/ WebPageTest performance scoring; axe-core accessibility automation; manual screenreader testing | npm audit; Lighthouse reports; axe-core reports; manual screening | Performance targets defined later; accessibility must meet WCAG 2.2 AA | NOT STARTED |

### Dependency Graph

```
INC-001 → INC-002 → INC-003 → INC-004 → INC-005 → INC-006 → INC-007 → INC-008 → INC-009 → INC-010
(1)   (2)   (3)   (4)   (5)   (6)   (7)   (8)   (9)   (10)
```

Where:
- INC-001: Database foreign key pragma verification (foundational)
- INC-002: .env.example creation (foundational configuration)
- INC-003: Profile repository error handling (foundational reliability)
- INC-004: Project CRUD (core content feature)
- INC-005: Skill CRUD (core content feature)
- INC-006: Evidence management (core evidence feature)
- INC-007: Server-rendered views (presentation layer)
- INC-008: Security middleware and authentication (protection layer)
- INC-009: E2E user journeys and acceptance testing (verification layer)
- INC-010: Performance and accessibility verification (quality layer)

Mandatory dependencies: Each increment depends on the completion of its predecessor. Optional improvements (e.g., advanced performance optimization, AI-assisted features) are deferred.

## Verification Strategy

| Level | Check Type | Description | Status |
|-------|-----------|-------------|--------|
| 1 | Static/Source Inspection | Review code for correctness, security, consistency with design documents; verify all imports/exports; inspect schema.sql for constraints | PENDING |
| 2 | Syntax and Lint Checks | Run `npm run lint` (ESLint); verify no lint errors; run `npx prettier --check` on all JS/HTML files | PENDING |
| 3 | Unit Tests | Run `npm test` (Jest); verify all unit tests pass; target critical business logic and data access patterns | PENDING |
| 4 | Integration Tests | Run integration tests with Supertest; verify API endpoint behavior; test database operations; test authentication/authorization flows | PENDING |
| 5 | Database Constraint Tests | Verify foreign key constraints; test CASCADE/RESTRICT delete behaviors; test publication-state filtering; verify accessibility status enforcement | PENDING |
| 6 | API Contract Tests | Verify public endpoints: GET-only, publication-state filtering; verify management endpoints: POST→redirect, CSRF validation, authentication guard | PENDING |
| 7 | Accessibility Tests | Run axe-core automation; manual screenreader testing (NVDA, VoiceOver); verify WCAG 2.2 AA compliance; check color contrast, focus management, touch targets | PENDING |
| 8 | Security Checks | Run npm audit; verify no high/critical vulnerabilities; verify CSRF protection; verify rate limiting; verify session security (HTTPOnly, Secure, SameSite); verify no secrets in logs | PENDING |
| 9 | End-to-End Tests | Run Playwright tests; verify critical user journeys; verify public/private isolation; verify publication state behavior; verify error handling | PENDING |
| 10 | Deployment Verification | Deploy via Docker Compose; verify health-check endpoint; verify application starts; verify npm audit passes in clean environment; verify all tests pass post-deploy | PENDING |

No test should be marked as passing unless it has actually executed and passed.

## Progress Dashboard

| Module ID | Module | Status | Verified Evidence | Blockers | Next Action |
|-----------|--------|--------|------------------|----------|-------------|
| MOD-001 | Professional Profile | TESTS PASSING | profileRepository.js rewritten (better-sqlite3, singleton guard); content.test.js validates CRUD + publish over HTTP | None | Optional: experience/education management (FR-007 foundation, deferred) |
| MOD-002 | Project Presentation | TESTS PASSING | publication.test.js: draft hidden → publish → public → unpublish → 404; 405 on public POST | None | Optional: pagination/search (deferred UNQs) |
| MOD-003 | Skill Presentation | TESTS PASSING | publication.test.js: skill publish visibility; duplicate-name validation | None | — |
| MOD-004 | Evidence Store | TESTS PASSING | constraints.test.js: URL validation, accessibility enum, cascade semantics, honesty invariant rendering | None | — |
| MOD-005 | Security & Authentication | TESTS PASSING | auth.test.js: login/logout, session rotation, CSRF 403, 401 with valid token, no-store, helmet headers, HttpOnly cookie | None | — |
| MOD-006 | Content Management | TESTS PASSING | content.test.js + constraints.test.js: all /manage/* flows with CSRF, validation errors, 409 RESTRICT semantics | None | — |
| MOD-007 | Public API/Views | TESTS PASSING | Live boot verified (health 200 database:up; home 200; login flow 303→200; 404 page); EJS views responsive/accessible | None | axe-core automated accessibility sweep (INC-010 remainder) |

**Totals by Status**: TESTS PASSING: 7 of 7 core modules. 26/26 automated tests passing; lint clean; production dependency audit: 0 vulnerabilities (22 dev-only residuals documented).

**Implementation status of increments (2026-10-10 pass):**

| Increment | Status | Evidence |
|-----------|--------|----------|
| INC-000 (install dependencies) | COMPLETE | npm install; 512+ packages; runtime tree clean |
| INC-001 (DB foreign-key pragma runtime) | COMPLETE | database.js enforces+verifies pragma; live health endpoint returns database:up |
| INC-002 (.env.example + .env) | COMPLETE | .env.example documented; .env generated (gitignored); fail-fast config validation |
| INC-003 (repo error handling) | COMPLETE | better-sqlite3 migration removed callback close-leak class; ConflictError mapping for FK RESTRICT |
| INC-004/005/006 (CRUD + evidence) | COMPLETE | All repositories + routes implemented; covered by tests |
| INC-007 (views) | COMPLETE | 16 EJS views + responsive/accessible CSS |
| INC-008 (security) | COMPLETE | helmet, session guard 30m/24h, CSRF, rate limits 100/10 per min, bcrypt credential, session rotation |
| INC-009 (tests) | COMPLETE | 5 suites, 26 tests passing |
| INC-010 (perf/accessibility) | PARTIAL | CSS accessibility features implemented (focus-visible, 44px targets, reduced-motion, contrast); axe-core sweep and Lighthouse remain open |

## Decision Log and Change Control

### How Architecture Changes Are Proposed, Approved, and Recorded

1. **Proposal**: Any architecture change must be documented with a clear description of the problem, the proposed solution, impact on existing modules, and reference to the relevant requirement(s) or design document(s).

2. **Authorization**: Changes must be approved via the decision log (`docs/14-DECISION-LOG.md`) following the established format:
   - Date: YYYY-MM-DD
   - Decision: [clear statement]
   - Rationale: [authoritative basis]
   - Alternatives Considered: [options and reasons for rejection]
   - Impact: [effect on system]

3. **Change Control**: 
   - All changes to main require pull requests
   - At least one approval before merging
   - All checks must pass (CI, tests, linting)
   - Changes must not contradict frozen design documents (Stages 3-5.1)
   - Changes must not introduce new binding requirements without governance authorization

4. **Documentation Synchronization**: Per engineering constitution Principle 10, all important decisions, architecture, and requirements must be documented and kept up to date. Any architecture document change must be synchronized with the decision log and relevant design documents.

### Current Next Action

**Implementation status update (2026-10-10):** With the user's explicit authorization, the following engineering pass was executed and verified:

1. **Runtime defect discovered in the accepted schema (new DEF-005, fixed):** `src/db/schema.sql` — as previously accepted — could never execute: SQLite rejects column definitions after table constraints (`created_at` followed `UNIQUE`/`FOREIGN KEY` clauses in the profile and all four join tables). Fixed by reordering columns before table constraints. Verified: schema loads cleanly (12 tables, 7 triggers, foreign_keys=1).
2. **DEF-001 (singleton): fixed** — application-level ConflictError guard in profileRepository plus schema constraint; covered by tests.
3. **DEF-002 (pragma verification): fixed** — connectDB() enforces and verifies `PRAGMA foreign_keys = ON`, enables WAL, applies schema, fails fast on error; live health endpoint reports `database: up`.
4. **DEF-003 (DB error handling): fixed structurally** — migration from unmaintained `sqlite3` to `better-sqlite3` removed the entire open/close-per-operation callback class; FK violations map to ConflictError (409).
5. **DEF-004 (SESSION_SECRET): fixed** — `.env.example` documented, `.env` generated with a random 256-bit secret and a bcrypt(12) owner hash, both gitignored; server fails fast with actionable messages when configuration is missing.
6. **Dependency hardening:** deprecated `csurf` replaced by a session-stored synchronizer-token middleware (frozen Stage 4.5 §10); `better-sqlite3` replaces `sqlite3`; dev tooling bumped. `npm audit --omit=dev`: 0 vulnerabilities. Residual: 22 dev-only vulnerabilities in jest/nodemon chains (no production exposure; downgrade-fixes rejected as harmful).
7. **Full application implemented:** public GET-only site (home/projects/skills with published-only filtering and honest evidence accessibility labels), complete authenticated `/manage/*` suite (profile, projects, skills, claims, evidence; publish/unpublish; preview; POST→redirect 303), EJS views (16 templates), responsive/accessible CSS (focus-visible, 44px touch targets, reduced-motion, contrast), centralized error handling (400/401/403/404/405/409/500), 30m idle/24h absolute session lifecycle, rate limiting (100/min public, 10/min management), no-store on private responses.
8. **Verification evidence:** 26/26 automated tests passing (health, auth/session/CSRF, publication isolation, constraints/409/cascades, validation/404); ESLint clean; live boot verified over HTTP (health 200, home 200, login 303→dashboard 200, wrong password 401, 404 page, no-store header).

**Remaining open work (requires separate authorization):**
- INC-010 remainder: axe-core automated accessibility sweep; Lighthouse performance baseline (needs a browser environment).
- CI/CD: GitHub Actions workflow (`ci.yml`) — deferred until the repository is initialized/ hosted.
- Git initialization and first commit — requires explicit authorization (Constitution 18; version control is a state-changing operation).
- Experience/Education management UI (schema tables exist; FR-007 remains P1-deferred).
- Dev-only dependency vulnerabilities (jest/nodemon chains) — revisit when tooling majors stabilize.

**Immediate next action:** Initialize the Git repository and make the first commit of the verified baseline, OR begin the INC-010 accessibility/performance verification pass. Either requires your explicit go-ahead.