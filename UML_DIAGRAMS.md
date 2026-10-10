# UML_DIAGRAMS.md

**Document ID:** SYS-UML-001 · **Version:** 1.0 · **Date:** 2026-10-10
**Purpose:** Understand the Portfolio System through the full standard UML diagram set — every diagram grounded in the actual code (evidence = `file:line`). Companion to `SYSTEM_BLUEPRINT.md` (narrative) and `BUILD_ROADMAP.md` (build order).
**Rendering:** All diagrams are Mermaid. View in any Mermaid-capable renderer (VS Code extension, GitHub, mermaid.live).
**Convention:** `[EVIDENCED: path:lines]` = read directly from code/tests. `[INFERRED]` = derived, marked where applicable. All sample values in the object diagram are illustrative.

---

## Diagram inventory

| ID | UML type | Question it answers |
|---|---|---|
| D-UC-01 | Use Case diagram | *Who* can do *what* to the system? |
| D-CD-01 | Class diagram (domain) | *What* are the business objects and their rules? |
| D-CD-02 | Class diagram (application) | *What* code implements the behavior? |
| D-PKG-01 | Package diagram | *How is the source* organized and layered? |
| D-CMP-01 | Component diagram | *What are the replaceable parts* and their interfaces? |
| D-OBJ-01 | Object diagram (snapshot) | *What does the data look like* at runtime? |
| D-SM-01..03 | State machine diagrams | *What states* exist and *what transitions* are legal? |
| D-ACT-01..03 | Activity diagrams | *What are the flows*, branches and decisions? |
| D-SEQ-01..08 | Sequence diagrams | *Who calls whom, in what order* over time? |
| D-COM-01 | Communication diagram | *Which objects collaborate* on the critical flow (login)? |
| D-DEP-01 | Deployment diagram | *Where does it run* and what artifacts are deployed? |
| D-ERD-01 | ER diagram (persistence view) | *How is data stored* in SQLite? |

Deliberately omitted: timing diagram (no time-critical resource contention exists in this system — all handlers are synchronous, `src/config/database.js:36`); UML profile diagrams (no stereotypes to formalize beyond the ones used here).

---

## D-UC-01 — Use Case Diagram

**Teaches:** the two-zone permission model — a read-only public surface (Visitor) and an all-powerful authenticated surface (Owner) — plus the system-enforced isolation that visitors can never bypass. [EVIDENCED: `src/routes/publicRoutes.js`, `src/routes/manageRoutes.js:22-52`, `src/middleware/auth.js:40-52`]

```mermaid
flowchart LR
    V(["Actor: Public Visitor"])
    O(["Actor: Portfolio Owner"])
    OPS(["Actor: Ops / Monitor"])

    subgraph SYS["Portfolio System boundary"]
        UC1(["UC-001 View published home"])
        UC2(["UC-002 Inspect project claims+evidence"])
        UC3(["UC-003 Browse skills"])
        UC4(["UC-004 Be blocked from drafts 404/405"])
        AUTH(["Be authenticated session+CSRF"])
        UC5(["UC-005 Sign in / sign out"])
        UC6(["UC-006 Manage profile"])
        UC7(["UC-007 Manage projects + publish + attach"])
        UC8(["UC-008 Manage skills"])
        UC9(["UC-009 Manage claims + attach evidence"])
        UC10(["UC-010 Manage evidence references"])
        UC11(["UC-011 Preview draft in public template"])
        UC16(["UC-016 Recover from 400/403 errors"])
        UCH(["UC-012 Health probe"])
        UCS(["UC-013 Graceful shutdown"])
    end

    V --> UC1
    V --> UC2
    V --> UC3
    UC1 -.->|"«include» read Published only"| UC4
    UC2 -.->|"«include» read Published only"| UC4

    O --> UC5
    O --> UC6
    O --> UC7
    O --> UC8
    O --> UC9
    O --> UC10
    O --> UC11
    O --> UC16

    UC6 -.->|"«include»"| AUTH
    UC7 -.->|"«include»"| AUTH
    UC8 -.->|"«include»"| AUTH
    UC9 -.->|"«include»"| AUTH
    UC10 -.->|"«include»"| AUTH
    UC11 -.->|"«include»"| AUTH
    AUTH -.->|"«include»"| UC5

    OPS --> UCH
    OPS --> UCS
```

Notes:
- The **Planned** use cases UC-014 (release: git→CI→Docker) and UC-015 (experience/education, FR-007) are outside this diagram because no code path exists — see `BUILD_ROADMAP.md` MODULE-008..013. [INFERRED from `docs/SYSTEM-ARCHITECTURE-AND-IMPLEMENTATION-ROADMAP.md:483-489`]
- `UC-004` is drawn as an included use case because draft isolation is enforced inside every public read (`WHERE publication_state='Published'`, `src/repositories/projectRepository.js:6`) and by the global 405 boundary (`src/app.js:88-92`), not as a separate feature.

---

## D-CD-01 — Class Diagram: Domain Model

**Teaches:** the claim→evidence chain, the singleton profile, the polymorphic claim source, and the exact cascade/RESTRICT deletion semantics that produce 409s. [EVIDENCED: `src/db/schema.sql:3-119`, `src/lib/validation.js:28-30`]

