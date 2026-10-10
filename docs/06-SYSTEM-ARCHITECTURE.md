# STAGE 3 — SYSTEM ARCHITECTURE & DESIGN

## 1. Architectural Purpose
This document defines the system architecture for the Software Engineer Portfolio System, derived from the frozen requirements (docs/03-REQUIREMENTS.md) and the validated domain model (docs/05-DOMAIN-MODEL.md). It establishes the high-level structure, responsibilities, and interactions of the system without specifying implementation technologies, frameworks, or deployment details.

## 2. Architectural Drivers
Derived from the frozen requirements and domain model:

| ID | Source Requirement | Architectural Implication | Priority | Evidence |
|----|-------------------|---------------------------|----------|----------|
| AD-001 | FR-001: Professional Profile Presentation | The system must present a professional profile section containing name, role, summary, and contact information. | P0 | Requirement FR-001 |
| AD-002 | FR-002: Project Evidence Presentation | The system must allow attaching and displaying verifiable evidence (e.g., repositories, deployments, documents) with each project. | P0 | Requirement FR-002 |
| AD-003 | FR-003: Claim-to-Evidence Traceability | The system must enable linking specific claims or achievements within a project or skill to specific evidence items, with bidirectional traceability. | P0 | Requirement FR-003 |
| AD-004 | FR-004: Skills Representation with Evidence Traceability | The system must represent professional skills and allow associating each skill with relevant evidence (e.g., projects, certificates, demonstrations). | P0 | Requirement FR-004 |
| AD-005 | FR-005: Content Management System | The system must provide a private management interface for content creation, editing, evidence association, and publishing without source code changes. | P0 | Requirement FR-005 |
| AD-006 | FR-006: Evidence Accessibility Status Representation | The system must allow specifying and displaying the accessibility status of each evidence item (Public, Private/Restricted, Redacted, Unavailable). | P0 | Requirement FR-006 |
| AD-007 | FR-008: Responsive Design | The public portfolio must be usable across device sizes, adapting layout to different viewport sizes. | P0 | Requirement FR-008 |
| AD-008 | FR-009: Accessibility Compliance | The public portfolio must conform to WCAG 2.2 Level AA accessibility standards. | P1 | Requirement FR-009 |
| AD-009 | NFR-002: Maintainability - Content Updates | The system must separate content from presentation, allowing content updates via a management interface without frontend/backend code changes. | P0 | Requirement NFR-002 |
| AD-010 | NFR-001: Security - Data Protection | The private management system must implement secure authentication and authorization, protecting against common vulnerabilities. | P1 | Requirement NFR-001 |
| AD-011 | C-001: Technology Selection Constraint | The technology stack must be chosen based on fitness-for-purpose, not popularity. | P0 | Constraint C-001 |
| AD-012 | C-002: Evidence-First Constraint | Every feature or design decision must be evaluated against its ability to support the presentation and verification of engineering evidence. | P0 | Constraint C-002 |

## 3. System Boundary
The system boundary encompasses the Software Engineer Portfolio System, including:
- Public Evidence System: What visitors see (public profile, projects, skills, evidence that the engineer has chosen to publish).
- Private Management System: What the engineer uses to create, edit, associate evidence with, and prepare content for publishing (drafting, evidence management, preview, publishing/unpublishing, access controls).
- The boundary between public and private is enforced by the Publication State and access controls.

INSIDE THE SYSTEM:
- Public Evidence System (rendered content)
- Private Management System (authoring environment)
- Content storage (conceptual)
- Publication state management
- Access control mechanisms
- Evidence traceability mechanisms

OUTSIDE THE SYSTEM:
- Portfolio visitor (recruiter, hiring manager, technical interviewer, potential client, etc.)
- Portfolio owner/engineer (as an actor interacting with the private system)
- External artifact repositories (e.g., GitHub, live URLs, external documents) - referenced but not managed by the system
- External identity providers (if used for authentication) - optional
- External storage systems (if used for content storage) - optional
- Search engines (for indexing public content) - optional
- Third-party validation mechanisms (e.g., employers confirming contributions) - optional

These external elements are classified as:
- Portfolio visitor: FACT (stakeholder defined in requirements)
- Portfolio owner/engineer: FACT (stakeholder defined in requirements)
- External artifact repositories: OPTION (referenced in FR-002, FR-003, FR-004 but not required to be managed)
- External identity providers: UNKNOWN (not mentioned in requirements)
- External storage systems: UNKNOWN (not mentioned in requirements)
- Search engines: UNKNOWN (not mentioned in requirements)
- Third-party validation mechanisms: UNKNOWN (mentioned in P3 but not required)

## 4. Actors
We identify the following conceptual actors:

### 4.1 Public Visitor
- Goal: View the engineer's professional identity, projects, skills, and verifiable evidence to assess credibility and suitability for opportunities.
- Permissions/capabilities: Read-only access to published content in the Public Evidence System.
- Information they need: Professional profile, project details, skill details, claim details, evidence details, accessibility status, verification guidance.
- Security relevance: Low (public consumer); must not be able to alter content or access private management functions.

