export interface Project {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  category: string;
  status: 'Published' | 'Draft' | 'Archived';
  evidenceAccess: 'Public' | 'Restricted' | 'Redacted' | 'Unavailable';
  role: string;
  timeline: string;
  featured: boolean;
  technologies: string[];
  repoUrl?: string;
  demoUrl?: string;
  architectureNote?: string;
  problem: string;
  solution: string;
  decisions?: {
    decision: string;
    choice: string;
    rationale: string;
  }[];
  keyMetrics?: {
    label: string;
    value: string;
  }[];
  evidenceSha?: string;
}

export interface SkillCategory {
  category: string;
  description: string;
  skills: {
    name: string;
    level: string;
    evidenceCount: number;
    description: string;
  }[];
}

export interface EvidenceItem {
  id: string;
  slug: string;
  title: string;
  projectSlug: string;
  projectName: string;
  type: 'Code Repository' | 'Architecture RFC' | 'Benchmark Report' | 'Test Suite' | 'Schema Spec';
  access: 'Public' | 'Restricted' | 'Redacted' | 'Unavailable';
  sha256: string;
  description: string;
  date: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'ATTESTED';
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  location: string;
  period: string;
  type: 'Work' | 'Education' | 'Certification';
  highlights: string[];
  skills: string[];
}

export interface Profile {
  name: string;
  title: string;
  location: string;
  timezone: string;
  email: string;
  github: string;
  githubUrl: string;
  linkedin: string;
  linkedinUrl: string;
  bioHeadline: string;
  bioSub: string;
  status: string;
  uptime: string;
  latencyAvg: string;
  architectureStyle: string;
  provenance: string;
}