```mermaid
classDiagram
    class Profile {
        +id : INTEGER PK
        +name : TEXT NOT NULL
        +role : TEXT NOT NULL
        +summary : TEXT NOT NULL
        +contact_info : TEXT
        +publication_state : Draft|Published|Archived
        +singleton : INTEGER = 1 UNIQUE
    }
    class Project {
        +id : INTEGER PK
        +title : TEXT NOT NULL
        +description : TEXT
        +outcomes : TEXT
        +roles : TEXT
        +technologies : TEXT
        +publication_state
    }
    class Skill {
        +id : INTEGER PK
        +name : TEXT NOT NULL unique-ci
        +description : TEXT
        +publication_state
    }
    class Claim {
        +id : INTEGER PK
        +statement : TEXT NOT NULL
        +justification : TEXT
        +source_entity_type : profile|project|skill
        +source_entity_id : INTEGER
        +publication_state
    }
    class Evidence {
        +id : INTEGER PK
        +description : TEXT
        +file_path : http-s URL
        +file_type : TEXT
        +accessibility_status : Public|Private-Restricted|Redacted|Unavailable
    }
    class Experience {
        +id : INTEGER PK
        +profile_id : INTEGER FK
        +title, company, start_date, end_date, description
    }
    class Education {
        +id : INTEGER PK
        +profile_id : INTEGER FK
        +institution, degree, field_of_study, start_date, end_date
    }

    Profile "1" --> "0..*" Experience : profile_id ON DELETE CASCADE
    Profile "1" --> "0..*" Education : profile_id ON DELETE CASCADE
    Project "0..*" --> "0..*" Skill : project_skill join, CASCADE both sides
    Project "0..*" --> "0..*" Evidence : project_evidence join, CASCADE both sides
    Skill "0..*" --> "0..*" Evidence : skill_evidence join, CASCADE both sides
    Claim "0..*" --> "0..*" Evidence : claim_evidence join, CASCADE links only

    Claim ..> Profile : polymorphic source, route-validated, no SQL FK
    Claim ..> Project : polymorphic source, route-validated
    Claim ..> Skill : polymorphic source, route-validated
    Project "1" --> "0..*" Claim : blocks delete with 409 while referenced
    Skill "1" --> "0..*" Claim : blocks delete with 409 while referenced
```

Key rules the diagram encodes:
- A **claim may exist with zero evidence** (frozen business rule, `src/repositories/claimRepository.js:15-19`).
- **Claim↔Evidence is N:M** via `claim_evidence`; deleting a claim keeps evidence rows (`claimRepository.js:57-65`, test `tests/constraints.test.js:41`).
- **Project/Skill delete is RESTRICT vs claims** at application level → `ConflictError` 409 (`projectRepository.js:59-76`, `skillRepository.js:59-77`).
- **Evidence delete cascades all three joins**; projects/skills/claims survive (`evidenceRepository.js:37-45`).
- `source_entity_type/id` is a **polymorphic reference with no SQL foreign key** — referential integrity is enforced in route code only (`manageRoutes.js:313-323`). This is the model's one deliberate integrity compromise.

---

## D-CD-02 — Class Diagram: Application Structure

**Teaches:** the layered call graph — routes → repositories → database — and where the typed errors come from. All repository methods are static module functions (CommonJS modules, not classes); drawn as `<<module>>` with static operations. [EVIDENCED: file set under `src/`]

```mermaid
classDiagram
    direction LR

    class App {
        <<module app.js>>
        +requireConfiguration()$
        +createApp()$
        +startServer(port)$
    }
    class Server {
        <<module server.js>>
        loads .env
        validates PORT 1..65535
    }
    class Database {
        <<module config/database.js>>
        +connectDB()$ Database
        +isOperationalError(err)$ bool
        singleton, PRAGMA FK verify, WAL, schema apply
    }
    class Validation {
        <<module lib/validation.js>>
        ValidationError : status 400 + fieldErrors
        ConflictError : status 409
        NotFoundError : status 404
        +requireText/optionalText()$
        +requireEnum/optionalInt()$
        +isHttpUrl()$
    }
    class Auth {
        <<middleware/auth.js>>
        +sessionGuard()$ 30m idle, 24h absolute
        +requireAuth()$ 302 GET / 401 POST
        +verifyCredential(pw,bcrypt)$
    }
    class CSRF {
        <<middleware/csrf.js>>
        +csrfMiddleware()$ issue + verify token, 403
    }
    class Limiters {
        <<middleware/rateLimiters.js>>
        publicLimiter : 100 per min
        manageLimiter : 10 per min
    }
    class NoStore {
        <<middleware/noStore.js>>
        +noStorePrivate()$
    }
    class Logger {
        <<middleware/logger.js>>
        +logger()$ no query strings, no secrets
    }
    class ErrHandler {
        <<middleware/errorHandler.js>>
        +errorHandler()$ 400/401/403/404/409/500
    }
    class PublicRoutes {
        <<routes/publicRoutes.js>>
        GET / , /projects, /projects/:id
        GET /skills, /skills/:id
    }
    class ManageRoutes {
        <<routes/manageRoutes.js>>
        login/logout, dashboard, profile,
        projects, skills, claims, evidence,
        publish/unpublish, preview
    }
    class HealthRoute {
        <<routes/health.js>>
        +GET /health : SELECT 1 probe
    }
    class ProfileRepo {
        <<repositories>>
        +getProfile()$ +getProfileById()$
        +createProfile()$ +updateProfile()$
        +setPublicationState()$
    }
    class ProjectRepo {
        <<repositories>>
        +listAll/listPublished/getById()$
        +create/update/remove()$
        +setPublicationState()$
        +listClaims/listEvidence/attachEvidence()$
        +listSkills/attachSkill()$
    }
    class SkillRepo {
        <<repositories>>
        +listAll/listPublished/getById/findByName()$
        +create/update/remove()$
        +setPublicationState()$
        +listClaims/listEvidence/attachEvidence()$
    }
    class ClaimRepo {
        <<repositories>>
        +listAll/getById/create/update/remove()$
        +setPublicationState()$
        +listEvidence/attachEvidence()$
    }
    class EvidenceRepo {
        <<repositories>>
        +listAll/getById/create()$
        +setAccessibility/remove()$
        +listClaims()$
    }

    Server --> App : startServer(PORT)
    App --> Database : connectDB
    App --> Auth
    App --> CSRF
    App --> Limiters
    App --> NoStore
    App --> Logger
    App --> ErrHandler
    App --> PublicRoutes
    App --> ManageRoutes
    App --> HealthRoute
    PublicRoutes --> ProfileRepo
    PublicRoutes --> ProjectRepo
    PublicRoutes --> SkillRepo
    PublicRoutes --> ClaimRepo
    ManageRoutes --> ProfileRepo
    ManageRoutes --> ProjectRepo
    ManageRoutes --> SkillRepo
    ManageRoutes --> ClaimRepo
    ManageRoutes --> EvidenceRepo
    ManageRoutes --> Validation
    ManageRoutes --> Auth
    ProjectRepo --> Database
    SkillRepo --> Database
    ClaimRepo --> Database
    EvidenceRepo --> Database
    ProfileRepo --> Database
    ProjectRepo ..> Validation : throws ConflictError
    SkillRepo ..> Validation : throws ConflictError
    ProfileRepo ..> Validation : throws ConflictError
    ErrHandler ..> Validation : checks error.name/status
    ErrHandler ..> Database : isOperationalError
    HealthRoute --> Database
```

