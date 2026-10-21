"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import {
  GraduationCap,
  Award,
  CheckCircle2,
  ExternalLink,
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Calendar,
  Clock,
  Layers,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  RefreshCw,
  BookOpen,
} from "lucide-react";

interface AcademicQualification {
  id: number;
  title: string;
  institution: string;
  faculty: string | null;
  department: string | null;
  field_of_study: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  qualification_status: string | null;
  display_order: number;
  publication_status: string;
  visibility: string;
}

interface AcademicPeriod {
  id: number;
  qualification_id: number;
  label: string;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
}

interface AcademicSemester {
  id: number;
  period_id: number;
  qualification_id: number;
  source_label: string;
  semester_number: number | null;
  academic_year_label: string | null;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
  publication_status: string;
  visibility: string;
}

interface AcademicUnit {
  id: number;
  semester_id: number;
  unit_code: string;
  unit_title: string;
  credit_hours: number | null;
  grade: string | null;
  result_status: string | null;
  source_reference: string | null;
  source_managed: boolean;
  display_order: number;
  publication_status: string;
  visibility: string;
}

interface CertificationItem {
  id: string | number;
  title: string;
  issuer: string;
  category: string;
  issue_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  file_url: string | null;
  verification_status: string;
  skills: string[];
}

interface AcademicMetrics {
  totalSemesters: number;
  totalUnits: number;
  completedUnits: number;
  supplementaryUnits: number;
  totalCredits: number;
  gradeDistribution: Record<string, number>;
}

function getGradeColor(grade: string | null): string {
  if (!grade) return "bg-surface-container text-on-surface-variant";
  const g = grade.toUpperCase();
  if (g === "A") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (g === "B") return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
  if (g === "C") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  if (g === "D") return "bg-orange-500/15 text-orange-700 dark:text-orange-400";
  return "bg-surface-container text-on-surface-variant";
}

function getStatusBadge(status: string | null): React.ReactNode {
  if (!status) return <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Pass</span>;
  if (status === "Supplementary") return <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400">Supplementary</span>;
  return <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">{status}</span>;
}

function formatDate(d: string | null) { return d || "—"; }