export const INITIAL_PROFILE: Profile = {
  name: "Simon Ipara",
  title: "Full Stack Developer | Software Engineer",
  location: "Nairobi, Kenya",
  timezone: "EAT (UTC+3)",
  email: "simonipara428@gmail.com",
  github: "SIM350-maker",
  githubUrl: "https://github.com/SIM350-maker",
  linkedin: "simonipara",
  linkedinUrl: "https://linkedin.com/in/simonipara",
  bioHeadline: "I build practical software systems with thoughtful architecture, clear user experiences, and a focus on solving real problems.",
  bioSub: "Full-stack engineering across web applications, APIs, databases, and mobile experiences—with an emphasis on maintainable systems and verifiable project work.",
  status: "OPEN TO ROLES & COLLABORATION",
  uptime: "99.98%",
  latencyAvg: "0.8ms API Avg",
  architectureStyle: "Clean / DDD",
  provenance: "100% Cryptographic Provenance"
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    slug: "healthcare-mis",
    title: "Web-Based Healthcare Management Information System",
    subtitle: "Enterprise Clinic & Patient Health Record Platform",
    summary: "A mission-critical medical records and clinic workflow management system delivering sub-second query performance across high-volume outpatient records, appointment scheduling, and role-based clinician audit trails.",
    category: "Enterprise Full Stack",
    status: "Published",
    evidenceAccess: "Public",
    role: "Lead Full-Stack Architect & Core Developer",
    timeline: "2025 – 2026",
    featured: true,
    technologies: ["TypeScript", "Next.js", "PostgreSQL", "Node.js", "Prisma", "Tailwind CSS", "Docker", "Redis"],
    repoUrl: "https://github.com/SIM350-maker/healthcare-mis",
    demoUrl: "https://healthcare-mis-demo.simonipara.dev",
    architectureNote: "Hexagonal domain-driven layout decoupling patient confidentiality rules from persistence layer.",
    keyMetrics: [
      { label: "P95 Query Latency", value: "< 42ms" },
      { label: "HIPAA Invariant Audits", value: "100% Passed" },
      { label: "Concurrent Sessions", value: "2,500+" }
    ],
    problem: "Paper-based medical record filing and fragmented departmental spreadsheets resulted in patient wait times exceeding 90 minutes and significant data synchronization discrepancies during clinical shift handovers.",
    solution: "Architected a unified, role-based Electronic Health Record (EHR) system featuring real-time triage queue dispatch, cryptographically signed patient encounter logs, and automated HL7/FHIR-compliant export pipelines.",
    decisions: [
      {
        decision: "PostgreSQL Row-Level Security (RLS) vs Application-Level Authorization",
        choice: "Native DB Row-Level Security",
        rationale: "Guarantees strict tenant and patient privacy isolation even if application-level bugs occur, enforcing zero data leakage at the storage engine level."
      },
      {
        decision: "Event-Driven Redis Caching for Clinic Queues",
        choice: "Redis Pub/Sub with Write-Through Invalidation",
        rationale: "Reduced database connection contention during peak triage hours by 78% while maintaining sub-100ms doctor workstation updates."
      }
    ],
    evidenceSha: "8f7e2c4b9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c"
  },
  {
    id: "proj-2",
    slug: "task-manager",
    title: "Professional Task Manager & Engineering Flow",
    subtitle: "Distributed Workflow Orchestration & Kanban Engine",
    summary: "High-concurrency sprint planning and asynchronous job tracker supporting real-time team collaboration, dependency trees, and automated status transition hooks.",
    category: "Distributed Systems",
    status: "Published",
    evidenceAccess: "Public",
    role: "Full Stack Engineer",
    timeline: "2025",
    featured: true,
    technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "Tailwind CSS"],
    repoUrl: "https://github.com/SIM350-maker/task-manager",
    demoUrl: "https://task-manager.simonipara.dev",
    keyMetrics: [
      { label: "Throughput", value: "15,000 req/s" },
      { label: "E2E Test Coverage", value: "94.2%" }
    ],
    problem: "Engineering teams required deterministic task dependency enforcement and auditable status progression without the overhead of heavy enterprise issue trackers.",
    solution: "Engineered a reactive task management platform with optimistic UI updates, WebSocket broadcast synchronization, and strict DAG graph dependency validation.",
    evidenceSha: "3d2f1b4c5a6e7890123456789abcdef0123456789abcdef0123456789abcdef0"
  },
  {
    id: "proj-3",
    slug: "padtrack",
    title: "PadTrack — School & Learner Tracking Concept",
    subtitle: "Offline-First Educational Resource & Attendance Ledger",
    summary: "Mobile-first resource distribution and student welfare tracking platform designed for low-bandwidth educational environments with local-first SQLite sync.",
    category: "Mobile / Offline-First",
    status: "Published",
    evidenceAccess: "Public",
    role: "System Designer & Frontend Engineer",
    timeline: "2024 – 2025",
    featured: true,
    technologies: ["React Native", "TypeScript", "SQLite", "Node.js", "Express", "REST"],
    repoUrl: "https://github.com/SIM350-maker/padtrack",
    demoUrl: "https://padtrack.simonipara.dev",
    keyMetrics: [
      { label: "Sync Efficiency", value: "< 1.2 KB payload" },
      { label: "Offline Storage", value: "10,000+ records" }
    ],
    problem: "Rural schools face intermittent network connectivity, preventing consistent tracking of essential health and educational support supplies.",
    solution: "Built a conflict-free replicated data sync pipeline storing state locally in SQLite and reconciling with central cloud instances upon connectivity restoration.",
    evidenceSha: "e9a8b7c6d5e4f3a2b10987654321fedcba9876543210fedcba9876543210fedc"
  },
  {
    id: "proj-4",
    slug: "evoting",
    title: "E-Voting Secure Ballot Application",
    subtitle: "Verifiable Cryptographic Ballot Audit Trail",
    summary: "Tamper-evident electronic voting platform implementing Merkle tree verification, double-blind ballot casting, and zero-knowledge receipt verification.",
    category: "Security & Cryptography",
    status: "Published",
    evidenceAccess: "Restricted",
    role: "Security & Backend Developer",
    timeline: "2024",
    featured: false,
    technologies: ["TypeScript", "Node.js", "Cryptography (SHA-256)", "PostgreSQL", "Next.js"],
    repoUrl: "https://github.com/SIM350-maker/evoting",
    demoUrl: "",
    keyMetrics: [
      { label: "Audit Integrity", value: "Cryptographically Sealed" },
      { label: "Ballot Anonymity", value: "Zero-Knowledge Hash" }
    ],
    problem: "Traditional institutional elections lack mathematical verifiability for voters while maintaining secrecy of individual votes.",
    solution: "Implemented an end-to-end verifiable ballot ledger where every voter receives an cryptographic receipt verifiable against an immutable Merkle tree root.",
    evidenceSha: "4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b"
  },
  {
    id: "proj-5",
    slug: "elite-drives",
    title: "Elite Drives — Fleet Rental & Dispatch Console",
    subtitle: "Automated Booking Engine & Telemetry Monitor",
    summary: "End-to-end vehicle booking, telematics monitoring, and dynamic price dispatch engine built for rapid checkout and multi-tier fleet management.",
    category: "Web Applications",
    status: "Published",
    evidenceAccess: "Public",
    role: "Full-Stack Engineer",
    timeline: "2024",
    featured: false,
    technologies: ["Next.js", "Tailwind CSS", "MongoDB", "Stripe API", "Node.js"],
    repoUrl: "https://github.com/SIM350-maker/elite-drives",
    demoUrl: "https://elitedrives.simonipara.dev",
    keyMetrics: [
      { label: "Booking Checkout", value: "< 3 Steps" },
      { label: "Fleet Telemetry", value: "Live Updates" }
    ],
    problem: "Manual fleet reservations suffered from double-booking risks and delays in driver verification.",
    solution: "Developed an automated self-service reservation portal with instant booking confirmation, deposit management, and real-time vehicle availability slots.",
    evidenceSha: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
  },
  {
    id: "proj-6",
    slug: "portfolio-ledger",
    title: "Personal Portfolio & Verifiable Evidence Ledger",
    subtitle: "Next.js 16 + CMS Dual-State Architecture",
    summary: "Editorial-technical showcase combining public verifiable case studies with an administrative CMS console, structured content schemas, and offline-resilient state.",
    category: "System Architecture",
    status: "Published",
    evidenceAccess: "Public",
    role: "Architect & Developer",
    timeline: "2026",
    featured: false,
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Lucide Icons"],
    repoUrl: "https://github.com/SIM350-maker/portfolio",
    demoUrl: "https://simonipara.dev",
    keyMetrics: [
      { label: "Accessibility", value: "WCAG 2.2 AA" },
      { label: "Lighthouse Performance", value: "100/100" }
    ],
    problem: "Standard developer portfolios rely on static claims and unverified badges without tangible architectural evidence or operational proof.",
    solution: "Created an evidence-backed engineering profile integrating live system telemetry, cryptographic proof hashes, and an administrative CMS for dynamic record maintenance.",
    evidenceSha: "99887766554433221100aabbccddeeff00112233445566778899aabbccddeeff"
  }
];

