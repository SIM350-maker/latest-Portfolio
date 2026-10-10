# STAGE 4.5 — AUTHENTICATION & SECURITY DESIGN

## 1. Document Control
- **Title:** Authentication & Security Design (Stage 4.5)
- **Author:** Application Security Architect
- **Status:** DRAFT
- **Created:** 2026-10-07
- **Revision:** 0.1
- **Naming:** follows the existing `NN-NAME.md` convention; Stage 4.1→07, 4.2→08, 4.3→09, 4.4→10, 4.5→11. Coexists with `11-VERIFICATION-STRATEGY.md` per the established duplicate-coexistence pattern. The existing `09-SECURITY-ARCHITECTURE.md` is an untouched scaffold placeholder ("To be determined") and was NOT overwritten. No frozen authoritative document was modified.

## 2. Stage 4.5 Scope
Design the security architecture that protects the portfolio system: authentication model, session security, credential security, CSRF defense, authorization boundaries, publishing/verification/accessibility protection, security data boundaries, transport/browser security, input/output security, leakage risks, and a threat model. Design only — no authentication code, session middleware, password hashing code, user tables, database changes, authorization/CSRF middleware, security headers, frontend login pages, tests, or deployment configuration are created.

## 3. Authoritative Inputs
- `ENGINEERING-CONSTITUTION.md`
- `03-REQUIREMENTS.md` (NFR-001 P1; FR-005 P0; public/private boundary)
- `05-DOMAIN-MODEL.md` (publication/accessibility/verification models; private content containment invariant)
- `06-SYSTEM-ARCHITECTURE.md` (§4 actors; §5 boundary; §7.3 Security Component; §14 security concerns)
- `08-APPLICATION-AND-USE-CASE-DESIGN.md` (use cases; authorization model; error semantics)
- `09-DATA-AND-PERSISTENCE-DESIGN.md` — **ACCEPTED AND FROZEN** (§18: no credentials persisted; §5/§21: Security has no persistence; session store deferred)
- `10-INTERFACE-AND-API-DESIGN.md` — **AUDITED, ACCEPTED AND FROZEN** (§13: `/manage/*` protected; mechanism DEFERRED TO STAGE 4.5; §5: server-rendered POST form commands)

## 4. Security Architecture Overview
Three security boundaries, derived from the frozen architecture (06 §5, §7, §14) and frozen interface design (10 §4, §13):

1. **Public Read Boundary** — GET-only, no authentication. Protection: publication-state filtering (only Published content is exposed — domain invariant, 05 line 211); honest evidence accessibility representation (FR-006). Publication state is NOT equivalent to authentication: content visibility is governed by Publication State; management access is governed by authentication/authorization — orthogonal concerns (06 §5 lines 85-88).
2. **Private Management Boundary** — all `/manage/*` operations require authentication (10 §7, §13) and server-side authorization. This boundary is the Security Component's responsibility (06 §7.3).
3. **External Artifact Boundary** — external artifacts are references only; the application does not own, proxy, fetch, or silently download artifact content (06 §12.3 line 289; 10 §4 boundary 4). Security implication: the system must never execute or trust external content; it renders links and metadata only (06 §14 line 352).

## 5. Actor and Authorization Matrix
Only actors supported by authoritative evidence are included (06 §4; 08 §4). No additional roles are invented.

| Actor | Public Read | Private Management | Publish | Delete | Verification (record) | Security Administration |
|-------|-------------|--------------------|---------|--------|----------------------|-------------------------|
| Public Visitor | Allowed — Published content only (06 §4.1) | Denied | Denied | Denied | Denied (views displayed verification info read-only) | Denied |
| Portfolio Owner / Engineer | Allowed | Allowed — requires authentication (06 §4.2; 08 §14) | Allowed — deliberate action (FR-005) | Allowed — explicit action (Constitution 18) | Allowed — record (08 §7) | Allowed — minimal; the engineer performs administrative functions (06 §4.3 note) |
| Administrator | — | OPTION (optional/deferred; NOT a mandatory domain concept — 06 §4.3; 08 §4) | — | — | — | — |

