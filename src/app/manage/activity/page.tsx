"use client";

import React from "react";
import { CMSLayout } from "@/components/CMSLayout";
import { History, GitCommit, CheckCircle2, ShieldCheck, UserCheck } from "lucide-react";

export default function CMSActivityPage() {
  const events = [
    {
      id: "act-1",
      action: "GPG Production Promotion",
      detail: "Digest 0x4D76FD attested and deployed to edge CDN nodes",
      user: "Simon Ipara (Admin)",
      timestamp: "Today, 18:24 UTC",
      status: "SUCCESS"
    },
    {
      id: "act-2",
      action: "Project Case Study Updated",
      detail: "Refactored PostgreSQL RLS invariant policies for Healthcare MIS",
      user: "Simon Ipara (Admin)",
      timestamp: "Today, 17:40 UTC",
      status: "COMMITTED"
    },
    {
      id: "act-3",
      action: "Evidence Proof Hash Registered",
      detail: "Added k6 load simulation report (SHA256: 3d2f1b4c...)",
      user: "Simon Ipara (Admin)",
      timestamp: "Yesterday, 21:15 UTC",
      status: "ATTESTED"
    },
    {
      id: "act-4",
      action: "Biographical Settings Synchronized",
      detail: "Updated Nairobi physical base & timezone parameter EAT (UTC+3)",
      user: "Simon Ipara (Admin)",
      timestamp: "Oct 15, 2026",
      status: "PROPAGATED"
    }
  ];

  return (
    <CMSLayout>
      <div className="max-w-4xl space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            System Activity Log & Audit Ledger
          </h1>
          <p className="text-xs text-on-surface-variant font-mono mt-0.5">
            Immutable log of administrative deployments, content revisions, and cryptographic attestations.
          </p>
        </div>

        {/* Activity Feed */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-6 shadow-xs space-y-6">
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="relative pl-6 border-l-2 border-border font-mono text-xs space-y-1.5">
                <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-on-surface text-sm">{event.action}</span>
                  <span className="text-on-surface-variant text-[11px]">{event.timestamp}</span>
                </div>
                <p className="text-on-surface-variant leading-relaxed">{event.detail}</p>
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span className="text-primary font-medium">{event.user}</span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{event.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </CMSLayout>
  );
}
