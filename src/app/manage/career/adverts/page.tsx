"use client";

import React, { useState, useEffect } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  FileText,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Search,
  Filter,
  Download,
  Bot,
  ArrowLeft,
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

export default function AdvertsListPage() {
  const [adverts, setAdverts] = useState<JobAdvert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAdverts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/career/adverts?limit=100");
      if (!res.ok) throw new Error("Failed to fetch adverts");
      const data = await res.json();
      setAdverts(data.adverts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdverts();
  }, []);

  const filteredAdverts = adverts.filter(advert => {
    const matchesSearch = !searchTerm ||
      (advert.extracted_json?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       advert.extracted_json?.employer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       advert.raw_text.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || advert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = [...new Set(adverts.map(a => a.status))].sort();

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const truncate = (text: string, max = 100) => text.length > max ? text.slice(0, max) + '…' : text;

  return (
    <CMSLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/manage/career" className="p-2 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-on-surface">Job Adverts</h1>
              <p className="text-xs text-on-surface-variant font-mono">Import, analyse, and manage vacancy records</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={fetchAdverts} disabled={loading} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-border bg-surface-container-lowest text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link href="/manage/career/adverts/new" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs">
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
              placeholder="Search by title, employer, or content…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs font-mono text-on-surface-variant">Status:</label>
            <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
              <option value="all">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>

        {/* Adverts Table */}
        <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mx-auto animate-spin">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              </div>
              <p className="mt-3 text-sm text-on-surface-variant font-mono">Loading adverts…</p>
            </div>
          ) : filteredAdverts.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              <FileText className="w-12 h-12 mx-auto mb-3 text-on-surface-variant/40" />
              <p>{adverts.length === 0 ? "No job adverts imported yet" : "No adverts match the current filter"}</p>
              {adverts.length === 0 && (
                <Link href="/manage/career/adverts/new" className="mt-3 inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import your first advert</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-on-surface-variant text-[11px]">
                    <th className="py-3 px-4">Position / Employer</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAdverts.map(advert => {
                    const extracted = advert.extracted_json;
                    const deadline = extracted?.deadline ? new Date(extracted.deadline).toLocaleDateString('en-GB') : '—';
                    return (
                      <tr key={advert.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-on-surface truncate max-w-[350px]">
                            {extracted?.title || 'Untitled Position'}
                          </div>
                          <div className="text-[10px] text-on-surface-variant truncate max-w-[350px]">
                            {extracted?.employer || 'Unknown employer'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            advert.source === 'pdf' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                            advert.source === 'image' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
                            'bg-gray-500/10 text-gray-600 border border-gray-500/20'
                          }`}>
                            {advert.source}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={advert.status} type="publication" />
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant text-[11px]">{deadline}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{formatDate(advert.created_at)}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Link href={`/manage/career/adverts/${advert.id}`} className="text-primary hover:underline" title="View & analyse">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link href={`/manage/career/builder?advert=${advert.id}`} className="text-on-surface-variant hover:text-on-surface" title="Build documents">
                            <Bot className="w-3.5 h-3.5" />
                          </Link>
                          <Link href={`/manage/career/applications?advert=${advert.id}`} className="text-on-surface-variant hover:text-on-surface" title="Manage application">
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
    </CMSLayout>
  );
}