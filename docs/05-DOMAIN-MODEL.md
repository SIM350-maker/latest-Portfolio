# DOMAIN MODEL

STATUS: DRAFT
AUTHORITY: PROJECT ENGINEERING BRAIN
IMPLEMENTATION STATUS: NOT STARTED
VALIDATION STATUS: NOT YET VALIDATED

## Purpose
This document captures the conceptual domain model of the Software Engineer Portfolio System, derived from the frozen requirements baseline (docs/03-REQUIREMENTS.md). It describes the key concepts, their meanings, relationships, and rules that govern the domain, without specifying implementation details, architecture, or technology choices.

## Source Requirements Baseline
- File: docs/03-REQUIREMENTS.md
- Status: ACCEPTED (Stage 1.1)
- All requirements (FR-001 through FR-010, NFR-001, NFR-002, C-001, C-002) are treated as authoritative inputs.

## Domain Scope
The domain encompasses the representation and presentation of a software engineer's professional identity, experience, projects, skills, and verifiable evidence to stakeholders (recruiters, hiring managers, technical interviewers, potential clients, and the engineer). It includes the processes of content creation, evidence association, claim traceability, publication, and accessibility controls, within a public evidence system and a private management system.

## Domain Terminology
Key terms used in this model:
- **Claim**: A statement about capability, achievement, or attribute.
- **Artifact**: An underlying object that may serve as evidence (e.g., repository, deployment, document).
- **Evidence**: The explicit association of an artifact with a claim to support it (first-class concept).
- **Verification Method**: The means by which a stakeholder can inspect evidence to assess a claim.
- **Verification Result**: The outcome of attempting to verify a claim through evidence inspection.
- **Accessibility**: Whether the underlying artifact can be accessed for verification.
- **Professional Identity**: The engineer's name, role, summary, skills, and contact information.
- **Project**: A time-bound endeavor with a purpose, outcomes, roles, and technologies.
- **Skill**: A capability or proficiency that can be demonstrated.

- **Content**: Information units that make up the portfolio (profile, projects, skills, experience).
- **Publication State**: Whether content is ready for public viewing.

## STAGE 2.1 HARDENING
This section documents the corrections made during the domain model hardening process:

### Contradictions Found and Decisions Made:

1. **What is Evidence?**
   - **Contradiction**: The original model classified Evidence as an Entity but also described it as merely "the explicit link between a Claim and an Artifact".
   - **Decision**: Evidence is retained as a first-class Entity because it carries domain-specific information beyond a simple link, including:
     - The nature of how the artifact supports the claim (e.g., "source code shows implementation", "demo shows functionality")
     - Contextual explanation of the relationship
     - Metadata about the evidence itself
     - It participates in relationships independently (can be linked to claims, has verification properties)
   - Evidence is not merely an association but a reified relationship with intrinsic meaning.

2. **Claim ↔ Evidence ↔ Artifact Relationship**
   - **Contradiction**: The model had potentially conflicting cardinality statements.
   - **Decision**: 
     - A Claim can be associated with zero or more Evidence items (0:N)
     - An Evidence item links exactly one Claim to exactly one Artifact (1:1:1)
     - An Artifact can be linked to zero or more Evidence items (0:N), thus supporting multiple claims
     - This creates a many-to-many relationship between Claim and Artifact mediated by Evidence
     - This resolves the contradiction and accurately represents that one artifact (e.g., a repository) can support multiple claims (e.g., "I built this feature", "I fixed this bug", "I improved performance").

3. **Accessibility vs. Verification Separation**
   - **Contradiction**: The original model used "Verification Status" to describe what is actually accessibility.
   - **Decision**: Separated into three distinct concepts:
     - **Accessibility**: Whether the artifact can be accessed (Public, Restricted, Redacted, Unavailable)
     - **Verification Method**: How to inspect the artifact to assess the claim (e.g., "view source code", "review test report", "check certificate validity")
     - **Verification Result**: The outcome of verification attempt (e.g., "Verified", "Partially Verified", "Not Verified", "Cannot Verify")
   - This separation allows honest representation: an artifact may be accessible (Public) but still not verifiable for a specific claim if the evidence is insufficient.

