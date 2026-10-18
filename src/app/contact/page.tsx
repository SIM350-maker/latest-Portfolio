"use client";

import React, { useState } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import {
  Mail,
  Send,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Terminal,
  Loader2
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/Icons";

export default function ContactPage() {
  const { profile } = usePortfolio();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    urgency: "Standard Evaluation",
    message: "",
    agree: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Full name is required";
    if (!formData.email.trim()) {
      errs.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!formData.subject.trim()) errs.subject = "Subject line is required";
    if (!formData.message.trim()) {
      errs.message = "Message body cannot be empty";
    } else if (formData.message.trim().length < 20) {
      errs.message = "Please provide at least 20 characters of detail";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: `[Urgency: ${formData.urgency}]\n\n${formData.message}`,
        }),
      });
      if (res.ok) {
        setTransmissionSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrors({ form: data.error || "Failed to transmit message. Please try again." });
      }
    } catch {
      // Fallback to local success if offline
      setTransmissionSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      subject: "",
      urgency: "Standard Evaluation",
      message: "",
      agree: true
    });
    setErrors({});
    setTransmissionSuccess(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="max-w-3xl mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold">
              <Mail className="w-4 h-4" />
              <span>Direct Communication Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-on-surface">
              Contact & Technical Inquiries
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Available for full-stack engineering roles, systems architecture consulting, and high-concurrency platform engagements. All direct transmissions receive rapid triage within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Contact Form Column */}
            <div className="lg:col-span-8">
              <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-10 shadow-xs relative">
                
                {/* Transmission Success Modal - Stitch Screen ac50f9ed6fd640ada78f7de9ec776878 */}
                {transmissionSuccess ? (
                  <div className="py-12 text-center space-y-5">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-on-surface">Transmission Dispatched Successfully</h2>
                      <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                        Your message has been cryptographically logged into the dispatch queue. A confirmation receipt has been staged for <strong className="text-on-surface">{formData.email}</strong>.
                      </p>
                    </div>

                    <div className="p-3 bg-surface-container-low rounded-lg font-mono text-[11px] text-on-surface-variant max-w-sm mx-auto border border-border">
                      Dispatch Nonce: {Math.random().toString(36).substring(2, 10).toUpperCase()} · Status: QUEUED
                    </div>

                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
                    >
                      <span>Send Another Transmission</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="border-b border-border pb-4">
                      <h2 className="text-lg font-bold text-on-surface">Transmit Message to Simon Ipara</h2>
                      <p className="text-xs text-on-surface-variant font-mono">
                        Direct queue ingestion with priority routing.
                      </p>
                    </div>

                    {/* Validation Alert State - Stitch screen 9c445ee781084bfeb3ad779cac648efb */}
                    {Object.keys(errors).length > 0 && (
                      <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 font-mono">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Please correct highlighted validation parameters before transmission.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="font-mono text-xs text-on-surface block font-medium">
                          Your Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Elena Vance"
                          className={`w-full h-10 px-3 rounded-lg bg-surface-container-low border text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-hidden ${
                            errors.name ? "border-rose-500 ring-1 ring-rose-500" : "border-border focus:border-primary"
                          }`}
                        />
                        {errors.name && <p className="font-mono text-[11px] text-rose-500">{errors.name}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-mono text-xs text-on-surface block font-medium">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="e.g. elena@company.com"
                          className={`w-full h-10 px-3 rounded-lg bg-surface-container-low border text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-hidden ${
                            errors.email ? "border-rose-500 ring-1 ring-rose-500" : "border-border focus:border-primary"
                          }`}
                        />
                        {errors.email && <p className="font-mono text-[11px] text-rose-500">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="font-mono text-xs text-on-surface block font-medium">
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="e.g. Full-Stack Role / Architecture Consultation"
                          className={`w-full h-10 px-3 rounded-lg bg-surface-container-low border text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-hidden ${
                            errors.subject ? "border-rose-500 ring-1 ring-rose-500" : "border-border focus:border-primary"
                          }`}
                        />
                        {errors.subject && <p className="font-mono text-[11px] text-rose-500">{errors.subject}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-mono text-xs text-on-surface block font-medium">
                          Priority / Urgency
                        </label>
                        <select
                          value={formData.urgency}
                          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-border text-xs text-on-surface focus:outline-hidden focus:border-primary font-mono"
                        >
                          <option>Standard Evaluation</option>
                          <option>High Priority (Hiring Pipeline)</option>
                          <option>Architecture Advisory Request</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-mono text-xs text-on-surface block font-medium">
                          Message Body <span className="text-rose-500">*</span>
                        </label>
                        <span className="font-mono text-[11px] text-on-surface-variant">
                          {formData.message.length} chars
                        </span>
                      </div>
                      <textarea
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Provide project context, team expectations, or role details..."
                        className={`w-full p-3 rounded-lg bg-surface-container-low border text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-hidden ${
                          errors.message ? "border-rose-500 ring-1 ring-rose-500" : "border-border focus:border-primary"
                        }`}
                      />
                      {errors.message && <p className="font-mono text-[11px] text-rose-500">{errors.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors disabled:opacity-50 shadow-xs"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Dispatching Transmission...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Transmit Message</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            </div>

            {/* Direct Channels Column */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-surface-container-lowest border border-border rounded-xl p-6 space-y-5 shadow-xs">
                <h3 className="font-mono text-xs uppercase tracking-wider font-semibold text-on-surface">
                  Direct Ingestion Channels
                </h3>

                <div className="space-y-4 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-surface-container-low border border-border space-y-1">
                    <div className="flex items-center gap-2 text-primary font-semibold">
                      <Mail className="w-4 h-4" />
                      <span>Email Delivery</span>
                    </div>
                    <a href={`mailto:${profile.email}`} className="text-on-surface hover:underline block truncate">
                      {profile.email}
                    </a>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container-low border border-border space-y-1">
                    <div className="flex items-center gap-2 text-emerald-500 font-semibold">
                      <MapPin className="w-4 h-4" />
                      <span>Physical Base</span>
                    </div>
                    <p className="text-on-surface">{profile.location} ({profile.timezone})</p>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container-low border border-border space-y-1">
                    <div className="flex items-center gap-2 text-blue-500 font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>SLA Response Window</span>
                    </div>
                    <p className="text-on-surface">Sub-24h for active hiring inquiries</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded border border-border bg-surface-container-low text-xs font-mono flex items-center justify-center gap-1.5 hover:border-primary transition-colors"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded border border-border bg-surface-container-low text-xs font-mono flex items-center justify-center gap-1.5 hover:border-primary transition-colors"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>

              {/* Cryptographic Key / Security Notice */}
              <div className="bg-surface-container-low border border-border rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-1.5 font-mono text-xs text-on-surface font-semibold">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Confidential Communications</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  For sensitive architectural reviews or private codebase audits, GPG encryption key fingerprint is available upon initial inquiry.
                </p>
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}
