"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Shield,
  Zap,
  Clock,
  Globe,
  Loader2,
  AlertCircle,
  Layers,
  Server,
  Database,
  Cloud,
  Bot,
  Compass,
  Code2,
  Cpu,
  ShieldCheck,
  Star,
  BarChart2,
  Target,
  Rocket,
  Check,
  HelpCircle,
} from "lucide-react";

interface ServiceCategory {
  id: number;
  title: string;
  slug: string;
  icon: string;
  description: string;
  long_description: string | null;
}

interface ServicePackage {
  id: number;
  name: string;
  slug: string;
  description: string;
  price_kes: number;
  currency: string;
  billing_cycle: string;
  features: string[];
  highlights: string[];
  cta_text: string;
  is_popular: boolean;
}

interface ServiceFeature {
  id: number;
  title: string;
  description: string;
  icon: string | null;
}

interface ServiceDeliverable {
  id: number;
  title: string;
  description: string | null;
}

interface ServiceTechnology {
  id: number;
  name: string;
}

interface CategoryDetails {
  category: ServiceCategory;
  packages: ServicePackage[];
  features: ServiceFeature[];
  deliverables: ServiceDeliverable[];
  technologies: ServiceTechnology[];
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  Layers, Server, Database, Cloud, Bot, Compass, Code2, Cpu, ShieldCheck, Globe, Zap, Shield, Target, Rocket, Star, BarChart2,
};

function ServiceIcon({ iconName, className = "w-6 h-6" }: { iconName: string; className?: string }) {
  const Icon = SERVICE_ICONS[iconName] || Layers;
  return <Icon className={className} aria-hidden="true" />;
}

function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ServiceCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [data, setData] = useState<CategoryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/services/${slug}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Service track not found");
          throw new Error("Failed to load service details");
        }
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-mono text-on-surface-variant">Loading service track…</p>
          </div>
        </main>
        <Footer />
        <TerminalModal />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-on-surface">Service Track Not Found</h2>
            <p className="text-sm text-on-surface-variant mt-2">{error || "The requested engineering track does not exist."}</p>
            <Link href="/services" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Services Menu
            </Link>
          </div>
        </main>
        <Footer />
        <TerminalModal />
      </div>
    );
  }

  const { category, packages, features, deliverables, technologies } = data;

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb & Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden bg-surface-container-low/60 border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 relative z-10">
            <div className="mb-6">
              <Link href="/services" className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:underline">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Services Menu</span>
              </Link>
            </div>

            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm">
                <ServiceIcon iconName={category.icon} className="w-8 h-8" />
              </div>
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>Engineering Track</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface">
                  {category.title}
                </h1>
                <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-3xl">
                  {category.long_description || category.description}
                </p>
              </div>
            </div>

            {/* Technologies Tag Cloud */}
            {technologies.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border/60 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs uppercase text-on-surface-variant mr-2">Core Tech Stack:</span>
                {technologies.map((t) => (
                  <span key={t.id} className="font-mono text-xs px-2.5 py-1 rounded bg-surface-container text-on-surface border border-border">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Packages & Pricing Tiers */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>Transparent Pricing Subdivisions</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-on-surface mb-3">
                Choose Your Package Tier
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                Clear scope, defined deliverables, and transparent KES pricing. No hidden fees.
              </p>
            </div>

            {packages.length === 0 ? (
              <div className="text-center py-12 bg-surface-container-lowest border border-border rounded-2xl">
                <p className="text-sm text-on-surface-variant">Custom packages available for this track. Request a quote below.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`bg-surface-container-lowest border rounded-2xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative shadow-xs ${
                      pkg.is_popular
                        ? "border-primary ring-2 ring-primary/20 shadow-lg scale-[1.02]"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {pkg.is_popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-mono font-semibold uppercase tracking-wider">
                        Most Popular Choice
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-on-surface">{pkg.name}</h3>
                        <p className="text-xs text-on-surface-variant mt-1.5 min-h-[32px]">{pkg.description}</p>
                      </div>

                      <div className="py-4 border-y border-border">
                        <div className="text-3xl font-extrabold text-on-surface">
                          {formatKES(pkg.price_kes)}
                        </div>
                        <div className="text-xs font-mono text-on-surface-variant mt-0.5">
                          {pkg.billing_cycle === "monthly" ? "Billed monthly" : "Fixed-price milestone delivery"}
                        </div>
                      </div>

                      {/* Highlights */}
                      {pkg.highlights && pkg.highlights.length > 0 && (
                        <div className="space-y-2">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold block">Includes:</span>
                          <ul className="space-y-2">
                            {pkg.highlights.map((h, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs text-on-surface">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Features */}
                      {pkg.features && pkg.features.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border/60">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant block">Technical Specs:</span>
                          <ul className="space-y-1.5">
                            {pkg.features.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="pt-8 mt-6 border-t border-border">
                      <Link
                        href={`/contact?subject=Inquiry: ${category.title} - ${pkg.name} Package`}
                        className={`w-full h-11 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-xs ${
                          pkg.is_popular
                            ? "bg-primary text-white hover:bg-tertiary"
                            : "bg-surface-container border border-border text-on-surface hover:bg-surface-container-high"
                        }`}
                      >
                        <span>{pkg.cta_text || "Select Package"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features & Deliverables Breakdown */}
        {(features.length > 0 || deliverables.length > 0) && (
          <section className="py-16 md:py-24 bg-surface-container-low border-y border-border">
            <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {features.length > 0 && (
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Architectural Capabilities</span>
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface">What is engineered into this track</h3>
                    <div className="space-y-4">
                      {features.map((f) => (
                        <div key={f.id} className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-1.5">
                          <h4 className="font-semibold text-sm text-on-surface">{f.title}</h4>
                          <p className="text-xs text-on-surface-variant leading-relaxed">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {deliverables.length > 0 && (
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Tangible Deliverables</span>
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface">What you receive upon completion</h3>
                    <div className="space-y-4">
                      {deliverables.map((d) => (
                        <div key={d.id} className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-1.5">
                          <h4 className="font-semibold text-sm text-on-surface">{d.title}</h4>
                          {d.description && <p className="text-xs text-on-surface-variant leading-relaxed">{d.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="py-20 text-center">
          <div className="max-w-2xl mx-auto px-4 space-y-6">
            <h2 className="text-3xl font-bold text-on-surface">Need a custom scope or enterprise SLA?</h2>
            <p className="text-sm text-on-surface-variant">Let&apos;s discuss your technical architecture, requirements, and timeline.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors shadow-xs">
                <span>Start a Conversation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-surface-container-low text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors">
                <span>View All Services</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}