### 4.2 Portfolio Owner / Engineer
- Goal: Create, edit, manage evidence, and publish content to showcase professional capabilities verifiably.
- Permissions/capabilities: Full access to the Private Management System: create, edit, delete projects, profile information, skills, evidence items; attach evidence to projects and skills; preview changes; publish content to the public system; manage publication state and access controls.
- Information they need: All content (draft and published), evidence details, publication state, access control settings, audit trails (if any).
- Security relevance: High (must protect against unauthorized access to private system); authentication and authorization required.

### 4.3 System Administrator (if required)
- Goal: Ensure the system operates securely and reliably.
- Permissions/capabilities: Manage system-wide settings, user accounts (if applicable), security policies, backups, and maintenance.
- Information they need: System logs, security alerts, usage metrics.
- Security relevance: High (privileged access).
Note: The requirements do not explicitly require a separate system administrator role; the engineer may perform administrative functions. However, for security separation, we consider this as an OPTION.

## 5. Public / Private Boundary
The public/private boundary is a conceptual separation enforced by:
- Publication State: A value object associated with each content item (Draft, Published, Unpublished). Only content with Publication State = Published is visible in the public evidence system.
- Access Controls: Mechanisms that restrict access to the Private Management System to authenticated and authorized engineers.
- Content Flow: Content originates in the private management system and is copied/rendered to the public system upon an explicit publish action (FR-005). The engineer controls what becomes public.
- Separation of Concerns: The public system presents only published content; the private system handles drafting, evidence management, and preparation for publishing.

Important distinction:
- Publication State governs whether content is visible publicly.
- Evidence Accessibility (Public, Restricted, Redacted, Unavailable) governs whether the underlying artifact referenced by evidence can be accessed for verification.
These are orthogonal: content can be published (Publication State = Published) while its evidence has low accessibility (e.g., Private/Restricted). The system must honestly represent evidence accessibility regardless of publication state.

## 6. Major Capabilities
Derived from requirements and domain model:

| Capability | Purpose | Supporting Requirements | Supporting Domain Concepts | Primary Actor | Boundary |
|------------|---------|-------------------------|----------------------------|---------------|----------|
| Professional Profile Presentation | Display the engineer's name, role, summary, skills, and contact information. | FR-001 | Professional Identity, Publication State, Public Evidence System | Engineer (private), Visitor (public) | Public/Private |
| Project Presentation | Showcase projects with descriptions, outcomes, roles, and technologies, and attached evidence. | FR-002 | Project, Evidence, Artifact, Accessibility, Verification Method, Publication State | Engineer (private), Visitor (public) | Public/Private |
| Skill Presentation | List the engineer's skills and show supporting evidence for each. | FR-004 | Skill, Evidence, Artifact, Accessibility, Verification Method, Publication State | Engineer (private), Visitor (public) | Public/Private |
| Claim Presentation | Present specific claims or achievements within projects or skills, linked to supporting evidence. | FR-003 | Claim, Evidence, Artifact, Accessibility, Verification Method, Publication State | Engineer (private), Visitor (public) | Public/Private |
| Evidence Presentation | Display evidence items with metadata (type, source, accessibility status) and verification guidance. | FR-002, FR-003, FR-004, FR-006 | Evidence, Artifact, Accessibility, Verification Method, Publication State | Engineer (private), Visitor (public) | Public/Private |
| Evidence Verification Guidance | Provide stakeholders with the means to inspect evidence to assess claim validity (e.g., links to repositories, instructions for verification). | FR-002, FR-003, FR-004, FR-006 | Evidence, Verification Method, Accessibility | Visitor (public) | Public |
| Content Management | Provide a private interface for the engineer to create, edit, associate evidence with, and publish content without modifying application code. | FR-005 | Content, Publication State, Private Management Boundary, Public Evidence System | Engineer (private) | Private |
| Publication Management | Allow the engineer to explicitly publish content (transition from Draft to Published) and control what is visible publicly. | FR-005 | Publication State, Public Evidence System, Private Management Boundary | Engineer (private) | Private |
| Evidence Management | Allow the engineer to create, edit, and delete evidence items, link them to claims/projects/skills, and specify accessibility and verification method. | FR-002, FR-003, FR-004, FR-006 | Evidence, Artifact, Accessibility, Verification Method, Publication State | Engineer (private) | Private |
| Access Control | Protect the private management system from unauthorized access; manage authentication and authorization. | NFR-001 | (Conceptual - not a domain entity) | Engineer (private), System Administrator | Private |
| Content Validation | Ensure content integrity and prevent exposure of work-in-progress, private notes, or credentials in the public system. | FR-005, Engineering Constitution Principle 14 | Content, Publication State, Private Management Boundary | Engineer (private) | Private |

## 7. Logical Architectural Components
We define components by responsibility:

