"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Terminal, Mail, ShieldCheck, Cpu, GraduationCap, Lock, Award, Users } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/Icons";

export function Footer() {
  const { profile, setTerminalOpen } = usePortfolio();
  const [authorizedUser, setAuthorizedUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.authenticated && data.user) {
          setAuthorizedUser(data.user);
        } else {
          setAuthorizedUser(null);
        }
      })
      .catch(() => {
        if (isMounted) setAuthorizedUser(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="w-full bg-surface-container-low border-t border-border mt-auto transition-colors">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Positioning */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white text-xs">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-on-surface">
                {profile.name}
              </span>
            </div>
            
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Full-stack software engineer based in {profile.location}. Designing robust web systems, resilient APIs, and verifiable digital products with strict domain boundaries.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded border border-border bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
                title="GitHub Profile"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded border border-border bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
                title="LinkedIn Profile"
              >
                <LinkedinIcon className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="w-8 h-8 rounded border border-border bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
                title="Email Contact"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Directory Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-on-surface mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About & Background
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-primary transition-colors">
                  Projects & Case Studies
                </Link>
              </li>
              <li>
                <Link href="/skills" className="hover:text-primary transition-colors">
                  Skills & Technical Stacks
                </Link>
              </li>
              <li>
                <Link href="/certifications" className="hover:text-primary transition-colors flex items-center gap-1.5 font-medium text-on-surface">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  <span>Education & Certifications</span>
                </Link>
              </li>
              <li>
                <Link href="/engineering" className="hover:text-primary transition-colors">
                  Engineering Principles & ADR
                </Link>
              </li>
              <li>
                <Link href="/evidence" className="hover:text-primary transition-colors">
                  Evidence & Artifacts Ledger
                </Link>
              </li>
            </ul>
          </div>

          {/* Case Studies Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-on-surface mb-3">
              Case Studies & History
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              <li>
                <Link href="/projects/healthcare-mis" className="hover:text-primary transition-colors">
                  Healthcare MIS (Lead Architecture)
                </Link>
              </li>
              <li>
                <Link href="/projects/task-manager" className="hover:text-primary transition-colors">
                  Task Manager & DAG Engine
                </Link>
              </li>
              <li>
                <Link href="/projects/padtrack" className="hover:text-primary transition-colors">
                  PadTrack (Offline SQLite)
                </Link>
              </li>
              <li>
                <Link href="/projects/evoting" className="hover:text-primary transition-colors">
                  E-Voting Cryptographic Ledger
                </Link>
              </li>
              <li>
                <Link href="/experience" className="hover:text-primary transition-colors">
                  Career Milestones & Roles
                </Link>
              </li>
              <li>
                <Link href="/certifications" className="hover:text-primary transition-colors">
                  Verified Academic Transcripts
                </Link>
              </li>
            </ul>
          </div>

          {/* Administration & Governance Column */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-on-surface mb-3">
              Admin & Governance
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              {authorizedUser ? (
                <>
                  <li>
                    <Link href="/manage" className="hover:text-primary transition-colors flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>CMS Workspace</span>
                      <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 font-bold">ACTIVE</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/manage/education" className="hover:text-primary transition-colors flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-primary" />
                      <span>Manage Education & Certs</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/manage/access" className="hover:text-primary transition-colors flex items-center gap-1">
                      <Users className="w-3 h-3 text-amber-500" />
                      <span>Access & User Control</span>
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link href="/manage/login" className="hover:text-primary transition-colors flex items-center gap-1.5 text-on-surface-variant font-mono text-[11px]">
                    <Lock className="w-3 h-3 text-primary" />
                    <span>CMS Console (Authorized Access)</span>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/manage/projects" className="hover:text-primary transition-colors">
                  Projects & Catalog Ledger
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setTerminalOpen(true)}
                  className="hover:text-primary transition-colors text-left flex items-center gap-1 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-primary" />
                  <span>Launch Architecture Terminal</span>
                </button>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Data Ethics & Cryptographic Proofs
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar with Status & Invariants */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {profile.status}
            </span>
            <span>{profile.timezone}</span>
            <span>{profile.uptime} Uptime</span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>{profile.provenance}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
