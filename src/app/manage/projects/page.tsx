"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { CMSLayout } from "@/components/CMSLayout";
import { StatusBadge } from "@/components/StatusBadge";
import {
  FolderGit2,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  AlertTriangle,
  X,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function CMSProjectsPage() {
  const { projects, updateProject, deleteProject } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (id: string, newStatus: "Published" | "Draft" | "Archived") => {
    updateProject(id, { status: newStatus });
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate) {
      deleteProject(deleteCandidate);
      setDeleteCandidate(null);
    }
  };

  return (
    <CMSLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Projects & Case Studies Manager
            </h1>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Manage portfolio case studies, publication lifecycles, and linked evidence items.
            </p>
          </div>

          <Link
            href="/manage/projects/new"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Project</span>
          </Link>
        </div>

        {/* Filter bar */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects by title, slug, or domain..."
              className="w-full h-9 pl-9 pr-4 rounded bg-surface-container-low border border-border text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-hidden focus:border-primary font-mono"
            />
          </div>

          <span className="font-mono text-xs text-on-surface-variant">
            {filtered.length} indexed records
          </span>
        </div>

        {/* Projects Table */}
        <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-surface-container-low text-on-surface-variant text-[11px] uppercase">
                  <th className="py-3 px-4">Title & Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Lifecycle Status</th>
                  <th className="py-3 px-4">Evidence Access</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((project) => (
                  <tr key={project.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/manage/projects/${project.id}`}
                        className="font-bold text-sm text-on-surface hover:text-primary transition-colors block"
                      >
                        {project.title}
                      </Link>
                      <span className="text-[10px] text-on-surface-variant">/projects/{project.slug}</span>
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">{project.category}</td>
                    <td className="py-3 px-4">
                      <select
                        value={project.status}
                        onChange={(e) =>
                          handleStatusChange(
                            project.id,
                            e.target.value as "Published" | "Draft" | "Archived"
                          )
                        }
                        className="h-7 px-2 rounded bg-surface-container-low border border-border text-xs font-mono focus:outline-hidden focus:border-primary"
                      >
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={project.evidenceAccess} type="evidence" />
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">{project.timeline}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        href="/evidence"
                        target="_blank"
                        className="p-1.5 inline-block text-primary hover:text-tertiary"
                        title="View Evidence"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/manage/projects/${project.id}`}
                        className="p-1.5 inline-block text-on-surface-variant hover:text-on-surface"
                        title="Edit Project"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setDeleteCandidate(project.id)}
                        className="p-1.5 inline-block text-rose-500 hover:text-rose-700"
                        title="Archive / Remove Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Archive & Delete Confirmation Modal - Stitch Screen 9aa111314db4415db0637935214f1404 */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest border border-border rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-on-surface">Archive Project from Catalog?</h3>
                <p className="text-xs text-on-surface-variant font-mono">
                  This will unpublish the case study and purge linked references from public routes.
                </p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant font-mono bg-surface-container-low p-3 rounded border border-border">
              Action cannot be reverted automatically without re-importing the project seed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-1.5 rounded border border-border text-xs font-mono hover:bg-surface-container text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded bg-rose-600 text-white text-xs font-mono font-semibold hover:bg-rose-700 transition-colors"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}
    </CMSLayout>
  );
}
