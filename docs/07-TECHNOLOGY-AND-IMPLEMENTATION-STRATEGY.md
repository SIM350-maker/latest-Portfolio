# STAGE 4.1 — TECHNOLOGY & IMPLEMENTATION STRATEGY

## 1. Document Control
- **Document**: 07-TECHNOLOGY-AND-IMPLEMENTATION-STRATEGY.md
- **Stage**: 4.1
- **Purpose**: Determine the technology and implementation strategy for the frozen requirements, domain model, and architecture.
- **Author**: Implementation Strategy Engineer
- **Status**: DRAFT
- **Last Updated**: 2026-10-07

## 2. Stage 4.1 Scope
This stage focuses on selecting appropriate technologies and implementation strategies that can faithfully implement the already-frozen requirements (docs/03-REQUIREMENTS.md), domain model (docs/05-DOMAIN-MODEL.md), and architecture (docs/06-SYSTEM-ARCHITECTURE.md). No implementation code, database schemas, or application scaffolding will be created in this stage.

## 3. Authoritative Inputs
The following files were read and considered authoritative:
- G:\Futuristic_Engineering\Portfolio\docs\ENGINEERING-CONSTITUTION.md
- G:\Futuristic_Engineering\Portfolio\docs\03-REQUIREMENTS.md
- G:\Futuristic_Engineering\Portfolio\docs\05-DOMAIN-MODEL.md
- G:\Futuristic_Engineering\Portfolio\docs\06-SYSTEM-ARCHITECTURE.md

## 4. Environment Evidence
The following tools were discovered in the local environment:
- Node.js: v24.13.1
- npm: 11.6.0
- Git: version 2.50.1.windows.1
- Docker: version 29.8.0, build 88096ef
- Python: 3.14.3
- Java: Not available (not in PATH)
- Other standard Windows tools are available.

## 5. Technology Selection Principles
Technology selections must adhere to:
- **Engineering Constitution Principle 17**: Prefer the simplest architecture that satisfies the verified requirements.
- **Constraint C-001**: Technology stack must be chosen based on fitness-for-purpose, not popularity or familiarity.
- **Constraint C-002**: Every feature or design decision must be evaluated against its ability to support the presentation and verification of engineering evidence.
- **Evidence Control**: Decisions must be based on verifiable evidence from the environment, requirements, or domain model; assumptions must be labeled as such.
- **Technology Neutrality**: Avoid premature commitment to specific implementations where not required; defer decisions that are not justified by current evidence.

## 6. Application Technology Evaluation
The frozen architecture specifies a **Modular Monolith / Single Deployable Application** with conceptual separation between Content Management, Public Presentation, Security, and Evidence Store.

### Evaluation Criteria:
- Must support modular monolith architecture (single deployable unit with internal separation of concerns).
- Must allow clear separation of public presentation and private management (via authentication and authorization).
- Must support content/presentation separation (content updates without code changes).
- Must be able to serve both static/public content and dynamic/private management interfaces.
- Should have a mature ecosystem for web development.
- Should align with the evidence-first principle (C-002).

### Candidate Options:

#### Option A: Full-stack web application using a single language/framework (e.g., Node.js with Express, or Python with Django/FastAPI)
- **Advantages**: 
  - Single language for both frontend and backend reduces context switching.
  - Easy to package as a single deployable unit.
  - Good support for modular monolith structure.
  - Node.js is available in the environment (v24.13.1).
  - Python is also available (3.14.3).
  - Both have mature web frameworks.
- **Disadvantages**:
  - May require more effort to achieve high interactivity on the frontend if using server-rendered views.
  - If choosing a backend-heavy framework, frontend might be less dynamic.
- **Evidence**: 
  - Node.js and npm are available in the environment.
  - The architecture does not require a split frontend/backend, so a full-stack approach is suitable.

#### Option B: Frontend + Backend within one deployable system (e.g., separate frontend SPA and backend API, but packaged together)
- **Advantages**:
  - Allows independent development of frontend and backend while still being a single deployable unit.
  - Can use modern SPA frameworks for frontend and a lightweight backend for API.
  - Clear separation of concerns.
- **Disadvantages**:
  - Slightly more complex to build and deploy (two parts to coordinate).
  - May introduce unnecessary complexity if a simpler approach suffices.
- **Evidence**:
  - Both frontend and backend technologies are available (Node.js for backend, and frontend frameworks can be installed via npm).

#### Option C: Server-rendered application with minimal client-side interactivity (e.g., using a templating engine)
- **Advantages**:
  - Simplest possible web application.
  - Easy to deploy and maintain.
  - Naturally supports content/presentation separation.
  - Good for static/public content with dynamic private management.
- **Disadvantages**:
  - May not provide the rich user experience expected for a modern portfolio (though requirements do not demand high interactivity).
  - Evidence verification guidance might be limited to static links.
- **Evidence**:
  - Can be implemented with Node.js (using Express and a templating engine like EJS or Pug) or Python (using Flask or FastAPI with Jinja2).

### Decision:
We select **Option A: Full-stack web application using a single language/framework (Node.js with Express)** for the following reasons:
- The environment already has Node.js and npm installed, reducing setup complexity.
- A single language (JavaScript/TypeScript) for both frontend and backend simplifies development and maintains the modular monolith as a single deployable unit.
- It allows us to build a server-rendered application for the public presentation (with optional client-side enhancements) and a separate but co-located private management interface.
- It satisfies the requirement for content/presentation separation (content stored separately from presentation logic).
- It aligns with the evidence-first principle by keeping the focus on evidence presentation without introducing unnecessary complexity.
- It is simpler than a split frontend/backend deployable unit (Option B) and more flexible than a purely server-rendered approach (Option C) for potential future enhancements.

### Risks:
- If the portfolio requires highly interactive frontend features, a pure server-rendered approach might need significant client-side JavaScript, which could blur the lines. However, we can still use Node.js to serve static assets and handle API calls for interactivity.
- The risk is low because we can choose to implement the public presentation as a server-rendered application with minimal client-side JavaScript for accessibility and responsiveness, and use the same stack for the private management system.

### Deferred Consequences:
- The exact frontend approach (server-rendered vs. SPA with API) can be refined in later design stages, but the core decision to use Node.js as the platform is made.

## 7. Frontend Technology Evaluation
Given that we have selected Node.js as the backend platform, we now evaluate frontend technologies for the user interface (both public presentation and private management).