---

## D-PKG-01 — Package Diagram

**Teaches:** the layering discipline — `routes` may call `repositories`, never SQL directly; `repositories` are the only SQL owners; nothing outside `lib/validation` defines the error contract. [EVIDENCED: directory structure, import graph in each file header]

```mermaid
flowchart TD
    subgraph L1["Presentation layer"]
        V["views/ : 16 EJS templates"]
        PUB["public/ : styles.css"]
    end
    subgraph L2["Interface layer"]
        RPub["routes/publicRoutes.js"]
        RMng["routes/manageRoutes.js"]
        RHlth["routes/health.js"]
    end
    subgraph L3["Application/middleware layer"]
        APP["app.js"]
        SRV["server.js"]
        MW["middleware/ : auth, csrf, rateLimiters, noStore, logger, errorHandler"]
        LIB["lib/validation.js"]
    end
    subgraph L4["Data access layer"]
        REPO["repositories/ : profile, project, skill, claim, evidence"]
    end
    subgraph L5["Persistence layer"]
        CFG["config/database.js"]
        SCH["db/schema.sql"]
        DBF[("data/dev.db SQLite WAL")]
    end
    subgraph T["tests/ : 6 supertest suites"]
        TST["health, auth, publication, content, constraints, manageEvidenceList + helpers"]
    end

    SRV --> APP
    APP --> MW
    APP --> RPub
    APP --> RMng
    APP --> RHlth
    RPub --> REPO
    RMng --> REPO
    RMng --> LIB
    REPO --> CFG
    CFG --> SCH
    CFG --> DBF
    RPub --> V
    RMng --> V
    V --> PUB
    TST --> APP
    TST --> REPO
```

Prohibited edges (enforced by inspection, `docs/06-SYSTEM-ARCHITECTURE.md:189-197`): public routes contain no write statements; repositories contain no request/response logic; `views/` contains no data access.

---

## D-CMP-01 — Component Diagram

**Teaches:** the three replaceable components and their narrow interfaces — the persistence component hides SQLite behind `connectDB()`; the security component wraps every management interaction; the presentation component is swappable templates. [EVIDENCED: `src/app.js:104-107` wiring, module exports of each file]

```mermaid
flowchart LR
    subgraph C1["«component» PublicSite"]
        P1("provides : GET / , /projects:ud, /skills:ud")
    end
    subgraph C2["«component» ManagementSystem"]
        M1("requires : authenticated session + CSRF token")
        M2("provides : /manage CRUD + publish + preview")
    end
    subgraph C3["«component» SecurityKernel"]
        S1("provides : sessionGuard, requireAuth, csrfMiddleware, limiters, noStore, helmet")
    end
    subgraph C4["«component» Persistence"]
        D1("provides : connectDB singleton, WAL, FK-verified")
    end
    subgraph C5["«component» EvidenceTraceability"]
        E1("provides : claim_evidence, project_evidence, skill_evidence joins")
    end
    VIS(["Visitor browser"]) -->|HTTP GET| C1
    OWN(["Owner browser"]) -->|HTTP GET+POST| C2
    C1 -->|read Published rows| C4
    C2 -->|read/write all rows| C4
    C2 -->|attach links| C5
    C1 -->|nested claims+evidence| C5
    S1 -.->|guards| C2
    C2 -->|SQL via repos| D1
```

---

## D-OBJ-01 — Object Diagram (runtime snapshot, illustrative values)