The administrator remains optional/deferred; no administrator capability becomes mandatory.

## 6. Authentication Model (conceptual definitions)
- **Identity:** the single authenticated Portfolio Owner / Engineer (one identity; the system is a single-user management system per Stage 4.1 §10).
- **Credential / authentication factor:** the secret presented at login, verified against stored credential material (see §9).
- **Authentication attempt:** a login submission (POST `/manage/login`, 10 §7 line 59) evaluated by the Security Component.
- **Authenticated session:** a server-side session record binding an opaque session identifier to the authenticated identity for the duration of validity.
- **Logout:** explicit session destruction (server-side invalidation; Stage 4.1 line 341).
- **Authentication failure:** failed attempt → 401 (Stage 4.2 §16); repeated failures → rate limiting (§10 below).
- **Session expiration:** session ceases to be valid after timeout (§8 below).
- **Session invalidation:** server-side removal of the session record (logout or expiration).

## 7. Authentication Mechanism Decision
- **FACT:** Stage 4.1 §10 (07 lines 382-394, frozen) selected **Option A: Session-based Authentication (using cookies with express-session)** — the session strategy is already authoritative; its implementation was deferred.
- **FACT:** NFR-001 (03 line 226) permits "secure password handling (if using passwords) or secure third-party authentication (e.g., OAuth)" — it does not mandate a mechanism.
- **DECISION (justified):** single-engineer **password-based credential verification** feeding the frozen session strategy. Basis: Stage 4.1 evaluated the system as "sufficient for a single-user private management system" (07 line 384), rejected third-party OAuth as overkill for a single engineer account (07 line 367), and NFR-001 explicitly authorizes password handling. Options evaluated and rejected: JWT (Stage 4.1 Option B — overkill, complex revocation, XSS token-storage risk), OAuth (Option C — external dependency, overkill for one account), magic links/passkeys/MFA/refresh tokens — **NOT REQUIRED** (no authoritative basis; not deferred).
- The login interface operation exists in the frozen Stage 4.4 contract (POST `/manage/login`); Stage 4.5 supplies its security design, not its implementation.

## 8. Session Security Design
- **Session creation:** on successful credential verification; a fresh session identifier is generated server-side.
- **Session fixation protection:** the session identifier is **rotated (regenerated) at authentication** so a pre-login identifier can never be reused post-login. REQUIRED.
- **Session association:** the server-side session record binds the opaque identifier to the authenticated identity; the cookie carries **only** the opaque session identifier — never identity or credential data.
- **Session expiration:** both an **idle timeout** and an **absolute timeout** are RECOMMENDED; exact values are DEFERRED to implementation/configuration.
- **Logout/invalidation:** explicit logout destroys the server-side session record; expired sessions are invalidated server-side (Stage 4.1 line 341).
- **Secure cookie properties (cookies are actually selected — Stage 4.1):** HttpOnly (not readable by scripts), Secure (HTTPS only), SameSite (Lax or Strict — CSRF defense-in-depth, §10). REQUIRED.
- **Server-side session storage:** REQUIRED (the opaque identifier must map to server-side state). The concrete store is **DEFERRED** — Stage 4.1 line 397 deferred it (in-memory / database / Redis are OPTIONS); in-memory is simplest but does not survive restarts (Stage 4.1 line 392: acceptable for a personal portfolio — the engineer can log in again).

