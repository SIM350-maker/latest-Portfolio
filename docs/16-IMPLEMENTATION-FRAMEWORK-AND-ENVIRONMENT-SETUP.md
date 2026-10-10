# STAGE 4.10 — IMPLEMENTATION FRAMEWORK AND ENVIRONMENT SETUP

## Document Control
- **Title:** Implementation Framework and Environment Setup (Stage 4.10)
- **Author:** Implementation Engineer
- **Status:** DRAFT
- **Created:** 2026-10-12
- **Revision:** 0.1
- **Naming:** follows the existing `NN-NAME.md` convention; Stage 4.1→07, 4.2→08, 4.3→09, 4.4→10, 4.5→11, 4.6→12, 4.7→13, 4.8→14, 4.9→15, 4.10→16. 

## 1. Purpose and Scope
This stage defines the implementation framework and environment setup for the portfolio system, establishing the foundation for feature development in Stage 4.11. It covers the development environment, project structure, dependency management, configuration, security foundations, testing setup, and verification gates.

This stage is DESIGN ONLY. No implementation artifacts are created — no HTML, CSS, JavaScript, templates, components, stylesheets, client scripts, tests, or configuration that would be part of the final application. The output is a framework specification that guides implementation.

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
- **Governance:** `docs/14-DECISION-LOG.md` (2026-10-11 entry: Stage 4.9 ACCEPTED AND FROZEN; Stage 4.10 is the next authorized design stage); `docs/15-GOVERNANCE-AND-STAGE-LIFECYCLE.md`; `docs/ENGINEERING-CONSTITUTION.md`.
- **Supporting scaffold:** None required; technology decisions are frozen in `12-TECHNOLOGY-DECISIONS.md`.

## 3. Environment Baseline
- **Operating System:** Linux-based container (as inferred from the execution environment).
- **Shell:** Bash (standard in the container).
- **Node.js:** LTS version (as specified in the technology decisions, exact version to be defined in implementation).
- **npm:** Standard package manager for Node.js (as per technology decisions).
- **Git:** Distributed version control system (standard).
- **Available Tools:** 
  - Node.js runtime and npm for package management.
  - Git for version control.
  - Standard Linux utilities (e.g., curl, wget, grep, etc.).
  - No database server pre-installed (to be set up as part of implementation).
- **Environment Variables:** 
  - To be defined for configuration (e.g., database connection strings, secret keys).
  - Must not commit secrets to version control (use `.env` files or secret management tools).
- **Permissions:** 
  - Standard user permissions sufficient for development; elevated privileges may be required for production deployment (to be handled separately).

## 4. Project Structure and Setup Strategy
- **Root Directory:** 
  - `/`: Repository root.
  - `/docs`: All design documents (frozen and drafts).
  - `/src`: Source code for the application (to be created in Stage 4.11).
  - `/tests`: Test code (unit, integration, end-to-end) (to be created in Stage 4.11).
  - `/public`: Static assets (if any, e.g., favicons, robots.txt) — to be created in Stage 4.11.
  - `/tmp` or `/temp`: Temporary files (not to be committed).
- **Setup Strategy:** 
  - Initialize Git repository (if not already done).
  - Create `.gitignore` to exclude `node_modules`, environment files, logs, and build artifacts.
  - Initialize `package.json` via `npm init` (or use existing if present).
  - Install dependencies via `npm install` (based on `package.json` and `package-lock.json`).
  - Set up environment configuration (e.g., `.env` file for development, excluded from Git).
  - Verify that the application can start (via `npm start` or similar) in a minimal state (to be implemented in Stage 4.11).
  - Set up testing framework (Jest/Vitest for unit/integration, Playwright for E2E) as per technology decisions.
  - Configure linting (e.g., ESLint) and formatting (e.g., Prettier) as per team standards.
  - Set up Git hooks (e.g., `pre-commit` for linting) if desired.
  - Create README for developers (separate from this design document) with setup instructions.

