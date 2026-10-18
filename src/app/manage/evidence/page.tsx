"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { CMSLayout } from "@/components/CMSLayout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ShieldCheck,
  Plus,
  Search,
  Trash2,
  X,
  CheckCircle2,
  Lock,
  FileCode,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";

export default function CMSEvidencePage() {
  const { evidence, projects, addEvidence, deleteEvidence } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    title: "",
    slug: "",
    projectSlug: projects[0]?.slug || "healthcare-mis",
    projectName: projects[0]?.title || "Healthcare MIS",
    type: "Architecture RFC" as any,
    access: "Public" as any,
    sha256: "",
    description: "",
    date: "2026-10-17",
    verificationStatus: "VERIFIED" as any
  });

  const filtered = evidence.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.sha256.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title) return;

    const matchedProj = projects.find((p) => p.slug === newItem.projectSlug);
    const generatedSha =
      newItem.sha256 ||
      Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

    addEvidence({
      title: newItem.title,
      slug: newItem.slug || newItem.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      projectSlug: newItem.projectSlug,
      projectName: matchedProj?.title || newItem.projectName,
      type: newItem.type,
      access: newItem.access,
      sha256: generatedSha,
      description: newItem.description,
      date: newItem.date,
      verificationStatus: newItem.verificationStatus
    });

    setShowModal(false);
    setNewItem({
      title: "",
      slug: "",
      projectSlug: projects[0]?.slug || "healthcare-mis",
      projectName: projects[0]?.title || "Healthcare MIS",
      type: "Architecture RFC",
      access: "Public",
      sha256: "",
      description: "",
      date: "2026-10-17",
      verificationStatus: "VERIFIED"
    });
  };

  const handleCopySha = (sha: string, id: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Evidence & Artifacts Manager
            </h1>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Register cryptographic proof hashes, code repositories, test reports, and access classification tokens.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Evidence Item</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by artifact title, project, or SHA-256..."
              className="w-full h-9 pl-9 pr-4 rounded bg-surface-container-low border border-border text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-hidden focus:border-primary font-mono"
            />
          </div>

          <span className="font-mono text-xs text-on-surface-variant">
            {filtered.length} registered proofs
          </span>
        </div>

        {/* Evidence Table */}
        <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-surface-container-low text-on-surface-variant text-[11px] uppercase">
                  <th className="py-3 px-4">Artifact Title</th>
                  <th className="py-3 px-4">Project Scope</th>
                  <th className="py-3 px-4">Artifact Type</th>
                  <th className="py-3 px-4">Access Tier</th>
                  <th className="py-3 px-4">Cryptographic Hash</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-on-surface block max-w-xs truncate">{item.title}</span>
                      <span className="text-[10px] text-on-surface-variant">{item.date}</span>
                    </td>
                    <td className="py-3 px-4 text-primary font-medium">{item.projectName}</td>
                    <td className="py-3 px-4 text-on-surface-variant">{item.type}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.access} type="evidence" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <code className="text-[10px] text-on-surface-variant truncate max-w-[140px]">
                          {item.sha256}
                        </code>
                        <button
                          onClick={() => handleCopySha(item.sha256, item.id)}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant"
                          title="Copy SHA-256"
                        >
                          {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteEvidence(item.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 transition-colors"
                        title="Delete Evidence"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Registration & Access Classification Modal - Stitch Screen 73ba4d068c1c4a7e8fef36e392fca5bd */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-border rounded-xl shadow-2xl p-6 sm:p-8 space-y-5 text-xs font-mono">
            
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">Register Evidence & Access Classification</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-on-surface font-semibold block">Artifact Title *</label>
                <input
                  type="text"
                  required
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="e.g. PostgreSQL RLS Audit Trail Test Matrix"
                  className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-on-surface font-semibold block">Attributed Project</label>
                  <select
                    value={newItem.projectSlug}
                    onChange={(e) => setNewItem({ ...newItem, projectSlug: e.target.value })}
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                  >
                    {projects.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-on-surface font-semibold block">Artifact Type</label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                  >
                    <option>Architecture RFC</option>
                    <option>Benchmark Report</option>
                    <option>Code Repository</option>
                    <option>Test Suite</option>
                    <option>Schema Spec</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-on-surface font-semibold block">Access Classification</label>
                  <select
                    value={newItem.access}
                    onChange={(e) => setNewItem({ ...newItem, access: e.target.value as any })}
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                  >
                    <option value="Public">Public (Unrestricted)</option>
                    <option value="Restricted">Restricted (Under NDA)</option>
                    <option value="Redacted">Redacted (Purged Data)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-on-surface font-semibold block">Verification Status</label>
                  <select
                    value={newItem.verificationStatus}
                    onChange={(e) => setNewItem({ ...newItem, verificationStatus: e.target.value as any })}
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="ATTESTED">ATTESTED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-on-surface font-semibold block">Description & Scope</label>
                <textarea
                  rows={3}
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Detail what this proof demonstrates and operational boundaries..."
                  className="w-full p-2.5 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded border border-border text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-primary text-white font-semibold hover:bg-tertiary transition-colors"
                >
                  Register Proof
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </CMSLayout>
  );
}
