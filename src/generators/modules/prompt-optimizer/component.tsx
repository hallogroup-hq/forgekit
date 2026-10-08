"use client";

import React, { useState, useMemo } from "react";
import { Download, Terminal, Cpu, Layers } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type ModelTarget = "claude" | "cursor" | "gpt4o" | "deepseek";
type SchemaFormat = "xml" | "markdown" | "json";

interface Preset {
  id: string;
  name: string;
  role: string;
  goal: string;
  constraints: string[];
}

const PRESETS: Preset[] = [
  {
    id: "fullstack-agent",
    name: "Autonomous Coding Agent",
    role: "Staff Software Engineer and Systems Architect",
    goal: "Build scalable, type-safe full-stack features using Next.js 15, TypeScript, and Tailwind CSS with strict error boundaries.",
    constraints: [
      "Strict TypeScript with zero 'any' types",
      "No placeholder comments like '// add logic here'",
      "Include unit tests and edge-case handling",
      "Prioritize performance and minimal bundle size",
    ],
  },
  {
    id: "product-designer",
    name: "Design Engineer & UI/UX",
    role: "Principal Product Designer and Design Engineer",
    goal: "Architect accessible, high-craft user interfaces with precise micro-interactions, responsive typography, and tactile spring physics.",
    constraints: [
      "WCAG 2.1 AA contrast compliance",
      "Zero AI-slop visual artifacts (no generic purple blur halos)",
      "Tactile 150ms active press feedback",
      "Clean semantic HTML structure",
    ],
  },
  {
    id: "growth-copywriter",
    name: "Direct-Response Copywriter",
    role: "Lead Growth Copywriter and Conversion Specialist",
    goal: "Write high-converting landing page headlines, hero value propositions, and CTA sequences that overcome objection patterns.",
    constraints: [
      "No buzzwords or corporate jargon (e.g., 'unleash', 'supercharge')",
      "Concrete numbers and outcome-driven claims",
      "Apply the Problem-Agitate-Solve (PAS) structure",
      "Clear, single-action call to action",
    ],
  },
];