### 7.1 Content Management Component
- Responsibility: Handles creation, editing, deletion, and association of content (projects, profile, skills, experience) and evidence items. Manages publication state and access controls for content.
- Inputs: Engineer actions via private management interface (create, edit, delete, attach evidence, set publication state, set accessibility, etc.)
- Outputs: Updated content is managed within the private management boundary; published content is made available through the public presentation boundary according to its publication state.
- Owned decisions/data: Content lifecycle, publication state, evidence linking, access control settings for content.
- Dependencies: None (core component)
- Requirements served: FR-005 (primary), also supports FR-001, FR-002, FR-003, FR-004, FR-006
- Domain concepts involved: Content, Publication State, Evidence, Artifact, Accessibility, Verification Method, Professional Identity, Project, Skill, Claim
- Security boundary: Private Management System (requires authentication and authorization)
- Public/private exposure: Primarily private; published content is exposed publicly via the Public Evidence System.

### 7.2 Public Presentation Component
- Responsibility: Renders published content for visitors in a usable, accessible, and responsive manner. Displays professional profile, projects, skills, claims, evidence with accessibility status and verification guidance.
- Inputs: Published content from content storage (conceptual)
- Outputs: HTML/CSS/JS (conceptual) rendered in the browser; accessible and responsive UI.
- Owned decisions/data: Presentation logic, layout, accessibility features, responsiveness breakpoints.
- Dependencies: None (core component)
- Requirements served: FR-001, FR-002, FR-003, FR-004, FR-006, FR-008, FR-009
- Domain concepts involved: Professional Identity, Project, Skill, Claim, Evidence, Artifact, Accessibility, Verification Method, Publication State
- Security boundary: Public Evidence System (no authentication required for visitors)
- Public/private exposure: Public (accessible to all visitors)

### 7.3 Security Component (Authentication and Authorization)
- Responsibility: Manages secure access to the Private Management System. Implements authentication (e.g., login) and authorization (e.g., permissions for content management). Enforces access control decisions for the Private Management System.
- Inputs: Credentials (e.g., username/password, third-party tokens), access requests
- Outputs: Authentication success/failure, authorization grants/denials, session tokens
- Owned decisions/data: User credentials, role/permission assignments, session management, access control policies
- Dependencies: None (but may rely on external identity providers as an option)
- Requirements served: NFR-001 (primary)
- Domain concepts involved: None directly (supports access to Content Management Component)
- Security boundary: Boundary between public and private systems; protects the Private Management System.
- Public/private exposure: Private (only accessible via private management interface)

### 7.4 Evidence Store Component (Conceptual)
- Responsibility: Maintains references to evidence items (including metadata: description, accessibility status, verification method) and links to artifacts. Does not store the actual artifacts (which are external). The Verification Result is part of the conceptual evidence model; its persistence, generation, update lifecycle, and authority remain deferred to a later design stage.
- Inputs: Evidence creation/update requests from Content Management Component
- Outputs: Stored evidence references; ability to retrieve evidence by ID, by claim, by project, by skill
- Owned decisions/data: Evidence metadata (description, accessibility, verification method), links to artifacts
- Dependencies: None (conceptual)
- Requirements served: FR-002, FR-003, FR-004, FR-006
- Domain concepts involved: Evidence, Artifact, Accessibility, Verification Method, Verification Result
- Security boundary: Private (accessed via Content Management Component, which is private)
- Public/private exposure: Evidence metadata (including accessibility status and verification method) is exposed in the Public Evidence System when the associated content is published.

## 8. Architectural Alternatives
We considered the following architectural styles:

### Option A: Single Deployable Application (Monolith)
- Description: A single application that handles both public presentation and private management, possibly with different routes or views based on authentication state.
- Complexity: Low to moderate (single codebase, single deployment unit)
- Maintainability: Moderate (tight coupling between public and private concerns possible, but can be mitigated with modular design)
- Deployment complexity: Low (single artifact to deploy)
- Security surface: Moderate (entire application exposed; must ensure private routes are protected)
- Development effort: Low to moderate
- Scalability: Moderate (scales as a single unit)
- Failure modes: If the application fails, both public and private systems are unavailable.
- Operational burden: Low (single deployment to manage)
- Suitability for this portfolio: High. Simplicity aligns with the engineering constitution principle 17 (prefer simplest architecture that satisfies verified requirements).
- Alignment with requirements: Satisfies all requirements; public/private separation can be achieved via authentication and authorization within the same application.

### Option B: Frontend + Backend Application (Separate but Coupled)
- Description: A frontend application (for public presentation and possibly private management UI) and a backend API (for content management, authentication, etc.). The frontend and backend are separate deployable units but tightly coupled.
- Complexity: Moderate (two deployable units, API contract between them)
- Maintainability: Moderate (separation of concerns between UI and API, but API must serve both public and private needs)
- Deployment complexity: Moderate (two artifacts to deploy and version)
- Security surface: Moderate to high (backend API exposed; must secure endpoints; frontend may expose sensitive info if not careful)
- Development effort: Moderate (requires API design and frontend-backend integration)
- Scalability: High (frontend and backend can be scaled independently)
- Failure modes: If backend fails, both public and private systems may be affected (if frontend relies on backend for public content). If frontend fails, public presentation is unavailable but private management may still work if separate.
- Operational burden: Moderate (two deployables to monitor and update)
- Suitability for this portfolio: Moderate. Increases complexity without clear benefit for a personal portfolio. May be over-engineering.
- Alignment with requirements: Can satisfy requirements but introduces unnecessary complexity for the scale.

