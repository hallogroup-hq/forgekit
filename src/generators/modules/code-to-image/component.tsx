"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Code,
  Download,
  Copy,
  Check,
  Terminal,
  Sliders,
  Sparkles,
  Eye,
} from "lucide-react";
import {
  CodeTheme,
  BackdropStyle,
  CodeSnapperConfig,
  THEME_CONFIGS,
  parseHighlightedLines,
  getDefaultCodeSnapperConfig,
} from "./engine";

export default function CodeSnapper() {
  const [config, setConfig] = useState<CodeSnapperConfig>(getDefaultCodeSnapperConfig());
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const lines = config.code.split("\n");
  const highlightedSet = parseHighlightedLines(config.highlightedLinesInput);
  const currentTheme = THEME_CONFIGS[config.theme];

  const getBackdropCss = (style: BackdropStyle): string => {
    switch (style) {
      case "zinc-gradient":
        return "linear-gradient(135deg, #18181b 0%, #09090b 100%)";
      case "slate-gradient":
        return "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";
      case "dark-radial":
        return "radial-gradient(circle at 50% 30%, #27272a 0%, #09090b 100%)";
      case "pure-black":
        return "#000000";
      case "transparent":
        return "transparent";
    }
  };

  const exportCanvasBlob = useCallback(
    async (scale: number = 2): Promise<Blob | null> => {
      const container = previewRef.current;
      if (!container) return null;

      // We measure the element and render it cleanly to canvas
      const rect = container.getBoundingClientRect();
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(rect.width * scale);
      canvas.height = Math.round(rect.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.scale(scale, scale);

      // Draw backdrop
      if (config.backdrop === "zinc-gradient") {
        const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
        grad.addColorStop(0, "#18181b");
        grad.addColorStop(1, "#09090b");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, rect.width, rect.height);
      } else if (config.backdrop === "slate-gradient") {
        const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
        grad.addColorStop(0, "#1e293b");
        grad.addColorStop(1, "#0f172a");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, rect.width, rect.height);
      } else if (config.backdrop === "dark-radial") {
        const grad = ctx.createRadialGradient(
          rect.width / 2,
          rect.height * 0.3,
          20,
          rect.width / 2,
          rect.height / 2,
          rect.width
        );
        grad.addColorStop(0, "#27272a");
        grad.addColorStop(1, "#09090b");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, rect.width, rect.height);
      } else if (config.backdrop === "pure-black") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, rect.width, rect.height);
      }

      // Find the inner card element
      const cardEl = container.querySelector(".code-card") as HTMLElement;
      if (!cardEl) return null;
      const cardRect = cardEl.getBoundingClientRect();
      const cardX = cardRect.left - rect.left;
      const cardY = cardRect.top - rect.top;
      const cardW = cardRect.width;
      const cardH = cardRect.height;

      const safeRoundRect = (
        rx: number,
        ry: number,
        rw: number,
        rh: number,
        radii: number | number[]
      ) => {
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(rx, ry, rw, rh, radii);
        } else {
          ctx.rect(rx, ry, rw, rh);
        }
      };

      // Draw card shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;

      ctx.fillStyle = currentTheme.bg;
      ctx.beginPath();
      safeRoundRect(cardX, cardY, cardW, cardH, 12);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Draw card border
      ctx.strokeStyle = currentTheme.border;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Header titlebar
      ctx.fillStyle = currentTheme.titleBg;
      ctx.beginPath();
      safeRoundRect(cardX, cardY, cardW, 36, [12, 12, 0, 0]);
      ctx.fill();

      // Traffic light dots
      ctx.fillStyle = "#71717a";
      ctx.beginPath();
      ctx.arc(cardX + 16, cardY + 18, 5, 0, Math.PI * 2);
      ctx.arc(cardX + 30, cardY + 18, 5, 0, Math.PI * 2);
      ctx.arc(cardX + 44, cardY + 18, 5, 0, Math.PI * 2);
      ctx.fill();

      // Title
      if (config.title) {
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillStyle = "#a1a1aa";
        ctx.textAlign = "center";
        ctx.fillText(config.title, cardX + cardW / 2, cardY + 22);
      }

      // Code text lines
      const lineHeight = config.fontSize * 1.6;
      let textY = cardY + 36 + 20;

      ctx.font = `${config.fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;

      for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const lineText = lines[i];
        const isHighlighted = highlightedSet.has(lineNum);

        if (isHighlighted) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
          ctx.fillRect(cardX + 1, textY - config.fontSize * 1.1, cardW - 2, lineHeight);
        }

        // Line number
        if (config.showLineNumbers) {
          ctx.fillStyle = isHighlighted ? "#d4d4d8" : "#52525b";
          ctx.textAlign = "right";
          ctx.fillText(lineNum.toString(), cardX + 38, textY);
        }

        // Line content
        const contentX = config.showLineNumbers ? cardX + 54 : cardX + 20;
        ctx.fillStyle = currentTheme.text;
        ctx.textAlign = "left";
        ctx.fillText(lineText, contentX, textY);

        textY += lineHeight;
      }

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      });
    },
    [config, lines, highlightedSet, currentTheme]
  );

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const blob = await exportCanvasBlob(2);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `snapper-${config.title || "code"}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    setIsExporting(true);
    try {
      const blob = await exportCanvasBlob(2);
      if (!blob) return;
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Code & Terminal to Image (Snapper)
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Format snippet kode atau terminal logs menjadi gambar berkualitas tinggi dengan macOS window frame.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyClipboard}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy PNG"}
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:opacity-90 transition shadow-sm"
          >
            <Download size={14} />
            Download 2x PNG
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
          {/* Code Input */}
          <div>
            <label className="font-medium text-zinc-900 dark:text-zinc-200 block mb-1">
              Code Snippet / Terminal Input
            </label>
            <textarea
              rows={8}
              value={config.code}
              onChange={(e) => setConfig({ ...config, code: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              placeholder="Paste code snippet here..."
            />
          </div>

          {/* Title & Theme */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-zinc-500 block mb-1">Window Title</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                placeholder="index.ts"
              />
            </div>
            <div>
              <label className="text-zinc-500 block mb-1">Theme</label>
              <select
                value={config.theme}
                onChange={(e) => setConfig({ ...config, theme: e.target.value as CodeTheme })}
                className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 capitalize"
              >
                <option value="obsidian">Obsidian Noir</option>
                <option value="zinc">Zinc Slate</option>
                <option value="monokai">Monokai Dark</option>
                <option value="clean-light">Clean Light</option>
              </select>
            </div>
          </div>

          {/* Backdrop Style */}
          <div>
            <label className="text-zinc-500 block mb-1">Backdrop Style</label>
            <select
              value={config.backdrop}
              onChange={(e) => setConfig({ ...config, backdrop: e.target.value as BackdropStyle })}
              className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            >
              <option value="zinc-gradient">Zinc Gradient</option>
              <option value="slate-gradient">Deep Slate</option>
              <option value="dark-radial">Studio Glow</option>
              <option value="pure-black">Pure Black</option>
              <option value="transparent">Transparent</option>
            </select>
          </div>

          {/* Padding & Font Size */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-zinc-500 block mb-1">Padding ({config.padding}px)</label>
              <div className="grid grid-cols-3 gap-1">
                {[24, 48, 64].map((p) => (
                  <button
                    key={p}
                    onClick={() => setConfig({ ...config, padding: p })}
                    className={`py-1 rounded border text-center transition ${
                      config.padding === p
                        ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-medium"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-500 block mb-1">Font Size</label>
              <div className="grid grid-cols-3 gap-1">
                {[12, 13, 15].map((s) => (
                  <button
                    key={s}
                    onClick={() => setConfig({ ...config, fontSize: s })}
                    className={`py-1 rounded border text-center transition ${
                      config.fontSize === s
                        ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-medium"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Line Numbers & Highlight */}
          <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Line Numbers</span>
              <input
                type="checkbox"
                checked={config.showLineNumbers}
                onChange={(e) => setConfig({ ...config, showLineNumbers: e.target.checked })}
                className="rounded border-zinc-300 dark:border-zinc-700"
              />
            </div>
            <div>
              <label className="text-zinc-500 block mb-1">Highlight Lines (e.g. 2, 4-6)</label>
              <input
                type="text"
                value={config.highlightedLinesInput}
                onChange={(e) => setConfig({ ...config, highlightedLinesInput: e.target.value })}
                className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                placeholder="3, 5-7"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Stage */}
        <div className="lg:col-span-2 flex items-center justify-center p-6 bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-auto min-h-[420px]">
          <div
            ref={previewRef}
            style={{
              background: getBackdropCss(config.backdrop),
              padding: `${config.padding}px`,
              transition: "all 0.2s ease-out",
            }}
            className="rounded-2xl max-w-full flex items-center justify-center"
          >
            {/* Inner Code Window Card */}
            <div
              style={{
                backgroundColor: currentTheme.bg,
                borderColor: currentTheme.border,
                fontSize: `${config.fontSize}px`,
              }}
              className="code-card rounded-xl border shadow-2xl overflow-hidden min-w-[320px] max-w-[680px] w-full font-mono transition-colors"
            >
              {/* Window Titlebar */}
              <div
                style={{ backgroundColor: currentTheme.titleBg }}
                className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/5 select-none text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                </div>
                {config.title && (
                  <span className="text-zinc-400 text-[11px] font-sans truncate max-w-[200px]">
                    {config.title}
                  </span>
                )}
                <div className="w-8" />
              </div>

              {/* Code Body */}
              <div className="p-4 leading-relaxed overflow-x-auto">
                {lines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isHighlighted = highlightedSet.has(lineNum);
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: isHighlighted ? "rgba(255, 255, 255, 0.08)" : "transparent",
                      }}
                      className="flex items-baseline px-2 py-0.5 rounded transition"
                    >
                      {config.showLineNumbers && (
                        <span
                          style={{
                            color: isHighlighted ? "#d4d4d8" : "#52525b",
                          }}
                          className="w-7 shrink-0 text-right pr-3 select-none text-[11px]"
                        >
                          {lineNum}
                        </span>
                      )}
                      <span
                        style={{ color: currentTheme.text }}
                        className="whitespace-pre font-mono"
                      >
                        {line || " "}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
