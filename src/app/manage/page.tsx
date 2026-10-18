"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { CMSLayout } from "@/components/CMSLayout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  FolderGit2,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Plus,
  UploadCloud,
  FileBadge2,
  UserCheck,
  ArrowRight,
  ExternalLink,
  Lock,
  GitCommit,
  Check,
  X
} from "lucide-react";

export default function CMSDashboardPage() {
  const { profile, projects, evidence, skills } = usePortfolio();
  const [showGpgModal, setShowGpgModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);

  const handleSimulateGpgSign = (e: React.FormEvent) => {
    e.preventDefault();
    setSigning(true);
    setTimeout(() => {
      setSigning(false);
      setSignedSuccess(true);
      setTimeout(() => {
        setSignedSuccess(false);
        setShowGpgModal(false);
      }, 1800);
    }, 1200);
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        
        {/* Top Header & Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Administrative Control Console
            </h1>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Portfolio & Evidence Ledger Staging Workspace · Active Node: Nairobi-East-01
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/manage/projects/new"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </Link>

            <button
              onClick={() => setShowGpgModal(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-border bg-surface-container-lowest text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>GPG Sign & Deploy</span>
            </button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-on-surface-variant">Indexed Projects</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface font-mono">{projects.length}</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {projects.filter((p) => p.status === "Published").length} Live
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono">
              All records validated with case studies
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-on-surface-variant">Evidence Proofs</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface font-mono">{evidence.length}</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">100% SHA256</span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono">
              Immutable cryptographic ledger
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-on-surface-variant">Runtime Telemetry</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface font-mono">{profile.latencyAvg}</span>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">{profile.uptime}</span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono">
              Zero query timeouts reported
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-on-surface-variant">Staging Invariants</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">4 / 4</span>
              <span className="text-[11px] font-mono text-on-surface-variant">Passing</span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono">
              Zero schema discrepancies
            </p>
          </div>

        </div>

        {/* Content Management Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Quick Project Catalog Table */}
          <div className="lg:col-span-8 bg-surface-container-lowest border border-border rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-on-surface uppercase tracking-wide font-mono">
                  Active Projects Staging Ledger
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Edit, preview, or update publication status across live routes.
                </p>
              </div>

              <Link
                href="/manage/projects"
                className="font-mono text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Full manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-on-surface-variant text-[11px]">
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Access</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-3">
                        <Link
                          href={`/manage/projects/${project.id}`}
                          className="font-bold text-on-surface hover:text-primary transition-colors block truncate max-w-[220px]"
                        >
                          {project.title}
                        </Link>
                        <span className="text-[10px] text-on-surface-variant">{project.slug}</span>
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant">{project.category}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={project.status} type="publication" />
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={project.evidenceAccess} type="evidence" />
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <Link
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          className="text-primary hover:underline"
                          title="View live case study"
                        >
                          View
                        </Link>
                        <Link
                          href={`/manage/projects/${project.id}`}
                          className="text-on-surface-variant hover:text-on-surface"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions & Content Health Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Content Health Card */}
            <div className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-xs font-bold text-on-surface uppercase">Content Health</span>
                <span className="font-mono text-xs text-emerald-600 font-bold">100% HEALTHY</span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex justify-between text-on-surface-variant text-[11px]">
                    <span>Projects with Case Studies</span>
                    <span className="text-on-surface font-semibold">6 / 6</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="w-full h-full bg-emerald-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-on-surface-variant text-[11px]">
                    <span>Attested Proof Hashes</span>
                    <span className="text-on-surface font-semibold">100%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="w-full h-full bg-primary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-on-surface-variant text-[11px]">
                    <span>WCAG 2.2 AA Contrast Compliance</span>
                    <span className="text-on-surface font-semibold">Passed</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div className="w-full h-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-3 shadow-xs">
              <span className="font-mono text-xs font-bold text-on-surface uppercase block">Quick CMS Portals</span>
              <div className="space-y-1.5">
                <Link
                  href="/manage/profile"
                  className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-xs font-mono transition-colors"
                >
                  <span className="text-on-surface">Edit Profile & Bio Copy</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </Link>

                <Link
                  href="/manage/evidence"
                  className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-xs font-mono transition-colors"
                >
                  <span className="text-on-surface">Register Evidence Item</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </Link>

                <Link
                  href="/manage/skills"
                  className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-xs font-mono transition-colors"
                >
                  <span className="text-on-surface">Configure Skills & Stacks</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </Link>

                <Link
                  href="/manage/activity"
                  className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-between text-xs font-mono transition-colors"
                >
                  <span className="text-on-surface">Audit Log & History</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* GPG Production Promotion Modal - Stitch Screen 2b5490b4c2c345299a8b5d860abbc974 */}
      {showGpgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest border border-border rounded-xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">Cryptographic Production Promotion</h3>
              </div>
              <button onClick={() => setShowGpgModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>

            {signedSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-on-surface">GPG Signature Attested</h4>
                <p className="text-xs text-on-surface-variant font-mono">
                  Staging promoted to production edge CDN successfully.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSimulateGpgSign} className="space-y-4 text-xs font-mono">
                <p className="text-on-surface-variant leading-relaxed">
                  Enter your signing passphrase to attest the staged manifest and promote all updated project entities to the live CDN.
                </p>

                <div className="p-3 bg-surface-container-low rounded border border-border text-[11px] text-on-surface-variant space-y-1">
                  <div>Signing Key: 0x4D76FD... (Simon Ipara / Master)</div>
                  <div>Digest: SHA-256 / Merkle Ledger v2.4</div>
                </div>

                <div className="space-y-1">
                  <label className="text-on-surface block font-semibold">Passphrase</label>
                  <input
                    type="password"
                    defaultValue="••••••••••••"
                    required
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGpgModal(false)}
                    className="px-3 py-1.5 rounded border border-border text-on-surface-variant hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={signing}
                    className="px-4 py-1.5 rounded bg-primary text-white font-semibold hover:bg-tertiary transition-colors disabled:opacity-50"
                  >
                    {signing ? "Signing & Syncing..." : "Attest & Deploy"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </CMSLayout>
  );
}
