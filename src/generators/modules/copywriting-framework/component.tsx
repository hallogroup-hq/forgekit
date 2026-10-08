"use client";

import React, { useState, useMemo } from "react";
import { Download } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type Framework = "pas" | "aida" | "bab" | "hero";

interface ProductPreset {
  name: string;
  productName: string;
  audience: string;
  painPoint: string;
  dreamOutcome: string;
  mechanism: string;
}

const PRESETS: ProductPreset[] = [
  {
    name: "Developer Tool",
    productName: "ForgeKit",
    audience: "Solo developers and technical founders",
    painPoint: "Switching between 20 ad-ridden, slow online utility tabs every day",
    dreamOutcome: "Having every essential generator running locally with zero latency",
    mechanism: "An offline-first, client-side workstation with zero server tracking",
  },
  {
    name: "Design System",
    productName: "TokensCraft",
    audience: "Product designers and design engineers",
    painPoint: "Figma tokens and CSS code constantly falling out of sync during sprint handoffs",
    dreamOutcome: "Automatic, type-safe design token syncing to GitHub pull requests",
    mechanism: "A bidirectional CLI engine linking Figma variables directly to Tailwind CSS",
  },
  {
    name: "B2B SaaS Analytics",
    productName: "ChurnGuard",
    audience: "SaaS founders and customer success leads",
    painPoint: "Finding out high-value annual subscribers churned only after the invoice failed",
    dreamOutcome: "Catching at-risk accounts 60 days before contract renewal",
    mechanism: "Real-time product telemetry analyzing feature drop-offs and seat inactivity",
  },
];

export default function CopywritingFrameworkGenerator() {
  const [productName, setProductName] = useState("ForgeKit");
  const [audience, setAudience] = useState("Solo developers and technical founders");
  const [painPoint, setPainPoint] = useState("Switching between 20 ad-ridden, slow online utility tabs every day");
  const [dreamOutcome, setDreamOutcome] = useState("Having every essential generator running locally with zero latency");
  const [mechanism, setMechanism] = useState("An offline-first, client-side workstation with zero server tracking");
  const [activeFramework, setActiveFramework] = useState<Framework>("pas");

  const loadPreset = (p: ProductPreset) => {
    setProductName(p.productName);
    setAudience(p.audience);
    setPainPoint(p.painPoint);
    setDreamOutcome(p.dreamOutcome);
    setMechanism(p.mechanism);
    confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
  };

  // Generate Framework Copy
  const copyOutput = useMemo(() => {
    switch (activeFramework) {
      case "pas":
        return `## PAS Framework: Problem, Agitate, Solve

### 1. Problem
For ${audience}, ${painPoint.toLowerCase()} is an exhausting daily tax on focus.

### 2. Agitate
Every context switch breaks your flow state. You spend five minutes looking for an unblocked tool, dodging cookie banners and full-screen popups, just to format a payload or generate a single QR code. Over a month, that is hours of lost deep work.

### 3. Solution
Enter ${productName}. ${mechanism}. You get ${dreamOutcome.toLowerCase()}, directly in your browser with zero latency and complete privacy.

---

### Headline Hooks:
- **Direct:** Stop ${painPoint.toLowerCase()}. Switch to ${productName}.
- **Contrarian:** Why the best ${audience.toLowerCase()} stopped using bloated online utility sites.
- **Outcome:** The fastest way to get ${dreamOutcome.toLowerCase()}.`;

      case "aida":
        return `## AIDA Framework: Attention, Interest, Desire, Action

### 1. Attention
Still ${painPoint.toLowerCase()}? There is a smarter way.

### 2. Interest
Most tools force you to trade privacy for convenience, uploading your data to third-party servers just to run basic operations.

### 3. Desire
With ${productName}, you get ${dreamOutcome.toLowerCase()}. Everything runs 100% locally through ${mechanism.toLowerCase()}, giving you instant results without friction.

### 4. Action
Open ${productName} now. Free forever, no account required.

---

### Headline Hooks:
- **Punchy:** Built for ${audience.toLowerCase()} who value speed.
- **Value-First:** ${dreamOutcome}. Powered by ${mechanism.toLowerCase()}.
- **Call-out:** Attention ${audience.toLowerCase()}: your workflow just got simpler.`;

      case "bab":
        return `## BAB Framework: Before, After, Bridge

### 1. Before (The Current Reality)
You are ${painPoint.toLowerCase()}. Workflow is disjointed, tabs are cluttered, and progress halts for trivial tasks.

### 2. After (The Promised Land)
Imagine ${dreamOutcome.toLowerCase()}. Your workspace is crisp, your tools respond instantaneously, and you stay locked in flow.

### 3. Bridge (The Mechanism)
${productName} is the bridge. Through ${mechanism.toLowerCase()}, you eliminate the friction between idea and execution.

---

### Headline Hooks:
- **Before/After:** From ${painPoint.toLowerCase()} to ${dreamOutcome.toLowerCase()} in seconds.
- **Clarity:** The bridge to ${dreamOutcome.toLowerCase()}.
- **Minimalist:** Better tools. Faster results. Meet ${productName}.`;

      case "hero":
      default:
        return `## Hero Value Proposition Formula

### Primary Headline:
Get ${dreamOutcome.toLowerCase()}, without ${painPoint.toLowerCase()}.

### Supporting Subtitle:
${productName} gives ${audience.toLowerCase()} a faster, cleaner workflow through ${mechanism.toLowerCase()}.

### Primary Call-to-Action:
Get Started Free (No Sign-up Needed)

### Secondary Micro-Proof:
Runs 100% locally in your browser. Zero tracking. Zero latency.

---

### 3 Alternative Hero Variants:
1. **The Direct Benefit:** The all-in-one workstation for ${audience.toLowerCase()} who demand speed.
2. **The Contrast Play:** Ditch the clutter. Experience ${dreamOutcome.toLowerCase()}.
3. **The Feature Lead:** ${mechanism}, designed specifically for modern ${audience.toLowerCase()}.`;
    }
  }, [activeFramework, productName, audience, painPoint, dreamOutcome, mechanism]);

  const handleDownload = () => {
    downloadFile(copyOutput, `${productName.toLowerCase()}-${activeFramework}-copy.md`, "text/markdown");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Inputs Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Preset Chips */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Example Business Presets
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

        {/* Inputs Form */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Product / Brand Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Target Audience
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Primary Pain Point / Frustration
            </label>
            <textarea
              rows={2}
              value={painPoint}
              onChange={(e) => setPainPoint(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Dream Desired Outcome
            </label>
            <textarea
              rows={2}
              value={dreamOutcome}
              onChange={(e) => setDreamOutcome(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Unique Mechanism / How It Works
            </label>
            <input
              type="text"
              value={mechanism}
              onChange={(e) => setMechanism(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Framework Selector Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "pas", label: "PAS Formula" },
              { id: "aida", label: "AIDA Formula" },
              { id: "bab", label: "BAB Formula" },
              { id: "hero", label: "Hero Proposition" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFramework(f.id as Framework)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeFramework === f.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <CopyButton text={copyOutput} label="Copy Copy" />
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

        {/* Output Box */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 overflow-hidden shadow-2xs flex flex-col">
          <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[550px] overflow-y-auto">
            {copyOutput}
          </pre>
        </div>
      </div>
    </div>
  );
}
