"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ShieldCheck,
  Search,
  Copy,
  Check,
  FileCode,
  Lock,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function EvidencePage() {
  const { evidence } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState("");
  const [accessFilter, setAccessFilter] = useState("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEvidence = evidence.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sha256.toLowerCase().includes(searchTerm.toLowerCase());

    const matchAccess = accessFilter === "All" || item.access === accessFilter;

    return matchSearch && matchAccess;
  });

  const handleCopySha = (sha: string, id: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="max-w-3xl mb-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Verifiable Ledger & Artifacts</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
              Evidence & Artifact Library
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Every system claim in this portfolio is substantiated by verifiable technical artifacts, reproducible code scripts, architectural specifications, and cryptographic hashes.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-4 mb-8 shadow-xs space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search artifacts by title, SHA-256 hash, or project name..."
                className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-low border border-border text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-hidden focus:border-primary font-mono transition-colors"
              />
            </div>

            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-on-surface-variant uppercase">Access Level:</span>
                {["All", "Public", "Restricted", "Redacted"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setAccessFilter(level)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                      accessFilter === level
                        ? "bg-primary text-white font-medium"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <span className="font-mono text-xs text-on-surface-variant">
                {filteredEvidence.length} Attested Artifacts
              </span>
            </div>
          </div>

          {/* Evidence Grid */}
          <div className="space-y-4">
            {filteredEvidence.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest border border-border rounded-xl p-6 hover:border-primary transition-all shadow-xs space-y-4 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={item.access} type="evidence" />
                    <span className="font-mono text-xs text-primary font-medium px-2 py-0.5 rounded bg-primary/10">
                      {item.type}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">
                      {item.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-on-surface-variant">Attribution:</span>
                    <Link
                      href={`/projects/${item.projectSlug}`}
                      className="font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>{item.projectName}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed max-w-3xl">
                    {item.description}
                  </p>
                </div>

                {/* Cryptographic SHA-256 Box */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-3 rounded-lg border border-border/60">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-mono text-[11px] text-on-surface-variant uppercase shrink-0">SHA-256:</span>
                    <code className="font-mono text-[11px] text-on-surface truncate select-all">
                      {item.sha256}
                    </code>
                  </div>

                  <button
                    onClick={() => handleCopySha(item.sha256, item.id)}
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded bg-surface-container-lowest border border-border text-[11px] font-mono hover:border-primary transition-colors shrink-0"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-on-surface-variant" />
                        <span>Copy Hash</span>
                      </>
                    )}
                  </button>
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
