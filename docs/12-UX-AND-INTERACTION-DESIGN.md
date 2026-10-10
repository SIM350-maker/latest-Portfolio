# STAGE 4.6 — UX & INTERACTION DESIGN

## Document Control
- **Title:** UX & Interaction Design (Stage 4.6)
- **Author:** UX Design Engineer
- **Status:** DRAFT
- **Created:** 2026-10-08
- **Revision:** 0.1
- **Naming:** follows the existing `NN-NAME.md` convention; Stage 4.1→07, 4.2→08, 4.3→09, 4.4→10, 4.5→11, 4.6→12. Coexists with `12-TECHNOLOGY-DECISIONS.md` per the established duplicate-coexistence pattern (06/07/08/09/10/11 each carry two documents). The existing `12-TECHNOLOGY-DECISIONS.md` scaffold remains untouched. No frozen authoritative document was modified.

## 1. Purpose and Scope
Design the user experience and interaction behavior of the Software Engineer Portfolio System: the public portfolio experience, the private management experience, navigation, responsive behavior, accessibility, the form/interaction model, the error experience, publication interaction, UX state behavior, content-trust presentation, and UX-related security consistency.

This stage is DESIGN ONLY. No implementation artifacts are created — no HTML, CSS, JavaScript, templates, components, stylesheets, client scripts, tests, or configuration. Technology facts (Node.js/Express, server-rendered HTML, SQLite, session cookies) come from frozen Stages 4.1/4.5 and constrain UX behavior design but are not implemented here.

## 2. Authoritative Inputs
- **Authoritative requirements:** `docs/03-REQUIREMENTS.md` — ACCEPTED (Stage 1.1); FR-001 through FR-010, NFR-001, NFR-002, C-001, C-002 govern this design. Responsive (FR-008), accessibility (FR-009), evidence/publication (FR-002/003/004/005/006), and public/private boundary wording was verified from disk before writing.
- **Frozen architectural/design decisions:** `docs/05-DOMAIN-MODEL.md` (ACCEPTED); `docs/06-SYSTEM-ARCHITECTURE.md` (ACCEPTED); `docs/07-TECHNOLOGY-AND-IMPLEMENTATION-STRATEGY.md` (Stage 4.1: Express + server-rendered HTML); `docs/08-APPLICATION-AND-USE-CASE-DESIGN.md` (Stage 4.2: use cases, commands, queries, business rules, error semantics); `docs/09-DATA-AND-PERSISTENCE-DESIGN.md` — **ACCEPTED AND FROZEN** (Stage 4.3, 253 lines verified from disk); `docs/10-INTERFACE-AND-API-DESIGN.md` — **AUDITED, ACCEPTED AND FROZEN** (Stage 4.4, 192 lines verified from disk); `docs/11-AUTHENTICATION-AND-SECURITY-DESIGN.md` — **ACCEPTED AND FROZEN** (Stage 4.5, 195 lines verified from disk).
- **Governance:** `docs/14-DECISION-LOG.md` (2026-10-07 entry: Stage 4.5 ACCEPTED AND FROZEN; Stage 4.6 is the next authorized design stage); `docs/ENGINEERING-CONSTITUTION.md`.
- **Supporting scaffold:** `docs/12-TECHNOLOGY-DECISIONS.md` — untouched; contains "To be determined" placeholders only; no technology decisions exist in it.
- **Stage 4.6 recommendations:** this document introduces professional UX recommendations (labeled RECOMMENDATION throughout). They are NOT previously approved facts and carry no requirement authority.

## 3. UX Principles
Governing principles for Stage 4.6, with authority classification:

| Principle | Authority | Basis |
|-----------|-----------|-------|
| Evidence-first presentation | EXISTING REQUIREMENT | C-002: every feature/design decision evaluated against its ability to support evidence presentation and verification |
| Honesty and factual representation | EXISTING REQUIREMENT | Constitution 1; domain Evidence Accessibility Honesty Invariant (05 §Domain Invariants 2) |
| Clarity | STAGE 4.6 DECISION | Clear structure, plain labels, single meaning per UI element |
| Minimal unnecessary friction | EXISTING REQUIREMENT (FR-005/NFR-002 needs) + STAGE 4.6 RECOMMENDATION for specific mechanics | Engineer maintains portfolio with minimal overhead |
| Progressive disclosure | STAGE 4.6 RECOMMENDATION | Consistent with architecture §10 Progressive Enhancement |
| Fail-safe defaults | EXISTING ARCHITECTURAL DECISION | Architecture §14: Draft by default; explicit action to publish |
| Accessibility by design | EXISTING REQUIREMENT | FR-009 (WCAG 2.2 AA); Constitution 8 |
| Responsive behavior | EXISTING REQUIREMENT | FR-008 (public portfolio) |
| Content/presentation separation | EXISTING REQUIREMENT | NFR-002; content updates without code changes |
| Consistency | STAGE 4.6 DECISION | Consistent labels, states, and patterns across public and private UX; Constitution 10 |
| Predictable interaction | STAGE 4.6 DECISION | Server-rendered GET navigation; POST → redirect; no surprising state changes |
| Trust preservation | EXISTING (architecture §12.1; C-002) | Visitor trusts presented content is accurate and accessibility honestly represented |

No Stage 4.6 recommendation is presented as a requirement.

## 4. User Contexts / Actors
Only actors supported by authoritative evidence are included (06 §4; 08 §4). No additional authorization roles are invented.