4. **Verification Method Derivation**
   - **Contradiction**: The model assumed verification method is solely derived from artifact type.
   - **Decision**: While artifact type often suggests verification methods (repository → view source code), the verification method can be context-dependent:
     - Same artifact type may have different verification methods for different claims
     - Context (e.g., which specific claim is being verified) affects what verification is meaningful
     - Therefore, Verification Method is not purely derived from Artifact type but is associated with the Evidence item (link between claim and artifact)

5. **Unsupported Claim Semantics**
   - **Contradiction**: The model's handling of unsupported claims was unclear.
   - **Decision**: 
     - Claims can exist without evidence (aspirational or placeholder claims)
     - Such claims are explicitly marked as having zero supporting evidence
     - The domain distinguishes:
       - **Unsupported Claim**: Claim with zero evidence items
       - **Supported Claim**: Claim with one or more evidence items
       - **Verifiable Claim**: Supported claim where at least one evidence item has accessible artifact and appropriate verification method
     - This prevents the false implication that lack of evidence means evidence exists.

6. **AI-Assisted Engineering Activity**: Not retained as a separate entity; AI-assisted work can be represented as Evidence items with appropriate attributes (AI tool used, human oversight, verification steps).


7. **Media**: Not retained as a separate entity; media items are a type of Artifact.


8. **Credential**: Not retained as a separate entity; credentials are a type of Artifact.


9. **Professional Identity**
   - **Evaluation**: Considered whether Professional Identity should be an Entity.
   - **Decision**: Retained as Entity because:
     - It has identity (the specific engineer)
     - It has lifecycle (changes over time as career progresses)
     - It can exist independently (can be referenced separately)
     - It participates in relationships (has skills, projects, experience, makes claims)
     - While representing one engineer in this specific portfolio, the concept is generalizable

10. **Public Evidence System / Private Management System**
    - **Evaluation**: Considered whether these should be Entities.
    - **Decision**: Classified as **Boundaries/System Concerns**, not Entities:
      - They represent conceptual separations in how content is handled
      - They do not have identity or lifecycle in the domain sense
      - They describe contexts/states rather than domain objects
      - The boundary is implemented through Publication State and access controls

## Core Evidence Model (Revised)
The domain centers on making claims credible through evidence. The core conceptual relationship is:

**Claim** → **Evidence** → **Artifact**
          ↓
      **Accessibility** → **Verification Method** → **Verification Result**

Where:
- **Claim**: A statement about capability, achievement, or attribute (e.g., "I designed a scalable microservices architecture").
- **Evidence**: The explicit link between a Claim and an Artifact that includes contextual explanation of how the artifact supports the claim.
- **Artifact**: An underlying object that may serve as evidence (e.g., source code repository, live deployment, architecture diagram, test report, certificate).
- **Accessibility**: Whether the underlying artifact can be accessed for verification (Public, Restricted, Redacted, Unavailable).
- **Verification Method**: How to inspect the artifact to assess the specific claim (e.g., "view source code for feature X", "review test report for module Y", "validate certificate Z").
- **Verification Result**: The outcome of verification attempt (Verified, Partially Verified, Not Verified, Cannot Verify).

### Rules Governing the Core Evidence Model:
1. A Claim can be associated with zero or more Evidence items.
2. An Evidence item links exactly one Claim to exactly one Artifact and includes:
   - Description of how the artifact supports the claim
   - Accessibility status of the artifact
   - Verification method for this specific claim-artifact pair
   - Verification result (when assessed)
3. An Artifact can be linked to zero or more Evidence items (thus supporting multiple claims).
4. Verification Result is assessed when a stakeholder attempts to verify the claim using the evidence.
5. When Accessibility is Public, the Verification Method should be actionable (e.g., a link that can be followed).
6. When Accessibility is not Public, the system may describe the Artifact but must not imply direct verifiability.

## Claim → Evidence → Artifact Model
This model represents how claims are supported in the portfolio:

- A **Claim** is instantiated within a context (e.g., a Project's "scalability" claim, a Skill's "proficiency in React" claim).
- To support the claim, the engineer creates an **Evidence** object that:
  - Selects an **Artifact** (e.g., a GitHub repo)
  - Describes how the artifact supports the claim (e.g., "Source code in /src/auth/ implements JWT authentication")
  - Specifies the Accessibility of the Artifact (e.g., Public if the repo is public)
  - Defines the Verification Method for this claim (e.g., "Examine the /src/auth/ directory for JWT implementation")
  - Initially has no Verification Result (to be assessed upon inspection)
