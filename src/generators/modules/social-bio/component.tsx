"use client";

import React, { useState, useMemo } from "react";
import { Download, AlertCircle, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type PlatformId = "x" | "linkedin" | "github" | "instagram" | "tiktok";

interface PlatformLimit {
  id: PlatformId;
  name: string;
  maxChars: number;
  badge: string;
  formatNote: string;
}

const PLATFORMS: Record<PlatformId, PlatformLimit> = {
  x: {
    id: "x",
    name: "X (Twitter)",
    maxChars: 160,
    badge: "160 chars max",
    formatNote: "Punchy, value-led, handles & hashtags supported",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn Headline",
    maxChars: 220,
    badge: "220 chars max",
    formatNote: "Authority title, company outcome, target audience",
  },
  github: {
    id: "github",
    name: "GitHub Bio",
    maxChars: 160,
    badge: "160 chars max",
    formatNote: "Tech stack, what you build, open source passion",
  },
  instagram: {
    id: "instagram",
    name: "Instagram Bio",
    maxChars: 150,
    badge: "150 chars max",
    formatNote: "Line breaks, emoji anchors, single link-in-bio prompt",
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok Bio",
    maxChars: 80,
    badge: "80 chars max",
    formatNote: "Hyper-compact, direct hook + emoji",
  },
};

interface BioPreset {
  id: string;
  name: string;
  archetype: string;
  headline: string;
  proof: string;
  cta: string;
}

const PRESETS: BioPreset[] = [
  {
    id: "vibe-coder",
    name: "Indie Founder & Vibe Coder",
    archetype: "Builder",
    headline: "Building AI tools with high craft",
    proof: "Shipped 12 apps in 12 months | 40k+ users",
    cta: "👇 Try my latest launch below",
  },
  {
    id: "senior-dev",
    name: "Full-Stack Dev & Open Source",
    archetype: "Engineer",
    headline: "Staff Engineer @ Next.js ecosystem",
    proof: "Core contributor to open-source | 10k stars",
    cta: "Building in public daily",
  },
  {
    id: "growth-marketer",
    name: "Growth Marketer & Copywriter",
    archetype: "Growth",
    headline: "Scaling B2B SaaS from $0 to $1M ARR",
    proof: "Obsessed with conversion & retention funnels",
    cta: "Get my weekly tear-downs 📩",
  },
];

export default function SocialBioGenerator() {
  const [headline, setHeadline] = useState(PRESETS[0].headline);
  const [proof, setProof] = useState(PRESETS[0].proof);
  const [cta, setCta] = useState(PRESETS[0].cta);
  const [separator, setSeparator] = useState("•");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>("x");

  const applyPreset = (p: BioPreset) => {
    setHeadline(p.headline);
    setProof(p.proof);
    setCta(p.cta);
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
  };

  const formattedBios = useMemo(() => {
    const cleanHeadline = headline.trim();
    const cleanProof = proof.trim();
    const cleanCta = cta.trim();

    // Multiline version for Instagram & TikTok
    const multiLine = [cleanHeadline, cleanProof, cleanCta].filter(Boolean).join("\n");

    // Single-line inline version with separator for X & LinkedIn
    const inlineLine = [cleanHeadline, cleanProof, cleanCta].filter(Boolean).join(` ${separator} `);

    // Ultra compact for TikTok (80 chars)
    const compactLine = [cleanHeadline, cleanCta].filter(Boolean).join(" | ");

    return {
      x: inlineLine.length <= 160 ? inlineLine : [cleanHeadline, cleanProof].filter(Boolean).join(` ${separator} `),
      linkedin: inlineLine,
      github: inlineLine,
      instagram: multiLine,
      tiktok: compactLine.slice(0, 80),
    };
  }, [headline, proof, cta, separator]);

  const activeBioText = formattedBios[selectedPlatform];
  const activeLimit = PLATFORMS[selectedPlatform];
  const charCount = activeBioText.length;
  const charsRemaining = activeLimit.maxChars - charCount;
  const isOverflow = charsRemaining < 0;

  const handleDownload = () => {
    const fullText = Object.entries(formattedBios)
      .map(([k, text]) => `=== ${PLATFORMS[k as PlatformId].name} ===\n${text}\n`)
      .join("\n");
    downloadFile(fullText, "social-bios.txt", "text/plain");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Preset Archetypes */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Bio Archetype Presets
          </label>
          <div className="space-y-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="w-full p-2.5 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {p.archetype}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Inputs */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4 shadow-2xs">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Headline / Core Value Hook
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Building AI software with craft"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Social Proof / Credibility Metric
            </label>
            <input
              type="text"
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              placeholder="e.g. 50k+ active developers | Ex-Stripe"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Call to Action / Link Anchor
            </label>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="e.g. 👇 Try the live demo"
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Inline Separator Glyph
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {["•", "|", "/", "⚡", "—"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeparator(s === "—" ? ":" : s)}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-colors ${
                    separator === (s === "—" ? ":" : s)
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs"
                      : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {s === "—" ? ":" : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Platform Selector Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(Object.keys(PLATFORMS) as PlatformId[]).map((pid) => (
              <button
                key={pid}
                type="button"
                onClick={() => setSelectedPlatform(pid)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  selectedPlatform === pid
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{PLATFORMS[pid].name}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    formattedBios[pid].length > PLATFORMS[pid].maxChars
                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold"
                      : "opacity-60"
                  }`}
                >
                  {formattedBios[pid].length}/{PLATFORMS[pid].maxChars}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <CopyButton text={activeBioText} label="Copy Bio" triggerConfetti />
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Download All
            </button>
          </div>
        </div>

        {/* Live Platform Bio Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {activeLimit.name} Preview
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {activeLimit.badge}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              {isOverflow ? (
                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {Math.abs(charsRemaining)} chars over budget!
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {charsRemaining} chars available
                </span>
              )}
            </div>
          </div>

          {/* Social Bio Box Preview */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-800 dark:text-zinc-200 font-sans whitespace-pre-wrap leading-relaxed min-h-[90px] select-all">
            {activeBioText || "(Bio content empty)"}
          </div>

          <p className="text-[11px] text-zinc-500 italic">
            Note: {activeLimit.formatNote}
          </p>
        </div>

        {/* All Platforms Comparison View */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 shadow-2xs space-y-3">
          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Simultaneous Overview Across Platforms
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {(Object.keys(PLATFORMS) as PlatformId[]).map((pid) => {
              const text = formattedBios[pid];
              const limit = PLATFORMS[pid].maxChars;
              const over = text.length > limit;

              return (
                <div
                  key={pid}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-[11px]">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {PLATFORMS[pid].name}
                      </span>
                      <span
                        className={`font-mono text-[10px] ${
                          over ? "text-rose-500 font-bold" : "text-zinc-400"
                        }`}
                      >
                        {text.length}/{limit}
                      </span>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap line-clamp-3 font-sans">
                      {text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