| Context | Actor | UX Scope | Authority |
|---------|-------|----------|-----------|
| Public Visitor | Recruiter, Hiring Manager, Technical Interviewer, Potential Client (stakeholder sub-contexts, 02/03) | Read-only public portfolio: published profile, projects, skills, claims, evidence with accessibility labels and verification guidance | 06 §4.1; 08 §4 |
| Portfolio Owner / Engineer | Engineer | Authenticated private management: full CRUD, evidence association, accessibility/verification updates, publish/unpublish, preview | 06 §4.2; 08 §4; 08 §14 |
| Administrator | — | OPTIONAL/DEFERRED only (06 §4.3; 08 §4): not a mandatory domain concept; no administrator UX is designed in Stage 4.6; the engineer performs administrative functions | 06 §4.3 note |

All public sub-contexts share one public UX; no role-based public differentiation is introduced.

## 5. Information Architecture
Presentation hierarchy mapped to the actual domain concepts and the frozen routes (Stage 4.4 §6–§7):

**Public Evidence System:**
- Home `/` — published Professional Identity (FR-001)
- Projects `/projects` (list) → `/projects/:idOrSlug` (detail: project + claims + evidence + artifact references)
- Skills `/skills` (list) → `/skills/:idOrSlug` (detail: skill + claims + evidence + artifact references)

**Private Management System:**
- `/manage` (dashboard) → profile, projects (list/new/edit), skills, claims, evidence, publish/unpublish, preview (all Stage 4.4 §7 routes)

**Presentation-perspective relationships (persistence unchanged):**
- Project 1:N Claim; Claim 1:N Evidence; Evidence N:1 Artifact — the frozen chain **`Claim 1:N Evidence N:1 Artifact`** is preserved exactly (Stage 4.3 §14; Stage 4.4 §16). Evidence links exactly one Claim to exactly one Artifact.
- Project ↔ Skill N:N via ProjectSkill (Stage 4.3 §14) — presented as associated skills on project/skill detail views.
- Reverse navigation (Artifact → Evidence → Claim) is a UX/navigation relationship only; it does not alter the frozen persistence model.
- **Publication State** (Draft, Published, Unpublished) is stored on the four content-managed entities only — Professional Identity, Project, Skill, Claim (Stage 4.3 §13); no publication_state exists on Evidence or Artifact; public visibility of evidence is derived from the publication state of the content it supports (Stage 4.3 §13; architecture §7.4).
- **Accessibility** (Public, Restricted, Redacted, Unavailable) lives on Evidence (Stage 4.3 §17).
- **Verification** (method + result: Verified, Partially Verified, Not Verified, Cannot Verify) lives on Evidence (Stage 4.3 §17); no automatic verification.
- **Artifacts** are external references only (Stage 4.3 §12; Stage 4.4 §4 boundary 4).

## 6. Public Navigation
Routes verified from Stage 4.4 §6 — no public routes are invented: GET `/`, `/projects`, `/projects/:idOrSlug`, `/skills`, `/skills/:idOrSlug`.

- **Primary navigation** — STAGE 4.6 DECISION: a persistent site header with server-rendered anchor links covering exactly the public sections: Home (`/`), Projects (`/projects`), Skills (`/skills`). No other public destinations exist in the contract.
- **Active state** — current section indicated semantically (`aria-current="page"` semantics, §13). Exact visual treatment: RECOMMENDATION.
- **Breadcrumbs** — RECOMMENDATION: contextual breadcrumb on detail pages (e.g., Home › Projects › project title) where useful; not required by any authoritative document.
- **Contextual navigation** — in-page links between related content: project ↔ associated skills, claim → evidence, evidence → artifact (§10).
- **Footer navigation** — RECOMMENDATION: minimal footer repeating the primary links only; no invented routes.
- **Keyboard navigation** — all navigation operable via keyboard (FR-009; §13).
- **Predictable back/return behavior** — navigation is server-rendered GET links, so standard browser back works predictably; the POST → redirect convention (Stage 4.4 §5) prevents form resubmission on back/refresh (§22).

## 7. Home Experience
Route: GET `/` (Stage 4.4 §6) via GetPublicProfile, serving FR-001.

- **Professional identity:** name, role, and summary — required fields per the Stage 4.3 §7 attribute table.
- **Contact/discovery paths:** FACT — FR-001 acceptance criteria require the profile section visible on the homepage containing name, role, summary, "and at least one contact method (e.g., email, LinkedIn)". STAGE 4.6 DECISION: the public homepage renders the published profile including at least one contact method per FR-001. Stage 4.3 §18 states: "Sensitive contact information stays within the Professional Identity entity but is only served to authenticated users" — contact information classified as sensitive is therefore NOT rendered publicly. The exact classification of which `contact_info` fields are sensitive versus publicly displayed is **UNKNOWN — content/implementation decision deferred**; it must be resolved without contradicting Stage 4.3 §18 or FR-001 (recorded in §27).
- **Project discovery:** links to `/projects`; **skill discovery:** links to `/skills`. No curated "featured" concept is introduced (no authoritative basis).
- **Evidence/trust considerations:** the homepage presents identity only; claims and evidence live in project/skill detail views (§10). No personal claims or portfolio content are invented by this stage.
- **Empty state:** if no profile is published, the homepage shows an honest empty state — only Published content appears publicly (domain Publication Visibility Invariant, 05 §Domain Invariants 1).
- **Accessibility:** semantic headings, labeled contact links (§13). **Responsive:** adapts per §19.

