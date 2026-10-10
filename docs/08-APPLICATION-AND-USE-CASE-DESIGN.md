# STAGE 4.2 — APPLICATION & USE-CASE DESIGN

## 1. Document Control
- **Title**: Application and Use‑Case Design (Stage 4.2)
- **Author**: Implementation Design Engineer
- **Status**: DRAFT
- **Created**: 2026-10-07
- **Revision**: 0.1

## 2. Stage 4.2 Scope
Define internal behavior of the portfolio system, identifying actors, modules, use‑cases, commands, queries, business rules, state models, workflows, authorization, validation, error semantics, transaction boundaries, module dependencies, and testable contracts.

## 3. Authoritative Inputs
- Requirements: `docs/03-REQUIREMENTS.md`
- Domain Model: `docs/05-DOMAIN-MODEL.md`
- System Architecture: `docs/06-SYSTEM-ARCHITECTURE.md`
- Technology Strategy: `docs/07-TECHNOLOGY-AND-IMPLEMENTATION-STRATEGY.md`

## 4. Actors
| Actor | Purpose | Allowed Operations | Prohibited Operations | Requires Authentication |
|-------|---------|---------------------|-----------------------|-----------------------|
| Public Visitor | Browse published portfolio | Read only published content | Create, edit, publish, delete content | No |
| Portfolio Owner / Engineer | Manage portfolio content | Full CRUD, publish, unpublish, preview, manage evidence & claims | Use unpublished content without auth | Yes |
| Administrator | Optional maintenance | Manage configuration, logs | Modify user data without consent | Yes |

## 5. Application Modules
1. **Content Management** – CRUD for Professional Identity, Projects, Skills, Claims, Evidence; handles draft and publication state.
2. **Evidence Store** – Persist evidence metadata and artifact links.
3. **Public Presentation** – Render published portfolio to public visitors.
4. **Security** – Authentication and authorization.

## 6. Public Use Cases
- View Professional Profile
- View Published Projects
- View Project Details
- View Published Skills
- View Claim and Supporting Evidence
- Inspect Evidence Accessibility
- Read Verification Guidance
- Access Public Artifacts

## 7. Private Management Use Cases
- Authenticate
- View Dashboard
- Create Content (project, skill, claim, evidence)
- Edit Content
- Delete Content
- Associate Evidence with Claim
- Associate Evidence with Artifact
- Update Evidence Accessibility
- Define Verification Method
- Record Verification Result
- Publish Content
- Unpublish Content
- Preview Draft Content
- Generate CV (future/deferred)

## 8. Commands
- CreateContent, UpdateContent, DeleteContent, PublishContent, UnpublishContent, PreviewDraft, CreateEvidence, UpdateEvidenceAccessibility, DeleteEvidence, CreateClaim, DeleteClaim

## 9. Queries
- GetPublicProfile, GetPublishedProjects, GetProjectById, GetPublishedSkills, GetClaims, GetEvidenceByClaim, GetPublicArtifactInfo

## 10. Business Rules
- Claims may exist without evidence.
- Evidence links one claim to one artifact; contains description, accessibility, verification method.
- Artifact may support multiple claims.
- Evidence does not imply verification.
- Accessibility, Verification Method, and Verification Result are distinct.
- Publication State determines public visibility.

## 11. State Models
- Content Publication: Draft → Published → Unpublished → Published.
- Evidence Accessibility: Public, Restricted, Redacted, Unavailable.
- Verification Result: Verified, Partially Verified, Not Verified, Cannot Verify.

## 12. Publication Workflow
1. Create/Edit → Draft.
2. Validate locally.
3. Publish → state becomes Published.
4. Unpublish → Unpublished or revert to Draft.

## 13. Evidence Workflow
1. Create Claim.
2. Associate Evidence → artifact link.
3. Set description, accessibility, verification method.
4. Record verification result when available.

## 14. Authorization Model
- Public Visitor: Read only on Published content.
- Private Manager: Full CRUD, publish, unpublish, preview; requires authentication.

## 15. Validation Model
- Input schema validation.
- Domain rule validation (e.g., publication state).
- Publication quality checks.
- URL format validation for external artifacts.
- HTML conformance for rendering.

## 16. Error Semantics
- Unauthenticated (401)
- Unauthorized (403)
- Invalid Input (400/422)
- Content Not Found (404)
- Artifact Unavailable (422)
- External Resource Unreachable (502/503)
- Verification Cannot Be Performed (422)
- Persistence Failure (500)
- Unexpected System Failure (500)

## 17. Conceptual Transaction Boundaries
- Publish, Unpublish, Delete Content are atomic.
- Create Evidence Association is atomic.

## 18. Module Dependencies
- Public Presentation reads from Persistence.
- Content Management writes to Evidence Store and Persistence.
- Evidence Store writes to Persistence.
- Security guards private modules.

## 19. Testable Behavioral Contracts
- Published content visible publicly.
- Unpublished/draft content not visible publicly.
- Authenticated owner can perform CRUD and publish.
- Claims can exist without evidence.
- Evidence with Public accessibility shows link.
- Evidence with Restricted/Redacted/Unavailable shows label.
- Verification results remain unchanged unless updated.

## 20. Requirements Traceability
| Requirement | Covered Behaviors | Notes |
|--------------|------------------|-------|
| FR‑001 | View Professional Profile use case | Public profile |
| FR‑002 | Project evidence presentation | Project detail view |
| FR‑003 | Claim‑evidence traceability | Evidence associations |
| FR‑004 | Skill evidence traceability | Skill evidence links |
| FR‑005 | Content management system | CRUD, publish, unpublish |
| FR‑006 | Evidence accessibility status | Accessibility labels |
| FR‑007 | CV generation (future dev) | Planned for later stage |
| FR‑008 | Responsive design | Public presentation component |
| FR‑009 | Accessibility compliance | Public presentation component |
| FR‑010 | Performance optimization (future dev) | Planned for later stage |
| NFR‑001 | Security - Data Protection | Security module |
| NFR‑002 | Maintainability - Content Updates | Separation of content and presentation |
| C‑001 | Technology Selection Constraint | Reflected in design decisions |
| C‑002 | Evidence-First Constraint | Evidences handled explicitly |

## 21. Domain Consistency Check
All domain entities (Professional Identity, Project, Skill, Claim, Evidence, Artifact, Content) are referenced; no unauthorized entities introduced.

## 22. Architecture Consistency Check
Modular monolith architecture with Content Management, Evidence Store, Public Presentation, Security preserved; no extra services added.

## 23. Technology Consistency Check
- Node.js runtime.
- Server‑rendered application with templating engine.
- SQLite persistence.
- Session‑based authentication via express‑session cookies.
- Docker containerization.
- Playwright for end‑to‑end testing.

## 24. Deferred Decisions
- Exact persistence schema.
- Full logging configuration.
- UI component design.
- Detailed validation rules per field.
- Performance optimization strategy (planned for later stage).

## 25. Risks
- Mis‑representation of evidence accessibility if not verified.
- Security misconfiguration in session handling.
- Over‑engineering module interactions.
- Authorization boundary violations.

## 26. Acceptance Criteria
- All P0 requirements satisfied.
- No conflicting behavior with domain model.
- Architecture and technology consistent.
- Clear testable contracts defined.

## 27. Status
**IN PROGRESS** – awaiting architecture review.
