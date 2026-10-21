"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import {
  MapPin,
  Clock,
  Mail,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Calendar,
  Award,
  Code2,
  Cpu,
  Layers,
  ShieldCheck,
  FileText,
  ScrollText,
  ExternalLink,
  Download,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Server,
  Database,
  Cloud,
  Bot,
  Compass,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/Icons";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ServiceItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

const SERVICE_SUMMARY: readonly ServiceItem[] = [
  {
    title: "Full-Stack Web Applications",
    description:
      "Product-grade web apps built on Next.js, React, Node.js and PostgreSQL.",
    icon: Layers,
  },
  {
    title: "Backend APIs & Microservices",
    description:
      "Contract-first REST services with validation, auth and clean domain boundaries.",
    icon: Server,
  },
  {
    title: "Database Architecture & Security",
    description:
      "Schema design, migrations and PostgreSQL RLS for multi-tenant data.",
    icon: Database,
  },
  {
    title: "Cloud, DevOps & Reliability",
    description:
      "Containerised deployments, CI/CD pipelines and production observability.",
    icon: Cloud,
  },
  {
    title: "AI Integration & Automation",
    description:
      "LLM-assisted workflows, document generation and evidence-backed automation.",
    icon: Bot,
  },
  {
    title: "Technical Consulting & Reviews",
    description:
      "Architecture reviews, ADR authoring, performance audits and engineering mentorship.",
    icon: Compass,
  },
] as const;

interface PrincipleItem {
  title: string;
  description: string;
}

const PRINCIPLES: readonly PrincipleItem[] = [
  {
    title: "Evidence over assertion",
    description:
      "Every performance or security claim is backed by a test, benchmark or provenance.",
  },
  {
    title: "Security at the storage layer",
    description:
      "PostgreSQL RLS enforces tenancy where application code cannot regress.",
  },
  {
    title: "Decoupled domain logic",
    description:
      "Hexagonal boundaries keep frameworks and ORMs out of business rules.",
  },
  {
    title: "Deterministic verification",
    description:
      "CI gates every commit; production is a known, verified state.",
  },
] as const;

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
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 hover:border-primary/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        <span>{children}</span>
        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      <span>{children}</span>
      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
    </Link>
  );
}

function HighlightItem({ highlight }: { highlight: string }) {
  return (
    <motion.li
      className="flex items-start gap-2 text-xs text-on-surface-variant leading-relaxed"
      whileHover={{ backgroundColor: "bg-surface-container" }}
    >
      <CheckCircle2
        className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <span>{highlight}</span>
    </motion.li>
  );
}

function SkillTag({ name }: { name: string }) {
  return (
    <motion.span
      className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant"
      whileTap={{ y: -2 }}
    >
      {name}
    </motion.span>
  );
}

function ServiceCard({ service }: { service: typeof SERVICE_SUMMARY[0] }) {
  const Icon = service.icon;
  return (
    <motion.div
      className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-2 hover:border-primary/50 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-4.5 h-4.5" aria-hidden="true" />
      </div>
      <h3 className="font-semibold text-sm text-on-surface">
        {service.title}
      </h3>
      <p className="text-xs text-on-surface-variant leading-relaxed">
        {service.description}
      </p>
    </motion.div>
  );
}

