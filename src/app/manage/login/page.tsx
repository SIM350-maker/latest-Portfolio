"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Terminal, ArrowRight, AlertCircle, CheckCircle2, Loader } from "lucide-react";

export default function CMSLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/manage");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      {/* Login Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-white shadow-lg">
              <Terminal className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-on-surface">
              CMS Authenticated Access
            </h1>
            <p className="text-sm text-on-surface-variant font-mono">
              Registered email credentials required to enter the administration console.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>Credentials verified. Redirecting to CMS dashboard...</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 font-sans">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-on-surface font-mono uppercase tracking-wider">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. simonipara428@gmail.com"
                className="w-full h-10 px-4 rounded-lg bg-surface-container-low border border-border text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-mono"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-on-surface font-mono uppercase tracking-wider">
                Security Passkey
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your passkey"
                  className="w-full h-10 px-4 pr-12 rounded-lg bg-surface-container-low border border-border text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-hidden focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors font-mono"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 cursor-pointer transition-colors"
                  disabled={loading}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-10 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter CMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Info Card */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-on-surface uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Authentication Security
            </div>
            <div className="space-y-2 text-xs text-on-surface-variant font-mono">
              <div className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Only registered email addresses in the database can authenticate.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Credentials must match exactly as recorded by an administrator.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Session tokens are valid for 7 days or until revoked by admin.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>All authentication attempts are logged for security audits.</span>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center space-y-2 text-xs text-on-surface-variant pt-4 border-t border-border">
            <p className="font-mono">
              Not registered yet? Contact{" "}
              <a href="mailto:simonipara428@gmail.com" className="text-primary hover:underline font-semibold">
                Simon Ipara
              </a>
              {" "}for CMS access registration.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-primary hover:text-tertiary transition-colors font-mono font-semibold"
            >
              <span>← Return to Portfolio</span>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
