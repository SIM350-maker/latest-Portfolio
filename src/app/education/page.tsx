"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import {
  GraduationCap,
  Award,
  FileText,
  ExternalLink,
  ShieldCheck,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Eye
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
}

export default function PublicEducationPage() {
  const [activeTab, setActiveTab] = useState<"education" | "certifications">("education");
  const [educationList, setEducationList] = useState<EducationItem[]>([]);
  const [certificationsList, setCertificationsList] = useState<CertificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PDF Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eduRes, certRes] = await Promise.all([
        fetch("/api/education"),
        fetch("/api/certifications"),
      ]);

      const eduData = await eduRes.json();
      const certData = await certRes.json();

      if (eduRes.ok) {
        setEducationList(eduData.education || []);
      }
      if (certRes.ok) {
        setCertificationsList(certData.certifications || []);
      }
    } catch {
      setError("Failed to load educational and certification records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-surface-container-low border-b border-border py-12 md:py-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-border text-primary font-mono text-xs uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Academic Degrees, Transcripts & Credentials</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
            Education & Professional Certifications Ledger
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Verified academic background, institutional coursework, and professional certifications with direct access to cryptographic PDFs and official transcripts.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab("education")}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "education"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Academic Degrees ({educationList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("certifications")}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === "certifications"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Professional Certifications ({certificationsList.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-12">
        {loading && (
          <div className="py-20 text-center font-mono text-xs text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Loading verified educational records from database...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: ACADEMIC EDUCATION */}
        {!loading && activeTab === "education" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {educationList.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest border border-border rounded-2xl p-6 sm:p-8 shadow-xs space-y-5 hover:border-border/80 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-xl text-on-surface">{item.degree}</h3>
                        {item.grade && (
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                            {item.grade}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-sm text-primary font-semibold">{item.institution}</p>
                      <div className="font-mono text-xs text-on-surface-variant flex items-center gap-3">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>
                          {item.start_date} — {item.end_date || "Present"}
                        </span>
                        {item.field_of_study && <span>· Field: {item.field_of_study}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                      <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>VERIFIED DEGREE</span>
                      </span>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                      {item.description}
                    </p>
                  )}

                  {/* Skills tags */}
                  {Array.isArray(item.skills) && item.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-xs px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant border border-border/40"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Transcript / Document Action */}
                  {item.document_url && (
                    <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                      <div className="flex items-center gap-2.5 text-on-surface-variant">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Official Transcript & Certificate: <strong className="text-on-surface">{item.document_url.split("/").pop()}</strong></span>
                      </div>
                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            setPreviewPdfUrl(item.document_url);
                            setPreviewTitle(`${item.degree} — ${item.institution}`);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-primary text-white hover:bg-tertiary flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview Document PDF</span>
                        </button>
                        <a
                          href={item.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-lg border border-border bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-primary" />
                          <span>Open File</span>
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
        {!loading && activeTab === "certifications" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certificationsList.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest border border-border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-border/80 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-bold">
                        {item.category}
                      </span>
                      <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1">
                        ✓ {item.verification_status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-on-surface">{item.title}</h3>
                      <p className="font-mono text-xs text-primary font-semibold mt-0.5">{item.issuer}</p>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs text-on-surface-variant">
                      <span>Issued: {item.issue_date || "2026"}</span>
                      {item.credential_id && (
                        <span>ID: <code className="text-on-surface font-semibold">{item.credential_id}</code></span>
                      )}
                    </div>

                    {/* Skills */}
                    {Array.isArray(item.skills) && item.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-border/40"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Document & Preview Action */}
                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs font-mono">
                    <span className="text-on-surface-variant truncate max-w-[180px]">
                      {item.file_url ? item.file_url.split("/").pop() : "Certificate PDF"}
                    </span>
                    {item.file_url && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPreviewPdfUrl(item.file_url);
                            setPreviewTitle(item.title);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview PDF</span>
                        </button>
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded text-on-surface-variant hover:text-primary transition-colors"
                          title="Open PDF"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* PDF PREVIEW MODAL */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm text-on-surface truncate">{previewTitle}</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-tertiary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Fullscreen</span>
                </a>
                <button
                  onClick={() => setPreviewPdfUrl(null)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface-container text-xs font-mono text-on-surface hover:bg-surface-container-high cursor-pointer font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 bg-surface-container-lowest w-full h-full">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-none"
                title="Official Certificate PDF Preview"
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
      <TerminalModal />
    </div>
  );
}
