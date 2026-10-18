"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Terminal, Lock, ShieldCheck, AlertCircle, CheckCircle2, UserCheck, Eye, EyeOff } from "lucide-react";

export default function CMSLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("simonipara428@gmail.com");
  const [password, setPassword] = useState("Admin@2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        setError(data.error || "Authentication failed. Access denied.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/manage");
        router.refresh();
      }, 600);
    } catch (err) {
      setError("Network or authentication server error occurred.");
      setLoading(false);
    }
  };

  const handleQuickFill = (fillEmail: string) => {
    setEmail(fillEmail);
    setPassword("Admin@2026!");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 font-mono text-xs">
      <div className="w-full max-w-md bg-surface-container-lowest border border-border rounded-xl p-8 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white mx-auto shadow-md">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-on-surface">CMS Security Console</h1>
          <p className="text-on-surface-variant text-[11px] max-w-xs mx-auto">
            Authorized Engineer Access · Verified Email & Scrypt Passkey Required
          </p>
        </div>

        {/* Security Policy Badge */}
        <div className="p-3 rounded-lg bg-surface-container-low border border-border/80 text-[11px] text-on-surface-variant space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Access Policy Notice</span>
          </div>
          <p className="leading-relaxed">
            The CMS console is strictly restricted to pre-registered and active database emails. Unregistered emails are rejected at engine level.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Success Notification */}
        {success && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Identity confirmed. Opening CMS Workspace...</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-on-surface block font-semibold flex items-center justify-between">
              <span>Registered Engineer Email</span>
              <span className="text-[10px] text-primary">Database Verified</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-10 px-3 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-on-surface block font-semibold flex items-center justify-between">
              <span>Security Passkey</span>
              <span className="text-[10px] text-on-surface-variant">Scrypt-64 Key</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-10 px-3 pr-10 rounded bg-surface-container-low border border-border text-on-surface focus:outline-hidden focus:border-primary text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full h-10 rounded bg-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-tertiary transition-colors disabled:opacity-50 shadow-sm text-xs cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? "Verifying Credentials in Neon DB..." : "Authenticate & Enter CMS"}</span>
          </button>
        </form>

        {/* Pre-registered quick access helpers */}
        <div className="pt-2 border-t border-border space-y-2">
          <span className="text-[10px] uppercase tracking-wider text-on-surface-variant block font-semibold">
            Registered Owner Accounts:
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill("simonipara428@gmail.com")}
              className="w-full px-2.5 py-1.5 rounded bg-surface-container text-left hover:bg-surface-container-high transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                <span className="text-on-surface font-medium truncate">simonipara428@gmail.com</span>
              </div>
              <span className="text-[10px] text-primary group-hover:underline">Fill & Login</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("simonipash@gmail.com")}
              className="w-full px-2.5 py-1.5 rounded bg-surface-container text-left hover:bg-surface-container-high transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-on-surface font-medium truncate">simonipash@gmail.com</span>
              </div>
              <span className="text-[10px] text-primary group-hover:underline">Fill & Login</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-on-surface-variant">
          <Link href="/" className="hover:text-primary transition-colors">
            ← Return to Public Portfolio
          </Link>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Trust Protocol</span>
          </span>
        </div>

      </div>
    </div>
  );
}
