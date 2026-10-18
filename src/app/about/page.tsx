"use client";

import React from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import {
  MapPin,
  Clock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  ArrowRight,
  Code2,
  Cpu,
  BookOpen
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/Icons";

export default function AboutPage() {
  const { profile, experience, setTerminalOpen } = usePortfolio();

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          
          {/* Page Header */}
          <div className="max-w-3xl mb-12 space-y-4">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Biographical & Engineering Context</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface">
              Engineering with Rigor, Context, and Verifiable Impact
            </h1>
            <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
              I am Simon Ipara—a full-stack software engineer based in Nairobi, Kenya. I design and build resilient web applications, decoupled API services, and robust data workflows that prioritize maintainability and architectural clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Main Narrative Column */}
            <div className="lg:col-span-8 space-y-10">
              
              {/* Core Story */}
              <section className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
                <h2 className="text-xl font-bold text-on-surface">
                  Professional Philosophy & Background
                </h2>
                <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
                  <p>
                    Software systems fail not from a lack of technical ambition, but from undisciplined boundaries, implicit assumptions, and fragile state synchronization. My approach centers on making architecture observable, testable, and mathematically dependable.
                  </p>
                  <p>
                    Over several years of building production-grade web systems, I have architected mission-critical platforms such as an Enterprise Healthcare Management Information System (reducing clinical registration and triage bottlenecks by over 60%), distributed task dependency engines, and offline-first mobile synchronization ledgers.
                  </p>
                  <p>
                    I avoid performative buzzwords, arbitrary metric claims, and cosmetic complexity. Every service I design begins with unambiguous domain invariants, contract-first OpenAPI schemas, and database-level security policies such as PostgreSQL Row-Level Security (RLS).
                  </p>
                </div>
              </section>

              {/* Working Principles */}
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-on-surface">
                  Core Working Principles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="bg-surface-container-lowest border border-border p-5 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 font-mono text-xs text-primary font-semibold uppercase">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Evidence Over Assertion</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Every claim regarding performance, uptime, or data isolation is backed by verifiable tests, code hashes, or benchmark reports.
                    </p>
                  </div>

                  <div className="bg-surface-container-lowest border border-border p-5 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 font-mono text-xs text-blue-500 font-semibold uppercase">
                      <Cpu className="w-4 h-4" />
                      <span>Storage-Level Security</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Security must never be an afterthought in client state or API middleware. We enforce strict data tenancy natively at the PostgreSQL RLS layer.
                    </p>
                  </div>

                  <div className="bg-surface-container-lowest border border-border p-5 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 font-mono text-xs text-emerald-500 font-semibold uppercase">
                      <Code2 className="w-4 h-4" />
                      <span>Decoupled Domain Logic</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Hexagonal & Clean Architecture boundaries prevent frameworks, database drivers, or third-party APIs from polluting pure business rules.
                    </p>
                  </div>

                  <div className="bg-surface-container-lowest border border-border p-5 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 font-mono text-xs text-amber-500 font-semibold uppercase">
                      <BookOpen className="w-4 h-4" />
                      <span>Disciplined AI Integration</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Leverage AI tools systematically for prototyping and test synthesis while maintaining manual architectural ownership and line-by-line verification.
                    </p>
                  </div>

                </div>
              </section>

              {/* Experience Timeline Preview */}
              <section className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-on-surface">
                    Experience & Education Summary
                  </h2>
                  <Link
                    href="/experience"
                    className="font-mono text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Full timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-6">
                  {experience.map((item) => (
                    <div key={item.id} className="relative pl-6 border-l-2 border-border space-y-2">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-on-surface">{item.role}</span>
                        <span className="font-mono text-xs text-on-surface-variant">{item.period}</span>
                      </div>
                      <div className="text-xs text-primary font-mono">{item.organization} · {item.location}</div>
                      <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1">
                        {item.highlights.slice(0, 2).map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-surface-container-lowest border border-border rounded-xl p-6 space-y-5 shadow-xs">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl font-mono shadow-xs">
                    SI
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-on-surface">{profile.name}</h3>
                    <p className="text-xs text-on-surface-variant font-mono">{profile.title}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-border text-xs font-mono">
                  <div className="flex items-center gap-2.5 text-on-surface-variant">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-on-surface-variant">
                    <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{profile.timezone}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-on-surface-variant">
                    <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                    <a href={`mailto:${profile.email}`} className="hover:text-primary transition-colors">
                      {profile.email}
                    </a>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded border border-border bg-surface-container-low text-xs font-mono flex items-center justify-center gap-1.5 hover:border-primary transition-colors"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded border border-border bg-surface-container-low text-xs font-mono flex items-center justify-center gap-1.5 hover:border-primary transition-colors"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                </div>

                <button
                  onClick={() => setTerminalOpen(true)}
                  className="w-full py-2 px-3 rounded bg-surface-container text-xs font-mono text-primary flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Inspect System CLI</span>
                </button>
              </div>

              {/* Status Banner */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-primary font-mono text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CURRENT STATUS</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Available for full-time engineering roles, technical lead responsibilities, and architecture consultation.
                </p>
                <div className="pt-2">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Initiate inquiry</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}