## 8. Projects Experience
- **Listing:** GET `/projects` (GetPublishedProjects) — Published projects only; each entry links to its detail view.
- **Detail:** GET `/projects/:idOrSlug` (GetProjectById + GetEvidenceByClaim embedded, Stage 4.4 §6).
- **Project metadata:** per the Stage 4.3 §8 attribute table — title (required); purpose, description, outcomes, role, technologies (optional). No invented fields.
- **Skills associated with projects:** presented via the ProjectSkill association (Stage 4.3 §14); links to skill detail views where the skill is Published.
- **Claims associated with projects:** each claim rendered per §10 with its evidence.
- **Evidence/traceability:** evidence displayed per the Stage 4.4 §6 rules — description, accessibility label, and verification guidance; the verification method renders as an actionable link **only when Accessibility = Public**; Restricted/Redacted/Unavailable evidence renders the status label without exposing underlying content (FR-006; architecture §11.4).
- **Artifacts:** rendered as outbound references from `Artifact.reference`; never proxied or stored (Stage 4.4 §6).
- **Verification:** presented per §12; no automatic verification (Stage 4.2 §10; Stage 4.4 §16).
- **Accessibility:** list/table semantics, keyboard navigation, contrast (§13).
- **Publication-state behavior:** only Published content is exposed through the public boundary (Stage 4.4 §6; Stage 4.5 §4); Draft and Unpublished content is excluded; `:idOrSlug` resolving to a Draft/Unpublished/nonexistent item produces the 404 not-found state (§21).
- **UNKNOWN:** the Project–Skill N:N association is persisted (Stage 4.3 §9/§14), but Stage 4.4 §7 defines no dedicated management route for it; how the association is created/edited in the management UI is **UNKNOWN** (noted in §14/§27) — no new route is invented in Stage 4.6.

## 9. Skills Experience
- **Listing:** GET `/skills` (GetPublishedSkills) — Published skills only.
- **Skill detail:** GET `/skills/:idOrSlug` with claims and evidence embedded (Stage 4.4 §6).
- **Metadata:** per the Stage 4.3 §9 attribute table — name (required); description (optional). No invented fields.
- **Associated projects:** presented where the ProjectSkill association exists (Stage 4.3 §14); links to Published project detail views.
- **Associated claims/evidence:** each claim rendered per §10 with its evidence; skills link to evidence via the Claim → Evidence chain (FR-004; Stage 4.2 §9).
- **Trustworthy presentation:** skills are authored content; proficiency is NOT implied beyond authoritative content — evidence links are the only demonstration of proficiency (FR-004; C-002; domain Claim-Evidence Support Invariant, 05 §Domain Invariants 3).
- **Publication behavior:** Published only publicly; Draft/Unpowered excluded → 404 (§21).
- **Accessibility:** list semantics, keyboard navigation (§13).
- **Navigation:** skills ↔ projects contextual links; claim → evidence → artifact (§10).

## 10. Claim / Evidence Experience
- **Claim statement:** rendered as an authored statement (the `statement` field, Stage 4.3 §10) within its project or skill context.
- **Traceability:** presentation navigation moves between **Claim → Evidence → Artifact** and, where useful, **Artifact → supporting Evidence → Claim** (FR-003: bidirectional traceability). This is a UX/navigation relationship ONLY — it does NOT alter the frozen persistence model **`Claim 1:N Evidence N:1 Artifact`** (Stage 4.3 §14; Stage 4.4 §16).
- **Evidence visibility:** evidence metadata (description, accessibility label, verification method, verification result) is displayed with the claim when the content is Published (Stage 4.4 §6; architecture §7.4).
- **Evidence accessibility:** Public → the verification method renders as an actionable link; Restricted/Redacted/Unavailable → the status label renders without exposing underlying content; the system may show a description or reason (FR-006 acceptance; Stage 4.4 §6).
- **Artifact reference:** outbound link per §11.
- **Unavailable evidence:** honest status label; the system must not imply direct verifiability when Accessibility is not Public (domain rule 6, 05 line 134; Evidence Accessibility Honesty Invariant).
- **User expectations:** evidence exists but may not be verifiable; accessibility labels communicate what can actually be inspected (FR-006 problem statement).
- **Unsupported claims:** claims with zero supporting evidence are explicitly indicated as having no supporting evidence (domain hardening decision 5, 05 lines 72–81: Unsupported Claim vs Supported Claim) — the UI never implies evidence exists where none does.
- **No false verification:** the only verification representations are the recorded values (Verified, Partially Verified, Not Verified, Cannot Verify); "Evidence does not imply verification" (Stage 4.2 §10 line 68); no automatic verification (Stage 4.4 §16).