**Teaches:** what draft isolation means concretely — same DB holds a Published and a Draft project; the public site renders only the Published one; evidence accessibility is orthogonal to publication. **Values are illustrative, not from your dev.db.** [Structure EVIDENCED: `schema.sql`; behavior EVIDENCED: `tests/publication.test.js`, `tests/constraints.test.js:84`]

```mermaid
flowchart LR
    subgraph snap["data/dev.db — moment T"]
        P1["p1 : Profile<br/>name = Alex Doe<br/>publication_state = Published"]
        PR2["pr2 : Project<br/>title = API Gateway<br/>publication_state = Published"]
        PR3["pr3 : Project<br/>title = Secret Refactor<br/>publication_state = Draft"]
        CL7["c7 : Claim<br/>statement = Designed 10k rps gateway<br/>source = project,2<br/>publication_state = Published"]
        EV11["e11 : Evidence<br/>file_path = https://repo.example/api<br/>accessibility = Public"]
        EV12["e12 : Evidence<br/>description = Load test under NDA<br/>accessibility = Private/Restricted"]
        L1["claim_evidence (7,11)"]
        L2["claim_evidence (7,12)"]
        LS1["project_evidence (2,11)"]
        PS1["project_skill (2,5)"]
        SK5["s5 : Skill<br/>name = Node.js<br/>publication_state = Published"]
    end
    P1 --- PR2
    P1 --- PR3
    PR2 --- CL7
    CL7 --- L1 --- EV11
    CL7 --- L2 --- EV12
    PR2 --- LS1 --- EV11
    PR2 --- PS1 --- SK5
    style PR3 stroke-dasharray: 5 5
    style EV12 stroke-dasharray: 5 5
```

Rendered consequences: `GET /projects` lists pr2 but **never pr3**; `GET /projects/2` shows c7 with e11 as a clickable link and e12 as an honest "Private/Restricted" label with no URL exposed.

---

## D-SM-01 — State Machine: `publication_state` (profile, project, skill, claim)

**Teaches:** the whole publishing business model in one picture — including that `Archived` is **declared but unreachable** (no code path sets it), and that delete is legal from Draft *and* Published unless claims block it. [EVIDENCED: `schema.sql:9,23,32,53`; `manageRoutes.js` publish/unpublish routes; grep: `Archived` appears only in schema + `validation.js:28`]

```mermaid
stateDiagram-v2
    state "Draft" as D
    state "Published" as PB
    state "Archived (declared, unreachable)" as AR

    [*] --> D : create via POST /manage/... default
    D --> PB : POST .../publish
    PB --> D : POST .../unpublish
    AR --> [*]
    D --> [*] : POST .../delete (409 if claims reference project/skill)
    PB --> [*] : POST .../delete (same 409 rule)

    note right of AR
        enum value exists in schema CHECK + PUBLICATION_STATES
        but no route ever writes it  [GAP G-8]
    end note
    note right of PB
        Public queries use strict equality
        publication_state = 'Published'
        projectRepository.js:6, skillRepository.js:6
    end note
```

---

## D-SM-02 — State Machine: `evidence.accessibility_status`

**Teaches:** accessibility is an independently settable 4-state field (default `Public` on create) — orthogonal to publication state by frozen design. [EVIDENCED: `evidenceRepository.js:19-26` default, `manageRoutes.js:428-437` transition endpoint, `validation.js:29` enum]

```mermaid
stateDiagram-v2
    state "Public" as PU
    state "Private/Restricted" as PR
    state "Redacted" as RD
    state "Unavailable" as UN

    [*] --> PU : POST /manage/evidence default
    PU --> PR : POST :id/accessibility
    PU --> RD : POST :id/accessibility
    PU --> UN : POST :id/accessibility
    PR --> PU : POST :id/accessibility
    PR --> RD : POST :id/accessibility
    PR --> UN : POST :id/accessibility
    RD --> PU : POST :id/accessibility
    RD --> PR : POST :id/accessibility
    RD --> UN : POST :id/accessibility
    UN --> PU : POST :id/accessibility
    UN --> PR : POST :id/accessibility
    UN --> RD : POST :id/accessibility

    note right of PR
        Any state may move to any other —
        it is a settable enum, not a lifecycle.
        Public pages always render the true state
        (tests/constraints.test.js:84).
    end note
```

---

## D-SM-03 — State Machine: Session lifecycle

**Teaches:** how one anonymous session becomes the owner session and how it dies — rotation at login, token rebind, the two timeouts, and MemoryStore volatility across restarts. [EVIDENCED: `src/middleware/auth.js:12-33`, `src/routes/manageRoutes.js:27-49`, `src/app.js:59-71`]

```mermaid
stateDiagram-v2
    state "Anonymous (csrfToken issued)" as AN
    state "Authenticated (rotated sid)" as AU
    state "Destroyed (fresh anonymous)" as DE

    [*] --> AN : first request, saveUninitialized, cookie portfolio.sid 24h
    AN --> AN : any request, lastSeen refreshed rolling
    AN --> AU : POST /manage/login OK — session.regenerate, csrfToken rebound, createdAt/lastSeen set
    AN --> AN : POST /manage/login wrong password 401 — state unchanged
    AU --> AU : any request, lastSeen refreshed
    AU --> DE : POST /manage/logout — session.destroy, 303 /
    AU --> DE : idle > 30 min (sessionGuard)
    AU --> DE : age > 24 h absolute (sessionGuard)
    DE --> AN : next request starts a fresh session
    AU --> [*] : server restart (MemoryStore lost) — accepted RISK-003
```

