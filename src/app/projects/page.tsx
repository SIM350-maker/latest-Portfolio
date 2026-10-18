"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  X,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal
} from "lucide-react";
import { GithubIcon } from "@/components/Icons";

export default function ProjectsPage() {
  const { projects } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAccess, setSelectedAccess] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(projects.map((p) => p.category)));
    return ["All", ...cats];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.technologies.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory =
        selectedCategory === "All" || p.category === selectedCategory;

      const matchAccess =
        selectedAccess === "All" || p.evidenceAccess === selectedAccess;

      return matchSearch && matchCategory && matchAccess;
    });
  }, [projects, searchTerm, selectedCategory, selectedAccess]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedAccess("All");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="max-w-3xl mb-8 space-y-3">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Catalog & Case Studies</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
              Architectural Systems & Case Studies
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Explore documented engineering projects with verifiable delivery artifacts, architecture diagrams, decision records, and security proofs.
            </p>
          </div>

          {/* Search & Filter Controls Bar */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-4 mb-8 shadow-xs space-y-4">
            
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, technology (e.g. PostgreSQL, TypeScript), or keyword..."
                  className="w-full h-10 pl-9 pr-8 rounded-lg bg-surface-container-low border border-border text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-hidden focus:border-primary font-mono transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View Switcher & Counter */}
              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                <span className="font-mono text-xs text-on-surface-variant">
                  Showing <strong className="text-on-surface">{filteredProjects.length}</strong> of {projects.length}
                </span>

                <div className="flex items-center border border-border rounded-lg p-0.5 bg-surface-container-low">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === "grid" ? "bg-surface-container-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === "list" ? "bg-surface-container-lowest text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category & Access Filter Pills */}
            <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] text-on-surface-variant mr-1 uppercase">Category:</span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors font-mono ${
                      selectedCategory === cat
                        ? "bg-primary text-white font-medium"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-on-surface-variant uppercase">Access:</span>
                {["All", "Public", "Restricted"].map((acc) => (
                  <button
                    key={acc}
                    onClick={() => setSelectedAccess(acc)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      selectedAccess === acc
                        ? "bg-primary text-white font-medium"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {acc}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Results Area */}
          {filteredProjects.length === 0 ? (
            /* No Results State - Stitch screen 11da8b6038714e68bba77d8e194adfa9 */
            <div className="bg-surface-container-lowest border border-dashed border-border rounded-xl p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-on-surface">No matching projects found</h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                No indexed systems match your current filters. Adjust your search keywords or reset category filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* Grid View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-surface-container-lowest border border-border rounded-xl flex flex-col justify-between hover:border-primary hover:-translate-y-0.5 transition-all shadow-xs group"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={project.status} type="publication" />
                      <StatusBadge status={project.evidenceAccess} type="evidence" />
                    </div>

                    <div>
                      <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider block mb-1">
                        {project.category}
                      </span>
                      <h3 className="font-semibold text-lg text-on-surface group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <p className="font-mono text-[11px] text-primary/80 mt-0.5">
                        {project.subtitle}
                      </p>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                      {project.summary}
                    </p>

                    {project.keyMetrics && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                        {project.keyMetrics.slice(0, 2).map((m, idx) => (
                          <div key={idx} className="bg-surface-container-low p-2 rounded">
                            <span className="font-mono text-[10px] text-on-surface-variant block">{m.label}</span>
                            <span className="font-mono font-semibold text-xs text-on-surface">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.technologies.slice(0, 5).map((tech) => (
                        <span
                          key={tech}
                          className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 5 && (
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                          +{project.technologies.length - 5}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-3.5 bg-surface-container-low/50 border-t border-border flex items-center justify-between">
                    <span className="font-mono text-[11px] text-on-surface-variant">
                      {project.timeline}
                    </span>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Case Study</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View Mode - Stitch screen 80966a39b8e34129b87e961e2c12f51d */
            <div className="bg-surface-container-lowest border border-border rounded-xl divide-y divide-border overflow-hidden shadow-xs">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-low/40 transition-colors group"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={project.status} type="publication" />
                      <StatusBadge status={project.evidenceAccess} type="evidence" />
                      <span className="font-mono text-xs text-on-surface-variant">
                        {project.category} · {project.timeline}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {project.summary}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.technologies.map((t) => (
                        <span key={t} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded border border-border bg-surface-container-lowest hover:border-primary text-on-surface-variant transition-colors"
                        title="Repository"
                      >
                        <GithubIcon className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
                    >
                      <span>Read Case Study</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}