### Evaluation Criteria:
- Must support responsive design (FR-008).
- Must support accessibility compliance (WCAG 2.2 AA, FR-009).
- Must allow clear presentation of content, evidence, and verification guidance.
- Should be maintainable and have a good ecosystem.
- Should integrate well with the chosen backend (Node.js/Express).
- Should support content/presentation separation (i.e., the frontend should not be tightly coupled to backend templates if we choose an SPA approach, but we can also use server-rendered templates).

### Candidate Options:

#### Option A: Server-rendered HTML using a templating engine (e.g., EJS, Pug, or Handlebars)
- **Advantages**:
  - Simplest frontend technology.
  - Naturally integrates with Express.js.
  - Easy to ensure accessibility and responsiveness with standard HTML/CSS.
  - No build step required for simple changes.
  - Content/presentation separation is maintained by keeping content in the backend (database or files) and rendered via templates.
- **Disadvantages**:
  - Less interactivity; full page reloads for navigation.
  - May require more backend rendering work.
- **Evidence**:
  - Node.js and Express support templating engines natively.

#### Option B: Single Page Application (SPA) using a modern framework (e.g., React, Vue, or Svelte) with a separate API backend (still within the same Node.js server)
- **Advantages**:
  - Rich user experience with client-side routing and interactivity.
  - Can leverage a large ecosystem of components and tools.
  - Still a single deployable unit (the Node.js server serves the static frontend assets and provides API endpoints).
  - Good for complex interactions if needed.
- **Disadvantages**:
  - More complex to set up (build process, API design).
  - Potential for over-engineering if not needed.
  - Accessibility and responsiveness require extra effort in the SPA framework.
- **Evidence**:
  - Node.js can serve static files and handle API routes.
  - Frontend frameworks can be installed via npm.

#### Option C: Hybrid approach (server-rendered for public presentation, SPA for private management)
- **Advantages**:
  - Optimizes each part for its use case: public presentation can be simple and fast, private management can be more interactive.
  - Still a single deployable unit.
- **Disadvantages**:
  - Increases complexity by using two different frontend approaches.
  - Requires more maintenance.
- **Evidence**:
  - Possible with Node.js by serving different entry points.

### Decision:
We select **Option A: Server-rendered HTML using a templating engine (e.g., EJS)** for the following reasons:
- The requirements do not demand a highly interactive user experience; the core functionality is about presenting evidence and content.
- Server-rendered HTML is the simplest way to achieve responsive design and accessibility compliance (FR-008, FR-009) using standard web technologies.
- It naturally supports content/presentation separation: content is stored in the backend (e.g., in a database or files) and rendered via templates.
- It reduces complexity and potential points of failure.
- It aligns with the engineering constitution principle 17 (prefer simplest architecture).
- The environment has Node.js, which makes implementing a server-rendered app straightforward.

### Risks:
- If future requirements demand more interactivity (e.g., real-time validation, dynamic filtering), we might need to introduce client-side JavaScript. However, this can be done incrementally without changing the core decision.
- The risk is mitigated by the ability to enhance specific pages with client-side scripts while keeping the majority server-rendered.

### Deferred Consequences:
- The exact choice of templating engine (EJS, Pug, etc.) can be decided later.
- The decision to introduce client-side JavaScript for specific enhancements can be made in later design stages.

## 8. Backend Technology Evaluation
Having selected Node.js as the platform (Application Technology Evaluation), we now evaluate the specific backend technology for implementing the server logic.

### Evaluation Criteria:
- Must support HTTP routing and middleware (for handling public and private requests).
- Must allow integration with the chosen templating engine for server-rendered views.
- Must support authentication and authorization mechanisms.
- Must be able to serve static files (for public assets).
- Should have a mature ecosystem and good documentation.
- Should be lightweight and suitable for a modular monolith.
- Should align with the evidence-first principle.

### Candidate Options:

#### Option A: Express.js
- **Advantages**:
  - Minimal and flexible Node.js web application framework.
  - Excellent support for routing, middleware, and templating engines.
  - Widely used and well-documented.
  - Easy to set up and maintain.
  - Fits the modular monolith approach naturally.
- **Disadvantages**:
  - Requires manual setup of certain features (e.g., authentication) that might be built-in in heavier frameworks.
  - However, this simplicity is beneficial for avoiding unnecessary complexity.
- **Evidence**:
  - Node.js is available; Express can be installed via npm.
  - The architecture does not require a heavy backend framework.

#### Option B: Fastify
- **Advantages**:
  - High performance, low overhead.
  - Built-in support for schema validation and logging.
  - Modern alternative to Express.
- **Disadvantages**:
  - Smaller ecosystem compared to Express.
  - May require learning a new API.
- **Evidence**:
  - Can be installed via npm.

#### Option C: Koa.js
- **Advantages**:
  - Created by the same team as Express, designed to be a more modular foundation.
  - Uses async functions extensively.
- **Disadvantages**:
  - Smaller community and ecosystem.
  - Might be overkill for this application.
- **Evidence**:
  - Can be installed via npm.

#### Option D: Hapi.js
- **Advantages**:
  - Rich set of features for building applications and services.
  - Built-in input validation, caching, etc.
- **Disadvantages**:
  - Heavier than Express.
  - May introduce unnecessary complexity.
- **Evidence**:
  - Can be installed via npm.

### Decision:
We select **Option A: Express.js** for the following reasons:
- It is the most straightforward and widely adopted framework for Node.js.
- It provides the necessary features for routing, middleware, and templating without being overly prescriptive.
- Its simplicity aligns with the engineering constitution principle 17.
- It allows us to implement the required modular monolith structure with clear separation of concerns (public routes vs. private routes, authentication middleware, etc.).
- The environment has Node.js, making it easy to install and use Express.
- It satisfies the evidence-first principle by keeping the focus on the core problem without adding unnecessary abstractions.

### Risks:
- If the application grows significantly in complexity, we might need to refactor into more structured modules. However, this is a manageable risk and can be addressed with good code organization.
- The risk is low given the scope of the portfolio system.

### Deferred Consequences:
- The exact middleware and project structure (e.g., how to organize routes, controllers, services) can be refined in later design stages.
- The decision to use TypeScript or plain JavaScript can be made later (we recommend TypeScript for better maintainability, but it is not required).

## 9. Persistence Technology Evaluation
We now evaluate persistence technologies for storing the application data (content, evidence, users, etc.).

