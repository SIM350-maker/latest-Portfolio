"use client";

import React from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import {
  Briefcase,
  GraduationCap,
  Calendar,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ExternalLink
} from "lucide-react";

export default function ExperiencePage() {
  const { experience } = usePortfolio();

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="max-w-3xl mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Career Milestones & Roles</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
              Engineering Experience & Education
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Chronological ledger of professional software engineering positions, open-technology initiatives, and foundational academic computer science training.
            </p>
          </div>

          {/* Timeline */}
          <div className="space-y-8 max-w-4xl">
            {experience.map((item, index) => {
              const isWork = item.type === "Work";
              const Icon = isWork ? Briefcase : GraduationCap;

              return (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 hover:border-primary transition-all shadow-xs space-y-5 relative group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors">
                          {item.role}
                        </h2>
                        <span className="font-mono text-xs text-primary font-medium">
                          {item.organization}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{item.period}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{item.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant block">
                      Key Responsibilities & Deliverables
                    </span>
                    <ul className="space-y-2 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                      {item.highlights.map((h, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-border flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] text-on-surface-variant mr-1">Applied:</span>
                    {item.skills.map((skill) => (
                      <span
                        key={skill}
                        className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}