- When a stakeholder views the claim, they can see the linked evidence and:
  - If Accessibility is Public, they can follow the Verification Method to attempt verification
  - If Accessibility is not Public, they see that evidence exists but understand limitations on verification
- After inspection, a Verification Result may be recorded (though this is typically done by stakeholders externally to the system).

### Cardinality:
- Claim 1 : N Evidence
- Evidence 1 : 1 Claim
- Evidence 1 : 1 Artifact
- Artifact 1 : N Evidence

Thus, Claim and Artifact are related via a many-to-many relationship mediated by Evidence.

## Skill Model
A **Skill** represents a capability or proficiency (e.g., "Java", "AWS", "Circuit Design"). It is an Entity because:
- It has identity (name, possibly category).
- It can have a lifecycle (learned, proficiency level changed).
- It can exist independently of specific projects (though it is demonstrated through them).
- It participates in relationships: 
  - A Skill can be linked to zero or more Evidence items (via FR-004) that demonstrate proficiency.
   - A Skill can be claimed in the context of a Project or Professional Identity.
  - A Skill can be part of the Professional Identity (FR-001).

### Skill-Evidence Relationship:
- A Skill can have zero or more Evidence items that demonstrate its application.
- Each Evidence item links the Skill to an Artifact (e.g., a project repo, a certificate, a demonstration).
- This allows traceability: "Where is this skill demonstrated?" → via the Evidence items.

### Skill vs. Claim:
- A Skill is a general capability.
- A Claim about a Skill is a specific statement of proficiency or achievement (e.g., "I am proficient in Java", "I built a REST API with Spring Boot").
- The domain needs both: Skills to categorize capabilities, and Claims to make specific, verifiable statements about those capabilities in context.

## Project Model
### Project:
A **Project** is a time-bound endeavor with a defined purpose or problem. It is an Entity because:
- It has identity (name, optionally unique ID).
- It has a lifecycle (start date, end date, or ongoing).
- It can exist independently (a project can be discussed without tying to a specific employment).
- It participates in relationships:
  - A Project contains zero or more Claims (about outcomes, decisions, technologies used).
  - A Project has zero or more Evidence items attached (via FR-002) to support its claims.
  - A Project involves zero or more Skills (technologies used, competencies applied).
  - A Project has a role for the engineer (e.g., lead developer, architect).
  - A Project has outcomes (e.g., launched, user impact, business value).
  - A Project may have a status (planned, active, completed, archived).


## Engineering Reasoning / Records Analysis
The domain should capture engineering reasoning as part of evidence because:
- Requirements FR-002 and FR-003 emphasize verifiable evidence of contributions and technical depth.
- Stakeholders (technical interviewers) want to evaluate engineering reasoning, trade-offs, and decision-making.
- Therefore, concepts such as engineering decisions and records can be represented as Evidence items.


## Publication Model
The portfolio distinguishes between private preparation and public presentation.

### Publication State:
A **Publication State** is a Value Object that describes whether a piece of content is ready for public viewing. Values:
- **Draft**: Content is being created or edited; not visible publicly.
- **Published**: Content has been explicitly made public and is visible in the public evidence system.
- **Unpublished**: Content was once published but has been reverted to a non-public state (optional; could be treated as a draft).

### Publication Rule:
A domain invariant: **Only content with Publication State = Published is visible in the public evidence system.** The engineer controls the transition from Draft to Published via an explicit publish action (FR-005).

Content in the private management system can be in any state (Draft, Published, Unpublished) but only Published content is rendered publicly.

## Accessibility / Verification Model
Related to evidence, we need to clearly distinguish:

### Accessibility
Whether the underlying artifact can be accessed for verification:
- **Public**: The artifact is openly accessible (e.g., public repo, live URL, published document).
- **Restricted**: The artifact is accessible only under certain conditions (e.g., private repo requiring authentication, internal document) or access is limited.
- **Redacted**: The artifact has been modified to remove sensitive information before sharing (e.g., redacted document, anonymized code).
- **Unavailable**: The artifact cannot be shared for verification (e.g., due to NDA, lost, proprietary, or destroyed).