### Evaluation Criteria:
- Must support the domain model: Claim, Evidence, Artifact, Professional Identity, Project, Skill, Content, Publication State, Accessibility, Verification Method, Verification Result.
- Must support relationships: Claim 1:N Evidence, Evidence 1:1 Claim, Evidence 1:1 Artifact, Artifact 0:N Evidence, etc.
- Must support content management operations (create, read, update, delete).
- Must support querying by various criteria (e.g., find evidence by claim, find claims by evidence).
- Should have good support for transactions and data integrity.
- Should be suitable for a single deployable application (modular monolith).
- Should align with the evidence-first principle.
- Should be technology-neutral in the sense that we do not commit to a specific vendor unless justified.

### Candidate Options:

#### Option A: Relational Database (e.g., PostgreSQL, SQLite, MySQL)
- **Advantages**:
  - Excellent fit for the relational nature of the domain model (Claim-Evidence-Artifact relationships).
  - Supports transactions, constraints, and joins.
  - Mature and well-understood technology.
  - SQLite is file-based and requires no separate server (good for simplicity).
  - PostgreSQL is robust and feature-rich.
  - Both can be used in a single deployable application (SQLite especially).
- **Disadvantages**:
  - Requires setting up a database and managing schemas (though this is straightforward).
  - For SQLite, concurrency might be a concern under high write loads (but unlikely for a personal portfolio).
- **Evidence**:
  - The environment does not have a database installed by default, but we can install one (e.g., PostgreSQL) or use SQLite which is often available via libraries.
  - Node.js has excellent libraries for both (e.g., pg for PostgreSQL, better-sqlite3 for SQLite).

#### Option B: Document Database (e.g., MongoDB)
- **Advantages**:
  - Flexible schema, which might be useful for varying evidence types.
  - Easy to store JSON-like documents.
- **Disadvantages**:
  - Less natural fit for the highly relational domain model (though it can be done).
  - May require more effort to maintain data integrity and relationships.
  - Overkill for this application.
- **Evidence**:
  - Can be installed via npm (mongodb driver).

#### Option C: In-memory or File-based Storage (e.g., JSON files, lowdb)
- **Advantages**:
  - Simplest possible persistence.
  - No external database server required.
  - Good for prototyping or very small scale.
- **Disadvantages**:
  - Lack of transaction support and concurrency control.
  - Not suitable for any significant amount of data or concurrent access.
  - Difficult to scale or maintain integrity.
- **Evidence**:
  - Can be implemented with Node.js file system or lowdb package.

### Decision:
We select **Option A: Relational Database, specifically SQLite** for the following reasons:
- The domain model is inherently relational (Claim-Evidence-Artifact relationships, etc.), and a relational database is a natural fit.
- SQLite is file-based, zero-configuration, and requires no separate database server, which simplifies deployment and aligns with the modular monolith as a single deployable unit.
- It supports transactions, which are important for data integrity (e.g., when updating related claims and evidence).
- It is sufficient for the expected scale of a personal portfolio (low to moderate read/write volume).
- The environment has Node.js, and there are excellent SQLite libraries available (e.g., better-sqlite3).
- It aligns with the engineering constitution principle 17 (simplicity) by avoiding the complexity of a separate database server.
- It satisfies the evidence-first principle by providing a reliable way to store and retrieve evidence relationships.

### Risks:
- If the portfolio grows beyond a personal scale (e.g., multiple users, high traffic), SQLite might not scale well. However, the requirements do not indicate such a scale, and we can migrate to a client-server database (e.g., PostgreSQL) if needed in the future.
- The risk is mitigated by the fact that the architecture does not tie us to a specific persistence technology; we can change it later if justified.

### Deferred Consequences:
- The exact database schema design (tables, columns, constraints) will be worked out in later design stages.
- The decision to use a different relational database (e.g., PostgreSQL) can be made later if scaling requirements change.
- The use of an ORM or query builder can be decided later (we recommend using a lightweight wrapper or raw SQL for simplicity).

## 10. Authentication/Authorization Evaluation
We now evaluate authentication and authorization approaches for securing the private management system.

### Evaluation Criteria:
- Must protect the private management system from unauthorized access (NFR-001).
- Must support the principle of least privilege.
- Must allow the engineer to log in, manage content, and publish.
- Must not expose unpublished content or credentials.
- Should be integrateable with the chosen backend (Node.js/Express).
- Should support secure session or token handling.
- Should align with the evidence-first principle.
- Should be technology-neutral where possible.

### Candidate Options:

#### Option A: Session-based Authentication (using cookies)
- **Advantages**:
  - Simple to implement with Express.js middleware (e.g., express-session).
  - Well-understood and widely used.
  - Secure if configured properly (HTTPS, secure cookies, etc.).
  - Allows easy server-side session invalidation.
- **Disadvantages**:
  - Requires server-side session storage (can be in-memory, Redis, or database).
  - For a single deployable unit, in-memory sessions are simplest but not persistent across restarts.
- **Evidence**:
  - Node.js has mature session middleware.

#### Option B: Token-based Authentication (e.g., JWT)
- **Advantages**:
  - Stateless; no server-side session storage required.
  - Easy to scale if needed.
  - Can be used for both authentication and authorization.
- **Disadvantages**:
  - Requires careful handling of token storage on the client (XSS risks).
  - Token revocation is more complex.
  - May be overkill for a single-user portfolio.
- **Evidence**:
  - Node.js has libraries for JWT (e.g., jsonwebtoken).

#### Option C: Third-party Authentication (e.g., OAuth via Google, GitHub)
- **Advantages**:
  - Offloads authentication to a trusted provider.
  - Reduces password management burden.
  - Can provide additional user information.
- **Disadvantages**:
  - Introduces dependency on external services.
  - May be overkill if we only need a single engineer account.
  - Requires handling of OAuth flows.
- **Evidence**:
  - Node.js has libraries for OAuth (e.g., passport).

#### Option D: Simple Username/Password with Hashed Passwords (custom implementation)
- **Advantages**:
  - Simplest possible authentication mechanism.
  - Full control over the process.
- **Disadvantages**:
  - Requires careful implementation to avoid common pitfalls (e.g., using strong hashing like bcrypt).
  - Must be done correctly to be secure.
- **Evidence**:
  - Node.js has crypto libraries for hashing (e.g., bcrypt).

### Decision:
We select **Option A: Session-based Authentication (using cookies with express-session)** for the following reasons:
- It is simple to implement and sufficient for a single-user private management system.
- It allows us to easily protect routes and manage user sessions.
- It aligns with the engineering constitution principle 17 by choosing a straightforward solution.
- It satisfies the requirement for secure authentication and authorization (NFR-001) when combined with HTTPS and secure cookie flags.
- The environment has Node.js, making it easy to install and use express-session.
- It keeps the focus on the core problem without introducing unnecessary complexity (evidence-first principle).

