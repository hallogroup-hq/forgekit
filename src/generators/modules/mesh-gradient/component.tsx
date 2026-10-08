"use client";

import React, { useState, useMemo } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

interface GradientPoint {
  id: string;
  x: number; // 0-100%
  y: number; // 0-100%
  color: string;
  size: number; // 20-120%
  opacity: number; // 0.1 - 1.0
}

interface MeshPreset {
  name: string;
  bgBase: string;
  points: GradientPoint[];
}

const PRESETS: MeshPreset[] = [
  {
    name: "Obsidian Aurora",
    bgBase: "#09090b",
    points: [
      { id: "1", x: 20, y: 30, color: "#4f46e5", size: 60, opacity: 0.6 },
      { id: "2", x: 80, y: 25, color: "#ec4899", size: 70, opacity: 0.5 },
      { id: "3", x: 45, y: 80, color: "#06b6d4", size: 65, opacity: 0.5 },
      { id: "4", x: 90, y: 85, color: "#8b5cf6", size: 50, opacity: 0.4 },
    ],
  },
  {
    name: "Sunset Horizon",
    bgBase: "#180a0a",
    points: [
      { id: "1", x: 15, y: 40, color: "#f97316", size: 70, opacity: 0.7 },
      { id: "2", x: 75, y: 30, color: "#ef4444", size: 65, opacity: 0.6 },
      { id: "3", x: 50, y: 85, color: "#eab308", size: 80, opacity: 0.5 },
    ],
  },
  {
    name: "Cyber Emerald",
    bgBase: "#021c14",
    points: [
      { id: "1", x: 25, y: 25, color: "#10b981", size: 65, opacity: 0.6 },
      { id: "2", x: 80, y: 70, color: "#14b8a6", size: 75, opacity: 0.5 },
      { id: "3", x: 30, y: 85, color: "#065f46", size: 60, opacity: 0.7 },
    ],
  },
  {
    name: "Soft Lavender Glow",
    bgBase: "#faf5ff",
    points: [
      { id: "1", x: 20, y: 20, color: "#c084fc", size: 60, opacity: 0.4 },
      { id: "2", x: 80, y: 30, color: "#f472b6", size: 55, opacity: 0.4 },
      { id: "3", x: 40, y: 80, color: "#818cf8", size: 70, opacity: 0.35 },
    ],
  },
];

