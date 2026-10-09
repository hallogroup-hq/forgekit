"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Download, FileText, Plus, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

interface PrdPreset {
  name: string;
  appName: string;
  pitch: string;
  persona: string;
  stack: string;
  database: string;
  features: string[];
}

const PRESETS: PrdPreset[] = [
  {
    name: "Invoicing & Billing Portal",
    appName: "InvoiceFlow",
    pitch: "A self-hosted billing engine for independent software agencies to generate quotes, track payment status, and reconcile invoices.",
    persona: "Studio founders and finance managers managing multiple concurrent client retainers.",
    stack: "Next.js 15, Tailwind CSS, PostgreSQL, Drizzle ORM, Stripe Connect",
    database: "PostgreSQL on Neon with Row Level Security",
    features: [
      "Multi-currency invoice creation with custom tax and discount rules",
      "Client-facing payment link portal with Stripe ACH & Card checkout",
      "Automated PDF receipt and quotation generation with agency branding",
      "Payment reconciliation webhook handler with audit event log",
    ],
  },
  {
    name: "Local-First Workspace",
    appName: "ObsidianFlow",
    pitch: "A distraction-free, local-first markdown scratchpad with bidirectional tag graphs.",
    persona: "Technical writers, indie hackers, and research engineers tired of slow cloud apps.",
    stack: "Next.js 15, React 19, IndexedDB, Tailwind CSS v4, Lucide",
    database: "Local IndexedDB with optional end-to-end encrypted backup",
    features: [
      "Offline-first full-text search across 10,000+ notes in under 50ms",
      "Interactive force-directed node graph visualization of linked ideas",
      "Vim and Emacs modal keybindings toggle",
      "One-click export to GitHub Gist, PDF, and static HTML site",
    ],
  },
  {
    name: "Marketplace & Booking",
    appName: "StudioRent",
    pitch: "Peer-to-peer hourly studio space rental platform for independent photographers and podcasters.",
    persona: "Creative studio owners with idle daytime capacity and indie creators needing gear.",
    stack: "Next.js 15, Server Actions, Stripe Connect, Tailwind CSS",
    database: "PostgreSQL on Neon with Drizzle ORM",
    features: [
      "Real-time calendar slot availability with instant reservation hold",
      "Split payouts via Stripe Connect for host commission fees",
      "Host identity and equipment insurance verification checks",
      "SMS and email booking reminders via Resend and Twilio",
    ],
  },
];

