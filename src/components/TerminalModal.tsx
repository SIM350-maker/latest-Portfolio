"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import { Terminal, X, Minimize2, Maximize2, CornerDownLeft } from "lucide-react";

interface TerminalLine {
  text: string;
  type?: "input" | "output" | "error" | "success" | "accent";
}

export function TerminalModal() {
  const { terminalOpen, setTerminalOpen, profile, projects } = usePortfolio();
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<TerminalLine[]>([
    { text: "Simon Ipara System Architecture & Telemetry Terminal v2.4", type: "accent" },
    { text: "Type 'help' for available diagnostic commands.", type: "output" },
    { text: "--------------------------------------------------------", type: "output" }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (terminalOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [terminalOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  if (!terminalOpen) return null;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const newHistory: TerminalLine[] = [...history, { text: `$ ${cmd}`, type: "input" }];
    const parts = cmd.split(" ");
    const mainCmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");

    switch (mainCmd) {
      case "help":
        newHistory.push(
          { text: "Available commands:", type: "accent" },
          { text: "  status        Display system health, uptime, and latency benchmarks", type: "output" },
          { text: "  projects      List all indexed architectural projects & slugs", type: "output" },
          { text: "  skills        Display core typed competencies and engineering domains", type: "output" },
          { text: "  arch          Display architectural layout for Healthcare MIS", type: "output" },
          { text: "  verify [sha]  Perform simulated cryptographic SHA-256 provenance check", type: "output" },
          { text: "  about         Print engineer biographical summary & credentials", type: "output" },
          { text: "  contact       Display direct contact channels and PGP availability", type: "output" },
          { text: "  clear         Clear the terminal screen", type: "output" },
          { text: "  exit          Close terminal interface", type: "output" }
        );
        break;

      case "status":
        newHistory.push(
          { text: `[SYSTEM STATUS: OK]`, type: "success" },
          { text: `Engineer:       ${profile.name} (${profile.title})`, type: "output" },
          { text: `Location:       ${profile.location} (${profile.timezone})`, type: "output" },
          { text: `Uptime:         ${profile.uptime} (Active cluster node)`, type: "output" },
          { text: `Avg Latency:    ${profile.latencyAvg}`, type: "output" },
          { text: `Architecture:   ${profile.architectureStyle}`, type: "output" },
          { text: `Git Commit:     feat(core): harden cryptographic proof trails (HEAD -> main)`, type: "output" }
        );
        break;

      case "projects":
        newHistory.push({ text: `Indexed Projects (${projects.length} entries):`, type: "accent" });
        projects.forEach((p) => {
          newHistory.push({
            text: `  * [${p.slug}] ${p.title} (${p.category}) - [Status: ${p.status}]`,
            type: "output"
          });
        });
        break;

      case "skills":
        newHistory.push(
          { text: "Engineering Capabilities Matrix:", type: "accent" },
          { text: "  Languages:  TypeScript, JavaScript (ESNext), Python, SQL, Go", type: "output" },
          { text: "  Frontend:   Next.js 16 (App Router), React 19, Tailwind CSS v4, WCAG 2.2", type: "output" },
          { text: "  Backend:    Node.js, Express, REST APIs, Microservices, Auth/RBAC", type: "output" },
          { text: "  Storage:    PostgreSQL (RLS), Redis, Prisma ORM, SQLite", type: "output" },
          { text: "  DevOps:     Docker, GitHub Actions, Linux/Bash, Nginx", type: "output" }
        );
        break;

      case "arch":
        newHistory.push(
          { text: "--- Healthcare MIS Clean Hexagonal Architecture ---", type: "accent" },
          { text: "  [Client: Next.js SSR / Tailwind / a11y]", type: "output" },
          { text: "         │  (HTTPS / OpenAPI v3)", type: "output" },
          { text: "         ▼", type: "output" },
          { text: "  [API Gateway & Rate Limiting (Redis)]", type: "output" },
          { text: "         │", type: "output" },
          { text: "  ┌──────┴──────────────────────────────┐", type: "output" },
          { text: "  │ Core Domain Layer (Clean / DDD)      │", type: "output" },
          { text: "  │  • Patient Invariant Enforcement     │", type: "output" },
          { text: "  │  • Triage Priority Queue Calculator  │", type: "output" },
          { text: "  │  • Cryptographic Event Signer        │", type: "output" },
          { text: "  └──────┬──────────────────────────────┘", type: "output" },
          { text: "         │", type: "output" },
          { text: "  [Persistence Layer: PostgreSQL 16 + Row-Level Security]", type: "success" }
        );
        break;

      case "verify":
        const targetSha = arg || "8f7e2c4b9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c";
        newHistory.push(
          { text: `Checking hash: ${targetSha.slice(0, 16)}...`, type: "output" },
          { text: `Querying public ledger verification index...`, type: "output" },
          { text: `[VALID]: Cryptographic attestation confirmed. Zero tampering detected.`, type: "success" }
        );
        break;

      case "about":
        newHistory.push(
          { text: profile.bioHeadline, type: "accent" },
          { text: profile.bioSub, type: "output" },
          { text: `Email: ${profile.email}`, type: "output" },
          { text: `GitHub: https://github.com/${profile.github}`, type: "output" },
          { text: `LinkedIn: https://linkedin.com/in/${profile.linkedin}`, type: "output" }
        );
        break;

      case "contact":
        newHistory.push(
          { text: `Contact Channel: ${profile.email}`, type: "success" },
          { text: `Location: ${profile.location} (Timezone: ${profile.timezone})`, type: "output" }
        );
        break;

      case "clear":
        setHistory([]);
        setInputVal("");
        return;

      case "exit":
        setTerminalOpen(false);
        setInputVal("");
        return;

      default:
        newHistory.push({
          text: `Command not recognized: "${cmd}". Type 'help' for diagnostics list.`,
          type: "error"
        });
        break;
    }

    setHistory(newHistory);
    setInputVal("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-[#0A0F18] border border-[#2A374A] rounded-lg shadow-2xl overflow-hidden flex flex-col h-[520px] text-gray-200 font-mono text-xs">
        
        {/* Terminal Header */}
        <div className="h-9 bg-[#111A28] border-b border-[#2A374A] px-3 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 cursor-pointer" onClick={() => setTerminalOpen(false)} />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-[11px] text-gray-400 ml-2 font-mono flex items-center gap-1">
              <Terminal className="w-3 h-3 text-blue-400" />
              simon@ipara-core:~ (zsh)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
              LIVE TELEMETRY
            </span>
            <button
              onClick={() => setTerminalOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Output Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-1.5 selection:bg-blue-600 selection:text-white">
          {history.map((line, idx) => {
            let color = "text-gray-300";
            if (line.type === "input") color = "text-blue-300 font-semibold";
            if (line.type === "accent") color = "text-cyan-400 font-semibold";
            if (line.type === "success") color = "text-emerald-400";
            if (line.type === "error") color = "text-rose-400";

            return (
              <div key={idx} className={`${color} whitespace-pre-wrap leading-relaxed`}>
                {line.text}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Terminal Input Form */}
        <form onSubmit={handleCommand} className="h-10 bg-[#111A28] border-t border-[#2A374A] px-3 flex items-center gap-2">
          <span className="text-emerald-400 font-bold">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type 'help', 'status', 'projects', 'arch'..."
            className="flex-1 bg-transparent text-gray-100 placeholder:text-gray-600 focus:outline-hidden text-xs font-mono"
          />
          <button type="submit" className="text-gray-500 hover:text-gray-300">
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
