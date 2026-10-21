import React from "react";

export function StatusBadge({
  status,
  type = "evidence"
}: {
  status: string;
  type?: "evidence" | "publication";
}) {
  if (type === "publication") {
    switch (status?.toLowerCase()) {
      case "published":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
            Published
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            Sent
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Approved
          </span>
        );
      case "ready_for_review":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400">
            Ready for Review
          </span>
        );
      case "documents_in_progress":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400">
            Documents in Progress
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400">
            Draft
          </span>
        );
      case "imported":
      case "analyzed":
      case "matched":
      case "new":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            {status.replace("_", " ")}
          </span>
        );
      case "rejected":
      case "failed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
            {status}
          </span>
        );
      case "archived":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border border-gray-400/30 bg-gray-400/10 text-gray-600 dark:text-gray-400">
            {status ? status.replace("_", " ") : "Archived"}
          </span>
        );
    }
  }

  // Evidence access type
  switch (status?.toLowerCase()) {
    case "public":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Public
        </span>
      );
    case "restricted":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Restricted
        </span>
      );
    case "redacted":
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          Redacted
        </span>
      );
    case "unavailable":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Unavailable
        </span>
      );
  }
}