## 9. Credential Security Design
- **DECISION (justified):** password authentication is used (§7); therefore password security controls apply (NFR-001 line 226 "secure password handling").
- **Password hashing:** credentials are stored only as a salted hash produced by a modern adaptive password-hashing algorithm (bcrypt/argon2 class). REQUIRED conceptually. The exact algorithm/library is **DEFERRED** to implementation with a documented justification (Constitution 15); Stage 4.1's evaluation cited bcrypt as an example (07 line 377), not a mandate.
- **Plaintext prohibition:** plaintext passwords are NEVER stored, logged, or committed (Constitution 14). REQUIRED.
- **Password verification:** performed server-side at login using a constant-time comparison against the stored hash. REQUIRED conceptually; implementation DEFERRED.
- **Password reset / credential change:** **DEFERRED** — no authoritative requirement defines reset flows; a single-engineer system can re-provision the credential out-of-band. Recorded as future work.
- **Rate limiting / brute-force protection:** **REQUIRED** — Stage 4.1 line 398 explicitly deferred the rate-limiting decision to later design stages; this stage makes it. Conceptual: repeated failed login attempts are throttled/delayed. Concrete mechanism DEFERRED to implementation.

## 10. CSRF Analysis and Decision
- **FACT:** the frozen interface is server-rendered with POST form commands (10 §5) and the frozen session strategy uses cookies (Stage 4.1 §10). Cookies are automatically attached to cross-site requests, so state-changing POST `/manage/*` requests are CSRF-exposed by construction.
- **DECISION:** **CSRF protection is REQUIRED** for every state-changing management request (all POST `/manage/*` routes in 10 §7). Stage 4.1 line 398 deferred this decision to later design stages; Stage 4.5 is that stage.
- Conceptual design: a per-session CSRF token is generated server-side, embedded in each management form, and validated server-side on every POST before the command executes.
- **Failure handling:** invalid/missing token → 403 (Stage 4.2 §16: Unauthorized/forbidden). No command side effects occur.
- **SameSite cookie attribute** (Lax/Strict) provides defense-in-depth alongside the token (§8).
- No specific CSRF library is chosen; the concrete mechanism is **DEFERRED** to implementation.

## 11. Authorization Design
- **DECISION:** a single authorization role — the authenticated Portfolio Owner / Engineer. Basis: architecture §14 line 348 ("for a personal portfolio, a single engineer role may suffice"); 08 §14 (Private Manager: full CRUD, publish, unpublish, preview; requires authentication).
- **Enforcement:** server-side at the Security boundary for every `/manage/*` operation (10 §13); **UI visibility is never the control** (10 §13 line 140). Unauthenticated requests → 401; unauthorized → 403 (Stage 4.2 §16).
- Per-operation authorization: profile, project, skill, claim, evidence management; artifact references (via CreateEvidence); accessibility changes (UpdateEvidenceAccessibility); verification recording (UpdateContent on `Evidence.verification_result`); publish/unpublish (PublishContent/UnpublishContent); preview (PreviewDraft); deletion (DeleteContent/DeleteClaim/DeleteEvidence) — all require an authenticated, authorized session. No operation is authorized by route existence or UI state alone.
- No privileged administrator endpoints exist (10 §7 line 89; architecture §4.3).

## 12. Publishing, Verification, and Accessibility Security
- **Publishing:** only PublishContent and UnpublishContent change publication_state (10 §10 line 106); both are protected management commands — public users cannot publish or unpublish (authorization matrix §5). Publication state cannot be modified through public GET operations (public boundary is GET-only, 10 §6). Preview cannot publish: PreviewDraft is a read-only query with no state change (Stage 4.2 §8). Server-side authorization is checked before every publish/unpublish.
- **Verification:** verification is NOT automatically generated merely because Evidence exists (frozen invariant, 10 §16 line 169; 08 line 68). Recording requires protected management access (UpdateContent restricted to `Evidence.verification_result`); unauthorized users cannot alter verification information; public presentation cannot modify verification state (read-only). Business rule preserved: `Evidence does not imply verification.`
- **Accessibility:** accessibility updates require protected management access (UpdateEvidenceAccessibility); public users cannot modify accessibility; an accessibility change cannot silently change verification or publication state (frozen business rules, 08 §10 line 69: Accessibility, Verification Method, and Verification Result are distinct; 09 §13 line 130: Evidence/Artifact carry no publication_state). The Evidence model is not redesigned.

