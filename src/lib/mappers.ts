import { Project, EvidenceItem, SkillCategory, ExperienceItem } from "@/data/initialData";

export function mapProjectRow(row: any): Project {
  let tech: string[] = [];
  if (Array.isArray(row.technologies)) {
    tech = row.technologies;
  } else if (typeof row.technologies === "string") {
    try {
      const parsed = JSON.parse(row.technologies);
      tech = Array.isArray(parsed) ? parsed : row.technologies.split(",").map((s: string) => s.trim());
    } catch {
      tech = row.technologies.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  let decisions: any[] = [];
  if (Array.isArray(row.decisions)) {
    decisions = row.decisions;
  } else if (typeof row.decisions === "string") {
    try {
      decisions = JSON.parse(row.decisions);
    } catch {}
  }

  let keyMetrics: any[] = [];
  if (Array.isArray(row.key_metrics)) {
    keyMetrics = row.key_metrics;
  } else if (typeof row.key_metrics === "string") {
    try {
      keyMetrics = JSON.parse(row.key_metrics);
    } catch {}
  }

  const slug =
    row.slug ||
    (row.title
      ? row.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      : `proj-${row.id}`);

  return {
    id: String(row.id),
    slug: slug,
    title: row.title || "Untitled Project",
    subtitle: row.subtitle || row.summary || "",
    summary: row.summary || row.description || "",
    category: row.category || "Full Stack",
    status: (row.publication_state as any) || "Published",
    evidenceAccess: (row.evidence_access as any) || "Public",
    role: row.role || row.roles || "Software Engineer",
    timeline: row.timeline || "2025 – 2026",
    featured: Boolean(row.featured),
    technologies: tech.length > 0 ? tech : ["TypeScript", "Next.js", "PostgreSQL"],
    repoUrl: row.repo_url || undefined,
    demoUrl: row.demo_url || row.deploy_url || undefined,
    architectureNote: row.architecture_note || undefined,
    problem:
      row.problem ||
      row.description ||
      "System engineering requirements and high-reliability operational objectives.",
    solution:
      row.solution ||
      row.summary ||
      "Engineered with clean architectural boundaries and resilient edge protocols.",
    decisions: decisions.length > 0 ? decisions : undefined,
    keyMetrics: keyMetrics.length > 0 ? keyMetrics : undefined,
    evidenceSha: row.evidence_sha || undefined,
  };
}

export function mapEvidenceRow(row: any): EvidenceItem {
  return {
    id: String(row.id),
    slug: row.slug || `evd-${row.id}`,
    title: row.title || row.description?.slice(0, 50) || "Cryptographic Artifact",
    projectSlug: row.project_slug || "system-core",
    projectName: row.project_name || "Platform Architecture",
    type: (row.type as any) || "Code Repository",
    access: (row.access as any) || (row.accessibility_status as any) || "Public",
    sha256: row.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    description: row.description || "Verifiable architecture component audit trace.",
    date: row.date || (row.created_at ? new Date(row.created_at).toISOString().split("T")[0] : "2026-01-01"),
    verificationStatus: (row.verification_status as any) || "VERIFIED",
  };
}

export function mapExperienceRow(row: any): ExperienceItem {
  let highlights: string[] = [];
  if (Array.isArray(row.highlights)) {
    highlights = row.highlights;
  } else if (typeof row.highlights === "string") {
    try {
      highlights = JSON.parse(row.highlights);
    } catch {
      highlights = [row.highlights];
    }
  } else if (row.description) {
    highlights = [row.description];
  }

  let skills: string[] = [];
  if (Array.isArray(row.skills)) {
    skills = row.skills;
  } else if (typeof row.skills === "string") {
    try {
      skills = JSON.parse(row.skills);
    } catch {
      skills = row.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  return {
    id: String(row.id),
    role: row.role || row.title || "Software Engineer",
    organization: row.organization || row.company || "Independent",
    location: row.location || "Nairobi, Kenya",
    period: row.period || (row.is_current ? `${row.start_date} — Present` : `${row.start_date} — ${row.end_date || 'Past'}`),
    type: (row.type as any) || "Work",
    highlights: highlights.length > 0 ? highlights : ["Engineered enterprise software systems and user interfaces."],
    skills: skills.length > 0 ? skills : ["TypeScript", "Next.js", "PostgreSQL"],
  };
}