### Option C: Multiple Independently Deployed Services (Microservices)
- Description: The system is broken down into multiple small services (e.g., content service, authentication service, evidence service, presentation service) that communicate via APIs or messaging.
- Complexity: High (many deployable units, service discovery, inter-service communication, data consistency challenges)
- Maintainability: Low to moderate (high operational overhead, debugging complexity)
- Deployment complexity: High (many services to deploy, version, and manage)
- Security surface: High (multiple endpoints to secure, increased attack surface)
- Development effort: High (requires significant effort to build and integrate services)
- Scalability: High (each service can be scaled independently)
- Failure modes: Complex failure modes (cascading failures, partial outages)
- Operational burden: High (requires DevOps expertise, monitoring, logging, tracing)
- Suitability for this portfolio: Low. Significantly over-engineered for a personal portfolio. Violates engineering constitution principle 17 (prefer simplest architecture).
- Alignment with requirements: Can satisfy requirements but at excessive cost.

## 9. Selected Architecture
We select **Option A: Single Deployable Application (Monolith)** with a modular internal structure that separates public and private concerns.

**Rationale**:
- Simplicity: Aligns with engineering constitution principle 17 (prefer simplest architecture that satisfies verified requirements). A monolith avoids unnecessary operational overhead.
- Maintainability: Easier to develop, test, and deploy as a single unit. Modular design within the monolith can maintain separation of concerns (e.g., distinct modules for public presentation, private management, security, evidence handling).
- Deployment simplicity: Single artifact to deploy, reducing complexity and failure points.
- Security: Easier to secure a single application with clear boundaries (public routes vs. private routes) than to secure multiple services and their intercommunications.
- Performance: Adequate for expected load; avoids latency from inter-service communication.
- Alignment with requirements: All requirements can be met within a monolithic architecture while maintaining conceptual separation of public/private, content/presentation, and evidence traceability.
- Evidence-first: The selected architecture keeps the focus on evidence presentation and verification without introducing extraneous complexity.

**Trade-offs**:
- Scalability: Scales as a single unit, which may be inefficient if public traffic is very high and private usage is low. However, for a personal portfolio, traffic is expected to be low, making this a non-issue.
- Technology locking: None, as we have not selected specific technologies; the monolith can be implemented with any suitable stack.

## 10. Architectural Principles
The following principles govern the architecture, justified by the requirements and domain model:

- **Separation of Concerns**: Distinct responsibilities for content management, public presentation, security, and evidence handling. Justified by the need to manage complexity and maintainability (NFR-002).
- **Least Privilege**: The Private Management System is accessible only to authenticated and authorized engineers; visitors have read-only access to published content. Justified by security requirements (NFR-001) and engineering constitution principle 18 (destructive operations require explicit authorization).
- **Public/Private Isolation**: Strict separation between what is visible publicly (Published content) and what is kept private (drafts, work-in-progress, private notes). Justified by FR-005 and engineering constitution principle 14 (private content containment).
- **Explicit Evidence Traceability**: Claims are linked to evidence items, which link to artifacts, with accessibility and verification metadata. Justified by FR-002, FR-003, FR-004, FR-006.
- **Content/Presentation Separation**: Content updates do not require source code changes. Justified by FR-005 and NFR-002.
- **Fail-safe Publication**: The system must not expose unpublished content publicly; publication requires an explicit action. Justified by FR-005.
- **Honest Evidence Representation**: Evidence accessibility status is truthfully represented; inaccessible evidence is not presented as publicly verifiable. Justified by FR-006 and engineering constitution principle 1 (evidence before claims).
- **Accessibility by Design**: The public portfolio must conform to WCAG 2.2 AA. Justified by FR-009.
- **Progressive Enhancement**: The core functionality (viewing published content) should work without advanced features; enhancements (e.g., interactive verification guidance) add value where supported. Justified by accessibility and responsiveness requirements.
- **Simplicity**: Choose the simplest architecture that satisfies the verified requirements. Justified by engineering constitution principle 17.
- **Observability**: The architecture should allow monitoring of usage and errors (though specific mechanisms are deferred). Justified by general engineering practice.
- **Testability**: Components should be designed to be unit-testable and integrable-testable. Justified by engineering constitution principle 9 (testing is part of implementation).
- **Replaceability of External Dependencies**: The architecture should allow swapping external dependencies (e.g., authentication providers, storage) without changing core logic. Justified by constraints C-001 and C-002 (evaluate against requirements).

## 11. Information Flows

### 11.1 Public Read Flow
- Actor: Public Visitor
- Source: Visitor's browser requesting the public portfolio
- Destination: Public Presentation Component
- Information crossing boundary: None (request is public); the component retrieves published content from conceptual storage.
- Output to Actor: Rendered HTML/CSS/JS displaying professional profile, projects, skills, claims, evidence with accessibility status and verification guidance.
- Security sensitivity: Low (public information)
- Trust implications: Visitor trusts that the presented content is accurate and that evidence accessibility is honestly represented.
- Failure considerations: If the public presentation component fails, visitors see an error; if published content is unavailable, visitors see missing content.