## 5. Dependency-Management and Configuration Principles
- **Dependency Management:** 
  - Use `npm` for installing and managing dependencies.
  - Commit `package-lock.json` to ensure reproducible builds.
  - Regularly run `npm audit` to check for vulnerabilities (as per technology decisions).
  - Use Dependabot (or similar) for automated update pull requests (as per technology decisions).
  - Keep dependencies up to date to mitigate known issues.
  - Do not commit `node_modules` to version control.
- **Configuration:** 
  - Use environment variables for configuration (e.g., database URLs, secret keys, feature flags).
  - Separate configuration files for different environments (development, test, production) — to be created in Stage 4.11.
  - Load configuration via a library (e.g., `dotenv` for Node.js) in the application.
  - Never commit secrets or sensitive data to version control.
  - Use `.env.example` or similar to document required variables without exposing values.
- **Secrets Management:** 
  - Store secrets in environment variables or a secret management service (e.g., AWS Secrets Manager, HashiCorp Vault) in production.
  - In development, use `.env` file (excluded from Git via `.gitignore`).
  - Rotate secrets periodically and after any suspected exposure.
  - Never log secrets or sensitive data.

## 6. Error Handling and Logging Principles
- **Error Handling:** 
  - Implement centralized error handling for the application (to be done in Stage 4.11).
  - Return appropriate HTTP status codes (e.g., 400 for client errors, 401/403 for auth, 404 for not found, 500 for server errors).
  - Log errors with sufficient context for debugging but without exposing sensitive data.
  - Use structured logging (e.g., Winston) for better log management.
- **Logging:** 
  - Use structured logging (JSON format) for production readiness.
  - Log levels: error, warn, info, debug (adjust based on environment).
  - Never log sensitive data (passwords, tokens, PII) — mask or omit.
  - Logs should be retained and rotated based on storage and compliance requirements (to be defined in implementation).
  - In development, logs may be written to console or file; in production, to a centralized system or file.

## 7. Security Middleware Integration Strategy
- **Security Headers:** 
  - Use `helmet` middleware (or equivalent) to set HTTP headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.) as per technology decisions.
- **CSRF Protection:** 
  - Use `csurf` middleware (or equivalent) to generate and validate tokens for state-changing POST requests.
- **Rate Limiting:** 
  - Use `express-rate-limit` (or equivalent) to limit requests based on IP and/or API key.
- **Authentication and Authorization:** 
  - Implement server-side session management (via `express-session` or equivalent) as per technology decisions.
  - Use HTTPS in production (TLS 1.3 minimum) to protect cookies and data in transit.
  - Validate and sanitize all inputs to prevent injection attacks (SQLi, XSS, etc.).
  - Use parameterized queries or ORM to prevent SQL injection.
  - Escape output to prevent XSS (via templating engine auto-escaping or explicit escaping).
- **Data Protection:** 
  - Hash passwords with bcrypt (minimum 12 rounds) before storage.
  - Do not store sensitive data in plaintext (e.g., in logs, databases, or cookies).
  - Use secure cookies (HTTPOnly, Secure, SameSite) for session management.

## 8. Server-Rendered View and Static-Asset Organization
- **Views:** 
  - Use a templating engine (e.g., EJS, Pug, Handlebars) as per technology decisions.
  - Organize views by feature or route (e.g., `/views/projects`, `/views/skills`).
  - Reuse partials for common components (headers, footers, navigation).
  - Ensure templates are secure against XSS (auto-escaping enabled).
- **Static Assets:** 
  - Serve static assets (CSS, JS, images) from a `/public` directory (to be created in Stage 4.11).
  - Use a static file middleware (e.g., `express.static`) in the application.
  - Optimize assets (minification, compression) as part of the build process (to be defined in Stage 4.11).
  - Use cache-busting techniques (e.g., content hashing in filenames) for production.

## 9. Persistence Abstraction and Database-Selection Gate
- **Persistence Abstraction:** 
  - Use an ORM (e.g., Sequelize, TypeORM, Knex.js) or query builder to interact with the database.
  - Abstract database operations behind service or repository layers to allow for future changes.
  - Ensure the ORM supports the required relations (Claim 1:N Evidence N:1 Artifact) and deletion constraints (CASCADE/RESTRICT).