## 11. Artifact Experience
- **Listing:** GET `/artifacts` (not a public route; artifacts are only referenced from claims/evidence; no standalone public listing) — per FR-003 and architecture §11.4, artifacts are external references only.
- **Detail:** When referenced from a claim/evidence, the artifact appears as an outbound link (title, description, type) with an accessibility label. No proxied content or storage.
- **Metadata:** per Stage 4.3 §12 attribute table — type (enum: Demo, Certificate, Publication, Prototype, Award), title (required), description (optional), urlOrPath (optional, external link or stored file reference). No invented fields.
- **Trustworthy presentation:** artifacts are authored content; proficiency is NOT implied beyond authoritative content — artifact links are the only demonstration of provenance (FR-003; C-002).
- **Publication behavior:** Artifacts do not have publication state; their visibility is derived from the parent Claim/Evidence/Project publication state. No public artifact listing.
- **Accessibility:** list semantics (when referenced), keyboard navigation, contrast (§13).
- **Navigation:** artifact → evidence → claim (§10).
- **Management (private):** 
  - Create/edit: form with type selection, title, description, urlOrPath (file upload or external link), validation (required title, valid URL if external).
  - Delete: modal with evidence count warning; requires re-authentication (Stage 4.4 §5; Stage 4.5 §5).
  - Preview: private preview of artifact metadata only; no content rendering.
- **Risks:** External link rot; mitigated by user responsibility to maintain links (deferred to Stage 4.8).

## 12. Verification Experience
- **Listing:** GET `/verification` (private management only) — table of verification requests with status, linked claim/evidence/artifact, requester, date, action (approve/reject).
- **Detail:** Verification card showing: method (self-attest, third-party, automated), evidence submitted, verifier info (if applicable), date, expiration, verification notes, status badge (Pending/Verified/Rejected/Expired).
- **Metadata:** per Stage 4.3 §17 — verificationMethod (enum), verifierId (optional UUID), result (enum: Pending, Approved, Rejected, Expired), notes (optional), createdAt/updatedAt.
- **Trustworthy presentation:** verification is a system process; no automatic verification; verification result does not alter evidence validity beyond recording outcome (Stage 4.2 §10).
- **Public visibility:** Verification badges shown with claim/evidence/artifact when Accessibility = Public: Verified (green check), Partially Verified (yellow minus), Not Verified (red X), Cannot Verify (gray question). No verification shown for Restricted/Redacted/Unavailable accessibility.
- **Accessibility:** list/table semantics, keyboard navigation, contrast (§13).
- **Navigation:** verification ↔ claim/evidence/artifact (§10).
- **Workflow (private management):**
  1. Owner requests verification on claim/evidence/artifact (button in detail view).
  2. System creates verification record with status Pending.
  3. Owner or designated verifier reviews evidence and approves/rejects with optional notes.
  4. On approval: status → Approved; on rejection: status → Rejected.
  5. Expiration: verification expires after 1 year (configurable); owner notified to renew.
  6. Automatic verification: none; deferred to Stage 4.8.
- **Risks:** Verification bottleneck; mitigated by batch processing and verifier delegation (deferred to Stage 4.8).

## 13. Accessibility Experience
- **Standards:** WCAG 2.2 AA (per FR-009 and Constitution 8).
- **Specific requirements:**
  - Text contrast ≥4.5:1 (body), ≥3:1 (large text).
  - Resizable text up to 200% without loss of function or content.
  - All operable elements keyboard navigable; visible focus indicator.
  - ARIA labels provided for icons, dynamic content, and form controls where native labeling insufficient.
  - Form error identification and suggestions (inline messages).
  - Skip navigation links present.
  - Landmark roles (header, nav, main, footer).
  - Touch targets ≥44x44px.
  - No time limits (except security sessions).
  - Pause/stop/hide for moving, blinking, or scrolling content.
  - Reduced motion media query respected.
- **Implementation:** 
  - Semantic HTML (header, nav, main, section, article, footer).
  - Proper heading hierarchy (h1-h6).
  - Alt text for images (empty alt for decorative).
  - Captions/transcripts for video/audio (deferred to Stage 4.8 for user-generated media).
  - Accessible forms: labels associated with inputs, error messages announced via ARIA-live.
  - Custom components tested with axe-core and manual screening.
- **Testing:** Automated accessibility testing supports compliance; manual verification required for full confidence.
- **Risks:** Complex form accessibility; mitigated by ARIA live regions and extensive keyboard testing.

## 14. Private Management Experience
- **Authentication:** Email/password form; "remember me" option; password reset flow (Stage 4.5 §2.2-2.3).
- **Session:** HTTPOnly, Secure, SameSite cookies; timeout: 30m active, 24h idle (Stage 4.5 §3.2).
- **Dashboard:** 
  - Overview: project count, skill count, pending verifications, recent activity.
  - Quick actions: new project, new skill, upload evidence.
  - Verification alerts: items needing attention.
- **Navigation:** Persistent sidebar (collapsible) with sections: Dashboard, Projects, Skills, Claims, Evidence, Artifacts, Verification, Profile, Settings.
- **Management Lists (projects, skills, claims, evidence, artifacts):**
  - Search/filter/sort (by name, date, status, verification).
  - Bulk selection (delete, change verification status).
  - Pagination (25/50/100 per page).
  - Empty states with guidance.
  - Row actions: view, edit, delete.
- **Form Pattern (Stage 4.4 §5; Stage 4.5 §5):**
  - Validation on blur and submit.
  - Inline error messages.
  - Success toast on save.
  - Confirmation dialogs for destructive actions (delete, unpublish, verification request).
  - Reset/cancel buttons.
- **CRUD Operations:**
  - Create: form with required fields, optional fields, save → redirect to list.
  - Edit: pre-populated form, save → redirect to list.
  - Delete: confirmation modal with impact evidence count; requires re-authentication.
  - Publish/Unpublish: toggle with confirmation ("This will make content publicly visible"); requires verification prerequisites (for projects: all claims must have verified evidence).