---

## D-ACT-01 — Activity Diagram: Request lifecycle (the middleware spine)

**Teaches:** the exact decision order that produces the famous status codes — 405 before CSRF, CSRF before auth, rate limit before everything private. Order is test-locked. [EVIDENCED: `src/app.js:44-123`; `tests/auth.test.js:18-29`, `tests/publication.test.js:69-72`]

```mermaid
flowchart TD
    S([Request arrives]) --> H1[helmet security headers]
    H1 --> B1[parse urlencoded + json, limit 100kb]
    B1 --> S1[load session, rolling cookie 24h]
    S1 --> G1{expired? idle>30m or age>24h}
    G1 -- yes --> D1[destroy session, reissue] --> RL
    G1 -- no --> RL{path starts /manage?}
    RL -- yes --> L1[manageLimiter 10/min] --> NS
    RL -- no --> L2[publicLimiter 100/min] --> NS
    L1 -->|over limit| X429[429 Too Many Requests]
    L2 -->|over limit| X429
    NS[no-store headers if /manage] --> M1{method is GET/HEAD/OPTIONS?}
    M1 -- no --> M2{path starts /manage?}
    M2 -- no --> X405[405 Method Not Allowed JSON]
    M2 -- yes --> C1
    M1 -- yes --> C1{CSRF: non-safe only — skip for safe}
    C1 -- safe method --> LOG
    C1 -- non-safe --> C2{token in _csrf or x-csrf-token matches session?}
    C2 -- no --> X403[403 Forbidden, no side effects]
    C2 -- yes --> LOG[logger logs METHOD path status ms]
    LOG --> ST[serve static from public/]
    ST --> RT{route dispatch}
    RT -- /health --> HP[SELECT 1 probe] --> R200[200 or 503 JSON]
    RT -- /manage --> AU{session.authenticated?}
    AU -- no, GET --> X302[302 /manage/login + returnTo]
    AU -- no, POST --> X401[401 error page]
    AU -- yes --> HD[handler: validate then write]
    RT -- public --> HD2[handler: read Published rows]
    HD --> ERR{error thrown?}
    HD2 --> ERR
    ERR -- yes --> EH[errorHandler: typed status, HTML or JSON]
    ERR -- no --> RES[response]
    EH --> RES
    R200 --> RES
    X429 --> RES
    X405 --> RES
    X403 --> RES
    X302 --> RES
    X401 --> RES
    RES --> E([Response sent])
```

---

## D-ACT-02 — Activity Diagram: Publication workflow (owner)

**Teaches:** the deliberate Draft→Preview→Publish loop and the validation/409 guard rails around it. [EVIDENCED: `manageRoutes.js:121-220, 447-470`; `tests/publication.test.js`]

```mermaid
flowchart TD
    S([Start: owner wants content live]) --> L[Sign in via D-SEQ-02]
    L --> W{Which entity?}
    W -- profile --> F1[POST /manage/profile]
    W -- project --> F2[POST /manage/projects]
    W -- skill --> F3[POST /manage/skills]
    W -- claim --> F4[POST /manage/claims + source validation]
    F1 --> V{validators pass?}
    F2 --> V
    F3 --> V
    F4 --> V
    V -- no --> E[400 re-render with fieldErrors, values preserved] --> F2
    V -- yes --> D[(row saved, publication_state = Draft)]
    D --> AT[attach evidence / skills / claims links, idempotent]
    AT --> PV[GET /manage/preview/... — all claims incl. drafts]
    PV --> OK{satisfied?}
    OK -- no --> ED[edit via POST :id] --> PV
    OK -- yes --> PB[POST :id/publish]
    PB --> PUB[(publication_state = Published)]
    PUB --> CHK[open public page as visitor]
    CHK --> GOOD{visible and correct?}
    GOOD -- no --> UP[POST :id/unpublish] --> ED
    GOOD -- yes --> DELQ{remove later?}
    DELQ -- yes --> DL[POST :id/delete]
    DL --> BLK{claims reference it?}
    BLK -- yes --> X409[409 Conflict: delete claims first] --> DELQ
    BLK -- no --> GONE[(row deleted, join rows cascade)] --> E2([End])
    DELQ -- no --> E2
```

---

## D-ACT-03 — Activity Diagram: Evidence creation + accessibility

**Teaches:** the honesty invariant mechanics — a reference must be describable, URLs must be http(s), and accessibility defaults to Public and is changed only via the dedicated endpoint. [EVIDENCED: `manageRoutes.js:402-445`, `evidenceRepository.js:19-35`]

