"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Award,
  ChevronDown,
  GraduationCap,
  Briefcase,
  User,
} from "lucide-react";

// Navigation structure with logical grouping
interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }> | null;
  children?: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }> | null;
    description: string;
  }>;
}

// 4-page structure: Home, About (hub), Services (deep-dive), Contact
// Deep-dive pages: Experience, Qualifications, Engineering, Skills
const navStructure: NavItem[] = [
  { 
    label: "Home", 
    href: "/", 
    icon: null 
  },
  { 
    label: "About", 
    href: "/about", 
    icon: User,
    children: [
      { label: "Who I Am", href: "/about#who-i-am", icon: User, description: "Bio & philosophy" },
      { label: "Services", href: "/services", icon: Briefcase, description: "What I offer, pricing & models" },
      { label: "Experience", href: "/experience", icon: Briefcase, description: "Work history & roles" },
      { label: "Qualifications", href: "/qualifications", icon: GraduationCap, description: "Academic credentials" },
      { label: "Skills", href: "/skills", icon: Award, description: "Technical competencies" },
      { label: "Methodology", href: "/engineering", icon: Terminal, description: "Technical invariants" },
    ]
  },
  ];

export function Navbar() {
  const pathname = usePathname();
  const { profile, theme, toggleTheme, setTerminalOpen } = usePortfolio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authorizedUser, setAuthorizedUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
    return () => { isMounted = false; };
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close any expanded dropdown as soon as the page (or an inner container) scrolls,
  // so the floating panel never lingers over unrelated content.
  useEffect(() => {
    if (!openDropdown) return;
    function handleScroll(event: Event) {
      const target = event.target as HTMLElement | null;
      // Scrolling inside the open dropdown panel itself should not close it
      if (target && typeof target.closest === 'function' && target.closest('[data-dropdown]')) {
        return;
      }
      setOpenDropdown(null);
    }
    // capture: true catches scrolls from any scrollable ancestor, not just the window
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [openDropdown]);

  // Close dropdowns on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isParentActive = (item: NavItem) => {
    if (!item.children) return isActive(item.href);
    return item.children.some(child => isActive(child.href));
  };

  const Dropdown = ({ item }: { item: NavItem }) => {
    const itemWithChildren = item as NavItem & { children?: NavItem['children'] };
    const isOpen = openDropdown === item.label;
    const triggerRef = useRef<HTMLAnchorElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const menuId = `nav-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`;

    const openMenu = () => setOpenDropdown(item.label);
    const closeMenu = (returnFocus = false) => {
      setOpenDropdown(null);
      if (returnFocus) triggerRef.current?.focus();
    };

    const focusItem = (index: number) => {
      const items = panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (!items || items.length === 0) return;
      const clamped = ((index % items.length) + items.length) % items.length;
      items[clamped]?.focus();
    };

    const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'Up' || e.key === 'ArrowUp') {
        e.preventDefault();
        openMenu();
        // wait for the panel to render before focusing its first item
        requestAnimationFrame(() => focusItem(e.key === 'ArrowUp' ? -1 : 0));
      }
    };

    const handlePanelKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu(true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const items = panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        const currentIndex = items ? Array.from(items).indexOf(document.activeElement as HTMLElement) : -1;
        focusItem(currentIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const items = panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
        const currentIndex = items ? Array.from(items).indexOf(document.activeElement as HTMLElement) : 0;
        focusItem(currentIndex - 1);
      } else if (e.key === 'Tab') {
        // leaving via keyboard should not leave a stale panel open
        closeMenu(false);
      }
    };

    return (
      <div
        className="relative"
        data-dropdown={item.label}
        onMouseEnter={openMenu}
        onMouseLeave={() => setOpenDropdown(null)}
        onFocus={openMenu}
        onBlur={(e) => {
          // Only close if focus is leaving the dropdown entirely
          setTimeout(() => {
            if (!document.activeElement?.closest('[data-dropdown]')) {
              setOpenDropdown(null);
            }
          }, 0);
        }}
      >
        <Link
          ref={triggerRef}
          href={item.href}
          className={`flex items-center gap-1.5 text-sm transition-colors py-1 ${
            isParentActive(item)
              ? "text-primary font-semibold border-b-2 border-primary"
              : "text-on-surface-variant hover:text-on-surface font-normal"
          }`}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={isOpen ? menuId : undefined}
          onKeyDown={handleTriggerKeyDown}
        >
          {item.icon && <item.icon className="w-4 h-4" aria-hidden="true" />}
          <span>{item.label}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </Link>

        {/* Dropdown Panel */}
        {isOpen && itemWithChildren.children && (
          <div
            ref={panelRef}
            id={menuId}
            className="absolute left-0 top-full z-50 -mt-2 pt-2 w-64 bg-surface-container-lowest border border-border rounded-xl shadow-lg py-2 animate-in fade-in-0 slide-in-from-top-2 duration-150"
            role="menu"
            aria-label={`${item.label} pages`}
            onKeyDown={handlePanelKeyDown}
          >
            {itemWithChildren.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setOpenDropdown(null)}
                tabIndex={-1}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors focus:outline-none focus-visible:bg-surface-container ${
                  isActive(child.href)
                    ? "bg-primary/5 text-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
                role="menuitem"
              >
                {child.icon && <child.icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{child.label}</span>
                  {child.description && (
                    <span className="text-[11px] text-on-surface-variant/70 block truncate">
                      {child.description}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
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

          {/* Desktop Nav - Reduced from 10 to 7 items with dropdowns */}
          <nav className="hidden xl:flex items-center gap-1" role="menubar">
            {navStructure.map((item) => (
              item.children ? (
                <Dropdown key={item.label} item={item} />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 text-sm transition-colors py-1 ${
                    isActive(item.href)
                      ? "text-primary font-semibold border-b-2 border-primary"
                      : "text-on-surface-variant hover:text-on-surface font-normal"
                  }`}
                  role="menuitem"
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </Link>
              )
            ))}
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
            <div className="space-y-1">
              {navStructure.map((item) => (
                <MobileNavItem 
                  key={item.label} 
                  item={item} 
                  isActive={isActive}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </div>
            
            <div className="pt-2 flex items-center justify-between border-t border-border">
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

function MobileNavItem({ item, isActive, onClick }: { item: NavItem; isActive: (href: string) => boolean; onClick: () => void }) {
  const itemWithChildren = item as NavItem & { children?: NavItem['children'] };
  const [expanded, setExpanded] = useState(false);
  const isParentActive = item.children ? item.children.some(c => isActive(c.href)) : isActive(item.href);

  if (item.children) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-sm transition-colors ${
            isParentActive
              ? "bg-primary-container/10 text-primary font-semibold"
              : "text-on-surface hover:bg-surface-container"
          }`}
          aria-expanded={expanded}
        >
          <span className="flex items-center gap-2">
            {item.icon && <item.icon className="w-4 h-4" />}
            <span>{item.label}</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {expanded && (
          <div className="ml-4 space-y-1 border-l-2 border-border/50 pl-3">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onClick}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                  isActive(child.href)
                    ? "bg-primary-container/10 text-primary font-semibold"
                    : "text-on-surface hover:bg-surface-container"
                }`}
              >
                {child.icon && <child.icon className="w-4 h-4" />}
                <span>{child.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
        isActive(item.href)
          ? "bg-primary-container/10 text-primary font-semibold"
          : "text-on-surface hover:bg-surface-container"
      }`}
    >
      {item.icon && <item.icon className="w-4 h-4" />}
      <span>{item.label}</span>
    </Link>
  );
}