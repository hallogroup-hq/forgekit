"use client";

import React, { useState, useMemo } from "react";
import { Download, FileCode2 } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type TargetTool = ".cursorrules" | "CLAUDE.md" | "SYSTEM_PROMPT.txt";

export default function AiRulesGenerator() {
  const [target, setTarget] = useState<TargetTool>(".cursorrules");
  const [projectName, setProjectName] = useState("ForgeKit Developer Suite");
  const [framework, setFramework] = useState("Next.js 15 (App Router, React 19)");
  const [styling, setStyling] = useState("Tailwind CSS v4");
  const [database, setDatabase] = useState("Supabase (PostgreSQL, Row Level Security)");
  const [stateManager, setStateManager] = useState("React Server Components + TanStack Query");
  const [packageManager, setPackageManager] = useState("pnpm");

  // Rules toggles
  const [strictTypes, setStrictTypes] = useState(true);
  const [noSlopComments, setNoSlopComments] = useState(true);
  const [mobileFirst, setMobileFirst] = useState(true);
  const [earlyReturns, setEarlyReturns] = useState(true);
  const [smallComponents, setSmallComponents] = useState(true);
  const [securityFocus, setSecurityFocus] = useState(true);

  const generatedRules = useMemo(() => {
    return `# ${target}: Context and Instructions for ${projectName}

You are an expert full-stack software engineer paired on ${projectName}.
Follow these directives strictly on every code edit or file generation.

## 1. Core Tech Stack & Architecture
- Framework: ${framework}
- Styling: ${styling}
- Database & ORM: ${database}
- State & Data Fetching: ${stateManager}
- Package Manager: \`${packageManager}\` (Always use \`${packageManager} add\` or \`${packageManager} run\`)

## 2. Engineering Principles & Guidelines
${strictTypes ? "- TypeScript Strictness: NEVER use `any`. Always use explicit interface definitions, Zod validation, or discriminated unions.\n" : ""}${noSlopComments ? "- Comment Hygiene: Do not write generic or conversational AI comments (e.g. `// This function handles...`). Write comments ONLY for non-obvious business logic or workarounds.\n" : ""}${earlyReturns ? "- Code Flow: Favor early guard returns, defensive validation, and pure functions. Avoid deeply nested `if/else` structures.\n" : ""}${smallComponents ? "- Modularity: Keep components under 150 lines. Extract reusable UI primitives into separate module files.\n" : ""}${mobileFirst ? "- Visual & UX: Every UI must be responsive across 375px mobile to 1440px desktop. Avoid horizontal overflow.\n" : ""}${securityFocus ? "- Security & Input Sanitization: Validate all incoming payloads with schema parsing. Protect secrets and never log API tokens.\n" : ""}
## 3. Workflow & Verification
1. Always run type-checks and test runs before completing work.
2. Maintain existing directory layout conventions and absolute import aliases (\`@/*\`).
3. If an instruction is underspecified, prefer standard production best practices over shortcuts.
`;
  }, [target, projectName, framework, styling, database, stateManager, packageManager, strictTypes, noSlopComments, mobileFirst, earlyReturns, smallComponents, securityFocus]);

  const handleDownload = () => {
    downloadFile(generatedRules, target, "text/plain");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration (Left) */}
      <div className="lg:col-span-5 space-y-6">
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Target AI Coding Assistant
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: ".cursorrules", label: "Cursor AI", file: ".cursorrules" },
              { id: "CLAUDE.md", label: "Claude Code", file: "CLAUDE.md" },
              { id: "SYSTEM_PROMPT.txt", label: "Custom LLM", file: "Prompt" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTarget(t.id as TargetTool)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  target === t.id
                    ? "border-violet-500 bg-violet-50/50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="text-xs">{t.label}</div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{t.file}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs">
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Framework</label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="Next.js 15 (App Router, React 19)">Next.js 15 (App Router)</option>
                <option value="Vite + React 19 (SPA)">Vite + React 19</option>
                <option value="FastAPI (Python 3.12)">FastAPI (Python)</option>
                <option value="Go 1.22 + HTMX">Go + HTMX</option>
                <option value="SvelteKit 2">SvelteKit 2</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Styling Engine</label>
              <select
                value={styling}
                onChange={(e) => setStyling(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="Tailwind CSS v4">Tailwind CSS v4</option>
                <option value="Tailwind CSS v3 + Shadcn UI">Tailwind v3 + Shadcn</option>
                <option value="Vanilla CSS Modules">CSS Modules</option>
                <option value="Panda CSS">Panda CSS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Database / Backend</label>
              <select
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="Supabase (PostgreSQL, Row Level Security)">Supabase (Postgres)</option>
                <option value="Prisma ORM + PostgreSQL">Prisma + PostgreSQL</option>
                <option value="Drizzle ORM + Turso/SQLite">Drizzle + SQLite</option>
                <option value="MongoDB + Mongoose">MongoDB</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Package Manager</label>
              <select
                value={packageManager}
                onChange={(e) => setPackageManager(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="pnpm">pnpm</option>
                <option value="npm">npm</option>
                <option value="bun">bun</option>
                <option value="uv">uv (Python)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Guardrails Checkbox Grid */}
        <div className="space-y-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Active Guardrails & Rules
          </span>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={strictTypes}
                onChange={(e) => setStrictTypes(e.target.checked)}
                className="rounded text-violet-600 focus:ring-violet-500"
              />
              <span>Zero Any: Ban `any` in TypeScript</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={noSlopComments}
                onChange={(e) => setNoSlopComments(e.target.checked)}
                className="rounded text-violet-600 focus:ring-violet-500"
              />
              <span>Anti-Slop: Strip generic AI explanation comments</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={earlyReturns}
                onChange={(e) => setEarlyReturns(e.target.checked)}
                className="rounded text-violet-600 focus:ring-violet-500"
              />
              <span>Clean Code: Guard clauses & early returns</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={smallComponents}
                onChange={(e) => setSmallComponents(e.target.checked)}
                className="rounded text-violet-600 focus:ring-violet-500"
              />
              <span>Modularity: Max 150 lines per component</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={mobileFirst}
                onChange={(e) => setMobileFirst(e.target.checked)}
                className="rounded text-violet-600 focus:ring-violet-500"
              />
              <span>Accessibility: Mobile responsive & WCAG AA</span>
            </label>
          </div>
        </div>
      </div>

      {/* Code Display (Right) */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
              {target}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={generatedRules}
              label={`Copy ${target}`}
              size="sm"
              variant="secondary"
              triggerConfetti
            />
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 max-h-[560px] overflow-y-auto">
          <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-violet-500/20 leading-relaxed">
            {generatedRules}
          </pre>
        </div>
      </div>
    </div>
  );
}