```mermaid
flowchart TD
    S([Start: add evidence reference]) --> IN[GET /manage/evidence form]
    IN --> POST[POST /manage/evidence with description, file_path, file_type, _csrf]
    POST --> Q1{description or file_path present?}
    Q1 -- no --> FE1[400: provide a description, a reference URL, or both] --> IN
    Q1 -- yes --> Q2{file_path provided?}
    Q2 -- yes --> Q3{isHttpUrl http/https?}
    Q3 -- no --> FE2[400 fieldErrors.file_path = must be a valid http-s URL] --> IN
    Q3 -- yes --> CR
    Q2 -- no --> CR[INSERT evidence, accessibility_status = Public]
    CR --> ATT{attach to?}
    ATT -- claim --> A1[POST /manage/claims/:id/evidence — INSERT OR IGNORE claim_evidence]
    ATT -- project --> A2[POST /manage/projects/:id/evidence — INSERT OR IGNORE project_evidence]
    ATT -- skill --> A3[POST /manage/skills/:id/evidence — INSERT OR IGNORE skill_evidence]
    ATT -- none --> LATER[leave unlinked — manage page shows supports no claims]
    A1 --> ACC
    A2 --> ACC
    A3 --> ACC
    LATER --> ACC{change accessibility?}
    ACC -- yes --> SET[POST /manage/evidence/:id/accessibility — enum-guarded]
    ACC -- no --> END1([End])
    SET --> END1
```

---

## D-SEQ-01 — Sequence: Visitor inspects a published project (UC-002)

**Teaches:** the three-query traceability render — project row, claims, per-claim evidence — and the 404 guard for anything unpublished. [EVIDENCED: `publicRoutes.js:35-54`]

```mermaid
sequenceDiagram
    autonumber
    actor V as Visitor
    participant MW as Middleware chain
    participant PR as publicRoutes
    participant PRepo as projectRepository
    participant CRepo as claimRepository
    participant DB as SQLite
    participant EJS as projects/detail.ejs

    V->>MW: GET /projects/2
    MW->>MW: helmet, session, rate-limit, 405-gate (GET ok), CSRF skip
    MW->>PR: dispatch
    PR->>PRepo: getById(2)
    PRepo->>DB: SELECT * FROM project WHERE id = 2
    DB-->>PRepo: row (publication_state = Published)
    PRepo-->>PR: project
    alt not found or not Published
        PR-->>V: 404 error page (tests/publication.test.js:49)
    else Published
        PR->>PRepo: listClaims(2, onlyPublished=true)
        PRepo->>DB: SELECT * FROM claim WHERE source='project' AND id=2 AND state='Published'
        DB-->>PR: claim rows
        loop each claim c
            PR->>CRepo: listEvidence(c.id)
            CRepo->>DB: SELECT e.* FROM evidence JOIN claim_evidence
            DB-->>CRepo: evidence rows
        end
        PR->>PRepo: listEvidence(2), listSkills(2)
        PR->>EJS: render with claims+evidence+accessibility labels
        EJS-->>V: 200 HTML (honest labels)
    end
```

---

## D-SEQ-02 — Sequence: Owner signs in (UC-005)

**Teaches:** CSRF-before-auth ordering, bcrypt verification, session rotation with token rebind, and safe `returnTo`. [EVIDENCED: `manageRoutes.js:22-49`; `tests/auth.test.js:18-60`]

```mermaid
sequenceDiagram
    autonumber
    actor O as Owner
    participant App as app.js chain
    participant CSRF as csrfMiddleware
    participant MR as manageRoutes
    participant Auth as verifyCredential
    participant SES as express-session

    O->>App: GET /manage (unauthenticated)
    App-->>O: 302 Location /manage/login (returnTo=/manage stored)
    O->>App: GET /manage/login
    App->>SES: issue session + csrfToken (32 random bytes hex)
    App-->>O: 200 login form with _csrf hidden field
    O->>App: POST /manage/login {password, _csrf}
    App->>CSRF: verify token
    alt token missing or wrong
        CSRF-->>O: 403 — no side effects
    else token valid
        CSRF->>MR: next()
        MR->>Auth: bcrypt.compareSync(password, OWNER_BCRYPT_HASH)
        alt compare fails
            MR-->>O: 401 Invalid credentials
        else compare succeeds
            MR->>SES: session.regenerate()
            SES-->>MR: fresh sid
            MR->>SES: authenticated=true, csrfToken=oldToken, createdAt=lastSeen=now
            MR-->>O: 303 Location /manage (returnTo consumed)
        end
    end
```

---

## D-SEQ-03 — Sequence: Create a project (validated write, UC-007)

**Teaches:** validation-precedes-write with values-preserving 400 re-render, and the Draft default. [EVIDENCED: `manageRoutes.js:132-148`, `projectRepository.js:23-30`]

```mermaid
sequenceDiagram
    autonumber
    actor O as Owner
    participant MR as manageRoutes POST /manage/projects
    participant VAL as requireText/optionalText
    participant PRepo as projectRepository
    participant DB as SQLite

    O->>MR: POST form {title, description, ..., _csrf}
    MR->>VAL: title<=300 required, description<=10000, outcomes<=5000, roles<=500, technologies<=1000
    alt any field error
        VAL-->>MR: errors object
        MR-->>O: 400 form re-render, fieldErrors + submitted values
    else all valid
        MR->>PRepo: create(values)
        PRepo->>DB: INSERT INTO project (..., publication_state) VALUES (..., 'Draft')
        DB-->>PRepo: lastInsertRowid
        PRepo-->>MR: id
        MR-->>O: 303 Location /manage/projects
    end
```

---

## D-SEQ-04 — Sequence: Publish → public visibility flip (UC-007/UC-001)

**Teaches:** publication is a single UPDATE; visibility is derived at read time, never copied. [EVIDENCED: `manageRoutes.js:186-198`, `projectRepository.js:13-16,49-53`; `tests/publication.test.js:12-51`]

