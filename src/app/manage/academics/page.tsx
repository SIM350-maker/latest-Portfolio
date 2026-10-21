"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CMSLayout } from "@/components/CMSLayout";
import {
  GraduationCap,
  Award,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Layers as LayersIcon,
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
  created_at: string;
  updated_at: string;
}

interface AcademicPeriod {
  id: number;
  qualification_id: number;
  label: string;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

interface CertificationItem {
  id: number;
  title: string;
  issuer: string;
  category: string;
  issue_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  file_url: string | null;
  verification_status: string;
  skills: string[];
  is_visible: boolean;
  is_posted: boolean;
  display_order: number;
}

function PubBadge({ status }: { status: string }) {
  switch (status) {
    case "Published": return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Published</span>;
    case "Archived": return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400">Archived</span>;
    default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-400">Draft</span>;
  }
}

function VisBadge({ vis }: { vis: string }) {
  switch (vis) {
    case "Public": return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400">Public</span>;
    case "Restricted": return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-700 dark:text-orange-400">Restricted</span>;
    default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/10 text-gray-700 dark:text-gray-400">Private</span>;
  }
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-container text-on-surface-variant">—</span>;
  const g = grade.toUpperCase();
  let cls = "bg-surface-container text-on-surface-variant";
  if (g === "A") cls = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (g === "B") cls = "bg-blue-500/15 text-blue-700 dark:text-blue-400";
  if (g === "C") cls = "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  if (g === "D") cls = "bg-orange-500/15 text-orange-700 dark:text-orange-400";
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${cls}`}>{grade}</span>;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Pass</span>;
  if (status === "Supplementary") return <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400">Supplementary</span>;
  return <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">{status}</span>;
}

function FormatDate({ d }: { d: string | null }) { return <span>{d || "—"}</span>; }

function QualificationCard({
  qual,
  periods,
  semesters,
  units,
  expandedPeriods,
  expandedSemesters,
  loadingSemesters,
  onTogglePeriod,
  onToggleSemester,
  onOpenNewPeriod,
  onOpenNewSemester,
  onOpenNewUnit,
  onEditQualification,
  onDeleteQualification,
  onEditPeriod,
  onDeletePeriod,
  onEditSemester,
  onDeleteSemester,
  onEditUnit,
  onDeleteUnit,
  handleToggle,
}: any) {
  const qualPeriods = periods.filter((p: any) => p.qualification_id === qual.id);
  return (
    <div key={qual.id} className="space-y-4">
      <div className="bg-surface-container-lowest border border-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-on-surface">{qual.title}</h3>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">{qual.institution}</span>
              <PubBadge status={qual.publication_status} />
              <VisBadge vis={qual.visibility} />
              <div className="flex items-center gap-1.5 ml-auto">
                <button 
                  onClick={() => handleToggle("qualification", qual.id, "publication_status", qual.publication_status === "Published" ? "Draft" : "Published")}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                    qual.publication_status === "Published" 
                      ? "bg-blue-500/10 text-blue-600 border border-blue-500/30" 
                      : "bg-purple-500/10 text-purple-600 border border-purple-500/30"
                  }`}
                  title="Toggle publication status"
                >
                  {qual.publication_status === "Published" ? "Unpublish" : "Publish"}
                </button>
                <button 
                  onClick={() => handleToggle("qualification", qual.id, "visibility", qual.visibility === "Public" ? "Private" : "Public")}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                    qual.visibility === "Public" 
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30" 
                      : "bg-gray-500/10 text-gray-600 border border-gray-500/30"
                  }`}
                  title="Toggle visibility"
                >
                  {qual.visibility === "Public" ? "Make Private" : "Make Public"}
                </button>
              </div>
            </div>
            <p className="font-mono text-xs text-primary font-semibold">{qual.institution}</p>
            <div className="font-mono text-[11px] text-on-surface-variant flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <FormatDate d={qual.start_date} /> — <FormatDate d={qual.end_date} />
              {qual.field_of_study && <span>· {qual.field_of_study}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
            <button onClick={onEditQualification} className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={onDeleteQualification} className="p-1.5 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {qual.description && <p className="text-xs text-on-surface-variant leading-relaxed font-sans">{qual.description}</p>}
        <div className="flex items-center gap-3 font-mono text-[10px]">
          {qual.faculty && <span>Faculty: {qual.faculty}</span>}
          {qual.department && <span>Dept: {qual.department}</span>}
          <span>Status: {qual.qualification_status}</span>
        </div>

        <button onClick={() => onTogglePeriod(qual.id)} className="w-full flex items-center justify-between py-2 text-sm text-on-surface-variant hover:text-on-surface">
          <span>Academic Periods ({qualPeriods.length})</span>
          {expandedPeriods.has(qual.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {expandedPeriods.has(qual.id) && (
          <div className="ml-4 border-l-2 border-border/50 pl-4 space-y-3">
            <button onClick={onOpenNewPeriod} className="w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border/50 bg-surface-container-low hover:bg-surface-container text-xs font-mono text-on-surface-variant transition-colors">
              <Plus className="w-3.5 h-3.5" /><span>Add Academic Period</span>
            </button>
            {qualPeriods.map((period: any) => (
<PeriodCard
              key={period.id}
              period={period}
              semesters={semesters}
              units={units}
              expandedSemesters={expandedSemesters}
              loadingSemesters={loadingSemesters}
              onToggleSemester={() => onToggleSemester(period.id)}
              onOpenNewSemester={(periodId: number) => onOpenNewSemester(periodId)}
              onOpenNewUnit={(semesterId: number) => onOpenNewUnit(semesterId)}
              onEditPeriod={onEditPeriod}
              onDeletePeriod={onDeletePeriod}
              onEditSemester={onEditSemester}
              onDeleteSemester={onDeleteSemester}
              onEditUnit={onEditUnit}
              onDeleteUnit={onDeleteUnit}
              handleToggle={handleToggle}
            />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PeriodCard({
  period,
  semesters,
  units,
  expandedSemesters,
  loadingSemesters,
  onToggleSemester,
  onOpenNewSemester,
  onOpenNewUnit,
  onEditPeriod,
  onDeletePeriod,
  onEditSemester,
  onDeleteSemester,
  onEditUnit,
  onDeleteUnit,
  handleToggle,
}: any) {
  const periodSemesters = semesters.filter((s: any) => s.period_id === period.id);
  return (
    <div className="bg-surface-container-low border border-border/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayersIcon className="w-4 h-4 text-primary" />
          <div>
            <span className="font-semibold text-sm text-on-surface">{period.label}</span>
            <span className="ml-2 font-mono text-[10px] text-on-surface-variant"><FormatDate d={period.start_date} /> — <FormatDate d={period.end_date} /></span>
            <PubBadge status="Published" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEditPeriod} className="p-1 rounded hover:bg-surface-container" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={onDeletePeriod} className="p-1 rounded hover:bg-red-500/10 text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <button onClick={onToggleSemester} className="w-full flex items-center justify-between py-1 text-xs text-on-surface-variant hover:text-on-surface">
        <span>Semesters ({periodSemesters.length})</span>
        {expandedSemesters.has(period.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {expandedSemesters.has(period.id) && (
        <div className="ml-3 border-l border-border/50 pl-3 space-y-2">
          <button onClick={() => onOpenNewSemester(period.id)} className="w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border/50 bg-surface-container-low hover:bg-surface-container text-xs font-mono text-on-surface-variant transition-colors">
            <Plus className="w-3.5 h-3.5" /><span>Add Semester</span>
          </button>
          {periodSemesters.map((sem: any) => (
            <SemesterCard
              key={sem.id}
              sem={sem}
              units={units}
              loadingSemesters={loadingSemesters}
              expandedSemesters={expandedSemesters}
              onToggleSemester={() => onToggleSemester(sem.id)}
              onOpenNewUnit={onOpenNewUnit}
              onEditSemester={onEditSemester}
              onDeleteSemester={onDeleteSemester}
              onEditUnit={onEditUnit}
              onDeleteUnit={onDeleteUnit}
              handleToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SemesterCard({
  sem,
  units,
  loadingSemesters,
  expandedSemesters,
  onToggleSemester,
  onOpenNewUnit,
  onEditSemester,
  onDeleteSemester,
  onEditUnit,
  onDeleteUnit,
  handleToggle,
}: any) {
  const semUnits = units[sem.id] || [];
  return (
    <div className="bg-surface-container-low border border-border/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <BookOpen className="w-4 h-4 text-primary" />
          <div>
            <span className="font-semibold text-sm text-on-surface">{sem.source_label}</span>
            <span className="ml-2 font-mono text-[10px] text-on-surface-variant">S{sem.semester_number ?? "?"} · {sem.academic_year_label ?? "—"}</span>
            <PubBadge status={sem.publication_status} />
            <VisBadge vis={sem.visibility} />
            <div className="flex items-center gap-1.5 ml-2">
              <button 
                onClick={() => handleToggle("semester", sem.id, "publication_status", sem.publication_status === "Published" ? "Draft" : "Published")}
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                  sem.publication_status === "Published" 
                    ? "bg-blue-500/10 text-blue-600 border border-blue-500/30" 
                    : "bg-purple-500/10 text-purple-600 border border-purple-500/30"
                }`}
                title="Toggle publication status"
              >
                {sem.publication_status === "Published" ? "Unpublish" : "Publish"}
              </button>
              <button 
                onClick={() => handleToggle("semester", sem.id, "visibility", sem.visibility === "Public" ? "Private" : "Public")}
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-colors ${
                  sem.visibility === "Public" 
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30" 
                    : "bg-gray-500/10 text-gray-600 border border-gray-500/30"
                }`}
                title="Toggle visibility"
              >
                {sem.visibility === "Public" ? "Make Private" : "Make Public"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEditSemester} className="p-1 rounded hover:bg-surface-container" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={onDeleteSemester} className="p-1 rounded hover:bg-red-500/10 text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <button onClick={onToggleSemester} className="w-full flex items-center justify-between py-1 text-xs text-on-surface-variant hover:text-on-surface">
        <span>Units ({semUnits.length}) {loadingSemesters.has(sem.id) ? <RefreshCw className="w-3 h-3 animate-spin ml-1" /> : ""}</span>
        {expandedSemesters.has(sem.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {expandedSemesters.has(sem.id) && (
        <div className="ml-3 border-l border-border/50 pl-3 space-y-2">
          <button onClick={onOpenNewUnit} className="w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border/50 bg-surface-container-low hover:bg-surface-container text-xs font-mono text-on-surface-variant transition-colors">
            <Plus className="w-3.5 h-3.5" /><span>Add Unit</span>
          </button>
          {loadingSemesters.has(sem.id) ? (
            <div className="text-center py-4 text-xs text-on-surface-variant">Loading units…</div>
          ) : semUnits.length === 0 ? (
            <div className="text-center py-4 text-xs text-on-surface-variant">No units yet. Click "Add Unit" to create.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead><tr className="border-b border-border text-on-surface-variant text-[10px] uppercase"><th className="px-2 py-1 text-left">Code</th><th className="px-2 py-1 text-left">Title</th><th className="px-2 py-1 text-right">Credits</th><th className="px-2 py-1 text-center">Grade</th><th className="px-2 py-1 text-center">Status</th><th className="px-2 py-1 text-center">Pub</th><th className="px-2 py-1 text-center">Vis</th><th className="px-2 py-1 text-right">Actions</th></tr></thead>
                <tbody>
                  {semUnits.map((unit: any) => (
                    <tr key={unit.id} className="border-t border-border/30 hover:bg-surface-container-low/50">
                      <td className="px-2 py-1.5 font-semibold text-primary">{unit.unit_code}</td>
                      <td className="px-2 py-1.5 text-on-surface">{unit.unit_title}</td>
                      <td className="px-2 py-1.5 text-right text-on-surface-variant">{unit.credit_hours ?? "—"}</td>
                      <td className="px-2 py-1.5 text-center"><GradeBadge grade={unit.grade} /></td>
                      <td className="px-2 py-1.5 text-center"><StatusBadge status={unit.result_status} /></td>
                      <td className="px-2 py-1.5 text-center"><PubBadge status={unit.publication_status} /></td>
                      <td className="px-2 py-1.5 text-center"><VisBadge vis={unit.visibility} /></td>
                      <td className="px-2 py-1.5 text-right space-x-1">
                        <button 
                          onClick={() => handleToggle("unit", unit.id, "publication_status", unit.publication_status === "Published" ? "Draft" : "Published")}
                          className={`p-1 rounded transition-colors ${
                            unit.publication_status === "Published" 
                              ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" 
                              : "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20"
                          }`}
                          title="Toggle publication status"
                        >
                          {unit.publication_status === "Published" ? "⛶" : "⛶"}
                        </button>
                        <button 
                          onClick={() => handleToggle("unit", unit.id, "visibility", unit.visibility === "Public" ? "Private" : "Public")}
                          className={`p-1 rounded transition-colors ${
                            unit.visibility === "Public" 
                              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" 
                              : "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20"
                          }`}
                          title="Toggle visibility"
                        >
                          {unit.visibility === "Public" ? "👁" : "🔒"}
                        </button>
                        <button onClick={() => onEditUnit(unit)} className="p-1 rounded hover:bg-surface-container" title="Edit"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => onDeleteUnit(unit.id)} className="p-1 rounded hover:bg-red-500/10 text-red-500" title="Delete"><Trash2 className="w-3 h-3" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CertificationCard({
  cert,
  onToggleVisible,
  onTogglePosted,
  onEditCert,
  onDeleteCert,
  onPreviewPdf,
}: any) {
  return (
    <div key={cert.id} className="bg-surface-container-lowest border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">{cert.category}</span>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <button onClick={() => onToggleVisible(cert.id)} className={`px-2 py-0.5 rounded transition-colors ${cert.is_visible ? "bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/30" : "bg-surface-container text-on-surface-variant/60"}`} title="Toggle visibility">{cert.is_visible ? "VISIBLE" : "HIDDEN"}</button>
            <button onClick={() => onTogglePosted(cert.id)} className={`px-2 py-0.5 rounded transition-colors ${cert.is_posted ? "bg-blue-500/10 text-blue-600 font-bold border border-blue-500/30" : "bg-surface-container text-on-surface-variant/60"}`} title="Toggle posted">{cert.is_posted ? "POSTED" : "DRAFT"}</button>
            <button onClick={onEditCert} className="p-1 rounded text-on-surface-variant hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={onDeleteCert} className="p-1 rounded text-on-surface-variant hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div><h3 className="font-bold text-sm text-on-surface">{cert.title}</h3><p className="font-mono text-xs text-primary font-medium">{cert.issuer}</p></div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-on-surface-variant"><span>Date: {cert.issue_date || "—"}</span>{cert.credential_id && <span>ID: <code className="text-on-surface font-semibold">{cert.credential_id}</code></span>}<span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {cert.verification_status}</span></div>
        {Array.isArray(cert.skills) && cert.skills.length > 0 && <div className="flex flex-wrap gap-1 pt-1">{cert.skills.map((s: string, idx: number) => <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-border/40">{s}</span>)}</div>}
      </div>
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
        <span className="text-on-surface-variant truncate max-w-[150px]">{cert.file_url ? cert.file_url.split("/").pop() : "No file"}</span>
        {cert.file_url && <div className="flex items-center gap-1.5"><button onClick={onPreviewPdf} className="px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary flex items-center gap-1 text-[11px]"><Eye className="w-3.5 h-3.5" /><span>Preview</span></button><a href={cert.file_url} target="_blank" rel="noreferrer" className="p-1 rounded text-on-surface-variant hover:text-primary"><ExternalLink className="w-3.5 h-3.5" /></a></div>}
      </div>
    </div>
  );
}

export default function ManageAcademicsPage() {
  const [activeTab, setActiveTab] = useState<"academics" | "certifications">("academics");
  const [qualifications, setQualifications] = useState<AcademicQualification[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [semesters, setSemesters] = useState<AcademicSemester[]>([]);
  const [units, setUnits] = useState<Record<number, AcademicUnit[]>>({});
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [expandedPeriods, setExpandedPeriods] = useState<Set<number>>(new Set());
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set());
  const [loadingSemesters, setLoadingSemesters] = useState<Set<number>>(new Set());

  const [editingQualification, setEditingQualification] = useState<AcademicQualification | null>(null);
  const [isNewQualification, setIsNewQualification] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [isNewPeriod, setIsNewPeriod] = useState(false);
  const [editingSemester, setEditingSemester] = useState<AcademicSemester | null>(null);
  const [isNewSemester, setIsNewSemester] = useState(false);
  const [editingUnit, setEditingUnit] = useState<AcademicUnit | null>(null);
  const [isNewUnit, setIsNewUnit] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificationItem | null>(null);
  const [isNewCert, setIsNewCert] = useState(false);

  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [qualRes, certRes] = await Promise.all([
        fetch("/api/manage/academics?type=qualifications"),
        fetch("/api/certifications?all=true"),
      ]);
      const qualData = await qualRes.json();
      const certData = await certRes.json();
      if (qualRes.ok) setQualifications(qualData.qualifications || []);
      if (certRes.ok) setCertifications(certData.certifications || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchPeriods = async (qualificationId: number) => {
    const res = await fetch(`/api/manage/academics?type=periods&qualificationId=${qualificationId}`);
    const data = await res.json();
    if (res.ok) setPeriods(data.periods || []);
  };

  const fetchSemesters = async (qualificationId: number) => {
    const res = await fetch(`/api/manage/academics?type=semesters&qualificationId=${qualificationId}`);
    const data = await res.json();
    if (res.ok) setSemesters(data.semesters || []);
  };

  const fetchUnits = async (semesterId: number) => {
    setLoadingSemesters(prev => new Set(prev).add(semesterId));
    const res = await fetch(`/api/manage/academics?type=units&semesterId=${semesterId}`);
    const data = await res.json();
    if (res.ok) setUnits(prev => ({ ...prev, [semesterId]: data.units || [] }));
    setLoadingSemesters(prev => { const s = new Set(prev); s.delete(semesterId); return s; });
  };

  const handleToggle = async (
    type: "qualification" | "semester" | "unit" | "certification",
    id: number,
    field: "publication_status" | "visibility" | "is_visible" | "is_posted",
    newValue: string | boolean
  ) => {
    try {
      let res: Response;
      if (type === "certification") {
        res = await fetch(`/api/certifications/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: newValue }) });
      } else {
        res = await fetch(`/api/manage/academics/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: newValue, type }) });
      }
      if (!res.ok) throw new Error();
      setSuccess(`${type} ${field === "publication_status" ? "publication" : "visibility"} updated.`);
      setTimeout(() => setSuccess(null), 2500);
      fetchAll();
    } catch { setError(`Failed to update ${type} status.`); }
  };

  const handleDelete = async (type: "qualification" | "period" | "semester" | "unit" | "certification", id: number) => {
    if (!confirm(`Delete this ${type}? This action cannot be undone.`)) return;
    try {
      let res: Response;
      if (type === "certification") { res = await fetch(`/api/certifications/${id}`, { method: "DELETE" }); }
      else { res = await fetch(`/api/manage/academics/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) }); }
      if (res.ok) { setSuccess(`${type} deleted.`); setTimeout(() => setSuccess(null), 2500); fetchAll(); }
    } catch { setError(`Failed to delete ${type}.`); }
  };

  const openNewQualification = () => {
    setEditingQualification({ id: 0, title: "", institution: "", faculty: "", department: "", field_of_study: "", description: "", start_date: "2024-09", end_date: "", qualification_status: "In Progress", display_order: qualifications.length + 1, publication_status: "Draft", visibility: "Private", created_at: "", updated_at: "" });
    setIsNewQualification(true);
  };

  const openNewPeriod = (qualId: number) => {
    setEditingPeriod({ id: 0, qualification_id: qualId, label: "", start_date: "", end_date: "", display_order: periods.filter(p => p.qualification_id === qualId).length + 1, created_at: "", updated_at: "" });
    setIsNewPeriod(true);
  };

  const openNewSemester = (qualId: number, periodId: number) => {
    setEditingSemester({ id: 0, period_id: periodId, qualification_id: qualId, source_label: "", semester_number: null, academic_year_label: "", start_date: "", end_date: "", display_order: semesters.filter(s => s.period_id === periodId).length + 1, publication_status: "Draft", visibility: "Private", created_at: "", updated_at: "" });
    setIsNewSemester(true);
  };

  const openNewUnit = (semesterId: number) => {
    setEditingUnit({ id: 0, semester_id: semesterId, unit_code: "", unit_title: "", credit_hours: 45, grade: "", result_status: "Pass", source_reference: "", source_managed: false, display_order: (units[semesterId] || []).length + 1, publication_status: "Draft", visibility: "Private", created_at: "", updated_at: "" });
    setIsNewUnit(true);
  };

  const openNewCertification = () => {
    setEditingCert({ id: 0, title: "", issuer: "", category: "Artificial Intelligence", issue_date: "2026-07", credential_id: "", credential_url: "", file_url: "/certificates/Advanced Prompt Engineering - Certificate.pdf", verification_status: "VERIFIED", skills: [], is_visible: true, is_posted: true, display_order: certifications.length + 1 });
    setIsNewCert(true);
  };

  const togglePeriod = (qualId: number, periodId: number) => {
    setExpandedPeriods(prev => { const next = new Set(prev); if (next.has(periodId)) next.delete(periodId); else { next.add(periodId); fetchPeriods(qualId); } return next; });
  };

  const toggleSemester = (periodId: number, semesterId: number) => {
    setExpandedSemesters(prev => { const next = new Set(prev); if (next.has(semesterId)) next.delete(semesterId); else { next.add(semesterId); if (!units[semesterId]) fetchUnits(semesterId); } return next; });
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <GraduationCap className="w-4 h-4" />
              <span>{activeTab === "academics" ? "Academic Curriculum Governance" : "Certification Credentials Governance"}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">{activeTab === "academics" ? "Academic Qualifications, Periods, Semesters & Units" : "Professional Certifications & Credentials"}</h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Full CRUD control over what appears on the public site. Manage hierarchy, publication, visibility, and document attachments.</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "academics" ? <button onClick={openNewQualification} className="inline-flex items-center gap-1.5 h-9 px-3 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"><Plus className="w-4 h-4" /><span>Add Qualification</span></button> : <button onClick={openNewCertification} className="inline-flex items-center gap-1.5 h-9 px-3 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"><Plus className="w-4 h-4" /><span>Add Certificate Credential</span></button>}
            <button onClick={fetchAll} className="p-2 rounded border border-border bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors" title="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-border pb-1 font-mono text-xs">
          <button onClick={() => setActiveTab("academics")} className={`px-4 py-2 rounded-t font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${activeTab === "academics" ? "border-primary text-primary bg-primary/5" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}><GraduationCap className="w-4 h-4" /><span>Academics ({qualifications.length})</span></button>
          <button onClick={() => setActiveTab("certifications")} className={`px-4 py-2 rounded-t font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${activeTab === "certifications" ? "border-primary text-primary bg-primary/5" : "border-transparent text-on-surface-variant hover:text-on-surface"}`}><Award className="w-4 h-4" /><span>Certifications ({certifications.length})</span></button>
        </div>

        {/* Notifications */}
        {error && <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between"><div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /><span>{error}</span></div><button onClick={() => setError(null)} className="text-xs font-bold hover:underline">Dismiss</button></div>}
        {success && <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /><span>{success}</span></div>}

        {/* TAB 1: ACADEMICS */}
        {activeTab === "academics" && (
          <div className="space-y-4">
            {loading ? <div className="py-20 text-center font-mono text-xs text-on-surface-variant"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />Loading academic records…</div> : qualifications.length === 0 ? <div className="py-20 text-center space-y-4"><div className="w-16 h-16 mx-auto rounded-full bg-surface-container flex items-center justify-center text-primary"><GraduationCap className="w-8 h-8" /></div><h3 className="font-bold">No Academic Qualifications Yet</h3><p className="text-sm text-on-surface-variant">Add your first degree programme to get started.</p></div> : (
              qualifications.map(qual => {
                const qualPeriods = periods.filter(p => p.qualification_id === qual.id);
return (
  <QualificationCard
    key={qual.id}
    qual={qual}
    periods={periods}
    semesters={semesters}
    units={units}
    expandedPeriods={expandedPeriods}
    expandedSemesters={expandedSemesters}
    loadingSemesters={loadingSemesters}
    onTogglePeriod={() => togglePeriod(qual.id, qual.id)}
    onOpenNewPeriod={() => openNewPeriod(qual.id)}
    onOpenNewSemester={(periodId: number) => openNewSemester(qual.id, periodId)}
    onOpenNewUnit={(semesterId: number) => openNewUnit(semesterId)}
    onEditQualification={() => { setEditingQualification(qual); setIsNewQualification(false); }}
    onDeleteQualification={() => handleDelete("qualification", qual.id)}
    onEditPeriod={(period: any) => { setEditingPeriod(period); setIsNewPeriod(false); }}
    onDeletePeriod={(period: any) => handleDelete("period", period.id)}
    onEditSemester={(sem: any) => { setEditingSemester(sem); setIsNewSemester(false); }}
    onDeleteSemester={(sem: any) => handleDelete("semester", sem.id)}
    onEditUnit={(unit: any) => { setEditingUnit(unit); setIsNewUnit(false); }}
    onDeleteUnit={(unitId: number) => handleDelete("unit", unitId)}
    handleToggle={handleToggle}
  />
);
              })
            )}
          </div>
        )}

        {/* TAB 2: CERTIFICATIONS */}
        {activeTab === "certifications" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map(cert => (
                <CertificationCard
                  key={cert.id}
                  cert={cert}
                  onToggleVisible={(id: number) => handleToggle("certification", id, "is_visible", !cert.is_visible)}
                  onTogglePosted={(id: number) => handleToggle("certification", id, "is_posted", !cert.is_posted)}
                  onEditCert={() => { setEditingCert(cert); setIsNewCert(false); }}
                  onDeleteCert={() => handleDelete("certification", cert.id)}
                  onPreviewPdf={() => { setPreviewPdfUrl(cert.file_url!); setPreviewTitle(cert.title); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* PDF Preview Modal */}
        {previewPdfUrl && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={previewTitle}>
            <div className="bg-surface-container-lowest border border-border rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-3.5 border-b border-border bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0"><FileText className="w-4 h-4 text-primary shrink-0" /><span className="font-semibold text-xs sm:text-sm text-on-surface truncate">{previewTitle}</span></div>
                <div className="flex items-center gap-2 font-mono text-xs shrink-0 ml-4"><a href={previewPdfUrl} download className="px-2.5 py-1 rounded bg-primary text-white flex items-center gap-1 hover:bg-tertiary transition-colors"><Download className="w-3.5 h-3.5" /><span>Download</span></a><a href={previewPdfUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded border border-border bg-surface-container text-on-surface hover:bg-surface-container-high flex items-center gap-1 transition-colors"><ExternalLink className="w-3.5 h-3.5" /><span>Open</span></a><button onClick={() => setPreviewPdfUrl(null)} className="px-2.5 py-1 rounded border border-border bg-surface-container text-on-surface hover:bg-surface-container-high cursor-pointer">Close</button></div>
              </div>
              <div className="flex-1 bg-surface-container-lowest w-full h-full"><iframe src={previewPdfUrl} className="w-full h-full border-none" title={previewTitle} /></div>
            </div>
          </div>
        )}
      </div>
    </CMSLayout>
  );
}