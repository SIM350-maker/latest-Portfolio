"use client";

import React, { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import { StatusBadge } from "@/components/StatusBadge";
import { Copy, Check, ExternalLink } from "lucide-react";

export default function EvidenceDetailClient({ slug }: { slug: string }) {
  const { evidence, projects } = usePortfolio();
  const [copied, setCopied] = useState(false);

  const item = evidence.find((e) => e.slug === slug);
  if (!item) {
    notFound();
  }

  const project = projects.find((p) => p.slug === item.projectSlug);

  const handleCopySha = () => {
    navigator.clipboard.writeText(item.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/evidence" className="hover:text-primary transition-colors">Evidence</Link>
            <span>/</span>
            <span className="text-on-surface font-semibold truncate">{item.title}</span>
          </div>

          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-10 space-y-6 shadow-xs">
            
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <StatusBadge status={item.access} type="evidence" />
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {item.type}
                </span>
              </div>
              <span className="font-mono text-xs text-on-surface-variant">Attested Date: {item.date}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                {item.title}
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* SHA Box */}
            <div className="bg-surface-container-low p-4 rounded-xl border border-border space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-on-surface-variant uppercase font-semibold">Cryptographic SHA-256 Digest</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.verificationStatus}</span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-surface-container-lowest p-2.5 rounded border border-border">
                <code className="font-mono text-xs text-on-surface truncate select-all">{item.sha256}</code>
                <button
                  onClick={handleCopySha}
                  className="px-2.5 py-1 rounded bg-surface-container border border-border text-[11px] font-mono hover:border-primary flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Linked Project info */}
            {project && (
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <span className="font-mono text-[11px] text-on-surface-variant block uppercase">Attributed Project</span>
                  <span className="font-bold text-sm text-on-surface">{project.title}</span>
                </div>
                <Link
                  href={`/projects/${project.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>View Project Case Study</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

          </div>

        </div>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}
