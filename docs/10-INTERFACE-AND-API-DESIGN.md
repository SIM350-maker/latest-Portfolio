# STAGE 4.4 — INTERFACE & API DESIGN

## 1. Document Control
- **Title:** Interface & API Design (Stage 4.4)
- **Author:** Interface Design Engineer
- **Status:** DRAFT
- **Created:** 2026-10-07
- **Revision:** 0.1
- **Naming:** follows the existing `NN-NAME.md` convention; Stage 4.1→07, 4.2→08, 4.3→09, 4.4→10. Coexists with `10-QUALITY-REQUIREMENTS.md` per the established duplicate-coexistence pattern (06/07/08/09 each carry two documents). No other interface/API design document existed at creation time.

## 2. Stage 4.4 Scope
Design the external and internal interface contracts for the portfolio system: public read interfaces, protected management interfaces, internal command/query contracts between modules, validation responsibilities, error semantics, and authorization boundaries. No implementation is created (no controllers, route-handler code, templates, DTOs, repositories, SQL, ORM, authentication, tests, deployment). HTTP methods and paths are contract-level design decisions justified by the frozen Stage 4.1 selection (Express, server-rendered HTML).

## 3. Authoritative Inputs
- `ENGINEERING-CONSTITUTION.md`
- `03-REQUIREMENTS.md`
- `05-DOMAIN-MODEL.md`
- `06-SYSTEM-ARCHITECTURE.md`
- `07-TECHNOLOGY-AND-IMPLEMENTATION-STRATEGY.md`
- `08-APPLICATION-AND-USE-CASE-DESIGN.md`
- `09-DATA-AND-PERSISTENCE-DESIGN.md` — **ACCEPTED AND FROZEN** (253 lines, G1–G14 PASS)

## 4. Interface Architecture
Four interface boundaries, derived from frozen architecture §7:

1. **Public Read Boundary** — HTTP GET operations with no authentication; served by the Public Presentation module. Exposes only Published content.
2. **Private Management Boundary** — HTTP operations under the `/manage` route namespace; every operation requires authentication (mechanism **DEFERRED TO STAGE 4.5**); guarded by the Security module.
3. **Internal Command/Query Boundary** — in-process module contracts between Content Management, Evidence Store, and Public Presentation (commands mutate, queries read).
4. **External Artifact Boundary** — outbound references only; the system renders artifact references (links) but never proxies, stores, or fetches artifact content (architecture §12.3).

## 5. API Style Decision
- **DECISION:** Server-rendered HTTP interface (Express routes rendering HTML views) with form-based commands, plus internal command/query handler contracts within the monolith.
- **EVIDENCE:** Stage 4.1 selected Express + server-rendered HTML (07 §7–§8); the frozen architecture selected a modular monolith (06 §9); no authoritative document requires a JSON API.
- **OPTION rejected:** separate JSON REST API — **UNSUPPORTED** (no requirement demands it; violates the simplest-architecture principle, Constitution 17).
- **Mapping convention:** GET routes execute queries and render views; POST routes execute commands and redirect after success.
- JSON endpoints: **DEFERRED** (only if a later requirement justifies them).

## 6. Public Read Interfaces (no authentication)
| Method | Path | Purpose | Query Mapping | Serves |
|--------|------|---------|---------------|--------|
| GET | `/` | Homepage: published professional profile + portfolio overview | GetPublicProfile | FR-001 |
| GET | `/projects` | Published projects list | GetPublishedProjects | FR-002 |
| GET | `/projects/:idOrSlug` | Project detail with claims and evidence | GetProjectById (+ GetEvidenceByClaim embedded) | FR-002, FR-003 |
| GET | `/skills` | Published skills list | GetPublishedSkills | FR-004 |
| GET | `/skills/:idOrSlug` | Skill detail with claims and evidence | Skill detail query (+ GetEvidenceByClaim embedded) | FR-004, FR-003 |

Rules:
- All public queries return **only Published content**; Draft and Unpublished content is excluded (publication-state behavior, §10).
- Evidence display inside detail views: description, accessibility label, and verification guidance. The verification method renders as an actionable link **only when Accessibility = Public**; Restricted/Redacted/Unavailable evidence renders the status label without exposing underlying content (FR-006; architecture §11.4).
- Artifacts render as outbound references from `Artifact.reference`; never proxied or stored.
- `:idOrSlug` = identifier or optional slug per Stage 4.3 §15 (slugs are presentation attributes, not security boundaries).
- Exact visibility-derivation algorithm: **DEFERRED** (presentation-layer rule; Stage 4.3 §19 assigns visibility to runtime derivation).