### Risks:
- If we choose in-memory session storage, sessions will be lost on server restart. However, for a personal portfolio, this is acceptable as the engineer can simply log in again.
- The risk is low and can be mitigated by using a persistent session store (e.g., database-backed sessions) if needed.
- We must ensure to use HTTPS in production to protect cookies.

### Deferred Consequences:
- The exact session storage mechanism (in-memory, database, or Redis) can be decided later.
- The decision to add additional security measures (e.g., rate limiting, CSRF protection) can be made in later design stages.
- The choice to use TypeScript or plain JavaScript for authentication logic can be deferred.

## 11. Content Management Evaluation
We now evaluate how content management should be implemented within the application.

### Evaluation Criteria:
- Must provide a private interface for the engineer to create, edit, associate evidence with, and publish content without modifying application code (FR-005).
- Must support content/presentation separation (NFR-002).
- Must allow managing the domain entities: Professional Identity, Project, Skill, Claim, Evidence, etc.
- Must integrate with the chosen persistence technology (SQLite) and backend (Node.js/Express).
- Should be maintainable and secure.
- Should align with the evidence-first principle.

### Candidate Options:

#### Option A: Custom-built Content Management Module (within the Node.js/Express application)
- **Advantages**:
  - Full control over the functionality and data model.
  - Direct integration with the chosen persistence layer (SQLite).
  - No external dependencies or licensing concerns.
  - Can be kept simple and tailored to the exact needs.
- **Disadvantages**:
  - Requires building the CRUD interfaces, validation, etc., from scratch.
  - However, for the scope of this portfolio, this is manageable.
- **Evidence**:
  - We have Node.js and Express; we can build the necessary routes and views.

#### Option B: Headless CMS (e.g., Strapi, Directus, or Sanity)
- **Advantages**:
  - Provides a ready-made content management API and often a web interface.
  - Can save development time.
  - API-driven, so the frontend can consume it.
- **Disadvantages**:
  - Introduces an external dependency and potential licensing issues.
  - May be overkill for this application.
  - Requires running an additional service or integrating with a third-party service.
  - Might complicate the modular monolith architecture.
- **Evidence**:
  - These can be installed via npm or run separately, but they add complexity.

#### Option C: External CMS (e.g., WordPress, Ghost) with API integration
- **Advantages**:
  - Mature platforms with extensive features.
  - Can offload content management to a specialized system.
- **Disadvantages**:
  - Significantly increases complexity and external dependencies.
  - Not aligned with the modular monolith as a single deployable unit.
  - Overkill for this application.
- **Evidence**:
  - These are separate applications and would require integration.

### Decision:
We select **Option A: Custom-built Content Management Module (within the Node.js/Express application)** for the following reasons:
- It is the simplest and most direct way to implement the content management system.
- It keeps the application as a single deployable unit (modular monolith).
- It allows us to tailor the content management to the exact domain model and requirements.
- It aligns with the engineering constitution principle 17 (prefer simplest architecture).
- It satisfies the evidence-first principle by keeping the focus on the core problem without introducing unnecessary external systems.
- The environment has Node.js and Express, making it straightforward to build the necessary CRUD operations.

### Risks:
- Building a custom content management system might take more time than integrating a headless CMS. However, for the scope of this portfolio (managing projects, skills, evidence, etc.), it is manageable and ensures a tailored solution.
- The risk is mitigated by the fact that we can reuse common patterns and libraries for validation, routing, etc.

### Deferred Consequences:
- The exact structure of the content management routes (e.g., RESTful vs. RPC) can be decided later.
- The decision to use a library or framework for generating forms or handling validation can be made later.
- The implementation details (e.g., how to handle file uploads for evidence) can be refined in later design stages.

## 12. Evidence/Artifact Strategy
We now evaluate how the system should represent and handle evidence and artifacts (repositories, deployments, documents, etc.).

### Evaluation Criteria:
- Must preserve the distinction: Artifact ≠ Evidence ≠ Claim.
- Must allow storing metadata about evidence items: description, accessibility status, verification method, and links to artifacts.
- Must not store the actual artifacts (which are external) but only references (e.g., URLs, identifiers).
- Must support the bidirectional traceability between claims and evidence.
- Must allow the engineer to specify the accessibility status (Public, Private/Restricted, Redacted, Unavailable).
- Must allow displaying evidence metadata in the public portfolio.
- Should align with the evidence-first principle.

### Candidate Options:

#### Option A: Store evidence metadata in the database (e.g., in an Evidence table) with foreign keys to claims and artifact references (URLs or identifiers).
- **Advantages**:
  - Directly supports the domain model.
  - Allows querying evidence by claim, claim by evidence, etc.
  - Simple to implement with the chosen relational database (SQLite).
  - Keeps the actual artifacts external, as required.
- **Disadvantages**:
  - Requires careful design to avoid storing the actual artifacts.
- **Evidence**:
  - This is the standard way to implement the domain model in a relational database.

#### Option B: Treat evidence as a generic "link" type with minimal metadata.
- **Advantages**:
  - Simpler to implement.
- **Disadvantages**:
  - Loses the ability to store rich metadata (description, accessibility status, verification method) as required by the domain model.
  - Violates the first-class evidence concept.
- **Evidence**:
  - This approach would not satisfy FR-006 (Evidence Accessibility Status Representation) fully.

#### Option C: Store evidence metadata in the same table as content (e.g., denormalized).
- **Advantages**:
  - Might simplify some queries.
- **Disadvantages**:
  - Risks violating the distinction between content and evidence.
  - Makes it harder to maintain the bidirectional traceability.
- **Evidence**:
  - Not recommended.

### Decision:
We select **Option A: Store evidence metadata in the database (e.g., in an Evidence table) with foreign keys to claims and artifact references (URLs or identifiers)** for the following reasons:
- It directly supports the domain model as defined in the domain model (docs/05-DOMAIN-MODEL.md).
- It allows us to store the required metadata: description, accessibility status, verification method, and links to artifacts (as URLs or identifiers).
- It enables bidirectional traceability between claims and evidence via foreign keys.
- It keeps the actual artifacts external, as required (the system only stores references).
- It aligns with the evidence-first principle by providing a clear and accurate way to represent evidence.
- It is a natural fit for the chosen relational database (SQLite).