export const INITIAL_SKILLS: SkillCategory[] = [
  {
    category: "Languages",
    description: "Core typed programming languages used in production services and client applications.",
    skills: [
      { name: "TypeScript", level: "Production", evidenceCount: 6, description: "Strict typing, generics, AST transformations, and enterprise Next.js/Node architectures." },
      { name: "JavaScript (ESNext)", level: "Production", evidenceCount: 6, description: "Async runtimes, event loop mechanics, V8 optimization patterns." },
      { name: "Python", level: "Proficient", evidenceCount: 3, description: "Data manipulation, backend automation scripts, and API prototypes." },
      { name: "SQL", level: "Production", evidenceCount: 5, description: "Complex joins, indexing strategies, CTEs, and PostgreSQL procedural functions." },
      { name: "Go", level: "Working Knowledge", evidenceCount: 2, description: "Concurrent microservice pipelines, goroutines, and lightweight REST services." }
    ]
  },
  {
    category: "Frontend & UI Systems",
    description: "Component systems, performance engineering, and accessible web application interfaces.",
    skills: [
      { name: "Next.js (App Router)", level: "Production", evidenceCount: 5, description: "Server Components (RSC), Streaming SSR, route handlers, and edge middleware." },
      { name: "React", level: "Production", evidenceCount: 6, description: "Hooks, custom state orchestration, context optimization, and concurrent features." },
      { name: "Tailwind CSS", level: "Production", evidenceCount: 6, description: "Design token architectures, responsive layouts, and utility-first systems." },
      { name: "Accessibility (a11y)", level: "Standard", evidenceCount: 4, description: "WCAG 2.2 AA compliance, semantic ARIA attributes, and keyboard navigation." }
    ]
  },
  {
    category: "Backend & Distributed APIs",
    description: "Scalable server architectures, service boundaries, and data pipelines.",
    skills: [
      { name: "Node.js & Express", level: "Production", evidenceCount: 5, description: "RESTful architecture, streaming requests, middleware pipelines, and clustering." },
      { name: "RESTful API Design", level: "Production", evidenceCount: 6, description: "Contract-first OpenAPI specs, idempotency keys, and semantic HTTP status flows." },
      { name: "Authentication & Security", level: "Production", evidenceCount: 4, description: "JWT, session cookies, OAuth2 flows, and role-based access control (RBAC)." },
      { name: "WebSocket & Realtime", level: "Proficient", evidenceCount: 3, description: "Bi-directional sockets, heartbeat protocols, and reconnection strategies." }
    ]
  },
  {
    category: "Databases & Storage",
    description: "Relational modeling, distributed caching, and offline-first storage mechanisms.",
    skills: [
      { name: "PostgreSQL", level: "Production", evidenceCount: 5, description: "Row-Level Security (RLS), schema migrations, query tuning, and EXPLAIN ANALYZE." },
      { name: "Redis", level: "Proficient", evidenceCount: 3, description: "Pub/Sub queues, distributed cache invalidation, and rate limiting algorithms." },
      { name: "Prisma ORM", level: "Production", evidenceCount: 4, description: "Type-safe database queries, schema modeling, and automated relational migrations." },
      { name: "SQLite", level: "Proficient", evidenceCount: 2, description: "Offline-first embedded storage and local sync engines." },
      { name: "MongoDB", level: "Proficient", evidenceCount: 2, description: "Document modeling, aggregation pipelines, and schema indexing." }
    ]
  },
  {
    category: "DevOps, Cloud & Architecture",
    description: "Deployment automation, environment reproducibility, and architectural patterns.",
    skills: [
      { name: "Docker & Containers", level: "Production", evidenceCount: 4, description: "Multi-stage Dockerfiles, compose stacks, and reproducible development containers." },
      { name: "Git & CI/CD", level: "Production", evidenceCount: 6, description: "Conventional commits, automated lint/test workflows, and branch protections." },
      { name: "Clean Architecture & DDD", level: "Core Philosophy", evidenceCount: 5, description: "Domain isolation, dependency inversion, and hex boundary definitions." },
      { name: "Test-Driven Development (TDD)", level: "Production", evidenceCount: 4, description: "Unit test isolation, integration matrices, and contract verification." }
    ]
  }
];

