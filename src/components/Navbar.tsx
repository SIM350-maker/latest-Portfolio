"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortfolio } from "@/context/PortfolioContext";
import { 
  Terminal, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ArrowRight, 
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Award
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { profile, theme, toggleTheme, setTerminalOpen } = usePortfolio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authorizedUser, setAuthorizedUser] = useState<{ email: string; name: string; role: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.authenticated && data.user) {
          setAuthorizedUser(data.user);
        } else {
          setAuthorizedUser(null);
        }
      })
      .catch(() => {
        if (isMounted) setAuthorizedUser(null);
      });
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Projects", href: "/projects" },
    { label: "Skills", href: "/skills" },
    { label: "Education & Certs", href: "/certifications" },
    { label: "Engineering", href: "/engineering" },
    { label: "Evidence", href: "/evidence" },
    { label: "Experience", href: "/experience" },
    { label: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/90 dark:bg-surface/90 backdrop-blur-md border-b border-border shadow-xs transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Wordmark */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">terminal</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-on-surface group-hover:text-primary transition-colors">
                {profile.name}
              </span>
              <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
                Software Engineer
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-5">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors py-1 ${
                    active
                      ? "text-primary font-semibold border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-on-surface font-normal"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Terminal Launch Trigger */}
            <button
              onClick={() => setTerminalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface text-xs font-mono transition-colors cursor-pointer"
              title="Open Interactive Terminal & Architecture Inspector"
            >
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span>CLI</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Light / Dark theme"
              className="h-8 w-8 rounded flex items-center justify-center bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* CMS Portal Button: STRICTLY visible only when email is registered and authorized */}
            {authorizedUser && (
              <Link
                href="/manage"
                className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-mono text-emerald-700 dark:text-emerald-300 transition-colors font-medium shadow-xs"
                title={`Authenticated as ${authorizedUser.email} (${authorizedUser.role})`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>CMS Console</span>
              </Link>
            )}

            {/* Contact CTA */}
            <Link
              href="/contact"
              className="inline-flex items-center gap-1 h-8 px-3.5 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors shadow-xs"
            >
              <span>Get in touch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 rounded text-on-surface-variant hover:bg-surface-container cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-border bg-surface-container-lowest px-4 py-4 space-y-2 shadow-lg">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded text-sm ${
                    isActive(link.href)
                      ? "bg-primary-container/10 text-primary font-semibold"
                      : "text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  setTerminalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-primary font-medium"
              >
                <Terminal className="w-4 h-4" />
                Launch CLI Terminal
              </button>

              {authorizedUser && (
                <Link
                  href="/manage"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-mono text-emerald-600 font-semibold"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CMS Console</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
      
      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  );
}
