"use client";

import React, { useState, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { CMSLayout } from "@/components/CMSLayout";
import { Save, CheckCircle2, RotateCcw, User, Mail, MapPin, Globe } from "lucide-react";

export default function CMSProfilePage() {
  const { profile, updateProfile, resetAll } = usePortfolio();

  const [formData, setFormData] = useState({ ...profile });
  const [isDirty, setIsDirty] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setFormData({ ...profile });
    }
  }, [profile, isDirty]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setIsDirty(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetForm = () => {
    setFormData({ ...profile });
    setIsDirty(false);
  };

  return (
    <CMSLayout>
      <div className="max-w-4xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Profile & Biographical Settings
            </h1>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Configure identity, contact routing, headline positioning, and social links.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetAll}
              className="px-3 py-1.5 rounded border border-border text-xs font-mono text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Reset all content to original Stitch seed data"
            >
              Reset All Content
            </button>
          </div>
        </div>

        {/* CDN Propagation Toast - Stitch Screen e8245aae9a494eb399ac596c9f148ad7 */}
        {savedSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 font-mono text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold block">Profile Committed & Propagated</span>
                <span className="text-[11px] text-on-surface-variant">
                  Edge CDN cache invalidated across all public routes.
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 uppercase font-semibold">
              Live Updated
            </span>
          </div>
        )}

        {/* Sticky Unsaved Changes Alert Bar - Stitch Screen d91538fbf7be4286a30a6ad2ea49bbd1 */}
        {isDirty && (
          <div className="sticky top-20 z-20 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs font-mono shadow-md backdrop-blur-md">
            <span className="text-amber-700 dark:text-amber-400 font-medium">
              You have unsaved changes in your profile form.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-2.5 py-1 rounded border border-border text-on-surface-variant hover:bg-surface-container"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 rounded bg-primary text-white font-semibold hover:bg-tertiary transition-colors shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSave} className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs text-xs font-mono">
          
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-bold text-on-surface uppercase">Engineer Identity & Channels</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Professional Positioning Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Physical Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Timezone</label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">GitHub Handle / URL</label>
              <input
                type="text"
                value={formData.githubUrl}
                onChange={(e) => handleChange("githubUrl", e.target.value)}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">LinkedIn Profile URL</label>
              <input
                type="text"
                value={formData.linkedinUrl}
                onChange={(e) => handleChange("linkedinUrl", e.target.value)}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          <div className="border-b border-border pb-3 pt-4">
            <h2 className="text-sm font-bold text-on-surface uppercase">Biographical Narrative & Copy</h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-on-surface font-semibold block">Headline Bio (Hero Heading)</label>
            <textarea
              rows={2}
              value={formData.bioHeadline}
              onChange={(e) => handleChange("bioHeadline", e.target.value)}
              className="w-full p-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-on-surface font-semibold block">Supporting Narrative (Hero Subtext)</label>
            <textarea
              rows={3}
              value={formData.bioSub}
              onChange={(e) => handleChange("bioSub", e.target.value)}
              className="w-full p-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded bg-primary text-white font-semibold hover:bg-tertiary transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Commit & Propagate Settings</span>
            </button>
          </div>

        </form>

      </div>
    </CMSLayout>
  );
}