### Risks:
- If we store URLs that become outdated, the system must not falsely represent them as accessible. This is mitigated by the accessibility status field, which must be manually updated by the engineer if the external artifact changes.
- The risk is low and is part of the honest evidence representation principle.

### Deferred Consequences:
- The exact schema for the Evidence table (columns, data types, constraints) will be worked out in later design stages.
- The decision to store additional metadata (e.g., timestamps, source) can be made later.
- The handling of different evidence types (repositories, deployments, documents, etc.) can be refined later (e.g., by having a type field or separate tables if needed).

## 13. Testing Technology Strategy
We now evaluate appropriate testing technologies for ensuring the quality of the implementation.

### Evaluation Criteria:
- Must support unit testing, integration testing, and end-to-end testing where applicable.
- Should be integrateable with the chosen backend (Node.js/Express).
- Should support testing of accessibility and responsiveness.
- Should have a good ecosystem and be maintainable.
- Should align with the engineering constitution principle 9 (testing is part of implementation).
- Should be technology-neutral where possible.

### Candidate Options:

#### Option A: Jest (for unit and integration testing) and Playwright (for end-to-end testing)
- **Advantages**:
  - Jest is a popular, feature-rich testing framework for JavaScript/TypeScript.
  - Playwright is a modern end-to-end testing tool that supports multiple browsers and is excellent for accessibility and responsiveness testing.
  - Both have strong community support and documentation.
  - Can be integrated into a Node.js project.
- **Disadvantages**:
  - Requires learning two tools, but they are complementary.
- **Evidence**:
  - Both can be installed via npm.

#### Option B: Mocha and Chai (for unit/integration) and Selenium (for end-to-end)
- **Advantages**:
  - Mature and well-understood tools.
  - Selenium is widely used for browser automation.
- **Disadvantages**:
  - Selenium can be more complex to set up and maintain than Playwright.
  - Mocha requires additional libraries for mocking, etc.
- **Evidence**:
  - Can be installed via npm.

#### Option C: Vitest (for unit/integration) and Playwright (for end-to-end)
- **Advantages**:
  - Vitest is a fast unit test framework powered by Vite.
  - Good for modern JavaScript/TypeScript projects.
- **Disadvantages**:
  - Slightly newer ecosystem than Jest.
- **Evidence**:
  - Can be installed via npm.

#### Option D: Built-in Node.js assert and manual testing
- **Advantages**:
  - Simplest possible.
- **Disadvantages**:
  - Lacks features for comprehensive testing, mocking, and reporting.
  - Not suitable for anything beyond trivial applications.
- **Evidence**:
  - Not recommended.

### Decision:
We select **Option A: Jest (for unit and integration testing) and Playwright (for end-to-end testing)** for the following reasons:
- Jest provides a robust and easy-to-use framework for unit and integration tests, with features like mocking, coverage reporting, and snapshot testing.
- Playwright is excellent for end-to-end testing, including accessibility and responsiveness testing (which supports FR-008 and FR-009).
- Both are widely used in the Node.js ecosystem and have good documentation.
- They align with the engineering constitution principle 9 by making testing an integral part of implementation.
- The environment has Node.js and npm, making it easy to install these tools.

### Risks:
- If the test suite becomes slow, we might need to optimize it. However, this is a manageable risk.
- The risk is low and can be mitigated by good test organization.

### Deferred Consequences:
- The exact test structure (e.g., how to organize unit tests, integration tests, and end-to-end tests) can be decided later.
- The decision to use TypeScript or plain JavaScript for tests can be made later.
- The inclusion of additional testing tools (e.g., for security testing, performance testing) can be deferred.

## 14. Build/Package/Dependency Management Approach
We now evaluate how to manage the project's build process, packages, and dependencies.

### Evaluation Criteria:
- Must support the chosen technologies (Node.js, Express, SQLite, etc.).
- Should be simple and reliable.
- Should have a good ecosystem and be widely used.
- Should align with the engineering constitution principle 15 (dependencies must have a justified purpose).
- Should allow for reproducible builds.

### Candidate Options:

#### Option A: npm (Node Package Manager) with a package.json file
- **Advantages**:
  - The standard package manager for Node.js.
  - Simple to use and well-integrated with the environment.
  - Allows specifying exact versions of dependencies for reproducibility.
  - Supports scripts for building, testing, and starting the application.
- **Disadvantages**:
  - None significant for this use case.
- **Evidence**:
  - npm is already available in the environment (version 11.6.0).

#### Option B: Yarn (Classic or Berry)
- **Advantages**:
  - Alternative to npm with features like plug-and-play installs.
  - Claims to be faster and more reliable in some cases.
- **Disadvantages**:
  - Introduces another tool when npm is already sufficient.
  - Not necessary given the environment already has npm.
- **Evidence**:
  - Can be installed via npm, but we already have npm.

#### Option C: pnpm
- **Advantages**:
  - Fast and disk-efficient package manager.
  - Uses symlinks to avoid duplicating packages.
- **Disadvantages**:
  - Again, introduces another tool when npm is already sufficient.
- **Evidence**:
  - Can be installed via npm.

### Decision:
We select **Option A: npm (Node Package Manager) with a package.json file** for the following reasons:
- It is the standard and most widely used package manager for Node.js.
- It is already available in the environment, so no additional installation is required.
- It allows us to manage dependencies effectively and record their justifications in the package.json or documentation.
- It supports scripts for building, testing, and starting the application, which suits our needs.
- It aligns with the engineering constitution principle 15 by allowing us to justify each dependency.

### Risks:
- If we incorrectly specify dependency versions, we might encounter issues. However, this is mitigated by using lockfiles (package-lock.json) and careful versioning.
- The risk is low and is part of standard dependency management.

### Deferred Consequences:
- The exact versions of dependencies will be decided later.
- The decision to use a lockfile (package-lock.json) is recommended and will be used.
- The inclusion of build tools (e.g., for transpiling TypeScript) can be deferred.

## 15. Deployment/Hosting Strategy
We now evaluate how to deploy and host the application.

### Evaluation Criteria:
- Must support a single deployable application (modular monolith).
- Should be simple, reliable, and secure.
- Should allow for easy updates and rollbacks.
- Should be cost-effective for a personal portfolio.
- Should align with the evidence-first principle.
- Should be technology-neutral where possible.

### Candidate Options:

#### Option A: Virtual Private Server (VPS) or Cloud VM (e.g., AWS EC2, DigitalOcean Droplet)
- **Advantages**:
  - Full control over the environment.
  - Can host the Node.js application directly.
  - Reliable and scalable if needed.
  - Many affordable options exist.
