"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import {
  Award,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  FileText,
  Download,
  Eye,
  Filter,
  Calendar,
  Building,
  Sparkles,
  Lock
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

export default function CertificationsPage() {
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // PDF Preview Modal
  const [modalPdf, setModalPdf] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [eduRes, certRes] = await Promise.all([
          fetch("/api/education"),
          fetch("/api/certifications"),
        ]);
        const eduData = await eduRes.json();
        const certData = await certRes.json();

        if (eduRes.ok) setEducation(eduData.education || []);
        if (certRes.ok) setCertifications(certData.certifications || []);
      } catch (err) {
        console.error("Error loading education & credentials:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = ["All", ...Array.from(new Set(certifications.map((c) => c.category).filter(Boolean)))];

  const filteredCerts =
    activeCategory === "All"
      ? certifications
      : certifications.filter((c) => c.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-16">
          
          {/* Header Banner */}
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs uppercase tracking-wider font-semibold">
              <Award className="w-4 h-4" />
              <span>Attested Qualifications & Credentials Ledger</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface">
              Education, Degrees & Technical Certifications
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Verifiable academic milestones, institutional degrees, continuous research attestations, and specialized AI/prompt engineering certifications backed by official PDF source documents.
            </p>
            
            {/* Quick Document Download Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-3 font-mono text-xs">
              <button
                onClick={() => setModalPdf({ url: "/certificates/SIMON IPARA CV.pdf", title: "Simon Ipara — Comprehensive CV" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>View Full CV (PDF)</span>
              </button>

              <button
                onClick={() => setModalPdf({ url: "/certificates/Simon Ipara Cover Letter.pdf", title: "Simon Ipara — Professional Cover Letter" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>View Cover Letter (PDF)</span>
              </button>

              <button
                onClick={() => setModalPdf({ url: "/certificates/Transcript.pdf", title: "Chuka University — Official Academic Transcript" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                <span>University Transcript (PDF)</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: ACADEMIC EDUCATION & DEGREES */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  Academic Education & University Degrees
                </h2>
              </div>
              <span className="font-mono text-xs text-on-surface-variant">
                {education.length} Verified {education.length === 1 ? "Record" : "Records"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {education.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 shadow-xs space-y-5 hover:border-primary/50 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-primary/10 text-primary font-bold border border-primary/20">
                          Bachelor of Science
                        </span>
                        {item.grade && (
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {item.grade}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-on-surface group-hover:text-primary transition-colors">
                        {item.degree}
                      </h3>
                      
                      <div className="flex items-center gap-3 font-mono text-xs text-on-surface-variant flex-wrap">
                        <span className="font-semibold text-primary flex items-center gap-1">
                          <Building className="w-3.5 h-3.5" />
                          {item.institution}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.start_date} — {item.end_date || "Present"}
                        </span>
                        {item.field_of_study && (
                          <>
                            <span>·</span>
                            <span>Major: {item.field_of_study}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Document Preview & Download CTA */}
                    {item.document_url && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setModalPdf({ url: item.document_url!, title: `${item.degree} — ${item.institution}` })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Official Transcript</span>
                        </button>
                        <a
                          href={item.document_url}
                          download
                          className="p-2 rounded-lg border border-border bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-sm text-on-surface-variant leading-relaxed max-w-4xl font-sans">
                      {item.description}
                    </p>
                  )}

                  {/* Skills tags */}
                  {Array.isArray(item.skills) && item.skills.length > 0 && (
                    <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">
                        Core Competencies:
                      </span>
                      {item.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container text-on-surface-variant border border-border/50"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 2: VERIFIED PROFESSIONAL CERTIFICATIONS */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  Verified Technical Certifications & Credentials
                </h2>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs text-on-surface-variant mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" />
                  Filter:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`font-mono text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      activeCategory === cat
                        ? "bg-primary text-white font-semibold shadow-xs"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Certifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-surface-container-lowest border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary hover:-translate-y-0.5 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">
                        {cert.category}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        {cert.verification_status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors leading-snug">
                        {cert.title}
                      </h3>
                      <p className="text-xs font-mono text-primary font-semibold">{cert.issuer}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                      <span>Attested: {cert.issue_date || "2026"}</span>
                      {cert.credential_id && (
                        <span>ID: <code className="text-on-surface font-semibold">{cert.credential_id}</code></span>
                      )}
                    </div>

                    {/* Skills tags */}
                    {Array.isArray(cert.skills) && cert.skills.length > 0 && (
                      <div className="pt-2 border-t border-border/60 flex flex-wrap gap-1.5">
                        {cert.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-border/30"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PDF Document Actions */}
                  {cert.file_url && (
                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                      <button
                        onClick={() => setModalPdf({ url: cert.file_url!, title: `${cert.title} — ${cert.issuer}` })}
                        className="inline-flex items-center gap-1.5 text-primary hover:text-tertiary font-semibold cursor-pointer group-hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Certificate</span>
                      </button>

                      <a
                        href={cert.file_url}
                        download
                        className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors"
                        title="Download Certificate PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* PDF Viewer Interactive Modal */}
      {modalPdf && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 border-b border-border bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-semibold text-xs sm:text-sm text-on-surface truncate">
                  {modalPdf.title}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <a
                  href={modalPdf.url}
                  download
                  className="px-2.5 py-1 rounded bg-primary text-white flex items-center gap-1 hover:bg-tertiary transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <a
                  href={modalPdf.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded border border-border bg-surface-container text-on-surface hover:bg-surface-container-high flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Tab</span>
                </a>
                <button
                  onClick={() => setModalPdf(null)}
                  className="px-2.5 py-1 rounded border border-border bg-surface-container text-on-surface hover:bg-surface-container-high cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 bg-surface-container-lowest w-full h-full">
              <iframe
                src={modalPdf.url}
                className="w-full h-full border-none"
                title={modalPdf.title}
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
