import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Seeding service_category...");
  // Seed one by one
  const categories = [
    { title: 'Full-Stack Web Applications', slug: 'fullstack', icon: 'Layers', description: 'End-to-end product engineering with Next.js, React, Node.js and PostgreSQL', long_description: 'Complete product development from concept to production: Next.js App Router, React Server Components, TypeScript, Tailwind CSS, PostgreSQL, Prisma/Drizzle. Includes authentication, real-time features, background jobs, and production deployment.', display_order: 1 },
    { title: 'Backend APIs & Microservices', slug: 'backend', icon: 'Server', description: 'Contract-first REST and gRPC services with OpenAPI/Protobuf schemas', long_description: 'Build scalable backend systems: Node.js/Fastify/Hono, Go, or Rust with clean domain boundaries. Request validation, authentication (JWT, mTLS), rate limiting, structured logging, metrics, distributed tracing, and load testing.', display_order: 2 },
    { title: 'Database Architecture & Security', slug: 'database', icon: 'Database', description: 'Schema design, migrations, and PostgreSQL Row-Level Security for multi-tenant data', long_description: 'Expert database engineering: schema design, normalization, indexing strategy, migration tooling, RLS policies for data isolation, query optimization, capacity planning, backup/PITR, and disaster recovery.', display_order: 3 },
    { title: 'Cloud, DevOps & Reliability', slug: 'cloud', icon: 'Cloud', description: 'Containerised deployment pipelines, GitOps, and SRE-grade observability', long_description: 'Production-ready infrastructure: Kubernetes (EKS/GKE/AKS/k3s), Docker, GitOps (ArgoCD/Flux), Terraform/Pulumi, Prometheus/Grafana/Loki, SLO dashboards, burn-rate alerts, and chaos engineering.', display_order: 4 },
    { title: 'AI Integration & Automation', slug: 'ai', icon: 'Bot', description: 'LLM-assisted workflows: document generation, evidence matching, code synthesis', long_description: 'Embedded AI with discipline: prompt library with versioned templates, automated evaluation harness, provenance metadata, human-in-the-loop review UI, cost/latency monitoring, and structured output parsing.', display_order: 5 },
    { title: 'Technical Consulting & Reviews', slug: 'consulting', icon: 'Compass', description: 'Architecture reviews, ADR authoring, performance audits, security assessments', long_description: 'Fractional CTO/Architect services: architecture reviews, ADR authoring, threat modeling, performance bottleneck analysis, code quality audits, team mentorship, and board-ready reporting.', display_order: 6 },
  ];
  
  for (const c of categories) {
    try {
      await sql`
        INSERT INTO service_category (title, slug, icon, description, long_description, display_order)
        VALUES (${c.title}, ${c.slug}, ${c.icon}, ${c.description}, ${c.long_description}, ${c.display_order})
        ON CONFLICT (slug) DO NOTHING
      `;
    } catch (e: any) {
      console.log(`Category ${c.slug}:`, e.message?.substring(0, 100));
    }
  }
  console.log("service_category seeded");
  
  // Get category IDs
  const cats = await sql`SELECT id, slug FROM service_category`;
  const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]));
  console.log("Category map:", catMap);
  
  // Seed service_package
  console.log("\n--- Seeding service_package ---");
  const packages = [
    { cat: 'fullstack', name: 'Starter', slug: 'starter', description: 'Perfect for MVPs and early-stage products', price_kes: 250000, currency: 'KES', billing_cycle: 'one_time', features: '["Next.js 15 + TypeScript + Tailwind", "PostgreSQL + Prisma", "Authentication (NextAuth)", "Responsive UI (WCAG 2.1)", "CI/CD pipeline (GitHub Actions)", "Vercel/Cloudflare deployment"]', highlights: '["Up to 5 core features", "2-week sprint cycles", "Code review included", "30-day warranty"]', cta_text: 'Start Project', is_popular: false, display_order: 1 },
    { cat: 'fullstack', name: 'Professional', slug: 'professional', description: 'Full-featured product for growth-stage companies', price_kes: 650000, currency: 'KES', billing_cycle: 'one_time', features: '["Everything in Starter", "Real-time features (WebSockets)", "Background jobs (Redis + Bull)", "Advanced auth (RBAC, MFA)", "Automated testing (unit + e2e)", "Storybook component library", "Docker containerization"]', highlights: '["Up to 15 core features", "Weekly demos", "Architecture decision records", "60-day warranty", "Handoff documentation"]', cta_text: 'Get Quote', is_popular: true, display_order: 2 },
    { cat: 'fullstack', name: 'Enterprise', slug: 'enterprise', description: 'Mission-critical systems with SLA', price_kes: 1500000, currency: 'KES', billing_cycle: 'one_time', features: '["Everything in Professional", "Multi-tenant architecture", "PostgreSQL RLS + encryption", "Custom SSO/SAML/OIDC", "Audit logging & compliance", "Disaster recovery (RPO < 1hr)", "24/7 on-call rotation (add-on)"]', highlights: '["Unlimited features", "Dedicated team", "Security audit included", "90-day warranty", "Ongoing retainer available"]', cta_text: 'Contact Sales', is_popular: false, display_order: 3 },
    { cat: 'backend', name: 'Single Service', slug: 'single-service', description: 'One well-bounded microservice', price_kes: 180000, currency: 'KES', billing_cycle: 'one_time', features: '["OpenAPI 3.1 / Protobuf contract", "Node.js (Fastify/Hono) or Go", "PostgreSQL + migrations", "JWT auth + rate limiting", "Structured logging + metrics", "Docker + Helm chart"]', highlights: '["Single bounded context", "Contract-first design", "Load tested (10k RPS)", "30-day warranty"]', cta_text: 'Start Service', is_popular: false, display_order: 1 },
    { cat: 'backend', name: 'Platform', slug: 'platform', description: 'Multi-service platform with governance', price_kes: 550000, currency: 'KES', billing_cycle: 'one_time', features: '["Everything in Single", "Service mesh (Istio/Linkerd)", "Distributed tracing (Jaeger)", "Centralized config (Consul)", "API Gateway (Kong/Envoy)", "Contract testing (Pact)"]', highlights: '["3-5 microservices", "Shared libraries", "Contract registry", "60-day warranty"]', cta_text: 'Get Quote', is_popular: true, display_order: 2 },
    { cat: 'database', name: 'Schema Design', slug: 'schema-design', description: 'Greenfield schema with RLS', price_kes: 150000, currency: 'KES', billing_cycle: 'one_time', features: '["ER diagrams + normalization", "PostgreSQL 16 + RLS policies", "Migration tooling (Flyway)", "Indexing strategy + EXPLAIN", "Backup + PITR config"]', highlights: '["Up to 20 tables", "RLS per tenant/role", "Query optimization", "30-day warranty"]', cta_text: 'Design Schema', is_popular: false, display_order: 1 },
    { cat: 'database', name: 'Security Audit', slug: 'security-audit', description: 'RLS + encryption + compliance', price_kes: 300000, currency: 'KES', billing_cycle: 'one_time', features: '["Everything in Schema", "RLS policy audit", "Column-level encryption (pgcrypto)", "Row-level audit logging", "Compliance checklist (GDPR/POPIA)", "Pen-test coordination"]', highlights: '["Full security report", "Remediation plan", "Compliance evidence", "60-day warranty"]', cta_text: 'Audit Now', is_popular: true, display_order: 2 },
    { cat: 'cloud', name: 'CI/CD Setup', slug: 'cicd-setup', description: 'Automated pipelines from commit to prod', price_kes: 200000, currency: 'KES', billing_cycle: 'one_time', features: '["GitHub Actions / GitLab CI", "Multi-env (dev/staging/prod)", "Preview deployments", "Automated testing gates", "Rollback on failure", "Slack/Teams notifications"]', highlights: '["3 environments", "Zero-downtime deploys", "Security scanning", "30-day warranty"]', cta_text: 'Setup Pipeline', is_popular: false, display_order: 1 },
    { cat: 'cloud', name: 'SRE Platform', slug: 'sre-platform', description: 'Full observability + reliability', price_kes: 600000, currency: 'KES', billing_cycle: 'one_time', features: '["Everything in CI/CD", "Kubernetes (EKS/GKE/k3s)", "Terraform/Pulumi IaC", "Prometheus + Grafana + Loki", "SLO dashboards + burn alerts", "Chaos engineering (Litmus)", "On-call runbooks"]', highlights: '["Multi-cluster", "GitOps (ArgoCD/Flux)", "Cost optimization", "90-day warranty", "Monthly SRE retainer available"]', cta_text: 'Build Platform', is_popular: true, display_order: 2 },
    { cat: 'ai', name: 'Pilot Project', slug: 'pilot', description: 'Validate AI use case in 4-6 weeks', price_kes: 350000, currency: 'KES', billing_cycle: 'one_time', features: '["Use case discovery workshop", "Prompt library (10 templates)", "Eval harness (accuracy/cost/latency)", "Provenance tracking", "Human review UI", "Cost monitoring dashboard"]', highlights: '["Single use case", "POC to production path", "Model agnostic", "60-day warranty"]', cta_text: 'Run Pilot', is_popular: false, display_order: 1 },
    { cat: 'ai', name: 'Production AI', slug: 'production', description: 'Embedded AI with full governance', price_kes: 850000, currency: 'KES', billing_cycle: 'one_time', features: '["Everything in Pilot", "Multi-model routing", "A/B testing framework", "RLHF pipeline", "PII redaction", "Audit trail + compliance", "Model versioning (MLflow)"]', highlights: '["Multiple use cases", "CI/CD for prompts", "SOC2-ready", "90-day warranty", "Monthly AI ops retainer"]', cta_text: 'Deploy AI', is_popular: true, display_order: 2 },
    { cat: 'consulting', name: 'Architecture Review', slug: 'arch-review', description: '2-week deep-dive with ADRs', price_kes: 280000, currency: 'KES', billing_cycle: 'one_time', features: '["System architecture assessment", "Threat model (STRIDE)", "Performance profiling", "Technical debt inventory", "3 ADRs authored", "Executive summary"]', highlights: '["2-week engagement", "Board-ready report", "Remediation roadmap", "30-day follow-up"]', cta_text: 'Book Review', is_popular: false, display_order: 1 },
    { cat: 'consulting', name: 'Fractional CTO', slug: 'fractional-cto', description: 'Part-time technical leadership', price_kes: 350000, currency: 'KES', billing_cycle: 'monthly', features: '["Weekly sync + async comms", "ADR ownership", "Hiring & vendor interviews", "Architecture governance", "Team mentorship", "Board reporting"]', highlights: '["10 hrs/week guaranteed", "Slack availability", "Quarterly roadmap", "Cancel anytime"]', cta_text: 'Engage CTO', is_popular: true, display_order: 2 },
  ];
  
  for (const p of packages) {
    if (catMap[p.cat]) {
      try {
        await sql`
          INSERT INTO service_package (category_id, name, slug, description, price_kes, currency, billing_cycle, features, highlights, cta_text, is_popular, display_order)
          VALUES (${catMap[p.cat]}, ${p.name}, ${p.slug}, ${p.description}, ${p.price_kes}, ${p.currency}, ${p.billing_cycle}, ${p.features}, ${p.highlights}, ${p.cta_text}, ${p.is_popular}, ${p.display_order})
          ON CONFLICT (category_id, slug) DO NOTHING
        `;
      } catch (e: any) {
        console.log(`Package ${p.slug}:`, e.message?.substring(0, 100));
      }
    }
  }
  console.log("service_package seeded");
  
  // Seed service_feature
  console.log("\n--- Seeding service_feature ---");
  const features = [
    { cat: 'fullstack', title: 'Next.js App Router + RSC', description: 'React Server Components with streaming, Suspense, and server actions', icon: 'Code2', order: 1 },
    { cat: 'fullstack', title: 'TypeScript Strict Mode', description: 'End-to-end type safety with strict null checks and no implicit any', icon: 'ShieldCheck', order: 2 },
    { cat: 'fullstack', title: 'Tailwind CSS + Design System', description: 'Utility-first styling with consistent design tokens and dark mode', icon: 'Layers', order: 3 },
    { cat: 'fullstack', title: 'PostgreSQL + Prisma/Drizzle', description: 'Type-safe database access with migrations and connection pooling', icon: 'Database', order: 4 },
    { cat: 'backend', title: 'OpenAPI 3.1 / Protobuf Contracts', description: 'Contract-first development with generated clients and validation', icon: 'FileCode', order: 1 },
    { cat: 'backend', title: 'JWT + RBAC Authentication', description: 'Stateless auth with role-based access control and token refresh', icon: 'Lock', order: 2 },
    { cat: 'backend', title: 'Structured Logging + Metrics', description: 'JSON logs, Prometheus metrics, distributed tracing ready', icon: 'BarChart2', order: 3 },
    { cat: 'database', title: 'PostgreSQL RLS Policies', description: 'Row-level security for multi-tenant data isolation', icon: 'ShieldCheck', order: 1 },
    { cat: 'database', title: 'Migration Tooling (Flyway)', description: 'Versioned, repeatable schema migrations with rollback support', icon: 'GitBranch', order: 2 },
    { cat: 'database', title: 'Indexing & Query Optimization', description: 'EXPLAIN analysis, partial indexes, covering indexes for performance', icon: 'Zap', order: 3 },
    { cat: 'cloud', title: 'Kubernetes (EKS/GKE/k3s)', description: 'Container orchestration with Helm charts and GitOps', icon: 'Cloud', order: 1 },
    { cat: 'cloud', title: 'Terraform/Pulumi IaC', description: 'Infrastructure as code with state management and drift detection', icon: 'Server', order: 2 },
    { cat: 'cloud', title: 'Prometheus + Grafana + Loki', description: 'Full observability stack: metrics, logs, dashboards, alerts', icon: 'BarChart2', order: 3 },
    { cat: 'ai', title: 'Prompt Library with Versioning', description: 'Templated prompts with variables, version control, and A/B testing', icon: 'Bot', order: 1 },
    { cat: 'ai', title: 'Automated Evaluation Harness', description: 'Accuracy, cost, latency benchmarks with regression detection', icon: 'Target', order: 2 },
    { cat: 'consulting', title: 'Architecture Review (STRIDE)', description: 'Threat modeling, ADR authoring, performance bottleneck analysis', icon: 'ShieldCheck', order: 1 },
    { cat: 'consulting', title: 'Fractional CTO Leadership', description: 'Weekly syncs, hiring, vendor eval, board reporting', icon: 'Compass', order: 2 },
  ];
  
  for (const f of features) {
    if (catMap[f.cat]) {
      try {
        await sql`
          INSERT INTO service_feature (category_id, title, description, icon, display_order)
          VALUES (${catMap[f.cat]}, ${f.title}, ${f.description}, ${f.icon}, ${f.order})
          ON CONFLICT DO NOTHING
        `;
      } catch (e: any) {
        console.log(`Feature ${f.title}:`, e.message?.substring(0, 100));
      }
    }
  }
  console.log("service_feature seeded");
  
  // Seed service_deliverable
  console.log("\n--- Seeding service_deliverable ---");
  const deliverables = [
    { cat: 'fullstack', title: 'Source code repository (GitHub/GitLab)', description: 'Clean commit history, conventional commits, branch protection', order: 1 },
    { cat: 'fullstack', title: 'CI/CD pipeline configuration', description: 'GitHub Actions/GitLab CI with test, lint, build, deploy stages', order: 2 },
    { cat: 'fullstack', title: 'Deployment to Vercel/Cloudflare/AWS', description: 'Production URL with custom domain and SSL', order: 3 },
    { cat: 'fullstack', title: 'Handoff documentation', description: 'Architecture diagram, runbook, environment variables guide', order: 4 },
    { cat: 'backend', title: 'OpenAPI/Protobuf specification', description: 'Machine-readable contract with examples', order: 1 },
    { cat: 'backend', title: 'Docker image + Helm chart', description: 'Containerized service with Kubernetes deployment manifests', order: 2 },
    { cat: 'backend', title: 'Load test report', description: 'k6/JMeter results with 95th percentile latency', order: 3 },
    { cat: 'database', title: 'ER diagram + schema SQL', description: 'Normalized schema with foreign keys, indexes, constraints', order: 1 },
    { cat: 'database', title: 'RLS policy definitions', description: 'Row-level security policies per tenant/role with tests', order: 2 },
    { cat: 'database', title: 'Migration files (Flyway)', description: 'Versioned, repeatable migrations with checksums', order: 3 },
    { cat: 'cloud', title: 'Terraform/Pulumi modules', description: 'Reusable infrastructure modules with variables', order: 1 },
    { cat: 'cloud', title: 'Grafana dashboards + alerts', description: 'SLO dashboards, burn-rate alerts, runbook links', order: 2 },
    { cat: 'cloud', title: 'CI/CD pipeline (GitOps)', description: 'ArgoCD/Flux with preview environments and rollback', order: 3 },
    { cat: 'ai', title: 'Prompt library (JSON/Markdown)', description: 'Templated prompts with variables and version history', order: 1 },
    { cat: 'ai', title: 'Evaluation report', description: 'Accuracy/latency/cost benchmarks with recommendations', order: 2 },
    { cat: 'consulting', title: 'Architecture decision records (ADRs)', description: '3-5 ADRs with context, decision, consequences', order: 1 },
    { cat: 'consulting', title: 'Executive summary + roadmap', description: 'Board-ready report with remediation priorities', order: 2 },
  ];
  
  for (const d of deliverables) {
    if (catMap[d.cat]) {
      try {
        await sql`
          INSERT INTO service_deliverable (category_id, title, description, display_order)
          VALUES (${catMap[d.cat]}, ${d.title}, ${d.description}, ${d.order})
          ON CONFLICT DO NOTHING
        `;
      } catch (e: any) {
        console.log(`Deliverable ${d.title}:`, e.message?.substring(0, 100));
      }
    }
  }
  console.log("service_deliverable seeded");
  
  // Seed service_technology
  console.log("\n--- Seeding service_technology ---");
  const technologies = [
    { cat: 'fullstack', name: 'Next.js', order: 1 },
    { cat: 'fullstack', name: 'React', order: 2 },
    { cat: 'fullstack', name: 'TypeScript', order: 3 },
    { cat: 'fullstack', name: 'Tailwind CSS', order: 4 },
    { cat: 'fullstack', name: 'PostgreSQL', order: 5 },
    { cat: 'fullstack', name: 'Prisma/Drizzle', order: 6 },
    { cat: 'backend', name: 'Node.js', order: 1 },
    { cat: 'backend', name: 'Fastify/Hono', order: 2 },
    { cat: 'backend', name: 'Go', order: 3 },
    { cat: 'backend', name: 'PostgreSQL', order: 4 },
    { cat: 'backend', name: 'Redis', order: 5 },
    { cat: 'database', name: 'PostgreSQL 16', order: 1 },
    { cat: 'database', name: 'Flyway', order: 2 },
    { cat: 'cloud', name: 'Kubernetes', order: 1 },
    { cat: 'cloud', name: 'Docker', order: 2 },
    { cat: 'cloud', name: 'Terraform', order: 3 },
    { cat: 'cloud', name: 'Prometheus', order: 4 },
    { cat: 'cloud', name: 'Grafana', order: 5 },
    { cat: 'ai', name: 'OpenAI API', order: 1 },
    { cat: 'ai', name: 'NVIDIA NIM', order: 2 },
    { cat: 'ai', name: 'MLflow', order: 3 },
    { cat: 'consulting', name: 'ADR Tools', order: 1 },
    { cat: 'consulting', name: 'STRIDE', order: 2 },
  ];
  
  for (const t of technologies) {
    if (catMap[t.cat]) {
      try {
        await sql`
          INSERT INTO service_technology (category_id, name, display_order)
          VALUES (${catMap[t.cat]}, ${t.name}, ${t.order})
          ON CONFLICT DO NOTHING
        `;
      } catch (e: any) {
        console.log(`Technology ${t.name}:`, e.message?.substring(0, 100));
      }
    }
  }
  console.log("service_technology seeded");
  
  // Seed engagement_model
  console.log("\n--- Seeding engagement_model ---");
  const engagements = [
    { title: 'Fixed-Scope Project', slug: 'fixed-scope', description: 'Defined deliverables, timeline and price. Best for greenfield builds, migrations, or audits with clear boundaries.', features: '["Detailed scope & acceptance criteria", "Milestone payments (30/40/30)", "Change control process", "30-day warranty period", "Fixed timeline"]', icon: 'Layers', order: 1 },
    { title: 'Monthly Retainer', slug: 'monthly-retainer', description: 'Reserved capacity for ongoing engineering, SRE or fractional leadership. Predictable cost, flexible priority.', features: '["Guaranteed weekly hours (10/20/40)", "Slack/email availability", "Proactive improvements", "Quarterly roadmap review", "Roll-over unused hours (50%)"]', icon: 'Compass', order: 2 },
    { title: 'Fractional CTO / Architect', slug: 'fractional-cto', description: 'Part-time technical leadership: strategy, hiring, vendor eval, architecture governance and team mentorship.', features: '["Weekly sync + async comms", "ADR ownership", "Hiring & vendor interviews", "Architecture governance", "Team mentorship", "Board-ready reporting"]', icon: 'ShieldCheck', order: 3 },
  ];
  
  for (const e of engagements) {
    try {
      await sql`
        INSERT INTO engagement_model (title, slug, description, features, icon, display_order)
        VALUES (${e.title}, ${e.slug}, ${e.description}, ${e.features}, ${e.icon}, ${e.order})
        ON CONFLICT (slug) DO NOTHING
      `;
    } catch (e: any) {
      console.log(`Engagement ${e.title}:`, e.message?.substring(0, 100));
    }
  }
  console.log("engagement_model seeded");
  
  // Seed pricing_faq
  console.log("\n--- Seeding pricing_faq ---");
  const faqs = [
    { q: 'Are prices in Kenyan Shillings (KES)?', a: 'Yes, all prices are in Kenyan Shillings (KES). We accept M-Pesa, bank transfer, and card payments.', order: 1 },
    { q: 'Do you offer payment plans?', a: 'Yes, for projects over KES 500,000 we offer 3-installment plans (30/40/30). Monthly retainers are billed monthly in advance.', order: 2 },
    { q: 'What is included in the warranty period?', a: 'Warranty covers bug fixes related to delivered scope. It does not cover new features, scope changes, or third-party service changes.', order: 3 },
    { q: 'Can I upgrade/downgrade my package later?', a: 'Yes, you can upgrade at any time by paying the difference. Downgrades apply at the next billing cycle for retainers.', order: 4 },
    { q: 'Do you work with startups outside Nairobi?', a: 'Absolutely. We work remotely with clients across Kenya and East Africa. All communication is via Slack, Zoom, and async tools.', order: 5 },
    { q: 'How do you handle intellectual property?', a: 'You own all code, designs, and deliverables produced. We provide a full IP assignment upon final payment.', order: 6 },
    { q: 'What is your typical response time?', a: 'During business hours (Mon-Fri, 8am-5pm EAT): <4 hours for retainers, <24 hours for projects. Critical issues: <1 hour for SRE retainers.', order: 7 },
  ];
  
  for (const f of faqs) {
    try {
      await sql`
        INSERT INTO pricing_faq (question, answer, display_order)
        VALUES (${f.q}, ${f.a}, ${f.order})
        ON CONFLICT DO NOTHING
      `;
    } catch (e: any) {
      console.log(`FAQ:`, e.message?.substring(0, 100));
    }
  }
  console.log("pricing_faq seeded");
  
  // Final verification
  console.log("\n--- Final verification ---");
  const tables = ['service_category', 'service_package', 'service_feature', 'service_deliverable', 'service_technology', 'engagement_model', 'pricing_faq'];
  for (const t of tables) {
    const r = await sql`SELECT to_regclass(${t}) as exists`;
    try {
      const count = await sql.unsafe(`SELECT COUNT(*) as count FROM ${t}`);
      console.log(t, r[0].exists ? 'EXISTS' : 'MISSING', '| rows:', count[0]?.count);
    } catch (e: any) {
      console.log(t, r[0].exists ? 'EXISTS' : 'MISSING', '| rows: ERROR -', e.message?.substring(0, 100));
    }
  }
}

main();