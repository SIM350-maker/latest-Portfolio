"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePortfolio } from "@/context/PortfolioContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalModal } from "@/components/TerminalModal";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Database,
  Layers,
  Code2,
  Terminal,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Cpu,
  Lock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Award,
  Zap
} from "lucide-react";

export default function HomePage() {
  const { profile, projects, evidence, setTerminalOpen } = usePortfolio();
  const featuredProjects = projects.filter((p) => p.featured).slice(0, 3);

  // Video State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [fullscreenVideo, setFullscreenVideo] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar />

      {/* Hero Section */}
      <section className="relative w-full overflow-hidden bg-surface-container-low/60 border-b border-border py-16 md:py-24 transition-colors">
        {/* Subtle decorative glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-border text-on-surface-variant font-mono text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SOFTWARE ENGINEER · {profile.location.toUpperCase()}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-surface leading-[1.15]">
                {profile.bioHeadline}
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
                {profile.bioSub}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-all shadow-xs"
                >
                  <span>Explore projects</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/certifications"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-surface-container-lowest border border-border text-on-surface text-sm font-medium hover:bg-surface-container transition-all"
                >
                  <Award className="w-4 h-4 text-primary" />
                  <span>Education & Certs</span>
                </Link>

                <button
                  onClick={() => setTerminalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-primary/30 bg-primary/5 text-primary text-sm font-mono hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Launch CLI Terminal</span>
                </button>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-mono text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>{profile.provenance}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>PostgreSQL · TypeScript · Docker</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-blue-500" />
                  <span>Zero-Trust Architecture</span>
                </div>
              </div>
            </div>

            {/* Right Bento Box */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              {/* Telemetry Card */}
              <div className="bg-surface-container-lowest border border-border rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                    System State
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    STABLE
                  </span>
                </div>

                <div className="py-4">
                  <div className="text-xs font-mono text-on-surface-variant mb-1">
                    Throughput Latency (p99)
                  </div>
                  {/* Mini Sparkline */}
                  <svg className="w-full h-14 text-primary" fill="none" viewBox="0 0 280 60">
                    <path
                      d="M0 45 C 30 45, 40 30, 70 35 C 100 40, 110 15, 140 22 C 170 30, 180 10, 210 18 C 240 25, 255 12, 280 14"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M0 45 C 30 45, 40 30, 70 35 C 100 40, 110 15, 140 22 C 170 30, 180 10, 210 18 C 240 25, 255 12, 280 14 L 280 60 L 0 60 Z"
                      fill="currentColor"
                      fillOpacity="0.08"
                    />
                    <circle cx="280" cy="14" fill="currentColor" r="3.5" />
                  </svg>
                  <div className="flex justify-between items-center text-xs font-mono text-on-surface-variant mt-2">
                    <span>{profile.latencyAvg}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{profile.uptime}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div className="bg-surface-container-low p-2.5 rounded">
                    <span className="block font-mono text-[10px] text-on-surface-variant uppercase">Architecture</span>
                    <span className="font-semibold text-xs text-on-surface">{profile.architectureStyle}</span>
                  </div>
                  <div className="bg-surface-container-low p-2.5 rounded">
                    <span className="block font-mono text-[10px] text-on-surface-variant uppercase">Timezone</span>
                    <span className="font-semibold text-xs text-on-surface">{profile.timezone}</span>
                  </div>
                </div>
              </div>

              {/* Terminal git log snippet */}
              <div 
                onClick={() => setTerminalOpen(true)}
                className="bg-surface-container-lowest border border-border rounded-xl p-4 shadow-xs flex items-center gap-3 cursor-pointer hover:border-primary transition-colors group"
              >
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] text-on-surface-variant truncate">
                    git log -1 --format=&quot;%h - %s&quot;
                  </p>
                  <p className="text-xs text-on-surface font-medium truncate">
                    feat(core): harden cryptographic proof trails
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Engineering Capability Strip */}
      <section className="w-full bg-surface-container-lowest border-b border-border py-12 transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="flex items-start gap-3.5 p-3 rounded-lg hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-on-surface">Clean Architecture</h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Decoupled business logic, domain boundaries, and testable modular services.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-lg hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-on-surface">Type Safety & Contracts</h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Strict TypeScript, OpenAPI sync, and end-to-end data integrity guarantees.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-lg hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-on-surface">Verifiable Evidence</h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Cryptographically attested claims, git commit provenance, and verifiable artifacts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-lg hover:bg-surface-container-low transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-on-surface">Low-Latency Data</h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  PostgreSQL Row-Level Security, Redis queue caching, and sub-50ms p95 latencies.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* BEAUTIFULLY ANIMATED BACKGROUND VIDEO SECTION */}
      <section className="relative w-full overflow-hidden bg-slate-950 text-white py-20 border-b border-border">
        {/* Ambient neon radial glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-blue-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 relative z-10 space-y-8">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary-200 font-mono text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE SYSTEM EXECUTION · FULL-STACK DEMO</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Modern Web Development & Interactive Architecture
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                Witness real-time web engineering in action: responsive micro-components, state machine coordination, and resilient full-stack execution running smoothly in motion.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-tertiary text-white font-semibold transition-colors shadow-lg"
              >
                <span>View System Architecture</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Video Showcase Card with Ambient Animated Cyber Frame */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-2xl group transition-all duration-300 hover:border-primary/50">
            
            {/* Top Terminal Title Bar */}
            <div className="h-11 px-4 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-20 relative">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="ml-2 font-mono text-xs text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  <span>runtime/web-development-engine.mp4</span>
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400">
                  <Zap className="w-3 h-3" />
                  <span>60 FPS · 1080P RENDERING</span>
                </span>
                <span className="hidden md:inline-block text-slate-600">|</span>
                <span className="text-primary font-semibold">NEON POSTGRES CONNECTED</span>
              </div>
            </div>

            {/* Video Viewport Container with Background Video */}
            <div className="relative aspect-video w-full max-h-[580px] overflow-hidden bg-black flex items-center justify-center">
              
              {/* Background Video */}
              <video
                ref={videoRef}
                src="/videos/web-devlopment.mp4"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
              />

              {/* Cybernetic Scanline & Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/20 to-slate-950/80 pointer-events-none" />

              {/* Floating HUD Chip 1 (Top Left) */}
              <div className="absolute top-5 left-5 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-xl pointer-events-none animate-fadeIn">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div className="font-mono text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">State Machine</span>
                  <span className="text-white font-semibold">Decoupled UI & Backend</span>
                </div>
              </div>

              {/* Floating HUD Chip 2 (Top Right) */}
              <div className="absolute top-5 right-5 hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-xl pointer-events-none animate-fadeIn">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                <div className="font-mono text-xs text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Throughput</span>
                  <span className="text-white font-semibold">Sub-50ms API Responses</span>
                </div>
              </div>

              {/* Central Floating Overlay Title */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none space-y-3">
                <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Simon Ipara Engineering Studio</span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md max-w-xl">
                  Precision Systems Engineered for Scale
                </h3>
              </div>

              {/* Bottom Interactive HUD Bar */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between gap-4 z-20">
                <div className="flex items-center gap-2 font-mono text-xs">
                  {/* Play / Pause Toggle */}
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white backdrop-blur-md transition-colors cursor-pointer border border-slate-700"
                    title={isPlaying ? "Pause Video" : "Play Video"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  {/* Audio Mute / Unmute */}
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white backdrop-blur-md transition-colors cursor-pointer border border-slate-700"
                    title={isMuted ? "Unmute Sound" : "Mute Sound"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <span className="text-slate-400 text-[11px] hidden sm:inline ml-2">
                    web-devlopment.mp4 · Background Stream
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  {/* Fullscreen Preview */}
                  <button
                    onClick={() => setFullscreenVideo(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white backdrop-blur-md transition-colors cursor-pointer border border-slate-700 text-[11px]"
                    title="Fullscreen Preview"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Fullscreen Mode</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Fullscreen Video Modal */}
        {fullscreenVideo && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="h-12 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <span className="font-mono text-xs text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span>Simon Ipara — Web Development Showcase (High Definition)</span>
                </span>
                <button
                  onClick={() => setFullscreenVideo(false)}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white transition-colors cursor-pointer"
                >
                  Close (ESC)
                </button>
              </div>
              <div className="aspect-video w-full bg-black">
                <video
                  src="/videos/web-devlopment.mp4"
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Featured Projects Section */}
      <section className="w-full py-16 bg-background transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-primary tracking-wider font-semibold mb-2">
                <span>Featured Engineering Systems</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                Architectural Proof & Case Studies
              </h2>
              <p className="text-sm text-on-surface-variant mt-1 max-w-xl">
                Rigorous case studies detailing problem boundaries, technical decisions, data models, and verifiable deliverables.
              </p>
            </div>

            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-primary hover:text-tertiary transition-colors"
            >
              <span>View full catalog ({projects.length} systems)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-surface-container-lowest border border-border rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary hover:-translate-y-0.5 transition-all shadow-xs group"
              >
                <div className="p-6 space-y-4">
                  {/* Header badges */}
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={project.status} type="publication" />
                    <StatusBadge status={project.evidenceAccess} type="evidence" />
                  </div>

                  <div>
                    <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider block mb-1">
                      {project.category}
                    </span>
                    <h3 className="font-semibold text-lg text-on-surface group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                    {project.summary}
                  </p>

                  {/* Key Metrics strip if present */}
                  {project.keyMetrics && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      {project.keyMetrics.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="bg-surface-container-low p-2 rounded">
                          <span className="font-mono text-[10px] text-on-surface-variant block">{m.label}</span>
                          <span className="font-mono font-semibold text-xs text-on-surface">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tech stack tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                        +{project.technologies.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-6 py-3.5 bg-surface-container-low/50 border-t border-border flex items-center justify-between">
                  <span className="font-mono text-[11px] text-on-surface-variant">
                    {project.timeline}
                  </span>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Read Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Engineering Approach Banner */}
      <section className="w-full bg-surface-container-low border-y border-border py-14 transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <span className="font-mono text-xs text-primary uppercase font-semibold tracking-wider">
                Engineering Approach & Invariants
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                Mathematical Verification Over Decorative Claims
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Rather than relying on subjective adjectives or performative badges, my workflow enforces verifiable proofs: architectural boundary invariants, row-level security policies, reproducible Docker containers, and automated test matrices.
              </p>

              <div className="pt-2 flex items-center gap-4">
                <Link
                  href="/engineering"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded bg-surface-container-lowest border border-border text-on-surface hover:border-primary transition-colors"
                >
                  <span>Explore Invariant Audit Matrix</span>
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </Link>
                <Link
                  href="/evidence"
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span>View Evidence Ledger</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-surface-container-lowest border border-border rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between font-mono text-xs pb-2 border-b border-border">
                <span className="font-semibold text-on-surface">Verified System Invariants</span>
                <span className="text-emerald-600 dark:text-emerald-400">4 / 4 PASSING</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>PostgreSQL Tenant RLS Boundary</span>
                  </div>
                  <span className="text-on-surface-variant text-[11px]">HIPAA Safe</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>p95 Query Latency &lt; 50ms</span>
                  </div>
                  <span className="text-on-surface-variant text-[11px]">Benchmarked</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>WCAG 2.2 AA a11y Standard</span>
                  </div>
                  <span className="text-on-surface-variant text-[11px]">Automated</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Merkle Tree Cryptographic Root</span>
                  </div>
                  <span className="text-on-surface-variant text-[11px]">Tamper-Proof</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Direct Contact Call to Action */}
      <section className="w-full py-16 bg-background transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
          <div className="bg-surface-container-lowest border border-border rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-xs">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-mono text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Direct Engineering Communication</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Let&apos;s Build Resilient, High-Impact Software
            </h2>

            <p className="text-sm text-on-surface-variant max-w-xl mx-auto leading-relaxed">
              Open to senior full-stack roles, architectural consulting, and high-concurrency systems design.
              Directly reachable in Nairobi, Kenya (EAT / UTC+3).
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-tertiary transition-colors shadow-xs"
              >
                <span>Send a direct transmission</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border bg-surface-container-low text-on-surface text-sm font-mono hover:bg-surface-container transition-colors"
              >
                <span>{profile.email}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <TerminalModal />
    </div>
  );
}
