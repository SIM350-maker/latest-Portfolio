import React from "react";
import Link from "next/link";
import { Terminal, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6 text-center font-mono text-xs">
      <div className="max-w-md w-full bg-surface-container-lowest border border-border rounded-2xl p-8 shadow-xl space-y-6">
        
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Terminal className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="text-primary font-bold text-sm block">404 — ENTITY NOT FOUND</span>
          <h1 className="text-xl font-bold text-on-surface font-sans">
            The requested route does not exist
          </h1>
          <p className="text-on-surface-variant text-xs leading-relaxed">
            The URL path you entered could not be resolved in the portfolio ledger or CMS routing table.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/projects"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface-container-low text-on-surface text-xs hover:bg-surface-container transition-colors"
          >
            <span>Explore Projects</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