- **Database-Selection Gate:** 
  - The technology decisions consider SQLite for development/prototyping and PostgreSQL for production as options, with final selection to be validated during implementation.
  - The framework should support switching between databases via configuration (e.g., environment variable) without code changes.
  - Validate compatibility, performance, and features during implementation (Stage 4.11) before finalizing the choice.
  - Use migrations (via ORM or tools like `migra`, `flyway`, or `dbmate`) to manage schema changes.
  - Ensure migrations are tested and reproducible.

## 10. Automated Testing Framework Selection Criteria
- **Unit/Integration Testing:** 
  - Use Jest or Vitest (as per technology decisions) for testing business logic, utility functions, and API endpoints.
  - Aim for high coverage (e.g., 80%+) of critical paths, but focus on meaningful tests over blind coverage targets.
  - Mock external dependencies (e.g., database, third-party APIs) where appropriate.
- **End-to-End Testing:** 
  - Use Playwright (as per technology decisions) for testing user journeys across the full system (frontend and backend).
  - Test critical paths: public browsing, private management (login, create project, add evidence, request verification, publish), verification workflow, publication toggling.
  - Run tests in headless mode for CI; optionally in headed mode for debugging.
- **Testing Principles:** 
  - Write tests that verify behavior, not just implementation details.
  - Include positive, negative, and boundary cases.
  - Test error handling and failure modes.
  - Isolate tests using separate databases or mocks to avoid interference.
  - Run tests in CI on every pull request and push to main.
  - Require all tests to pass before merging (gated merges).

## 11. Accessibility Verification Approach
- **Automated Testing:** 
  - Use tools like `axe-core` (via Playwright or Jest) to automate WCAG 2.2 AA compliance checks.
  - Integrate into the test suite to run on every change.
- **Manual Testing:** 
  - Conduct manual screening with screen readers (e.g., NVDA, VoiceOver) and keyboard-only navigation.
  - Test color contrast, focus management, and ARIA labels.
  - Involve users with disabilities in testing if possible (to be arranged separately).
- **Implementation:** 
  - Use semantic HTML (header, nav, main, section, article, footer).
  - Ensure proper heading hierarchy (h1-h6).
  - Provide alt text for images (empty alt for decorative).
  - Provide captions/transcripts for multimedia (to be created in Stage 4.11).
  - Ensure focus is visible and manageable (e.g., avoid focus traps).
  - Ensure touch targets are at least 44x44px.
  - Respect reduced motion media query.
  - Ensure text is resizable up to 200% without loss of content or function.

## 12. Linting, Formatting, and Static-Analysis Strategy
- **Linting:** 
  - Use ESLint (or equivalent) with plugins for Node.js and Jest/Vitest to catch potential errors and enforce code quality.
  - Configure rules to match team preferences (e.g., no unused variables, consistent quoting, etc.).
  - Run on every commit via `pre-commit` hook or in CI.
- **Formatting:** 
  - Use Prettier (or equivalent) to enforce consistent code formatting.
  - Integrate with `pre-commit` hook to format files before commit.
  - Allow formatting to be adjusted via configuration (e.g., tab width, quote style).
- **Static Analysis:** 
  - Consider using tools like `SonarQube` or `CodeClimate` for deeper analysis (to be evaluated in implementation).
  - Use `npm audit` regularly to check for dependency vulnerabilities (as per technology decisions).
  - Consider using `OWASP Dependency-Check` or `Snyk` for additional scanning (to be evaluated).

## 13. Git and Branch/Commit Workflow Proposal
- **Branching Strategy:** 
  - Use `main` (or `master`) branch as the stable, release-ready branch.
  - Use feature branches (e.g., `feature/feature-name`) for new work.
  - Use `develop` or `develop` branch for integration if desired (optional, to be decided by team).
  - Use `release/*` branches for release preparation (optional).
  - Use `hotfix/*` branches for urgent fixes to production.
- **Commit Messages:** 
  - Use clear, descriptive messages (e.g., "feat: add user login", "fix: resolve typo in header").
  - Consider using conventional commits (e.g., `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`).
  - Reference issues or tickets if applicable (e.g., `fix: resolve login issue #123`).
