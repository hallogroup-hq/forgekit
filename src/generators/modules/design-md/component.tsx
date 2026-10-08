"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Download,
  Eye,
  Code,
  Globe,
  ArrowRight,
  Loader2,
  Check,
  FileJson,
  Layers,
  Palette,
  Sliders,
  AlertCircle,
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  FileCode,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

import {
  ARCHETYPES,
  DesignArchetype,
  FullDesignSystem,
  createArchetypeDesignSystem,
  generateDesignMdDocument,
  generateTokensJson,
  generateTokensCss,
  generateTailwindV3Config,
  generateTailwindV4Theme,
  generateComponentsCheatsheet,
  parseCssTokens,
  parseTokensJson,
  attr,
  DesignObservation,
} from "./engine";

export default function DesignMdGenerator() {
  // Layer 1: Inspection & Ingestion State
  const [urlInput, setUrlInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [screenshotStatus, setScreenshotStatus] = useState<string | null>(null);
  const [observation, setObservation] = useState<DesignObservation | undefined>();
  const [importSnippet, setImportSnippet] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Active Archetype & System State
  const [selectedArchetype, setSelectedArchetype] = useState<DesignArchetype>("modern-saas");
  const [system, setSystem] = useState<FullDesignSystem>(() =>
    createArchetypeDesignSystem("modern-saas", { projectName: "My Product Studio" })
  );

  // UI Navigation Tabs
  const [activeLayerTab, setActiveLayerTab] = useState<"inspect" | "editor" | "import">("editor");
  const [expandedSection, setExpandedSection] = useState<number | null>(1); // Open section 1 by default
  const [exportTab, setExportTab] = useState<"markdown" | "tokens" | "css" | "tailwindV3" | "tailwindV4" | "cheatsheet">("markdown");

  // Keep date updated
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setSystem((prev) => ({
      ...prev,
      identity: {
        ...prev.identity,
        date: attr(today, "inferred"),
      },
    }));
  }, []);

  // When Archetype changes, switch presets while preserving project name
  const handleArchetypeChange = (arch: DesignArchetype) => {
    setSelectedArchetype(arch);
    const newSystem = createArchetypeDesignSystem(arch, {
      projectName: system.identity.projectName.value,
      observation,
    });
    setSystem(newSystem);
    confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
  };

  // Layer 1.1: Live URL Extraction (SSRF-Guarded API)
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
        const newObs: DesignObservation = {
          sourceUrl: data.domain ? `https://${data.domain}` : undefined,
          hasScreenshot: Boolean(screenshotName),
          screenshotName: screenshotName || undefined,
          observedTitle: data.observed?.title,
          observedThemeColor: data.observed?.themeColor,
          detectedColors: data.observed?.detectedColors || [],
          detectedFonts: data.observed?.detectedFonts || [],
          notes: data.notes || [],
        };
        setObservation(newObs);

        // Update system values with observed provenance
        setSystem((prev) => {
          const updated = { ...prev };
          if (data.projectName) {
            updated.identity.projectName = attr(data.projectName, "observed", data.domain);
          }
          if (data.brandTone) {
            updated.identity.brandTone = attr(data.brandTone, "inferred", data.domain);
          }
          if (data.primaryColor) {
            updated.colors.primary = attr(data.primaryColor, "observed", data.domain);
          }
          if (data.accentColor) {
            updated.colors.accent = attr(data.accentColor, "observed", data.domain);
          }
          if (data.headingFont) {
            updated.typography.headingFont = attr(data.headingFont, "observed", data.domain);
          }
          if (data.bodyFont) {
            updated.typography.bodyFont = attr(data.bodyFont, "observed", data.domain);
          }
          return updated;
        });

        if (data.source === "curated-preset") {
          setExtractSuccess(`Loaded verified reference baseline for ${data.domain}`);
        } else {
          setExtractSuccess(`Extracted live design tokens from ${data.domain}!`);
        }
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      } else {
        setExtractError(data.error || "Failed to inspect website. Check URL or adjust parameters manually.");
      }
    } catch (err) {
      setExtractError("Network request failed while inspecting website.");
      console.error("Extraction error", err);
    } finally {
      setIsExtracting(false);
      setTimeout(() => setExtractSuccess(null), 5000);
    }
  };

  // Layer 1.2: HTML5 Canvas Pixel Clustering
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotName(file.name);
    setScreenshotStatus("Sampling image pixels via HTML5 Canvas...");

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            setScreenshotStatus("Attached as reference asset (Canvas unavailable)");
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
            setSystem((prev) => ({
              ...prev,
              colors: {
                ...prev.colors,
                primary: attr(sampledPalette[0], "observed", file.name, "Canvas pixel clustering"),
                accent: sampledPalette[1]
                  ? attr(sampledPalette[1], "observed", file.name, "Canvas pixel clustering")
                  : prev.colors.accent,
              },
            }));
            setScreenshotStatus(`Canvas pixel clustering extracted palette: ${sampledPalette.join(", ")}`);
            setObservation((prev) => ({
              ...prev,
              hasScreenshot: true,
              screenshotName: file.name,
              detectedColors: Array.from(new Set([...(prev?.detectedColors || []), ...sampledPalette])),
              detectedFonts: prev?.detectedFonts || [],
            }));
          } else {
            setScreenshotStatus("Attached as reference asset (grayscale image)");
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
      confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
    } catch (err) {
      console.warn("File reading failed", err);
      setScreenshotStatus("Attached as reference asset");
    }
  };

  // Layer 1.3: Token Importer (CSS / JSON)
  const handleImportTokens = () => {
    if (!importSnippet.trim()) return;
    try {
      let imported: Partial<FullDesignSystem> = {};
      if (importSnippet.trim().startsWith("{")) {
        imported = parseTokensJson(importSnippet);
      } else {
        imported = parseCssTokens(importSnippet);
      }

      setSystem((prev) => {
        const next = { ...prev };
        if (imported.colors?.primary) next.colors.primary = imported.colors.primary;
        if (imported.colors?.accent) next.colors.accent = imported.colors.accent;
        if (imported.typography?.headingFont) next.typography.headingFont = imported.typography.headingFont;
        if (imported.typography?.bodyFont) next.typography.bodyFont = imported.typography.bodyFont;
        if (imported.surfaces?.baseRadius) next.surfaces.baseRadius = imported.surfaces.baseRadius;
        return next;
      });

      setImportStatus("Successfully parsed and mapped tokens into Design System!");
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
      setTimeout(() => setImportStatus(null), 4000);
    } catch (e) {
      setImportStatus("Could not parse tokens. Please check your CSS or JSON syntax.");
    }
  };

  // Multi-Format Generated Outputs
  const generatedOutputs = useMemo(() => {
    return {
      markdown: generateDesignMdDocument(system, observation),
      tokens: generateTokensJson(system),
      css: generateTokensCss(system),
      tailwindV3: generateTailwindV3Config(system),
      tailwindV4: generateTailwindV4Theme(system),
      cheatsheet: generateComponentsCheatsheet(system),
    };
  }, [system, observation]);

  const activeOutputText = generatedOutputs[exportTab];

  const handleDownload = () => {
    const filenameMap: Record<typeof exportTab, { name: string; mime: string }> = {
      markdown: { name: "DESIGN.md", mime: "text/markdown" },
      tokens: { name: "tokens.json", mime: "application/json" },
      css: { name: "tokens.css", mime: "text/css" },
      tailwindV3: { name: "tailwind.config.ts", mime: "application/typescript" },
      tailwindV4: { name: "tailwind.theme.css", mime: "text/css" },
      cheatsheet: { name: "components.html", mime: "text/html" },
    };
    const target = filenameMap[exportTab];
    downloadFile(activeOutputText, target.name, target.mime);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="space-y-6">
      {/* Archetype Quick-Selector Banner */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Select Design Archetype
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            6 Production Archetypes
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {(Object.keys(ARCHETYPES) as DesignArchetype[]).map((archKey) => {
            const arch = ARCHETYPES[archKey];
            const isSelected = selectedArchetype === archKey;
            return (
              <button
                key={archKey}
                type="button"
                onClick={() => handleArchetypeChange(archKey)}
                className={`flex flex-col p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <span className="text-xs font-bold truncate">{arch.name.split("/")[0]}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                  {arch.tagline.split(",")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 3-Layer Studio Controls */}
        <div className="lg:col-span-6 space-y-5">
          {/* Layer Sub-Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveLayerTab("editor")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeLayerTab === "editor"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              <span>14-Section Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayerTab("inspect")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeLayerTab === "inspect"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>Reference Inspection</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayerTab("import")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeLayerTab === "import"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              <span>Token Importer</span>
            </button>
          </div>

          {/* Layer 1 Tab: Reference Inspection */}
          {activeLayerTab === "inspect" && (
            <div className="space-y-4 animate-in fade-in">
              {/* URL Scanner with SSRF Guard */}
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Live Website Extraction (SSRF-Guarded)</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                    Safe Fetch
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleExtractFromUrl()}
                    placeholder="e.g. linear.app, stripe.com, apple.com"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleExtractFromUrl()}
                    disabled={isExtracting}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Inspecting...</span>
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
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium pt-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{extractSuccess}</span>
                  </div>
                )}
                {extractError && (
                  <div className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{extractError}</span>
                  </div>
                )}

                {/* Popular Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    Curated Reference Workstations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Linear", url: "https://linear.app" },
                      { name: "Stripe", url: "https://stripe.com" },
                      { name: "Apple", url: "https://apple.com" },
                      { name: "Vercel", url: "https://vercel.com" },
                      { name: "Supabase", url: "https://supabase.com" },
                    ].map((site) => (
                      <button
                        key={site.name}
                        type="button"
                        onClick={() => {
                          setUrlInput(site.url);
                          handleExtractFromUrl(site.url);
                        }}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        {site.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Canvas Screenshot Sampling */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-500" />
                    <span>Reference Mockup / Screenshot</span>
                  </span>
                  {screenshotName && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      ✓ Analyzed
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  Upload any screenshot or UI asset. Client-side HTML5 Canvas clusters pixel colors into primary and accent palette tokens with empirical provenance.
                </div>
                <label className="flex items-center justify-center p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-xs font-medium text-zinc-600 dark:text-zinc-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="hidden"
                  />
                  {screenshotName ? `📎 ${screenshotName} (Click to change)` : "Choose UI Screenshot or Mockup..."}
                </label>
                {screenshotStatus && (
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-2 truncate">
                    {screenshotStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Layer 1.3: Token Importer Tab */}
          {activeLayerTab === "import" && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Import CSS Variables or W3C Tokens JSON</span>
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                Paste existing CSS tokens (:root declarations) or W3C Design Tokens JSON. The parser automatically extracts primary colors, heading fonts, and radii.
              </div>
              <textarea
                value={importSnippet}
                onChange={(e) => setImportSnippet(e.target.value)}
                rows={6}
                placeholder={`:root {\n  --color-primary: #6366f1;\n  --color-accent: #10b981;\n  --font-heading: "Inter Display";\n  --radius-base: 8px;\n}`}
                className="w-full p-2.5 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleImportTokens}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Parse & Apply Tokens
                </button>
                {importStatus && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {importStatus}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Layer 2: 14-Section Progressive Disclosure Studio */}
          {activeLayerTab === "editor" && (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {/* Section 1: Identity & Archetype */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 1 ? null : 1)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Identity & Brand Foundations
                    </span>
                  </div>
                  {expandedSection === 1 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                </button>
                {expandedSection === 1 && (
                  <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Project Name
                      </label>
                      <input
                        type="text"
                        value={system.identity.projectName.value}
                        onChange={(e) =>
                          setSystem((prev) => ({
                            ...prev,
                            identity: { ...prev.identity, projectName: attr(e.target.value, "user-provided") },
                          }))
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Platform
                        </label>
                        <input
                          type="text"
                          value={system.identity.platform.value}
                          onChange={(e) =>
                            setSystem((prev) => ({
                              ...prev,
                              identity: { ...prev.identity, platform: attr(e.target.value, "user-provided") },
                            }))
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Brand Tone
                        </label>
                        <input
                          type="text"
                          value={system.identity.brandTone.value}
                          onChange={(e) =>
                            setSystem((prev) => ({
                              ...prev,
                              identity: { ...prev.identity, brandTone: attr(e.target.value, "user-provided") },
                            }))
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Colors & Semantic Palette */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 2 ? null : 2)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Color System & Semantic Palette
                    </span>
                  </div>
                  {expandedSection === 2 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                </button>
                {expandedSection === 2 && (
                  <div className="p-4 space-y-3.5 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Primary Brand Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={system.colors.primary.value}
                            onChange={(e) =>
                              setSystem((prev) => {
                                const newPrimary = e.target.value;
                                return {
                                  ...prev,
                                  colors: {
                                    ...prev.colors,
                                    primary: attr(newPrimary, "user-provided"),
                                  },
                                };
                              })
                            }
                            className="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={system.colors.primary.value}
                            onChange={(e) =>
                              setSystem((prev) => ({
                                ...prev,
                                colors: { ...prev.colors, primary: attr(e.target.value, "user-provided") },
                              }))
                            }
                            className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Accent Highlight Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={system.colors.accent.value}
                            onChange={(e) =>
                              setSystem((prev) => ({
                                ...prev,
                                colors: { ...prev.colors, accent: attr(e.target.value, "user-provided") },
                              }))
                            }
                            className="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={system.colors.accent.value}
                            onChange={(e) =>
                              setSystem((prev) => ({
                                ...prev,
                                colors: { ...prev.colors, accent: attr(e.target.value, "user-provided") },
                              }))
                            }
                            className="flex-1 px-2.5 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color Ladder Preview */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono text-zinc-500">
                        Generated 11-Step Ladder (50 - 950)
                      </span>
                      <div className="flex h-6 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        {Object.entries(system.colors.primaryLadder.value).map(([step, hex]) => (
                          <div
                            key={step}
                            title={`${step}: ${hex}`}
                            className="flex-1 h-full"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Typography System */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 3 ? null : 3)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Typography System
                    </span>
                  </div>
                  {expandedSection === 3 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                </button>
                {expandedSection === 3 && (
                  <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Heading Font
                        </label>
                        <input
                          type="text"
                          value={system.typography.headingFont.value}
                          onChange={(e) =>
                            setSystem((prev) => ({
                              ...prev,
                              typography: { ...prev.typography, headingFont: attr(e.target.value, "user-provided") },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Body Font
                        </label>
                        <input
                          type="text"
                          value={system.typography.bodyFont.value}
                          onChange={(e) =>
                            setSystem((prev) => ({
                              ...prev,
                              typography: { ...prev.typography, bodyFont: attr(e.target.value, "user-provided") },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 6: Surfaces & Radii */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 6 ? null : 6)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                      6
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Surfaces, Elevation & Borders
                    </span>
                  </div>
                  {expandedSection === 6 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                </button>
                {expandedSection === 6 && (
                  <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Base Radius
                        </label>
                        <input
                          type="text"
                          value={system.surfaces.baseRadius.value}
                          onChange={(e) =>
                            setSystem((prev) => ({
                              ...prev,
                              surfaces: { ...prev.surfaces, baseRadius: attr(e.target.value, "user-provided") },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Card Radius
                        </label>
                        <input
                          type="text"
                          value={system.surfaces.cardRadius.value}
                          onChange={(e) =>
                            setSystem((prev) => ({
                              ...prev,
                              surfaces: { ...prev.surfaces, cardRadius: attr(e.target.value, "user-provided") },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 14: Accessibility & Contrast Audit */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 14 ? null : 14)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                      14
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Accessibility & Contrast Audit</span>
                    </span>
                  </div>
                  {expandedSection === 14 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                </button>
                {expandedSection === 14 && (
                  <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs pb-1">
                      <span className="text-zinc-500">Target Standard:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {system.accessibility.targetLevel.value}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {system.accessibility.verifiedContrastPairs.map((pair, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                              {pair.pair}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {pair.usage}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                              {pair.ratio}:1
                            </span>
                            {pair.passesAA ? (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> AA
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                                <XCircle className="w-3 h-3" /> Fail
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Sandbox & Multi-Format Exporter */}
        <div className="lg:col-span-6 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          {/* Live Component Preview Sandbox Card */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Live Design System Sandbox</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                {system.identity.archetype.value}
              </span>
            </div>

            {/* Specimen Card */}
            <div
              className="p-4 border transition-all"
              style={{
                borderRadius: system.surfaces.cardRadius.value,
                backgroundColor: system.colors.neutrals.surface.value,
                borderColor: system.colors.neutrals.border.value,
                boxShadow: system.surfaces.shadows.subtle.value,
              }}
            >
              <div className="flex items-center justify-between pb-2">
                <h4
                  className="font-bold text-sm tracking-tight"
                  style={{
                    color: system.colors.neutrals.text.value,
                    fontFamily: system.typography.headingFont.value,
                  }}
                >
                  {system.identity.projectName.value}
                </h4>
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                  style={{
                    backgroundColor: system.colors.primaryLadder.value[100],
                    color: system.colors.primaryLadder.value[700],
                  }}
                >
                  {system.identity.archetype.value}
                </span>
              </div>
              <p
                className="text-xs mb-3 leading-relaxed"
                style={{
                  color: system.colors.neutrals.mutedText.value,
                  fontFamily: system.typography.bodyFont.value,
                }}
              >
                {system.identity.brandTone.value}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  style={{
                    backgroundColor: system.colors.primary.value,
                    color: "#ffffff",
                    borderRadius: system.buttons.primary.value.radius,
                    padding: system.buttons.sizes.value.sm.padding,
                    height: system.buttons.sizes.value.sm.height,
                    fontFamily: system.typography.bodyFont.value,
                  }}
                  className="text-xs font-medium shadow-xs hover:opacity-90 cursor-pointer"
                >
                  Primary Action
                </button>
                <button
                  type="button"
                  style={{
                    backgroundColor: system.buttons.secondary.value.bg,
                    color: system.colors.neutrals.text.value,
                    border: system.buttons.secondary.value.border,
                    borderRadius: system.buttons.primary.value.radius,
                    padding: system.buttons.sizes.value.sm.padding,
                    height: system.buttons.sizes.value.sm.height,
                    fontFamily: system.typography.bodyFont.value,
                  }}
                  className="text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                >
                  Secondary
                </button>
              </div>
            </div>
          </div>

          {/* Export Code Header Tabs */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium">
              {[
                { id: "markdown", label: "DESIGN.md" },
                { id: "tokens", label: "tokens.json" },
                { id: "css", label: "tokens.css" },
                { id: "tailwindV3", label: "Tailwind v3" },
                { id: "tailwindV4", label: "@theme v4" },
                { id: "cheatsheet", label: "Components" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setExportTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    exportTab === tab.id
                      ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <CopyButton
                text={activeOutputText}
                label="Copy"
                size="sm"
                variant="secondary"
                triggerConfetti
              />
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Export Code Content Area */}
          <div className="p-4 flex-1 max-h-[500px] overflow-y-auto bg-zinc-950 text-zinc-100">
            <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap selection:bg-blue-500/30">
              {activeOutputText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
