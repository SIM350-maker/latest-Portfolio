"use client";

import React, { useState, useEffect, Suspense } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowLeft,
  Edit,
  Bot,
  RefreshCw,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Mail,
  Calendar,
  MapPin,
  Briefcase,
  Award,
  Code,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface JobAdvert {
  id: number;
  source: string;
  original_filename: string | null;
  status: string;
  raw_text: string;
  extracted_json: Record<string, any>;
  analysis_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface JobRequirement {
  id: number;
  category: string;
  requirement_text: string;
  is_mandatory: boolean;
  confidence: number;
}

export default function AdvertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [advert, setAdvert] = useState<JobAdvert | null>(null);
  const [requirements, setRequirements] = useState<JobRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['vacancy', 'requirements']));

  useEffect(() => {
    fetchData();
  }, [params]);

  const fetchData = async () => {
    const { id } = await params;
    try {
      setLoading(true);
      setError(null);
      const [advertRes, reqsRes] = await Promise.all([
        fetch(`/api/career/adverts/${id}`),
        fetch(`/api/career/adverts/${id}/requirements`),
      ]);

      if (!advertRes.ok) throw new Error("Failed to fetch advert");
      const advertData = await advertRes.json();
      setAdvert(advertData.advert);

      if (reqsRes.ok) {
        const reqsData = await reqsRes.json();
        setRequirements(reqsData.requirements || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!advert) return;
    setReanalyzing(true);
    try {
      const res = await fetch(`/api/career/adverts/${advert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: advert.raw_text, action: 'reanalyze' }),
      });
      if (!res.ok) throw new Error("Re-analysis failed");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Re-analysis failed");
    } finally {
      setReanalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!advert || !confirm("Delete this job advert and all associated data?")) return;
    try {
      const res = await fetch(`/api/career/adverts/${advert.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      window.location.href = "/manage/career/adverts";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'technical_skill': return <Code className="w-3.5 h-3.5" />;
      case 'qualification': return <Award className="w-3.5 h-3.5" />;
      case 'experience': return <Briefcase className="w-3.5 h-3.5" />;
      case 'certification': return <Award className="w-3.5 h-3.5" />;
      case 'responsibility': return <ClipboardList className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const categoryLabel = (cat: string) => cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

  const mandatoryBadge = (mandatory: boolean) => mandatory ? (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/10 text-red-600 border border-red-500/20">Required</span>
  ) : (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">Preferred</span>
  );

  if (loading) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white animate-spin">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </CMSLayout>
    );
  }

  if (error || !advert) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center h-64 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold">Unable to Load Advert</h2>
          <p className="text-sm text-on-surface-variant">{error}</p>
        </div>
      </CMSLayout>
    );
  }

  const extracted = advert.extracted_json;
  const analysis = advert.analysis_json;

  return (
    <CMSLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/manage/career/adverts" className="p-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-on-surface">
                  {extracted?.title || 'Untitled Position'}
                </h1>
                <StatusBadge status={advert.status} type="publication" />
              </div>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                {extracted?.employer || 'Unknown employer'} · {advert.source.toUpperCase()} · {formatDate(advert.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href={`/manage/career/builder?advert=${advert.id}`} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors">
              <Bot className="w-3.5 h-3.5" />
              <span>Build Documents</span>
            </Link>
            <button onClick={handleReanalyze} disabled={reanalyzing} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-border bg-surface-container-lowest text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
              <span>Re-analyse</span>
            </button>
            <button onClick={handleDelete} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-red-500/30 bg-red-500/10 text-red-600 text-xs font-mono font-medium hover:bg-red-500/20 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Vacancy Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Vacancy Info */}
          <div className="lg:col-span-2 space-y-6">
            <CollapsibleSection title="Vacancy Details" icon={<FileText className="w-4 h-4" />} defaultOpen id="vacancy" expanded={expandedSections} setExpanded={setExpandedSections}>
              <div className="space-y-4">
                {extracted?.employer && (
                  <DetailRow label="Employer" value={extracted.employer} icon={<Briefcase className="w-4 h-4" />} copyable />
                )}
                {extracted?.department && (
                  <DetailRow label="Department" value={extracted.department} icon={<FolderOpen className="w-4 h-4" />} />
                )}
                {extracted?.location && (
                  <DetailRow label="Location" value={extracted.location} icon={<MapPin className="w-4 h-4" />} />
                )}
                {extracted?.work_arrangement && (
                  <DetailRow label="Work Arrangement" value={extracted.work_arrangement.charAt(0).toUpperCase() + extracted.work_arrangement.slice(1)} icon={<MapPin className="w-4 h-4" />} />
                )}
                {extracted?.employment_type && (
                  <DetailRow label="Employment Type" value={extracted.employment_type.replace('-', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} icon={<Briefcase className="w-4 h-4" />} />
                )}
                {extracted?.reference_number && (
                  <DetailRow label="Reference" value={extracted.reference_number} icon={<FileText className="w-4 h-4" />} copyable />
                )}
                {extracted?.deadline && (
                  <DetailRow label="Deadline" value={new Date(extracted.deadline).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} icon={<Calendar className="w-4 h-4" />} />
                )}
                {extracted?.hiring_manager && (
                  <DetailRow label="Hiring Manager" value={extracted.hiring_manager} icon={<User className="w-4 h-4" />} />
                )}
                {extracted?.recruitment_email && (
                  <DetailRow label="Recruitment Email" value={extracted.recruitment_email} icon={<Mail className="w-4 h-4" />} copyable isEmail />
                )}
              </div>
            </CollapsibleSection>

            {extracted?.description && (
              <CollapsibleSection title="Job Description" icon={<FileText className="w-4 h-4" />} defaultOpen id="description" expanded={expandedSections} setExpanded={setExpandedSections}>
                <div className="prose prose-sm text-on-surface-variant whitespace-pre-wrap bg-surface-container-lowest p-4 rounded-lg border border-border max-h-96 overflow-auto">
                  {extracted.description}
                </div>
              </CollapsibleSection>
            )}

            {extracted?.application_instructions && (
              <CollapsibleSection title="Application Instructions" icon={<ClipboardList className="w-4 h-4" />} id="instructions" expanded={expandedSections} setExpanded={setExpandedSections}>
                <div className="prose prose-sm text-on-surface-variant whitespace-pre-wrap bg-surface-container-lowest p-4 rounded-lg border border-border">
                  {extracted.application_instructions}
                </div>
              </CollapsibleSection>
            )}

            {/* Requirements Table */}
            <CollapsibleSection title={`Extracted Requirements (${requirements.length})`} icon={<ClipboardList className="w-4 h-4" />} defaultOpen id="requirements" expanded={expandedSections} setExpanded={setExpandedSections}>
              {requirements.length === 0 ? (
                <p className="text-sm text-on-surface-variant py-4">No requirements extracted. Click "Re-analyse" to try again.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs font-mono uppercase text-on-surface-variant">
                        <th className="px-4 py-2 text-left">#</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-left">Requirement</th>
                        <th className="px-4 py-2 text-center">Type</th>
                        <th className="px-4 py-2 text-center">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.map((req, idx) => (
                        <tr key={req.id} className="border-b border-border/60 hover:bg-surface-container-low/50">
                          <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                              {categoryIcon(req.category)}
                              {categoryLabel(req.category)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-on-surface max-w-md">{req.requirement_text}</td>
                          <td className="px-4 py-3 text-center">{mandatoryBadge(req.is_mandatory)}</td>
                          <td className="px-4 py-3 text-center text-xs font-mono">
                            <span className={`px-2 py-0.5 rounded ${req.confidence >= 0.9 ? 'bg-emerald-500/10 text-emerald-600' : req.confidence >= 0.7 ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>
                              {Math.round(req.confidence * 100)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CollapsibleSection>

            {/* Raw Text */}
            <CollapsibleSection title="Original Advert Text" icon={<Eye className="w-4 h-4" />} id="raw" expanded={expandedSections} setExpanded={setExpandedSections}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-on-surface-variant font-mono">{advert.raw_text.length} characters</span>
                <button onClick={() => copyText(advert.raw_text)} className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="bg-surface-container-lowest p-4 rounded-lg border border-border max-h-96 overflow-auto text-xs font-mono text-on-surface-variant whitespace-pre-wrap">
                {advert.raw_text}
              </pre>
            </CollapsibleSection>
          </div>

          {/* Right: Quick Actions & Metadata */}
          <div className="space-y-4">
            <div className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link href={`/manage/career/builder?advert=${advert.id}`} className="block p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors flex items-center gap-3">
                  <Bot className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-semibold text-xs text-on-surface">Build Application Package</div>
                    <div className="text-[10px] text-on-surface-variant font-mono">Generate CV, cover letter & email</div>
                  </div>
                </Link>
                <Link href={`/manage/career/applications?advert=${advert.id}`} className="block p-3 rounded-lg bg-surface-container-low border border-border hover:bg-surface-container transition-colors flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-semibold text-xs text-on-surface">Manage Application</div>
                    <div className="text-[10px] text-on-surface-variant font-mono">Review, approve & send</div>
                  </div>
                </Link>
                {extracted?.recruitment_email && (
                  <a href={`mailto:${extracted.recruitment_email}`} className="block p-3 rounded-lg bg-surface-container-low border border-border hover:bg-surface-container transition-colors flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-semibold text-xs text-on-surface">Email Recruiter</div>
                      <div className="text-[10px] text-on-surface-variant font-mono">{extracted.recruitment_email}</div>
                    </div>
                  </a>
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-3">
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Metadata
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <DetailRowSimple label="Source" value={advert.source} />
                {advert.original_filename && <DetailRowSimple label="Original File" value={advert.original_filename} />}
                <DetailRowSimple label="Created" value={formatDate(advert.created_at)} />
                <DetailRowSimple label="Updated" value={formatDate(advert.updated_at)} />
                <DetailRowSimple label="Text Length" value={`${advert.raw_text.length} chars`} />
                {analysis?.used_ai !== undefined && <DetailRowSimple label="AI Enhanced" value={analysis.used_ai ? 'Yes' : 'No'} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CMSLayout>
  );
}

function CollapsibleSection({ title, icon, defaultOpen, id, expanded, setExpanded, children }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; id: string;
  expanded: Set<string>; setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>;
  children: React.ReactNode;
}) {
  const isOpen = expanded.has(id) || (defaultOpen && !expanded.has(id));
  return (
    <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        })}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span className="font-semibold text-sm text-on-surface">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-on-surface-variant" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant" />}
      </button>
      {isOpen && <div className="border-t border-border p-4">{children}</div>}
    </div>
  );
}

function DetailRow({ label, value, icon, copyable, isEmail }: {
  label: string; value: string; icon: React.ReactNode; copyable?: boolean; isEmail?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-border/50">
      <span className="text-primary shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono uppercase text-on-surface-variant">{label}</div>
        <div className="text-sm text-on-surface truncate font-mono">{value}</div>
      </div>
      {copyable && (
        <button onClick={() => navigator.clipboard.writeText(value)} className="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors" title={isEmail ? "Copy email" : "Copy"}>
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function DetailRowSimple({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className="text-on-surface font-medium">{value}</span>
    </div>
  );
}

// Missing imports
import { FolderOpen, User, Info } from "lucide-react";