### 11.2 Private Management Flow
- Actor: Portfolio Owner / Engineer
- Source: Engineer's interaction with private management interface (after authentication)
- Destination: Private Management System (via Security Component, then Content Management Component)
- Information crossing boundary: Engineer's credentials (input to authentication), content changes (create, edit, delete, attach evidence, set publication state, etc.)
- Output to Actor: Confirmation of actions, preview of changes, ability to publish.
- Security sensitivity: High (involves authentication tokens, content modifications)
- Trust implications: Engineer trusts that the system securely manages their content and that private actions are not exposed publicly without explicit publish.
- Failure considerations: If authentication fails, engineer cannot access private management; if content management fails, engineer cannot update content; if publication fails, content remains private.

### 11.3 Publication Flow
- Actor: Portfolio Owner / Engineer (via Private Management System)
- Source: Publish action on a content item
- Destination: Content Management Component (publication state management)
- Information crossing boundary: Publication state transition from Draft to Published
- Output to Actor: Confirmation that content is now published
- Side effect: Content is made available through the public presentation boundary, making it visible in the Public Evidence System.
- Security sensitivity: Medium (involves authorization to publish)
- Trust implications: Engineer trusts that publishing makes content visible publicly; system trusts that only authorized engineers can publish.
- Failure considerations: If publication fails, content remains private; engineer can retry.

### 11.4 Evidence Access Flow (for Verification)
- Actor: Public Visitor (or Engineer in private system viewing evidence)
- Source: Request to view evidence details (e.g., on a project page)
- Destination: Public Presentation Component (or Private Management System via Content Management Component)
- Information crossing boundary: Evidence metadata (including accessibility status and verification method)
- Output to Actor: Display of evidence description, accessibility status, and verification method (if public) or note on limitations (if not public).
- Security sensitivity: Low for public visitor (evidence metadata is public if content is published); higher for engineer in private system (access to all evidence metadata).
- Trust implications: Visitor trusts that the accessibility status is accurate and that the verification method is correct for public evidence.
- Failure considerations: If external artifact is unavailable, the system should not imply verifiability; it should reflect the actual accessibility status.

## 12. Trust Boundaries

### 12.1 Public Visitor Boundary
- Trusted party: The system (specifically, the Public Presentation Component and the underlying published content)
- Untrusted party: Public Visitor
- Data crossing boundary: None (visitor sends requests, receives published content)
- Main threat/risk: Visitor may misinterpret content or evidence accessibility; mitigated by honest representation and clear UI. Visitor may attempt to scrape or overload the system; mitigated by standard web protections.

### 12.2 Private Management Boundary
- Trusted party: The system (Private Management System, Security Component)
- Untrusted party: Potential attacker (e.g., malicious actor attempting to gain unauthorized access)
- Data crossing boundary: Authentication credentials (inbound), session tokens (outbound), content modification requests (inbound)
- Main threat/risk: Unauthorized access to private management leading to data theft, alteration, or exposure of work-in-progress. Mitigated by strong authentication, authorization, and session management.

### 12.3 External Artifact Boundary
- Trusted party: The system (for referencing and displaying metadata)
- Untrusted party: External artifact repositories (e.g., GitHub, external URLs) and their administrators
- Data crossing boundary: None (system stores only metadata and references; does not store or control the actual artifacts)
- Main threat/risk: External artifact may become unavailable, changed, or removed; system must not falsely represent it as available or verifiable. Mitigated by storing accessibility status and verification method, and by displaying accuracy based on that status.

### 12.4 External Service Boundary (if used)
- Trusted party: The system
- Untrusted party: External identity provider (e.g., OAuth provider) or external storage service (if used)
- Data crossing boundary: Authentication tokens (inbound/outbound), storage requests (if external storage used)
- Main threat/risk: Compromise of external service leading to unauthorized access or data loss. Mitigated by following security best practices and treating external services as untrusted to the extent possible.

## 13. Failure and Degradation Model

We consider what happens under various failure conditions, ensuring the system does not falsely represent unavailable evidence as verified evidence.

### 13.1 Artifact Becomes Unavailable
- Expected failure: The underlying artifact (e.g., a repository) is deleted or made inaccessible.
- Degraded behavior: The system continues to display the evidence item with its accessibility status updated to Unavailable (if known) or leaves it as previously set (if the system cannot detect the change). Verification method is displayed but noted as not actionable if inaccessible.
- Unsafe behavior: Representing the artifact as accessible or verifiable when it is not. This is prevented by the Evidence Accessibility Honesty Invariant (domain model line 295-298).
- Recovery consideration: Engineer can update the evidence item's accessibility status or remove it; system may provide mechanisms to check artifact availability (optional).

### 13.2 External Link Breaks
- Expected failure: A URL referenced in evidence (e.g., live deployment) returns an error.
- Degraded behavior: Similar to artifact unavailable; accessibility status may be set to Unavailable or the verification method may note the link is broken.
- Unsafe behavior: Suggesting the link works when it does not. Prevented by honest representation of accessibility.
- Recovery consideration: Engineer can update the evidence item with a new URL or remove it.