## 7. Private Management Interfaces (protected)
Every route below requires authentication (mechanism **DEFERRED TO STAGE 4.5**). The `/manage` prefix is a **DECISION** (design-level route namespace).

| Method | Path | Purpose | Command Mapping | Serves |
|--------|------|---------|-----------------|--------|
| POST | `/manage/login` | Authenticate (mechanism deferred) | — (Stage 4.5) | NFR-001 |
| GET | `/manage` | Dashboard | — | FR-005 |
| GET | `/manage/profile` | Profile edit form | — | FR-001, FR-005 |
| POST | `/manage/profile` | Update profile | UpdateContent (Professional Identity) | FR-001 |
| GET | `/manage/projects` | All projects incl. drafts | — | FR-005 |
| GET | `/manage/projects/new` | New-project form | — | FR-005 |
| POST | `/manage/projects` | Create project | CreateContent | FR-002, FR-005 |
| GET | `/manage/projects/:id/edit` | Edit form | — | FR-005 |
| POST | `/manage/projects/:id` | Update project | UpdateContent | FR-002, FR-005 |
| POST | `/manage/projects/:id/delete` | Delete project | DeleteContent (409 if Claims exist, per Stage 4.3 §20) | FR-005 |
| GET | `/manage/skills` | All skills incl. drafts | — | FR-005 |
| POST | `/manage/skills` | Create skill | CreateContent | FR-004, FR-005 |
| POST | `/manage/skills/:id` | Update skill | UpdateContent | FR-004, FR-005 |
| POST | `/manage/skills/:id/delete` | Delete skill | DeleteContent (RESTRICT default) | FR-005 |
| POST | `/manage/claims` | Create claim | CreateClaim | FR-003 |
| POST | `/manage/claims/:id` | Update claim | UpdateContent | FR-003 |
| POST | `/manage/claims/:id/delete` | Delete claim | DeleteClaim (cascades to Evidence only) | FR-003, FR-005 |
| POST | `/manage/evidence` | Create evidence (claim + artifact references) | CreateEvidence | FR-002, FR-003, FR-006 |
| POST | `/manage/evidence/:id/accessibility` | Update accessibility | UpdateEvidenceAccessibility | FR-006 |
| POST | `/manage/evidence/:id/verification` | Record verification result | UpdateContent (Evidence.verification_result only) | FR-003 |
| POST | `/manage/evidence/:id/delete` | Delete evidence | DeleteEvidence | FR-005 |
| POST | `/manage/:entityType/:id/publish` | Publish | PublishContent | FR-005 |
| POST | `/manage/:entityType/:id/unpublish` | Unpublish | UnpublishContent | FR-005 |
| GET | `/manage/:entityType/:id/preview` | Preview draft | PreviewDraft | FR-005 |

Notes:
- `entityType` ∈ { profile, project, skill, claim } — the content-managed entities only; **NOT** evidence or artifact (preserves Stage 4.3 §13: Evidence/Artifact are not content-managed).
- The "Define Verification Method" use case maps to CreateEvidence / UpdateContent (the `verification_method` field).
- The "Record Verification Result" use case maps to UpdateContent restricted to `Evidence.verification_result` — Stage 4.2 §8 defines no dedicated verification command; no new command is invented.
- **No artifact deletion endpoint exists.** Stage 4.2 §8 defines no DeleteArtifact command; artifact lifecycle cleanup is **UNSUPPORTED / DEFERRED** (recorded gap, see §15).
- No privileged administrator endpoints (architecture §4.3: administrator is optional; the engineer performs administrative functions).

## 8. Internal Command/Query Contracts
- **Content Management** command handlers: CreateContent, UpdateContent, DeleteContent, PublishContent, UnpublishContent, PreviewDraft, CreateClaim, DeleteClaim (Stage 4.2 §8).
- **Evidence Store** handlers: CreateEvidence, UpdateEvidenceAccessibility, DeleteEvidence; query: GetEvidenceByClaim (Stage 4.2 §8–§9).
- **Public Presentation** consumes read-only queries: GetPublicProfile, GetPublishedProjects, GetProjectById, GetPublishedSkills, GetClaims, GetPublicArtifactInfo — all filtered to Published.
- Ownership follows Stage 4.3 §5/§21: Content Management owns content tables (including Claim); Evidence Store owns Evidence and Artifact; Public Presentation is read-only; Security has no persistence.
- Side effects: PublishContent/UnpublishContent change publication_state only (atomic, Stage 4.2 §17); DeleteClaim cascades to its Evidence only; DeleteContent is blocked when dependents exist; CreateEvidence requires both parents (below).

