"use client";

import React, { useState, useMemo } from "react";
import { Wand2, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
  if (isNaN(bigint)) return [0, 0, 0];
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const PRESETS = [
  { name: "Obsidian High-Contrast", fg: "#fafafa", bg: "#09090b" },
  { name: "Apple Slate Dark", fg: "#f1f5f9", bg: "#0f172a" },
  { name: "Solar Clean Light", fg: "#0f172a", bg: "#f8fafc" },
  { name: "Linear Violet Dark", fg: "#ffffff", bg: "#181826" },
  { name: "Subtle Amber Card", fg: "#78350f", bg: "#fef3c7" },
];

export default function ColorContrastGenerator() {
  const [fgColor, setFgColor] = useState("#f4f4f5");
  const [bgColor, setBgColor] = useState("#18181b");
  const [visionFilter, setVisionFilter] = useState<"normal" | "protanopia" | "deuteranopia" | "tritanopia" | "grayscale">("normal");

  const ratio = useMemo(() => {
    return getContrastRatio(fgColor, bgColor);
  }, [fgColor, bgColor]);

  const formattedRatio = ratio.toFixed(2);

  // Criteria checks
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  const aaaNormal = ratio >= 7.0;
  const aaaLarge = ratio >= 4.5;

  const loadPreset = (p: { fg: string; bg: string }) => {
    setFgColor(p.fg);
    setBgColor(p.bg);
  };

  const swapColors = () => {
    const temp = fgColor;
    setFgColor(bgColor);
    setBgColor(temp);
  };

  // 1-Click Auto-Tune for AAA (7.0:1)
  const autoTuneForAaa = () => {
    const [bgR, bgG, bgB] = hexToRgb(bgColor);
    const bgLum = getLuminance(bgR, bgG, bgB);

    let [r, g, b] = hexToRgb(fgColor);
    const isDarkBg = bgLum < 0.5;

    for (let step = 0; step < 100; step++) {
      const currentRatio = getContrastRatio(rgbToHex(r, g, b), bgColor);
      if (currentRatio >= 7.1) break;

      if (isDarkBg) {
        // Lighten foreground
        r = Math.min(255, r + 4);
        g = Math.min(255, g + 4);
        b = Math.min(255, b + 4);
      } else {
        // Darken foreground
        r = Math.max(0, r - 4);
        g = Math.max(0, g - 4);
        b = Math.max(0, b - 4);
      }
    }

    setFgColor(rgbToHex(r, g, b));
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Presets */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Standard Accessible Presets
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

        {/* Color Pickers */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Color Selections
            </span>
            <button
              type="button"
              onClick={swapColors}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Swap Colors
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Foreground */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Text / Foreground
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-9 h-9 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 uppercase"
                />
              </div>
            </div>

            {/* Background */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Surface / Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-9 h-9 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 uppercase"
                />
              </div>
            </div>
          </div>

          {/* 1-Click Auto-Tune Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={autoTuneForAaa}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98]"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-Tune to WCAG AAA (&gt; 7.0:1)</span>
            </button>
          </div>
        </div>

        {/* Vision Deficiency Filters */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-3">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
            Color Blindness Simulator
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "normal", label: "Normal Vision" },
              { id: "protanopia", label: "Protanopia (Red)" },
              { id: "deuteranopia", label: "Deuteranopia (Green)" },
              { id: "tritanopia", label: "Tritanopia (Blue)" },
              { id: "grayscale", label: "Achromatopsia (Mono)" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setVisionFilter(f.id as typeof visionFilter)}
                className={`px-2.5 py-1.5 text-[11px] rounded-lg border text-left transition-colors ${
                  visionFilter === f.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs"
                    : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results & Live Simulation Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        {/* Contrast Score Big Indicator */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Contrast Ratio
            </span>
            <div className="flex items-baseline gap-2 justify-center sm:justify-start">
              <span className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                {formattedRatio}
              </span>
              <span className="text-2xl font-bold text-zinc-400">: 1</span>
            </div>
            <p className="text-xs text-zinc-500">
              {ratio >= 7
                ? "Excellent: Exceeds highest WCAG AAA requirements."
                : ratio >= 4.5
                ? "Good: Passes WCAG AA for standard text."
                : ratio >= 3.0
                ? "Warning: Passes only for large headings (18px+)."
                : "Fails: Poor readability, does not meet WCAG standards."}
            </p>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto">
            <div className={`p-3 rounded-xl border text-center ${aaNormal ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"}`}>
              <div className="text-[10px] font-bold uppercase">WCAG AA Normal</div>
              <div className="text-xs font-bold mt-0.5">{aaNormal ? "PASS (4.5:1)" : "FAIL"}</div>
            </div>

            <div className={`p-3 rounded-xl border text-center ${aaLarge ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"}`}>
              <div className="text-[10px] font-bold uppercase">WCAG AA Large</div>
              <div className="text-xs font-bold mt-0.5">{aaLarge ? "PASS (3.0:1)" : "FAIL"}</div>
            </div>

            <div className={`p-3 rounded-xl border text-center ${aaaNormal ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"}`}>
              <div className="text-[10px] font-bold uppercase">WCAG AAA Normal</div>
              <div className="text-xs font-bold mt-0.5">{aaaNormal ? "PASS (7.0:1)" : "FAIL"}</div>
            </div>

            <div className={`p-3 rounded-xl border text-center ${aaaLarge ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"}`}>
              <div className="text-[10px] font-bold uppercase">WCAG AAA Large</div>
              <div className="text-xs font-bold mt-0.5">{aaaLarge ? "PASS (4.5:1)" : "FAIL"}</div>
            </div>
          </div>
        </div>

        {/* Simulated UI Card */}
        <div
          className={`p-6 sm:p-8 rounded-2xl border shadow-sm transition-all duration-150 space-y-6 ${
            visionFilter === "grayscale"
              ? "grayscale"
              : visionFilter === "protanopia"
              ? "contrast-125 sepia-50"
              : ""
          }`}
          style={{ backgroundColor: bgColor, borderColor: "rgba(128,128,128,0.2)" }}
        >
          {/* Headline */}
          <div className="space-y-2">
            <span
              className="text-xs font-bold uppercase tracking-wider opacity-75"
              style={{ color: fgColor }}
            >
              Interactive Preview Surface
            </span>
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: fgColor }}
            >
              The quick brown fox jumps over the lazy dog.
            </h2>
          </div>

          {/* Body Paragraph */}
          <p className="text-sm leading-relaxed" style={{ color: fgColor }}>
            Accessible typography ensures that every user, including people with low vision or varying ambient lighting conditions, can comfortably read your content without eye strain.
          </p>

          {/* Interactive UI Mockups */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95"
              style={{
                backgroundColor: fgColor,
                color: bgColor,
              }}
            >
              Primary Action
            </button>

            <span
              className="px-3 py-1 rounded-full text-xs font-semibold border"
              style={{
                borderColor: fgColor,
                color: fgColor,
              }}
            >
              Status Tag
            </span>

            <span className="text-xs opacity-75 font-mono" style={{ color: fgColor }}>
              fg: {fgColor} | bg: {bgColor}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
