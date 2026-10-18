"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import { ShieldCheck, Lock, FileText, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Governance & Data Ethics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
              Privacy & Provenance Notice
            </h1>
            <p className="text-sm font-mono text-on-surface-variant">
              Last revised: October 2026 · Standard Engineering Profile Policy
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 space-y-6 shadow-xs text-sm text-on-surface-variant leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-on-surface">1. Scope and Intent</h2>
              <p>
                This engineering portfolio and verifiable evidence ledger is designed to showcase software development capabilities, system architectures, and technical artifacts. Visitors are welcome to review public case studies and submit contact inquiries.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-on-surface">2. Data Collection & Direct Inquiries</h2>
              <p>
                When you submit a message through the Contact Console, the provided name, email address, and message content are transmitted exclusively for the purpose of communicating regarding potential engineering engagements. Your information is never sold, leased, or distributed to marketing third parties.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-on-surface">3. Access Classifications & Evidence Integrity</h2>
              <p>
                All project case studies adhere to explicit privacy boundaries:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-on-surface">Public:</strong> Open-source repositories and publicly attested architectural documentation.</li>
                <li><strong className="text-on-surface">Restricted:</strong> Proprietary client code or cryptographic keys subject to non-disclosure obligations.</li>
                <li><strong className="text-on-surface">Redacted:</strong> Scrubbed production data schemas where sensitive patient or financial information has been mathematically purged.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-on-surface">4. Cookies & Client-Side Storage</h2>
              <p>
                This site utilizes minimal client-side <code className="font-mono text-xs bg-surface-container px-1 py-0.5 rounded text-on-surface">localStorage</code> strictly to persist your theme preference (Light / Dark) and prototype CMS session states. No tracking or profiling cookies are employed.
              </p>
            </section>
          </div>

        </div>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}
