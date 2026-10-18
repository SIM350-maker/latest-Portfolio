"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { CMSLayout } from "@/components/CMSLayout";
import { ArrowLeft, Save, CheckCircle2, ExternalLink } from "lucide-react";

export default function EditProjectClient({ id }: { id: string }) {
  const router = useRouter();
  const { projects, updateProject } = usePortfolio();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const existing = projects.find((p) => p.id === id);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    subtitle: "",
    summary: "",
    category: "Enterprise Full Stack",
    status: "Published" as "Published" | "Draft" | "Archived",
    evidenceAccess: "Public" as "Public" | "Restricted" | "Redacted" | "Unavailable",
    role: "",
    timeline: "",
    technologies: "",
    problem: "",
    solution: "",
    repoUrl: "",
    demoUrl: ""
  });

  useEffect(() => {
    if (existing) {
      setFormData({
        title: existing.title,
        slug: existing.slug,
        subtitle: existing.subtitle || "",
        summary: existing.summary,
        category: existing.category,
        status: existing.status,
        evidenceAccess: existing.evidenceAccess,
        role: existing.role,
        timeline: existing.timeline,
        technologies: existing.technologies.join(", "),
        problem: existing.problem,
        solution: existing.solution,
        repoUrl: existing.repoUrl || "",
        demoUrl: existing.demoUrl || ""
      });
    }
  }, [existing]);

  if (!existing) {
    return (
      <CMSLayout>
        <div className="py-12 text-center space-y-4">
          <p className="text-sm font-mono text-on-surface-variant">Project record not found.</p>
          <Link href="/manage/projects" className="text-primary hover:underline text-xs font-mono">
            Return to Projects Ledger
          </Link>
        </div>
      </CMSLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject(id, {
      title: formData.title,
      slug: formData.slug,
      subtitle: formData.subtitle,
      summary: formData.summary,
      category: formData.category,
      status: formData.status,
      evidenceAccess: formData.evidenceAccess,
      role: formData.role,
      timeline: formData.timeline,
      technologies: formData.technologies.split(",").map((t) => t.trim()).filter(Boolean),
      problem: formData.problem,
      solution: formData.solution,
      repoUrl: formData.repoUrl || undefined,
      demoUrl: formData.demoUrl || undefined
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <CMSLayout>
      <div className="max-w-4xl space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/manage/projects"
              className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-on-surface">
                Edit Case Study: {existing.title}
              </h1>
              <p className="text-xs text-on-surface-variant font-mono">
                Update architectural descriptions, metrics, and publication status.
              </p>
            </div>
          </div>

          <Link
            href={`/projects/${existing.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline"
          >
            <span>View Public Case Study</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Changes successfully committed and synced across public routes.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs text-xs font-mono">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Slug</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-on-surface font-semibold block">Subtitle</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              >
                <option>Enterprise Full Stack</option>
                <option>Distributed Systems</option>
                <option>Mobile / Offline-First</option>
                <option>Security & Cryptography</option>
                <option>Web Applications</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Evidence Access</label>
              <select
                value={formData.evidenceAccess}
                onChange={(e) => setFormData({ ...formData, evidenceAccess: e.target.value as any })}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              >
                <option value="Public">Public</option>
                <option value="Restricted">Restricted</option>
                <option value="Redacted">Redacted</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-on-surface font-semibold block">Summary</label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full p-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-on-surface font-semibold block">Technologies</label>
            <input
              type="text"
              value={formData.technologies}
              onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
              className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Problem</label>
              <textarea
                rows={4}
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                className="w-full p-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Solution</label>
              <textarea
                rows={4}
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                className="w-full p-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Link
              href="/manage/projects"
              className="px-4 py-2 rounded border border-border text-on-surface-variant hover:bg-surface-container"
            >
              Back
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-primary text-white font-semibold hover:bg-tertiary transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Record</span>
            </button>
          </div>

        </form>

      </div>
    </CMSLayout>
  );
}