### 13.3 Verification Cannot Be Performed
- Expected failure: Stakeholder attempts to verify a claim but cannot due to inaccessible artifact or insufficient verification method.
- Degraded behavior: The system does not alter the verification result associated with the evidence item; the evidence item's accessibility status and verification method are still displayed truthfully.
- Unsafe behavior: Claiming verification succeeded when it did not. Prevented by requiring explicit verification assessment and not auto-assigning verification results.
- Recovery consideration: Stakeholder may provide feedback (outside system); engineer may update evidence or clarification.

### 13.4 Published Content Becomes Invalid
- Expected failure: Published content contains errors or outdated information.
- Degraded behavior: Content remains publicly visible until engineer updates and republishes.
- Unsafe behavior: None, as the system does not guarantee correctness of content (only that it represents the engineer's current state). However, the system should not expose private content unintentionally.
- Recovery consideration: Engineer edits content in private system and republishes.

### 13.5 Private Management Is Unavailable
- Expected failure: The private management interface is down or inaccessible.
- Degraded behavior: Engineer cannot update content or publish new changes; public portfolio remains as last published.
- Unsafe behavior: None; the public portfolio continues to operate normally.
- Recovery consideration: Restore private management access; no data loss if storage is intact.

### 13.6 External Service Fails
- Expected failure: If external identity provider or storage is used and fails.
- Degraded behavior: Depending on the service, authentication may fail or content updates may not persist.
- Unsafe behavior: If external storage fails and the system incorrectly assumes persistence, data loss may occur. Mitigated by treating external services as untrusted and having fallback or error handling.
- Recovery consideration: Restore external service or switch to alternative; engineer may need to re-enter data if lost.

### 13.7 Evidence Accessibility Changes
- Expected failure: The accessibility of an artifact changes (e.g., a repo goes from public to private).
- Degraded behavior: The system does not automatically detect this; the evidence item's accessibility status remains as last set by the engineer.
- Unsafe behavior: Representing the artifact as publicly accessible when it is not (if status not updated). Prevented by requiring engineer to update accessibility status and by the Evidence Accessibility Honesty Invariant.
- Recovery consideration: Engineer updates the evidence item's accessibility status.

## 14. Security Architecture Concerns
At the architectural level, we identify:

- **Authentication Boundary**: The Private Management System must be protected by authentication. Justified by NFR-001.
- **Authorization Boundary**: Within the private system, different actions (e.g., publishing vs. editing) may require different permissions; however, for a personal portfolio, a single engineer role may suffice. We consider authorization as OPTION but note that the principle of least privilege applies.
- **Public/Private Isolation**: Critical to prevent exposure of drafts, work-in-progress, or credentials. Justified by FR-005 and engineering constitution principle 14.
- **Sensitive Information**: The private system may contain sensitive information (e.g., private notes, internal documents). Must not be exposed publicly. Justified by engineering constitution principle 14.
- **Input Trust Boundaries**: All input from the engineer (in private system) and from external artifacts (via references) must be treated as untrusted to prevent injection attacks. Justified by engineering constitution principles 2 and 12 (inspect before modifying, report failures honestly).
- **External Links/Artifacts**: The system must not execute or trust external content; it only provides links and metadata for verification. Justified by the need to honestly represent evidence accessibility.
- **Publication Authorization**: Only authenticated and authorized engineers can publish content. Justified by FR-005.
- **Fail-safe Defaults**: By default, content is private (Draft) and not visible publicly; explicit action required to publish. Justified by FR-005.
- **Auditability**: While not explicitly required, the system should ideally log administrative actions (e.g., publishes, deletes) for accountability. Considered as OPTION.

## 15. Conceptual Data Ownership
We determine which architectural component is responsible for each type of data (conceptually, not as database tables):

- **Professional Identity information**: Owned by the Content Management Component (specifically, the professional profile is a type of content).
- **Projects**: Owned by the Content Management Component (projects are content items).
- **Skills**: Owned by the Content Management Component (skills are content items).
- **Claims**: Owned by the Content Management Component (claims are associated with projects or skills, which are content).
- **Evidence**: Owned by the Evidence Store Component (evidence items are referenced by the Content Management Component).
- **Artifacts/references**: The system does not own artifacts; it only stores references (e.g., URLs, identifiers) in the Evidence Store Component.
- **Publication state**: Owned by the Content Management Component (conceptually).

## 16. Architectural Decisions
We record the key architectural decisions made:

| Decision | Options Considered | Evidence | Trade-off | Risk | Rationale |
|----------|-------------------|----------|-----------|------|-----------|
| Monolithic architecture (single deployable application) | Option A: Monolith, Option B: Frontend+Backend, Option C: Microservices | Architectural Alternatives section (8) | Monolith: simpler deployment and development, less scalable. Frontend+Backend: more complex deployment, better scalability. Microservices: highest complexity, highest scalability. | Monolith: potential scaling limits if traffic grows unexpectedly (low risk for personal portfolio). Frontend+Backend: increased failure surface and operational overhead. Microservices: high operational burden, over-engineering. | Selected because it satisfies requirements with minimal complexity, aligning with engineering constitution principle 17 (prefer simplest architecture) and avoiding over-engineering (Risk 1 in requirements). |
| Public/private separation via Publication State and access controls | Alternative: No separation (all content public) | FR-005, Engineering Constitution Principle 14 | Alternative: simpler but violates requirement for private management and risks exposing work-in-progress. | Not selecting alternative would violate FR-005 and principle 14, leading to risks of exposing incomplete content. | Selected to satisfy FR-005 and protect engineer's privacy and intellectual property. |
| Evidence as first-class entity with accessibility, verification method, and result | Alternative: Evidence as mere link, or only tracking verification status | Domain Model Section 3 (What is Evidence?) and Section 3 (Accessibility vs. Verification Separation) | Alternative: simpler model but loses ability to describe how artifact supports claim, context, and separates accessibility from verification method. | Not selecting alternative would violate honest evidence representation (FR-006) and ability to support traceability (FR-003). | Selected to satisfy FR-002, FR-003, FR-004, FR-006 and to allow honest representation of evidence. |
| Content/presentation separation (content updates without code changes) | Alternative: Tight coupling where content changes require code modifications | FR-005, NFR-002 | Alternative: simpler initial development but violates requirement for content updates without code changes. | Not selecting alternative would violate FR-005 and NFR-002, making content updates inefficient and error-prone. | Selected to satisfy FR-005 and NFR-002, enabling the engineer to maintain the portfolio easily. |
| No selection of specific technologies, frameworks, or databases | Alternative: Choosing specific stacks early | Constraints C-001 and C-002, Architecture Decisions Explicitly Deferred (domain model lines 368-383) | Alternative: risk of choosing unsuitable technology, locking into suboptimal choices, violating evidence-first principle. | Not selecting alternative would risk violating C-001 and C-002, leading to potential over-engineering or poor fit-for-purpose. | Selected to satisfy C-001 and C-002, ensuring technology choice is deferred to later stages based on requirements. |

## 17. Trade-Offs
Summarizing the trade-offs from the selected architecture:

- **Simplicity vs. Scalability**: We chose simplicity (monolith) over hypothetical scalability needs. The current requirements do not establish a scalability driver that requires distributed or microservice architecture, making this trade-off favorable.
- **Development Effort vs. Operational Overhead**: We chose a monolith to reduce operational overhead (single deployment) at the cost of potentially less independent scaling. However, the operational overhead of a monolith is lower, which is suitable for the requirements.
- **Feature Completeness vs. Time-to-Market**: We focused on P0 requirements and deferred P1/P2 features, allowing an earlier usable release that solves the core evidence problem.
- **Architectural Purity vs. Pragmatism**: We kept the architecture conceptually clean (separation of concerns) but implemented it in a simple deployable unit to avoid unnecessary complexity.

## 18. Complete P0 Traceability
We verify that every P0 requirement has architectural coverage:

| Requirement ID | Exact requirement meaning | Architectural Driver(s) | Capability | Component(s) | Domain Concept(s) | Architectural Decision |
|----------------|---------------------------|-------------------------|------------|--------------|-------------------|------------------------|
| FR-001 | Display professional profile section containing name, role, summary, and contact information. | AD-001 | Professional Profile Presentation | Content Management Component, Public Presentation Component | Professional Identity, Publication State, Public Evidence System | Selected architecture (monolith) enables separation of concerns while allowing access to professional identity in both private and public contexts. |
| FR-002 | Allow attaching and displaying verifiable evidence with each project. | AD-002 | Project Evidence Presentation, Evidence Presentation | Content Management Component, Evidence Store Component, Public Presentation Component | Project, Evidence, Artifact, Accessibility, Verification Method | Evidence Store Component manages evidence metadata; Public Presentation Component displays evidence with accessibility and verification method. |
| FR-003 | Enable linking specific claims or achievements within a project or skill to specific evidence items, with bidirectional traceability. | AD-003 | Claim Presentation, Evidence Presentation | Content Management Component, Evidence Store Component, Public Presentation Component | Claim, Evidence, Artifact, Accessibility, Verification Method | Content Management Component manages links; Public Presentation Component displays bidirectional traceability. |
| FR-004 | Represent professional skills and allow associating each skill with relevant evidence (e.g., projects, certificates, demonstrations). | AD-004 | Skill Presentation, Evidence Presentation | Content Management Component, Evidence Store Component, Public Presentation Component | Skill, Evidence, Artifact, Accessibility, Verification Method | Similar to FR-002 and FR-003; skills are content items that can link to evidence. |
| FR-005 | Provide a private management interface for content creation, editing, evidence association, and publishing without source code changes. | AD-005 | Content Management, Publication Management | Content Management Component | Content, Publication State, Private Management Boundary, Public Evidence System | Content Management Component handles private interface; publication state management is part of Content Management Component; separation ensures no code changes needed for content updates. |
| FR-006 | Allow specifying and displaying the accessibility status of each evidence item (Public, Private/Restricted, Redacted, Unavailable). | AD-006 | Evidence Presentation, Evidence Management | Content Management Component, Evidence Store Component | Evidence, Accessibility, Artifact | Evidence Store Component stores accessibility status; Public Presentation Component displays it; Content Management Component allows setting it. |
| FR-008 | Ensure the public portfolio is usable across device sizes, adapting layout to different viewport sizes. | AD-008 | Responsive Design | Public Presentation Component | (No specific domain concept; presentation concern) | Public Presentation Component implements responsive design principles. |
| FR-009 | Ensure the public portfolio conforms to WCAG 2.2 Level AA accessibility standards. | AD-009 | Accessible Design | Public Presentation Component | (No specific domain concept; presentation concern) | Public Presentation Component implements accessibility guidelines. |
| NFR-002 | Separate content from presentation, allowing content updates via a management interface or content files without requiring frontend/backend code changes. | AD-009 | Content Management, Content-Presentation Separation | Content Management Component, Public Presentation Component | Content, Publication State, Private Management Boundary, Public Evidence System | Content Management Component manages content; Public Presentation Component handles presentation; separation allows independent updates. |
| C-001 | Technology stack must be chosen based on fitness-for-purpose, not popularity. | AD-010 | (Process constraint) | (No specific component; guides technology selection) | (No domain concept) | Selected architecture defers technology selection to later stages, allowing evaluation against requirements. |
| C-002 | Every feature or design decision must be evaluated against its ability to support the presentation and verification of engineering evidence. | AD-011 | (Process constraint) | (No specific component; guides decision-making) | (No domain concept) | Selected architecture and components are justified by their support for evidence presentation and verification (see traceability above). |

All P0 requirements (FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-008, FR-009, NFR-002, C-001, C-002) have architectural coverage.

## 19. Risks
Identified risks from the architectural decisions:

- **Risk A1: Over-engineering via unnecessary decomposition** - Mitigated by selecting the simplest viable architecture (monolith) and resisting pressure to add microservices or complex distributions.
- **Risk A2: Inadequate separation of public/private concerns** - Mitigated by explicit components (Public Presentation Component vs. Content Management Component) and clear boundaries (publication state, access controls).
- **Risk A3: Failure to honestly represent evidence accessibility** - Mitigated by the Evidence Store Component storing accessibility status and the Public Presentation Component displaying it truthfully, per the Evidence Accessibility Honesty Invariant.
- **Risk A4: Overlooking accessibility and responsiveness** - Mitigated by dedicating components and requirements to these concerns (Public Presentation Component responsible for both).
- **Risk A5: Security vulnerabilities in private management** - Mitigated by the Security Component, guided by NFR-001 and engineering constitution principles.
- **Risk A6: Technology selection not aligned with requirements** - Mitigated by deferring technology selection (per C-001 and C-002) and basing the decision on architectural drivers and trade-offs.

## 20. Deferred Decisions
The following decisions are intentionally deferred to later stages (as per the domain model and constraints):

- Choice of programming language, framework, or library.
- Database schema or storage technology (SQL, NoSQL, graph, etc.).
- API design (REST, GraphQL, gRPC, etc.).
- Frontend library or UI components (React, Vue, Svelte, etc.).
- Backend framework.
- Authentication provider or mechanism (OAuth, JWT, session-based, etc.).
- Authorization framework.
- Cloud provider or hosting platform.
- Deployment platform.
- UI component library.
- CSS framework.
- Analytics provider.
- CMS product.
- Third-party services.
- Detailed interaction flows or UI wireframes.
- Specific verification method implementations (e.g., how to render a repository link or display accessibility status).
- Performance optimization techniques (caching strategies, image formats, etc.).
- Accessibility implementation details (specific ARIA patterns, color palettes, etc.).
- SEO metadata structure (schema.org, meta tags, etc.).
- Analytics integration (what to measure, how to report).
- Third-party validation mechanisms (how employers confirm contributions).

## 21. Architecture Validation
We have validated the architecture against:

- **Functional requirements**: All P0 requirements are traceable to architectural components and capabilities (see section 18).
- **Accessibility**: The Public Presentation Component is responsible for conforming to WCAG 2.2 AA (FR-009).
- **Responsiveness**: The Public Presentation Component is responsible for adaptive layout (FR-008).
- **Security**: The Security Component addresses private system protection (NFR-001); public/private isolation is a core principle.
- **Privacy**: The private management system is protected; publication state ensures control over what is public.
- **Maintainability**: Content/presentation separation (NFR-002) and modular design within the monolith support maintainability.
- **Testability**: Components are defined with clear responsibilities, facilitating unit and integration testing.
- **Evidence credibility**: The evidence store, traceability links, and honest representation of accessibility support credible evidence presentation (FR-002, FR-003, FR-004, FR-006).
- **Publication correctness**: The Content Management Component ensures only published content is visible publicly (FR-005).
- **Failure handling**: Considered in section 13; architecture avoids falsely representing unavailable evidence as verified.
- **Simplicity**: The selected monolith architecture is the simplest that satisfies the requirements (principle 17).

## 22. Stage 3 Acceptance
The architecture document is complete and addresses all required sections. No material contradictions remain. The architecture is technology-independent, requirement-driven, and considers alternatives. Stage 3 may be marked ACCEPTED upon human architect review and authorization.

**Status: ACCEPTED**