"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { CMSLayout } from "@/components/CMSLayout";
import { Cpu, Plus, CheckCircle2, Search, Edit2 } from "lucide-react";

export default function CMSSkillsPage() {
  const { skills } = usePortfolio();
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <CMSLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Skills & Competencies Manager
            </h1>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5">
              Maintain domain stacks, proficiency tiers, and evidence linkage counts.
            </p>
          </div>
        </div>

        {/* Categories List */}
        <div className="space-y-6">
          {skills.map((group) => (
            <div
              key={group.category}
              className="bg-surface-container-lowest border border-border rounded-xl p-6 shadow-xs space-y-4"
            >
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-on-surface font-mono uppercase">
                    {group.category}
                  </h2>
                  <p className="text-xs text-on-surface-variant font-mono">{group.description}</p>
                </div>
                <span className="font-mono text-xs text-primary font-semibold">
                  {group.skills.length} competencies
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="p-3 rounded-lg bg-surface-container-low border border-border font-mono text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">{skill.name}</span>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-surface-container text-primary">
                        {skill.level}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2">
                      {skill.description}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-on-surface-variant border-t border-border/50">
                      <span>{skill.evidenceCount} Linked Proofs</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">VERIFIED</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </CMSLayout>
  );
}