## 13. Security Data / Persistence Boundary
- **FACT:** Stage 4.3 §18 (frozen, 09 line 163): "No authentication credentials are persisted in this design." Stage 4.5 does NOT contradict this: no credential, password hash, or session record is added to the content persistence model, and Stage 4.3 is not modified.
- **Never persisted:** plaintext passwords (Constitution 14); credentials inside the content database (Stage 4.3, frozen).
- **Security-component storage concerns — DEFERRED (implementation owns them):**
  - **Credential store (password hash):** DEFERRED. Stage 4.3 excludes credentials from the content persistence design; architecture §7.3 assigns credential ownership to the Security Component. OPTIONS: a configuration secret (e.g., environment-provided hash — never committed, Constitution 14) or a security-owned store outside the content model. The single-user system makes the configuration secret the simplest compliant option (OPTION — choice DEFERRED to implementation).
  - **Session records:** DEFERRED — Stage 4.1 line 397 deferred the session store (in-memory / database / Redis are OPTIONS; 09 §5 line 33: "session store mechanism deferred per Stage 4.1").
  - **Security timestamps / authentication events / audit events:** OPTION — architecture §14 line 355 considers auditability as an OPTION, not required. If adopted, owned by the implementation stage; not part of Stage 4.3's content model.
- No database schema is added by Stage 4.5.

## 14. Transport and Browser Security
- **REQUIRED:**
  - HTTPS/TLS in production — Stage 4.1 line 394: "We must ensure to use HTTPS in production to protect cookies."
  - Secure, HttpOnly, SameSite cookie flags — Stage 4.1 line 387: NFR-001 satisfied "when combined with HTTPS and secure cookie flags."
  - Cache-control: no-store on all `/manage` (private) responses — prevents caching of private management data (leakage control, §16).
- **RECOMMENDED (professional security recommendations, not authoritative requirements):** Content Security Policy; X-Content-Type-Options: nosniff; Referrer-Policy; frame protection (X-Frame-Options / frame-ancestors).
- **DEFERRED:** exact header values and configuration to implementation/deployment stages. No deployment configuration is claimed to exist.

## 15. Input / Output Security
- **Input validation:** per the frozen Stage 4.4 §11 contract — required/optional fields per Stage 4.3 attribute tables; URL format validation for artifact references; uniqueness of `Artifact.reference`. All input from the engineer and from external artifact references is treated as untrusted (architecture §14 line 351). Malformed input → 400/422 (Stage 4.4 §12). No validation rules that contradict Stage 4.4 are introduced.
- **Output encoding:** server-rendered HTML must encode all dynamic output (HTML injection/XSS prevention). REQUIRED conceptually; implementation in the UX/implementation stage.
- **External artifact references:** rendered as outbound links only; never fetched, proxied, or executed by the application (architecture §14 line 352); URL validation per Stage 4.4 §11; malicious references mitigated by the honesty invariant (labels reflect actual accessibility).
- **Unsafe redirects:** the POST→redirect convention (10 §5) must redirect to internal paths only. RECOMMENDED control.
- **Request size limits:** RECOMMENDED for management form submissions.
- **Error-message leakage:** production error responses are generic; no stack traces, secrets, or internal details are exposed (Constitution 14; leakage control, §16).

## 16. Public / Private Data Leakage Audit
- **Public routes:** expose only Published content (frozen publication-state filtering); a misimplemented filter is caught by the testable contract "Unpublished/draft content not visible publicly" (08 §19 line 123). Implementation/testing responsibility.
- **Preview:** authenticated `/manage` route; risk of leaking drafts into caches → mitigated by cache-control: no-store on private responses (§14 REQUIRED). Implementation responsibility.
- **Errors:** generic responses; no internal details (§15). Implementation responsibility.
- **Logs:** must not contain credentials, session identifiers, or cookie values. Implementation responsibility.
- **Cached responses:** private responses must not be cacheable (no-store); public responses may be cacheable "where appropriate" (03 line 288) — DEFERRED to performance/deployment stages.
- **Page source:** must not embed secrets (Constitution 14). Implementation responsibility.
- **Serialized objects:** must not leak credential fields; credentials live outside the content model (§13). Implementation responsibility.
- **API responses:** no JSON API is designed (10 §5); if a future requirement justifies one, it must respect the same boundaries — DEFERRED.
- No caching architecture is invented here; risks are identified and assigned to later stages.