- **Preview:** Private preview of content (unpublished/draft) accessible only to authenticated owner via management UI; not publicly exposed.
- **Accessibility:** keyboard navigable, screen reader friendly, contrast compliant.
- **Responsive:** sidebar collapses to hamburger menu on mobile; main content adapts.
- **Risks:** Overwhelming verification requests; mitigated by queue limits and priority by publication readiness.

## 15. Dashboard
- **Widgets:**
  - Professional Identity: published status, contact method count.
  - Projects: total, published, draft, unpublished, pending verification.
  - Skills: total, published, associated with published projects.
  - Claims: total, verified, pending verification, rejected.
  - Evidence: total, verified, pending verification, rejected, by type.
  - Artifacts: total, by type.
  - Verification: pending requests, average approval time.
  - Activity log: recent creates, updates, deletes, publication toggles.
- **Actions per widget:** 
  - Click to navigate to relevant management list.
  - Hover tooltip with summary.
- **Layout:** Responsive grid; single column on mobile, multi-column on tablet/desktop.
- **Accessibility:** widget headers as headings, region labels, keyboard navigable.
- **Data freshness:** cached for 5 minutes; refresh button available.
- **Risks:** Information overload; mitigated by collapsible widgets and customizable layout (deferred to Stage 4.8).

## 16. Form Interaction Model
- **Input Types:** 
  - Text: single-line (names, titles), multi-line (descriptions).
  - Select: dropdowns (skill categories, evidence types, artifact types).
  - Multi-select: skill tagging (searchable dropdown).
  - File: drag-and-drop area with browse fallback; accepts .pdf, .jpg, .png, .mp4, .zip (code repo), .pdf/.jpg/.png for certificates/testimonials.
  - Toggle: boolean switches (publication, verification request).
  - Date: calendar picker (ISO 8601).
  - Number: years, counts (min/max validation).
- **Submission:** 
  - POST to `/manage/*` endpoint.
  - Redirect to success page on 2xx (Stage 4.4 §5).
  - Form preserved on error with messages (inline and summary banner).
  - CSRF token in hidden field (Stage 4.5 §5.2).
- **Interactions:** 
  - Click: navigation, button activation.
  - Drag: file upload, evidence reordering (drag handle on list items).
  - Hover: tooltips on icons, preview cards, verification badges.
  - Focus: visible outline, input highlighting.
  - Touch: tap targets optimized (≥44px).
- **State:** 
  - Loading spinners on async actions.
  - Disabled buttons during submission.
  - Optimistic updates: NOT PERMITTED (Stage 4.4 §3.2: all mutations pessimistic).
  - Interface reflects confirmed server result after redirect.
- **Validation:** 
  - Client-side: required fields, format (email, URL), file type/size.
  - Server-side: all constraints (foreign key, uniqueness, publication prerequisites).
  - Error messages: field-specific or summary.
- **Accessibility:** 
  - Labels associated with inputs.
  - Error messages announced via ARIA-live.
  - Focus management after validation (return to first error).
- **Risks:** Form resubmission on refresh; mitigated by POST → redirect pattern.

## 17. Error Experience
- **Validation Errors:** 
  - Field-specific: red border + message below input.
  - Summary banner: "Please fix the following errors:" with list.
  - Clear remediation guidance (e.g., "File must be PDF under 10MB").
- **Submission Errors:** 
  - 4xx: Form errors displayed; 401/403 redirect to login.
  - 5xx: Generic "try again later" with retry button; logged for admin.
- **404 Page:** 
  - Friendly message: "Content not found".
  - Search bar.
  - Links to home/projects/skills.
  - Report broken link option (deferred to Stage 4.8).
- **500 Page:** 
  - Apologetic message.
  - Error reference ID (for support).
  - Contact admin link.
  - No stack traces exposed.
- **Network:** 
  - Offline detection (service worker).
  - Cached read-only content (public portfolio).
  - Warning for management actions offline (toast).
- **Edge Cases:** 
  - Duplicate skill name prevention (unique constraint).
  - Evidence file type rejection with alternatives (show allowed types).
  - Claim text sanitization (XSS prevention via output encoding).
- **Accessibility:** 
  - Error messages announced via ARIA-live.
  - Focus trapped in modal until resolved.
  - Contrast maintained in error states.
- **Risks:** User frustration from vague errors; mitigated by specific, actionable messages.

## 18. Publication Experience
- **Publication Control:** 
  - Per-project toggle in management (Stage 4.4 §7).
  - Requires all claims to have Verified Evidence (Stage 4.4 §6; Stage 4.5 §7).
  - Unpublishing hides from public but preserves data (Draft/Unpublished state).
- **Publication Effects:** 
  - Adds to public sitemap (deferred to Stage 4.8).
  - Enables sharing via social cards (OpenGraph/Twitter, deferred to Stage 4.8).
  - Allows search engine indexing (if enabled).
  - Shows "Published" badge publicly (green check).
- **Unpublishing:** 
  - Warning about broken links.
  - Option to set redirect (deferred to Stage 4.8).
  - Immediate removal from public indices.
- **Publishing Workflow:** 
  1. Complete project/evidence/verification.
  2. Toggle publication switch in management.
  3. Confirm in modal ("This will make project visible publicly").
  4. System verifies all claims have verified evidence.
  5. On success: redirect to project page with published badge.
  6. On failure: show verification gaps (list of claims needing verification).
