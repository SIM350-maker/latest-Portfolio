"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CMSLayout } from "@/components/CMSLayout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  Bot,
  FileText,
  Mail,
  FileType,
  Loader2,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Edit3,
  FolderOpen,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface JobAdvert {
  id: number;
  status: string;
  raw_text: string;
  extracted_json: Record<string, any>;
  created_at: string;
}

interface GeneratedDocument {
  id: number;
  application_id: number;
  type: "CV" | "COVER_LETTER" | "EMAIL" | "OTHER";
  title: string;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const DOC_TYPES = [
  {
    value: "CV" as const,
    label: "Generate CV",
    description: "Tailored CV matched to the vacancy requirements",
    icon: FileText,
  },
  {
    value: "COVER_LETTER" as const,
    label: "Generate Cover Letter",
    description: "Personalised cover letter referencing the role",
    icon: FileType,
  },
  {
    value: "EMAIL" as const,
    label: "Generate Email",
    description: "Application email draft for the recruiter",
    icon: Mail,
  },
];

function BuilderContent() {
  const searchParams = useSearchParams();
  const advertParam = searchParams.get("advert");
  const applicationParam = searchParams.get("application");

  const [adverts, setAdverts] = useState<JobAdvert[]>([]);
  const [advertId, setAdvertId] = useState<number | null>(advertParam ? parseInt(advertParam, 10) : null);
  const [advert, setAdvert] = useState<JobAdvert | null>(null);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  // Resolve application param -> advert_id, then load everything
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (!applicationParam) return;
      try {
        const res = await fetch("/api/career/applications?limit=100");
        if (!res.ok) throw new Error("Failed to load applications");
        const data = await res.json();
        if (cancelled) return;
        const app = (data.applications || []).find(
          (a: { id: number }) => a.id === parseInt(applicationParam, 10)
        );
        if (app) setAdvertId(app.advert_id);
        else setError("Application not found");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load application");
      }
    }
    resolve();
    return () => {
      cancelled = true;
    };
  }, [applicationParam]);

  // Load advert list (picker) when no advert selected; load advert + docs when selected
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        if (advertId) {
          const [advertRes, docsRes] = await Promise.all([
            fetch(`/api/career/adverts/${advertId}`),
            fetch(`/api/career/adverts/${advertId}/documents`),
          ]);
          if (!advertRes.ok) throw new Error("Failed to load job advert");
          if (cancelled) return;
          const advertData = await advertRes.json();
          setAdvert(advertData.advert);
          if (docsRes.ok) {
            const docsData = await docsRes.json();
            if (!cancelled) setDocuments(docsData.documents || []);
          } else {
            if (!cancelled) setDocuments([]);
          }
        } else {
          const res = await fetch("/api/career/adverts?limit=50");
          if (!res.ok) throw new Error("Failed to load job adverts");
          if (cancelled) return;
          const data = await res.json();
          setAdverts(data.adverts || []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [advertId]);

  const fetchDocuments = useCallback(async () => {
    if (!advertId) return;
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/career/adverts/${advertId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } finally {
      setLoadingDocs(false);
    }
  }, [advertId]);

  const handleGenerate = async (type: "CV" | "COVER_LETTER" | "EMAIL") => {
    if (!advertId) return;
    setGenerating(type);
    setError(null);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/career/adverts/${advertId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, regenerateAll: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setStatusMessage(`${type.replace("_", " ")} generated successfully`);
      await fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const extracted = advert?.extracted_json || {};
  const title = extracted.title || extracted.employer || "Untitled Advert";

  // ---------- No advert selected: picker ----------
  if (!advertId) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/manage/career"
              aria-label="Back to Career Centre"
              className="p-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">AI Document Builder</h1>
              <p className="text-xs text-on-surface-variant font-mono">
                Select a job advert to generate tailored application documents
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              Choose a Job Advert
            </h2>
            {loading ? (
              <p className="text-xs text-on-surface-variant mt-1 font-mono">Loading adverts…</p>
            ) : (
              <p className="text-xs text-on-surface-variant mt-0.5 font-mono">{adverts.length} available</p>
            )}
          </div>

          {error && (
            <div role="alert" className="p-4 flex items-center gap-2 text-xs font-mono text-red-600 bg-red-500/5 border-b border-border">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs font-mono text-on-surface-variant">Loading…</p>
            </div>
          ) : adverts.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              <FileText className="w-12 h-12 mx-auto mb-3 text-on-surface-variant/40" />
              <p>No job adverts imported yet</p>
              <Link
                href="/manage/career/adverts/new"
                className="mt-3 inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import your first advert</span>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {adverts.map((ad) => {
                const ext = ad.extracted_json || {};
                return (
                  <li key={ad.id}>
                    <button
                      onClick={() => setAdvertId(ad.id)}
                      className="w-full text-left p-4 hover:bg-surface-container-low/60 transition-colors flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      aria-label={`Build documents for ${ext.title || ext.employer || "Untitled Advert"}`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-on-surface truncate">
                          {ext.title || ext.employer || "Untitled Advert"}
                        </div>
                        <div className="text-xs text-on-surface-variant font-mono truncate">
                          {ext.employer || "Unknown employer"} · Imported {formatDate(ad.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={ad.status} type="publication" />
                        <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // ---------- Advert selected: builder ----------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/manage/career"
            aria-label="Back to Career Centre"
            className="p-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface truncate">AI Document Builder</h1>
            <p className="text-xs text-on-surface-variant font-mono truncate">
              {title}
              {extracted.employer && extracted.title ? ` — ${extracted.employer}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchDocuments}
            disabled={loadingDocs}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-border bg-surface-container-lowest text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDocs ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href={`/manage/career/applications?advert=${advertId}`}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Manage Application</span>
          </Link>
        </div>
      </div>

      {/* Status region */}
      <div aria-live="polite" role="status" className="sr-only">
        {statusMessage || error || ""}
      </div>
      {statusMessage && (
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-center gap-2 text-xs font-mono text-red-600 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generate actions */}
        <section className="lg:col-span-1 space-y-4" aria-labelledby="generate-heading">
          <h2 id="generate-heading" className="text-sm font-bold text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Generate Documents
          </h2>
          {DOC_TYPES.map((docType) => {
            const Icon = docType.icon;
            const isGenerating = generating === docType.value;
            return (
              <button
                key={docType.value}
                onClick={() => handleGenerate(docType.value)}
                disabled={generating !== null}
                aria-busy={isGenerating}
                className="w-full p-4 rounded-xl border border-border bg-surface-container-lowest hover:bg-surface-container hover:border-primary/50 transition-colors text-left flex items-start gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-on-surface flex items-center gap-2">
                    {isGenerating ? "Generating…" : docType.label}
                  </div>
                  <p className="text-[11px] font-mono text-on-surface-variant mt-0.5">{docType.description}</p>
                </div>
              </button>
            );
          })}
          <p className="text-[11px] font-mono text-on-surface-variant leading-relaxed">
            Generation runs evidence matching against your verified records. Unverified claims are flagged for review.
          </p>
        </section>

        {/* Generated documents */}
        <section className="lg:col-span-2 space-y-4" aria-labelledby="documents-heading">
          <h2 id="documents-heading" className="text-sm font-bold text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Generated Documents
          </h2>
          <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
            {loadingDocs ? (
              <div className="p-12 flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-xs font-mono text-on-surface-variant">Loading documents…</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center text-sm text-on-surface-variant">
                <Bot className="w-12 h-12 mx-auto mb-3 text-on-surface-variant/40" />
                <p>No documents generated yet</p>
                <p className="mt-1 text-xs font-mono">Use the generate actions to create your first document</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {documents.map((doc) => (
                  <li key={doc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-surface-container-low/50 transition-colors">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-on-surface truncate">{doc.title}</div>
                      <div className="text-[11px] font-mono text-on-surface-variant">
                        {doc.type.replace("_", " ")} · v{doc.version} · Updated {formatDate(doc.updated_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={doc.status} type="publication" />
                      <Link
                        href={`/manage/career/documents/${doc.id}`}
                        aria-label={`Edit ${doc.title}`}
                        title="Edit document"
                        className="p-2 rounded text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/manage/career"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-border bg-surface-container-lowest text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Career Centre</span>
            </Link>
            <Link
              href="/manage/career/adverts"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-border bg-surface-container-lowest text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Adverts</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <CMSLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-primary" aria-label="Loading builder" />
          </div>
        }
      >
        <BuilderContent />
      </Suspense>
    </CMSLayout>
  );
}