## 17. Threat Model
Proportionate to the system: single deployable application, single authenticated user, low traffic (Stage 4.1 §6; 06 §9).

| Threat | Boundary | Consequence | Mitigation | Implementation Stage |
|--------|----------|-------------|------------|----------------------|
| Unauthorized management access | Private | Content exposure/manipulation | Authentication + server-side authorization on every `/manage/*` operation | Implementation |
| Credential compromise | Authentication | Account takeover | Salted adaptive hashing, HTTPS, rate limiting | Implementation |
| Session theft | Private | Impersonation | HttpOnly + Secure cookies, HTTPS, session timeouts | Implementation |
| Session fixation | Private | Impersonation | Session identifier rotation at authentication (§8) | Implementation |
| CSRF | Private | Unauthorized state change | Per-session CSRF token + SameSite cookies (§10) | Implementation (decision made in Stage 4.5) |
| XSS | Public/Private | Content injection, script theft | Output encoding, CSP, HttpOnly cookies | UX + Implementation |
| Authorization bypass / IDOR | Private | Cross-entity manipulation | Server-side checks on every operation; single-user scope minimizes object-level exposure; ownership still enforced | Implementation |
| Publication-state leakage | Public | Draft/private content exposure | Frozen publication-state filtering; fail-safe defaults (Draft by default, 06 §14 line 354) | Implementation + Testing |
| Preview leakage | Private | Draft exposure via cache | cache-control: no-store on private responses | Implementation |
| Malicious external artifact reference | Public | Phishing/malicious links | URL validation; outbound references only; honest accessibility labeling | Implementation |
| Brute-force authentication | Authentication | Credential discovery | Rate limiting / throttling (§9) | Implementation (decision made in Stage 4.5) |
| Information leakage through errors | Public/Private | Internal detail exposure | Generic production error responses | Implementation |
| Insecure direct object references | Private | Unauthorized record access | Server-side authorization; opaque identifiers; slugs are not security boundaries (10 §6 line 51) | Implementation |
| Accidental public exposure | Public | Private data leak | Fail-safe defaults (Draft by default); publication-state tests (08 §19) | Testing |

No threat beyond what the architecture supports is asserted.

## 18. Security Requirements Traceability
| Requirement | Security Rule | Boundary | Control | Implementation Stage |
|-------------|---------------|----------|---------|----------------------|
| NFR-001 (authoritative, P1) | Secure authentication and authorization; OWASP Top 10 protection; least privilege | Private | Authentication (§7), authorization (§11), session security (§8), CSRF (§10), rate limiting (§9), dependency scans | Implementation + Testing |
| FR-005 (authoritative, P0) | Log in to a secure management interface (03 line 125) | Private | Authentication + protected `/manage/*` (10 §7, §13) | Implementation |
| FR-001 (authoritative, P0) | Engineer can edit profile via private management (03 line 64) | Private | Authenticated profile update; public profile read-only | Implementation |
| FR-002/003/004/006 (authoritative, P0) | Public/private isolation; honest evidence accessibility | Public | Publication-state filtering; accessibility display rules (10 §6) | Implementation |
| NFR-002 (authoritative, P0) | Content/presentation separation | Both | No direct security control beyond isolation; content updates require no code changes | Implementation |
| C-001/C-002 (constraints, P0) | Fitness-for-purpose; evidence-first | Process | Security decisions trace to requirements (§18); no speculative controls | — |
| Constitution 14 (governance) | Secrets never committed | Process | Plaintext prohibition (§9); no secrets in logs/source (§15/§16) | Implementation |
| Constitution 18 (governance) | Destructive operations require explicit authorization | Private | Delete operations require authenticated session + deliberate action | Implementation |
| Constitution 7 (governance) | Security considered during design | Process | This document | — |
| Architecture §7.3/§14 (architectural decision) | Security Component responsibilities; fail-safe defaults | Private | Security boundary model (§4) | Implementation |
| Stage 4.4 §13 (frozen interface rule) | `/manage/*` protected; mechanism deferred to Stage 4.5 | Private | Fulfilled by this design (§7-§11) | Implementation |