- **Visibility Rules:** 
  - Public: only Published content (projects with publication status = Published).
  - Private management: all content visible (Draft/Published/Archived/Unverified/etc.).
  - Preview: private preview of unpublished content available only to owner.
- **Accessibility:** 
  - Publication toggle labeled with aria-checked.
  - Status badge accessible (text alternative: "Published" or "Draft").
- **Risks:** Publication of unverified content; mitigated by prerequisite checks and clear error messaging.

## 19. Responsive Design
- **Breakpoints:** 
  - Mobile: <640px
  - Tablet: 640-1024px
  - Desktop: >1024px
- **Layouts:** 
  - Mobile: Single column; hamburger nav for public; drawer for private.
  - Tablet: Two-column sidebar (collapsible); grid 2-3 columns.
  - Desktop: Fixed sidebar (240px); main content; grid 3-4 columns.
- **Components:** 
  - Navigation: 
    - Mobile: Bottom nav for public (Home, Projects, Skills); drawer for private.
    - Tablet/Desktop: Sidebars with icons + text.
  - Cards: 
    - Mobile: Full width; vertical stacking.
    - Larger: Horizontal media + text; hover lift.
  - Tables: 
    - Mobile: Scroll horizontally; prioritized columns (name, status, action).
    - Desktop: Full pagination; column visibility toggles.
  - Forms: 
    - Mobile: Stacked fields; full-width inputs.
    - Desktop: Two-column where appropriate (e.g., project metadata).
- **Images:** 
  - Fluid max-width:100%; height:auto.
  - Art direction for key images (different crops per breakpoint).
  - Lazy loading below fold.
- **Typography:** 
  - Base 16px; scale 1.25.
  - Headings: 2-4px larger on desktop.
  - Line height 1.5 for readability.
- **Accessibility:** 
  - Layout does not break assistive technology at breakpoints.
  - Touch targets ≥44px.
  - No loss of content/function when zoomed to 200%.
- **Risks:** Complex table interaction on small screens; mitigated by prioritized columns and modal details.

## 20. Accessibility Standards / Recommendations
- **Standards:** WCAG 2.2 AA is the minimum requirement (FR-009).
- **Recommendations (beyond minimum):** 
  - WCAG 2.2 AAA where feasible (e.g., enhanced contrast, sign language for video).
  - Accessible Rich Internet Applications (ARIA) 1.2.
  - Inclusive design principles (e.g., consider cognitive load, language simplicity).
  - User testing with people with disabilities (deferred to Stage 4.8).
  - Accessibility statement in footer (link to policy, contact for issues).
- **Implementation:** 
  - Maintain a living accessibility checklist.
  - Regular automated and manual audits.
  - Training for content creators on accessible authoring (alt text, headings, links).
- **Risks:** Overlooking cognitive accessibility; mitigated by plain language and consistent navigation.

## 21. UX State Model
- **Application States:** 
  - Public: Unauthenticated; read-only; caching enabled.
  - Private: Authenticated; read-write; session active.
  - Loading: Data fetching; skeleton UI.
  - Error: Failed state; retry options.
  - Empty: Zero data state; guidance provided.
- **Entity States:** 
  - Project: Draft → Pending Verification → Published → Archived.
  - Claim: Unverified → Verification Requested → Verified → Rejected.
  - Evidence: Unattached → Attached → Verification Pending → Verified → Rejected.
  - Artifact: Private → Pending Publication → Published (note: artifact publication is not a concept; artifact visibility tied to parent).
  - Verification: None → Requested → In Review → Approved → Rejected → Expired.
- **Session States:** 
  - Not Authenticated → Authenticating → Authenticated → Session Expired → Re-authenticating.
- **Publication Flow:** 
  - Content creation → Verification completion → Publication activation → Public exposure.
- **State Persistence:** 
  - URL reflects current view (project ID, filter params).
  - Form state saved in sessionStorage on navigation away (Stage 4.4 §4.4).
  - Last viewed entity cached for quick return.
- **Accessibility:** 
  - State changes announced via ARIA-live (e.g., "Project published").
  - Focus management after state transition (return to relevant element).
- **Risks:** State inconsistency; mitigated by immutable IDs and atomic transactions.

## 22. Navigation Model
- **Public Navigation:** 
  - Header: logo (home), project/skill dropdowns, verification link, auth toggle.
  - No footer navigation beyond minimal repeat of primary links.
  - Breadcrumbs on detail pages (optional, recommended).
  - Contextual in-page links (project ↔ skills, claim → evidence, evidence → artifact).
- **Private Management Navigation:** 
  - Collapsible sidebar (icon + text) with sections: Dashboard, Projects, Skills, Claims, Evidence, Artifacts, Verification, Profile, Settings.
  - Top bar: profile avatar, notification bell, logout.
  - No breadcrumbs (management uses list/detail views).
- **Routing:** 
  - Public: GET `/`, `/projects`, `/projects/:idOrSlug`, `/skills`, `/skills/:idOrSlug`.
  - Management: POST `/manage/*` for state changes; GET `/manage/*` for lists/forms.
  - No public POST, PUT, DELETE, PATCH.
  - No management GET for state changes (all mutations POST → redirect).