export default function AppPrdGenerator() {
  const [appName, setAppName] = useState("InvoiceFlow");
  const [pitch, setPitch] = useState("A self-hosted billing engine for independent software agencies to generate quotes, track payment status, and reconcile invoices.");
  const [persona, setPersona] = useState("Studio founders and finance managers managing multiple concurrent client retainers.");
  const [stack, setStack] = useState("Next.js 15, Tailwind CSS, PostgreSQL, Drizzle ORM, Stripe Connect");
  const [database, setDatabase] = useState("PostgreSQL on Neon with Row Level Security");
  const [features, setFeatures] = useState<string[]>([
    "Multi-currency invoice creation with custom tax and discount rules",
    "Client-facing payment link portal with Stripe ACH & Card checkout",
    "Automated PDF receipt and quotation generation with agency branding",
    "Payment reconciliation webhook handler with audit event log",
  ]);
  const [newFeatureText, setNewFeatureText] = useState("");
  const [activeTab, setActiveTab] = useState<"spec" | "prompt" | "preview">("spec");
  const [dateString, setDateString] = useState("2026-10-08");

  useEffect(() => {
    setDateString(new Date().toISOString().split("T")[0]);
  }, []);

  const addFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures((prev) => [...prev, newFeatureText.trim()]);
    setNewFeatureText("");
  };

  const removeFeature = (idx: number) => {
    if (features.length <= 1) return;
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const loadPreset = (p: PrdPreset) => {
    setAppName(p.appName);
    setPitch(p.pitch);
    setPersona(p.persona);
    setStack(p.stack);
    setDatabase(p.database);
    setFeatures([...p.features]);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  // Generate PRD Markdown
  const markdownPrd = useMemo(() => {
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return `# Product Requirements Document: ${appName}
Date: ${dateString} | Status: Ready for Architecture & Cursor Build
Target Stack: ${stack} | Database: ${database}

---

## 1. Executive Summary & Vision
- Product Name: ${appName}
- Core Elevator Pitch: ${pitch}
- Primary Target Persona: ${persona}

---

## 2. Core Problem & Value Proposition
- Problem: Target users currently waste hours per week on manual, fragmented workflows without automated structure.
- Solution: ${appName} provides a single high-efficiency pipeline that solves the problem with zero latency.
- North Star Metric: Time from initial user input to delivered outcome (< 60 seconds).

---

## 3. Scope & Key Functional Requirements
${features.map((f, i) => `${i + 1}. **${f}**`).join("\n")}

---

## 4. Entity Architecture & Data Model (PostgreSQL)

\`\`\`sql
-- Users and authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(120),
  tier VARCHAR(32) DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Core entities
CREATE TABLE ${slug.replace(/-/g, "_")}_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_${slug.replace(/-/g, "_")}_user ON ${slug.replace(/-/g, "_")}_items(user_id);
\`\`\`

---

## 5. API Routes & App Router Structure
- \`POST /api/v1/auth/session\`: Validate user credentials or token.
- \`GET /api/v1/${slug.replace(/-/g, "_")}\`: List all items for authenticated user.
- \`POST /api/v1/${slug.replace(/-/g, "_")}\`: Create new entity from user input.
- \`DELETE /api/v1/${slug.replace(/-/g, "_")}/:id\`: Delete entity with ownership guard.

---

## 6. Step-by-Step Vibe Coder Implementation Plan

### Phase 1: Foundation & Scaffold (Day 1)
- Scaffold Next.js App Router project with Tailwind CSS and TypeScript strict mode.
- Configure auth provider and database connection tables with RLS.
- Create global shell layout, navigation header, and dark/light system theme.

### Phase 2: Core User Loop (Day 2)
- Build primary interactive workspace screen with instant state feedback.
- Wire database mutations using Server Actions or type-safe API handlers.
- Add error boundaries, validation toasts, and loading skeletons.

### Phase 3: Polish & Edge Cases (Day 3)
- Test responsive viewports across mobile (375px) to desktop (1440px).
- Verify empty states, rate-limiting guards, and export capabilities.
`;
  }, [appName, dateString, stack, database, pitch, persona, features]);

  // Generate Cursor Master Prompt
  const cursorPrompt = useMemo(() => {
    return `Act as an elite Principal Software Engineer building "${appName}".

Here is the exact Product Requirements Document (PRD):
---
Product: ${appName}
Elevator Pitch: ${pitch}
Target User: ${persona}
Tech Stack: ${stack}
Database: ${database}

Key Features to Implement:
${features.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Directives for your code generation:
1. Use TypeScript with strict interfaces. Do not use 'any'.
2. Favor modular components under 150 lines in modern Next.js App Router style.
3. Handle empty states, loading indicators, and error boundaries defensively.
4. Provide complete, runnable code rather than placeholders or pseudocode.

Begin by setting up the core data models and the primary interactive workspace component.`;
  }, [appName, pitch, persona, stack, database, features]);

  const handleDownload = () => {
    const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadFile(markdownPrd, `${slug}-prd.md`, "text/markdown");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Preset Chips */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Quick Idea Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => loadPreset(p)}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Core Info */}
        <div className="space-y-4 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              App Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              One-Line Elevator Pitch
            </label>
            <textarea
              rows={2}
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Target Persona & Audience
            </label>
            <input
              type="text"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Tech Stack
              </label>
              <input
                type="text"
                value={stack}
                onChange={(e) => setStack(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Database / Storage
              </label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Feature List Management */}
        <div className="space-y-3 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
            Core Feature Scope ({features.length})
          </label>
          <div className="space-y-2">
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400 w-4 text-center">{idx + 1}</span>
                <input
                  type="text"
                  value={feat}
                  onChange={(e) => {
                    const updated = [...features];
                    updated[idx] = e.target.value;
                    setFeatures(updated);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeFeature(idx)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Add another key feature..."
              value={newFeatureText}
              onChange={(e) => setNewFeatureText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFeature()}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addFeature}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity flex items-center gap-1 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Output & Preview Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("spec")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "spec"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              PRD Document (Markdown)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("prompt")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "prompt"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Cursor Master Prompt
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={activeTab === "prompt" ? cursorPrompt : markdownPrd}
              label={activeTab === "prompt" ? "Copy Prompt" : "Copy Spec"}
            />
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Download .md
            </button>
          </div>
        </div>

        {/* Tab View Container */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 overflow-hidden shadow-2xs flex flex-col">
          {activeTab === "spec" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <span className="font-mono">PRD.md</span>
                <span>{markdownPrd.split("\n").length} lines</span>
              </div>
              <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 mt-3 max-h-[600px] overflow-y-auto">
                {markdownPrd}
              </pre>
            </div>
          )}

          {activeTab === "prompt" && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs text-zinc-400 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
                <span className="font-mono">CURSOR_PROMPT.txt</span>
                <span>Ready to paste in Cursor Composer or Claude Code</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 mt-3 max-h-[600px] overflow-y-auto">
                <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {cursorPrompt}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