export default function MeshGradientGenerator() {
  const [bgBase, setBgBase] = useState("#09090b");
  const [blurAmount, setBlurAmount] = useState(40);
  const [points, setPoints] = useState<GradientPoint[]>([
    { id: "1", x: 20, y: 30, color: "#4f46e5", size: 60, opacity: 0.6 },
    { id: "2", x: 80, y: 25, color: "#ec4899", size: 70, opacity: 0.5 },
    { id: "3", x: 45, y: 80, color: "#06b6d4", size: 65, opacity: 0.5 },
    { id: "4", x: 90, y: 85, color: "#8b5cf6", size: 50, opacity: 0.4 },
  ]);
  const [selectedPointId, setSelectedPointId] = useState<string>("1");
  const [activeTab, setActiveTab] = useState<"css" | "tailwind" | "svg">("css");

  const selectedPoint = points.find((p) => p.id === selectedPointId) || points[0];

  const loadPreset = (preset: MeshPreset) => {
    setBgBase(preset.bgBase);
    setPoints(JSON.parse(JSON.stringify(preset.points)));
    setSelectedPointId(preset.points[0]?.id || "1");
    confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
  };

  const addPoint = () => {
    if (points.length >= 6) return;
    const id = Date.now().toString();
    const newPt: GradientPoint = {
      id,
      x: Math.floor(Math.random() * 80) + 10,
      y: Math.floor(Math.random() * 80) + 10,
      color: "#3b82f6",
      size: 60,
      opacity: 0.5,
    };
    setPoints((prev) => [...prev, newPt]);
    setSelectedPointId(id);
  };

  const removePoint = (id: string) => {
    if (points.length <= 2) return;
    setPoints((prev) => prev.filter((p) => p.id !== id));
    if (selectedPointId === id) {
      setSelectedPointId(points.find((p) => p.id !== id)?.id || "1");
    }
  };

  const updatePoint = (id: string, updates: Partial<GradientPoint>) => {
    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Convert hex to rgba
  const hexToRgba = (hex: string, opacity: number): string => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Generate CSS Radial Gradients string
  const cssBackground = useMemo(() => {
    const radials = points.map((p) => {
      const col = hexToRgba(p.color, p.opacity);
      return `radial-gradient(at ${p.x}% ${p.y}%, ${col} 0px, transparent ${p.size}%)`;
    });
    return `${radials.join(", ")}, ${bgBase}`;
  }, [points, bgBase]);

  // Generate Pure CSS Block
  const cssOutput = useMemo(() => {
    return `/* Mesh Gradient Background */
.mesh-gradient-bg {
  background-color: ${bgBase};
  background-image: 
    ${points
      .map(
        (p) =>
          `radial-gradient(at ${p.x}% ${p.y}%, ${hexToRgba(p.color, p.opacity)} 0px, transparent ${p.size}%)`
      )
      .join(",\n    ")};
  filter: blur(${blurAmount > 0 ? `${blurAmount}px` : "0"});
  overflow: hidden;
}`;
  }, [bgBase, points, blurAmount]);

  // Generate Tailwind JSX Snippet
  const tailwindOutput = useMemo(() => {
    return `<div 
  className="relative w-full h-96 overflow-hidden rounded-2xl"
  style={{
    backgroundColor: "${bgBase}",
    backgroundImage: \`${points
      .map(
        (p) =>
          `radial-gradient(at ${p.x}% ${p.y}%, ${hexToRgba(p.color, p.opacity)} 0px, transparent ${p.size}%)`
      )
      .join(", ")}\`,
    filter: "${blurAmount > 0 ? `blur(${blurAmount}px)` : "none"}",
  }}
/>`;
  }, [bgBase, points, blurAmount]);

  // Generate SVG vector code
  const svgOutput = useMemo(() => {
    const defs = points
      .map(
        (p, idx) => `    <radialGradient id="grad${idx}" cx="${p.x}%" cy="${p.y}%" r="${p.size / 2}%">
      <stop offset="0%" stop-color="${p.color}" stop-opacity="${p.opacity}" />
      <stop offset="100%" stop-color="${p.color}" stop-opacity="0" />
    </radialGradient>`
      )
      .join("\n");

    const rects = points
      .map((_, idx) => `  <rect width="100%" height="100%" fill="url(#grad${idx})" />`)
      .join("\n");

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <defs>
${defs}
  </defs>
  <rect width="100%" height="100%" fill="${bgBase}" />
${rects}
</svg>`;
  }, [bgBase, points]);

  const handleDownloadSvg = () => {
    downloadFile(svgOutput, "mesh-gradient.svg", "image/svg+xml");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Preset Palette Chips */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Palette Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => loadPreset(preset)}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Global Settings */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Base Fill Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgBase}
                  onChange={(e) => setBgBase(e.target.value)}
                  className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={bgBase}
                  onChange={(e) => setBgBase(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Canvas Blur</span>
                <span>{blurAmount}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={blurAmount}
                onChange={(e) => setBlurAmount(parseInt(e.target.value))}
                className="w-full accent-blue-600 mt-2"
              />
            </div>
          </div>
        </div>

        {/* Gradient Points Manager */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
              Radial Color Nodes ({points.length}/6)
            </label>
            {points.length < 6 && (
              <button
                type="button"
                onClick={addPoint}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 flex items-center gap-1 active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Node
              </button>
            )}
          </div>

          {/* Node Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {points.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPointId(p.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg border flex items-center gap-2 transition-colors ${
                  selectedPointId === p.id
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/20"
                  style={{ backgroundColor: p.color }}
                />
                <span>Node {idx + 1}</span>
              </button>
            ))}
          </div>

          {/* Selected Point Controls */}
          {selectedPoint && (
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedPoint.color}
                    onChange={(e) => updatePoint(selectedPoint.id, { color: e.target.value })}
                    className="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={selectedPoint.color}
                    onChange={(e) => updatePoint(selectedPoint.id, { color: e.target.value })}
                    className="w-20 px-2 py-0.5 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
                  />
                </div>

                {points.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePoint(selectedPoint.id)}
                    className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>

              {/* Position X / Y */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-zinc-500 mb-1">
                    <span>Position X</span>
                    <span>{selectedPoint.x}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={selectedPoint.x}
                    onChange={(e) => updatePoint(selectedPoint.id, { x: parseInt(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-zinc-500 mb-1">
                    <span>Position Y</span>
                    <span>{selectedPoint.y}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={selectedPoint.y}
                    onChange={(e) => updatePoint(selectedPoint.id, { y: parseInt(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>

              {/* Spread & Opacity */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-zinc-500 mb-1">
                    <span>Spread Radius</span>
                    <span>{selectedPoint.size}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={120}
                    value={selectedPoint.size}
                    onChange={(e) => updatePoint(selectedPoint.id, { size: parseInt(e.target.value) })}
                    className="w-full accent-blue-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-zinc-500 mb-1">
                    <span>Opacity</span>
                    <span>{Math.round(selectedPoint.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={Math.round(selectedPoint.opacity * 100)}
                    onChange={(e) => updatePoint(selectedPoint.id, { opacity: parseInt(e.target.value) / 100 })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview & Code Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Visual Live Canvas */}
        <div className="relative w-full h-72 sm:h-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex items-center justify-center">
          <div
            className="absolute inset-0 transition-all duration-150"
            style={{
              backgroundColor: bgBase,
              backgroundImage: cssBackground,
              filter: blurAmount > 0 ? `blur(${blurAmount}px)` : "none",
            }}
          />

          {/* Interactive Node Coordinate Markers */}
          <div className="absolute inset-0 pointer-events-none">
            {points.map((p, idx) => (
              <div
                key={p.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto cursor-pointer"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                onClick={() => setSelectedPointId(p.id)}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 shadow-md flex items-center justify-center text-[10px] font-bold ${
                    selectedPointId === p.id
                      ? "border-white ring-2 ring-blue-500 scale-110"
                      : "border-white/80 opacity-80"
                  }`}
                  style={{ backgroundColor: p.color }}
                >
                  <span className="text-white drop-shadow-sm">{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-semibold pointer-events-none">
            Interactive Canvas Preview
          </div>
        </div>

        {/* Code Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("css")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "css"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Pure CSS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tailwind")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "tailwind"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Tailwind JSX
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("svg")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "svg"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              SVG Vector Code
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={activeTab === "css" ? cssOutput : activeTab === "tailwind" ? tailwindOutput : svgOutput}
              label="Copy Code"
            />
            {activeTab === "svg" && (
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                Download .svg
              </button>
            )}
          </div>
        </div>

        {/* Code Output Box */}
        <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[300px] overflow-y-auto">
          {activeTab === "css" && cssOutput}
          {activeTab === "tailwind" && tailwindOutput}
          {activeTab === "svg" && svgOutput}
        </pre>
      </div>
    </div>
  );
}