## 9. Evidence, Artifact, and Verification Interface Behavior
- **CreateEvidence input:** `claim_id` (required), artifact reference and type (required — the operation references/creates the Artifact record), `description` (optional), `accessibility` (required, enum), `verification_method` (optional).
- **Claim 1:N Evidence N:1 Artifact preserved:** one Artifact may be referenced by many Evidence records; no Evidence–Artifact 1:1 pairing is introduced.
- Accessibility updates never alter verification results (Stage 4.2 §19).
- Verification recording is an explicit UpdateContent on `Evidence.verification_result`; **no automatic verification**; "Cannot Verify" is honestly representable.
- Public display respects accessibility (§6).

## 10. Publication-State Interface Behavior
- Only PublishContent and UnpublishContent change publication_state (Stage 4.2 §8, §17).
- All public queries filter to Published; Draft/Unpublished content is excluded from public presentation.
- No universal Content wrapper; publication state is authoritative on the content-managed entities (Stage 4.3 §13).
- Exact visibility-derivation algorithm: **DEFERRED** (presentation-layer rule, not yet authorized).

## 11. Validation Responsibilities
- **Interface layer:** required/optional fields per the Stage 4.3 attribute tables (§7–§12); input schema validation (Stage 4.2 §15).
- **Domain layer:** publication-state validity; Claim–Evidence–Artifact semantics; a Claim may exist without Evidence.
- **Artifact references:** URL format validation (Stage 4.2 §15); uniqueness of `Artifact.reference` (Stage 4.3 §16).
- **Evidence creation:** `claim_id` and `artifact_id` are mandatory — no nullable evidence links (Stage 4.3 §11).

## 12. Error Model
Conceptual categories mapped to Stage 4.2 §16 semantics:

| Category | Contract Status | Basis |
|----------|-----------------|-------|
| Unauthenticated | 401 | Stage 4.2 §16 |
| Unauthorized / forbidden | 403 | Stage 4.2 §16 |
| Validation failure | 400 / 422 | Stage 4.2 §16 |
| Not found | 404 | Stage 4.2 §16 |
| Referential-integrity conflict (delete blocked by RESTRICT) | 409 | **DECISION:** extends Stage 4.2 semantics; required by the Stage 4.3 §20 frozen delete rules |
| Invalid state transition | 422 | Stage 4.2 §15 validation model |
| Artifact unavailable | 422 | Stage 4.2 §16 |
| External resource unreachable | 502 / 503 | Stage 4.2 §16 |
| Verification cannot be performed | 422 | Stage 4.2 §16 |
| Persistence failure | 500 | Stage 4.2 §16 |
| Unexpected system failure | 500 | Stage 4.2 §16 |

No framework-specific error classes are invented; this is a contract, not implementation.

## 13. Authorization Boundary
- **Public:** GET public pages — no authentication.
- **Protected:** all `/manage/*` operations — require authentication; mechanism **DEFERRED TO STAGE 4.5**. No sessions, tokens, cookies, OAuth providers, or password storage are designed here.
- **Privileged:** none required (administrator is optional per architecture §4.3).
- UI visibility is **not** a security boundary: authorization is enforced server-side at the Security boundary; rendering reflects authorization decisions.