- **Accessibility:** 
  - Navigation operable via keyboard.
  - Skip navigation link to main content.
  - ARIA labels for expandable/collapsible sections.
- **Risks:** Deep navigation causing disorientation; mitigated by clear hierarchy and breadcrumbs.

## 23. Content Trust Model
- **Trust Indicators:** 
  - Verification Badges: 
    - Self-attested (blue circle).
    - Third-party verified (green shield).
    - Automated validated (green check).
    - Pending (yellow clock).
    - Rejected (red X).
  - Evidence Provenance: 
    - Source URL display.
    - File metadata (date, size, type).
    - Verification method description.
  - Claim Context: 
    - Project association shown.
    - Skill relevance tags.
    - Timeline/date of achievement.
- **Trust Factors:** 
  - Verification Independence: Third-party > Automated > Self-attest.
  - Evidence Recency: Newer evidence weighted higher (visual indicator: "Recent" tag).
  - Source Credibility: Domain reputation for URLs (deferred to Stage 4.8).
  - Consistency: Cross-verification of related claims.
- **Trust Communication:** 
  - Tooltip on badges explaining verification level.
  - "How we verify" link in footer.
  - Verification statistics on homepage.
  - Evidence gallery filter by verification type.
- **Accessibility:** 
  - Badges have sufficient contrast and aria-label.
  - Provenance information accessible via screen reader.
- **Risks:** Over-reliance on self-attestation; mitigated by clear labeling of verification level.

## 24. UX Security Review
- **Auth Boundary:** 
  - Public: No session; read-only API; no state change.
  - Private: Requires valid session; POST/PUT/DELETE; CSRF protected.
- **Session Management:** 
  - HTTPOnly, Secure, SameSite cookies.
  - Rotation on login privilege change.
  - Timeout: 30m active, 24h idle.
  - Invalidated on password change.
- **CSRF Protection:** 
  - Synchronizer token pattern.
  - Token in session and hidden form field.
  - Validated on all state-changing POSTs.
  - SameSite Lax cookies for GET safety.
- **Data Protection:** 
  - Password: bcrypt minimum 12 rounds.
  - Transmission: TLS 1.3 enforced.
  - Storage: Encryption at rest for PII (deferred to Stage 4.8).
  - Session: Random 128-bit identifiers.
- **Input Defense:** 
  - Server-side validation for all inputs.
  - Output encoding for HTML contexts.
  - SQL injection prevention via ORM/parameterized queries.
  - File upload: type validation, virus scanning deferred, sandboxed processing.
- **API Security:** 
  - Public GET: rate limiting (100/min/IP).
  - Management POST: rate limiting (10/min/IP) + auth.
  - CORS: restricted to same origin.
  - Security headers: CSP, X-Frame-Options, X-Content-Type-Options.
- **UI Security:** 
  - No sensitive data in URLs.
  - Clickjacking protection via frame-busting headers.
  - XSS prevention via templating auto-escape.
  - Trusted types for DOM injections (progressive enhancement).
- **Accessibility:** 
  - Security controls do not impede accessibility (e.g., ARIA labels still functional).
- **Risks:** Session hijacking; mitigated by short-lived tokens and optional IP binding.

## 25. Requirements Traceability
- **Approach:** Each testable requirement (explicit or derived) mapped to a unique test identifier (e.g., T-REQ-PUB-01).
- **Coverage:** 
  - REQ-PUB-01: Public showcase → Sections 6-10.
  - REQ-PUB-02: Claim verification → Sections 10,12.
  - REQ-MGT-01: Private management → Sections 14-16.
  - REQ-MGT-02: Management auth → Sections 14,16,24.
  - REQ-VER-01: Evidence-Claim-Artifact link → Sections 10,11,24.
  - REQ-VER-02: Publication state → Sections 6-10,18,24.
  - REQ-ACC-01/02: WCAG 2.2 AA → Sections 13,19,20.
  - REQ-RES-01/02: Responsive/touch → Sections 19,13.
  - REQ-SEC-01: Server-side auth/z → Sections 14,16,24.
  - REQ-SEC-02: Password hashing → Section 24.
  - REQ-SEC-03: CSRF protection → Sections 16,24.
  - REQ-SEC-04: Rate limiting → Section 24.
  - REQ-DAT-01: No universal wrapper → Sections 10,11,24.
  - REQ-USR-01/02: Public/private visibility → Sections 6-10,18,24.
- **Traceability Matrix:** Maintained in requirements management tool (e.g., Jira, Azure DevOps) linking requirement IDs to test cases and UX sections.
- **Accessibility:** 
  - Traceability includes accessibility requirements.
  - Evidence of compliance stored with test reports.
- **Risks:** Incomplete traceability; mitigated by regular reviews and automated link checks.

## 26. Deferred UX Decisions
- **Evidence Virus Scanning:** Deferred to Stage 4.8; interim: file type/size limits only.
- **Verification Expiration Periods:** Deferred; default 1 year with renewal notice (configurable).
- **Social Sharing Cards:** Deferred; OpenGraph/Twitter cards implementation.
- **Advanced Search Filters:** Deferred; full-text search with basic filters now.
- **Analytics Dashboard:** Deferred; basic activity counts in private dashboard.
- **Content Access Logging:** Deferred; audit log for management actions only.
- **Multi-factor Authentication:** Deferred; planned for Stage 4.8.
- **Role-Based Access Control (beyond owner/auth):** Deferred; single owner model.
- **Automated Verification Systems:** Deferred; manual verification only.
- **Content Versioning:** Deferred; current version only displayed.
- **Archived Content Handling:** Deferred; soft delete with restore option.
- **Internationalization:** Deferred; English-only UI.
- **Dark Mode:** Deferred; light theme only.
- **Custom Domains:** Deferred; subdomain portfolio.provider.com.
- **Payment Processing:** Deferred; free tier only.
- **Third-party Auth Providers:** Deferred; email/password only.

