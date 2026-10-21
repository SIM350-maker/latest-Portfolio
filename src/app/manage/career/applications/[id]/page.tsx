"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { CMSLayout } from "@/components/CMSLayout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  Bot,
  FileText,
  FolderOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Send,
  RefreshCw,
  Mail,
  Briefcase,
  Package,
  ShieldCheck,
} from "lucide-react";

interface JobApplication {
  id: number;
  owner_id: number;
  advert_id: number;
  status: string;
  mode: string;
  created_at: string;
  updated_at: string;
}

interface JobAdvert {
  id: number;
  status: string;
  extracted_json: Record<string, any>;
}

interface GeneratedDocument {
  id: number;
  type: string;
  title: string;
  version: number;
  status: string;
  updated_at: string;
}

interface ApplicationPackage {
  id: number;
  status: string;
  recipient_email?: string;
  subject?: string;
}

function ApplicationDetailContent({ id }: { id: number }) {
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [advert, setAdvert] = useState<JobAdvert | null>(null);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [pkg, setPkg] = useState<ApplicationPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/career/applications?limit=100");
      if (!res.ok) throw new Error("Failed to load application");
      const data = await res.json();
      const app: JobApplication | undefined = (data.applications || []).find(
        (a: JobApplication) => a.id === id
      );
      if (!app) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setApplication(app);

      const advertData: JobAdvert | undefined = data.adverts?.[app.advert_id];
      if (advertData) setAdvert(advertData);

      const [docsRes, pkgRes] = await Promise.all([
        fetch(`/api/career/adverts/${app.advert_id}/documents`),
        fetch(`/api/career/adverts/${app.advert_id}/package`),
      ]);
      if (docsRes.ok) {
        const docsJson = await docsRes.json();
        setDocuments(docsJson.documents || []);
      }
      if (pkgRes.ok) {
        const pkgJson = await pkgRes.json();
        setPkg(pkgJson.package || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleModeToggle = async () => {
    if (!application) return;
    setActionBusy("mode");
    setError(null);
    setStatusMessage(null);
    try {
      const nextMode = application.mode === "AUTOMATED" ? "MANUAL" : "AUTOMATED";
      const res = await fetch("/api/career/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: application.id, mode: nextMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update mode");
      setApplication(data.application);
      setStatusMessage(`Mode switched to ${nextMode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update mode");
    } finally {
      setActionBusy(null);
    }
  };

  const handlePackageAction = async (action: string) => {
    if (!application) return;
    setActionBusy(action);
    setError(null);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/career/adverts/${application.advert_id}/package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Package action failed");
      if (data.package) setPkg(data.package);
      setStatusMessage(
        action === "approve" ? "Package approved" : `Package ${action.replace("_", " ")} completed`
      );
      if (action === "validate" && data.validation) {
        setStatusMessage(data.validation.valid ? "Package is valid" : "Package has validation issues");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Package action failed");
    } finally {
      setActionBusy(null);
    }
  };

  const handleSend = async () => {
    if (!application) return;
    setActionBusy("send");
    setError(null);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/career/adverts/${application.advert_id}/package/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testMode: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send package");
      setStatusMessage(
        data.simulated ? "Package sent in simulated mode" : "Package sent successfully"
      );
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send package");
    } finally {
      setActionBusy(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-label="Loading application" />
      </div>
    );
  }

  if (notFound || !application) {
    return (
      <div className="space-y-6">
        <Link
          href="/manage/career/applications"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applications</span>
        </Link>
        <div className="bg-surface-container-lowest border border-border rounded-xl p-12 text-center text-sm text-on-surface-variant">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-on-surface-variant/40" />
          <p className="font-semibold text-on-surface">Application not found</p>
          <p className="mt-1 text-xs font-mono">It may have been removed or archived</p>
        </div>
      </div>
    );
  }

  const extracted = advert?.extracted_json || {};
  const positionTitle = extracted.title || "Untitled Position";
  const pkgStatus = pkg?.status?.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/manage/career/applications"
            aria-label="Back to Applications"
            className="p-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface truncate">{positionTitle}</h1>
            <p className="text-xs text-on-surface-variant font-mono truncate">
              Application #{application.id}
              {extracted.employer ? ` — ${extracted.employer}` : ""} · {application.mode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <StatusBadge status={application.status} type="publication" />
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-border bg-surface-container-lowest text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <Link
            href={`/manage/career/builder?application=${application.id}`}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Open Builder</span>
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
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents */}
          <section aria-labelledby="documents-heading" className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <h2 id="documents-heading" className="text-sm font-bold text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Generated Documents
              </h2>
              <span className="text-xs font-mono text-on-surface-variant">{documents.length} total</span>
            </div>
            {documents.length === 0 ? (
              <div className="p-10 text-center text-sm text-on-surface-variant">
                <Bot className="w-10 h-10 mx-auto mb-3 text-on-surface-variant/40" />
                <p>No documents generated yet</p>
                <Link
                  href={`/manage/career/builder?application=${application.id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Build documents with AI</span>
                </Link>
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
          </section>

          {/* Package */}
          <section aria-labelledby="package-heading" className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <h2 id="package-heading" className="text-sm font-bold text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Application Package
              </h2>
              {pkg && <StatusBadge status={pkg.status} type="publication" />}
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              {!pkg ? (
                <p className="text-xs font-mono text-on-surface-variant">
                  No package assembled yet. Generate documents in the builder, then assemble them into an application package.
                </p>
              ) : (
                <div className="space-y-2 text-xs font-mono">
                  {pkg.recipient_email && (
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span className="text-on-surface">{pkg.recipient_email}</span>
                    </div>
                  )}
                  {pkg.subject && (
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span className="text-on-surface">{pkg.subject}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePackageAction("validate")}
                  disabled={actionBusy !== null || !pkg}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-border bg-surface-container-lowest text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Validate</span>
                </button>
                <button
                  onClick={() => handlePackageAction("approve")}
                  disabled={actionBusy !== null || !pkg || pkgStatus === "approved" || pkgStatus === "sent"}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={handleSend}
                  disabled={actionBusy !== null || !pkg || pkgStatus !== "approved"}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionBusy === "send" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Package</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right: metadata & quick actions */}
        <div className="space-y-4">
          <section aria-labelledby="meta-heading" className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-4">
            <h2 id="meta-heading" className="text-sm font-bold text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Application Details
            </h2>
            <dl className="space-y-2 text-xs font-mono">
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Status</dt>
                <dd><StatusBadge status={application.status} type="publication" /></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Mode</dt>
                <dd className="text-on-surface font-semibold">{application.mode}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Created</dt>
                <dd className="text-on-surface">{formatDate(application.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Updated</dt>
                <dd className="text-on-surface">{formatDate(application.updated_at)}</dd>
              </div>
            </dl>
            <button
              onClick={handleModeToggle}
              disabled={actionBusy !== null}
              aria-label={`Switch mode from ${application.mode} to ${application.mode === "AUTOMATED" ? "MANUAL" : "AUTOMATED"}`}
              className="w-full h-9 px-3.5 rounded border border-border bg-surface-container text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors cursor-pointer disabled:opacity-50"
            >
              Switch to {application.mode === "AUTOMATED" ? "Manual" : "Automated"} Mode
            </button>
          </section>

          <section aria-labelledby="quick-heading" className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-2">
            <h2 id="quick-heading" className="text-sm font-bold text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              Quick Actions
            </h2>
            <Link
              href={`/manage/career/adverts/${application.advert_id}`}
              className="block p-3 rounded-lg bg-surface-container-low border border-border hover:bg-surface-container transition-colors flex items-center gap-3"
            >
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <div className="font-semibold text-xs text-on-surface">View Job Advert</div>
                <div className="text-[10px] text-on-surface-variant font-mono">Analysis & requirements</div>
              </div>
            </Link>
            <Link
              href={`/manage/career/builder?advert=${application.advert_id}`}
              className="block p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors flex items-center gap-3"
            >
              <Bot className="w-5 h-5 text-primary" />
              <div>
                <div className="font-semibold text-xs text-on-surface">Build Documents</div>
                <div className="text-[10px] text-on-surface-variant font-mono">CV, cover letter & email</div>
              </div>
            </Link>
            <Link
              href="/manage/career/applications"
              className="block p-3 rounded-lg bg-surface-container-low border border-border hover:bg-surface-container transition-colors flex items-center gap-3"
            >
              <Send className="w-5 h-5 text-primary" />
              <div>
                <div className="font-semibold text-xs text-on-surface">All Applications</div>
                <div className="text-[10px] text-on-surface-variant font-mono">Review pipeline</div>
              </div>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const parsedId = parseInt(id, 10);

  return (
    <CMSLayout>
      {Number.isNaN(parsedId) ? (
        <div role="alert" className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 text-xs font-mono text-red-600">
          Invalid application ID
        </div>
      ) : (
        <ApplicationDetailContent id={parsedId} />
      )}
    </CMSLayout>
  );
}
