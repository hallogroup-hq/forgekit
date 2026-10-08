"use client";

import React, { useState, useMemo } from "react";
import { Download, RefreshCw, Eye, Code, Palette, Layers, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

import {
  ShapeKind,
  FillType,
  generateBlobPath,
  generateWavePath,
} from "./engine";

export default function SvgBlobGenerator() {
  const [shapeKind, setShapeKind] = useState<ShapeKind>("blob");
  const [pointsCount, setPointsCount] = useState(6);
  const [randomness, setRandomness] = useState(45);
  const [seed, setSeed] = useState(1337);
  const [fillType, setFillType] = useState<FillType>("linear");
  const [color1, setColor1] = useState("#6366f1");
  const [color2, setColor2] = useState("#ec4899");
  const [gradientAngle, setGradientAngle] = useState(135);
  const [activeTab, setActiveTab] = useState<"preview" | "svg" | "jsx" | "css">("preview");

  const pathData = useMemo(() => {
    if (shapeKind === "blob") {
      return generateBlobPath(pointsCount, randomness, seed);
    }
    return generateWavePath(pointsCount, randomness, seed);
  }, [shapeKind, pointsCount, randomness, seed]);

  const svgMarkup = useMemo(() => {
    const viewBox = shapeKind === "blob" ? "0 0 500 500" : "0 0 1200 400";
    let defs = "";
    let fill = color1;

    if (fillType === "linear") {
      defs = `<defs>
    <linearGradient id="blob-grad" gradientTransform="rotate(${gradientAngle})">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="100%" stop-color="${color2}" />
    </linearGradient>
  </defs>`;
      fill = "url(#blob-grad)";
    } else if (fillType === "radial") {
      defs = `<defs>
    <radialGradient id="blob-rad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${color1}" />
      <stop offset="100%" stop-color="${color2}" />
    </radialGradient>
  </defs>`;
      fill = "url(#blob-rad)";
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%">
  ${defs}
  <path d="${pathData}" fill="${fill}" />
</svg>`;
  }, [shapeKind, fillType, gradientAngle, color1, color2, pathData]);

  const reactJsx = useMemo(() => {
    const viewBox = shapeKind === "blob" ? "0 0 500 500" : "0 0 1200 400";
    return `export function OrganicShape(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="shape-gradient" gradientTransform="rotate(${gradientAngle})">
          <stop offset="0%" stopColor="${color1}" />
          <stop offset="100%" stopColor="${color2}" />
        </linearGradient>
      </defs>
      <path
        d="${pathData}"
        fill="${fillType === "solid" ? color1 : "url(#shape-gradient)"}"
      />
    </svg>
  );
}`;
  }, [shapeKind, gradientAngle, color1, color2, fillType, pathData]);

  const cssBackground = useMemo(() => {
    const encoded = encodeURIComponent(svgMarkup)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22");
    return `background-image: url("data:image/svg+xml,${encoded}");
background-repeat: no-repeat;
background-size: cover;
background-position: center;`;
  }, [svgMarkup]);

  const handleRandomize = () => {
    setSeed(Math.floor(Math.random() * 1000000));
    confetti({ particleCount: 15, spread: 40, origin: { y: 0.8 } });
  };

  const handleDownload = () => {
    downloadFile(svgMarkup, `${shapeKind}-${seed}.svg`, "image/svg+xml");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Shape Switcher */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Shape Geometry Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShapeKind("blob")}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                shapeKind === "blob"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Organic Closed Blob
            </button>
            <button
              type="button"
              onClick={() => setShapeKind("wave")}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                shapeKind === "wave"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Section Wave Divider
            </button>
          </div>
        </div>

        {/* Sliders & Geometry Configuration */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              <span>Complexity Points: {pointsCount}</span>
              <span className="text-[10px] text-zinc-400">Anchor vertices</span>
            </div>
            <input
              type="range"
              min={shapeKind === "blob" ? 3 : 4}
              max={shapeKind === "blob" ? 12 : 16}
              value={pointsCount}
              onChange={(e) => setPointsCount(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              <span>Organic Variance: {randomness}%</span>
              <span className="text-[10px] text-zinc-400">Curvature tension</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              value={randomness}
              onChange={(e) => setRandomness(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <button
            type="button"
            onClick={handleRandomize}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-[0.98]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Randomize Seed ({seed})
          </button>
        </div>

        {/* Color & Gradient Configuration */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4 shadow-2xs">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Fill Treatment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["linear", "radial", "solid"] as FillType[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFillType(f)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                    fillType === f
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                      : "bg-zinc-50 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Color 1</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="w-7 h-7 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="w-20 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>

            {fillType !== "solid" && (
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Color 2</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="w-7 h-7 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="w-20 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  />
                </div>
              </div>
            )}
          </div>

          {fillType === "linear" && (
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Angle: {gradientAngle} deg</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={gradientAngle}
                onChange={(e) => setGradientAngle(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Vector
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("svg")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "svg"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              SVG Markup
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("jsx")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "jsx"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              React JSX
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("css")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "css"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              CSS Data URI
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={
                activeTab === "jsx"
                  ? reactJsx
                  : activeTab === "css"
                  ? cssBackground
                  : svgMarkup
              }
              label="Copy"
              triggerConfetti
            />
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Download SVG
            </button>
          </div>
        </div>

        {/* Tab View Container */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-5 overflow-hidden shadow-2xs flex flex-col min-h-[460px]">
          {activeTab === "preview" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 relative overflow-hidden">
              <div
                className="w-full max-w-md h-auto flex items-center justify-center transition-all duration-300"
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            </div>
          )}

          {activeTab === "svg" && (
            <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[550px] overflow-y-auto selection:bg-blue-500/20">
              {svgMarkup}
            </pre>
          )}

          {activeTab === "jsx" && (
            <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[550px] overflow-y-auto selection:bg-blue-500/20">
              {reactJsx}
            </pre>
          )}

          {activeTab === "css" && (
            <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[550px] overflow-y-auto selection:bg-blue-500/20">
              {cssBackground}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
