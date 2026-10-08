"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Download, Eye, Code, Globe, ArrowRight, Loader2, Check, FileJson, Layers, Palette, Sliders, AlertCircle, Camera } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

import {
  hexToRgb,
  rgbToHex,
  tintColor,
  shadeColor,
  generateDesignDoc,
  DesignObservation,
} from "./engine";

export default function DesignMdGenerator() {
  const [urlInput, setUrlInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Form State
  const [projectName, setProjectName] = useState("Linear");
  const [platform, setPlatform] = useState("Web (Responsive)");
  const [brandTone, setBrandTone] = useState("Precision, High-Contrast, Developer-Centric");
  const [primaryColor, setPrimaryColor] = useState("#5e6ad2");
  const [accentColor, setAccentColor] = useState("#f43f5e");
  const [neutralType, setNeutralType] = useState("Zinc (Deep Obsidian Dark)");
  const [headingFont, setHeadingFont] = useState("Inter Display");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [monoFont, setMonoFont] = useState("JetBrains Mono");
  const [baseRadius, setBaseRadius] = useState("8px (Subtle Precision)");
  const [elevationStyle, setElevationStyle] = useState("Subtle Multi-layer (Linear style)");
  const [previewTab, setPreviewTab] = useState<"preview" | "code" | "tailwind" | "css" | "tokens">("preview");
  const [dateString, setDateString] = useState("2026-10-08");

  useEffect(() => {
    setDateString(new Date().toISOString().split("T")[0]);
  }, []);

  const [observation, setObservation] = useState<DesignObservation | undefined>();
  const [screenshotName, setScreenshotName] = useState<string | null>(null);

  const [screenshotStatus, setScreenshotStatus] = useState<string | null>(null);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotName(file.name);
      setScreenshotStatus("Sampling image pixels via HTML5 Canvas...");

      // Client-side HTML5 canvas pixel sampling
      try {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) {
              setScreenshotStatus("Attached as reference (Canvas context unavailable)");
              return;
            }
            const targetDim = 64;
            const scale = Math.min(targetDim / img.naturalWidth, targetDim / img.naturalHeight, 1);
            const w = Math.max(1, Math.floor(img.naturalWidth * scale));
            const h = Math.max(1, Math.floor(img.naturalHeight * scale));
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);

            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;
            const buckets = new Map<string, { r: number; g: number; b: number; count: number; sat: number }>();

            for (let i = 0; i < data.length; i += 4) {
              const a = data[i + 3];
              if (a < 128) continue;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              const brightness = (r + g + b) / 3;
              if (brightness < 18 || brightness > 242) continue;

              const qr = Math.min(255, Math.round(r / 32) * 32);
              const qg = Math.min(255, Math.round(g / 32) * 32);
              const qb = Math.min(255, Math.round(b / 32) * 32);

              const maxC = Math.max(r, g, b);
              const minC = Math.min(r, g, b);
              const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

              const key = `${qr},${qg},${qb}`;
              const item = buckets.get(key);
              if (item) {
                item.count += 1;
              } else {
                buckets.set(key, { r: qr, g: qg, b: qb, count: 1, sat });
              }
            }

            const sorted = Array.from(buckets.values()).sort((a, b) => {
              const scoreA = a.count * (1 + a.sat * 2.5);
              const scoreB = b.count * (1 + b.sat * 2.5);
              return scoreB - scoreA;
            });

            const sampledPalette: string[] = [];
            for (const item of sorted) {
              const hex =
                "#" +
                [item.r, item.g, item.b]
                  .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0"))
                  .join("");
              if (!sampledPalette.includes(hex)) {
                sampledPalette.push(hex);
              }
              if (sampledPalette.length >= 4) break;
            }

            if (sampledPalette.length > 0) {
              setPrimaryColor(sampledPalette[0]);
              if (sampledPalette.length > 1) {
                setAccentColor(sampledPalette[1]);
              }
              setScreenshotStatus(`Canvas pixel analysis extracted: ${sampledPalette.join(", ")}`);
              setObservation((prev) => ({
                ...prev,
                hasScreenshot: true,
                screenshotName: file.name,
                detectedColors: Array.from(new Set([...(prev?.detectedColors || []), ...sampledPalette])),
                detectedFonts: prev?.detectedFonts || [],
              }));
            } else {
              setScreenshotStatus("Attached as visual reference asset (neutral/grayscale image)");
              setObservation((prev) => ({
                ...prev,
                hasScreenshot: true,
                screenshotName: file.name,
                detectedColors: prev?.detectedColors || [],
                detectedFonts: prev?.detectedFonts || [],
              }));
            }
          } catch (canvasErr) {
            console.warn("Canvas analysis failed", canvasErr);
            setScreenshotStatus("Attached as reference asset");
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          setScreenshotStatus("Attached as reference asset");
        };
        img.src = objectUrl;
      } catch (err) {
        console.warn("File reading failed", err);
        setScreenshotStatus("Attached as reference asset");
      }

      confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
    }
  };

  const handleExtractFromUrl = async (targetUrl?: string) => {
    const raw = targetUrl || urlInput;
    if (!raw.trim()) return;

    setIsExtracting(true);
    setExtractSuccess(null);
    setExtractError(null);

    try {
      const res = await fetch("/api/extract-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.projectName) setProjectName(data.projectName);
        if (data.brandTone) setBrandTone(data.brandTone);
        if (data.primaryColor) setPrimaryColor(data.primaryColor);
        if (data.accentColor) setAccentColor(data.accentColor);
        if (data.neutralType) setNeutralType(data.neutralType);
        if (data.headingFont) setHeadingFont(data.headingFont);
        if (data.bodyFont) setBodyFont(data.bodyFont);
        if (data.monoFont) setMonoFont(data.monoFont);
        if (data.baseRadius) setBaseRadius(data.baseRadius);
        if (data.elevationStyle) setElevationStyle(data.elevationStyle);

        setObservation({
          sourceUrl: data.domain ? `https://${data.domain}` : undefined,
          hasScreenshot: Boolean(screenshotName),
          screenshotName: screenshotName || undefined,
          observedTitle: data.observed?.title,
          observedThemeColor: data.observed?.themeColor,
          detectedColors: data.observed?.detectedColors || [],
          detectedFonts: data.observed?.detectedFonts || [],
          notes: data.notes || [],
        });

        if (data.source === "curated-preset") {
          setExtractSuccess(`Loaded curated reference design tokens for ${data.domain} (pre-compiled baseline)`);
        } else {
          setExtractSuccess(`Extracted live design tokens from ${data.domain}!`);
        }
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      } else {
        setExtractError(data.error || "Failed to inspect website. Enter details manually or check URL.");
      }
    } catch (err) {
      setExtractError("Network connection failed while inspecting website.");
      console.error("Extraction error", err);
    } finally {
      setIsExtracting(false);
      setTimeout(() => setExtractSuccess(null), 5000);
    }
  };

  const designDoc = useMemo(() => {
    return generateDesignDoc(
      {
        projectName,
        platform,
        brandTone,
        primaryColor,
        accentColor,
        neutralType,
        headingFont,
        bodyFont,
        monoFont,
        baseRadius,
        elevationStyle,
        dateString,
      },
      observation
    );
  }, [
    projectName,
    platform,
    brandTone,
    primaryColor,
    accentColor,
    neutralType,
    headingFont,
    bodyFont,
    monoFont,
    baseRadius,
    elevationStyle,
    dateString,
    observation,
  ]);

  const markdownContent = designDoc.markdown;

  const tailwindCode = designDoc.tailwindConfig;
  const cssCode = designDoc.cssVariables;
  const tokensJson = designDoc.tokensJson;

  const handleDownload = () => {
    if (previewTab === "tailwind") {
      downloadFile(tailwindCode, "tailwind.config.ts", "application/typescript");
    } else if (previewTab === "css") {
      downloadFile(cssCode, "tokens.css", "text/css");
    } else if (previewTab === "tokens") {
      downloadFile(tokensJson, "tokens.json", "application/json");
    } else {
      downloadFile(markdownContent, "DESIGN.md", "text/markdown");
    }
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Form (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Instant Website URL Extractor Box */}
        <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Extract Design from Any Website</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300">
              Live Scanner
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExtractFromUrl()}
              placeholder="e.g. linear.app, stripe.com, apple.com"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => handleExtractFromUrl()}
              disabled={isExtracting}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <span>Extract</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {extractSuccess && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium pt-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{extractSuccess}</span>
            </div>
          )}

          {extractError && (
            <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium pt-1 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{extractError}</span>
            </div>
          )}

          {/* Quick Preset Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
              Or Try Popular Workstations:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: "Linear", url: "https://linear.app" },
                { name: "Stripe", url: "https://stripe.com" },
                { name: "Supabase", url: "https://supabase.com" },
                { name: "Apple", url: "https://apple.com" },
                { name: "Vercel", url: "https://vercel.com" },
              ].map((site) => (
                <button
                  key={site.name}
                  type="button"
                  onClick={() => {
                    setUrlInput(site.url);
                    handleExtractFromUrl(site.url);
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  {site.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Screenshot Reference Uploader */}
        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-500" />
              <span>Reference Screenshot (Optional)</span>
            </span>
            {screenshotName && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                ✓ Attached
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
            Attach a design mockup or UI screenshot to record visual evidence in the specification.
          </div>
          <label className="flex items-center justify-center p-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer text-xs font-medium text-zinc-600 dark:text-zinc-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotUpload}
              className="hidden"
            />
            {screenshotName ? `📎 ${screenshotName} (Click to change)` : "Choose UI Screenshot or Mockup..."}
          </label>
          {screenshotStatus && (
            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg p-2 flex items-center justify-between">
              <span className="truncate">{screenshotStatus}</span>
            </div>
          )}
        </div>

        {/* Manual Adjustments */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <Sliders className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Fine-Tune Parameters
            </h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Project / Brand Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Target Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="Web (Responsive)">Web (Responsive)</option>
                <option value="Mobile Native (iOS/Android)">Mobile Native (iOS/Android)</option>
                <option value="Desktop App (Electron/Tauri)">Desktop App (Electron/Tauri)</option>
                <option value="Full Cross-Platform">Full Cross-Platform</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Aesthetic Tone
              </label>
              <input
                type="text"
                value={brandTone}
                onChange={(e) => setBrandTone(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
              Colors & Palette
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Primary Brand
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 px-1.5 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-20 px-1.5 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                Neutral Family
              </label>
              <input
                type="text"
                value={neutralType}
                onChange={(e) => setNeutralType(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Heading / Body Font
              </label>
              <input
                type="text"
                value={headingFont}
                onChange={(e) => {
                  setHeadingFont(e.target.value);
                  setBodyFont(e.target.value);
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Monospace Font
              </label>
              <input
                type="text"
                value={monoFont}
                onChange={(e) => setMonoFont(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Border Radius
              </label>
              <input
                type="text"
                value={baseRadius}
                onChange={(e) => setBaseRadius(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Elevation
              </label>
              <input
                type="text"
                value={elevationStyle}
                onChange={(e) => setElevationStyle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Output Panel (Right) */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-wrap gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setPreviewTab("preview")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                previewTab === "preview"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("code")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                previewTab === "code"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>DESIGN.md</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("tailwind")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                previewTab === "tailwind"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tailwind Config</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("css")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                previewTab === "css"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>CSS Ramp</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("tokens")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                previewTab === "tokens"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>tokens.json</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={
                previewTab === "tailwind"
                  ? tailwindCode
                  : previewTab === "css"
                  ? cssCode
                  : previewTab === "tokens"
                  ? tokensJson
                  : markdownContent
              }
              label="Copy"
              size="sm"
              variant="secondary"
              triggerConfetti
            />
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {previewTab === "tailwind"
                  ? "Download .ts"
                  : previewTab === "css"
                  ? "Download .css"
                  : previewTab === "tokens"
                  ? "Download .json"
                  : "Download .md"}
              </span>
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-5 flex-1 max-h-[640px] overflow-y-auto">
          {previewTab === "code" && (
            <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-blue-500/20">
              {markdownContent}
            </pre>
          )}

          {previewTab === "tailwind" && (
            <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-blue-500/20">
              {tailwindCode}
            </pre>
          )}

          {previewTab === "css" && (
            <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-blue-500/20">
              {cssCode}
            </pre>
          )}

          {previewTab === "tokens" && (
            <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-blue-500/20">
              {tokensJson}
            </pre>
          )}

          {previewTab === "preview" && (
            <div className="space-y-4 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {projectName} Design Spec
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                    DESIGN.md
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400">
                  {platform} • {brandTone}
                </p>
              </div>

              {/* Tokens Preview Card */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                  Color Token Palette
                </span>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm border border-black/10"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div>
                      <div className="font-medium text-[11px]">Primary</div>
                      <div className="font-mono text-[10px] text-zinc-400">{primaryColor}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm border border-black/10"
                      style={{ backgroundColor: accentColor }}
                    />
                    <div>
                      <div className="font-medium text-[11px]">Accent</div>
                      <div className="font-mono text-[10px] text-zinc-400">{accentColor}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg shadow-sm border border-zinc-700 bg-zinc-900" />
                    <div>
                      <div className="font-medium text-[11px]">Neutral</div>
                      <div className="font-mono text-[10px] text-zinc-400">{neutralType.split(" ")[0]}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography Preview */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                  Typography Sample
                </span>
                <p className="text-sm font-semibold" style={{ fontFamily: headingFont }}>
                  The quick brown fox jumps over the lazy dog ({headingFont})
                </p>
                <p className="font-mono text-[11px] text-zinc-500" style={{ fontFamily: monoFont }}>
                  const designTokens = &#123; primary: &quot;{primaryColor}&quot;, radius: &quot;{baseRadius}&quot; &#125;;
                </p>
              </div>

              {/* UI Component Simulation */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
                  Component Simulation Preview
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    style={{
                      backgroundColor: primaryColor,
                      borderRadius: baseRadius.split(" ")[0],
                    }}
                    className="px-4 py-2 text-white font-semibold text-xs shadow-xs"
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    style={{
                      borderRadius: baseRadius.split(" ")[0],
                      borderColor: primaryColor,
                    }}
                    className="px-4 py-2 border text-zinc-800 dark:text-zinc-200 font-medium text-xs bg-transparent"
                  >
                    Secondary Outline
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
