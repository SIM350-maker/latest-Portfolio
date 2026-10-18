"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { CMSLayout } from "@/components/CMSLayout";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const { addProject } = usePortfolio();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    subtitle: "",
    summary: "",
    category: "Enterprise Full Stack",
    status: "Published" as "Published" | "Draft" | "Archived",
    evidenceAccess: "Public" as "Public" | "Restricted" | "Redacted" | "Unavailable",
    role: "Full-Stack Engineer",
    timeline: "2026",
    featured: false,
    technologies: "TypeScript, Next.js, PostgreSQL",
    repoUrl: "",
    demoUrl: "",
    problem: "",
    solution: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) return;

    addProject({
      title: formData.title,
      slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      subtitle: formData.subtitle,
      summary: formData.summary,
      category: formData.category,
      status: formData.status,
      evidenceAccess: formData.evidenceAccess,
      role: formData.role,
      timeline: formData.timeline,
      featured: formData.featured,
      technologies: formData.technologies.split(",").map((t) => t.trim()).filter(Boolean),
      repoUrl: formData.repoUrl || undefined,
      demoUrl: formData.demoUrl || undefined,
      problem: formData.problem,
      solution: formData.solution,
      evidenceSha: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    });

    router.push("/manage/projects");
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
                Create New Project Record
              </h1>
              <p className="text-xs text-on-surface-variant font-mono">
                Define title, slug, technical stack, problem statement, and publication status.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs text-xs font-mono">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Project Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: formData.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-")
                  });
                }}
                placeholder="e.g. Real-Time Telemetry Dispatcher"
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">URL Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g. telemetry-dispatcher"
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-on-surface font-semibold block">Subtitle / Architectural Classification</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="e.g. Distributed WebSocket Event Broker & Ingestion Pipeline"
              className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Domain Category</label>
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
              <label className="text-on-surface font-semibold block">Publication Status</label>
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
            <label className="text-on-surface font-semibold block">Executive Summary</label>
            <textarea
              rows={3}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="High-level engineering overview of this project..."
              className="w-full p-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-on-surface font-semibold block">Technologies (Comma separated)</label>
            <input
              type="text"
              value={formData.technologies}
              onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
              placeholder="TypeScript, Next.js, PostgreSQL, Docker, Redis"
              className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Problem Statement</label>
              <textarea
                rows={4}
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                placeholder="The technical or business bottleneck being resolved..."
                className="w-full p-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Architectural Solution</label>
              <textarea
                rows={4}
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                placeholder="How the system was designed, decoupled, and deployed..."
                className="w-full p-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <Link
              href="/manage/projects"
              className="px-4 py-2 rounded border border-border text-on-surface-variant hover:bg-surface-container"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-primary text-white font-semibold hover:bg-tertiary transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Publish to Catalog</span>
            </button>
          </div>

        </form>

      </div>
    </CMSLayout>
  );
}