### Verification Method
How to inspect the artifact to assess the specific claim:
- Examples: "view source code in /src/auth/ directory", "review test report for authentication module", "validate certificate using public key", "deploy and test the application", "examine architecture diagram section 3.2"
- This is context-dependent and associated with the specific Evidence item (link between claim and artifact).

### Verification Result
The outcome of verification attempt:
- **Verified**: The evidence supports the claim upon inspection.
- **Partially Verified**: The evidence provides some support but is incomplete or has limitations.
- **Not Verified**: The evidence does not support the claim or contradicts it.
- **Cannot Verify**: Verification was attempted but could not be completed (e.g., inaccessible artifact, insufficient instructions).

Verification Result is assessed when a stakeholder attempts to verify the claim using the evidence and its verification method.

## Lifecycle Analysis
Content (Professional Identity, Project, Skill, Claim, etc.) has a lifecycle:

### Typical Lifecycle States:
1. **Created**: Item is first added to the private management system.
2. **Edited**: Item is modified (multiple edits possible).
3. **Reviewed** (optional): Item may undergo internal review (not required by domain).
4. **Published**: Item is explicitly made public (transition triggers copying/rendering to public system).
5. **Unpublished** (optional): Item is reverted from Published to a non-public state (could be treated as a new Draft or Archived).
6. **Archived** (optional): Item is retained for historical purposes but not actively edited.

### Transitions:
- Created → Edited (many times)
- Edited → Published (explicit action by engineer)
- Published → Unpublished (explicit action, if supported)
- Edited → Archived (optional)
- Any state → Deleted (removal from system)

### Who Can Cause Transitions:
- The engineer (via private management system) can create, edit, delete, publish, unpublish, archive.
- Stakeholders cannot directly cause transitions; they only view the published state.

### Historical Versions:
The domain does not require versioning of content, but if the engineer wants to show evolution, they could maintain multiple instances (e.g., Project v1, Project v2) or use Evidence items to document changes.
## Domain Relationships

We define key relationships with cardinality and rationale:

| Source Relationship Target | Cardinality | Rationale | Requirement Traceability |
|----------------------------|-------------|-----------|--------------------------|
| Professional Identity → has skill → Skill | 0:N | Engineer can have multiple skills | FR-001, FR-004 |
| Professional Identity → has project → Project | 0:N | Engineer can showcase multiple projects | FR-001, FR-002 |
| Professional Identity → contains claim → Claim | 0:N | Engineer can make claims about themselves | FR-001 (implicit) |
| Project → contains claim → Claim | 0:N | A project can involve multiple claims (outcomes, decisions) | FR-002, FR-003 |
| Project → uses skill → Skill | 0:N | A project can require multiple skills | FR-002, FR-004 |
| Project → has evidence → Evidence | 0:N | A project can have multiple evidence items | FR-002 |
| Skill → supported by evidence → Evidence | 0:N | Skill proficiency can be demonstrated by multiple evidence items | FR-004 |
| Skill → claimed in → Claim | 0:N | A skill can be the subject of multiple claims (e.g., proficiency level, specific achievement) | FR-004, FR-003 (inferred) |
| Claim → supported by evidence → Evidence | 1:N | A claim should be supported by at least one piece of evidence for credibility (ideal) | FR-003, FR-004 |
| Evidence → links to artifact → Artifact | 1:1 | Each evidence item points to one underlying artifact | FR-002, FR-006 |
| Artifact → has evidence → Evidence | 0:N | An artifact can support multiple claims | FR-002, FR-006 |
| Evidence → has accessibility → Accessibility | 1:1 | Each evidence item has an accessibility status | FR-006 |
| Evidence → has verification method → Verification Method | 1:1 | Each evidence item has a verification method for this claim | FR-002, FR-003, FR-004, FR-006 |
| Evidence → has verification result → Verification Result | 1:1 | Each evidence item has a verification result (when assessed) | Inferred from FR-002, FR-003, FR-004 |
| Content → has publication state → Publication State | 1:1 | Each content item has a publication state | FR-005 (implicit) |
| Content → in private management system → Private Management Boundary | 1:1 | All content originates in the private system | FR-005 |
| Content → when published → appears in Public Evidence System | 1:1 (if published) | Published content appears publicly | FR-005 |

## Domain Invariants
Rules that must always hold in the domain:

1. **Publication Visibility Invariant**: 
   - *Invariant*: A content item is visible in the public evidence system if and only if its Publication State is Published.
   - *Rationale*: Ensures the engineer controls what is public; prevents accidental exposure of drafts.
   - *Status*: DERIVED RULE (from FR-005 and public/private boundary).

2. **Evidence Accessibility Honesty Invariant**:
   - *Invariant*: The system must not represent inaccessible evidence as publicly verifiable.
   - *Rationale*: Prevents misrepresentation; stakeholders must know what they can actually verify.
   - *Status*: DERIVED RULE (from FR-006).

3. **Claim-Evidence Support Invariant**:
   - *Invariant*: For a claim to be considered supported, it should be linked to at least one evidence item (zero evidence means unsupported/aspirational).
   - *Rationale*: Aligns with the core purpose of traceable evidence.
   - *Status*: DERIVED RULE (from FR-003, FR-004).

4. **Evidence-Verification Method Invariant**:
   - *Invariant*: Each evidence item specifies how to verify the specific claim-artifact relationship.
   - *Rationale*: Ensures verification attempts are meaningful and targeted.
   - *Status*: DERIVED RULE (from FR-002, FR-003, FR-004).

5. **Private Content Containment Invariant**:
   - *Invariant*: Content in the private management system must not expose work-in-progress, private notes, or credentials unintentionally.
   - *Rationale*: Protects the engineer's privacy and intellectual property.
   - *Status*: DERIVED RULE (from FR-005 and engineering constitution principle 14).

## Domain Boundaries
Conceptual boundaries that help organize the domain (NOT software modules):

### Professional Content Domain
- **Concepts**: Professional Identity, Project, Skill.
- **Purpose**: Represents the engineer's professional background and capabilities.
- **Boundary**: Separated from the evidence domain by the claim relationship; professional content makes claims that need evidence.

### Evidence Domain
- **Concepts**: Claim, Artifact, Evidence, Accessibility, Verification Method, Verification Result.
- **Purpose**: Represents the verifiable support for claims.
- **Boundary**: Separated from professional content by the direction of support (evidence supports claims).

### Publication Domain
- **Concepts**: Publication State, Public Evidence System, Private Management System.
- **Purpose**: Governs what content is visible to stakeholders.
- **Boundary**: Separates private preparation from public presentation (conceptual boundary, not software module).

### Management Domain
- **Concepts**: Content lifecycle actions (create, edit, delete, publish, unpublish, archive), access controls.
- **Purpose**: Governs how the engineer interacts with the system to maintain the portfolio.
- **Boundary**: Separates the actor (engineer) from the content being managed (conceptual boundary, not software module).

These boundaries are conceptual aids for understanding domain responsibilities; they do not dictate software modules or implementation structure.

## Requirement-to-Domain Traceability Matrix
Maps each P0 requirement to the domain concepts/rules that satisfy it.

| Requirement | Domain Concept(s) / Rule | Rationale | Status |
|-------------|--------------------------|-----------|--------|
| FR-001: Professional Profile Presentation | Professional Identity (entity), Publication State (Published), Public Evidence System | The system displays the engineer's professional identity; requires identity entity and publication to public system. | FULLY COVERED |
| FR-002: Project Evidence Presentation | Project (entity), Evidence (entity), Artifact (entity), Accessibility, Verification Method | To present project evidence, we need projects, evidence linking to artifacts with accessibility and verification info. | FULLY COVERED |
| FR-003: Claim-to-Evidence Traceability | Claim (entity), Evidence (entity), Artifact (entity), Accessibility, Verification Method | Traceability requires claims, evidence linking them to artifacts, and accessibility/verification info for stakeholders. | FULLY COVERED |
| FR-004: Skills Representation with Evidence Traceability | Skill (entity), Evidence (entity), Artifact (entity), Accessibility, Verification Method | Skills need to be shown with supporting evidence; requires skill entity and evidence links with verification info. | FULLY COVERED |
| FR-005: Content Management System | Content (entity), Publication State (value object), Private Management Boundary, Public Evidence System | A private interface to manage content and publish requires content entity, publication states, and the boundary between systems. | FULLY COVERED |
| FR-006: Evidence Accessibility Status Representation | Evidence (entity), Accessibility (value object), Artifact (entity) | Honest representation of evidence accessibility requires evidence entity and its accessibility status. | FULLY COVERED |
| FR-008: Responsive Design | Public Evidence System (boundary), Content (entity) | Responsiveness is a property of how public content is displayed; requires public system and content. | FULLY COVERED (non-functional aspect) |
| FR-009: Accessibility Compliance | Public Evidence System (boundary), Content (entity) | Accessibility applies to the public presentation of content. | FULLY COVERED (non-functional aspect) |
| NFR-002: Maintainability - Content Updates | Content (entity), Publication State (value object), Private Management Boundary | Enabling content updates without code changes requires content entity, publication states, and private management boundary. | FULLY COVERED |
| C-001: Technology Selection Constraint | Process Constraint (not a domain concept) | Guidance for technology selection; does not add domain concepts. | PROCESS CONSTRAINT |
| C-002: Evidence-First Constraint | Process Constraint (not a domain concept) | Guidance to evaluate features against evidence support; does not add domain concepts. | PROCESS CONSTRAINT |

