"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle2, XCircle, ArrowLeftRight, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import { calculateContrastRatio } from "./engine";

const PRESETS = [
  { name: "High Contrast Dark", fg: "#0f172a", bg: "#f8fafc" },
  { name: "Clean Monochrome", fg: "#18181b", bg: "#ffffff" },
  { name: "Navy & Ice", fg: "#1e3a8a", bg: "#eff6ff" },
  { name: "Forest Minimal", fg: "#064e3b", bg: "#ecfdf5" },
  { name: "Sunset Plum", fg: "#581c87", bg: "#faf5ff" },
];

export default function ContrastCheckerGenerator() {
  const [fgColor, setFgColor] = useState("#0f172a");
  const [bgColor, setBgColor] = useState("#ffffff");

  const contrast = useMemo(() => {
    return calculateContrastRatio(fgColor, bgColor);
  }, [fgColor, bgColor]);

  const handleSwap = () => {
    setFgColor(bgColor);
    setBgColor(fgColor);
  };

  const cssSnippet = `/* WCAG Contrast Ratio: ${contrast.ratioFormatted} */
color: ${fgColor};
background-color: ${bgColor};`;

  return (
    <div className="space-y-6">
      {/* Top Presets Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-zinc-500 font-medium whitespace-nowrap">Color Presets:</span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              setFgColor(p.fg);
              setBgColor(p.bg);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300 whitespace-nowrap cursor-pointer"
          >
            <span
              className="w-3 h-3 rounded-full border border-black/10 inline-block"
              style={{ backgroundColor: p.fg }}
            />
            <span
              className="w-3 h-3 rounded-full border border-black/10 inline-block -ml-1"
              style={{ backgroundColor: p.bg }}
            />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Color Selectors & Score (Left) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pickers */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Foreground (Text / Icon)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Swap Colors</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Background (Surface)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Contrast Score Card */}
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-center space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Calculated WCAG 2.1 Ratio
            </span>
            <div className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
              {contrast.ratioFormatted}
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 text-left">
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  contrast.aaNormal
                    ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
                    : "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div>
                  <div className="font-bold text-[11px]">AA Normal Text</div>
                  <div className="text-[10px] opacity-80">Req: 4.5:1</div>
                </div>
                {contrast.aaNormal ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
              </div>

              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  contrast.aaLarge
                    ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
                    : "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div>
                  <div className="font-bold text-[11px]">AA Large Text</div>
                  <div className="text-[10px] opacity-80">Req: 3.0:1</div>
                </div>
                {contrast.aaLarge ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
              </div>

              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  contrast.aaaNormal
                    ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
                    : "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div>
                  <div className="font-bold text-[11px]">AAA Normal Text</div>
                  <div className="text-[10px] opacity-80">Req: 7.0:1</div>
                </div>
                {contrast.aaaNormal ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
              </div>

              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                  contrast.aaaLarge
                    ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
                    : "border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300"
                }`}
              >
                <div>
                  <div className="font-bold text-[11px]">AAA Large Text</div>
                  <div className="text-[10px] opacity-80">Req: 4.5:1</div>
                </div>
                {contrast.aaaLarge ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
              </div>
            </div>
          </div>

          <CopyButton text={cssSnippet} label="Copy CSS Properties" variant="secondary" />
        </div>

        {/* Live Visual Preview (Right) */}
        <div className="lg:col-span-7 space-y-3">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
            Real-World Rendering Preview
          </span>

          <div
            className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6 transition-colors duration-200 min-h-[360px]"
            style={{ backgroundColor: bgColor, color: fgColor }}
          >
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Large Heading Text (18pt+ or 14pt bold)
              </h2>
              <p className="text-xs opacity-75 mt-0.5">
                Evaluated under WCAG 2.1 Large Text thresholds (3.0:1 for AA).
              </p>
            </div>

            <div className="text-sm leading-relaxed space-y-2">
              <p>
                This is standard body copy text. Good contrast ensures readability for users with low vision, color blindness, or varying lighting conditions.
              </p>
              <p className="text-xs">
                Smaller caption text (12px): Always verify that vital labels and metadata maintain comfortable contrast against the surrounding canvas.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-xs font-semibold shadow-xs"
                style={{
                  backgroundColor: fgColor,
                  color: bgColor,
                }}
              >
                Inverted Button Element
              </button>
              <div
                className="px-3 py-1.5 rounded-lg border text-xs font-medium"
                style={{ borderColor: fgColor }}
              >
                Outlined Badge
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