## 14. Interface Traceability Matrix
| Requirement | Use Case(s) | Domain Concept | Module | Interface Operation(s) |
|-------------|-------------|----------------|--------|------------------------|
| FR-001 P0 | View Professional Profile; edit profile | Professional Identity | Content Mgmt + Public Presentation | GET `/`; GET+POST `/manage/profile` |
| FR-002 P0 | View Published Projects; View Project Details; content CRUD | Project, Evidence, Artifact | Content Mgmt + Public Presentation + Evidence Store | GET `/projects`, `/projects/:idOrSlug`; `/manage/projects` CRUD |
| FR-003 P0 | View Claim and Supporting Evidence; Associate Evidence with Claim; claim CRUD | Claim, Evidence, Artifact | Content Mgmt + Evidence Store + Public Presentation | Embedded in detail views; `/manage/claims`; `/manage/evidence` |
| FR-004 P0 | View Published Skills; skill CRUD | Skill | Content Mgmt + Public Presentation | GET `/skills`, `/skills/:idOrSlug`; `/manage/skills` CRUD |
| FR-005 P0 | Full management suite (create/edit/delete/publish/unpublish/preview) | Content, Publication State | Content Mgmt (+ Security guard) | `/manage/*` suite |
| FR-006 P0 | Inspect Evidence Accessibility; Update Evidence Accessibility | Evidence, Accessibility | Evidence Store + Public Presentation | Embedded evidence display; `/manage/evidence/:id/accessibility` |
| FR-007 P1 | Generate CV (future/deferred) | — | — | **DEFERRED** (no endpoint; persistence representation deferred, Stage 4.3 §28) |
| FR-008 P0 | View on any device | — (presentation concern) | Public Presentation | Server-rendered views; responsive layout details **DEFERRED** to UX stage |
| FR-009 P1 | Accessible navigation | — (presentation concern) | Public Presentation | Accessible markup required by contract; verification in testing stage |
| FR-010 P1 | Fast loading | — | — | **DEFERRED** (no interface-level optimization designed) |
| NFR-001 P1 | Authenticate; protected management | — (Security concern) | Security | `/manage/*` guard; login mechanism **DEFERRED TO STAGE 4.5** |
| NFR-002 P0 | Content updates without code changes | Content, Publication State | Content Mgmt + Public Presentation | Management writes; public views render persisted content |
| C-001 P0 | — (process constraint) | — | — | No speculative endpoints; simplest interface style (§5) |
| C-002 P0 | — (process constraint) | — | — | Evidence-first: evidence display and verification guidance are first-class in the public interface |

## 15. Deferred and Unsupported Interfaces
- **DEFERRED TO STAGE 4.5:** authentication mechanism, session storage, credential handling, login implementation.
- **DEFERRED (later stages):** visibility-derivation algorithm (presentation); responsive/accessibility implementation details (UX stage); verification testing (testing stage); CV generation interface (FR-007); performance optimization (FR-010); JSON API (only if a future requirement justifies).
- **UNSUPPORTED:** artifact deletion endpoint (Stage 4.2 defines no DeleteArtifact command; artifact cleanup recorded as a gap — **DEFERRED** operational concern); public write operations (no requirement; violates the boundary); direct Claim–Artifact linking without Evidence (violates the frozen evidence model).

## 16. Frozen-Invariant Contradiction Audit
| Invariant | Status | Evidence |
|-----------|--------|----------|
| Claim 1:N Evidence N:1 Artifact | PRESERVED | CreateEvidence requires exactly one claim and one artifact; GetEvidenceByClaim returns zero-or-many; no 1:1 introduced (§9) |
| No automatic verification | PRESERVED | verification_result only via explicit UpdateContent (§9) |
| No publication_state on Evidence or Artifact | PRESERVED | §6/§7/§10; Stage 4.3 §13 |
| No direct Claim–Artifact ownership | PRESERVED | Evidence mediates all claim–artifact linkage (§9) |
| No universal Content wrapper | PRESERVED | Operations target entity types; §7 entityType note |
| Public Presentation read-oriented | PRESERVED | Public boundary is GET-only (§6) |
| Private Management protected | PRESERVED | All `/manage/*` require authentication (§7, §13) |
| No credentials persisted | PRESERVED | No credential handling designed (§13) |
| No unsupported endpoints | PRESERVED | Every operation traces to a requirement/use case; artifact deletion explicitly absent (§7) |
| Stage 4.3 delete rules | PRESERVED | DeleteClaim cascades to Evidence only; DeleteContent blocked → 409 (§7, §12) |

## 17. Risks
- Route/verb choices are design-level; implementation may adjust paths within the contract's semantics (Constitution 20).
- The 409 extension of Stage 4.2 error semantics must be honored by the implementation; misclassification would hide referential-integrity failures.
- Preview rendering must not leak unpublished content into caches (presentation concern, DEFERRED).
- The artifact-lifecycle gap (no deletion interface) may accumulate unreferenced artifact records over time (operational concern, DEFERRED).

## 18. Acceptance Criteria
- Every interface traces to a requirement, use case, domain concept, or architectural responsibility.
- All frozen evidence, publication, authorization, and persistence invariants are preserved (§16).
- No implementation artifacts are created.
- All deferred/unsupported items are explicitly marked (§15).

## 19. Status
DRAFT — STAGE 4.4 COMPLETE — AWAITING AUDIT