function ExperienceCard({ role }: { role: { id: string; role: string; organization: string; period: string; location: string } }) {
  return (
    <motion.li
      className="bg-surface-container-lowest border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/50 transition-colors"
      whileHover={{ borderColor: "primary" }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Briefcase className="w-4.5 h-4.5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-on-surface truncate">
            {role.role}
          </p>
          <p className="text-xs text-primary font-mono truncate">
            {role.organization}
          </p>
        </div>
      </div>
      <p className="text-xs font-mono text-on-surface-variant shrink-0">
        {role.period} · {role.location}
      </p>
    </motion.li>
  );
}

function SkillCategoryCard({ group }: { group: { category: string; names: string[]; total: number } }) {
  return (
    <motion.div
      className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-3 hover:border-primary/50 transition-colors"
      whileHover={{ borderColor: "primary" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" aria-hidden="true" />
          {group.category}
        </h3>
        <span className="text-[10px] font-mono text-on-surface-variant">
          {group.total} skills
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {group.names.map((name) => (
          <SkillTag key={name} name={name} />
        ))}
      </div>
    </motion.div>
  );
}

function PrincipleCard({ principle, index }: { principle: typeof PRINCIPLES[0]; index: number }) {
  return (
    <motion.div
      className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-3 hover:border-primary/50 transition-colors"
      whileHover={{ borderColor: "primary" }}
    >
      <div className="flex items-center gap-2 font-mono text-xs text-primary font-semibold uppercase">
        <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-[10px]">
          {index + 1}
        </span>
        <span>{principle.title}</span>
      </div>
      <p className="text-xs text-on-surface-variant leading-relaxed">
        {principle.description}
      </p>
    </motion.div>
  );
}

function DocumentCard({ title, Icon, description, color, href, external = true }: { 
  title: string; 
  Icon: React.ElementType; 
  description: string; 
  color: string;
  href: string;
  external?: boolean;
}) {
  return (
    <motion.div
      className="bg-surface-container-lowest border border-border rounded-xl p-5 space-y-2 hover:border-primary/50 transition-colors group focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="flex items-center gap-2 py-2 px-3 rounded border border-border bg-surface-container-low text-xs font-mono hover:bg-surface-container hover:border-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Icon className={`w-6 h-6 ${color}`} aria-hidden="true" />
        <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="text-xs text-on-surface-variant">{description}</p>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-primary pt-1">
          {external ? (
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          ) : (
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
          )}
          {external ? "Open" : "Browse"}
        </span>
      </a>
    </motion.div>
  );
}

export default function AboutPage() {
  const { profile, experience, skills, setTerminalOpen } = usePortfolio();
  const [certificationCount, setCertificationCount] = useState<number | null>(
    null
  );
  const [certificationCategories, setCertificationCategories] =
    useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/certifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const certs: Array<{ category?: string }> = data.certifications || [];
        setCertificationCount(certs.length);
        setCertificationCategories(
          Array.from(
            new Set(certs.map((c) => c.category).filter(Boolean) as string[])
          )
        );
      })
      .catch(() => {
        /* summary is optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const workExperience = useMemo(
    () => experience.filter((item) => item.type === "Work"),
    [experience]
  );
  const education = useMemo(
    () => experience.filter((item) => item.type === "Education"),
    [experience]
  );
  const primaryEducation = education[0];
  const recentRoles = useMemo(() => [...workExperience].reverse().slice(0, 3), [
    workExperience,
  ]);
  const skillPreview = useMemo(
    () =>
      skills.slice(0, 4).map((group) => ({
        category: group.category,
        names: group.skills.slice(0, 4).map((s) => s.name),
        total: group.skills.length,
      })),
    [skills]
  );

  const jumpLinks = [
    { label: "Who I Am", href: "#who-i-am" },
    { label: "What I Do", href: "#what-i-do" },
    { label: "Academics", href: "#academics" },
    { label: "Experience", href: "#experience" },
    { label: "Skills", href: "#skills" },
    { label: "Methodology", href: "#methodology" },
    { label: "Documents", href: "#documents" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 space-y-14">

          {/* 1. WHO I AM */}
          <section
            aria-labelledby="who-i-am-heading"
            className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6"
            id="who-i-am"
          >
            <nav
              aria-label="About page sections"
              className="hidden lg:block col-span-2"
            >
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono">
                <li className="text-on-surface-variant uppercase tracking-wider">Jump to:</li>
                {jumpLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="lg:col-span-6 space-y-5">
              <div id="who-i-am-heading" className="space-y-3">
                <SectionEyebrow>Who I Am</SectionEyebrow>
                <h1
                  id="who-i-am-heading"
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface"
                >
                  Simon Ipara — Full-Stack Software Engineer
                </h1>
                <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
                  I design and build resilient web applications, decoupled API services and
                  robust data workflows that prioritize maintainability, architectural
                  clarity, and verifiable correctness.
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed max-w-xl">
                  Based in Nairobi, Kenya, with a BSc in Computer Science / Software
                  Engineering from Chuka University and hands-on delivery experience
                  across healthcare, education, fintech and civic technology.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  {profile.location}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  {profile.timezone}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                    aria-hidden="true"
                  />
                  Available for full-time roles & consulting
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <span>Start a conversation</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <a
                  href="/certificates/SIMON IPARA CV.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-border bg-surface-container-lowest text-on-surface text-sm font-medium hover:border-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <Download className="w-4 h-4 text-primary" aria-hidden="true" />
                  <span>Download CV</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 sticky top-24 right-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <motion.img
                  src="/profile-optimized.webp"
                  alt={`Profile photo of ${profile.name}`}
                  width={400}
                  height={400}
                  className="rounded-2xl border border-border object-cover transition-opacity duration-500 group-hover:opacity-90"
                  loading="lazy"
                />
                <motion.div
                  className="absolute -inset-2 rounded-3xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                />
              </motion.div>
            </div>
          </section>

          {/* 2. WHAT I DO */}
          <section
            aria-labelledby="what-i-do-heading"
            className="space-y-6 scroll-mt-24"
            id="what-i-do"
          >
            <div className="space-y-2">
              <SectionEyebrow>What I Do</SectionEyebrow>
              <h2
                id="what-i-do-heading"
                className="text-2xl font-bold text-on-surface"
              >
                Digital products and engineering services
              </h2>
              <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                I design, build, and operate software from product engineering through
                backend systems, data architecture, deployment and ongoing reliability.
                These are the six areas clients and employers engage me for.
              </p>
            </div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {SERVICE_SUMMARY.map((service) => (
                <ServiceCard key={service.title} service={service} />
              ))}
            </motion.div>

            <DrillDownButton href="/services">
              See services, categories, engagement models & pricing
            </DrillDownButton>
          </section>

          {/* 3. ACADEMIC JOURNEY */}
          <section
            aria-labelledby="academics-heading"
            className="space-y-6 scroll-mt-24"
            id="academics"
          >
            <div className="space-y-2">
              <SectionEyebrow>Academic Journey</SectionEyebrow>
              <h2
                id="academics-heading"
                className="text-2xl font-bold text-on-surface"
              >
                {primaryEducation?.role ||
                  "Bachelor of Science in Computer Science / Software Engineering"}
              </h2>
              <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                My formal foundation in computer science — from first-year fundamentals
                through final-year capstone work — followed by continuous professional
                certification.
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-border rounded-xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1">
                <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Institution
                </p>
                <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" aria-hidden="true" />
                  {primaryEducation?.organization || "Chuka University"}
                </p>
                <p className="text-xs text-on-surface-variant font-mono">
                  {primaryEducation?.location || "Kenya"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Period
                </p>
                <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" aria-hidden="true" />
                  {primaryEducation?.period || "2020 — 2024"}
                </p>
                <p className="text-xs text-on-surface-variant font-mono">
                  Full-time degree
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Certifications
                </p>
                <p className="text-sm font-semibold text-on-surface flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" aria-hidden="true" />
                  {certificationCount === null
                    ? "Verified credentials"
                    : `${certificationCount} credentials`}
                </p>
                <p className="text-xs text-on-surface-variant font-mono truncate">
                  {certificationCategories.length > 0
                    ? certificationCategories.slice(0, 3).join(" · ")
                    : "AI · Data · Design · Development"}
                </p>
              </div>
            </div>

            {primaryEducation?.highlights && primaryEducation.highlights.length > 0 && (
              <motion.ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {primaryEducation.highlights.slice(0, 2).map((highlight) => (
                  <HighlightItem key={highlight} highlight={highlight} />
                ))}
              </motion.ul>
            )}

            <DrillDownButton href="/qualifications">
              View the full academic record — semesters, units, grades & transcript
            </DrillDownButton>

            {/* Professional Documents - merged with Academic Journey */}
            <div className="pt-8 border-t border-border">
              <div className="space-y-2 mb-6">
                <SectionEyebrow>Professional Documents</SectionEyebrow>
                <h3 className="text-xl font-bold text-on-surface">Verify or download the record</h3>
                <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                  Everything a hiring manager needs for due diligence, in one place.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DocumentCard
                  title="Curriculum Vitae"
                  Icon={FileText}
                  description="Full professional CV (PDF)"
                  color="text-emerald-500"
                  href="/certificates/SIMON IPARA CV.pdf"
                />
                <DocumentCard
                  title="Academic Transcript"
                  Icon={ScrollText}
                  description="Official Chuka University record"
                  color="text-blue-500"
                  href="/certificates/Transcript.pdf"
                />
                <DocumentCard
                  title="Cover Letter"
                  Icon={FileText}
                  description="Application letter (PDF)"
                  color="text-purple-500"
                  href="/certificates/SIMON IPARA Cover Letter.pdf"
                />
                <DocumentCard
                  title="Certifications"
                  Icon={Award}
                  description={
                    certificationCount === null
                      ? "Verified credentials"
                      : `${certificationCount} verified credentials`
                  }
                  color="text-amber-500"
                  href="/qualifications"
                  external={false}
                />
              </div>
            </div>
          </section>

          {/* 4. EXPERIENCE */}
          <section
            aria-labelledby="experience-heading"
            className="space-y-6 scroll-mt-24"
            id="experience"
          >
            <div className="space-y-2">
              <SectionEyebrow>Professional Experience</SectionEyebrow>
              <h2
                id="experience-heading"
                className="text-2xl font-bold text-on-surface"
              >
                Where I have applied that foundation
              </h2>
              <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                {workExperience.length} professional engagements spanning product engineering,
                systems administration and independent architecture work.
              </p>
            </div>

            <motion.ul className="space-y-3">
              {recentRoles.map((role) => (
                <ExperienceCard key={role.id} role={role} />
              ))}
            </motion.ul>

            <DrillDownButton href="/experience">
              View the full career timeline, responsibilities & impact
            </DrillDownButton>
          </section>

          {/* 5. SKILLS */}
          <section
            aria-labelledby="skills-heading"
            className="space-y-6 scroll-mt-24"
            id="skills"
          >
            <div className="space-y-2">
              <SectionEyebrow>Technical Skills</SectionEyebrow>
              <h2 id="skills-heading" className="text-2xl font-bold text-on-surface">
                The stack behind the work
              </h2>
              <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                A snapshot of the languages, frameworks and platforms I use. The full page
                includes descriptions for every skill and category filters.
              </p>
            </div>

            <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skillPreview.map((group) => (
                <SkillCategoryCard key={group.category} group={group} />
              ))}
            </motion.div>

            <DrillDownButton href="/skills">
              Explore the full technical stack & competencies
            </DrillDownButton>
          </section>

          {/* 8. CTA */}
          <section
            aria-labelledby="cta-heading"
            className="border-t border-border pt-10 pb-4 text-center space-y-5"
          >
            <div className="space-y-2 max-w-2xl mx-auto">
              <h2 id="cta-heading" className="text-2xl font-bold text-on-surface">
                Let's build something reliable
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                I'm interested in roles and engagements where architectural discipline matters
                — production systems that scale, backend platforms with tight operational
                requirements, or greenfield services that need robust foundations.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg border border-border bg-surface-container-lowest text-on-surface text-sm font-medium hover:border-primary transition-colors"
              >
                <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                <span>Services & engagement models</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors"
              >
                <span>Get in touch</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </section>

        </div>
      </main>

      <Footer />
      <TerminalModal />
    </div>
  );
}