- **Pull Requests:** 
  - Require pull requests for all changes to `main`.
  - Require at least one approval before merging.
  - Require all checks to pass (CI, tests, linting) before merging.
  - Squash or merge commits as per team preference (squash preferred for clean history).
- **Repository Hygiene:** 
  - Keep `main` deployable at all times (via automated testing and gated merges).
  - Regularly clean up stale branches.
  - Tag releases (e.g., `v1.0.0`) for traceability.

## 14. CI Workflow Proposal and Merge-Gate Criteria
- **CI Workflow:** 
  - Use GitHub Actions (as per technology decisions) for continuous integration.
  - Define workflows in `.github/workflows/`.
  - Example workflow: 
    - On push to any branch and pull request to `main`.
    - Steps: 
      1. Checkout code.
      2. Set up Node.js (use the specified LTS version).
      3. Install dependencies (`npm ci` for clean install, `npm install` for development).
      4. Run linting (`npm run lint` if defined).
      5. Run tests (`npm test` if defined, covering unit, integration, and E2E).
      6. Build the application (if applicable, e.g., for static assets).
      7. (Optional) Deploy to a staging environment for further testing.
  - Use caching for `node_modules` to speed up subsequent runs.
  - Fail the workflow on any step failure (linting, tests, build).
- **Merge-Gate Criteria:** 
  - All checks in the CI workflow must pass.
  - Code must be reviewed and approved by at least one team member.
  - No unresolved discussions or requested changes in the pull request.
  - The branch must be up to date with `main` (rebase or merge as per team policy).
  - The change must be describable and necessary.

## 15. Health-Check Design Criteria
- **Purpose:** 
  - Provide a simple way to verify that the application is running and able to serve requests.
  - Used by load balancers, orchestration systems (e.g., Kubernetes), and monitoring tools.
- **Design:** 
  - Create an endpoint (e.g., `GET /health` or `GET /api/health`) that returns a 200 OK response when the application is ready.
  - The response should be minimal (e.g., `{ "status": "OK" }` or plain text "OK").
  - The check should verify that critical dependencies are available (e.g., database connection, if applicable).
  - In development, the check may be less strict; in production, it should verify essential services.
- **Implementation:** 
  - The endpoint should be lightweight and not perform heavy operations.
  - It should not depend on external services that may cause delays or failures (e.g., third-party APIs).
  - If the database is required for the application to function, the health check should attempt a simple query (e.g., `SELECT 1`) and return 503 if it fails.
  - Ensure the health check does not expose sensitive data (e.g., no database credentials in errors).
- **Integration:** 
  - The health-check endpoint should be publicly accessible (no authentication required) for ease of use by orchestration systems.
  - It should be logged at an appropriate level (e.g., info) for monitoring.

## 16. Reproducible Setup and Recovery Procedures
- **Setup Procedure:** 
  1. Clone the repository (if not already done).
  2. Install Node.js (LTS version as specified in `.nvmrc` or `package.json`).
  3. Install npm dependencies: `npm install`.
  4. Copy `.env.example` to `.env` and fill in required values (e.g., database connection, secret keys).
  5. Run any database migrations (if applicable, to be defined in Stage 4.11).
  6. Start the application: `npm start` (or `npm run dev` for development).
  7. Verify the application is running (e.g., via health check or visiting `http://localhost:3000`).
- **Recovery Procedure:** 
  - If the application fails to start, check logs for errors.
  - Ensure dependencies are installed correctly (`npm ls` to check for missing or incompatible packages).
  - Verify environment variables are set correctly.
  - Check database connectivity and migration status.
  - Restart the service after resolving the issue.
  - In production, use process managers (PM2, systemd, Docker) to automate restarts.

## 17. Verification Commands and Expected Evidence
- **Verification Command:** `npm test` (or equivalent, as defined in `package.json`).
- **Expected Evidence:** 
  - All unit tests pass.
  - All integration tests pass.
  - All end-to-end tests pass (if applicable and implemented).
  - Linting passes (if defined via `npm run lint`).
  - No security vulnerabilities reported by `npm audit` (or acceptable levels as per risk assessment).
  - The application starts successfully and responds to the health check.
  - Basic functionality can be verified manually (e.g., visiting the homepage, logging in if implemented).