export default function QualificationsPage() {
  const [qualifications, setQualifications] = useState<AcademicQualification[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [semestersByPeriod, setSemestersByPeriod] = useState<Record<number, AcademicSemester[]>>({});
  const [metrics, setMetrics] = useState<AcademicMetrics | null>(null);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<"academics" | "certifications">("academics");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("All");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set());
  const [units, setUnits] = useState<Record<number, AcademicUnit[]>>({});
  const [loadingSemesters, setLoadingSemesters] = useState<Set<number>>(new Set());
  const [modalPdf, setModalPdf] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [qualRes, metricsRes, certRes] = await Promise.all([
          fetch("/api/academics?action=qualifications"),
          fetch("/api/academics?action=metrics&qualificationId=1"),
          fetch("/api/certifications"),
        ]);
        
        const qualData = await qualRes.json();
        const metricsData = await metricsRes.json();
        const certData = await certRes.json();
        
        if (qualRes.ok && qualData.qualifications?.length > 0) {
          const qual = qualData.qualifications[0];
          setQualifications(qualData.qualifications);
          
          const [periodsRes, semestersRes] = await Promise.all([
            fetch(`/api/academics?action=periods&qualificationId=${qual.id}`),
            fetch(`/api/academics?action=semesters&qualificationId=${qual.id}`),
          ]);
          
          const periodsData = await periodsRes.json();
          const semestersData = await semestersRes.json();
          
          if (periodsRes.ok) setPeriods(periodsData.periods || []);
          if (semestersRes.ok) {
            const byPeriod: Record<number, AcademicSemester[]> = {};
            for (const sem of semestersData.semesters || []) {
              if (!byPeriod[sem.period_id]) byPeriod[sem.period_id] = [];
              byPeriod[sem.period_id].push(sem);
            }
            setSemestersByPeriod(byPeriod);
          }
        }
        
        if (metricsRes.ok) setMetrics(metricsData.metrics);
        if (certRes.ok) setCertifications(certData.certifications || []);
        setError(null);
      } catch (err) {
        console.error("Failed to load qualifications data:", err);
        setError("Failed to load qualification records.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const fetchUnits = async (semesterId: number) => {
    setLoadingSemesters(prev => new Set(prev).add(semesterId));
    const res = await fetch(`/api/academics?action=units&semesterId=${semesterId}`);
    const data = await res.json();
    if (res.ok) setUnits(prev => ({ ...prev, [semesterId]: data.units || [] }));
    setLoadingSemesters(prev => { const s = new Set(prev); s.delete(semesterId); return s; });
  };

  const toggleSemester = (semesterId: number) => {
    setExpandedSemesters(prev => {
      const next = new Set(prev);
      if (next.has(semesterId)) next.delete(semesterId);
      else { next.add(semesterId); if (!units[semesterId]) fetchUnits(semesterId); }
      return next;
    });
  };

  const formatDate = (d: string | null) => d || "—";

  const getGradeColor = (grade: string | null): string => {
    if (!grade) return "bg-surface-container text-on-surface-variant";
    const g = grade.toUpperCase();
    if (g === "A") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    if (g === "B") return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
    if (g === "C") return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    if (g === "D") return "bg-orange-500/15 text-orange-700 dark:text-orange-400";
    return "bg-surface-container text-on-surface-variant";
  };

  const getStatusBadge = (status: string | null): React.ReactNode => {
    if (!status) return <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Pass</span>;
    if (status === "Supplementary") return <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400">Supplementary</span>;
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">{status}</span>;
  };

  // Filter units for academics tab
  const allUnits = useMemo(() => {
    const flat: Array<AcademicUnit & { semester: AcademicSemester }> = [];
    for (const sems of Object.values(semestersByPeriod)) {
      for (const sem of sems) {
        const semUnits = units[sem.id] || [];
        for (const u of semUnits) flat.push({ ...u, semester: sem });
      }
    }
    return flat;
  }, [semestersByPeriod, units]);

  const filteredUnits = useMemo(() => {
    let filtered = allUnits;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => u.unit_code.toLowerCase().includes(term) || u.unit_title.toLowerCase().includes(term));
    }
    if (selectedGrade !== "All") filtered = filtered.filter(u => u.grade === selectedGrade);
    return filtered;
  }, [allUnits, searchTerm, selectedGrade]);

  const availableGrades = useMemo(() => {
    const grades = new Set<string>();
    for (const u of allUnits) if (u.grade) grades.add(u.grade);
    return ["All", ...Array.from(grades).sort()];
  }, [allUnits]);

  // Filter certifications
  const categories = useMemo(() => ["All", ...Array.from(new Set(certifications.map(c => c.category).filter(Boolean)))], [certifications]);
  const filteredCerts = useMemo(() => {
    let filtered = certifications;
    if (activeCategory !== "All") filtered = filtered.filter(c => c.category === activeCategory);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(term) || c.issuer.toLowerCase().includes(term) || (c.credential_id && c.credential_id.toLowerCase().includes(term)));
    }
    return filtered;
  }, [certifications, activeCategory, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mx-auto animate-spin">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-on-surface-variant font-mono">Loading qualification records…</p>
          </div>
        </main>
        <Footer />
        <TerminalModal />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 py-24 max-w-md px-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-lg font-bold">Unable to Load Records</h1>
            <p className="text-sm text-on-surface-variant">{error}</p>
            <button onClick={() => window.location.reload()} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors mx-auto">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </main>
        <Footer />
        <TerminalModal />
      </div>
    );
  }

  const qualification = qualifications[0];

  if (!qualification) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="text-center space-y-4 max-w-md px-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-surface-container flex items-center justify-center">
              <span className="text-3xl">🎓</span>
            </div>
            <h1 className="text-2xl font-bold">Qualification Records Coming Soon</h1>
            <p className="text-sm text-on-surface-variant">Published qualifications and credentials will appear here.</p>
          </div>
        </main>
        <Footer />
        <TerminalModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-surface-container-low border-b border-border py-12 md:py-16">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs uppercase tracking-wider font-semibold">
              <GraduationCap className="w-4 h-4" />
              <span>Qualifications & Credentials Ledger</span>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface">
                Academic Foundation & Professional Credentials
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-2xl">
                Complete academic transcript from Chuka University (BSc Applied Computer Science) followed by industry certifications.
                Designed for hiring managers to assess technical foundation first, then specialized credentials.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3 font-mono text-xs">
              <button onClick={() => setModalPdf({ url: "/certificates/SIMON IPARA CV.pdf", title: "Simon Ipara — Comprehensive CV" })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"><FileText className="w-3.5 h-3.5 text-primary" /><span>View Full CV (PDF)</span></button>
              <button onClick={() => setModalPdf({ url: "/certificates/Transcript.pdf", title: "Chuka University — Official Academic Transcript" })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"><GraduationCap className="w-3.5 h-3.5 text-blue-500" /><span>Official Transcript (PDF)</span></button>
              <Link href="/projects" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"><Briefcase className="w-3.5 h-3.5 text-emerald-500" /><span>View Projects →</span></Link>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="py-4 border-b border-border bg-surface-container-lowest/50 sticky top-16 z-40">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <button onClick={() => setActiveTab("academics")} className={`px-4 py-2 rounded-t font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${activeTab === "academics" ? "border-primary text-primary bg-primary/5" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
                <GraduationCap className="w-4 h-4" /><span>Academic Foundation ({metrics?.totalUnits || 0} units)</span>
              </button>
              <button onClick={() => setActiveTab("certifications")} className={`px-4 py-2 rounded-t font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${activeTab === "certifications" ? "border-primary text-primary bg-primary/5" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}>
                <Award className="w-4 h-4" /><span>Professional Credentials ({certifications.length})</span>
              </button>
            </div>
          </div>
        </section>

        {/* TAB 1: ACADEMICS */}
        {activeTab === "academics" && (
          <section className="py-10">
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
              
              {/* Qualification Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/30">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm font-mono">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-on-surface">{qualification.title}</h2>
                    <p className="text-xs text-on-surface-variant font-mono">{qualification.institution}</p>
                    <p className="text-[11px] text-on-surface-variant font-mono">
                      {formatDate(qualification.start_date)} — {formatDate(qualification.end_date)}
                      {qualification.field_of_study && ` · ${qualification.field_of_study}`}
                    </p>
                  </div>
                </div>

                {qualification.description && (
                  <p className="text-sm text-on-surface-variant max-w-3xl leading-relaxed">{qualification.description}</p>
                )}

                {/* Metrics Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <MetricCard icon={<Calendar className="w-5 h-5" />} label="Academic Periods" value={periods.length} />
                  <MetricCard icon={<Layers className="w-5 h-5" />} label="Semesters" value={metrics?.totalSemesters || 0} />
                  <MetricCard icon={<BookOpen className="w-5 h-5" />} label="Course Units" value={metrics?.totalUnits || 0} />
                  <MetricCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={metrics?.completedUnits || 0} />
                  <MetricCard icon={<Award className="w-5 h-5" />} label="Credits" value={metrics?.totalCredits || 0} />
                  <MetricCard icon={<BarChart3 className="w-5 h-5" />} label="Grade Dist." value={Object.entries(metrics?.gradeDistribution || {}).map(([g, n]) => `${g}:${n}`).join(", ")} isText />
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input type="text" placeholder="Search by unit code or title…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" aria-label="Search course units" />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="grade-filter" className="text-xs font-mono text-on-surface-variant">Grade:</label>
                  <select id="grade-filter" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="h-10 px-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">{availableGrades.map(g => <option key={g} value={g}>{g}</option>)}</select>
                </div>
              </div>

              {/* Semester Timeline */}
              <div className="space-y-6">
                {periods.map(period => {
                  const semesters = semestersByPeriod[period.id] || [];
                  return (
                    <div key={period.id} className="space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b-2 border-primary/30">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm font-mono"><Calendar className="w-5 h-5" /></div>
                        <div>
                          <h3 className="text-lg font-bold text-on-surface">Academic Year {period.label}</h3>
                          <p className="text-xs text-on-surface-variant font-mono">{formatDate(period.start_date)} — {formatDate(period.end_date)} · {semesters.length} semester{semesters.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {semesters.map(sem => (
                          <SemesterCard
                            key={sem.id}
                            semester={sem}
                            isExpanded={expandedSemesters.has(sem.id)}
                            isLoading={loadingSemesters.has(sem.id)}
                            units={units[sem.id] || []}
                            searchTerm={searchTerm}
                            selectedGrade={selectedGrade}
                            onToggle={() => toggleSemester(sem.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Transcript Download */}
              <div className="pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-xl bg-surface-container-lowest border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><FileText className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-semibold text-sm text-on-surface">Official Academic Transcript</h3>
                      <p className="text-xs text-on-surface-variant">Download the official transcript PDF for {qualification.institution}</p>
                    </div>
                  </div>
                  <a href="/certificates/Transcript.pdf" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors"><ExternalLink className="w-3.5 h-3.5" /><span>View Transcript PDF</span></a>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: CERTIFICATIONS */}
        {activeTab === "certifications" && (
          <section className="py-10">
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-6">
              {/* Header + Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-on-surface">Professional Certifications</h2>
                  <span className="text-xs font-mono text-on-surface-variant">({certifications.length} total · {filteredCerts.length} shown)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" /><input type="text" placeholder="Search credentials…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-9 pl-9 pr-3 rounded-lg border border-border bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary w-48" aria-label="Search certifications" /></div>
                  <div className="flex items-center gap-1.5 flex-wrap"><span className="text-[11px] font-mono text-on-surface-variant flex items-center gap-1"><Filter className="w-3 h-3" /> Filter:</span>{categories.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-[11px] px-2 py-1 rounded-md transition-colors cursor-pointer ${activeCategory === cat ? "bg-primary text-white font-semibold" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>{cat}</button>)}</div>
                </div>
              </div>

              {/* Certifications Grid */}
              {filteredCerts.length === 0 ? (
                <div className="py-16 text-center text-sm text-on-surface-variant"><Award className="w-8 h-8 mx-auto mb-3 text-on-surface-variant/40" /><p>No certifications match the current filter.</p><button onClick={() => { setActiveCategory("All"); setSearchTerm(""); }} className="mt-3 text-primary text-xs font-semibold hover:underline">Clear filters</button></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCerts.map(cert => (
                    <div key={cert.id} className="p-5 rounded-xl bg-surface-container-lowest border border-border flex flex-col justify-between space-y-4 hover:border-primary/50 hover:-translate-y-0.5 transition-all group">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2"><span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">{cert.category}</span><span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" />{cert.verification_status}</span></div>
                        <div className="space-y-1"><h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors leading-snug">{cert.title}</h3><p className="text-xs font-mono text-primary font-semibold">{cert.issuer}</p></div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant"><span>Issued: {cert.issue_date || "—"}</span>{cert.credential_id && <span>ID: <code className="text-on-surface font-semibold">{cert.credential_id}</code></span>}</div>
                        {cert.credential_url && <a href={cert.credential_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:text-tertiary font-semibold"><ExternalLink className="w-3 h-3" /><span>Verify Credential</span></a>}
                        {Array.isArray(cert.skills) && cert.skills.length > 0 && <div className="pt-2 border-t border-border/60 flex flex-wrap gap-1.5">{cert.skills.map((skill, idx) => <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-border/30">{skill}</span>)}</div>}
                      </div>
                      <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                        {cert.file_url && <div className="flex items-center gap-1.5"><button onClick={() => setModalPdf({ url: cert.file_url!, title: `${cert.title} — ${cert.issuer}` })} className="px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary flex items-center gap-1 text-[11px]"><Eye className="w-3.5 h-3.5" /><span>Preview</span></button><a href={cert.file_url} target="_blank" rel="noreferrer" className="p-1 rounded text-on-surface-variant hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></a></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* PDF Viewer Modal */}
        {modalPdf && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={modalPdf.title}>
            <div className="bg-surface-container-lowest border border-border rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-3.5 border-b border-border bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0"><FileText className="w-4 h-4 text-primary shrink-0" /><span className="font-semibold text-xs sm:text-sm text-on-surface truncate">{modalPdf.title}</span></div>
                <div className="flex items-center gap-2 font-mono text-xs shrink-0 ml-4"><a href={modalPdf.url} download className="px-2.5 py-1 rounded bg-primary text-white flex items-center gap-1 hover:bg-tertiary transition-colors"><Download className="w-3.5 h-3.5" /><span>Download</span></a><a href={modalPdf.url} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded border border-border bg-surface-container text-on-surface hover:bg-surface-container-high flex items-center gap-1 transition-colors"><ExternalLink className="w-3.5 h-3.5" /><span>Open</span></a><button onClick={() => setModalPdf(null)} className="px-2.5 py-1 rounded border border-border bg-surface-container text-on-surface hover:bg-surface-container-high cursor-pointer">Close</button></div>
              </div>
              <div className="flex-1 bg-surface-container-lowest w-full h-full"><iframe src={modalPdf.url} className="w-full h-full border-none" title={modalPdf.title} /></div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}

function MetricCard({ icon, label, value, isText }: { icon: React.ReactNode; label: string; value: string | number; isText?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-surface-container-lowest border border-border space-y-1">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <div className={`font-bold text-on-surface ${isText ? "text-xs" : "text-2xl"}`}>{value}</div>
      <div className="text-[11px] font-mono text-on-surface-variant uppercase">{label}</div>
    </div>
  );
}

function SemesterCard({ semester, isExpanded, isLoading, units, searchTerm, selectedGrade, onToggle }: { semester: AcademicSemester; isExpanded: boolean; isLoading: boolean; units: AcademicUnit[]; searchTerm: string; selectedGrade: string; onToggle: () => void }) {
  const filteredUnits = useMemo(() => {
    let filtered = units;
    if (searchTerm) { const term = searchTerm.toLowerCase(); filtered = filtered.filter(u => u.unit_code.toLowerCase().includes(term) || u.unit_title.toLowerCase().includes(term)); }
    if (selectedGrade !== "All") filtered = filtered.filter(u => u.grade === selectedGrade);
    return filtered;
  }, [units, searchTerm, selectedGrade]);

  const totalCredits = useMemo(() => filteredUnits.reduce((sum, u) => sum + (Number(u.credit_hours) || 0), 0), [filteredUnits]);
  const gradeCounts = useMemo(() => { const counts: Record<string, number> = {}; for (const u of filteredUnits) if (u.grade) counts[u.grade] = (counts[u.grade] || 0) + 1; return counts; }, [filteredUnits]);

  return (
    <div className="rounded-xl border border-border bg-surface-container-lowest overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50" aria-expanded={isExpanded} aria-controls={`semester-${semester.id}`}>
        <div className="flex items-center gap-3 text-left">
          <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">S{semester.semester_number || "?"}</div>
          <div>
            <div className="font-semibold text-sm text-on-surface">{semester.source_label}</div>
            <div className="text-xs text-on-surface-variant font-mono">{semester.academic_year_label || "—"} · {filteredUnits.length} unit{filteredUnits.length !== 1 ? "s" : ""} · {totalCredits} credits</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {Object.keys(gradeCounts).length > 0 && <div className="hidden sm:flex gap-1">{Object.entries(gradeCounts).map(([g, n]) => <span key={g} className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${getGradeColor(g)}`} title={`Grade ${g}: ${n} unit(s)`}>{g}×{n}</span>)}</div>}
          {isExpanded ? <ChevronDown className="w-4 h-4 text-on-surface-variant" /> : <ChevronRight className="w-4 h-4 text-on-surface-variant" />}
        </div>
      </button>

      {isExpanded && (
        <div id={`semester-${semester.id}`} className="border-t border-border">
          {isLoading ? <div className="p-8 text-center text-sm text-on-surface-variant">Loading units…</div> : filteredUnits.length === 0 ? <div className="p-8 text-center text-sm text-on-surface-variant"><AlertCircle className="w-5 h-5 mx-auto mb-2 text-on-surface-variant/50" />No units match the current filter.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low text-xs font-mono uppercase text-on-surface-variant"><tr><th className="px-4 py-2 text-left">Code</th><th className="px-4 py-2 text-left">Title</th><th className="px-4 py-2 text-right">Credits</th><th className="px-4 py-2 text-center">Grade</th><th className="px-4 py-2 text-center">Status</th></tr></thead>
                <tbody>{filteredUnits.map(unit => <tr key={unit.id} className="border-t border-border hover:bg-surface-container-low/50 transition-colors"><td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{unit.unit_code}</td><td className="px-4 py-3 text-on-surface">{unit.unit_title}</td><td className="px-4 py-3 text-right font-mono text-xs text-on-surface-variant">{unit.credit_hours ?? "—"}</td><td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${getGradeColor(unit.grade)}`}>{unit.grade || "—"}</span></td><td className="px-4 py-3 text-center">{getStatusBadge(unit.result_status)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}