```mermaid
sequenceDiagram
    autonumber
    actor O as Owner
    participant MR as manageRoutes
    participant DB as SQLite
    participant PR as publicRoutes

    O->>MR: POST /manage/projects/2/publish (_csrf)
    MR->>DB: UPDATE project SET publication_state='Published' WHERE id=2
    MR-->>O: 303 /manage/projects
    Note over DB: while Draft: GET /projects omitted row entirely
    O->>PR: GET /projects (as any visitor)
    PR->>DB: SELECT * FROM project WHERE publication_state='Published'
    DB-->>PR: includes project 2 now
    PR-->>O: 200 list contains title
    O->>PR: POST /manage/projects/2/unpublish
    MR->>DB: UPDATE ... SET publication_state='Draft'
    O->>PR: GET /projects/2
    PR-->>O: 404 (detail hides again)
```

---

## D-SEQ-05 — Sequence: Link evidence to a claim + reverse traceability (UC-009/UC-010)

**Teaches:** idempotent link creation and the bidirectional queries that make FR-003 true. [EVIDENCED: `claimRepository.js:67-80`, `evidenceRepository.js:47-53`, `manageRoutes.js:383-392`]

```mermaid
sequenceDiagram
    autonumber
    actor O as Owner
    participant MR as manageRoutes
    participant CRepo as claimRepository
    participant ERepo as evidenceRepository
    participant DB as SQLite

    O->>MR: POST /manage/claims/7/evidence {evidence_id=11, _csrf}
    MR->>CRepo: getById(7)
    alt claim missing
        MR-->>O: 404 Claim not found
    end
    MR->>ERepo: getById(11)
    alt evidence missing
        MR-->>O: 400 Choose an existing evidence item
    end
    MR->>CRepo: attachEvidence(7, 11)
    CRepo->>DB: INSERT OR IGNORE INTO claim_evidence (7,11)
    DB-->>MR: changes (0 if already linked — idempotent)
    MR-->>O: 303 /manage/claims
    Note over DB: forward: claim page nests evidence via JOIN claim_evidence<br/>reverse: evidence page lists its claims via evidenceRepository.listClaims
```

---

## D-SEQ-06 — Sequence: Security ordering contract (405 → 403 → 401)

**Teaches:** the frozen precedence that the test suite pins: method contract first, CSRF second, authentication third. [EVIDENCED: `app.js:85-95`, `csrf.js:19-30`, `auth.js:40-52`; `tests/auth.test.js:18-42`]

```mermaid
sequenceDiagram
    autonumber
    participant X as Client (any)
    participant MW as app.js chain

    X->>MW: POST /projects {title:x}            (public path, no session)
    MW-->>X: 405 {"error":"Method Not Allowed"}   (405 gate fires before CSRF)

    X->>MW: POST /manage/projects {title:x}     (no _csrf)
    MW->>MW: rate-limit ok, csrf check
    MW-->>X: 403 Forbidden (no side effects)

    X->>MW: POST /manage/projects {_csrf:valid, title:x}  (unauthenticated)
    MW->>MW: csrf ok → requireAuth
    MW-->>X: 401 error page

    X->>MW: GET /manage/projects (unauthenticated)
    MW-->>X: 302 Location /manage/login (returnTo saved)
```

---

## D-SEQ-07 — Sequence: Health probe + graceful shutdown (UC-012/013)

**Teaches:** readiness is a real DB query, and shutdown closes the DB before exit with a 5 s force-exit. [EVIDENCED: `health.js:13-21`, `app.js:129-145`]

```mermaid
sequenceDiagram
    autonumber
    participant M as Monitor/Orchestrator
    participant HR as health route
    participant DB as connectDB singleton
    participant P as Process

    M->>HR: GET /health
    HR->>DB: connectDB()
    HR->>DB: SELECT 1 AS ok
    DB-->>HR: ok
    HR-->>M: 200 {"status":"OK","database":"up","timestamp":...}
    alt DB check fails
        HR-->>M: 503 {"status":"ERROR","database":"down",...}
    end
    P->>P: SIGINT / SIGTERM received
    P->>P: server.close() — stop accepting
    P->>DB: connectDB().close()
    P-->>M: exit 0 (hard exit 1 after 5 s)
```

---

## D-SEQ-08 — Sequence: Preview a draft (UC-011)

**Teaches:** previews reuse the exact public templates but bypass the Published filter — the owner sees drafts without publishing. [EVIDENCED: `manageRoutes.js:447-470`]

```mermaid
sequenceDiagram
    autonumber
    actor O as Owner
    participant MR as manageRoutes
    participant PRepo as projectRepository
    participant EJS as projects/detail.ejs

    O->>MR: GET /manage/preview/project/3
    MR->>PRepo: getById(3)
    alt not found
        MR-->>O: 404
    else found (any state)
        MR->>PRepo: listClaims(3, onlyPublished=false)  -- drafts included
        MR->>PRepo: listEvidence(3), listSkills(3)
        MR->>EJS: render public template {preview:true, isAuthenticated:true}
        EJS-->>O: 200 HTML (identical to post-publish view)
    end
    Note over EJS: response carries Cache-Control: no-store (manage path)
```

---

## D-COM-01 — Communication Diagram: Login collaboration

**Teaches:** the same flow as D-SEQ-02 seen as object links with numbered messages — useful when refactoring `auth.js` + `manageRoutes.js` together. [EVIDENCED: `manageRoutes.js:27-45`, `csrf.js`, `auth.js:55-63`]

