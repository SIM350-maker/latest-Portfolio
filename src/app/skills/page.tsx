"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import {
  Cpu,
  Search,
  Code2,
  Database,
  Layers,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  CheckCircle2
} from "lucide-react";

export default function SkillsPage() {
  const { skills } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("All");

  const categories = ["All", ...skills.map((s) => s.category)];

  const filteredSkills = skills
    .filter((group) => selectedGroup === "All" || group.category === selectedGroup)
    .map((group) => {
      const matchingItems = group.skills.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { ...group, skills: matchingItems };
    })
    .filter((group) => group.skills.length > 0);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="max-w-3xl mb-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Competencies & Technology Ledger</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
              Skills & Engineering Capabilities
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Every technical skill below represents tested, verifiable competency applied across production web applications, database layers, and distributed systems.
            </p>
          </div>

          {/* Search & Category Pills */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-4 mb-8 shadow-xs space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search skills, tools, frameworks (e.g. Next.js, PostgreSQL, Docker)..."
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-low border border-border text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-hidden focus:border-primary font-mono transition-colors"
              />
            </div>

            <div className="pt-2 border-t border-border flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[11px] text-on-surface-variant mr-1 uppercase">Group:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedGroup(cat)}
                  className={`px-3 py-1 rounded text-xs transition-colors font-mono ${
                    selectedGroup === cat
                      ? "bg-primary text-white font-medium shadow-xs"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Grid */}
          <div className="space-y-8">
            {filteredSkills.map((group) => (
              <div
                key={group.category}
                className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs"
              >
                <div>
                  <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                    <span>{group.category}</span>
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1 font-mono">
                    {group.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="p-4 rounded-lg bg-surface-container-low/60 border border-border hover:border-primary hover:bg-surface-container-low transition-all space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                          {skill.name}
                        </span>
                        <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-border">
                          {skill.level}
                        </span>
                      </div>

                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {skill.description}
                      </p>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{skill.evidenceCount} Linked Proofs</span>
                        </span>
                        <Link
                          href="/projects"
                          className="hover:text-primary transition-colors flex items-center gap-0.5"
                        >
                          <span>Projects</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}