Authoritative requirements (FR/NFR), architectural decisions (Architecture/Stages 4.1-4.4), and professional recommendations (RECOMMENDED items in §14/§15) are distinguished throughout.

## 19. Deferred Decisions
- **DEFERRED to implementation:** exact password hashing algorithm/library (justification required, Constitution 15); session store (in-memory/database/Redis — OPTIONS, Stage 4.1 line 397); idle/absolute timeout values; concrete CSRF mechanism/library; credential store location (configuration secret vs security-owned store — OPTIONS, §13); rate-limiting mechanism; security header values; password reset/credential-change flow (no authoritative requirement; future work); audit/security event logging (OPTION, architecture §14 line 355).
- **NOT REQUIRED (no authoritative basis):** MFA, passkeys, magic links, refresh tokens, JWT, OAuth, localStorage tokens (cookie strategy frozen by Stage 4.1), Redis (option only).

## 20. Cross-Stage Consistency Check
- **Requirements:** NFR-001 and FR-005 are fulfilled at design level; no requirement is invented; P1/P0 priorities preserved.
- **Constitution:** principles 7, 14, 15, 18 honored (§9, §13, §14, §15, §18).
- **Domain Model:** publication/accessibility/verification models untouched; private content containment invariant honored (§13/§16); Evidence model not redesigned.
- **Architecture:** Security Component responsibilities (§7.3) and security concerns (§14) modeled without contradiction; no new module or role introduced.
- **Application/Use Cases:** authorization model (§14) preserved; error semantics (401/403) reused; all `/manage/*` operations protected; no operation contradicts a business rule.
- **Persistence (Stage 4.3, frozen):** no credentials, hashes, or session records added to the content model; §18 line 163 not contradicted; no schema added; session store remains deferred.
- **Interface/API (Stage 4.4, frozen):** POST `/manage/login` mechanism now designed (not implemented); all `/manage/*` protection rules honored; no new endpoints invented; server-rendered POST/GET conventions respected.
- Explicit contradiction search across: authentication, authorization, session, credentials, password, publication, verification, accessibility, public/private, `/manage`, security, cookies, tokens, JWT, OAuth, CSRF, roles, administrator, identity — **no contradictions found** (§20 summary; details in sections 4-15).

## 21. Risks
- The single-engineer model means credential compromise equals full compromise; mitigations (hashing, HTTPS, rate limiting) reduce likelihood but residual risk remains (documented, not a contradiction).
- In-memory session store (if chosen) loses sessions on restart — acceptable per Stage 4.1 line 392; the engineer logs in again.
- Deferring the concrete hashing/CSRF/session-store choices requires disciplined justification at implementation time (Constitution 15) — a process risk, not a design defect.
- RECOMMENDED browser-security controls (CSP, etc.) are not authoritative requirements; omitting them would not violate an authoritative decision but would weaken defense-in-depth.

## 22. Acceptance Criteria
- Every security control traces to an authoritative requirement, architectural decision, or is explicitly labeled a professional recommendation.
- All frozen invariants (Stage 4.3 §18; Stage 4.4 §13/§16) are preserved; no frozen document modified.
- No implementation artifacts created; all deferred/not-required items explicitly marked.
- No claim that authentication or security is implemented.

## 23. Status
DRAFT — STAGE 4.5 COMPLETE — AWAITING AUDIT
