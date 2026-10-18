"use client";

import React, { useState, useEffect } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import {
  FileBadge2,
  Plus,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Check
} from "lucide-react";

interface ClaimItem {
  id: string | number;
  statement: string;
  justification: string | null;
  source_entity_type: string | null;
  source_entity_id: number | string | null;
  publication_state: string;
  created_at: string;
  updated_at: string;
}

export default function ManageClaimsPage() {
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingClaim, setEditingClaim] = useState<ClaimItem | null>(null);
  const [isNewClaim, setIsNewClaim] = useState(false);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/claims");
      const data = await res.json();
      if (res.ok) {
        setClaims(data.claims || []);
      } else {
        setError(data.error || "Failed to load claims");
      }
    } catch {
      setError("Failed to fetch technical claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleToggleState = async (claim: ClaimItem) => {
    const nextState = claim.publication_state === "Published" ? "Draft" : "Published";
    try {
      const res = await fetch(`/api/claims/${claim.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publication_state: nextState }),
      });
      if (res.ok) {
        setSuccess(`Claim set to ${nextState}.`);
        setTimeout(() => setSuccess(null), 2500);
        fetchClaims();
      }
    } catch {
      setError("Failed to update claim state.");
    }
  };

  const handleDeleteClaim = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this technical invariant claim?")) return;
    try {
      const res = await fetch(`/api/claims/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Claim removed from ledger.");
        setTimeout(() => setSuccess(null), 2500);
        fetchClaims();
      }
    } catch {
      setError("Failed to delete claim.");
    }
  };

  const handleSaveClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClaim) return;

    try {
      const method = isNewClaim ? "POST" : "PUT";
      const url = isNewClaim ? "/api/claims" : `/api/claims/${editingClaim.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingClaim),
      });

      if (!res.ok) throw new Error();
      setSuccess(`Claim ${isNewClaim ? "added" : "updated"} successfully.`);
      setEditingClaim(null);
      setTimeout(() => setSuccess(null), 2500);
      fetchClaims();
    } catch {
      setError("Failed to save claim.");
    }
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <FileBadge2 className="w-4 h-4" />
              <span>Attested Architecture Invariants</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Technical Claims & Proofs Ledger
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Cryptographically backed architectural assertions, engineering invariants, and formal system claims.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingClaim({
                  id: "",
                  statement: "",
                  justification: "",
                  source_entity_type: null,
                  source_entity_id: null,
                  publication_state: "Published",
                  created_at: "",
                  updated_at: "",
                });
                setIsNewClaim(true);
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assert New Claim</span>
            </button>
            <button
              onClick={fetchClaims}
              className="p-2 rounded border border-border bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-xs font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Claims List */}
        <div className="space-y-3">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="bg-surface-container-lowest border border-border rounded-xl p-5 shadow-xs space-y-3 hover:border-border/80 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-primary font-semibold">
                      CLAIM-#{claim.id}
                    </span>
                    <button
                      onClick={() => handleToggleState(claim)}
                      className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                        claim.publication_state === "Published"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {claim.publication_state.toUpperCase()}
                    </button>
                  </div>
                  <h3 className="font-bold text-sm text-on-surface leading-snug">
                    {claim.statement}
                  </h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingClaim(claim);
                      setIsNewClaim(false);
                    }}
                    className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    title="Edit claim"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClaim(claim.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete claim"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {claim.justification && (
                <div className="p-3 rounded bg-surface-container-low border border-border/40 text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-mono text-[10px] uppercase text-on-surface block font-bold mb-1">
                    Proof & Formal Justification:
                  </span>
                  <span>{claim.justification}</span>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* EDIT / CREATE MODAL */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileBadge2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">
                  {isNewClaim ? "Assert Technical Claim" : "Edit Invariant Claim"}
                </h3>
              </div>
              <button
                onClick={() => setEditingClaim(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClaim} className="space-y-3 font-sans">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Claim Statement</label>
                <textarea
                  rows={2}
                  required
                  value={editingClaim.statement}
                  onChange={(e) => setEditingClaim({ ...editingClaim, statement: e.target.value })}
                  placeholder="e.g. PostgreSQL Row-Level Security isolates multi-tenant records at engine level"
                  className="w-full p-2.5 rounded bg-surface-container-low border border-border text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Justification / Verification Proof</label>
                <textarea
                  rows={3}
                  value={editingClaim.justification || ""}
                  onChange={(e) => setEditingClaim({ ...editingClaim, justification: e.target.value })}
                  placeholder="Explain why this invariant holds true, referencing policies, benchmarks, or architectural proofs..."
                  className="w-full p-2.5 rounded bg-surface-container-low border border-border text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Publication State</label>
                <select
                  value={editingClaim.publication_state}
                  onChange={(e) => setEditingClaim({ ...editingClaim, publication_state: e.target.value })}
                  className="w-full h-9 px-2.5 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setEditingClaim(null)}
                  className="px-3 h-8 rounded border border-border bg-surface-container hover:bg-surface-container-high text-xs text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-8 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors cursor-pointer"
                >
                  Save Invariant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </CMSLayout>
  );
}