- **Disadvantages**:
  - Requires server management (OS updates, security patches, etc.).
  - May be more complex than needed for a simple portfolio.
- **Evidence**:
  - These services are widely available and well-documented.

#### Option B: Platform as a Service (PaaS) (e.g., Heroku, Render, Railway)
- **Advantages**:
  - Simplifies deployment; often just push to a Git repository.
  - Handles server management, scaling, and SSL.
  - Good for getting started quickly.
- **Disadvantages**:
  - Less control over the environment.
  - Can be more expensive at scale.
  - May introduce vendor lock-in.
- **Evidence**:
  - These services support Node.js applications.

#### Option C: Containerization (Docker) with Orchestration (e.g., Docker Compose on a VPS, or Kubernetes)
- **Advantages**:
  - Ensures consistency between development and production.
  - Easy to deploy and manage with Docker Compose for a single container.
  - Aligns with the modular monolith as a single container.
- **Disadvantages**:
  - Adds complexity of managing Docker images and containers.
  - Might be overkill for a simple application.
- **Evidence**:
  - Docker is available in the environment (version 29.8.0).

#### Option D: Static Site Hosting (e.g., Netlify, Vercel) for the public presentation, with a separate backend
- **Advantages**:
  - Excellent for static frontend content.
  - Often free for personal use.
- **Disadvantages**:
  - Does not fit the modular monolith as a single deployable unit (requires splitting public and private).
  - Complicates the architecture by splitting the system.
- **Evidence**:
  - Not suitable for our chosen architecture.

### Decision:
We select **Option C: Containerization (Docker) with Docker Compose** for the following reasons:
- It ensures that the application runs in a consistent environment, isolating dependencies and configurations.
- It aligns with the modular monolith as a single deployable unit (we can containerize the entire Node.js application).
- It simplifies deployment and reduces the risk of "it works on my machine" issues.
- Docker is already available in the environment, so no additional installation is required for the host.
- It allows us to easily manage the application's dependencies, configuration, and secrets.
- It supports the evidence-first principle by keeping the deployment simple and focused on the core problem.
- It is more straightforward than managing a full VM and simpler than a PaaS in terms of control and reproducibility.

### Risks:
- If we are not familiar with Docker, there might be a learning curve. However, the basics are straightforward.
- The risk is low and can be mitigated by using well-documented Docker practices.
- We must ensure to keep the Docker image small and secure.

### Deferred Consequences:
- The exact Dockerfile (base image, dependencies, etc.) will be worked out in later design stages.
- The decision to use Docker Compose vs. a simple docker run command can be made later (we recommend Docker Compose for clarity).
- The choice of host (e.g., a specific VPS provider) can be deferred.

## 16. CI/CD Approach
We now evaluate how to implement Continuous Integration and Continuous Deployment for the application.

### Evaluation Criteria:
- Must support automated testing (as per the testing strategy).
- Should allow for automated building, testing, and deployment.
- Should be simple to set up and maintain.
- Should align with the evidence-first principle.
- Should be technology-neutral where possible.

### Candidate Options:

#### Option A: GitHub Actions (if using GitHub)
- **Advantages**:
  - Integrated with GitHub repositories.
  - Free for public repositories and offers free minutes for private ones.
  - Can run tests, build Docker images, and deploy to various targets.
  - Well-documented and widely used.
- **Disadvantages**:
  - Requires the repository to be hosted on GitHub (or similar).
  - However, we can choose to use GitHub for this project.
- **Evidence**:
  - GitHub is a common platform; we can assume it is available or we can use it.

#### Option B: GitLab CI/CD (if using GitLab)
- **Advantages**:
  - Similar to GitHub Actions but for GitLab.
  - Offers free tiers.
- **Disadvantages**:
  - Requires GitLab.
- **Evidence**:
  - GitLab is available but we may not have a preference.

#### Option C: Custom CI/CD Scripts (e.g., using shell scripts and cron)
- **Advantages**:
  - Full control over the process.
- **Disadvantages**:
  - More manual effort to set up and maintain.
  - Prone to errors.
- **Evidence**:
  - Not recommended unless necessary.

#### Option D: No CI/CD (manual build and test)
- **Advantages**:
  - Simplest in terms of setup.
- **Disadvantages**:
  - Does not automate testing and deployment.
  - Increases the risk of human error.
  - Not aligned with good engineering practices.
- **Evidence**:
  - Not recommended.

### Decision:
We select **Option A: GitHub Actions** for the following reasons:
- It provides a robust, integrated platform for automating tests, builds, and deployments.
- It aligns with the engineering constitution principle 9 (testing is part of implementation) by making it easy to run tests on every push.
- It allows us to automate the building of Docker images and deployment to a target environment (e.g., a VPS or cloud VM).
- It is free for many use cases and has good documentation.
- The environment does not specify the repository host, but we can choose GitHub as it is a common and suitable platform.
- It supports the evidence-first principle by keeping the automation focused on the core problem (testing and deployment) without introducing unnecessary complexity.

### Risks:
- If we choose a different repository host (e.g., GitLab), we might need to adapt. However, the principles are similar.
- The risk is low and can be mitigated by documenting the CI/CD process.

### Deferred Consequences:
- The exact workflow (e.g., what triggers a build, how to deploy to production) will be worked out in later design stages.
- The decision to use specific deployment targets (e.g., AWS ECS, Azure App Service, or a simple VPS via SSH) can be made later.
- The inclusion of additional steps (e.g., security scanning, performance testing) can be deferred.

## 17. Observability/Error-reporting Strategy
We now evaluate how to monitor the application and handle errors.

### Evaluation Criteria:
- Must support logging of important events (errors, warnings, info).
- Should allow for tracking of application usage and performance (if needed).
- Should be simple to set up and maintain.
- Should align with the evidence-first principle.
- Should be technology-neutral where possible.

### Candidate Options:

#### Option A: Structured Logging (e.g., using Winston or pino) with Log Retention
- **Advantages**:
  - Provides structured, searchable logs.
  - Can be configured to log to files, stdout, or external services.
  - Good for debugging and monitoring.
- **Disadvantages**:
  - Requires setting up and configuring a logging library.
  - However, this is straightforward.
- **Evidence**:
  - Node.js has mature logging libraries.

#### Option B: Simple Console Logging (console.log, console.error)
- **Advantages**:
  - Simplest possible.
  - Good for development.
