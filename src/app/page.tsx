"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import { StatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";

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

interface ServiceCategory {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: keyof typeof SERVICE_ICONS;
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Layers, Server, Database, Cloud, Bot, Compass, Code2, Cpu, ShieldCheck, Globe, Zap, Shield, Target, Rocket, Star, BarChart2,
};

function ServiceIcon({ iconName, className = "w-6 h-6" }: { iconName: string; className?: string }) {
  const Icon = SERVICE_ICONS[iconName] || Layers;
  return <Icon className={className} aria-hidden="true" />;
}

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

function OutcomeList({ items }: { items: { icon: React.ElementType; text: string }[] }) {
  return (
    <ul className="space-y-3">
      {items.map(({ icon, text }, i) => (
        <OutcomeItem key={i} icon={icon} text={text} />
      ))}
    </ul>
  );
}

// ============================================================
// HERO SECTION
// ============================================================
function Hero({ setTerminalOpen }: { setTerminalOpen: (open: boolean) => void }) {
  const { profile } = usePortfolio();

  return (
    <section className="relative min-h-[70vh] bg-gradient-to-b from-surface/50 to-surface/80 border-b border-border">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-20 sm:py-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider">
              <Verified className="w-3.5 h-3.5" />
              <span>Available for Contract & Full-time Roles</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-[1.1]">
              I build <span className="text-primary">production-grade software</span> that solves real business problems
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Full-stack engineer with 3+ years delivering web applications, APIs, and data systems. Clean architecture, type-safe code, and verifiable outcomes — not just features.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
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

            {/* Scroll indicator */}
            <div className="pt-6 text-center">
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 text-on-surface-variant rotate-0 transition-transform duration-1500 ease-in-out infinite alternate" aria-hidden="true">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right: Credibility Card */}
          <div className="lg:col-span-5 order-2 lg:order-1">
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
                    <p className="text-xs text-on-surface-variant/70">Every project backed by SHA-256 attested artifacts</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">Type-Safe by Default</p>
                    <p className="text-xs text-on-surface-variant/70">Strict TypeScript, OpenAPI contracts, zero any</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">Data Integrity First</p>
                    <p className="text-xs text-on-surface-variant/70">PostgreSQL RLS, migrations, zero-downtime deployments</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-on-surface">Business Outcomes</p>
                    <p className="text-xs text-on-surface-variant/70">Built systems serving 10k+ users, reduced infra costs 40%</p>
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
  );
}

// ============================================================
// SERVICES SNAP SECTION
// ============================================================
function ServicesSnap() {
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
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

  return (
    <section className="w-full bg-background py-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h2 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-2">
            <Briefcase className="w-3.5 h-3.5" /> Engineering Tracks
          </h2>
          <p className="text-sm text-on-surface-variant mb-4">
            I offer specialized engineering services across tracks that combine technical depth with business impact. Each track includes tiered pricing and a defined capability scope.
          </p>
        </div>

        {serviceCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {serviceCategories.slice(0, 6).map((cat) => {
              const pkg = servicePackages?.find((p) => p.category_id === cat.id);
              return (
                <Link
                  key={cat.id}
                  href={`/services/${cat.slug}`}
                  className="group flex flex-col items-center gap-3 bg-surface-container-lowest border border-border rounded-xl p-4 hover:bg-primary/5 hover:text-on-surface transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <ServiceIcon iconName={cat.icon} className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-base text-on-surface line-clamp-1">{cat.title}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-1">{cat.description}</p>
                  <div className="mt-2 text-[10px] font-mono uppercase tracking-wider text-primary">
                    <span>Learn more →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// FEATURED PROJECTS SNAP
// ============================================================
function ProjectsSnap() {
  const { projects } = usePortfolio();
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 3);

  return (
    <section className="w-full bg-background py-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h2 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-2">
            <Flag className="w-3.5 h-3.5" /> Selected Work
          </h2>
          <p className="text-sm text-on-surface-variant mb-4">
            Each project includes verifiable evidence: architecture decisions, test coverage, deployment receipts, and cryptographic proofs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {featuredProjects.map((project) => (
            <article
              key={project.id}
              className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary hover:-translate-y-0.5 transition-all shadow-xs group"
            >
              <div className="p-4 flex flex-col h-100">
                <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider block mb-1">
                  {project.category}
                </span>
                <h3 className="font-semibold text-lg text-on-surface group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
              </div>
              <div className="p-3 bg-surface-container-low/50 border-t border-border flex flex-col gap-2 flex-1">
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {project.summary}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.technologies.slice(0, 4).map((tech) => (
                    <span key={tech} className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 4 && (
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                      +{project.technologies.length - 4}
                    </span>
                  )}
                </div>
              </div>
              <div className="px-3 py-2 bg-surface-container-low/50 border-t border-border flex items-center justify-between">
                <span className="font-mono text-[11px] text-on-surface-variant">{project.timeline}</span>
                <Link
                  href={`/evidence/${project.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform"
                >
                  <span>View Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/evidence"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:text-tertiary transition-colors"
          >
            <span>View All Evidence ({projects.length} projects)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TECH DEPTH & OUTCOMES
// ============================================================
function TechDepth() {
  const { profile } = usePortfolio();

  return (
    <section className="w-full bg-surface-container-low/40 border-y border-border transition-colors py-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-4">Technical Depth</h3>
            <div className="space-y-3">
              <TechPill label="Frontend" techs={["Next.js 15 (App Router)", "React 19", "TypeScript (strict)", "Tailwind CSS", "Framer Motion"]} />
              <TechPill label="Backend" techs={["Node.js (Fastify/Hono)", "Go", "PostgreSQL 16", "Prisma / Drizzle", "Redis (BullMQ)"]} />
              <TechPill label="Data & Infra" techs={["PostgreSQL RLS", "Docker", "GitHub Actions", "Terraform"]} />
              <TechPill label="Practices" techs={["Clean Architecture (DDD)", "OpenAPI 3.1 / Protobuf", "TDD + Property Testing", "ADR Documentation"]} />
            </div>
          </div>

          <div>
            <h3 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-4">What You Get</h3>
            <OutcomeList
              items={[
                { icon: CheckCircle2, text: "Production-ready code with 80%+ test coverage" },
                { icon: CheckCircle2, text: "Architecture Decision Records for every major choice" },
                { icon: CheckCircle2, text: "Cryptographic proof of delivery (SHA-256 attested)" },
                { icon: CheckCircle2, text: "Documentation: runbooks, API specs, onboarding guides" },
                { icon: CheckCircle2, text: "30-day warranty on all fixed-scope deliveries" },
                { icon: CheckCircle2, text: "Knowledge transfer — your team owns the code" },
              ]}
            />
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/skills"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:text-tertiary transition-colors"
          >
            <span>Full Technical Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FINAL CTA
// ============================================================
function FinalCTA() {
  const { profile } = usePortfolio();

  return (
    <section className="w-full bg-background py-12">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="bg-surface-container-lowest border border-border rounded-2xl p-8 sm:p-12 lg:p-16 text-center max-w-3xl mx-auto space-y-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-5">
            <Code2 className="w-24 h-24 text-primary" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-mono text-xs uppercase tracking-wider relative z-10">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Open to Opportunities</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface relative z-10">
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
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function HomePage() {
  const { profile, projects, setTerminalOpen } = usePortfolio();

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <Hero setTerminalOpen={setTerminalOpen} />

      <ServicesSnap />

      <ProjectsSnap />

      <TechDepth />

      <FinalCTA />

      <Footer />
      <TerminalModal />
    </div>
  );
}