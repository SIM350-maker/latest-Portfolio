"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowRight,
  ShieldCheck,
  Database,
  Layers,
  Code2,
  Terminal,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Cpu,
  Lock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Award,
  Zap,
  Search,
  LayoutGrid,
  List,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  Server,
  Cloud,
  Bot,
  Compass,
  Globe,
  Shield,
  Target,
  Rocket,
  Star,
  BarChart2,
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  MapPin,
  Mail,
  Verified,
  Quote,
  Check,
  Flag,
  Trophy,
  Eye,
  GitBranch as GithubIcon,
  Link2 as LinkedinIcon,
} from "lucide-react";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Layers, Server, Database, Cloud, Bot, Compass, Code2, Cpu, ShieldCheck, Globe, Zap, Shield, Target, Rocket, Star, BarChart2,
};

function ServiceIcon({ iconName, className = "w-6 h-6" }: { iconName: string; className?: string }) {
  const Icon = SERVICE_ICONS[iconName] || Layers;
  return <Icon className={className} aria-hidden="true" />;
}

export default function HomePage() {
  const { profile, projects, setTerminalOpen } = usePortfolio();
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 3);

  const [serviceCategories, setServiceCategories] = useState<Array<{ id: number; title: string; slug: string; description: string; currency?: string; icon: string }>>([]);
  const [servicePackages, setServicePackages] = useState<Array<{ category_id: number; price_kes: number }>>([]);
  useEffect(() => {
    Promise.all([
      fetch("/api/services").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/services/packages").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([catRes, pkgRes]) => {
        if (catRes?.categories) setServiceCategories(catRes.categories);
        if (pkgRes?.packages) setServicePackages(pkgRes.packages);
      })
      .catch(() => {});
  }, []);

  const yearsExperience = 3;
  const projectsDelivered = projects.length;
  const techStackCount = [...new Set(projects.flatMap(p => p.technologies))].length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden bg-surface-container-low/60 border-b border-border py-20 md:py-28 transition-colors">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider">
                <Verified className="w-3.5 h-3.5" />
                <span>Available for Contract & Full-time Roles</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface leading-[1.15]">
                I build <span className="text-primary">production-grade software</span> that solves real business problems
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Full-stack engineer with {yearsExperience}+ years delivering web applications, APIs, and data systems.
                Clean architecture, type-safe code, and verifiable outcomes — not just features.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="bg-surface-container-lowest border border-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-on-surface">{projectsDelivered}+</div>
                  <div className="text-xs text-on-surface-variant mt-1">Projects Delivered</div>
                </div>
                <div className="bg-surface-container-lowest border border-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-on-surface">{techStackCount}+</div>
                  <div className="text-xs text-on-surface-variant mt-1">Technologies</div>
                </div>
                <div className="bg-surface-container-lowest border border-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-on-surface">{yearsExperience}+</div>
                  <div className="text-xs text-on-surface-variant mt-1">Years Experience</div>
                </div>
                <div className="bg-surface-container-lowest border border-border rounded-xl p-4">
                  <div className="text-2xl font-bold text-on-surface">100%</div>
                  <div className="text-xs text-on-surface-variant mt-1">Verifiable Code</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-all shadow-xs"
                >
                  <span>View My Work</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-surface-container-lowest border border-border text-on-surface text-sm font-medium hover:bg-surface-container transition-all"
                >
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span>Hire Me</span>
                </Link>

                <button
                  onClick={() => setTerminalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-primary/30 bg-primary/5 text-primary text-sm font-mono hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Launch Terminal</span>
                </button>
              </div>
            </div>

            {/* Right: Credibility Card */}
            <div className="lg:col-span-5">
              <div className="bg-surface-container-lowest border border-border rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">Credibility Signals</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">Cryptographic Provenance</p>
                      <p className="text-xs text-on-surface-variant">Every project backed by SHA-256 attested artifacts</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">Type-Safe by Default</p>
                      <p className="text-xs text-on-surface-variant">Strict TypeScript, OpenAPI contracts, zero any</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">Data Integrity First</p>
                      <p className="text-xs text-on-surface-variant">PostgreSQL RLS, migrations, zero-downtime deployments</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">Business Outcomes</p>
                      <p className="text-xs text-on-surface-variant">Built systems serving 10k+ users, reduced infra costs 40%</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center gap-4">
                  <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-mono text-on-surface-variant hover:text-primary transition-colors">
                    <GithubIcon className="w-4 h-4" />
                    <span>{profile.github}</span>
                  </a>
                  <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-mono text-on-surface-variant hover:text-primary transition-colors">
                    <LinkedinIcon className="w-4 h-4" />
                    <span>{profile.linkedin}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SERVICES MENU & SUBMENU ============ */}
      <section className="w-full py-16 bg-surface-container-low/40 border-y border-border transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-2">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Engineering Services Menu</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                Capabilities & Sub-Specialties
              </h2>
              <p className="text-sm text-on-surface-variant mt-1 max-w-xl">
                Explore core engineering tracks. Click into any service to view detailed tier subdivisions and transparent pricing models.
              </p>
            </div>
            <Link href="/services" className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:text-tertiary transition-colors">
              <span>View Full Catalog & Pricing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceCategories.slice(0, 6).map((cat) => {
              return (
                <article key={cat.id} className="bg-surface-container-lowest border border-border rounded-xl p-6 space-y-4 shadow-xs hover:border-primary/50 transition-all group flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary group-hover:bg-primary/20 transition-colors">
                        <ServiceIcon iconName={cat.icon} className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-on-surface group-hover:text-primary transition-colors">{cat.title}</h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mt-1">{cat.description}</p>
                      </div>
                    </div>

                    {/* Submenu items / sub-specialties */}
                    <div className="pt-3 border-t border-border/60 space-y-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant block">Sub-Tracks & Tiers</span>
                      <ul className="space-y-1.5">
                        <li className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>Starter & MVP Tier</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>Professional / Growth Tier</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>Enterprise & Custom SLA</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs font-mono text-primary font-medium">View Tiers & Pricing</span>
                    <Link href={`/services#${cat.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors">
                      <span>Explore Menu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Engagement Models Submenu */}
          <div className="mt-12">
            <div className="mb-6">
              <h3 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-1">Engagement Models</h3>
              <p className="text-xs text-on-surface-variant">Flexible partnership structures tailored to your project scope and team cadence.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EngagementCard title="Fixed-Scope Project" desc="Clear deliverables, timeline & milestone billing." features={["Scope & acceptance criteria", "Milestone payments (30/40/30)", "30-day warranty period"]} iconName="Layers" />
              <EngagementCard title="Monthly Retainer" desc="Reserved engineering capacity for ongoing velocity." features={["Guaranteed weekly hours", "Slack/async communication", "Roll-over unused hours"]} iconName="Compass" />
              <EngagementCard title="Fractional CTO / Architect" desc="Strategic technical leadership & governance." features={["Architecture oversight & ADRs", "Hiring & technical interviews", "Board-ready reporting"]} iconName="ShieldCheck" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED PROJECTS ============ */}
      <section className="w-full py-16 bg-background transition-colors" id="projects">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-2">
                <Flag className="w-3.5 h-3.5" />
                <span>Selected Work</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                Problems Solved, Outcomes Delivered
              </h2>
              <p className="text-sm text-on-surface-variant mt-1 max-w-xl">
                Each project includes verifiable evidence: architecture decisions, test coverage, deployment receipts, and cryptographic proofs.
              </p>
            </div>
            <Link href="/evidence" className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:text-tertiary transition-colors">
              <span>View All Evidence ({projects.length} projects)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <article key={project.id} className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary hover:-translate-y-0.5 transition-all shadow-xs group">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={project.status} type="publication" />
                    <StatusBadge status={project.evidenceAccess} type="evidence" />
                  </div>

                  <div>
                    <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider block mb-1">
                      {project.category}
                    </span>
                    <h3 className="font-semibold text-lg text-on-surface group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                    {project.summary}
                  </p>

                  {project.keyMetrics && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      {project.keyMetrics.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="bg-surface-container-low p-2 rounded">
                          <span className="font-mono text-[10px] text-on-surface-variant block">{m.label}</span>
                          <span className="font-mono font-semibold text-xs text-on-surface">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.technologies.slice(0, 5).map((tech) => (
                      <span key={tech} className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 5 && (
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                        +{project.technologies.length - 5}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-surface-container-low/50 border-t border-border flex items-center justify-between">
                  <span className="font-mono text-[11px] text-on-surface-variant">{project.timeline}</span>
                  <Link href="/evidence" className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>View Evidence</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SOCIAL PROOF / TECH DEPTH ============ */}
      <section className="w-full py-16 bg-surface-container-low/40 border-y border-border transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-4">Technical Depth</h3>
              <div className="space-y-3">
                <TechPill label="Frontend" techs={["Next.js 15 (App Router)", "React 19", "TypeScript (strict)", "Tailwind CSS", "Framer Motion", "Storybook"]} />
                <TechPill label="Backend" techs={["Node.js (Fastify/Hono)", "Go", "PostgreSQL 16", "Prisma / Drizzle", "Redis (BullMQ)", "WebSockets"]} />
                <TechPill label="Data & Infra" techs={["PostgreSQL RLS", "Docker", "GitHub Actions", "Terraform", "Kubernetes (k3s/EKS)", "Prometheus/Grafana"]} />
                <TechPill label="Practices" techs={["Clean Architecture (DDD)", "OpenAPI 3.1 / Protobuf", "TDD + Property Testing", "ADR Documentation", "RLS Multi-tenancy", "CI/CD with Preview Deploys"]} />
              </div>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-4">What Clients & Teams Get</h3>
              <ul className="space-y-3">
                <OutcomeItem icon={CheckCircle2} text="Production-ready code with 80%+ test coverage" />
                <OutcomeItem icon={CheckCircle2} text="Architecture Decision Records for every major choice" />
                <OutcomeItem icon={CheckCircle2} text="Cryptographic proof of delivery (SHA-256 attested)" />
                <OutcomeItem icon={CheckCircle2} text="Documentation: runbooks, API specs, onboarding guides" />
                <OutcomeItem icon={CheckCircle2} text="30-day warranty on all fixed-scope deliveries" />
                <OutcomeItem icon={CheckCircle2} text="Knowledge transfer — your team owns the code" />
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Link href="/skills" className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:text-tertiary transition-colors">
              <span>Full Technical Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="w-full py-20 bg-background transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-surface-container-lowest border border-border rounded-2xl p-8 sm:p-12 lg:p-16 text-center max-w-3xl mx-auto space-y-6 shadow-xs relative overflow-hidden">
            <div className="absolute top-4 right-4 opacity-5">
              <Code2 className="w-24 h-24 text-primary" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-mono text-xs uppercase tracking-wider relative z-10">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Open to Opportunities</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-on-surface relative z-10">
              Let's Build Something <span className="text-primary">That Lasts</span>
            </h2>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed relative z-10">
              Whether you're a hiring manager looking for a reliable engineer who ships quality,
              or a founder needing a technical partner to take your product from concept to production —
              let's talk.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 relative z-10">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors shadow-xs"
              >
                <Mail className="w-4 h-4" />
                <span>Start a Conversation</span>
              </Link>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-surface-container-low text-on-surface text-sm font-mono hover:bg-surface-container transition-colors"
              >
                <span>{profile.email}</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-on-surface-variant font-mono relative z-10">
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <LinkedinIcon className="w-3.5 h-3.5" />
                <span>{profile.linkedin}</span>
              </a>
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <GithubIcon className="w-3.5 h-3.5" />
                <span>{profile.github}</span>
              </a>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profile.location} · EAT (UTC+3)</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <TerminalModal />
    </div>
  );
}

// ============ HELPER COMPONENTS ============

function EngagementCard({ title, desc, features, iconName }: { title: string; desc: string; features: string[]; iconName: string }) {
  return (
    <article className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-3 shadow-xs hover:border-primary/50 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
          <ServiceIcon iconName={iconName} className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-on-surface">{title}</h4>
          <p className="text-xs text-on-surface-variant mt-1">{desc}</p>
        </div>
      </div>
      <ul className="space-y-1.5 pt-2 border-t border-border/60">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-on-surface-variant">
            <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function TechPill({ label, techs }: { label: string; techs: string[] }) {
  return (
    <div className="space-y-2">
      <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {techs.map((t) => (
          <span key={t} className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-border/60">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function OutcomeItem({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm text-on-surface-variant">
      <div className="w-5 h-5 flex items-center justify-center shrink-0 text-emerald-500 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <span>{text}</span>
    </li>
  );
}