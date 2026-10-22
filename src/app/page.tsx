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
  CreditCard,
  Zap as ZapIcon,
  Layers as LayersIcon,
} from "lucide-react";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Layers, Server, Database, Cloud, Bot, Compass, Code2, Cpu, ShieldCheck, Globe, Zap, Shield, Target, Rocket, Star, BarChart2,
};

const CATEGORY_ACCENTS: Record<string, string> = {
  fullstack: "blue",
  backend: "purple",
  database: "emerald",
  cloud: "teal",
  ai: "amber",
  consulting: "violet",
};

const CATEGORY_ACCENT_CLASSES: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  fullstack: { bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]", text: "text-blue-400" },
  backend: { bg: "bg-purple-500/10", border: "border-purple-500/20", glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]", text: "text-purple-400" },
  database: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]", text: "text-emerald-400" },
  cloud: { bg: "bg-teal-500/10", border: "border-teal-500/20", glow: "hover:shadow-[0_0_30px_rgba(20,184,166,0.3)]", text: "text-teal-400" },
  ai: { bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]", text: "text-amber-400" },
  consulting: { bg: "bg-violet-500/10", border: "border-violet-500/20", glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]", text: "text-violet-400" },
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
            {/* Verified Availability Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10 backdrop-blur-sm hover:bg-primary/8 transition-colors duration-300 group">
              <Verified className="w-4 h-4 text-primary group-hover:text-emerald-500 transition-colors" />
              <span className="font-mono text-sm font-medium text-on-surface uppercase tracking-wider">
                Available for Contract & Full-time Roles
              </span>
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary animate-pulse slow" />
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
// SERVICES SNAP SECTION - FUTURISTIC
// ============================================================
function ServicesSnap() {
  const [serviceCategories, setServiceCategories] = useState<Array<{ id: number; title: string; slug: string; description: string; icon: string }>>([]);
  const [servicePackages, setServicePackages] = useState<Array<{ category_id: number; price_kes: number; name: string }>>([]);

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
    <section className="w-full bg-background py-12 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-3 inline-flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Services
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Specialized engineering services with transparent, tiered pricing. Each track combines deep technical expertise with measurable business outcomes.
          </p>
        </div>

        {/* Service Cards Grid */}
        {serviceCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {serviceCategories.slice(0, 6).map((cat, index) => {
              const pkg = servicePackages?.find((p) => p.category_id === cat.id);
              const accent = CATEGORY_ACCENT_CLASSES[cat.slug] || CATEGORY_ACCENT_CLASSES.fullstack;
              
              return (
                <motion.article
                  key={cat.id}
                  className={`
                    group relative flex flex-col items-center gap-3
                    bg-surface-container-lowest/80 backdrop-blur-sm
                    border ${accent.border}
                    rounded-2xl p-5
                    transition-all duration-300 ease-out
                    hover:scale-[1.02] hover:-translate-y-1 ${accent.glow}
                    cursor-pointer
                    overflow-hidden
                  `}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {/* Category Accent Line - Top */}
                  <div className={`
                    absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent.text}/30 ${accent.text}
                    group-hover:w-full group-hover:opacity-100
                    transition-all duration-300
                  `} />

                  {/* Icon Wrapper */}
                  <div className={`
                    relative w-14 h-14 rounded-xl flex items-center justify-center
                    ${accent.bg} ${accent.border}
                    group-hover:bg-primary/10
                    transition-all duration-300
                    group-hover:shadow-lg ${accent.glow.replace('hover:', 'group-hover:')}
                  `}>
                    <ServiceIcon iconName={cat.icon} className="w-6 h-6 text-primary" />
                    {/* Pulsing ring on hover */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Title & Description */}
                  <div className="text-center space-y-1.5">
                    <h3 className="font-semibold text-lg text-on-surface group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant/70 line-clamp-2">
                      {cat.description}
                    </p>
                  </div>

                  {/* Pricing Preview */}
                  {pkg && (
                    <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full">
                      <CreditCard className="w-3.5 h-3.5 text-primary" />
                      <span className="font-mono text-[11px] font-semibold text-primary">
                        From KES {pkg.price_kes.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* CTA Arrow */}
                  <div className="mt-3 flex items-center gap-1.5 text-primary group-hover:gap-2.5 transition-all">
                    <span className="font-mono text-[10px] uppercase tracking-wider">Explore</span>
                    <motion.span
                      initial={{ x: 0 }}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </motion.span>
                  </div>

                  {/* Link wrapper */}
                  <Link href={`/services/${cat.slug}`} className="absolute inset-0 z-10" />
                </motion.article>
              );
            })}
          </div>
        )}

        {/* View All Services Link */}
        <div className="mt-10 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-sm font-medium hover:bg-primary hover:text-white transition-all shadow-xs"
          >
            <span>View All Services & Pricing</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// PROJECTS SNAP - FUTURISTIC
// ============================================================
function ProjectsSnap() {
  const { projects } = usePortfolio();
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 3);

  return (
    <section className="w-full bg-background py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-3 inline-flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Projects
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Curated case studies with verifiable evidence: architecture decisions, test coverage, deployment receipts, and cryptographic proofs.
          </p>
        </div>

        {/* Project Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {featuredProjects.map((project, index) => (
            <motion.article
              key={project.id}
              className={`
                group relative flex flex-col overflow-hidden
                bg-surface-container-lowest/80 backdrop-blur-sm
                border border-border
                rounded-2xl
                transition-all duration-300 ease-out
                hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]
                cursor-pointer
              `}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Category Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider bg-surface-container-lowest/90 backdrop-blur-sm px-2 py-1 rounded-full border border-border">
                  {project.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col h-full">
                <h3 className="font-semibold text-lg text-on-surface group-hover:text-primary transition-colors mb-2">
                  {project.title}
                </h3>
                <p className="text-xs text-on-surface-variant/70 leading-relaxed line-clamp-3 flex-1 mb-4">
                  {project.summary}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.technologies.slice(0, 5).map((tech) => (
                    <span key={tech} className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 5 && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                      +{project.technologies.length - 5}
                    </span>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={`/evidence/${project.id}`}
                  className="inline-flex items-center gap-1.5 w-full justify-center px-3 py-2 bg-primary/5 border border-primary/10 rounded-xl text-primary font-mono text-xs font-medium hover:bg-primary hover:text-white transition-all"
                >
                  <span>View Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 to-primary group-hover:from-primary group-hover:to-primary/80 transition-all duration-500" />
            </motion.article>
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-10 text-center">
          <Link
            href="/evidence"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-sm font-medium hover:bg-primary hover:text-white transition-all shadow-xs"
          >
            <span>View All Evidence ({projects.length} projects)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TECHNOLOGIES & OUTCOMES - FUTURISTIC
// ============================================================
function TechDepth() {
  const { profile } = usePortfolio();

  const techCategories = [
    { label: "Frontend", techs: ["Next.js 15 (App Router)", "React 19", "TypeScript (strict)", "Tailwind CSS", "Framer Motion"], color: "blue" },
    { label: "Backend", techs: ["Node.js (Fastify/Hono)", "Go", "PostgreSQL 16", "Prisma / Drizzle", "Redis (BullMQ)"], color: "purple" },
    { label: "Data & Infra", techs: ["PostgreSQL RLS", "Docker", "GitHub Actions", "Terraform"], color: "emerald" },
    { label: "Practices", techs: ["Clean Architecture (DDD)", "OpenAPI 3.1 / Protobuf", "TDD + Property Testing", "ADR Documentation"], color: "teal" },
  ];

  const outcomes = [
    { icon: CheckCircle2, text: "Production-ready code with 80%+ test coverage" },
    { icon: CheckCircle2, text: "Architecture Decision Records for every major choice" },
    { icon: CheckCircle2, text: "Cryptographic proof of delivery (SHA-256 attested)" },
    { icon: CheckCircle2, text: "Documentation: runbooks, API specs, onboarding guides" },
    { icon: CheckCircle2, text: "30-day warranty on all fixed-scope deliveries" },
    { icon: CheckCircle2, text: "Knowledge transfer — your team owns the code" },
  ];

  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    teal: { bg: "bg-teal-500/10", border: "border-teal-500/20", text: "text-teal-400" },
  };

  return (
    <section className="w-full bg-surface-container-low/40 border-y border-border py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/3 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-3 inline-flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            Technologies & Outcomes
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Modern stack choices backed by engineering rigor. Every technology serves a purpose — every outcome is verifiable.
          </p>
        </div>

        {/* Technologies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {techCategories.map((cat, index) => {
            const colors = colorClasses[cat.color];
            return (
              <motion.div
                key={cat.label}
                className={`
                  group relative p-5 rounded-2xl
                  bg-surface-container-lowest/80 backdrop-blur-sm
                  border ${colors.border}
                  transition-all duration-300 ease-out
                  hover:scale-[1.02] hover:-translate-y-1
                  hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]
                `}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Accent indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.text}/30 ${colors.text} group-hover:w-full transition-all duration-300`} />
                
                <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider font-medium mb-3 ${colors.text}`}>
                  <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                  {cat.label}
                </span>
                
                <div className="flex flex-wrap gap-1.5">
                  {cat.techs.map((tech) => (
                    <span key={tech} className={`font-mono text-[10px] px-2 py-0.5 rounded ${colors.bg} ${colors.border} ${colors.text}/80 hover:${colors.text} transition-colors`}>
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Outcomes List */}
        <div className="relative">
          <h3 className="font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-6 inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            What You Get
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {outcomes.map(({ icon: Icon, text }, index) => (
              <motion.li
                key={text}
                className={`
                  group relative flex items-start gap-3 text-sm text-on-surface-variant
                  p-4 rounded-xl
                  bg-surface-container-lowest/80 backdrop-blur-sm
                  border border-border
                  transition-all duration-300 ease-out
                  hover:border-primary/30 hover:bg-primary/5
                `}
                whileHover={{ x: 4 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0 text-emerald-500 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="flex-1">{text}</span>
              </motion.li>
            ))}
          </div>
        </div>

        {/* View Skills Link */}
        <div className="mt-10 text-center">
          <Link
            href="/skills"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-sm font-medium hover:bg-primary hover:text-white transition-all shadow-xs"
          >
            <span>Full Technical Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FINAL CTA - FUTURISTIC
// ============================================================
function FinalCTA() {
  const { profile } = usePortfolio();

  return (
    <section className="w-full bg-background py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="bg-surface-container-lowest/80 backdrop-blur-sm border border-primary/10 rounded-3xl p-8 sm:p-12 lg:p-16 text-center max-w-3xl mx-auto space-y-6 relative overflow-hidden">
          {/* Animated background orbs */}
          <div className="absolute top-4 right-4 opacity-5">
            <Code2 className="w-24 h-24 text-primary" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-3">
            <Terminal className="w-16 h-16 text-primary" />
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-mono text-xs uppercase tracking-wider relative z-10 group">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse group-hover:scale-150 transition-transform" />
            <span>Open to Opportunities</span>
          </div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface relative z-10"
          >
            Let's Build Something <span className="text-primary">That Lasts</span>
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-base sm:text-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed relative z-10"
          >
            Whether you're a hiring manager looking for a reliable engineer who ships quality,
            or a founder needing a technical partner to take your product from concept to production —
            let's talk.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-wrap items-center justify-center gap-4 relative z-10"
          >
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-tertiary hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all shadow-lg"
            >
              <Mail className="w-4 h-4" />
              <span>Start a Conversation</span>
            </Link>

            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm font-mono hover:bg-primary/10 hover:border-primary/40 transition-all"
            >
              <span>{profile.email}</span>
            </a>
          </motion.div>

          {/* Contact Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-on-surface-variant font-mono relative z-10"
          >
            <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors group">
              <LinkedinIcon className="w-3.5 h-3.5" />
              <span>{profile.linkedin}</span>
            </a>
            <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors group">
              <GithubIcon className="w-3.5 h-3.5" />
              <span>{profile.github}</span>
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.location} · EAT (UTC+3)</span>
            </span>
          </motion.div>
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