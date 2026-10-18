"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { CMSLayout } from "@/components/CMSLayout";
import {
  History,
  Plus,
  Search,
  Trash2,
  X,
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function CMSExperiencePage() {
  const { experience, addExperience, deleteExperience } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  const defaultEntry = {
    role: "",
    organization: "",
    location: "Nairobi, Kenya",
    period: "2026 — Present",
    type: "Work" as "Work" | "Education" | "Certification",
    highlights: "",
    skills: ""
  };

  const [newItem, setNewItem] = useState(defaultEntry);

  const filtered = experience.filter(
    (e) =>
      e.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.role || !newItem.organization) return;

    addExperience({
      role: newItem.role,
      organization: newItem.organization,
      location: newItem.location,
      period: newItem.period,
      type: newItem.type,
      highlights: newItem.highlights
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean),
      skills: newItem.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    });

    setShowModal(false);
    setNewItem(defaultEntry);
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate) {
      deleteExperience(deleteCandidate);
      setDeleteCandidate(null);
    }
  };

  const typeIcon = (type: string) => {
    if (type === "Work") return Briefcase;
    if (type === "Education") return GraduationCap;
    return Award;
  };

  return (
    <CMSLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Experience & Timeline Editor
            </h1>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Maintain work, education, and certification records shown on the public timeline.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Experience Entry</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by role, organization, or location..."
              className="w-full h-9 pl-9 pr-4 rounded bg-surface-container-low border border-border text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-hidden focus:border-primary font-mono"
            />
          </div>

          <span className="font-mono text-xs text-on-surface-variant">
            {filtered.length} timeline records
          </span>
        </div>

        {/* Experience Table */}
        <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-surface-container-low text-on-surface-variant text-[11px] uppercase">
                  <th className="py-3 px-4">Role & Organization</th>
                  <th className="py-3 px-4">Record Type</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Highlights</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => {
                  const TypeIcon = typeIcon(item.type);
                  return (
                    <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-on-surface block max-w-xs truncate">{item.role}</span>
                        <span className="text-[10px] text-primary font-medium">{item.organization}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                          <TypeIcon className="w-3 h-3 text-primary" />
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-primary" />
                          {item.period}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          {item.location}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {item.highlights.length} deliverables · {item.skills.length} skills
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDeleteCandidate(item.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 transition-colors"
                          title="Delete Experience Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add Experience Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-border rounded-xl shadow-2xl p-6 sm:p-8 space-y-5 text-xs font-mono max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">Add Experience Entry</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-on-surface font-semibold block">Role / Program *</label>
                  <input
                    type="text"
                    required
                    value={newItem.role}
                    onChange={(e) => setNewItem({ ...newItem, role: e.target.value })}
                    placeholder="e.g. Full Stack Developer"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-on-surface font-semibold block">Organization / Institution *</label>
                  <input
                    type="text"
                    required
                    value={newItem.organization}
                    onChange={(e) => setNewItem({ ...newItem, organization: e.target.value })}
                    placeholder="e.g. Healthcare MIS"
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-on-surface font-semibold block">Record Type</label>
                  <select
                    value={newItem.type}
                    onChange={(e) =>
                      setNewItem({ ...newItem, type: e.target.value as "Work" | "Education" | "Certification" })
                    }
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                  >
                    <option value="Work">Work</option>
                    <option value="Education">Education</option>
                    <option value="Certification">Certification</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-on-surface font-semibold block">Location</label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-on-surface font-semibold block">Period</label>
                <input
                  type="text"
                  value={newItem.period}
                  onChange={(e) => setNewItem({ ...newItem, period: e.target.value })}
                  placeholder="e.g. 2025 — Present"
                  className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                />
                <p className="text-[10px] text-on-surface-variant">
                  Include &quot;Present&quot; for current roles.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-on-surface font-semibold block">Highlights (one per line)</label>
                <textarea
                  rows={4}
                  value={newItem.highlights}
                  onChange={(e) => setNewItem({ ...newItem, highlights: e.target.value })}
                  placeholder={"Engineered ...\nShipped ..."}
                  className="w-full p-2.5 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-on-surface font-semibold block">Skills (comma separated)</label>
                <input
                  type="text"
                  value={newItem.skills}
                  onChange={(e) => setNewItem({ ...newItem, skills: e.target.value })}
                  placeholder="TypeScript, Next.js, PostgreSQL"
                  className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded border border-border text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-primary text-white font-semibold hover:bg-tertiary transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Entry
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest border border-border rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-on-surface">Remove Experience Record?</h3>
                <p className="text-xs text-on-surface-variant font-mono">
                  This entry will be removed from the public experience timeline.
                </p>
              </div>
            </div>

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
