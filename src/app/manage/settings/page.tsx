"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { CMSLayout } from "@/components/CMSLayout";
import { Settings, Save, CheckCircle2, ShieldAlert } from "lucide-react";

export default function CMSSettingsPage() {
  const { theme, toggleTheme } = usePortfolio();
  const [cacheDuration, setCacheDuration] = useState("3600");
  const [ogTitle, setOgTitle] = useState("Simon Ipara — Software Engineering Portfolio");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <CMSLayout>
      <div className="max-w-4xl space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            System & Deployment Settings
          </h1>
          <p className="text-xs text-on-surface-variant font-mono mt-0.5">
            Configure SEO meta parameters, edge CDN cache invalidations, and security controls.
          </p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings successfully committed.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs text-xs font-mono">
          
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-bold text-on-surface uppercase">SEO & Social Meta</h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-on-surface font-semibold block">Default OpenGraph Title</label>
            <input
              type="text"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="border-b border-border pb-3 pt-4">
            <h2 className="text-sm font-bold text-on-surface uppercase">Edge CDN & Caching</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Edge Cache TTL (seconds)</label>
              <input
                type="number"
                value={cacheDuration}
                onChange={(e) => setCacheDuration(e.target.value)}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-on-surface font-semibold block">Default Workspace Theme</label>
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full h-9 px-3 rounded bg-surface-container-low border border-border text-on-surface font-semibold text-left flex items-center justify-between"
              >
                <span>Current Theme: {theme.toUpperCase()}</span>
                <span className="text-primary text-[11px]">Click to Toggle</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded bg-primary text-white font-semibold hover:bg-tertiary transition-colors shadow-xs"
            >
              Save System Settings
            </button>
          </div>

        </form>

      </div>
    </CMSLayout>
  );
}
