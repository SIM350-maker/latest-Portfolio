"use client";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Database,
  Cpu,
  Layers,
  FileCode,
  Lock,
  GitBranch
} from "lucide-react";
import { GithubIcon } from "@/components/Icons";

export default function ProjectCaseStudyClient({ slug }: { slug: string }) {
  const { projects, setTerminalOpen } = usePortfolio();

  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    notFound();
  }

  const currentIndex = projects.findIndex((p) => p.slug === slug);
  const nextProject = projects[(currentIndex + 1) % projects.length];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-10 md:py-14">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          
          {/* Breadcrumb Header */}
          <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold truncate">{project.title}</span>
          </div>

          {/* Hero Banner */}
          <div className="bg-surface-container-lowest border border-border rounded-2xl p-6 sm:p-10 mb-10 shadow-xs space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={project.status} type="publication" />
                <StatusBadge status={project.evidenceAccess} type="evidence" />
                <span className="font-mono text-xs text-on-surface-variant">
                  {project.category} · {project.timeline}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded border border-border bg-surface-container-low text-xs font-mono text-on-surface hover:border-primary transition-colors"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>Repository</span>
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
                  >
                    <span>Live Demo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-on-surface">
                {project.title}
              </h1>
              <p className="font-mono text-sm text-primary font-medium mt-1">
                {project.subtitle}
              </p>
            </div>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-3xl">
              {project.summary}
            </p>

            {/* Key Metrics Dashboard */}
            {project.keyMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
                {project.keyMetrics.map((metric, i) => (
                  <div key={i} className="bg-surface-container-low p-4 rounded-xl border border-border/50">
                    <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider block">
                      {metric.label}
                    </span>
                    <span className="text-xl font-bold text-on-surface font-mono mt-1 block">
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Technologies Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-on-surface-variant uppercase">Stack:</span>
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-xs px-2.5 py-1 rounded bg-surface-container text-on-surface font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Main Content Column */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* Problem & Motivation */}
              <section className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="flex items-center gap-2 font-mono text-xs uppercase text-primary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>01 / System Problem Context</span>
                </div>
                <h2 className="text-xl font-bold text-on-surface">The Operational Challenge</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {project.problem}
                </p>
              </section>

              {/* Solution & Architectural Blueprint */}
              <section className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex items-center gap-2 font-mono text-xs uppercase text-primary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>02 / Architecture & Domain Model</span>
                </div>
                <h2 className="text-xl font-bold text-on-surface">Architectural Design & Invariants</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {project.solution}
                </p>

                {/* Hexagonal Clean Architecture Diagram */}
                <div className="bg-[#0A0F18] border border-[#2A374A] rounded-xl p-6 font-mono text-xs text-gray-200 overflow-x-auto space-y-4">
                  <div className="flex items-center justify-between text-gray-400 border-b border-gray-800 pb-2">
                    <span className="text-cyan-400 font-semibold">Architecture Specification Topology</span>
                    <span className="text-[11px] text-emerald-400">DOMAIN-DRIVEN DESIGN</span>
                  </div>

                  <pre className="text-gray-300 leading-relaxed font-mono">
{`[ Presentation Layer ]  ─── Next.js 16 App Router (RSC + Client Components)
        │                 ├── Strict WCAG 2.2 AA Keyboard Navigation
        │                 └── Optimistic React 19 State Mutations
        ▼
[ API Gateway / Proxy ] ─── Edge Middleware & Rate Limiter
        │                 ├── JWT Validation & Role-Based ACL
        │                 └── Redis Session & Queue Token Store
        ▼
[ Core Domain Engine ]  ─── Pure TypeScript Hexagonal Core
        │                 ├── Patient Record Invariant Rules
        │                 ├── Triage Priority Queue Calculator
        │                 └── Cryptographic Merkle Event Signer
        ▼
[ Persistence Engine ]  ─── PostgreSQL 16
                          ├── Row-Level Security (Tenant Isolation)
                          └── Immutable Audit Append-Only Ledger`}
                  </pre>
                </div>

                {project.architectureNote && (
                  <p className="text-xs text-on-surface-variant font-mono bg-surface-container-low p-3.5 rounded border border-border">
                    <strong>Architectural Note:</strong> {project.architectureNote}
                  </p>
                )}
              </section>

              {/* Architectural Decision Records (ADRs) */}
              {project.decisions && project.decisions.length > 0 && (
                <section className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase text-primary font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span>03 / Architectural Decision Records (ADR)</span>
                  </div>
                  <h2 className="text-xl font-bold text-on-surface">Key Technical Decisions & Trade-Offs</h2>

                  <div className="space-y-4">
                    {project.decisions.map((dec, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-surface-container-low border border-border space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-on-surface">
                            ADR-0{idx + 1}: {dec.decision}
                          </h3>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold shrink-0">
                            {dec.choice}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          <strong>Rationale:</strong> {dec.rationale}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Security & Cryptographic Provenance */}
              {project.evidenceSha && (
                <section className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase text-primary font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>04 / Cryptographic Evidence & Provenance</span>
                  </div>
                  <h2 className="text-xl font-bold text-on-surface">Verifiable SHA-256 Attestation</h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    This case study is anchored by an immutable commit hash and verifiable delivery artifact in the public ledger.
                  </p>

                  <div className="p-3.5 rounded bg-surface-container font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-border">
                    <span className="text-on-surface-variant truncate">SHA-256: {project.evidenceSha}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">ATTESTED</span>
                  </div>
                </section>
              )}

            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Project Meta Card */}
              <div className="bg-surface-container-lowest border border-border rounded-xl p-6 space-y-4 shadow-xs">
                <h3 className="font-mono text-xs uppercase tracking-wider font-semibold text-on-surface">
                  Metadata & Attribution
                </h3>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">My Role</span>
                    <span className="font-semibold text-on-surface">{project.role}</span>
                  </div>

                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">Timeline</span>
                    <span className="font-semibold text-on-surface">{project.timeline}</span>
                  </div>

                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">Category</span>
                    <span className="font-semibold text-on-surface">{project.category}</span>
                  </div>

                  <div>
                    <span className="text-on-surface-variant block text-[10px] uppercase">Access Classification</span>
                    <StatusBadge status={project.evidenceAccess} type="evidence" />
                  </div>
                </div>

                <div className="pt-3 border-t border-border space-y-2">
                  <button
                    onClick={() => setTerminalOpen(true)}
                    className="w-full py-2 px-3 rounded bg-surface-container text-xs font-mono text-primary flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Inspect via CLI</span>
                  </button>

                  <Link
                    href="/contact"
                    className="w-full py-2 px-3 rounded bg-primary text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-tertiary transition-colors shadow-xs"
                  >
                    <span>Inquire About This Work</span>
                  </Link>
                </div>
              </div>

              {/* Next Case Study Navigation */}
              {nextProject && (
                <div className="bg-surface-container-low border border-border rounded-xl p-5 space-y-2">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase">Next Case Study</span>
                  <h4 className="font-semibold text-sm text-on-surface">{nextProject.title}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-2">{nextProject.summary}</p>
                  <Link
                    href={`/projects/${nextProject.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-1"
                  >
                    <span>View Next Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

            </div>

          </div>

        </div>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}
