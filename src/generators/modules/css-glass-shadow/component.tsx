"use client";

import React, { useState, useMemo } from "react";
import { Layers, Sliders } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import {
  hexToRgb,
  getElevationShadow,
  generateGlassmorphismCss,
  generateGlassmorphismTailwind,
} from "./engine";

export default function CssGlassShadowGenerator() {
  const [blur, setBlur] = useState(16);
  const [opacity, setOpacity] = useState(25); // 0-100%
  const [borderOpacity, setBorderOpacity] = useState(20);
  const [elevation, setElevation] = useState(3); // 1-5
  const [surfaceColor, setSurfaceColor] = useState("#ffffff");
  const [bgType, setBgType] = useState<"gradient" | "dark" | "mesh">("gradient");

  const rgb = useMemo(() => hexToRgb(surfaceColor).stringVal, [surfaceColor]);
  const shadowCss = useMemo(() => getElevationShadow(elevation), [elevation]);

  const bgRgba = `rgba(${rgb}, ${opacity / 100})`;
  const borderRgba = `rgba(${rgb}, ${borderOpacity / 100})`;

  const cssSnippet = useMemo(() => {
    return generateGlassmorphismCss({ blur, opacity, borderOpacity, elevation, surfaceColor });
  }, [blur, opacity, borderOpacity, elevation, surfaceColor]);

  const tailwindSnippet = useMemo(() => {
    return generateGlassmorphismTailwind({ blur, opacity, borderOpacity, elevation, surfaceColor });
  }, [blur, opacity, borderOpacity, elevation, surfaceColor]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls (Left) */}
      <div className="lg:col-span-5 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Sliders className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Effect Adjustments
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <span>Backdrop Blur</span>
              <span className="font-mono text-zinc-400">{blur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-zinc-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <span>Surface Opacity</span>
              <span className="font-mono text-zinc-400">{opacity}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="95"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-zinc-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <span>Border Opacity</span>
              <span className="font-mono text-zinc-400">{borderOpacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={borderOpacity}
              onChange={(e) => setBorderOpacity(Number(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-zinc-100"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <span>3D Shadow Elevation</span>
              <span className="font-mono text-zinc-400">Level {elevation}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={elevation}
              onChange={(e) => setElevation(Number(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-zinc-100"
            />
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Surface Tint Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={surfaceColor}
                  onChange={(e) => setSurfaceColor(e.target.value)}
                  className="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={surfaceColor}
                  onChange={(e) => setSurfaceColor(e.target.value)}
                  className="w-20 px-1.5 py-0.5 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-500 uppercase tracking-wider mb-1.5">
                Preview Background
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "gradient", label: "Sunset" },
                  { id: "mesh", label: "Aurora Mesh" },
                  { id: "dark", label: "Dark Space" },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setBgType(bg.id as "gradient" | "dark" | "mesh")}
                    className={`py-1 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      bgType === bg.id
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-2xs"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview & CSS Output (Right) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Dynamic Background Preview Stage */}
        <div
          className={`relative min-h-[300px] rounded-2xl flex items-center justify-center p-6 overflow-hidden transition-all duration-300 ${
            bgType === "gradient"
              ? "bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600"
              : bgType === "mesh"
              ? "bg-gradient-to-br from-teal-400 via-indigo-600 to-purple-800"
              : "bg-zinc-950"
          }`}
        >
          {/* Decorative glowing blobs */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-amber-400 rounded-full blur-2xl opacity-60 pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-500 rounded-full blur-3xl opacity-50 pointer-events-none" />

          {/* Interactive Card */}
          <div
            className="relative z-10 w-full max-w-sm p-6 text-zinc-900 transition-all duration-150"
            style={{
              backgroundColor: bgRgba,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              border: `1px solid ${borderRgba}`,
              boxShadow: shadowCss,
              borderRadius: "16px",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                Glass UI
              </span>
            </div>
            <h4 className="text-base font-bold text-white mb-1">
              Frosted Glass Element
            </h4>
            <p className="text-xs text-white/80 leading-relaxed mb-4">
              Real-time translucent surface with dynamic backdrop-filter blur and layered 3D depth.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-white/30 hover:bg-white/40 text-white text-xs font-semibold backdrop-blur-md transition-colors"
              >
                Action Button
              </button>
            </div>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <span className="text-xs font-mono text-zinc-500">CSS Output</span>
            <div className="flex items-center gap-2">
              <CopyButton
                text={cssSnippet}
                label="Copy CSS"
                size="sm"
                variant="secondary"
                triggerConfetti
              />
              <CopyButton
                text={tailwindSnippet}
                label="Copy Tailwind"
                size="sm"
                variant="outline"
              />
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre">
              {cssSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