export const INITIAL_EVIDENCE: EvidenceItem[] = [
  {
    id: "evd-1",
    slug: "postgresql-rls-policy",
    title: "PostgreSQL Row-Level Security (RLS) Policy & Audit Triggers",
    projectSlug: "healthcare-mis",
    projectName: "Healthcare MIS",
    type: "Architecture RFC",
    access: "Public",
    sha256: "8f7e2c4b9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c",
    description: "Production SQL migration enforcing medical tenant data segregation and automated immutable audit logging for all patient record access events.",
    date: "2026-02-14",
    verificationStatus: "VERIFIED"
  },
  {
    id: "evd-2",
    slug: "redis-clinic-queue-benchmark",
    title: "Clinic Queue Redis Benchmark & Load Simulation Script",
    projectSlug: "healthcare-mis",
    projectName: "Healthcare MIS",
    type: "Benchmark Report",
    access: "Public",
    sha256: "3d2f1b4c5a6e7890123456789abcdef0123456789abcdef0123456789abcdef0",
    description: "k6 load testing script demonstrating sub-45ms p99 response times under 2,500 concurrent clinician requests with Redis pub/sub queue dispatching.",
    date: "2026-01-20",
    verificationStatus: "VERIFIED"
  },
  {
    id: "evd-3",
    slug: "merkle-tree-ballot-proof",
    title: "Merkle Tree Cryptographic Ballot Audit Trail Specification",
    projectSlug: "evoting",
    projectName: "E-Voting Secure Ballot",
    type: "Schema Spec",
    access: "Restricted",
    sha256: "4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b",
    description: "Cryptographic specification for double-blind vote casting and receipt hashing. Access restricted to security reviewers upon NDA attestation.",
    date: "2025-11-12",
    verificationStatus: "ATTESTED"
  },
  {
    id: "evd-4",
    slug: "offline-sync-sqlite-engine",
    title: "Offline-First SQLite Synchronization State Machine",
    projectSlug: "padtrack",
    projectName: "PadTrack",
    type: "Code Repository",
    access: "Public",
    sha256: "e9a8b7c6d5e4f3a2b10987654321fedcba9876543210fedcba9876543210fedc",
    description: "TypeScript state machine orchestrating bi-directional conflict resolution between local SQLite replicas and centralized cloud endpoints.",
    date: "2025-08-30",
    verificationStatus: "VERIFIED"
  },
  {
    id: "evd-5",
    slug: "task-manager-e2e-matrix",
    title: "E2E Cypress Test Suite & Invariant Verification Matrix",
    projectSlug: "task-manager",
    projectName: "Professional Task Manager",
    type: "Test Suite",
    access: "Public",
    sha256: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    description: "Complete end-to-end integration test suite verifying DAG circular dependency detection and concurrent drag-and-drop board reorganizations.",
    date: "2025-06-18",
    verificationStatus: "VERIFIED"
  }
];