- **Disadvantages**:
  - Not suitable for production (logs may be lost, not structured).
  - Lacks log levels and formatting.
- **Evidence**:
  - Not recommended for production.

#### Option C: External Monitoring Service (e.g., Datadog, New Relic, Sentry)
- **Advantages**:
  - Provides advanced monitoring, error tracking, and performance insights.
  - Can alert on issues.
- **Disadvantages**:
  - Introduces external dependencies and potential costs.
  - May be overkill for this application.
  - Risks violating the evidence-first principle if not justified.
- **Evidence**:
  - Not required at this stage.

#### Option D: Basic File-based Logging (e.g., writing to a log file)
- **Advantages**:
  - Simple to implement.
  - Logs are persisted.
- **Disadvantages**:
  - Lacks structure, log rotation, and advanced features.
  - Can grow indefinitely if not managed.
- **Evidence**:
  - Can be done with Node.js file system.

### Decision:
We select **Option A: Structured Logging (e.g., using Winston or pino) with Log Retention** for the following reasons:
- It provides a good balance of simplicity and functionality for a production application.
- It allows us to log errors, warnings, and information in a structured format, making it easier to debug and monitor.
- It aligns with the engineering constitution principle 9 by facilitating testing and verification through logs.
- It is simple to set up with Node.js libraries.
- It keeps the focus on the core problem without introducing unnecessary complexity (evidence-first principle).
- We can implement log rotation and retention policies to prevent excessive disk usage.

### Risks:
- If logging is not configured correctly, it might fill up disk space or miss important logs. However, this is manageable.
- The risk is low and can be mitigated by using well-established logging practices.

### Deferred Consequences:
- The exact logging library (Winston, pino, etc.) and configuration (log levels, transports, retention) can be decided later.
- The decision to integrate with external log management services (e.g., ELK stack, cloud logging) can be made later if needed.
- The inclusion of additional observability metrics (e.g., request latency, error rates) can be deferred.

## 18. Technology Decision Matrix
We now summarize the key technology decisions in a matrix format for clarity.

| Technology Area | Decision | Justification |
|-----------------|----------|---------------|
| Application Technology | Full-stack web application using Node.js with Express | Single language, modular monolith, environment has Node.js, aligns with simplicity and evidence-first principles. |
| Frontend Technology | Server-rendered HTML using a templing engine (e.g., EJS) | Simplest way to achieve responsiveness and accessibility, supports content/presentation separation. |
| Backend Technology | Express.js | Minimal, flexible, well-suited for modular monolith, environment has Node.js. |
| Persistence Technology | SQLite (relational database) | Natural fit for relational domain model, file-based simplicity, supports transactions. |
| Authentication/Authorization | Session-based Authentication (express-session with cookies) | Simple, sufficient for single-user portfolio, aligns with simplicity principle. |
| Content Management | Custom-built Content Management Module (within Node.js/Express) | Keeps application as a single deployable unit, tailored to domain model. |
| Evidence/Artifact Strategy | Store evidence metadata in database (Evidence table) with foreign keys to claims and artifact references | Directly supports domain model, enables traceability, keeps artifacts external. |
| Testing Technology | Jest (unit/integration) and Playwright (end-to-end) | Robust testing framework, excellent for accessibility and responsiveness testing. |
| Build/Package/Dependency Management | npm with package.json | Standard for Node.js, environment has npm, allows justified dependencies. |
| Deployment/Hosting Strategy | Containerization (Docker) with Docker Compose | Ensures consistency, aligns with modular monolith, environment has Docker. |
| CI/CD Approach | GitHub Actions | Integrated automation for testing, building, and deployment, supports testing principle. |
| Observability/Error-reporting | Structured Logging (Winston/pino) with Log Retention | Good balance of functionality and simplicity for monitoring and debugging. |

## 19. Selected Technology Strategy
Based on the evaluations above, the selected technology strategy for implementing the frozen requirements, domain model, and architecture is:

- **Application**: A full-stack web application using Node.js as the runtime.
- **Backend Framework**: Express.js for handling HTTP requests, routing, and middleware.
- **Frontend Approach**: Server-rendered HTML using a templating engine (e.g., EJS) for both public presentation and private management interfaces.
- **Persistence Layer**: SQLite as a file-based relational database for storing all application data (content, evidence, users, etc.).
- **Authentication/Authorization**: Session-based authentication using cookies (via express-session) to secure the private management system.
- **Content Management**: A custom-built module within the application that provides CRUD operations for domain entities (Professional Identity, Project, Skill, Claim, Evidence, etc.).
- **Evidence/Artifact Representation**: Evidence metadata stored in a database table with links to artifacts (URLs or identifiers), preserving the Claim → Evidence → Artifact relationship.
- **Testing**: Jest for unit and integration testing, Playwright for end-to-end testing (including accessibility and responsiveness checks).
- **Build/Package Management**: npm with a package.json file to manage dependencies and scripts.
- **Deployment**: Containerized using Docker, orchestrated with Docker Compose for consistent and reproducible deployment.
- **CI/CD**: GitHub Actions to automate testing, building, and deployment on code changes.
- **Observability**: Structured logging (using a library like Winston or pino) with log retention for monitoring and debugging.

This strategy adheres to:
- The engineering constitution principles, especially simplicity (principle 17) and evidence-first (C-002).
- The frozen architecture (modular monolith with conceptual separation).
- The domain model (preserving Claim → Evidence → Artifact semantics and separating Accessibility, Verification Method, Verification Result, and Publication State).
- The requirements (fulfilling all P0 and P1 requirements as per the traceability in the architecture document).
- The environment evidence (Node.js, npm, Docker, Git are available).

## 20. Deferred Technology Decisions
The following technology decisions are intentionally deferred to later design stages, as they are not justified by current evidence or are not required for the initial implementation:

- **Exact Frontend Templating Engine**: The choice between EJS, Pug, Handlebars, etc. can be made later based on team preference and specific needs.
- **Use of TypeScript vs. Plain JavaScript**: The decision to adopt TypeScript for better maintainability can be deferred; we can start with JavaScript and migrate if needed.
- **Exact Database Schema Design**: The detailed structure of tables, columns, constraints, and indexes will be worked out in later design stages.
- **Session Storage Mechanism**: Whether to use in-memory, database-backed, or another store for sessions can be decided later.
- **Logging Library and Configuration**: The exact choice of logging library (Winston, pino, etc.) and its configuration (log levels, transports, retention) can be deferred.
- **Docker Base Image and Optimization**: The specifics of the Dockerfile (e.g., base image, multi-stage builds) can be refined later.
- **CI/CD Workflow Details**: The exact steps, triggers, and deployment targets in the GitHub Actions workflow will be defined later.
- **Additional Observability Metrics**: The inclusion of advanced monitoring (e.g., request latency, error rates) can be deferred.
- **Security Enhancements**: Additional security measures (e.g., CSRF protection, rate limiting, dependency scanning) can be added later.
- **Performance Optimizations**: Performance improvements beyond basic best practices (e.g., caching, CDN) can be deferred.
- **Third-party Integrations**: Integrations with external services (e.g., for analytics, validation) can be deferred unless justified by future evidence.