```mermaid
flowchart LR
    O(["Owner browser"]) -- "1: GET /manage/login" --> SES["session<br/>(csrfToken)"]
    SES -- "2: 200 form + _csrf" --> O
    O -- "3: POST password + _csrf" --> CSRF["csrfMiddleware"]
    CSRF -- "4: token ok" --> MR["manageRoutes /login"]
    MR -- "5: compareSync" --> AUTH["verifyCredential<br/>(OWNER_BCRYPT_HASH)"]
    AUTH -- "6: true" --> REG["session.regenerate()"]
    REG -- "7: rebind csrfToken, set timestamps" --> SES
    SES -- "8: 303 /manage (returnTo)" --> O
    CSRF -. "403 invalid token" .-> O
    AUTH -. "401 wrong password" .-> O
```

---

## D-DEP-01 — Deployment Diagram

**Teaches:** what is actually deployed today vs the target declared in scope. Solid = exists; dashed = planned (BUILD_ROADMAP MODULE-009/010). [EVIDENCED: `package.json:5-11`, `database.js:26-35`, `app.js:46,67`; gap evidence: no `.github/`, no Dockerfile]

```mermaid
flowchart LR
    subgraph Client["«device» Client workstation/phone"]
        BR["Browser (visitor or owner)"]
    end

    subgraph Host["«node» Dev host (Windows) — as-is"]
        subgraph NodeP["«execution environment» Node.js 20+ process"]
            ART["«artifact» portfolio-system<br/>src/server.js + src/** + public/**"]
            SES["«artifact» MemoryStore sessions"]
        end
        ENV["«artifact» .env<br/>SESSION_SECRET, OWNER_BCRYPT_HASH, PORT, NODE_ENV, DB_PATH"]
        DB[("«artifact» data/dev.db<br/>SQLite WAL + schema.sql applied")]
        ART --- ENV
        ART --> DB
        ART --- SES
    end

    subgraph Target["«node» Container host — planned"]
        subgraph DK["«execution environment» Docker container (node:20-slim, USER node)"]
            ART2["«artifact» image: app + node_modules(omit=dev)"]
            VOL[("«artifact» volume /data/portfolio.db")]
        end
        CI["«node» GitHub Actions runner — planned<br/>npm ci → lint → test → audit"]
        ART2 --> VOL
    end

    BR -->|HTTP :3000 / HTTPS behind proxy later| NodeP
    BR -.->|HTTP| DK
    CI -.->|builds| DK
```

Deployment facts to respect: `secure` cookies and `trust proxy 1` activate only when `NODE_ENV=production` (`app.js:20,46,67`) — a production deployment must terminate TLS at a proxy or cookies will not send over HTTPS; sessions do not survive restarts (MemoryStore) so restarts are safe for data but force re-login.

---

## D-ERD-01 — ER Diagram (persistence view)

Self-contained copy of the data model view (narrative + field meanings in `SYSTEM_BLUEPRINT.md` §3). [EVIDENCED: `src/db/schema.sql`]

```mermaid
erDiagram
    profile ||--o{ experience : "profile_id CASCADE"
    profile ||--o{ education : "profile_id CASCADE"
    project ||--o{ project_skill : "CASCADE"
    skill  ||--o{ project_skill : "CASCADE"
    project ||--o{ project_evidence : "CASCADE"
    evidence ||--o{ project_evidence : "CASCADE"
    skill ||--o{ skill_evidence : "CASCADE"
    evidence ||--o{ skill_evidence : "CASCADE"
    claim ||--o{ claim_evidence : "CASCADE"
    evidence ||--o{ claim_evidence : "CASCADE"

    profile {
        int id PK
        string name
        string role
        string summary
        string contact_info
        string publication_state
        int singleton "UNIQUE=1"
    }
    project {
        int id PK
        string title
        string description
        string outcomes
        string roles
        string technologies
        string publication_state
    }
    skill {
        int id PK
        string name "unique ci, app-level"
        string description
        string publication_state
    }
    evidence {
        int id PK
        string description
        string file_path "http(s) URL"
        string file_type
        string accessibility_status
    }
    claim {
        int id PK
        string statement
        string justification
        string source_entity_type "profile|project|skill"
        int source_entity_id "no SQL FK - route-validated"
        string publication_state
    }
    experience {
        int id PK
        int profile_id FK
        string title
        string company
        string start_date
        string end_date
    }
    education {
        int id PK
        int profile_id FK
        string institution
        string degree
        string field_of_study
        string start_date
        string end_date
    }
```

---

## How to use this file

1. **Onboarding:** read D-UC-01 → D-CD-01 → D-ACT-01 in that order; that is actor → data → control flow.
2. **Before changing security code:** re-check D-ACT-01 and D-SEQ-06 — the ordering is test-locked and breaking it breaks `tests/auth.test.js`.
3. **Before any schema change:** D-CD-01 + D-ERD-01 are the source of truth for cascade semantics; pair the change with a migration (BUILD_ROADMAP MODULE-012).
4. **Before adding a page:** D-CD-02 shows the exact layer your route must sit in; D-SEQ-03 shows the validate-then-write pattern to copy.
5. **Diagram truth rule:** like all docs here, these diagrams can drift. The executables of truth are `npm test` (38/38 as of 2026-10-10) and `npm run lint`. Any code change that alters a flow shown here must update the diagram in the same PR (Engineering Checklist, `BUILD_ROADMAP.md` §5).
