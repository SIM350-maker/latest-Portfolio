"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Layers,
  Server,
  Database,
  Cloud,
  Bot,
  Compass,
  CheckCircle2,
  ArrowRight,
  Code2,
  Cpu,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Zap,
  Star,
  CreditCard,
  Users,
  Clock,
  Award,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  Smartphone,
  Building2,
  BarChart2,
  Target,
  Rocket,
  Shield,
  Globe,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/Icons";

interface ServiceCategory {
  id: number;
  title: string;
  slug: string;
  icon: string;
  description: string;
  long_description: string | null;
  display_order: number;
  is_active: boolean;
}

interface ServicePackage {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price_kes: number;
  currency: string;
  billing_cycle: "one_time" | "monthly" | "quarterly" | "yearly";
  features: string[];
  highlights: string[];
  cta_text: string;
  cta_url: string | null;
  is_popular: boolean;
  is_active: boolean;
}

interface EngagementModel {
  id: number;
  title: string;
  slug: string;
  description: string;
  features: string[];
  icon: string | null;
  display_order: number;
}

interface PricingFAQ {
  id: number;
  question: string;
  answer: string;
}

interface HomepageData {
  categories: ServiceCategory[];
  packages: ServicePackage[];
  engagementModels: EngagementModel[];
  faqs: PricingFAQ[];
}

function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function billingCycleLabel(cycle: string): string {
  const labels: Record<string, string> = {
    one_time: "One-time",
    monthly: "/month",
    quarterly: "/quarter",
    yearly: "/year",
  };
  return labels[cycle] || cycle;
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
      <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function DrillDownButton({
  href,
  children,
  variant = "primary",
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  external?: boolean;
}) {
  const variants = {
    primary: "inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors",
    outline: "inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-primary/30 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 hover:border-primary/60 transition-colors",
    ghost: "inline-flex items-center gap-2 h-10 px-5 rounded-lg text-primary text-sm font-semibold hover:bg-primary/5 transition-colors",
  };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={variants[variant]}>
        <span>{children}</span>
        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
      </a>
    );
  }
  return (
    <Link href={href} className={variants[variant]}>
      <span>{children}</span>
      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
    </Link>
  );
}

function IconRenderer({ iconName, className = "w-5 h-5" }: { iconName: string; className?: string }) {
  const icons: Record<string, React.ElementType> = {
    Layers, Server, Database, Cloud, Bot, Compass, Code2, Cpu, ShieldCheck, Globe, Zap, Shield, Target, Rocket, Star, BarChart2,
  };
  const Icon = icons[iconName] || Layers;
  return <Icon className={className} aria-hidden="true" />;
}

function CategoryCard({ category, index }: { category: ServiceCategory; index: number }) {
  return (
    <motion.article
      className="group bg-surface-container-lowest border border-border rounded-2xl p-6 md:p-8 hover:border-primary/50 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/20 group-hover:scale-105 transition-transform duration-300">
          <IconRenderer iconName={category.icon} className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">{category.title}</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed mt-1">{category.description}</p>
        </div>
      </div>

      <DrillDownButton href={`/services/${category.slug}`} variant="outline">
        View packages & details
      </DrillDownButton>
    </motion.article>
  );
}