export default function PromptOptimizerGenerator() {
  const [targetModel, setTargetModel] = useState<ModelTarget>("claude");
  const [schemaFormat, setSchemaFormat] = useState<SchemaFormat>("xml");
  const [role, setRole] = useState(PRESETS[0].role);
  const [rawGoal, setRawGoal] = useState(PRESETS[0].goal);
  const [constraintsText, setConstraintsText] = useState(PRESETS[0].constraints.join("\n"));
  const [includeChainOfThought, setIncludeChainOfThought] = useState(true);
  const [includeAntiPatterns, setIncludeAntiPatterns] = useState(true);
  const [includeFewShot, setIncludeFewShot] = useState(false);
  const [fewShotInput, setFewShotInput] = useState("Input: user requests login button\nOutput: <Button variant='primary'>Sign In</Button>");

  const applyPreset = (p: Preset) => {
    setRole(p.role);
    setRawGoal(p.goal);
    setConstraintsText(p.constraints.join("\n"));
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
  };

  const optimizedPrompt = useMemo(() => {
    const constraintsList = constraintsText
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    if (schemaFormat === "xml") {
      return `<system_instructions>
<role>
You are an expert ${role}. You approach every task with rigorous standards, deep domain mastery, and zero tolerance for generic or superficial solutions.
</role>

<primary_objective>
${rawGoal}
</primary_objective>

${
  includeChainOfThought
    ? `<reasoning_protocol>
Before generating your final response, systematically evaluate:
1. Underlying requirements, implicit assumptions, and potential edge cases.
2. Architecture trade-offs and performance implications.
3. Clean verification steps to validate correctness.
</reasoning_protocol>`
    : ""
}

<execution_constraints>
${constraintsList.map((c, i) => `${i + 1}. ${c}`).join("\n")}
</execution_constraints>

${
  includeAntiPatterns
    ? `<anti_patterns>
- Do NOT provide hand-wavy explanations or incomplete code snippets.
- Do NOT use generic filler copy or artificial superlatives.
- Avoid untested assumptions: if critical specifications are ambiguous, highlight trade-offs clearly.
</anti_patterns>`
    : ""
}

${
  includeFewShot
    ? `<demonstrations>
${fewShotInput}
</demonstrations>`
    : ""
}

<output_format>
Return your deliverable directly with clear headings, structured code blocks, and concise technical justification.
</output_format>
</system_instructions>`;
    }

    if (schemaFormat === "json") {
      const jsonObj = {
        role,
        primary_objective: rawGoal,
        reasoning_protocol: includeChainOfThought
          ? [
              "Analyze problem boundaries and user constraints",
              "Identify edge cases and safety requirements",
              "Synthesize optimal implementation",
            ]
          : undefined,
        constraints: constraintsList,
        anti_patterns: includeAntiPatterns
          ? [
              "Incomplete implementations",
              "Superficial filler language",
              "Unstated assumptions",
            ]
          : undefined,
        example_demonstration: includeFewShot ? fewShotInput : undefined,
      };
      return JSON.stringify(jsonObj, null, 2);
    }

    // Markdown format
    return `# System Prompt: ${role}

## 1. Role & Identity
You operate as a world-class **${role}**. Deliver comprehensive, production-ready outputs with absolute precision.

## 2. Core Objective
${rawGoal}

${
  includeChainOfThought
    ? `## 3. Reasoning Protocol
Think step-by-step before answering:
1. Deconstruct the requirements into modular components.
2. Verify edge-case resilience and performance budgets.
3. Eliminate any unnecessary complexity or filler.`
    : ""
}

## 4. Operational Constraints
${constraintsList.map((c) => `- ${c}`).join("\n")}

${
  includeAntiPatterns
    ? `## 5. Prohibited Anti-Patterns
- Never output placeholder code or unverified logic.
- Avoid verbose greetings or unnecessary conversational fluff.
- Reject unvalidated assumptions.`
    : ""
}

${
  includeFewShot
    ? `## 6. Few-Shot Exemplar
\`\`\`
${fewShotInput}
\`\`\``
    : ""
}

## 7. Deliverable Format
Provide actionable, well-documented solutions ready for immediate production deployment.`;
  }, [
    role,
    rawGoal,
    constraintsText,
    includeChainOfThought,
    includeAntiPatterns,
    includeFewShot,
    fewShotInput,
    schemaFormat,
  ]);

  const tokenEstimate = useMemo(() => {
    return Math.round(optimizedPrompt.length / 4);
  }, [optimizedPrompt]);

  const wordCount = useMemo(() => {
    return optimizedPrompt.trim().split(/\s+/).filter(Boolean).length;
  }, [optimizedPrompt]);

  const handleDownload = () => {
    const ext = schemaFormat === "json" ? "json" : schemaFormat === "xml" ? "xml" : "md";
    downloadFile(optimizedPrompt, `prompt-optimized.${ext}`, "text/plain");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Target Archetype Presets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="p-2.5 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {p.name}
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">{p.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Model & Format Switchers */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4 shadow-2xs">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              Target AI Model
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["claude", "cursor", "gpt4o", "deepseek"] as ModelTarget[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTargetModel(m)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                    targetModel === m
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                      : "bg-zinc-50 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {m === "gpt4o" ? "GPT-4o" : m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Prompt Structure Format
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["xml", "markdown", "json"] as SchemaFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSchemaFormat(f)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg uppercase transition-colors ${
                    schemaFormat === f
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                      : "bg-zinc-50 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Role & Persona Definition
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Primary Goal & Raw Prompt Task
            </label>
            <textarea
              rows={4}
              value={rawGoal}
              onChange={(e) => setRawGoal(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Strict Constraints (One per line)
            </label>
            <textarea
              rows={4}
              value={constraintsText}
              onChange={(e) => setConstraintsText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-[11px]"
            />
          </div>

          {/* Toggle Switches */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeChainOfThought}
                onChange={(e) => setIncludeChainOfThought(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Inject Chain-of-Thought Protocol</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAntiPatterns}
                onChange={(e) => setIncludeAntiPatterns(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Include Anti-Pattern Hallucination Guards</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFewShot}
                onChange={(e) => setIncludeFewShot(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium">Include Few-Shot Input/Output Exemplar</span>
            </label>
          </div>

          {includeFewShot && (
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Few-Shot Exemplar Content
              </label>
              <textarea
                rows={3}
                value={fewShotInput}
                onChange={(e) => setFewShotInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-[11px] resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-500" />
              Engineered System Prompt
            </span>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
              <span>~{tokenEstimate} tokens</span>
              <span>•</span>
              <span>{wordCount} words</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton text={optimizedPrompt} label="Copy Prompt" triggerConfetti />
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>

        {/* Output Pre Container */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 overflow-hidden shadow-2xs flex flex-col">
          <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[640px] overflow-y-auto selection:bg-blue-500/20">
            {optimizedPrompt}
          </pre>
        </div>
      </div>
    </div>
  );
}
