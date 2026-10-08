"use client";

import React, { useState, useMemo } from "react";
import { Download, Maximize2, Lock, Unlock, Code, Layers, FileCode } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  calculateAspectRatioMetrics,
  scalePreservingRatio,
  generateCssSnippet,
  generateTailwindSnippet,
  generateSrcsetSnippet,
} from "./engine";

interface RatioPreset {
  id: string;
  name: string;
  ratioW: number;
  ratioH: number;
  defaultW: number;
  defaultH: number;
  desc: string;
}

const PRESETS: RatioPreset[] = [
  {
    id: "16-9",
    name: "16:9 Widescreen",
    ratioW: 16,
    ratioH: 9,
    defaultW: 1920,
    defaultH: 1080,
    desc: "YouTube, Netflix, standard video playback",
  },
  {
    id: "9-16",
    name: "9:16 Vertical Story",
    ratioW: 9,
    ratioH: 16,
    defaultW: 1080,
    defaultH: 1920,
    desc: "TikTok, Instagram Reels, YouTube Shorts",
  },
  {
    id: "4-3",
    name: "4:3 Standard",
    ratioW: 4,
    ratioH: 3,
    defaultW: 1024,
    defaultH: 768,
    desc: "Classic photo, presentation slides, retro monitors",
  },
  {
    id: "1-1",
    name: "1:1 Square",
    ratioW: 1,
    ratioH: 1,
    defaultW: 1080,
    defaultH: 1080,
    desc: "Instagram feed, profile avatars, product thumbnails",
  },
  {
    id: "21-9",
    name: "21:9 Ultrawide",
    ratioW: 21,
    ratioH: 9,
    defaultW: 2560,
    defaultH: 1080,
    desc: "Cinematic anamorphic video, gaming monitors",
  },
  {
    id: "og-card",
    name: "1.91:1 Open Graph",
    ratioW: 120,
    ratioH: 63,
    defaultW: 1200,
    defaultH: 630,
    desc: "Twitter Summary Large Card, Facebook link share",
  },
];

export default function AspectRatioGenerator() {
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [isLocked, setIsLocked] = useState(true);
  const [activeTab, setActiveTab] = useState<"css" | "tailwind" | "srcset" | "react">("css");

  const metrics = useMemo(() => {
    return calculateAspectRatioMetrics(width, height);
  }, [width, height]);

  const applyPreset = (preset: RatioPreset) => {
    setWidth(preset.defaultW);
    setHeight(preset.defaultH);
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
  };

  const handleWidthChange = (newW: number) => {
    setWidth(newW);
    if (isLocked && width > 0) {
      const scaledH = scalePreservingRatio(newW, "width", width, height);
      setHeight(scaledH);
    }
  };

  const handleHeightChange = (newH: number) => {
    setHeight(newH);
    if (isLocked && height > 0) {
      const scaledW = scalePreservingRatio(newH, "height", width, height);
      setWidth(scaledW);
    }
  };

  const cssCode = useMemo(() => {
    return generateCssSnippet(metrics);
  }, [metrics]);

  const tailwindCode = useMemo(() => {
    return generateTailwindSnippet(metrics);
  }, [metrics]);

  const srcsetCode = useMemo(() => {
    return generateSrcsetSnippet(metrics);
  }, [metrics]);

  const reactCode = useMemo(() => {
    return `// React Inline Style Component
export function ResponsiveBox({ children }: { children?: React.ReactNode }) {
  return (
    <div
      style={{
        aspectRatio: "${metrics.simplifiedW} / ${metrics.simplifiedH}",
        maxWidth: "${metrics.width}px",
        width: "100%",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
}`;
  }, [metrics]);

  const activeSnippet = useMemo(() => {
    switch (activeTab) {
      case "css":
        return cssCode;
      case "tailwind":
        return tailwindCode;
      case "srcset":
        return srcsetCode;
      case "react":
        return reactCode;
    }
  }, [activeTab, cssCode, tailwindCode, srcsetCode, reactCode]);

  const handleDownload = () => {
    downloadFile(activeSnippet, `aspect-ratio-${metrics.simplifiedW}x${metrics.simplifiedH}.txt`, "text/plain");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Preset Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Standard Aspect Ratios
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="p-2.5 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {p.name}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    {p.defaultW}x{p.defaultH}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dimension Controls */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Dimension Scaler
            </span>
            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                isLocked
                  ? "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400"
                  : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{isLocked ? "Ratio Locked" : "Free Transform"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Width (Pixels)
              </label>
              <input
                type="number"
                min={10}
                max={7680}
                value={width}
                onChange={(e) => handleWidthChange(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-zinc-500 block mb-1">
                Height (Pixels)
              </label>
              <input
                type="number"
                min={10}
                max={4320}
                value={height}
                onChange={(e) => handleHeightChange(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-center font-mono">
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50">
              <div className="text-[10px] text-zinc-400">Ratio</div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {metrics.ratioString}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50">
              <div className="text-[10px] text-zinc-400">Decimal</div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {metrics.decimalRatioFormatted}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50">
              <div className="text-[10px] text-zinc-400">Padding-Top</div>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {metrics.paddingTopPct}%
              </div>
            </div>
          </div>
        </div>

        {/* Visual Aspect Ratio Wireframe Preview */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
            <span>Visual Box Scale</span>
            <span className="text-zinc-400 font-mono text-[11px]">
              {metrics.ratioString} ({width} x {height})
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center min-h-[160px] overflow-hidden">
            <div
              style={{
                aspectRatio: `${metrics.simplifiedW} / ${metrics.simplifiedH}`,
                maxHeight: "130px",
                maxWidth: "240px",
              }}
              className="w-full h-full bg-blue-500/15 border-2 border-dashed border-blue-500/50 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 shadow-2xs transition-all duration-200"
            >
              {metrics.ratioString}
            </div>
          </div>
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("css")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "css"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              CSS & Intrinsic Hack
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tailwind")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "tailwind"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Tailwind CSS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("srcset")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "srcset"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              HTML srcset
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("react")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "react"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              React Component
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton text={activeSnippet} label="Copy Snippet" triggerConfetti />
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

        {/* Code Output Viewer */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 overflow-hidden shadow-2xs flex flex-col">
          <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[600px] overflow-y-auto selection:bg-blue-500/20">
            {activeSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
