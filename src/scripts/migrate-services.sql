-- Services Schema Migration
-- Run this migration to create all services tables

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE billing_cycle AS ENUM ('one_time', 'monthly', 'quarterly', 'yearly');

-- ============================================================
-- SERVICE CATEGORY
-- ============================================================

CREATE TABLE IF NOT EXISTS service_category (
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
);

CREATE INDEX IF NOT EXISTS idx_service_category_active ON service_category (is_active);
CREATE INDEX IF NOT EXISTS idx_service_category_slug ON service_category (slug);

-- ============================================================
-- SERVICE PACKAGE (Pricing Tiers)
-- ============================================================

CREATE TABLE IF NOT EXISTS service_package (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_service_package_category_slug ON service_package (category_id, slug);
CREATE INDEX IF NOT EXISTS idx_service_package_category ON service_package (category_id);
CREATE INDEX IF NOT EXISTS idx_service_package_active ON service_package (is_active);
CREATE INDEX IF NOT EXISTS idx_service_package_popular ON service_package (is_popular);

-- ============================================================
-- SERVICE FEATURE
-- ============================================================

CREATE TABLE IF NOT EXISTS service_feature (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES service_category(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_feature_category ON service_feature (category_id);

-- ============================================================
-- SERVICE DELIVERABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS service_deliverable (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES service_category(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_deliverable_category ON service_deliverable (category_id);

-- ============================================================
-- SERVICE TECHNOLOGY
-- ============================================================

CREATE TABLE IF NOT EXISTS service_technology (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES service_category(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  logo_url VARCHAR(500),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_technology_category ON service_technology (category_id);

-- ============================================================
-- ENGAGEMENT MODEL
-- ============================================================

CREATE TABLE IF NOT EXISTS engagement_model (
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
);

CREATE INDEX IF NOT EXISTS idx_engagement_model_slug ON engagement_model (slug);

-- ============================================================
-- PRICING FAQ
-- ============================================================

CREATE TABLE IF NOT EXISTS pricing_faq (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS FOR updated_at
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_service_category_updated_at ON service_category;
CREATE TRIGGER update_service_category_updated_at
  BEFORE UPDATE ON service_category
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_package_updated_at ON service_package;
CREATE TRIGGER update_service_package_updated_at
  BEFORE UPDATE ON service_package
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_feature_updated_at ON service_feature;
CREATE TRIGGER update_service_feature_updated_at
  BEFORE UPDATE ON service_feature
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_deliverable_updated_at ON service_deliverable;
CREATE TRIGGER update_service_deliverable_updated_at
  BEFORE UPDATE ON service_deliverable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_technology_updated_at ON service_technology;
CREATE TRIGGER update_service_technology_updated_at
  BEFORE UPDATE ON service_technology
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engagement_model_updated_at ON engagement_model;
CREATE TRIGGER update_engagement_model_updated_at
  BEFORE UPDATE ON engagement_model
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_faq_updated_at ON pricing_faq;
CREATE TRIGGER update_pricing_faq_updated_at
  BEFORE UPDATE ON pricing_faq
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA (Kenyan Market Pricing)
-- ============================================================

-- Insert default categories
INSERT INTO service_category (title, slug, icon, description, long_description, display_order) VALUES
('Full-Stack Web Applications', 'fullstack', 'Layers', 'End-to-end product engineering with Next.js, React, Node.js and PostgreSQL', 'Complete product development from concept to production: Next.js App Router, React Server Components, TypeScript, Tailwind CSS, PostgreSQL, Prisma/Drizzle. Includes authentication, real-time features, background jobs, and production deployment.', 1),
('Backend APIs & Microservices', 'backend', 'Server', 'Contract-first REST and gRPC services with OpenAPI/Protobuf schemas', 'Build scalable backend systems: Node.js/Fastify/Hono, Go, or Rust with clean domain boundaries. Request validation, authentication (JWT, mTLS), rate limiting, structured logging, metrics, distributed tracing, and load testing.', 2),
('Database Architecture & Security', 'database', 'Database', 'Schema design, migrations, and PostgreSQL Row-Level Security for multi-tenant data', 'Expert database engineering: schema design, normalization, indexing strategy, migration tooling, RLS policies for data isolation, query optimization, capacity planning, backup/PITR, and disaster recovery.', 3),
('Cloud, DevOps & Reliability', 'cloud', 'Cloud', 'Containerised deployment pipelines, GitOps, and SRE-grade observability', 'Production-ready infrastructure: Kubernetes (EKS/GKE/AKS/k3s), Docker, GitOps (ArgoCD/Flux), Terraform/Pulumi, Prometheus/Grafana/Loki, SLO dashboards, burn-rate alerts, and chaos engineering.', 4),
('AI Integration & Automation', 'ai', 'Bot', 'LLM-assisted workflows: document generation, evidence matching, code synthesis', 'Embedded AI with discipline: prompt library with versioned templates, automated evaluation harness, provenance metadata, human-in-the-loop review UI, cost/latency monitoring, and structured output parsing.', 5),
('Technical Consulting & Reviews', 'consulting', 'Compass', 'Architecture reviews, ADR authoring, performance audits, security assessments', 'Fractional CTO/Architect services: architecture reviews, ADR authoring, threat modeling, performance bottleneck analysis, code quality audits, team mentorship, and board-ready reporting.', 6)
ON CONFLICT (slug) DO NOTHING;

-- Insert packages for Full-Stack (category_id = 1)
INSERT INTO service_package (category_id, name, slug, description, price_kes, currency, billing_cycle, features, highlights, cta_text, is_popular, display_order) VALUES
(1, 'Starter', 'starter', 'Perfect for MVPs and early-stage products', 250000, 'KES', 'one_time', 
  '["Next.js 15 + TypeScript + Tailwind", "PostgreSQL + Prisma", "Authentication (NextAuth)", "Responsive UI (WCAG 2.1)", "CI/CD pipeline (GitHub Actions)", "Vercel/Cloudflare deployment"]',
  '["Up to 5 core features", "2-week sprint cycles", "Code review included", "30-day warranty"]',
  'Start Project', false, 1),
(1, 'Professional', 'professional', 'Full-featured product for growth-stage companies', 650000, 'KES', 'one_time',
  '["Everything in Starter", "Real-time features (WebSockets)", "Background jobs (Redis + Bull)", "Advanced auth (RBAC, MFA)", "Automated testing (unit + e2e)", "Storybook component library", "Docker containerization"]',
  '["Up to 15 core features", "Weekly demos", "Architecture decision records", "60-day warranty", "Handoff documentation"]',
  'Get Quote', true, 2),
(1, 'Enterprise', 'enterprise', 'Mission-critical systems with SLA', 1500000, 'KES', 'one_time',
  '["Everything in Professional", "Multi-tenant architecture", "PostgreSQL RLS + encryption", "Custom SSO/SAML/OIDC", "Audit logging & compliance", "Disaster recovery (RPO < 1hr)", "24/7 on-call rotation (add-on)"]',
  '["Unlimited features", "Dedicated team", "Security audit included", "90-day warranty", "Ongoing retainer available"]',
  'Contact Sales', false, 3)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Insert packages for Backend (category_id = 2)
INSERT INTO service_package (category_id, name, slug, description, price_kes, currency, billing_cycle, features, highlights, cta_text, is_popular, display_order) VALUES
(2, 'Single Service', 'single-service', 'One well-bounded microservice', 180000, 'KES', 'one_time',
  '["OpenAPI 3.1 / Protobuf contract", "Node.js (Fastify/Hono) or Go", "PostgreSQL + migrations", "JWT auth + rate limiting", "Structured logging + metrics", "Docker + Helm chart"]',
  '["Single bounded context", "Contract-first design", "Load tested (10k RPS)", "30-day warranty"]',
  'Start Service', false, 1),
(2, 'Platform', 'platform', 'Multi-service platform with governance', 550000, 'KES', 'one_time',
  '["Everything in Single", "Service mesh (Istio/Linkerd)", "Distributed tracing (Jaeger)", "Centralized config (Consul)", "API Gateway (Kong/Envoy)", "Contract testing (Pact)"]',
  '["3-5 microservices", "Shared libraries", "Contract registry", "60-day warranty"]',
  'Get Quote', true, 2)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Insert packages for Database (category_id = 3)
INSERT INTO service_package (category_id, name, slug, description, price_kes, currency, billing_cycle, features, highlights, cta_text, is_popular, display_order) VALUES
(3, 'Schema Design', 'schema-design', 'Greenfield schema with RLS', 150000, 'KES', 'one_time',
  '["ER diagrams + normalization", "PostgreSQL 16 + RLS policies", "Migration tooling (Flyway)", "Indexing strategy + EXPLAIN", "Backup + PITR config"]',
  '["Up to 20 tables", "RLS per tenant/role", "Query optimization", "30-day warranty"]',
  'Design Schema', false, 1),
(3, 'Security Audit', 'security-audit', 'RLS + encryption + compliance', 300000, 'KES', 'one_time',
  '["Everything in Schema", "RLS policy audit", "Column-level encryption (pgcrypto)", "Row-level audit logging", "Compliance checklist (GDPR/POPIA)", "Pen-test coordination"]',
  '["Full security report", "Remediation plan", "Compliance evidence", "60-day warranty"]',
  'Audit Now', true, 2)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Insert packages for Cloud/DevOps (category_id = 4)
INSERT INTO service_package (category_id, name, slug, description, price_kes, currency, billing_cycle, features, highlights, cta_text, is_popular, display_order) VALUES
(4, 'CI/CD Setup', 'cicd-setup', 'Automated pipelines from commit to prod', 200000, 'KES', 'one_time',
  '["GitHub Actions / GitLab CI", "Multi-env (dev/staging/prod)", "Preview deployments", "Automated testing gates", "Rollback on failure", "Slack/Teams notifications"]',
  '["3 environments", "Zero-downtime deploys", "Security scanning", "30-day warranty"]',
  'Setup Pipeline', false, 1),
(4, 'SRE Platform', 'sre-platform', 'Full observability + reliability', 600000, 'KES', 'one_time',
  '["Everything in CI/CD", "Kubernetes (EKS/GKE/k3s)", "Terraform/Pulumi IaC", "Prometheus + Grafana + Loki", "SLO dashboards + burn alerts", "Chaos engineering (Litmus)", "On-call runbooks"]',
  '["Multi-cluster", "GitOps (ArgoCD/Flux)", "Cost optimization", "90-day warranty", "Monthly SRE retainer available"]',
  'Build Platform', true, 2)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Insert packages for AI (category_id = 5)
INSERT INTO service_package (category_id, name, slug, description, price_kes, currency, billing_cycle, features, highlights, cta_text, is_popular, display_order) VALUES
(5, 'Pilot Project', 'pilot', 'Validate AI use case in 4-6 weeks', 350000, 'KES', 'one_time',
  '["Use case discovery workshop", "Prompt library (10 templates)", "Eval harness (accuracy/cost/latency)", "Provenance tracking", "Human review UI", "Cost monitoring dashboard"]',
  '["Single use case", "POC to production path", "Model agnostic", "60-day warranty"]',
  'Run Pilot', false, 1),
(5, 'Production AI', 'production', 'Embedded AI with full governance', 850000, 'KES', 'one_time',
  '["Everything in Pilot", "Multi-model routing", "A/B testing framework", "RLHF pipeline", "PII redaction", "Audit trail + compliance", "Model versioning (MLflow)"]',
  '["Multiple use cases", "CI/CD for prompts", "SOC2-ready", "90-day warranty", "Monthly AI ops retainer"]',
  'Deploy AI', true, 2)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Insert packages for Consulting (category_id = 6)
INSERT INTO service_package (category_id, name, slug, description, price_kes, currency, billing_cycle, features, highlights, cta_text, is_popular, display_order) VALUES
(6, 'Architecture Review', 'arch-review', '2-week deep-dive with ADRs', 280000, 'KES', 'one_time',
  '["System architecture assessment", "Threat model (STRIDE)", "Performance profiling", "Technical debt inventory", "3 ADRs authored", "Executive summary"]',
  '["2-week engagement", "Board-ready report", "Remediation roadmap", "30-day follow-up"]',
  'Book Review', false, 1),
(6, 'Fractional CTO', 'fractional-cto', 'Part-time technical leadership', 350000, 'KES', 'monthly',
  '["Weekly sync + async comms", "ADR ownership", "Hiring & vendor interviews", "Architecture governance", "Team mentorship", "Board reporting"]',
  '["10 hrs/week guaranteed", "Slack availability", "Quarterly roadmap", "Cancel anytime"]',
  'Engage CTO', true, 2)
ON CONFLICT (category_id, slug) DO NOTHING;

-- Insert engagement models
INSERT INTO engagement_model (title, slug, description, features, icon, display_order) VALUES
('Fixed-Scope Project', 'fixed-scope', 'Defined deliverables, timeline and price. Best for greenfield builds, migrations, or audits with clear boundaries.',
 '["Detailed scope & acceptance criteria", "Milestone payments (30/40/30)", "Change control process", "30-day warranty period", "Fixed timeline"]', 'Layers', 1),
('Monthly Retainer', 'monthly-retainer', 'Reserved capacity for ongoing engineering, SRE or fractional leadership. Predictable cost, flexible priority.',
 '["Guaranteed weekly hours (10/20/40)", "Slack/email availability", "Proactive improvements", "Quarterly roadmap review", "Roll-over unused hours (50%)"]', 'Compass', 2),
('Fractional CTO / Architect', 'fractional-cto', 'Part-time technical leadership: strategy, hiring, vendor eval, architecture governance and team mentorship.',
 '["Weekly sync + async comms", "ADR ownership", "Hiring & vendor interviews", "Architecture governance", "Team mentorship", "Board-ready reporting"]', 'ShieldCheck', 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert FAQ
INSERT INTO pricing_faq (question, answer, display_order) VALUES
('Are prices in Kenyan Shillings (KES)?', 'Yes, all prices are in Kenyan Shillings (KES). We accept M-Pesa, bank transfer, and card payments.', 1),
('Do you offer payment plans?', 'Yes, for projects over KES 500,000 we offer 3-installment plans (30/40/30). Monthly retainers are billed monthly in advance.', 2),
('What is included in the warranty period?', 'Warranty covers bug fixes related to delivered scope. It does not cover new features, scope changes, or third-party service changes.', 3),
('Can I upgrade/downgrade my package later?', 'Yes, you can upgrade at any time by paying the difference. Downgrades apply at the next billing cycle for retainers.', 4),
('Do you work with startups outside Nairobi?', 'Absolutely. We work remotely with clients across Kenya and East Africa. All communication is via Slack, Zoom, and async tools.', 5),
('How do you handle intellectual property?', 'You own all code, designs, and deliverables produced. We provide a full IP assignment upon final payment.', 6),
('What is your typical response time?', 'During business hours (Mon-Fri, 8am-5pm EAT): <4 hours for retainers, <24 hours for projects. Critical issues: <1 hour for SRE retainers.', 7)
ON CONFLICT DO NOTHING;