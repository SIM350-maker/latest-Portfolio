import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Dropping and recreating all service tables...");
  
  // Drop in reverse dependency order
  await sql`DROP TABLE IF EXISTS service_technology CASCADE`.catch(() => {});
  await sql`DROP TABLE IF EXISTS service_deliverable CASCADE`.catch(() => {});
  await sql`DROP TABLE IF EXISTS service_feature CASCADE`.catch(() => {});
  await sql`DROP TABLE IF EXISTS service_package CASCADE`.catch(() => {});
  await sql`DROP TABLE IF EXISTS pricing_faq CASCADE`.catch(() => {});
  await sql`DROP TABLE IF EXISTS engagement_model CASCADE`.catch(() => {});
  await sql`DROP TABLE IF EXISTS service_category CASCADE`.catch(() => {});
  await sql`DROP TYPE IF EXISTS billing_cycle`.catch(() => {});
  
  console.log("All tables dropped");
  
  // Create billing_cycle type
  await sql`CREATE TYPE billing_cycle AS ENUM ('one_time', 'monthly', 'quarterly', 'yearly')`;
  console.log("billing_cycle type created");
  
  // Create service_category with FULL schema
  await sql`
    CREATE TABLE service_category (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      icon VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      long_description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("service_category created");
  
  // Create indexes
  await sql`CREATE INDEX idx_service_category_active ON service_category (is_active)`;
  await sql`CREATE INDEX idx_service_category_slug ON service_category (slug)`;
  
  // Create service_package with FULL schema
  await sql`
    CREATE TABLE service_package (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES service_category(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price_kes INTEGER NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'KES',
      billing_cycle billing_cycle NOT NULL DEFAULT 'one_time',
      features TEXT[] NOT NULL DEFAULT '{}',
      highlights TEXT[] NOT NULL DEFAULT '{}',
      cta_text VARCHAR(100) NOT NULL DEFAULT 'Get Started',
      cta_url VARCHAR(500),
      is_popular BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("service_package created");
  
  await sql`CREATE UNIQUE INDEX uq_service_package_category_slug ON service_package (category_id, slug)`;
  await sql`CREATE INDEX idx_service_package_category ON service_package (category_id)`;
  await sql`CREATE INDEX idx_service_package_active ON service_package (is_active)`;
  await sql`CREATE INDEX idx_service_package_popular ON service_package (is_popular)`;
  
  // Create service_feature
  await sql`
    CREATE TABLE service_feature (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES service_category(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      icon VARCHAR(100),
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX idx_service_feature_category ON service_feature (category_id)`;
  console.log("service_feature created");
  
  // Create service_deliverable
  await sql`
    CREATE TABLE service_deliverable (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES service_category(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX idx_service_deliverable_category ON service_deliverable (category_id)`;
  console.log("service_deliverable created");
  
  // Create service_technology
  await sql`
    CREATE TABLE service_technology (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES service_category(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      logo_url VARCHAR(500),
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX idx_service_technology_category ON service_technology (category_id)`;
  console.log("service_technology created");
  
  // Create engagement_model
  await sql`
    CREATE TABLE engagement_model (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT NOT NULL,
      features TEXT[] NOT NULL DEFAULT '{}',
      icon VARCHAR(100),
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX idx_engagement_model_slug ON engagement_model (slug)`;
  console.log("engagement_model created");
  
  // Create pricing_faq
  await sql`
    CREATE TABLE pricing_faq (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("pricing_faq created");
  
  // Create update_updated_at_column function and triggers
  await sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `;
  
  await sql`DROP TRIGGER IF EXISTS update_service_category_updated_at ON service_category; CREATE TRIGGER update_service_category_updated_at BEFORE UPDATE ON service_category FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;
  await sql`DROP TRIGGER IF EXISTS update_service_package_updated_at ON service_package; CREATE TRIGGER update_service_package_updated_at BEFORE UPDATE ON service_package FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;
  await sql`DROP TRIGGER IF EXISTS update_service_feature_updated_at ON service_feature; CREATE TRIGGER update_service_feature_updated_at BEFORE UPDATE ON service_feature FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;
  await sql`DROP TRIGGER IF EXISTS update_service_deliverable_updated_at ON service_deliverable; CREATE TRIGGER update_service_deliverable_updated_at BEFORE UPDATE ON service_deliverable FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;
  await sql`DROP TRIGGER IF EXISTS update_service_technology_updated_at ON service_technology; CREATE TRIGGER update_service_technology_updated_at BEFORE UPDATE ON service_technology FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;
  await sql`DROP TRIGGER IF EXISTS update_engagement_model_updated_at ON engagement_model; CREATE TRIGGER update_engagement_model_updated_at BEFORE UPDATE ON engagement_model FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;
  await sql`DROP TRIGGER IF EXISTS update_pricing_faq_updated_at ON pricing_faq; CREATE TRIGGER update_pricing_faq_updated_at BEFORE UPDATE ON pricing_faq FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`;
  console.log("Triggers created");
  
  // NOW SEED DATA
  console.log("\n--- Seeding service_category ---");
  await sql`
    INSERT INTO service_category (title, slug, icon, description, long_description, display_order) VALUES
    ('Full-Stack Web Applications', 'fullstack', 'Layers', 'End-to-end product engineering with Next.js, React, Node.js and PostgreSQL', 'Complete product development from concept to production: Next.js App Router, React Server Components, TypeScript, Tailwind CSS, PostgreSQL, Prisma/Drizzle. Includes authentication, real-time features, background jobs, and production deployment.', 1),
    ('Backend APIs & Microservices', 'backend', 'Server', 'Contract-first REST and gRPC services with OpenAPI/Protobuf schemas', 'Build scalable backend systems: Node.js/Fastify/Hono, Go, or Rust with clean domain boundaries. Request validation, authentication (JWT, mTLS), rate limiting, structured logging, metrics, distributed tracing, and load testing.', 2),
    ('Database Architecture & Security', 'database', 'Database', 'Schema design, migrations, and PostgreSQL Row-Level Security for multi-tenant data', 'Expert database engineering: schema design, normalization, indexing strategy, migration tooling, RLS policies for data isolation, query optimization, capacity planning, backup/PITR, and disaster recovery.', 3),
    ('Cloud, DevOps & Reliability', 'cloud', 'Cloud', 'Containerised deployment pipelines, GitOps, and SRE-grade observability', 'Production-ready infrastructure: Kubernetes (EKS/GKE/AKS/k3s), Docker, GitOps (ArgoCD/Flux), Terraform/Pulumi, Prometheus/Grafana/Loki, SLO dashboards, burn-rate alerts, and chaos engineering.', 4),
    ('AI Integration & Automation', 'ai', 'Bot', 'LLM-assisted workflows: document generation, evidence matching, code synthesis', 'Embedded AI with discipline: prompt library with versioned templates, automated evaluation harness, provenance metadata, human-in-the-loop review UI, cost/latency monitoring, and structured output parsing.', 5),
    ('Technical Consulting & Reviews', 'consulting', 'Compass', 'Architecture reviews, ADR authoring, performance audits, security assessments', 'Fractional CTO/Architect services: architecture reviews, ADR authoring, threat modeling, performance bottleneck analysis, code quality audits, team mentorship, and board-ready reporting.', 6)
    ON CONFLICT (slug) DO NOTHING
  `;
  console.log("service_category seeded");
  
  // Get category IDs
  const cats = await sql`SELECT id, slug FROM service_category`;
  const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]));
  console.log("Category map:", catMap);
  
  // Seed service_package
  console.log("\n--- Seeding service_package ---");
  await sql`
    INSERT INTO service_package (category_id, name, slug, description, price_kes, currency, billing_cycle, features, highlights, cta_text, is_popular, display_order) VALUES
    (${catMap.fullstack}, 'Starter', 'starter', 'Perfect for MVPs and early-stage products', 250000, 'KES', 'one_time', 
      '["Next.js 15 + TypeScript + Tailwind", "PostgreSQL + Prisma", "Authentication (NextAuth)", "Responsive UI (WCAG 2.1)", "CI/CD pipeline (GitHub Actions)", "Vercel/Cloudflare deployment"]',
      '["Up to 5 core features", "2-week sprint cycles", "Code review included", "30-day warranty"]',
      'Start Project', false, 1),
    (${catMap.fullstack}, 'Professional', 'professional', 'Full-featured product for growth-stage companies', 650000, 'KES', 'one_time',
      '["Everything in Starter", "Real-time features (WebSockets)", "Background jobs (Redis + Bull)", "Advanced auth (RBAC, MFA)", "Automated testing (unit + e2e)", "Storybook component library", "Docker containerization"]',
      '["Up to 15 core features", "Weekly demos", "Architecture decision records", "60-day warranty", "Handoff documentation"]',
      'Get Quote', true, 2),
    (${catMap.fullstack}, 'Enterprise', 'enterprise', 'Mission-critical systems with SLA', 1500000, 'KES', 'one_time',
      '["Everything in Professional", "Multi-tenant architecture", "PostgreSQL RLS + encryption", "Custom SSO/SAML/OIDC", "Audit logging & compliance", "Disaster recovery (RPO < 1hr)", "24/7 on-call rotation (add-on)"]',
      '["Unlimited features", "Dedicated team", "Security audit included", "90-day warranty", "Ongoing retainer available"]',
      'Contact Sales', false, 3),
    (${catMap.backend}, 'Single Service', 'single-service', 'One well-bounded microservice', 180000, 'KES', 'one_time',
      '["OpenAPI 3.1 / Protobuf contract", "Node.js (Fastify/Hono) or Go", "PostgreSQL + migrations", "JWT auth + rate limiting", "Structured logging + metrics", "Docker + Helm chart"]',
      '["Single bounded context", "Contract-first design", "Load tested (10k RPS)", "30-day warranty"]',
      'Start Service', false, 1),
    (${catMap.backend}, 'Platform', 'platform', 'Multi-service platform with governance', 550000, 'KES', 'one_time',
      '["Everything in Single", "Service mesh (Istio/Linkerd)", "Distributed tracing (Jaeger)", "Centralized config (Consul)", "API Gateway (Kong/Envoy)", "Contract testing (Pact)"]',
      '["3-5 microservices", "Shared libraries", "Contract registry", "60-day warranty"]',
      'Get Quote', true, 2),
    (${catMap.database}, 'Schema Design', 'schema-design', 'Greenfield schema with RLS', 150000, 'KES', 'one_time',
      '["ER diagrams + normalization", "PostgreSQL 16 + RLS policies", "Migration tooling (Flyway)", "Indexing strategy + EXPLAIN", "Backup + PITR config"]',
      '["Up to 20 tables", "RLS per tenant/role", "Query optimization", "30-day warranty"]',
      'Design Schema', false, 1),
    (${catMap.database}, 'Security Audit', 'security-audit', 'RLS + encryption + compliance', 300000, 'KES', 'one_time',
      '["Everything in Schema", "RLS policy audit", "Column-level encryption (pgcrypto)", "Row-level audit logging", "Compliance checklist (GDPR/POPIA)", "Pen-test coordination"]',
      '["Full security report", "Remediation plan", "Compliance evidence", "60-day warranty"]',
      'Audit Now', true, 2),
    (${catMap.cloud}, 'CI/CD Setup', 'cicd-setup', 'Automated pipelines from commit to prod', 200000, 'KES', 'one_time',
      '["GitHub Actions / GitLab CI", "Multi-env (dev/staging/prod)", "Preview deployments", "Automated testing gates", "Rollback on failure", "Slack/Teams notifications"]',
      '["3 environments", "Zero-downtime deploys", "Security scanning", "30-day warranty"]',
      'Setup Pipeline', false, 1),
    (${catMap.cloud}, 'SRE Platform', 'sre-platform', 'Full observability + reliability', 600000, 'KES', 'one_time',
      '["Everything in CI/CD", "Kubernetes (EKS/GKE/k3s)", "Terraform/Pulumi IaC", "Prometheus + Grafana + Loki", "SLO dashboards + burn alerts", "Chaos engineering (Litmus)", "On-call runbooks"]',
      '["Multi-cluster", "GitOps (ArgoCD/Flux)", "Cost optimization", "90-day warranty", "Monthly SRE retainer available"]',
      'Build Platform', true, 2),
    (${catMap.ai}, 'Pilot Project', 'pilot', 'Validate AI use case in 4-6 weeks', 350000, 'KES', 'one_time',
      '["Use case discovery workshop", "Prompt library (10 templates)", "Eval harness (accuracy/cost/latency)", "Provenance tracking", "Human review UI", "Cost monitoring dashboard"]',
      '["Single use case", "POC to production path", "Model agnostic", "60-day warranty"]',
      'Run Pilot', false, 1),
    (${catMap.ai}, 'Production AI', 'production', 'Embedded AI with full governance', 850000, 'KES', 'one_time',
      '["Everything in Pilot", "Multi-model routing", "A/B testing framework", "RLHF pipeline", "PII redaction", "Audit trail + compliance", "Model versioning (MLflow)"]',
      '["Multiple use cases", "CI/CD for prompts", "SOC2-ready", "90-day warranty", "Monthly AI ops retainer"]',
      'Deploy AI', true, 2),
    (${catMap.consulting}, 'Architecture Review', 'arch-review', '2-week deep-dive with ADRs', 280000, 'KES', 'one_time',
      '["System architecture assessment", "Threat model (STRIDE)", "Performance profiling", "Technical debt inventory", "3 ADRs authored", "Executive summary"]',
      '["2-week engagement", "Board-ready report", "Remediation roadmap", "30-day follow-up"]',
      'Book Review', false, 1),
    (${catMap.consulting}, 'Fractional CTO', 'fractional-cto', 'Part-time technical leadership', 350000, 'KES', 'monthly',
      '["Weekly sync + async comms", "ADR ownership", "Hiring & vendor interviews", "Architecture governance", "Team mentorship", "Board reporting"]',
      '["10 hrs/week guaranteed", "Slack availability", "Quarterly roadmap", "Cancel anytime"]',
      'Engage CTO', true, 2)
    ON CONFLICT (category_id, slug) DO NOTHING
  `;
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
      await sql`
        INSERT INTO service_feature (category_id, title, description, icon, display_order)
        VALUES (${catMap[f.cat]}, ${f.title}, ${f.description}, ${f.icon}, ${f.order})
        ON CONFLICT DO NOTHING
      `.catch(() => {});
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
      await sql`
        INSERT INTO service_deliverable (category_id, title, description, display_order)
        VALUES (${catMap[d.cat]}, ${d.title}, ${d.description}, ${d.order})
        ON CONFLICT DO NOTHING
      `.catch(() => {});
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
      await sql`
        INSERT INTO service_technology (category_id, name, display_order)
        VALUES (${catMap[t.cat]}, ${t.name}, ${t.order})
        ON CONFLICT DO NOTHING
      `.catch(() => {});
    }
  }
  console.log("service_technology seeded");
  
  // Seed engagement_model
  console.log("\n--- Seeding engagement_model ---");
  const engagements = [
    { title: 'Fixed-Scope Project', slug: 'fixed-scope', description: 'Defined deliverables, timeline and price. Best for greenfield builds, migrations, or audits with clear boundaries.', features: ['Detailed scope & acceptance criteria', 'Milestone payments (30/40/30)', 'Change control process', '30-day warranty period', 'Fixed timeline'], icon: 'Layers', order: 1 },
    { title: 'Monthly Retainer', slug: 'monthly-retainer', description: 'Reserved capacity for ongoing engineering, SRE or fractional leadership. Predictable cost, flexible priority.', features: ['Guaranteed weekly hours (10/20/40)', 'Slack/email availability', 'Proactive improvements', 'Quarterly roadmap review', 'Roll-over unused hours (50%)'], icon: 'Compass', order: 2 },
    { title: 'Fractional CTO / Architect', slug: 'fractional-cto', description: 'Part-time technical leadership: strategy, hiring, vendor eval, architecture governance and team mentorship.', features: ['Weekly sync + async comms', 'ADR ownership', 'Hiring & vendor interviews', 'Architecture governance', 'Team mentorship', 'Board-ready reporting'], icon: 'ShieldCheck', order: 3 },
  ];
  
  for (const e of engagements) {
    await sql`
      INSERT INTO engagement_model (title, slug, description, features, icon, display_order)
      VALUES (${e.title}, ${e.slug}, ${e.description}, ${e.features}, ${e.icon}, ${e.order})
      ON CONFLICT (slug) DO NOTHING
    `.catch(() => {});
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
    await sql`
      INSERT INTO pricing_faq (question, answer, display_order)
      VALUES (${f.q}, ${f.a}, ${f.order})
      ON CONFLICT DO NOTHING
    `.catch(() => {});
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