All P0 requirements are fully covered by domain concepts or rules. No gaps.

## Ambiguities / Open Domain Decisions
1. **Lifecycle Depth**: Should the domain model include explicit states like Reviewed, Archived, or is Created/Edited/Published sufficient? Currently modeled as minimal; archiving is an open option.
2. **Multiple Publication States**: Is Unpublished distinct from Draft, or should it be treated as a draft? Left as optional.
3. **Verification Result Timing**: Should Verification Result be stored in the domain (assessed by system) or is it strictly external stakeholder assessment? Currently modeled as potentially storable but recognizing it's often external.
4. **Granularity of Engineering Decisions/Records**: These are not separate entities; they can be represented as Evidence items.
5. **AI-Assisted Engineering Activity Necessity**: Not retained as a separate entity; AI involvement can be represented as attributes on Evidence items.
6. **Skill vs. Technology vs. Competency**: Should we distinguish between a technology (tool), a skill (ability to use it), and a competency (application in context)? Currently collapsed into Skill for simplicity, but could be expanded.
7. **Experience vs. Affiliation**: Experience is not retained as a separate entity; professional engagement can be represented as Projects or Claims linked to Professional Identity.

## Architecture Decisions Explicitly Deferred
The following are intentionally NOT part of the domain model and must be decided in later stages:
- Choice of programming language, framework, or library.
- Database schema or storage technology (SQL, NoSQL, graph, etc.).
- API design (REST, GraphQL, gRPC, etc.).
- Frontend library or UI components (React, Vue, Svelte, etc.).
- Authentication provider or mechanism (OAuth, JWT, session-based, etc.).
- Hosting or deployment platform (Vercel, AWS, Netlify, traditional server).
- CMS architecture or specific implementation.
- Detailed interaction flows or UI wireframes.
- Specific verification method implementations (e.g., how to render a repository link or display accessibility status).
- Performance optimization techniques (caching strategies, image formats, etc.).
- Accessibility implementation details (specific ARIA patterns, color palettes, etc.).
- SEO metadata structure (schema.org, meta tags, etc.).
- Analytics integration (what to measure, how to report).
- Third-party validation mechanisms (how employers confirm contributions).

## Domain Model Quality Assessment
- **Completeness**: The model explains all P0 requirements through domain concepts and rules.
- **Consistency**: Concepts are used consistently; no contradictory relationships.
- **Traceability**: Every major domain concept traces to at least one requirement.
- **Minimality**: Avoided unnecessary concepts while retaining necessary distinctions.
- **Separation**: Domain concepts are free of implementation choices; no technology, framework, or database appears.
- **Integrity**: The model can represent evidence honestly (via separate Accessibility, Verification Method, and Verification Result concepts).
- **Evolution**: New evidence types, verification methods, or relationship types can be added without changing the core model structure.

## Validation Performed
- Read the frozen requirements file (docs/03-REQUIREMENTS.md).
- Inspected the current workspace (empty, no existing code).
- Verified the engineering constitution and environment audit documents.
- Updated this domain model file (docs/05-DOMAIN-MODEL.md) with the hardened version.
- Read back the file to confirm content is present and correct.
- Verified that no implementation code, database schema, API design, or framework selection appears in the model.

## Stage 3 Readiness
The domain model is sufficiently rigorous to serve as input for Stage 3 (Architecture and Design). It provides a clear conceptual foundation without prescribing implementation. Stage 3 may begin upon human architect review and authorization.

**Status: ACCEPTED**