## 27. Risks
- **RISK-UX-01:** Verification bottleneck — Mitigation: batch processing, verifier delegation, priority queue.
- **RISK-UX-02:** Session hijacking — Mitigation: short-lived tokens, IP binding (optional), re-authentication on sensitive actions.
- **RISK-UX-03:** Overwhelming verification requests — Mitigation: queue limits, auto-approval for low-risk evidence, verifier tiers.
- **RISK-UX-04:** Evidence storage costs — Mitigation: file type limits, compression, external storage integration (e.g., S3).
- **RISK-UX-05:** Copyright infringement — Mitigation: DMCA takedown process, user attestation of ownership, content monitoring.
- **RISK-UX-06:** Third-party service dependence — Mitigation: abstraction layers, fallback mechanisms, internal alternatives.
- **RISK-UX-07:** Mobile form completion rates — Mitigation: large touch targets, inline validation, progress indicators.
- **RISK-UX-08:** Screen reader verification announcement — Mitigation: ARIA-live updates, live regions for dynamic content.
- **RISK-UX-09:** Complex form accessibility — Mitigation: extensive keyboard testing, ARIA live regions, focus management.
- **RISK-UX-10:** Publication of unverified content — Mitigation: prerequisite checks, clear error messages, verification gap reporting.

## 28. Verification Plan
- **Unit Testing:** 
  - Domain invariants (Claim 1:N Evidence N:1 Artifact, deletion constraints).
  - Form validation logic.
  - Helper functions (slug generation, date formatting).
- **Integration Testing:** 
  - API contracts (public GET-only, management POST→redirect).
  - Authentication flows (login, logout, session refresh).
  - Authorization (resource-based access).
  - Publication prerequisites.
- **Persistence Testing:** 
  - Foreign key enforcement.
  - CASCADE/RESTRICT deletes.
  - Publication state transitions.
- **HTTP Interface Testing:** 
  - Route existence and method correctness.
  - Error status codes (401,403,404,405,429,503).
  - Redirect locations.
  - CSRF token validation.
- **Security Testing:** 
  - Password hashing verification.
  - Rate limit enforcement.
  - Session handling (timeout, cookie attributes).
  - TLS enforcement (if testable).
  - Security header presence.
- **Accessibility Testing:** 
  - Automated (axe-core) for WCAG 2.2 AA.
  - Manual screening for keyboard navigation, screen reader, color contrast.
  - Touch target verification.
- **Responsive Testing:** 
  - Layout adaptation at breakpoints.
  - Component behavior (cards, tables, forms).
  - Image responsiveness.
- **End-to-End Testing:** 
  - Public browsing journey (home → project detail → evidence verification).
  - Private management journey (login → create project → add claim → upload evidence → request verification → approve → publish → verify public visibility).
  - Verification journey (request → review → approve/reject → notify).
  - Publication workflow (toggle → confirmation → redirect → public badge).
- **Regression Testing:** 
  - Full test suite on every push to main.
  - Nightly full suite on staging.
- **Performance Testing:** 
  - Load testing (10 concurrent users, target <2s response time).
  - Stress testing (spike to 50 users).
  - Bottleneck identification (database queries, file I/O).
- **Risks:** 
  - Test environment complexity — Mitigation: containerization (Docker) or scripts.
  - Flaky UI tests — Mitigation: stable selectors, wait conditions, retry logic.
  - Incomplete coverage — Mitigation: traceability matrix, code coverage reporting (informational).

## 29. Cross-Stage Consistency
- **Stage 3 (Requirements):** All functional requirements translated to UX flows (Sections 6-10,12-18,20-22).
- **Stage 4.1 (Domain Model):** Entity relationships reflected in creation/edit flows (Sections 10-13,25).
- **Stage 4.2 (System Architecture):** Public/private boundary respected in navigation (Sections 6,14,22).
- **Stage 4.3 (Technology Strategy):** No database assumption - UX works with static/dynamic backend (Section 21).
- **Stage 4.4 (Use Cases):** All primary scenarios covered (Sections 6-18).
- **Stage 4.5 (Data Design):** Evidence/Claim/Artifact constraints enforced in UX (Sections 10-13,24).
- **Stage 4.6 (Interface Design):** GET/POST patterns mirrored in UX interaction model (Sections 16,17,24).
- **Stage 4.7 (Auth Design):** Server-side authz assumptions integrated (Sections 14,16,24).
- **Frozen Decisions:** No contradictions with Stages 3-4.5; forward compatibility maintained for Stage 4.8.
- **Accessibility:** 
  - Consistent application of WCAG 2.2 AA across stages.
  - Responsive behavior aligned with technology strategy.
- **Risks:** 
  - Misalignment of UX with frozen data model — Mitigation: traceability and review.
  - Inconsistent security controls — Mitigation: centralized security review.

## 30. Final Status
ACCEPTED AND FROZEN — STAGE 4.6 COMPLETE
