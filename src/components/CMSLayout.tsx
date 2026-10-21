"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePortfolio } from "@/context/PortfolioContext";
import {
  LayoutDashboard,
  FolderGit2,
  Cpu,
  History,
  FileBadge2,
  ShieldCheck,
  GraduationCap,
  Settings,
  ExternalLink,
  Sun,
  Moon,
  CheckCircle2,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  Users,
  LogOut,
  Lock,
  Briefcase,
  FileText,
  Bot,
  Send
} from "lucide-react";

interface CMSUser {
  id: string | number;
  email: string;
  name: string;
  role: string;
  can_manage_access: boolean;
}

export function CMSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, theme, toggleTheme } = usePortfolio();
  
  const [user, setUser] = useState<CMSUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);

  // Authenticate session on mount and route changes
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!isMounted) return;

        if (data.authenticated && data.user) {
          setUser(data.user);
          setAuthChecked(true);
        } else {
          router.replace("/manage/login");
        }
      } catch (err) {
        if (isMounted) {
          router.replace("/manage/login");
        }
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/manage/login");
      router.refresh();
    } catch {
      router.push("/manage/login");
    }
  };

  const navGroups = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/manage", icon: LayoutDashboard },
      ]
    },
    {
      title: "Content & Education",
      items: [
        { label: "Projects", href: "/manage/projects", icon: FolderGit2 },
        { label: "Education & Certs", href: "/manage/academics", icon: GraduationCap },
        { label: "Skills & Stacks", href: "/manage/skills", icon: Cpu },
        { label: "Experience", href: "/manage/experience", icon: History },
        { label: "Profile & Bio", href: "/manage/profile", icon: UserCheck },
      ]
    },
    {
      title: "Evidence & Provenance",
      items: [
        { label: "Evidence & Artifacts", href: "/manage/evidence", icon: ShieldCheck },
        { label: "Technical Claims", href: "/manage/claims", icon: FileBadge2 },
      ]
    },
    {
      title: "Career Automation",
      items: [
        { label: "Career Centre", href: "/manage/career", icon: Briefcase },
        { label: "Job Adverts", href: "/manage/career/adverts", icon: FileText },
        { label: "AI Builder", href: "/manage/career/builder", icon: Bot },
        { label: "Applications", href: "/manage/career/applications", icon: Send },
      ]
    },
    {
      title: "System & Governance",
      items: [
        { label: "Activity Log", href: "/manage/activity", icon: History },
        // Access Control is ONLY visible if user has can_manage_access rights
        ...(user?.can_manage_access
          ? [{ label: "Access & User Control", href: "/manage/access", icon: Users, badge: "OWNER" }]
          : []),
        { label: "Settings & SEO", href: "/manage/settings", icon: Settings },
      ]
    }
  ];

  const handleSimulateDeploy = () => {
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      setDeploySuccess(true);
      setTimeout(() => setDeploySuccess(false), 4000);
    }, 1500);
  };

  const isActive = (href: string) => {
    if (href === "/manage") return pathname === "/manage";
    return pathname.startsWith(href);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-surface-container-low flex items-center justify-center font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md animate-pulse">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-on-surface-variant">Validating encrypted CMS session in Neon DB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col font-sans transition-colors">
      
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 bg-surface-container-lowest border-r border-border flex flex-col justify-between transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        } ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Sidebar Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-border">
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-white text-xs">
                  <span className="material-symbols-outlined text-[18px]">terminal</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs tracking-tight text-on-surface uppercase">
                    Simon Ipara
                  </span>
                  <span className="font-mono text-[10px] text-primary uppercase font-bold">
                    CMS Workspace
                  </span>
                </div>
              </div>
            )}
            
            {collapsed && (
              <div className="mx-auto w-7 h-7 rounded bg-primary flex items-center justify-center text-white text-xs">
                <span className="material-symbols-outlined text-[18px]">terminal</span>
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1 rounded text-on-surface-variant hover:bg-surface-container cursor-pointer"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1 rounded text-on-surface-variant hover:bg-surface-container"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Identity Bar */}
          {!collapsed && user && (
            <div className="p-3 mx-2 mt-2 rounded-lg bg-surface-container-low border border-border/60 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono uppercase text-on-surface-variant block font-semibold">
                  Authorized Session
                </span>
                <span className="text-xs font-semibold text-on-surface truncate block" title={user.email}>
                  {user.email}
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase font-bold shrink-0 ml-1">
                {user.role}
              </span>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="p-3 space-y-5">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                {!collapsed && (
                  <div className="px-2 font-mono text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">
                    {group.title}
                  </div>
                )}
                {group.items.map((item: any) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors ${
                        active
                          ? "bg-primary text-white font-medium shadow-xs"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      } ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </div>
                      {!collapsed && item.badge && (
                        <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Status & Logout */}
        <div className="p-3 border-t border-border bg-surface-container-low space-y-2">
          {!collapsed ? (
            <>
              <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>SECURE NODE</span>
                </div>
                <span className="font-semibold text-primary">NEON-AUTH</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full h-8 px-2.5 rounded border border-border bg-surface-container hover:bg-surface-container-high text-xs font-mono text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <button
                onClick={handleLogout}
                className="p-1 rounded text-red-500 hover:bg-surface-container"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main CMS Wrapper */}
      <div className={`flex-1 flex flex-col transition-all duration-200 ${collapsed ? "lg:pl-16" : "lg:pl-64"}`}>
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded text-on-surface-variant hover:bg-surface-container"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-1.5 font-mono text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">admin_panel_settings</span>
              <span>manage</span>
              <span>/</span>
              <span className="text-on-surface font-medium capitalize">
                {pathname.split("/")[2] || "dashboard"}
              </span>
            </div>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-3">
            {/* Promotion / Deploy Notification */}
            {deploySuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Staging Promoted & Verified
              </span>
            )}

            {/* Access Control shortcut pill if user can manage access */}
            {user?.can_manage_access && (
              <Link
                href="/manage/access"
                className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-mono font-medium hover:bg-amber-500/20 transition-colors"
                title="Manage who can login to CMS"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Access Control</span>
              </Link>
            )}

            {/* Promote to Prod CTA */}
            <button
              onClick={handleSimulateDeploy}
              disabled={deploying}
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded bg-primary text-white text-xs font-semibold hover:bg-tertiary transition-colors disabled:opacity-50 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{deploying ? "Promoting..." : "Promote Staging"}</span>
            </button>

            {/* View Live Public Site */}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded border border-border bg-surface-container text-xs font-mono text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3 h-3 text-primary" />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="h-8 w-8 rounded flex items-center justify-center bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