function PackageCard({ pkg, categorySlug }: { pkg: ServicePackage; categorySlug: string }) {
  const isPopular = pkg.is_popular;
  
  return (
    <motion.article
      className={`relative bg-surface-container-lowest border rounded-2xl p-6 md:p-8 transition-all duration-300 ${
        isPopular
          ? "border-primary/50 shadow-xl shadow-primary/10 ring-2 ring-primary/20"
          : "border-border hover:border-primary/50 hover:shadow-lg"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">
            <Star className="w-3 h-3" />
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-bold text-on-surface">{pkg.name}</h3>
        <p className="text-sm text-on-surface-variant mt-1">{pkg.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold text-on-surface">{formatKES(pkg.price_kes)}</span>
          <span className="text-sm text-on-surface-variant font-mono">{billingCycleLabel(pkg.billing_cycle)}</span>
        </div>
        <p className="text-xs text-on-surface-variant">Starting price</p>
      </div>

      <ul className="space-y-2 mb-6">
        {pkg.features.slice(0, 6).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-on-surface-variant">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
        {pkg.features.length > 6 && (
          <li className="text-xs text-primary font-medium">+ {pkg.features.length - 6} more features</li>
        )}
      </ul>

      <div className="pt-4 border-t border-border">
        <DrillDownButton 
          href={`/services/${categorySlug}#${pkg.slug}`}
          variant={isPopular ? "primary" : "outline"}
        >
          {pkg.cta_text || "Get Started"}
        </DrillDownButton>
      </div>
    </motion.article>
  );
}

function EngagementCard({ model, index }: { model: EngagementModel; index: number }) {
  const icons: Record<string, React.ElementType> = {
    Layers, Compass, ShieldCheck, Code2, Cpu, Shield, Target, Rocket,
  };
  const Icon = model.icon ? icons[model.icon] || Compass : Compass;

  return (
    <motion.article
      className="bg-surface-container-lowest border border-border rounded-2xl p-6 md:p-8 hover:border-primary/50 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-base text-on-surface">{model.title}</h3>
          <p className="text-xs text-on-surface-variant mt-1">{model.description}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {model.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-on-surface-variant">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

function FAQItem({ faq, index }: { faq: PricingFAQ; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.details
      className="group bg-surface-container-lowest border border-border rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
        <span className="font-semibold text-sm text-on-surface pr-10">{faq.question}</span>
        <motion.span
          className="text-primary"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.span>
      </summary>
      <div className="px-5 pb-5 text-sm text-on-surface-variant leading-relaxed">
        {faq.answer}
      </div>
    </motion.details>
  );
}

function QuoteForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    service: "",
    budget: "",
    timeline: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubmitted(true);
      setFormData({ name: "", email: "", company: "", service: "", budget: "", timeline: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-emerald-600 mb-2">Quote Request Sent!</h3>
        <p className="text-emerald-600/80">I'll review your requirements and get back within 4 business hours with a tailored proposal.</p>
        <button onClick={() => { setSubmitted(false); setStep(1); }} className="mt-6 inline-flex items-center gap-2 text-primary font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Request another quote
        </button>
      </motion.div>
    );
  }

  const steps = [
    { label: "Your Details", fields: ["name", "email", "company"] },
    { label: "Project Scope", fields: ["service", "budget", "timeline"] },
    { label: "Details", fields: ["message"] },
  ];

  return (
    <motion.div className="bg-surface-container-lowest border border-border rounded-2xl p-6 md:p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="flex items-center gap-2">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  i + 1 < step ? "bg-primary text-white" : i + 1 === step ? "bg-primary/10 text-primary border border-primary" : "bg-surface-container text-on-surface-variant/50"
                }`}
                animate={{ scale: i + 1 === step ? 1.1 : 1 }}
              >
                {i + 1 < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </motion.div>
              <span className="hidden sm:block text-xs font-mono text-on-surface-variant">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <motion.div
                className={`hidden md:block h-1 flex-1 rounded transition-colors ${
                  i + 1 < step ? "bg-primary" : "bg-border"
                }`}
                animate={{ width: i + 1 < step ? "100%" : "0%" }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="name" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-10 px-4 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" required />
                <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-10 px-4 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" required />
                <input name="company" placeholder="Company / Organization" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="h-10 px-4 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" />
              </div>
            )}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select name="service" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})} className="h-10 px-4 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" required>
                  <option value="">Select Service</option>
                  <option value="fullstack">Full-Stack Web Applications</option>
                  <option value="backend">Backend APIs & Microservices</option>
                  <option value="database">Database Architecture & Security</option>
                  <option value="cloud">Cloud, DevOps & Reliability</option>
                  <option value="ai">AI Integration & Automation</option>
                  <option value="consulting">Technical Consulting & Reviews</option>
                  <option value="custom">Custom / Not Sure</option>
                </select>
                <select name="budget" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} className="h-10 px-4 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" required>
                  <option value="">Budget Range (KES)</option>
                  <option value="150k-300k">150K – 300K</option>
                  <option value="300k-500k">300K – 500K</option>
                  <option value="500k-1m">500K – 1M</option>
                  <option value="1m-3m">1M – 3M</option>
                  <option value="3m+">3M+</option>
                </select>
                <select name="timeline" value={formData.timeline} onChange={e => setFormData({...formData, timeline: e.target.value})} className="h-10 px-4 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" required>
                  <option value="">Desired Timeline</option>
                  <option value="asap">ASAP</option>
                  <option value="1-2-months">1–2 Months</option>
                  <option value="3-6-months">3–6 Months</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <textarea name="message" placeholder="Describe your project, goals, challenges, and any specific requirements..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows={6} className="w-full px-4 py-3 rounded-lg border border-border bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none" required />
                <p className="text-xs text-on-surface-variant/70">Include: current stack, team size, must-have features, compliance needs, and any existing infrastructure.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p className="text-red-600 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            {error}
          </motion.p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Your data is encrypted and never shared. GDPR/POPIA compliant.</span>
          </div>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => s - 1)} className="h-10 px-5 rounded-lg border border-border bg-surface-container-lowest text-sm font-medium text-on-surface hover:border-primary hover:text-primary transition-colors">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </button>
            )}
            {step < steps.length ? (
              <button type="button" onClick={() => setStep(s => s + 1)} className="h-10 px-5 rounded-lg border border-primary/30 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 hover:border-primary/60 transition-colors">
                Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 h-10 px-6 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{submitting ? "Sending…" : "Submit Request"}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
}

export default function ServicesPage() {
  const { profile, setTerminalOpen } = usePortfolio();
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [categoriesRes, packagesRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/services/packages"),
        ]);
        
        if (!categoriesRes.ok || !packagesRes.ok) throw new Error("Failed to load");
        
        const categoriesData = await categoriesRes.json();
        const packagesData = await packagesRes.json();
        
        if (!cancelled) {
          setData({
            categories: categoriesData.categories || [],
            packages: packagesData.packages || [],
            engagementModels: packagesData.engagementModels || [],
            faqs: packagesData.faqs || [],
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-mono text-on-surface-variant">Loading services…</p>
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
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-on-surface">Unable to load services</h2>
            <p className="text-sm text-on-surface-variant mt-2">{error}</p>
            <Link href="/about" className="mt-4 inline-flex items-center gap-2 text-primary font-semibold hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to About
            </Link>
          </div>
        </main>
        <Footer />
        <TerminalModal />
      </div>
    );
  }

  const { categories, engagementModels, faqs } = data;

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-[1080px] mx-auto px-4 sm:px-6 text-center">
            <motion.div
              className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Services & Engagement Models</span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface mb-6 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Engineering partnerships <br />
              <span className="text-primary">that scale</span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-on-surface-variant leading-relaxed max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Six service categories. Transparent Kenyan pricing. Proven delivery discipline.
              Pick a package, choose an engagement model, or request a custom quote.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <DrillDownButton href="#quote">
                <Rocket className="w-4 h-4" />
                <span>Request a Quote</span>
              </DrillDownButton>
              <DrillDownButton href="/contact" variant="outline">
                <MessageSquare className="w-4 h-4" />
                <span>Start a Conversation</span>
              </DrillDownButton>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-8 mt-16 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-on-surface">RLS Security</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-semibold text-on-surface">WCAG 2.2 AA</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-on-surface">Kenya + Global</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-on-surface">{"<4hr SLA"}</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories Overview */}
        <section className="py-16 md:py-24" id="categories">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionEyebrow>Service Categories</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-bold text-on-surface mb-4">
                Choose your engineering track
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                Each category includes multiple pricing tiers (Starter / Professional / Enterprise)
                so you only pay for what you need.
              </p>
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            >
              {categories.map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} />
              ))}
            </motion.div>

            <div className="text-center mt-10">
              <DrillDownButton href="/services" variant="outline">
                View all categories & detailed comparisons
              </DrillDownButton>
            </div>
          </div>
        </section>

        {/* Featured Category Deep Dive */}
        {data.categories.length > 0 && (
          <section className="py-16 md:py-24 bg-surface-container-low border-y border-border" id="featured">
            <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
              {categories.slice(0, 2).map((cat) => {
                // We'll need to fetch packages for each category - for now show placeholder
                return (
                  <motion.div key={cat.id} className="mb-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-8">
                      <div className="space-y-2">
                        <SectionEyebrow>{cat.title}</SectionEyebrow>
                        <h3 className="text-2xl sm:text-3xl font-bold text-on-surface flex items-center gap-3">
                          <IconRenderer iconName={cat.icon} className="w-6 h-6 text-primary" />
                          {cat.title}
                        </h3>
                        <p className="text-on-surface-variant max-w-xl">{cat.long_description || cat.description}</p>
                      </div>
                      <DrillDownButton href={`/services/${cat.slug}`} variant="outline">
                        View all packages
                      </DrillDownButton>
                    </div>

                    {/* Packages will be loaded via the category detail page */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-surface-container-lowest border border-border rounded-2xl p-6 text-center">
                        <IconRenderer iconName={cat.icon} className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h4 className="font-semibold text-on-surface mb-2">{cat.title} Packages</h4>
                        <p className="text-sm text-on-surface-variant mb-4">Starter • Professional • Enterprise tiers with transparent KES pricing</p>
                        <DrillDownButton href={`/services/${cat.slug}`} variant="outline">
                          Explore packages
                        </DrillDownButton>
                      </div>
                      <div className="bg-surface-container-lowest border border-border rounded-2xl p-6 text-center">
                        <EngagementModelIcon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h4 className="font-semibold text-on-surface mb-2">Engagement Models</h4>
                        <p className="text-sm text-on-surface-variant mb-4">Fixed-scope, Monthly Retainer, or Fractional CTO</p>
                        <DrillDownButton href={`/services/${cat.slug}`} variant="outline">
                          See models
                        </DrillDownButton>
                      </div>
                      <div className="bg-surface-container-lowest border border-border rounded-2xl p-6 text-center">
                        <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                        <h4 className="font-semibold text-on-surface mb-2">Typical Timelines</h4>
                        <p className="text-sm text-on-surface-variant mb-4">2 weeks to 6 months depending on scope</p>
                        <DrillDownButton href={`/services/${cat.slug}`} variant="outline">
                          View details
                        </DrillDownButton>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Engagement Models */}
        <section className="py-16 md:py-24" id="engagement">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionEyebrow>Engagement Models</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-bold text-on-surface mb-4">
                How we work together
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                Flexible models designed for Kenyan businesses — from one-off projects to ongoing partnerships.
              </p>
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
            >
              {engagementModels.map((model, i) => (
                <EngagementCard key={model.id} model={model} index={i} />
              ))}
            </motion.div>
          </div>
        </section>

        {/* Payment Methods */}
        <section className="py-16 md:py-24 bg-surface-container-low border-y border-border">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionEyebrow>Payment & Terms</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-bold text-on-surface mb-4">
                Flexible payment for Kenyan businesses
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PaymentMethodCard icon={Smartphone} title="M-Pesa" description="Instant mobile money payments via Safaricom. Paybill or Till Number available." />
              <PaymentMethodCard icon={Building2} title="Bank Transfer" description="Direct deposit to our KCB/Equity accounts. Corporate references provided." />
              <PaymentMethodCard icon={CreditCard} title="Card / Stripe" description="International cards via Stripe. Secure, instant, with receipts." />
            </div>

            <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-2xl">
              <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Payment Terms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-on-surface-variant">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>{"30/40/30 milestone splits for projects > KES 500K"}</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Monthly retainers billed in advance</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>VAT inclusive pricing (16% Kenya VAT)</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Withholding tax certificates provided</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Request Form */}
        <section className="py-16 md:py-24" id="quote">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionEyebrow>Get a Custom Quote</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-bold text-on-surface mb-4">
                Ready to scope your project?
              </h2>
              <p className="text-on-surface-variant leading-relaxed max-w-xl mx-auto">
                Answer a few questions and I'll send a detailed proposal with timeline, pricing,
                and engagement model recommendation within 4 business hours.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <QuoteForm />
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24 bg-surface-container-low border-y border-border">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <SectionEyebrow>Frequently Asked Questions</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-bold text-on-surface mb-4">
                Everything you need to know
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {faqs.map((faq, i) => (
                <FAQItem key={faq.id} faq={faq} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 text-center">
            <motion.div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl sm:text-4xl font-bold text-on-surface mb-4">
                Let's build something reliable
              </h2>
              <p className="text-on-surface-variant max-w-xl mx-auto mb-8">
                I'm interested in engagements where architectural discipline matters —
                production systems that scale, backend platforms with tight operational
                requirements, or greenfield services that need robust foundations.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <DrillDownButton href="/contact" variant="primary">
                  <Send className="w-4 h-4" />
                  <span>Start a Conversation</span>
                </DrillDownButton>
                <DrillDownButton href="/about" variant="outline">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Profile</span>
                </DrillDownButton>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}

function EngagementModelIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function PaymentMethodCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <motion.div className="bg-surface-container-lowest border border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-all duration-300" whileHover={{ y: -4 }}>
      <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>
      <h4 className="font-semibold text-base text-on-surface mb-2">{title}</h4>
      <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
    </motion.div>
  );
}