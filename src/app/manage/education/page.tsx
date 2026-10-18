"use client";

import React, { useState, useEffect } from "react";
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
  Clock,
  BookOpen,
  ShieldCheck,
  UploadCloud,
  FileBadge2
} from "lucide-react";

interface EducationItem {
  id: string | number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  grade: string | null;
  description: string | null;
  skills: string[];
  document_url: string | null;
  is_visible: boolean;
  is_posted: boolean;
  display_order: number;
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
  is_visible: boolean;
  is_posted: boolean;
  display_order: number;
}

export default function ManageEducationPage() {
  const [activeTab, setActiveTab] = useState<"education" | "certifications">("education");
  const [educationList, setEducationList] = useState<EducationItem[]>([]);
  const [certificationsList, setCertificationsList] = useState<CertificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // PDF Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  // Edit Education Modal
  const [editingEdu, setEditingEdu] = useState<EducationItem | null>(null);
  const [isNewEdu, setIsNewEdu] = useState(false);

  // Edit Certification Modal
  const [editingCert, setEditingCert] = useState<CertificationItem | null>(null);
  const [isNewCert, setIsNewCert] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eduRes, certRes] = await Promise.all([
        fetch("/api/education?all=true"),
        fetch("/api/certifications?all=true"),
      ]);

      const eduData = await eduRes.json();
      const certData = await certRes.json();

      if (eduRes.ok) setEducationList(eduData.education || []);
      if (certRes.ok) setCertificationsList(certData.certifications || []);
    } catch {
      setError("Failed to fetch educational and certification records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Toggle Visibility / Posted for Education
  const handleToggleEdu = async (item: EducationItem, field: "is_visible" | "is_posted") => {
    try {
      const updatedVal = !item[field];
      const res = await fetch(`/api/education/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: updatedVal }),
      });

      if (!res.ok) throw new Error();
      setSuccess(`Education ${field === "is_visible" ? "visibility" : "publication"} updated.`);
      setTimeout(() => setSuccess(null), 2500);
      fetchData();
    } catch {
      setError("Failed to update education record status.");
    }
  };

  // Toggle Visibility / Posted for Certifications
  const handleToggleCert = async (item: CertificationItem, field: "is_visible" | "is_posted") => {
    try {
      const updatedVal = !item[field];
      const res = await fetch(`/api/certifications/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: updatedVal }),
      });

      if (!res.ok) throw new Error();
      setSuccess(`Certification ${field === "is_visible" ? "visibility" : "publication"} updated.`);
      setTimeout(() => setSuccess(null), 2500);
      fetchData();
    } catch {
      setError("Failed to update certification status.");
    }
  };

  // Delete Education
  const handleDeleteEdu = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this educational record?")) return;
    try {
      const res = await fetch(`/api/education/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Education record deleted.");
        setTimeout(() => setSuccess(null), 2500);
        fetchData();
      }
    } catch {
      setError("Failed to delete record.");
    }
  };

  // Delete Certification
  const handleDeleteCert = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this certification?")) return;
    try {
      const res = await fetch(`/api/certifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSuccess("Certification record deleted.");
        setTimeout(() => setSuccess(null), 2500);
        fetchData();
      }
    } catch {
      setError("Failed to delete certification.");
    }
  };

  // Save Education (Create or Update)
  const handleSaveEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEdu) return;

    try {
      const method = isNewEdu ? "POST" : "PUT";
      const url = isNewEdu ? "/api/education" : `/api/education/${editingEdu.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingEdu),
      });

      if (!res.ok) throw new Error();
      setSuccess(`Education record ${isNewEdu ? "created" : "updated"} successfully.`);
      setEditingEdu(null);
      setTimeout(() => setSuccess(null), 2500);
      fetchData();
    } catch {
      setError("Failed to save education record.");
    }
  };

  // Save Certification (Create or Update)
  const handleSaveCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCert) return;

    try {
      const method = isNewCert ? "POST" : "PUT";
      const url = isNewCert ? "/api/certifications" : `/api/certifications/${editingCert.id}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCert),
      });

      if (!res.ok) throw new Error();
      setSuccess(`Certification ${isNewCert ? "created" : "updated"} successfully.`);
      setEditingCert(null);
      setTimeout(() => setSuccess(null), 2500);
      fetchData();
    } catch {
      setError("Failed to save certification.");
    }
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        
        {/* Header & Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <GraduationCap className="w-4 h-4" />
              <span>Curriculum & Certification Governance</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Education, Degrees & Technical Credentials
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Fully manage what is visible on the public website and what is posted in the ledger. Control document attachments, ordering, and verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "education" ? (
              <button
                onClick={() => {
                  setEditingEdu({
                    id: "",
                    institution: "",
                    degree: "",
                    field_of_study: "",
                    start_date: "2024-01",
                    end_date: "",
                    grade: "",
                    description: "",
                    skills: [],
                    document_url: "/certificates/Transcript.pdf",
                    is_visible: true,
                    is_posted: true,
                    display_order: educationList.length + 1,
                  });
                  setIsNewEdu(true);
                }}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Degree / Institution</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingCert({
                    id: "",
                    title: "",
                    issuer: "",
                    category: "Artificial Intelligence",
                    issue_date: "2026-07",
                    credential_id: "",
                    credential_url: "",
                    file_url: "/certificates/Advanced Prompt Engineering - Certificate.pdf",
                    verification_status: "VERIFIED",
                    skills: [],
                    is_visible: true,
                    is_posted: true,
                    display_order: certificationsList.length + 1,
                  });
                  setIsNewCert(true);
                }}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Certificate Credential</span>
              </button>
            )}

            <button
              onClick={fetchData}
              className="p-2 rounded border border-border bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Refresh records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-border pb-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab("education")}
            className={`px-4 py-2 rounded-t font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "education"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Academic Degrees & Timeline ({educationList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("certifications")}
            className={`px-4 py-2 rounded-t font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === "certifications"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Professional Certifications & PDFs ({certificationsList.length})</span>
          </button>
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

        {/* TAB 1: ACADEMIC EDUCATION */}
        {activeTab === "education" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {educationList.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest border border-border rounded-xl p-5 shadow-xs space-y-4 transition-all hover:border-border/80"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-on-surface">{item.degree}</h3>
                        {item.grade && (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-primary font-bold border border-primary/20">
                            {item.grade}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-primary font-semibold">{item.institution}</p>
                      <div className="font-mono text-[11px] text-on-surface-variant flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {item.start_date} — {item.end_date || "Present"}
                        </span>
                        {item.field_of_study && <span>· {item.field_of_study}</span>}
                      </div>
                    </div>

                    {/* Quick Toggles: Visible & Posted */}
                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      {/* Visible Toggle */}
                      <button
                        onClick={() => handleToggleEdu(item, "is_visible")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          item.is_visible
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-surface-container text-on-surface-variant/70 border border-border"
                        }`}
                        title="Click to toggle public visibility"
                      >
                        {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{item.is_visible ? "VISIBLE" : "HIDDEN"}</span>
                      </button>

                      {/* Posted Toggle */}
                      <button
                        onClick={() => handleToggleEdu(item, "is_posted")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                          item.is_posted
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                            : "bg-surface-container text-on-surface-variant/70 border border-border"
                        }`}
                        title="Click to toggle posted status"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{item.is_posted ? "POSTED" : "DRAFT"}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingEdu(item);
                          setIsNewEdu(false);
                        }}
                        className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                        title="Edit record details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteEdu(item.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
                      {item.description}
                    </p>
                  )}

                  {/* Skills tags */}
                  {Array.isArray(item.skills) && item.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-border/40"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Attached Document & PDF Preview */}
                  {item.document_url && (
                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="truncate max-w-xs">{item.document_url.split("/").pop()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPreviewPdfUrl(item.document_url);
                            setPreviewTitle(`${item.degree} — ${item.institution}`);
                          }}
                          className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview Document</span>
                        </button>
                        <a
                          href={item.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CERTIFICATIONS */}
        {activeTab === "certifications" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificationsList.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-border/80 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">
                        {item.category}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-[10px]">
                        {/* Visible toggle */}
                        <button
                          onClick={() => handleToggleCert(item, "is_visible")}
                          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                            item.is_visible
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30"
                              : "bg-surface-container text-on-surface-variant/60"
                          }`}
                          title="Toggle visibility"
                        >
                          {item.is_visible ? "VISIBLE" : "HIDDEN"}
                        </button>

                        {/* Posted toggle */}
                        <button
                          onClick={() => handleToggleCert(item, "is_posted")}
                          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                            item.is_posted
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30"
                              : "bg-surface-container text-on-surface-variant/60"
                          }`}
                          title="Toggle posted status"
                        >
                          {item.is_posted ? "POSTED" : "DRAFT"}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingCert(item);
                            setIsNewCert(false);
                          }}
                          className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteCert(item.id)}
                          className="p-1 rounded text-on-surface-variant hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-on-surface">{item.title}</h3>
                      <p className="font-mono text-xs text-primary font-medium">{item.issuer}</p>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] text-on-surface-variant">
                      <span>Date: {item.issue_date || "2026"}</span>
                      {item.credential_id && (
                        <span>ID: <code className="text-on-surface font-semibold">{item.credential_id}</code></span>
                      )}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ {item.verification_status}
                      </span>
                    </div>

                    {/* Skills */}
                    {Array.isArray(item.skills) && item.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-border/40"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Document & Preview Action */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                    <span className="text-on-surface-variant text-[11px] truncate max-w-[150px]">
                      {item.file_url ? item.file_url.split("/").pop() : "No file attached"}
                    </span>
                    {item.file_url && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setPreviewPdfUrl(item.file_url);
                            setPreviewTitle(item.title);
                          }}
                          className="px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview PDF</span>
                        </button>
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                          title="Download / Open file"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: EDIT / CREATE EDUCATION */}
      {editingEdu && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">
                  {isNewEdu ? "Add Academic Education Record" : "Edit Academic Degree Details"}
                </h3>
              </div>
              <button
                onClick={() => setEditingEdu(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEducation} className="space-y-3 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Institution Name</label>
                  <input
                    type="text"
                    required
                    value={editingEdu.institution}
                    onChange={(e) => setEditingEdu({ ...editingEdu, institution: e.target.value })}
                    placeholder="e.g. Chuka University"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Degree Title</label>
                  <input
                    type="text"
                    required
                    value={editingEdu.degree}
                    onChange={(e) => setEditingEdu({ ...editingEdu, degree: e.target.value })}
                    placeholder="e.g. Bachelor of Science in Applied Computer Science"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Field of Study</label>
                  <input
                    type="text"
                    value={editingEdu.field_of_study || ""}
                    onChange={(e) => setEditingEdu({ ...editingEdu, field_of_study: e.target.value })}
                    placeholder="e.g. Applied Computer Science"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Start Date</label>
                  <input
                    type="text"
                    required
                    value={editingEdu.start_date}
                    onChange={(e) => setEditingEdu({ ...editingEdu, start_date: e.target.value })}
                    placeholder="2022-09"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">End Date</label>
                  <input
                    type="text"
                    value={editingEdu.end_date || ""}
                    onChange={(e) => setEditingEdu({ ...editingEdu, end_date: e.target.value })}
                    placeholder="2026-04"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Grade / Honours</label>
                  <input
                    type="text"
                    value={editingEdu.grade || ""}
                    onChange={(e) => setEditingEdu({ ...editingEdu, grade: e.target.value })}
                    placeholder="e.g. Second Class Honours"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Document Attachment URL</label>
                  <input
                    type="text"
                    value={editingEdu.document_url || ""}
                    onChange={(e) => setEditingEdu({ ...editingEdu, document_url: e.target.value })}
                    placeholder="/certificates/Transcript.pdf"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Curriculum & Systems Description</label>
                <textarea
                  rows={3}
                  value={editingEdu.description || ""}
                  onChange={(e) => setEditingEdu({ ...editingEdu, description: e.target.value })}
                  placeholder="Describe key projects, architectural coursework, and achievements..."
                  className="w-full p-3 rounded bg-surface-container-low border border-border text-xs text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editingEdu.skills) ? editingEdu.skills.join(", ") : ""}
                  onChange={(e) =>
                    setEditingEdu({
                      ...editingEdu,
                      skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="PostgreSQL, Systems Architecture, Algorithms, TypeScript"
                  className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={editingEdu.is_visible}
                    onChange={(e) => setEditingEdu({ ...editingEdu, is_visible: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                  <span>Is Visible</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={editingEdu.is_posted}
                    onChange={(e) => setEditingEdu({ ...editingEdu, is_posted: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                  <span>Is Posted</span>
                </label>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span>Order:</span>
                  <input
                    type="number"
                    value={editingEdu.display_order}
                    onChange={(e) => setEditingEdu({ ...editingEdu, display_order: Number(e.target.value) })}
                    className="w-14 h-7 px-2 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setEditingEdu(null)}
                  className="px-3 h-8 rounded border border-border bg-surface-container hover:bg-surface-container-high text-xs text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-8 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT / CREATE CERTIFICATION */}
      {editingCert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">
                  {isNewCert ? "Add Professional Certification" : "Edit Certification Details"}
                </h3>
              </div>
              <button
                onClick={() => setEditingCert(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCertification} className="space-y-3 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Certificate Title</label>
                  <input
                    type="text"
                    required
                    value={editingCert.title}
                    onChange={(e) => setEditingCert({ ...editingCert, title: e.target.value })}
                    placeholder="e.g. Advanced Prompt Engineering Certification"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Issuing Organization</label>
                  <input
                    type="text"
                    required
                    value={editingCert.issuer}
                    onChange={(e) => setEditingCert({ ...editingCert, issuer: e.target.value })}
                    placeholder="e.g. AI Research Guild"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Category</label>
                  <input
                    type="text"
                    value={editingCert.category}
                    onChange={(e) => setEditingCert({ ...editingCert, category: e.target.value })}
                    placeholder="Artificial Intelligence"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Issue Date</label>
                  <input
                    type="text"
                    value={editingCert.issue_date || ""}
                    onChange={(e) => setEditingCert({ ...editingCert, issue_date: e.target.value })}
                    placeholder="2026-07"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Credential ID</label>
                  <input
                    type="text"
                    value={editingCert.credential_id || ""}
                    onChange={(e) => setEditingCert({ ...editingCert, credential_id: e.target.value })}
                    placeholder="APE-2026-9921"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Certificate PDF File Path</label>
                <input
                  type="text"
                  value={editingCert.file_url || ""}
                  onChange={(e) => setEditingCert({ ...editingCert, file_url: e.target.value })}
                  placeholder="/certificates/Advanced Prompt Engineering - Certificate.pdf"
                  className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Skills & Domains (Comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editingCert.skills) ? editingCert.skills.join(", ") : ""}
                  onChange={(e) =>
                    setEditingCert({
                      ...editingCert,
                      skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="System Prompts, LLM Alignment, Few-Shot Evaluation"
                  className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={editingCert.is_visible}
                    onChange={(e) => setEditingCert({ ...editingCert, is_visible: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                  <span>Is Visible</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                  <input
                    type="checkbox"
                    checked={editingCert.is_posted}
                    onChange={(e) => setEditingCert({ ...editingCert, is_posted: e.target.checked })}
                    className="rounded border-border text-primary"
                  />
                  <span>Is Posted</span>
                </label>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span>Order:</span>
                  <input
                    type="number"
                    value={editingCert.display_order}
                    onChange={(e) => setEditingCert({ ...editingCert, display_order: Number(e.target.value) })}
                    className="w-14 h-7 px-2 rounded bg-surface-container-low border border-border text-xs text-on-surface font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="px-3 h-8 rounded border border-border bg-surface-container hover:bg-surface-container-high text-xs text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 h-8 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors cursor-pointer"
                >
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PDF PREVIEW MODAL */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-semibold text-xs text-on-surface truncate">{previewTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-primary text-white text-xs font-mono font-medium flex items-center gap-1 hover:bg-tertiary transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Fullscreen</span>
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="px-2.5 py-1 rounded border border-border bg-surface-container text-xs font-mono text-on-surface hover:bg-surface-container-high cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 bg-surface-container-lowest w-full h-full">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-none"
                title="Document PDF Preview"
              />
            </div>
          </div>
        </div>
      )}

    </CMSLayout>
  );
}