## 21. Risks
The following risks are associated with the selected technology strategy:

- **Risk T1: Over-reliance on a Single Language (JavaScript/TypeScript)**  
  - *Description*: Using JavaScript/TypeScript for both frontend and backend might limit exposure to other paradigms.  
  - *Mitigation*: This risk is low given the scope of the project; the benefits of simplicity outweigh the concerns.  
  - *Evidence*: The environment has Node.js, making this a natural choice.

- **Risk T2: SQLite Scaling Limitations**  
  - *Description*: If the portfolio grows beyond a personal scale (e.g., multiple users, high traffic), SQLite might not perform well.  
  - *Mitigation*: The requirements do not indicate such a scale; we can migrate to a client-server database (e.g., PostgreSQL) if needed later.  
  - *Evidence*: The architecture does not tie us to a specific persistence technology.

- **Risk T3: Docker Complexity for Simple Use Case**  
  - *Description*: Using Docker might introduce unnecessary complexity for a simple application.  
  - *Mitigation*: Docker ensures consistency and simplifies deployment, which outweighs the initial learning curve.  
  - *Evidence*: Docker is available in the environment and aligns with the modular monolith as a single deployable unit.

- **Risk T4: Client-side Interactivity Limitations**  
  - *Description*: A server-rendered approach might not provide the rich interactivity expected in a modern portfolio.  
  - *Mitigation*: We can enhance specific pages with client-side JavaScript as needed without changing the core decision.  
  - *Evidence*: The requirements do not demand high interactivity; responsiveness and accessibility are the key concerns.

- **Risk T5: Authentication Security Misconfiguration**  
  - *Description*: If session-based authentication is not configured correctly (e.g., missing HTTPS, insecure cookies), it could lead to vulnerabilities.  
  - *Mitigation*: We will follow best practices for session security (secure cookies, HTTPS, etc.).  
  - *Evidence*: This is a standard risk that can be mitigated with proper configuration.

## 22. Requirements Traceability
We now map the selected technology strategy to the requirements to ensure coverage.

| Requirement ID | Requirement Description | How the Technology Strategy Addresses It |
|----------------|-------------------------|------------------------------------------|
| FR-001 | Professional Profile Presentation | The custom content management module allows creating and editing the professional profile; the server-rendered frontend displays it via templates. |
| FR-002 | Project Evidence Presentation | The content management module handles projects and evidence; the persistence layer stores evidence metadata; the frontend displays projects and evidence with accessibility status. |
| FR-003 | Claim-to-Evidence Traceability | The evidence table links claims to evidence; the frontend can display bidirectional links; the content management module allows creating and editing these links. |
| FR-004 | Skills Representation with Evidence Traceability | Similar to FR-003; skills are content items that can link to evidence. |
| FR-005 | Content Management System | The custom content management module provides a private interface for creating, editing, associating evidence, and publishing without code changes. |
| FR-006 | Evidence Accessibility Status Representation | The evidence table includes an accessibility status field; the frontend displays this status; the content management module allows setting it. |
| FR-007 | CV/Resume Generation | Not directly addressed by the core strategy; can be implemented as a feature in the content management module later (P1 requirement). |
| FR-008 | Responsive Design | The server-rendered frontend uses standard HTML/CSS, which can be made responsive; the testing strategy includes Playwright for responsiveness testing. |
| FR-009 | Accessibility Compliance | The server-rendered frontend uses standard HTML, which can be made accessible; the testing strategy includes Playwright for accessibility testing. |
| FR-010 | Performance Optimization | The strategy includes basic best practices (efficient asset loading, etc.); performance optimization can be enhanced later (P1 requirement). |
| NFR-001 | Security - Data Protection | Session-based authentication with express-session secures the private management environment; the strategy includes secure practices for cookies and environment. |
| NFR-002 | Maintainability - Content Updates | The content is stored separately in the database (SQLite), allowing updates via the content management module without code changes. |
| C-001 | Technology Selection Constraint | Each technology choice is justified by fitness-for-purpose, not popularity (see justifications above). |
| C-002 | Evidence-First Constraint | Every technology choice is evaluated based on its ability to support evidence presentation and verification (see justifications above). |

All P0 and P1 requirements are covered by the technology strategy, either directly or through deferred features that can be added later without changing the core strategy.

## 23. Domain Consistency Check
The selected technology strategy does not alter the frozen domain model. It preserves:
- Claim → Evidence → Artifact semantics.
- Evidence as a first-class concept with metadata (description, accessibility status, verification method).
- Accessibility, Verification Method, Verification Result, and Publication State as distinct concepts.
- The removed/reclassified concepts (Experience, Engineering Decision, Engineering Record, AI-Assisted Engineering Activity, Media, Credential) are not reintroduced as domain entities; Media and Credential are correctly treated as Artifact types.

## 24. Architecture Consistency Check
The selected technology strategy implements the frozen modular monolith architecture:
- It is a single deployable application (containerized with Docker).
- It conceptually separates Content Management, Public Presentation, Security, and Evidence Store (via modules and middleware).
- It maintains the public/private boundary via authentication and authorization.
- It supports content/presentation separation (content in SQLite, presentation in server-rendered templates).
- It does not introduce any premature implementation choices that contradict the architecture.

## 25. Stage 4.1 Acceptance Criteria
The stage is complete if:
- The technology strategy document has been created and verified.
- All technology decisions are justified by evidence from the environment, requirements, domain model, or architecture.
- No premature implementation choices have been made.
- The strategy is consistent with the frozen requirements, domain model, and architecture.
- The strategy adheres to the engineering constitution principles.
- The required sections have been completed.

## 26. Stage 4.1 Status
**Status: COMPLETE**

The technology and implementation strategy has been determined and documented. No implementation code, database schemas, or application scaffolding has been created. The strategy is ready to inform the next stages (detailed design and implementation).

**Status: COMPLETE**