- **Additional Verification:** 
  - Run `npm audit` to check for dependency vulnerabilities (should be within acceptable limits).
  - Verify that `.env` file exists and is not committed to Git (check `git status`).
  - Verify that `node_modules` is not committed to Git.
  - Verify that the Git history is clean (no uncommitted changes unless intentional).

## 18. Risks, Deferred Decisions, and Exit Criteria
- **RISK-FW-01:** Environment setup complexity — Mitigation: Provide clear, step-by-step instructions; automate where possible (e.g., via scripts).
- **RISK-FW-02:** Dependency conflicts or vulnerabilities — Mitigation: Regular audits, automated updates, and careful version selection.
- **RISK-FW-03:** Configuration errors or missing secrets — Mitigation: Validate configuration on startup; provide clear error messages; use `.env.example` as template.
- **RISK-FW-04:** Testing setup complexity or flaky tests — Mitigation: Start with simple tests; use stable selectors and waits; retry logic for flaky tests.
- **RISK-FW-05:** Inconsistent team practices — Mitigation: Enforce linting, formatting, and code review via CI and pull requests.
- **RISK-FW-06:** Database selection or migration issues — Mitigation: Validate compatibility and performance during implementation; use migrations; test backup and restore procedures.
- **DEFER-FW-01:** Advanced CI/CD features (e.g., blue/green deployment, canary releases) — Defer to Stage 4.12 or later.
- **DEFER-FW-02:** Advanced observability (e.g., distributed tracing, real-user monitoring) — Defer to Stage 4.12 or later.
- **DEFER-FW-03:** Advanced security features (e.g., Web Application Firewall, runtime application self-protection) — Defer to Stage 4.12 or later.
- **DEFER-FW-04:** Performance optimization beyond basics (e.g., HTTP/2, server-side rendering optimization, CDN) — Defer to Stage 4.12 or later.
- **UNQ-FW-01:** Exact Node.js version to use (e.g., 18.x vs 20.x) — Resolution: define based on LTS status and compatibility at time of implementation.
- **UNQ-FW-02:** Exact npm version or package manager enhancements (e.g., pnpm) — Resolution: define based on team preference and compatibility.
- **UNQ-FW-03:** Whether to use TypeScript or JavaScript — Resolution: defer to implementation stage based on team expertise and project needs (JavaScript selected in technology decisions for simplicity).
- **UNQ-FW-04:** Specific linting and formatting rules (e.g., line length, quote style) — Resolution: define during implementation stage based on team preference.
- **UNQ-FW-05:** Whether to use a CSS preprocessor (e.g., Sass, Less) or CSS-in-JS — Resolution: defer to implementation stage; standard CSS selected for simplicity.
- **UNQ-FW-06:** Whether to use a specific ORM (Sequelize, TypeORM, Knex.js) — Resolution: define during implementation stage based on features and compatibility.
- **UNQ-FW-07:** Exact database version and configuration (e.g., PostgreSQL version, authentication method) — Resolution: define during implementation stage based on compatibility and features.
- **UNQ-FW-08:** Exact health-check implementation (what it checks, how it responds) — Resolution: define during implementation stage based on system requirements.
- **UNQ-FW-09:** Exact logging configuration (levels, formats, transports) — Resolution: define during implementation stage based on operational needs.
- **UNQ-FW-10:** Whether to use a process manager (PM2, systemd, Docker) in development — Resolution: defer to implementation stage; optional for simplicity.

## Exit Criteria
Stage 4.10 is considered complete when:
- The draft document is complete (all sections present with substantive content).
- The document ends with the exact line: `DRAFT — STAGE 4.10 COMPLETE — AWAITING AUDIT`.
- All claims are traceable to authoritative sources (requirements, frozen design documents, technology decisions, testing design, governance documents).
- No unsupported requirements are presented as mandatory.
- All proposals, recommendations, unresolved questions, and deferred decisions are explicitly labeled as such.
- The draft is internally consistent and does not contradict any frozen design document (Stages 3-4.9).
- The draft does not introduce new binding requirements or implementation details that should be reserved for Stage 4.11.

## Final Status
ACCEPTED — STAGE 4.10 COMPLETE