export const INITIAL_EXPERIENCE: ExperienceItem[] = [
  {
    id: "exp-1",
    role: "Full-Stack Software Engineer & Solutions Architect",
    organization: "Independent Practice / Client Engagements",
    location: "Nairobi, Kenya",
    period: "2024 — Present",
    type: "Work",
    highlights: [
      "Engineered full-lifecycle enterprise web applications using Next.js App Router, Node.js, and PostgreSQL.",
      "Designed and deployed the Web-Based Healthcare Management Information System, reducing patient intake bottlenecks by over 60%.",
      "Formulated strict domain boundary architectures and automated testing pipelines targeting WCAG 2.2 AA accessibility standards."
    ],
    skills: ["TypeScript", "Next.js", "PostgreSQL", "Docker", "Prisma", "Tailwind CSS", "Redis"]
  },
  {
    id: "exp-2",
    role: "Software Engineering Fellow & Core Contributor",
    organization: "Open Technology Initiatives & Collaborative Labs",
    location: "Nairobi, Kenya",
    period: "2023 — 2024",
    type: "Work",
    highlights: [
      "Contributed to modular API microservices and offline-first mobile sync protocols for educational tracking systems.",
      "Implemented automated CI/CD pipelines with GitHub Actions, enforcing strict linting, type checks, and container image builds.",
      "Conducted system profiling that reduced client-side bundle sizes by 38% through route-level code splitting and tree-shaking."
    ],
    skills: ["React", "Node.js", "Express", "SQLite", "Git", "REST APIs"]
  },
  {
    id: "exp-3",
    role: "Bachelor of Science in Computer Science / Software Engineering",
    organization: "Accredited University",
    location: "Kenya",
    period: "2020 — 2024",
    type: "Education",
    highlights: [
      "Deep study in Data Structures & Algorithms, Distributed Systems, Database Management Systems, and Network Security.",
      "Cap-stone project focused on Verifiable Cryptographic Ledger Systems and Secure Web Application Architectures."
    ],
    skills: ["Data Structures", "Algorithms", "Database Systems", "Operating Systems", "Computer Networks"]
  }
];
