"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  Profile,
  Project,
  SkillCategory,
  EvidenceItem,
  ExperienceItem,
  INITIAL_PROFILE,
  INITIAL_PROJECTS,
  INITIAL_SKILLS,
  INITIAL_EVIDENCE,
  INITIAL_EXPERIENCE
} from "@/data/initialData";

interface PortfolioContextType {
  profile: Profile;
  updateProfile: (updated: Partial<Profile>) => Promise<void>;
  projects: Project[];
  addProject: (project: Omit<Project, "id">) => Promise<void>;
  updateProject: (id: string, updated: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  skills: SkillCategory[];
  evidence: EvidenceItem[];
  addEvidence: (item: Omit<EvidenceItem, "id">) => Promise<void>;
  deleteEvidence: (id: string) => Promise<void>;
  experience: ExperienceItem[];
  addExperience: (item: Omit<ExperienceItem, "id">) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
  theme: "light" | "dark";
  toggleTheme: () => void;
  resetAll: () => Promise<void>;
  refreshData: () => Promise<void>;
  terminalOpen: boolean;
  setTerminalOpen: (open: boolean) => void;
  loading: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [skills, setSkills] = useState<SkillCategory[]>(INITIAL_SKILLS);
  const [evidence, setEvidence] = useState<EvidenceItem[]>(INITIAL_EVIDENCE);
  const [experience, setExperience] = useState<ExperienceItem[]>(INITIAL_EXPERIENCE);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all live data from Neon database API routes
  const refreshData = useCallback(async () => {
    try {
      const [profRes, projRes, skillsRes, evdRes, expRes] = await Promise.allSettled([
        fetch("/api/profile", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/projects", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/skills", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/evidence", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        fetch("/api/experience", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (profRes.status === "fulfilled" && profRes.value) {
        setProfile(profRes.value);
      }
      if (projRes.status === "fulfilled" && Array.isArray(projRes.value) && projRes.value.length > 0) {
        setProjects(projRes.value);
      }
      if (skillsRes.status === "fulfilled" && Array.isArray(skillsRes.value) && skillsRes.value.length > 0) {
        setSkills(skillsRes.value);
      }
      if (evdRes.status === "fulfilled" && Array.isArray(evdRes.value) && evdRes.value.length > 0) {
        setEvidence(evdRes.value);
      }
      if (expRes.status === "fulfilled" && Array.isArray(expRes.value) && expRes.value.length > 0) {
        setExperience(expRes.value);
      }
    } catch (err) {
      console.warn("Could not sync with database APIs, using local state:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize theme and load database data
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("simon_portfolio_theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch {
      // Ignore storage errors
    }

    refreshData();
  }, [refreshData]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("simon_portfolio_theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Ignore storage errors
    }
  };

  const updateProfile = async (updated: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to update profile in database:", err);
    }
  };

  const addProject = async (projectData: Omit<Project, "id">) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticProj: Project = { ...projectData, id: tempId };
    setProjects((prev) => [optimisticProj, ...prev]);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      if (res.ok) {
        const created = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === tempId ? created : p)));
      }
    } catch (err) {
      console.error("Failed to save project to database:", err);
    }
  };

  const updateProject = async (id: string, updated: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));

    try {
      await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to update project in database:", err);
    }
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete project from database:", err);
    }
  };

  const addEvidence = async (itemData: Omit<EvidenceItem, "id">) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: EvidenceItem = { ...itemData, id: tempId };
    setEvidence((prev) => [optimisticItem, ...prev]);

    try {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });
      if (res.ok) {
        const created = await res.json();
        setEvidence((prev) => prev.map((e) => (e.id === tempId ? created : e)));
      }
    } catch (err) {
      console.error("Failed to save evidence to database:", err);
    }
  };

  const deleteEvidence = async (id: string) => {
    setEvidence((prev) => prev.filter((e) => e.id !== id));

    try {
      await fetch(`/api/evidence/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete evidence from database:", err);
    }
  };

  const addExperience = async (itemData: Omit<ExperienceItem, "id">) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: ExperienceItem = { ...itemData, id: tempId };
    setExperience((prev) => [optimisticItem, ...prev]);

    try {
      const res = await fetch("/api/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });
      if (res.ok) {
        const created = await res.json();
        setExperience((prev) => prev.map((e) => (e.id === tempId ? created : e)));
      }
    } catch (err) {
      console.error("Failed to save experience to database:", err);
    }
  };

  const deleteExperience = async (id: string) => {
    setExperience((prev) => prev.filter((e) => e.id !== id));

    try {
      await fetch(`/api/experience/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete experience from database:", err);
    }
  };

  const resetAll = async () => {
    setProfile(INITIAL_PROFILE);
    setProjects(INITIAL_PROJECTS);
    setSkills(INITIAL_SKILLS);
    setEvidence(INITIAL_EVIDENCE);
    setExperience(INITIAL_EXPERIENCE);
    await refreshData();
  };

  return (
    <PortfolioContext.Provider
      value={{
        profile,
        updateProfile,
        projects,
        addProject,
        updateProject,
        deleteProject,
        skills,
        evidence,
        addEvidence,
        deleteEvidence,
        experience,
        addExperience,
        deleteExperience,
        theme,
        toggleTheme,
        resetAll,
        refreshData,
        terminalOpen,
        setTerminalOpen,
        loading,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}
