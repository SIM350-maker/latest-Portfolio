"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CMSLayout } from "@/components/CMSLayout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  LayoutDashboard,
  FileText,
  Bot,
  Send,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  FolderOpen,
  Eye,
  Edit,
  Trash2,
  Download,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

interface JobAdvert {
  id: number;
  source: string;
  original_filename: string | null;
  status: string;
  raw_text: string;
  extracted_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface JobApplication {
  id: number;
  advert_id: number;
  status: string;
  mode: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  totalApplications: number;
  awaitingReview: number;
  documentsGenerated: number;
  approvedPackages: number;
  sentApplications: number;
  failedDeliveries: number;
  upcomingDeadlines: number;
  recentAdverts: number;
}

export default function CareerDashboardPage() {
  const [adverts, setAdverts] = useState<JobAdvert[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [advertsRes, appsRes] = await Promise.all([
        fetch("/api/career/adverts?limit=20"),
        fetch("/api/career/applications?limit=20"),
      ]);

      if (!advertsRes.ok) throw new Error("Failed to fetch adverts");
      if (!appsRes.ok) throw new Error("Failed to fetch applications");

      const advertsData = await advertsRes.json();
      const appsData = await appsRes.json();

      setAdverts(advertsData.adverts || []);
      setApplications(appsData.applications || []);

      // Compute stats
      const totalApplications = appsData.applications?.length || 0;
      const awaitingReview = appsData.applications?.filter((a: JobApplication) => a.status === 'READY_FOR_REVIEW').length || 0;
      const approvedPackages = appsData.applications?.filter((a: JobApplication) => a.status === 'APPROVED').length || 0;
      const sentApplications = appsData.applications?.filter((a: JobApplication) => a.status === 'SENT').length || 0;
      const failedDeliveries = 0; // TODO: from email_delivery_attempt

      setStats({
        totalApplications,
        awaitingReview,
        documentsGenerated: 0, // TODO: from generated_document
        approvedPackages,
        sentApplications,
        failedDeliveries,
        upcomingDeadlines: 0, // TODO: from adverts with deadline
        recentAdverts: advertsData.adverts?.length || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': case 'SENT': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'READY_FOR_REVIEW': case 'DOCUMENTS_IN_PROGRESS': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'FAILED': case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'DRAFT': case 'IMPORTED': case 'ANALYZED': case 'MATCHED': return <FileText className="w-4 h-4 text-amber-500" />;
      default: return <FolderOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const truncate = (text: string, max = 80) => text.length > max ? text.slice(0, max) + '…' : text;

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

  return (
    <CMSLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Career Automation Centre
            </h1>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Intelligent document generation & application automation
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded border border-border bg-surface-container-lowest text-xs font-mono font-medium hover:border-primary text-on-surface transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link href="/manage/career/adverts/new" className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Import Advert</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            <StatCard icon={<LayoutDashboard className="w-5 h-5" />} label="Total Applications" value={stats.totalApplications} />
            <StatCard icon={<Clock className="w-5 h-5" />} label="Awaiting Review" value={stats.awaitingReview} color="blue" />
            <StatCard icon={<FileText className="w-5 h-5" />} label="Documents Generated" value={stats.documentsGenerated} color="purple" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Approved Packages" value={stats.approvedPackages} color="emerald" />
            <StatCard icon={<Send className="w-5 h-5" />} label="Applications Sent" value={stats.sentApplications} color="indigo" />
            <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Failed Deliveries" value={stats.failedDeliveries} color="red" />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Upcoming Deadlines" value={stats.upcomingDeadlines} color="amber" />
            <StatCard icon={<FileText className="w-5 h-5" />} label="Recent Adverts" value={stats.recentAdverts} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            icon={<FileText className="w-6 h-6" />}
            title="Import Job Advert"
            description="Paste text or upload PDF/image to create a new vacancy record"
            href="/manage/career/adverts/new"
            primary
          />
          <ActionCard
            icon={<Bot className="w-6 h-6" />}
            title="AI Document Builder"
            description="Generate tailored CV, cover letter & email from analysed requirements"
            href="/manage/career/builder"
          />
          <ActionCard
            icon={<Send className="w-6 h-6" />}
            title="Manage Applications"
            description="Review, edit, approve & send application packages"
            href="/manage/career/applications"
          />
          <ActionCard
            icon={<ExternalLink className="w-6 h-6" />}
            title="Qualifications Publisher"
            description="Publish verified qualifications to the public portfolio"
            href="/manage/academics"
          />
        </div>

        {/* Recent Job Adverts */}
        <section className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Recent Job Adverts
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">{adverts.length} most recent</p>
            </div>
            <Link href="/manage/career/adverts" className="font-mono text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {adverts.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              <FileText className="w-12 h-12 mx-auto mb-3 text-on-surface-variant/40" />
              <p>No job adverts imported yet</p>
              <Link href="/manage/career/adverts/new" className="mt-3 inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline">
                <Plus className="w-3.5 h-3.5" />
                <span>Import your first advert</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-on-surface-variant text-[11px]">
                    <th className="py-3 px-4">Advert</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {adverts.slice(0, 10).map((advert) => (
                    <tr key={advert.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-on-surface truncate max-w-[300px]">
                          {advert.extracted_json?.title || advert.extracted_json?.employer || 'Untitled Advert'}
                        </div>
                        <div className="text-[10px] text-on-surface-variant truncate max-w-[300px]">
                          {advert.extracted_json?.employer || 'Unknown employer'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant capitalize">{advert.source}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={advert.status} type="publication" />
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">{formatDate(advert.created_at)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link href={`/manage/career/adverts/${advert.id}`} className="text-primary hover:underline" title="View details">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link href={`/manage/career/builder?advert=${advert.id}`} className="text-on-surface-variant hover:text-on-surface" title="Build documents">
                          <Bot className="w-3.5 h-3.5" />
                        </Link>
                        <Link href={`/manage/career/applications?advert=${advert.id}`} className="text-on-surface-variant hover:text-on-surface" title="Manage application">
                          <FolderOpen className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Recent Applications */}
        <section className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-wide font-mono flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                Recent Applications
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">{applications.length} most recent</p>
            </div>
            <Link href="/manage/career/applications" className="font-mono text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="p-12 text-center text-sm text-on-surface-variant">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-on-surface-variant/40" />
              <p>No applications created yet</p>
              <p className="mt-1">Import a job advert to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-on-surface-variant text-[11px]">
                    <th className="py-3 px-4">Position</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Updated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {applications.slice(0, 10).map((app) => {
                    const advert = adverts.find(a => a.id === app.advert_id);
                    return (
                      <tr key={app.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-on-surface truncate max-w-[300px]">
                          {advert?.extracted_json?.title || 'Unknown Position'}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">{app.mode}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={app.status} type="publication" />
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant">{formatDate(app.updated_at)}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Link href={`/manage/career/applications/${app.id}`} className="text-primary hover:underline" title="Open application">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link href={`/manage/career/builder?application=${app.id}`} className="text-on-surface-variant hover:text-on-surface" title="Edit documents">
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </CMSLayout>
  );
}

function StatCard({ icon, label, value, color = "primary" }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    blue: "text-blue-500 bg-blue-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
    red: "text-red-500 bg-red-500/10",
    amber: "text-amber-500 bg-amber-500/10",
  };
  return (
    <div className="p-4 rounded-xl bg-surface-container-lowest border border-border space-y-1">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colors[color]}`}>{icon}</div>
      <div className="font-bold text-2xl text-on-surface font-mono">{value}</div>
      <div className="text-[11px] font-mono text-on-surface-variant uppercase">{label}</div>
    </div>
  );
}

function ActionCard({ icon, title, description, href, primary = false }: { icon: React.ReactNode; title: string; description: string; href: string; primary?: boolean }) {
  return (
    <Link href={href} className={`p-4 rounded-xl border transition-colors ${primary ? 'bg-primary border-primary text-white' : 'bg-surface-container-lowest border-border hover:bg-surface-container hover:border-primary/50'}`}>
      <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${primary ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>{icon}</div>
      <div className="mt-3 space-y-1">
        <h3 className={`font-semibold text-sm ${primary ? 'text-white' : 'text-on-surface'}`}>{title}</h3>
        <p className={`text-[11px] font-mono ${primary ? 'text-white/80' : 'text-on-surface-variant'}`}>{description}</p>
      </div>
    </Link>
  );
}