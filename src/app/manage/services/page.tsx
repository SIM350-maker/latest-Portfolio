"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import {
  Plus,
  Edit3,
  Trash2,
  ArrowLeft,
  Save,
  X,
  GripVertical,
  Eye,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Server,
  Database,
  Cloud,
  Bot,
  Compass,
  Code2,
  Cpu,
  ShieldCheck,
  Globe,
  Zap,
  Shield,
  Target,
  Rocket,
  Star,
  BarChart2,
} from "lucide-react";

const iconComponents: Record<string, React.ElementType> = {
  Layers, Server, Database, Cloud, Bot, Compass, Code2, Cpu, ShieldCheck, Globe, Zap, Shield, Target, Rocket, Star, BarChart2,
};

function IconRenderer({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const Icon = iconComponents[name] || Layers;
  return <Icon className={className} aria-hidden="true" />;
}

interface ServiceCategory {
  id: number;
  title: string;
  slug: string;
  icon: string;
  description: string;
  long_description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ManageServicesPage() {
  const { setTerminalOpen } = usePortfolio();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    icon: "Layers",
    description: "",
    long_description: "",
    display_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const icons = ["Layers", "Server", "Database", "Cloud", "Bot", "Compass", "Code2", "Cpu", "ShieldCheck", "Globe", "Zap", "Shield"];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/manage/services");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = editingId ? `/api/manage/services/${editingId}` : "/api/manage/services";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      await loadCategories();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service category? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/manage/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const openForm = (cat?: ServiceCategory) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({
        title: cat.title,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        long_description: cat.long_description || "",
        display_order: cat.display_order,
        is_active: cat.is_active,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        slug: "",
        icon: "Layers",
        description: "",
        long_description: "",
        display_order: categories.length + 1,
        is_active: true,
      });
    }
    setShowForm(true);
    setError(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      slug: "",
      icon: "Layers",
      description: "",
      long_description: "",
      display_order: 0,
      is_active: true,
    });
  };

  const handleIconChange = (icon: string) => {
    setFormData(prev => ({ ...prev, icon }));
  };

  const IconComponent = icons.find(i => i === formData.icon) ? formData.icon : "Layers";

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <Link href="/manage" className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>CMS Dashboard</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Services Management</h1>
              <p className="text-xs text-on-surface-variant font-mono">
                Manage service categories, pricing packages, and public display
              </p>
            </div>
          </div>

          {/* Error Toast */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-mono p-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 bg-surface-container-lowest border border-border rounded-xl p-4">
            <button
              onClick={() => openForm()}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service Category</span>
            </button>

            <div className="flex-1" />
            <span className="text-xs font-mono text-on-surface-variant">
              {categories.length} categories
            </span>
          </div>

          {/* Categories Table */}
          <div className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs font-mono text-on-surface-variant">Loading…</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center">
                <Plus className="w-12 h-12 mx-auto mb-3 text-on-surface-variant/40" />
                <p className="text-sm text-on-surface-variant">No service categories yet</p>
                <button
                  onClick={() => openForm()}
                  className="mt-3 inline-flex items-center gap-1.5 text-primary text-xs font-semibold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create your first category</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-mono uppercase text-on-surface-variant bg-surface-container">
                      <th className="p-3 w-10">#</th>
                      <th className="p-3">Icon</th>
                      <th className="p-3">Title / Slug</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 w-24">Order</th>
                      <th className="p-3 w-20">Status</th>
                      <th className="p-3 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {categories.map((cat, idx) => (
                      <tr key={cat.id} className="hover:bg-surface-container-low/50">
                        <td className="p-3 text-xs font-mono text-on-surface-variant">{idx + 1}</td>
                        <td className="p-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <IconRenderer name={cat.icon} className="w-4 h-4" />
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-sm text-on-surface">{cat.title}</p>
                          <p className="text-[10px] font-mono text-on-surface-variant">{cat.slug}</p>
                        </td>
                        <td className="p-3 text-xs text-on-surface-variant max-w-xs truncate">{cat.description}</td>
                        <td className="p-3 text-xs font-mono text-on-surface-variant">{cat.display_order}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            cat.is_active
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-surface-container text-on-surface-variant border-border"
                          }`}>
                            {cat.is_active ? "Active" : "Hidden"}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/services/${cat.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                              title="View public page"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => openForm(cat)}
                              className="p-2 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id)}
                              className="p-2 rounded text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
              <div className="bg-surface-container-lowest border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4">
                <div className="sticky top-0 bg-surface-container-lowest border-b border-border rounded-t-2xl p-4 flex items-center justify-between">
                  <h2 className="font-semibold text-on-surface">
                    {editingId ? "Edit Service Category" : "New Service Category"}
                  </h2>
                  <button
                    onClick={closeForm}
                    className="p-2 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-on-surface-variant mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        placeholder="e.g., Full-Stack Web Applications"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-on-surface-variant mb-1">Slug *</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        placeholder="e.g., fullstack"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Icon *</label>
                    <div className="flex flex-wrap gap-2">
                      {icons.map(iconName => {
                        const Icon = iconName as keyof typeof import("lucide-react");
return (
                            <button
                              key={iconName}
                              type="button"
                              onClick={() => handleIconChange(iconName)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-mono transition-colors ${
                                formData.icon === iconName
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-on-surface-variant hover:border-primary/50"
                              }`}
                            >
                              <IconRenderer name={iconName} className="w-4 h-4" />
                              <span>{iconName}</span>
                            </button>
                          );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full h-24 px-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                      placeholder="Short description for cards and listings"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-on-surface-variant mb-1">Long Description</label>
                    <textarea
                      value={formData.long_description}
                      onChange={e => setFormData({ ...formData, long_description: e.target.value })}
                      rows={4}
                      className="w-full h-28 px-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                      placeholder="Detailed description for the service detail page"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-on-surface-variant mb-1">Display Order</label>
                      <input
                        type="number"
                        value={formData.display_order}
                        onChange={e => setFormData({ ...formData, display_order: Number(e.target.value) })}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        min="0"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                          className="w-4 h-4 rounded border-border bg-surface-container-low text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-mono text-on-surface-variant">Active (visible on public site)</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="h-9 px-4 rounded-lg border border-border bg-surface-container-lowest text-xs font-mono text-on-surface hover:border-primary hover:text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{saving ? "Saving…" : (editingId ? "Update" : "Create")}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}