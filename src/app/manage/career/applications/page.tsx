"use client";

import React, { useState, useEffect, Suspense } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Eye,
  Bot,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  FolderOpen,
  Plus,
  ChevronRight,
  Search,
} from "lucide-react";
import Link from "next/link";

interface JobApplication {
  id: number;
  advert_id: number;
  status: string;
  mode: string;
  created_at: string;
  updated_at: string;
}

interface JobAdvert {
  id: number;
  extracted_json: Record<string, any>;
}

function ApplicationsListContent() {
  const searchParams = useSearchParams();
  const advertFilter = searchParams.get('advert');

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [advertsMap, setAdvertsMap] = useState<Map<number, JobAdvert>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = advertFilter ? `/api/career/applications?advert_id=${advertFilter}` : "/api/career/applications";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch applications");
      const data = await res.json();
      setApplications(data.applications || []);

      const map = new Map<number, JobAdvert>();
      if (data.adverts) {
        for (const [id, advert] of Object.entries(data.adverts)) {
          map.set(parseInt(id), advert as JobAdvert);
        }
      }
      setAdvertsMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [advertFilter]);

  const filteredApps = applications.filter(app => {
    const advert = advertsMap.get(app.advert_id);
    const title = advert?.extracted_json?.title || "";
    const employer = advert?.extracted_json?.employer || "";
    const matchesSearch = !searchTerm ||
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = [...new Set(applications.map(a => a.status))].sort();

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT': case 'APPROVED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'READY_FOR_REVIEW': case 'DOCUMENTS_IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'FAILED': case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/manage/career" className="p-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              {advertFilter ? "Application for Selected Advert" : "Applications"}
            </h1>
            <p className="text-xs text-on-surface-variant font-mono">
              {applications.length} total · {filteredApps.length} shown
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={fetchData} disabled={loading} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-border bg-surface-container-lowest text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link href="/manage/career/adverts/new" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span>Import Advert</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by position or employer…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mx-auto animate-spin">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant font-mono">Loading applications…</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center text-sm text-on-surface-variant">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 text-on-surface-variant/40" />
            <p>{applications.length === 0 ? "No applications yet" : "No applications match the filter"}</p>
            <Link href="/manage/career/adverts/new" className="mt-3 inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline">
              <Plus className="w-3.5 h-3.5" />
              <span>Import a job advert to get started</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-on-surface-variant text-[11px]">
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Employer</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredApps.map(app => {
                  const advert = advertsMap.get(app.advert_id);
                  const extracted = advert?.extracted_json;
                  return (
                    <tr key={app.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(app.status)}
                          <div className="font-bold text-on-surface truncate max-w-[250px]">
                            {extracted?.title || 'Untitled Position'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">{extracted?.employer || 'Unknown'}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          app.mode === 'AUTOMATED' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-gray-500/10 text-gray-600 border border-gray-500/20'
                        }`}>{app.mode}</span>
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={app.status} type="publication" /></td>
                      <td className="py-3 px-4 text-on-surface-variant">{formatDate(app.updated_at)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link href={`/manage/career/applications/${app.id}`} className="text-primary hover:underline" title="Open">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link href={`/manage/career/builder?application=${app.id}`} className="text-on-surface-variant hover:text-on-surface" title="Build">
                          <Bot className="w-3.5 h-3.5" />
                        </Link>
                        <Link href={`/manage/career/adverts/${app.advert_id}`} className="text-on-surface-variant hover:text-on-surface" title="View Advert">
                          <FileText className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApplicationsListPage() {
  return (
    <CMSLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
        <ApplicationsListContent />
      </Suspense>
    </CMSLayout>
  );
}

import { Loader2 } from "lucide-react";