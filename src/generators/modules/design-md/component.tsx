"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Download,
  Eye,
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
  Maximize2,
  ExternalLink,
  Code,
  Settings,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

import {
  ARCHETYPES,
  DesignArchetype,
  DesignMode,
  FullDesignSystem,
  createArchetypeDesignSystem,
  generateDesignMdDocument,
  generateTokensJson,
  generateTokensCss,
  generateTailwindV3Config,
  generateTailwindV4Theme,
  generateComponentsCheatsheet,
  generateComponentsCheatsheetHtml,
  parseCssTokens,
  parseTokensJson,
  parseDtcgTokens,
  attr,
  auditContrastPairs,
  DesignObservation,
  REFERENCE_SITES,
  createReferenceSiteDesignSystem,
  generateColorLadder,
  preserveUserOverrides,
} from "./engine";

export default function DesignMdGenerator() {
  // Mode Selection: 3 Distinct Top-Level Modes
  const [currentMode, setCurrentMode] = useState<DesignMode>("analyze");

  // Mode 1: Analyze Reference State
  const [urlInput, setUrlInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [screenshotStatus, setScreenshotStatus] = useState<string | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);
  const [observation, setObservation] = useState<DesignObservation | undefined>();

  // Mode 3: Quick Archetype State
  const [selectedArchetype, setSelectedArchetype] = useState<DesignArchetype>("modern-saas");

  // Mode 2: Manual Design System State
  const [system, setSystem] = useState<FullDesignSystem>(() =>
    createArchetypeDesignSystem("modern-saas", { projectName: "My Product Studio" })
  );

  // Progressive Disclosure Section Accordion State
  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  // Import State
  const [importSnippet, setImportSnippet] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Export State
  const [exportTab, setExportTab] = useState<
    "markdown" | "tokens" | "css" | "tailwindV3" | "tailwindV4" | "cheatsheetHtml"
  >("markdown");

  // Live Sandbox Viewport State
  const [sandboxViewport, setSandboxViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [lastEvidence, setLastEvidence] = useState<any>(null);

  // Load draft & evidence from localStorage on initial client mount
  useEffect(() => {
    try {
      const savedSystem = localStorage.getItem("forgekit_design_md_draft_system");
      if (savedSystem) {
        const parsed = JSON.parse(savedSystem);
        if (parsed?.identity && parsed?.colors) {
          setSystem(parsed);
        }
      }
      const savedEvidence = localStorage.getItem("forgekit_design_md_last_evidence");
      if (savedEvidence) {
        const parsedEvidence = JSON.parse(savedEvidence);
        if (parsedEvidence?.url) {
          setLastEvidence(parsedEvidence);
          if (parsedEvidence.screenshots?.desktopDataUri) {
            setScreenshotPreviewUrl(parsedEvidence.screenshots.desktopDataUri);
          }
        }
      }
    } catch (e) {
      console.warn("Could not load design-md draft from localStorage", e);
    }
  }, []);

  // Persist draft to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem("forgekit_design_md_draft_system", JSON.stringify(system));
    } catch {
      // quota or private mode fallback
    }
  }, [system]);

  useEffect(() => {
    if (lastEvidence) {
      try {
        localStorage.setItem("forgekit_design_md_last_evidence", JSON.stringify(lastEvidence));
      } catch {
        // quota fallback
      }
    }
  }, [lastEvidence]);

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

  // Update helper that preserves user override status
  const updateSystemProp = <K extends keyof FullDesignSystem>(
    section: K,
    updater: (prevSec: FullDesignSystem[K]) => FullDesignSystem[K]
  ) => {
    setSystem((prev) => {
      const nextSec = updater(prev[section]);
      return {
        ...prev,
        [section]: nextSec,
      };
    });
  };

  // Archetype Switcher (Mode 3: Quick Archetype)
  const handleArchetypeChange = (arch: DesignArchetype) => {
    setSelectedArchetype(arch);
    const newSystem = createArchetypeDesignSystem(arch, {
      projectName: system.identity.projectName.value,
      observation: undefined, // Clear observation in Quick Archetype mode
    });
    setSystem((prev) => preserveUserOverrides(newSystem, prev));
    confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
  };

  // Reference Site Quick Loader (Mode 1: Analyze Reference)
  const handleLoadReferenceSite = (siteKey: string) => {
    const ref = REFERENCE_SITES[siteKey];
    if (!ref) return;

    const newSystem = createReferenceSiteDesignSystem(siteKey);
    setSystem((prev) => preserveUserOverrides(newSystem, prev));
    setUrlInput(ref.url);
    setSelectedArchetype(ref.archetype);

    const newObs: DesignObservation = {
      sourceUrl: ref.url,
      observedTitle: `${ref.name} — ${ref.visualIdentity}`,
      observedThemeColor: ref.observed.themeColor,
      detectedColors: ref.observed.detectedColors,
      detectedFonts: ref.observed.detectedFonts,
      notes: [ref.fidelityReport],
    };
    setObservation(newObs);
    setLastEvidence({
      siteKey,
      url: ref.url,
      name: ref.name,
      archetype: ref.archetype,
      timestamp: new Date().toISOString(),
      inspectionMethod: "manual-fallback",
      viewports: { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } },
      meta: { title: `${ref.name} — ${ref.visualIdentity}` },
      metrics: {
        containerMaxWidth: "1280px",
        isDark: ref.archetype === "modern-saas" || ref.archetype === "minimal-landing",
      },
      extractedPalette: ref.observed.detectedColors,
      extractedFonts: ref.observed.detectedFonts,
      fidelityReport: ref.fidelityReport,
    });
    setExtractSuccess(`Loaded empirical inspection baseline for ${ref.name}!`);
    confetti({ particleCount: 25, spread: 60, origin: { y: 0.8 } });
  };

  // SSRF-Protected Live URL Extraction
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
        if (data.evidence) {
          setLastEvidence(data.evidence);
        }
        if (data.evidence?.screenshots?.desktopDataUri) {
          setScreenshotPreviewUrl(data.evidence.screenshots.desktopDataUri);
        } else if (data.evidence?.screenshots?.desktopUrl) {
          setScreenshotPreviewUrl(data.evidence.screenshots.desktopUrl);
        }

        const newObs: DesignObservation = {
          sourceUrl: data.domain ? `https://${data.domain}` : undefined,
          hasScreenshot: Boolean(data.evidence?.screenshots?.desktopPath || data.evidence?.screenshots?.desktopDataUri || screenshotName),
          screenshotName: data.evidence?.screenshots?.desktopPath || screenshotName || undefined,
          observedTitle: data.evidence?.meta?.title || data.observed?.title,
          observedThemeColor: data.evidence?.meta?.themeColor || data.observed?.themeColor,
          detectedColors: data.evidence?.extractedPalette || data.observed?.detectedColors || [],
          detectedFonts: data.evidence?.extractedFonts || data.observed?.detectedFonts || [],
          notes: data.evidence?.fidelityReport ? [data.evidence.fidelityReport] : data.notes || [],
        };
        setObservation(newObs);

        if (data.system) {
          // Strictly preserve all existing user manual edits
          setSystem((prev) => preserveUserOverrides(data.system, prev));
        } else {
          setSystem((prev) => {
            const updated = { ...prev };
            if (data.projectName && !prev.identity.projectName.userOverridden) {
              updated.identity.projectName = attr(data.projectName, "observed", data.domain);
            }
            if (data.brandTone && !prev.identity.brandTone.userOverridden) {
              updated.identity.brandTone = attr(data.brandTone, "inferred", data.domain);
            }
            if (data.primaryColor && !prev.colors.primary.userOverridden) {
              updated.colors.primary = attr(data.primaryColor, "observed", data.domain);
            }
            if (data.accentColor && !prev.colors.accent.userOverridden) {
              updated.colors.accent = attr(data.accentColor, "observed", data.domain);
            }
            if (data.headingFont && !prev.typography.headingFont.userOverridden) {
              updated.typography.headingFont = attr(data.headingFont, "observed", data.domain);
            }
            if (data.bodyFont && !prev.typography.bodyFont.userOverridden) {
              updated.typography.bodyFont = attr(data.bodyFont, "observed", data.domain);
            }
            return updated;
          });
        }

        if (data.inspectionMethod === "headless-chrome") {
          setExtractSuccess(`Inspected ${data.domain} live via headless Chrome (1440x900 & 390x844 viewports)!`);
        } else if (data.partial) {
          setExtractSuccess(`Partial inspection for ${data.domain}: ${data.warning || "Inferred from HTML metadata"}`);
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

  // Canvas Pixel Sampling for Screenshot
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScreenshotName(file.name);
    setScreenshotStatus("Sampling image pixels via HTML5 Canvas...");

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setScreenshotPreviewUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);

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
                primary: attr(sampledPalette[0], "observed", file.name, "Canvas pixel clustering", "desktop", 0.9, true),
                accent: sampledPalette[1]
                  ? attr(sampledPalette[1], "observed", file.name, "Canvas pixel clustering", "desktop", 0.85, true)
                  : prev.colors.accent,
              },
            }));
            setScreenshotStatus(`Canvas extracted palette: ${sampledPalette.join(", ")}`);
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

  // DTCG & CSS Token Importer
  const handleImportTokens = () => {
    if (!importSnippet.trim()) return;
    try {
      if (importSnippet.trim().startsWith("{")) {
        const importResult = parseDtcgTokens(importSnippet);
        setSystem((prev) => {
          const next = { ...prev };
          if (importResult.system.colors?.primary) next.colors.primary = importResult.system.colors.primary;
          if (importResult.system.colors?.accent) next.colors.accent = importResult.system.colors.accent;
          if (importResult.system.typography?.headingFont)
            next.typography.headingFont = importResult.system.typography.headingFont;
          if (importResult.system.typography?.bodyFont)
            next.typography.bodyFont = importResult.system.typography.bodyFont;
          if (importResult.system.surfaces?.baseRadius)
            next.surfaces.baseRadius = importResult.system.surfaces.baseRadius;
          return next;
        });
        const unsupportedMsg = importResult.unsupportedFields.length > 0
          ? ` (${importResult.unsupportedFields.length} unsupported fields ignored)`
          : "";
        setImportStatus(`Imported ${importResult.importedTokens} DTCG tokens!${unsupportedMsg}`);
      } else {
        const imported = parseCssTokens(importSnippet);
        setSystem((prev) => {
          const next = { ...prev };
          if (imported.colors?.primary) next.colors.primary = imported.colors.primary;
          if (imported.colors?.accent) next.colors.accent = imported.colors.accent;
          if (imported.typography?.headingFont) next.typography.headingFont = imported.typography.headingFont;
          if (imported.typography?.bodyFont) next.typography.bodyFont = imported.typography.bodyFont;
          if (imported.surfaces?.baseRadius) next.surfaces.baseRadius = imported.surfaces.baseRadius;
          return next;
        });
        setImportStatus("Imported CSS tokens successfully!");
      }
      confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus("Import failed: " + (err?.message || "Invalid token format"));
    }
  };

  // Generated Artifacts
  const markdownDoc = useMemo(() => generateDesignMdDocument(system, observation), [system, observation]);
  const tokensJson = useMemo(() => generateTokensJson(system), [system]);
  const tokensCss = useMemo(() => generateTokensCss(system), [system]);
  const tailwindV3 = useMemo(() => generateTailwindV3Config(system), [system]);
  const tailwindV4 = useMemo(() => generateTailwindV4Theme(system), [system]);
  const cheatsheetHtml = useMemo(() => generateComponentsCheatsheetHtml(system), [system]);

  const handleExportEvidenceBundle = () => {
    const bundle = {
      name: system.identity.projectName.value,
      url: lastEvidence?.url || urlInput || system.identity.projectName.sourceRef,
      timestamp: lastEvidence?.timestamp || new Date().toISOString(),
      inspectionMethod: lastEvidence?.inspectionMethod || "user-draft",
      archetype: system.identity.archetype.value,
      evidence: lastEvidence || {
        palette: observation?.detectedColors || [],
        fonts: observation?.detectedFonts || [],
      },
      system,
      generated: {
        markdown: markdownDoc,
        tokensJson,
      },
    };
    const slug = system.identity.projectName.value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    downloadFile(
      JSON.stringify(bundle, null, 2),
      `${slug}-evidence-bundle.json`,
      "application/json"
    );
  };

  return (
    <div className="space-y-6">
      {/* 3-Mode Primary Header Selector */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-500" />
              <span>Design.md Strategic Studio</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Choose your operating mode: empirical inspection, full manual system authoring, or instant archetype synthesis.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 self-start sm:self-auto">
            DTCG 2025.10 Spec
          </span>
        </div>

        {/* 3 Distinct Mode Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setCurrentMode("analyze")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentMode === "analyze"
                ? "border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold">1. Analyze Reference</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
              Evidence-based analysis from live URLs & screenshots with strict observed attribution.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentMode("manual")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentMode === "manual"
                ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold">2. Manual Design System</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
              Comprehensive 14-section editor with full progressive disclosure and token customization.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentMode("archetype")}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentMode === "archetype"
                ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30"
                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold">3. Quick Archetype</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
              Synthesize production-grade design systems from scratch using 6 verified aesthetic archetypes.
            </p>
          </button>
        </div>
      </div>

      {/* Mode-Specific Header Panels */}
      {currentMode === "analyze" && (
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Analyze Reference Website (SSRF-Guarded Live Inspection)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
              Zero Synthetic Claims
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExtractFromUrl()}
              placeholder="e.g. linear.app, theatlantic.com, shopify.com, vercel.com"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => handleExtractFromUrl()}
              disabled={isExtracting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
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

          {/* 6 Real Reference Website Baselines */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
              6 Verified Reference Website Baselines:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {Object.keys(REFERENCE_SITES).map((key) => {
                const site = REFERENCE_SITES[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleLoadReferenceSite(key)}
                    className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 text-left transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                      {site.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {site.archetype}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Screenshot Upload with Canvas Sampling */}
          <div className="pt-2 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-500" />
              <span>Reference Mockup Sampling:</span>
            </div>
            <label className="px-3 py-1.5 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 cursor-pointer text-xs font-medium text-zinc-600 dark:text-zinc-300 transition-colors">
              <input type="file" accept="image/*" onChange={handleScreenshotUpload} className="hidden" />
              {screenshotName ? `📎 ${screenshotName} (Canvas sampled)` : "Upload Screenshot (HTML5 Canvas Pixel Clustering)"}
            </label>
          </div>
          {screenshotStatus && (
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
              {screenshotStatus}
            </div>
          )}
          {screenshotPreviewUrl && (
            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-20 h-14 rounded overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshotPreviewUrl}
                    alt="Visual inspection preview"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>Visual Evidence Attached</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">
                      {lastEvidence?.inspectionMethod || "Captured"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {lastEvidence?.url || "Rendered page evidence preserved in local memory"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportEvidenceBundle}
                className="px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                title="Download complete evidence bundle (JSON, screenshots & tokens)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Evidence Bundle</span>
              </button>
            </div>
          )}
        </div>
      )}

      {currentMode === "archetype" && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Archetype Preset (Synthesized from Scratch)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              Synthetic Baseline
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
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
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span className="text-xs truncate">{arch.name.split("/")[0]}</span>
                  <span className="text-[10px] text-zinc-400 truncate mt-0.5">{arch.tagline.split(",")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: 14-Section Comprehensive Progressive Disclosure Studio */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              <span>Full 14-Section Design System Editor</span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              14/14 Configurable
            </span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {/* Section 1: Identity & Archetype */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 1 ? null : 1)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">1</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">1. Identity & Brand Foundations</span>
                </div>
                {expandedSection === 1 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 1 && (
                <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Project Name</label>
                      <input
                        type="text"
                        value={system.identity.projectName.value}
                        onChange={(e) => updateSystemProp("identity", (sec) => ({ ...sec, projectName: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Platform</label>
                      <input
                        type="text"
                        value={system.identity.platform.value}
                        onChange={(e) => updateSystemProp("identity", (sec) => ({ ...sec, platform: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Archetype</label>
                      <select
                        value={system.identity.archetype.value}
                        onChange={(e) => updateSystemProp("identity", (sec) => ({ ...sec, archetype: attr(e.target.value as DesignArchetype, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      >
                        {Object.entries(ARCHETYPES).map(([k, meta]) => (
                          <option key={k} value={k}>{meta.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Version</label>
                      <input
                        type="text"
                        value={system.identity.version.value}
                        onChange={(e) => updateSystemProp("identity", (sec) => ({ ...sec, version: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Brand Tone & Philosophy</label>
                    <input
                      type="text"
                      value={system.identity.brandTone.value}
                      onChange={(e) => updateSystemProp("identity", (sec) => ({ ...sec, brandTone: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Colors & Semantic Palette */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 2 ? null : 2)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">2</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">2. Color System & Semantic Palette</span>
                </div>
                {expandedSection === 2 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 2 && (
                <div className="p-4 space-y-3.5 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Primary Color</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={system.colors.primary.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSystemProp("colors", (sec) => ({
                              ...sec,
                              primary: attr(val, "user-provided", undefined, undefined, undefined, 1, true),
                              primaryLadder: attr(generateColorLadder(val), "inferred"),
                            }));
                          }}
                          className="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={system.colors.primary.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSystemProp("colors", (sec) => ({
                              ...sec,
                              primary: attr(val, "user-provided", undefined, undefined, undefined, 1, true),
                              primaryLadder: attr(generateColorLadder(val), "inferred"),
                            }));
                          }}
                          className="flex-1 px-2 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Secondary</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={system.colors.secondary.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, secondary: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                          className="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={system.colors.secondary.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, secondary: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                          className="flex-1 px-2 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Accent</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={system.colors.accent.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, accent: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                          className="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={system.colors.accent.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, accent: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                          className="flex-1 px-2 py-1 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Neutrals (5 keys) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400">Neutrals & Surfaces</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Background</label>
                        <input
                          type="text"
                          value={system.colors.neutrals.background.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, neutrals: { ...sec.neutrals, background: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Surface</label>
                        <input
                          type="text"
                          value={system.colors.neutrals.surface.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, neutrals: { ...sec.neutrals, surface: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Border</label>
                        <input
                          type="text"
                          value={system.colors.neutrals.border.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, neutrals: { ...sec.neutrals, border: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Text Body</label>
                        <input
                          type="text"
                          value={system.colors.neutrals.text.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, neutrals: { ...sec.neutrals, text: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Muted Text</label>
                        <input
                          type="text"
                          value={system.colors.neutrals.mutedText.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, neutrals: { ...sec.neutrals, mutedText: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Semantic States (4 keys) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400">Semantic States</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Success</label>
                        <input
                          type="text"
                          value={system.colors.semantic.success.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, semantic: { ...sec.semantic, success: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Warning</label>
                        <input
                          type="text"
                          value={system.colors.semantic.warning.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, semantic: { ...sec.semantic, warning: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Error</label>
                        <input
                          type="text"
                          value={system.colors.semantic.error.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, semantic: { ...sec.semantic, error: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Info</label>
                        <input
                          type="text"
                          value={system.colors.semantic.info.value}
                          onChange={(e) => updateSystemProp("colors", (sec) => ({ ...sec, semantic: { ...sec.semantic, info: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 11-step Color Ladder */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400">11-Step Ladder (50 - 950)</span>
                    <div className="flex h-5 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
                      {Object.entries(system.colors.primaryLadder.value).map(([step, hex]) => (
                        <div key={step} title={`${step}: ${hex}`} className="flex-1 h-full" style={{ backgroundColor: hex }} />
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
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">3</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">3. Typography System</span>
                </div>
                {expandedSection === 3 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 3 && (
                <div className="p-4 space-y-3.5 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Heading Font</label>
                      <input
                        type="text"
                        value={system.typography.headingFont.value}
                        onChange={(e) => updateSystemProp("typography", (sec) => ({ ...sec, headingFont: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Body Font</label>
                      <input
                        type="text"
                        value={system.typography.bodyFont.value}
                        onChange={(e) => updateSystemProp("typography", (sec) => ({ ...sec, bodyFont: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Mono Font</label>
                      <input
                        type="text"
                        value={system.typography.monoFont.value}
                        onChange={(e) => updateSystemProp("typography", (sec) => ({ ...sec, monoFont: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Base Font Size (px)</label>
                      <input
                        type="number"
                        value={system.typography.baseFontSize.value}
                        onChange={(e) => updateSystemProp("typography", (sec) => ({ ...sec, baseFontSize: attr(Number(e.target.value), "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Scale Ratio</label>
                      <select
                        value={system.typography.scaleRatio.value}
                        onChange={(e) => updateSystemProp("typography", (sec) => ({ ...sec, scaleRatio: attr(Number(e.target.value), "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      >
                        <option value={1.2}>1.200 (Minor Third)</option>
                        <option value={1.25}>1.250 (Major Third)</option>
                        <option value={1.333}>1.333 (Perfect Fourth)</option>
                        <option value={1.414}>1.414 (Augmented Fourth)</option>
                        <option value={1.5}>1.500 (Perfect Fifth)</option>
                        <option value={1.618}>1.618 (Golden Ratio)</option>
                      </select>
                    </div>
                  </div>

                  {/* Heading hierarchy editors: H1 - H4 */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400">Headings Hierarchy (Size, Weight, Tracking, Line Height)</span>
                    {(["h1", "h2", "h3", "h4"] as const).map((level) => (
                      <div key={level} className="grid grid-cols-4 gap-2 items-center bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-lg text-xs">
                        <span className="font-bold uppercase text-[10px] text-zinc-500">{level}</span>
                        <input
                          type="text"
                          value={system.typography.headings[level].value.size}
                          onChange={(e) => updateSystemProp("typography", (sec) => ({
                            ...sec,
                            headings: { ...sec.headings, [level]: attr({ ...sec.headings[level].value, size: e.target.value }, "user-provided", undefined, undefined, undefined, 1, true) },
                          }))}
                          className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          placeholder="Size"
                        />
                        <input
                          type="text"
                          value={system.typography.headings[level].value.weight}
                          onChange={(e) => updateSystemProp("typography", (sec) => ({
                            ...sec,
                            headings: { ...sec.headings, [level]: attr({ ...sec.headings[level].value, weight: e.target.value }, "user-provided", undefined, undefined, undefined, 1, true) },
                          }))}
                          className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                          placeholder="Weight"
                        />
                        <input
                          type="text"
                          value={system.typography.headings[level].value.tracking}
                          onChange={(e) => updateSystemProp("typography", (sec) => ({
                            ...sec,
                            headings: { ...sec.headings, [level]: attr({ ...sec.headings[level].value, tracking: e.target.value }, "user-provided", undefined, undefined, undefined, 1, true) },
                          }))}
                          className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                          placeholder="Tracking"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Grid, Layout & Containers */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 4 ? null : 4)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">4</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">4. Grid & Container Layout</span>
                </div>
                {expandedSection === 4 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 4 && (
                <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Container Max Width</label>
                      <input
                        type="text"
                        value={system.layout.containerMaxWidth.value}
                        onChange={(e) => updateSystemProp("layout", (sec) => ({ ...sec, containerMaxWidth: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Container Padding</label>
                      <input
                        type="text"
                        value={system.layout.containerPadding.value}
                        onChange={(e) => updateSystemProp("layout", (sec) => ({ ...sec, containerPadding: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Grid Columns</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={system.layout.gridColumns.value}
                        onChange={(e) => updateSystemProp("layout", (sec) => ({ ...sec, gridColumns: attr(Number(e.target.value), "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Gutter Width</label>
                      <input
                        type="text"
                        value={system.layout.gutterWidth.value}
                        onChange={(e) => updateSystemProp("layout", (sec) => ({ ...sec, gutterWidth: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Spacing Scale & Density */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 5 ? null : 5)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">5</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">5. Spacing Scale & Density</span>
                </div>
                {expandedSection === 5 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 5 && (
                <div className="p-4 space-y-3.5 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Base Unit</label>
                      <select
                        value={system.spacing.baseUnit.value}
                        onChange={(e) => updateSystemProp("spacing", (sec) => ({ ...sec, baseUnit: attr(Number(e.target.value), "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      >
                        <option value={4}>4px (Micro-grid)</option>
                        <option value={8}>8px (Standard)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Density Mode</label>
                      <select
                        value={system.spacing.densityMode.value}
                        onChange={(e) => updateSystemProp("spacing", (sec) => ({ ...sec, densityMode: attr(e.target.value as any, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      >
                        <option value="compact">Compact (Dev Tools)</option>
                        <option value="normal">Normal (SaaS / Web)</option>
                        <option value="comfortable">Comfortable (Editorial)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-400">Spacing Step Scale</span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center font-mono text-[11px]">
                      {Object.entries(system.spacing.scale.value).map(([k, val]) => (
                        <div key={k} className="p-1 rounded bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                          <span className="text-[9px] text-zinc-400 block">{k}</span>
                          <span className="font-semibold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 6: Surfaces, Elevation & Borders */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 6 ? null : 6)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">6</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">6. Surfaces, Elevation & Borders</span>
                </div>
                {expandedSection === 6 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 6 && (
                <div className="p-4 space-y-3.5 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Base Radius</label>
                      <input
                        type="text"
                        value={system.surfaces.baseRadius.value}
                        onChange={(e) => updateSystemProp("surfaces", (sec) => ({ ...sec, baseRadius: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Card Radius</label>
                      <input
                        type="text"
                        value={system.surfaces.cardRadius.value}
                        onChange={(e) => updateSystemProp("surfaces", (sec) => ({ ...sec, cardRadius: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Border Width</label>
                      <input
                        type="text"
                        value={system.surfaces.borderWidth.value}
                        onChange={(e) => updateSystemProp("surfaces", (sec) => ({ ...sec, borderWidth: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono text-zinc-400">Box Shadow Elevations</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Subtle</label>
                        <input
                          type="text"
                          value={system.surfaces.shadows.subtle.value}
                          onChange={(e) => updateSystemProp("surfaces", (sec) => ({ ...sec, shadows: { ...sec.shadows, subtle: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Medium</label>
                        <input
                          type="text"
                          value={system.surfaces.shadows.medium.value}
                          onChange={(e) => updateSystemProp("surfaces", (sec) => ({ ...sec, shadows: { ...sec.shadows, medium: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-500 mb-0.5">Elevated</label>
                        <input
                          type="text"
                          value={system.surfaces.shadows.elevated.value}
                          onChange={(e) => updateSystemProp("surfaces", (sec) => ({ ...sec, shadows: { ...sec.shadows, elevated: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) } }))}
                          className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={system.surfaces.glassmorphism.value.enabled}
                        onChange={(e) => updateSystemProp("surfaces", (sec) => ({
                          ...sec,
                          glassmorphism: attr({ ...sec.glassmorphism.value, enabled: e.target.checked }, "user-provided", undefined, undefined, undefined, 1, true),
                        }))}
                        className="rounded text-blue-600 w-4 h-4"
                      />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">Glassmorphism Frosted Glass</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={system.surfaces.glassmorphism.value.blur}
                        onChange={(e) => updateSystemProp("surfaces", (sec) => ({
                          ...sec,
                          glassmorphism: attr({ ...sec.glassmorphism.value, blur: e.target.value }, "user-provided", undefined, undefined, undefined, 1, true),
                        }))}
                        className="w-16 px-1.5 py-0.5 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center"
                        placeholder="Blur"
                      />
                      <input
                        type="text"
                        value={system.surfaces.glassmorphism.value.opacity}
                        onChange={(e) => updateSystemProp("surfaces", (sec) => ({
                          ...sec,
                          glassmorphism: attr({ ...sec.glassmorphism.value, opacity: e.target.value }, "user-provided", undefined, undefined, undefined, 1, true),
                        }))}
                        className="w-16 px-1.5 py-0.5 text-[11px] font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center"
                        placeholder="Opacity"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 7: Buttons & Interactive System */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 7 ? null : 7)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">7</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">7. Button Hierarchy & Variants</span>
                </div>
                {expandedSection === 7 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 7 && (
                <div className="p-4 space-y-3.5 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Primary CTA Background</label>
                      <input
                        type="text"
                        value={system.buttons.primary.value.bg}
                        onChange={(e) => updateSystemProp("buttons", (sec) => ({
                          ...sec,
                          primary: attr({ ...sec.primary.value, bg: e.target.value }, "user-provided", undefined, undefined, undefined, 1, true),
                        }))}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Primary Button Text Color</label>
                      <input
                        type="text"
                        value={system.buttons.primary.value.text}
                        onChange={(e) => updateSystemProp("buttons", (sec) => ({
                          ...sec,
                          primary: attr({ ...sec.primary.value, text: e.target.value }, "user-provided", undefined, undefined, undefined, 1, true),
                        }))}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Primary Radius</label>
                      <input
                        type="text"
                        value={system.buttons.primary.value.radius}
                        onChange={(e) => updateSystemProp("buttons", (sec) => ({
                          ...sec,
                          primary: attr({ ...sec.primary.value, radius: e.target.value }, "user-provided", undefined, undefined, undefined, 1, true),
                        }))}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">MD Height</label>
                      <input
                        type="text"
                        value={system.buttons.sizes.value.md.height}
                        onChange={(e) => updateSystemProp("buttons", (sec) => ({
                          ...sec,
                          sizes: attr({ ...sec.sizes.value, md: { ...sec.sizes.value.md, height: e.target.value } }, "user-provided", undefined, undefined, undefined, 1, true),
                        }))}
                        className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 8: Form Controls & Inputs */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 8 ? null : 8)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">8</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">8. Form Controls & Inputs</span>
                </div>
                {expandedSection === 8 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 8 && (
                <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Input Height</label>
                      <input
                        type="text"
                        value={system.forms.inputHeight.value}
                        onChange={(e) => updateSystemProp("forms", (sec) => ({ ...sec, inputHeight: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Input Radius</label>
                      <input
                        type="text"
                        value={system.forms.inputRadius.value}
                        onChange={(e) => updateSystemProp("forms", (sec) => ({ ...sec, inputRadius: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Focus Ring Style</label>
                    <input
                      type="text"
                      value={system.forms.focusRingStyle.value}
                      onChange={(e) => updateSystemProp("forms", (sec) => ({ ...sec, focusRingStyle: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 9: Navigation & App Shell */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 9 ? null : 9)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">9</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">9. Navigation & App Shell</span>
                </div>
                {expandedSection === 9 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 9 && (
                <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Navbar Height</label>
                      <input
                        type="text"
                        value={system.navigation.navbarHeight.value}
                        onChange={(e) => updateSystemProp("navigation", (sec) => ({ ...sec, navbarHeight: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Sidebar Width</label>
                      <input
                        type="text"
                        value={system.navigation.sidebarWidth.value}
                        onChange={(e) => updateSystemProp("navigation", (sec) => ({ ...sec, sidebarWidth: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Nav Style</label>
                      <select
                        value={system.navigation.navStyle.value}
                        onChange={(e) => updateSystemProp("navigation", (sec) => ({ ...sec, navStyle: attr(e.target.value as any, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      >
                        <option value="sticky">Sticky Topbar</option>
                        <option value="fixed">Fixed Topbar</option>
                        <option value="floating">Floating Island</option>
                        <option value="minimal">Minimal Inline</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 10: Key Component Patterns */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 10 ? null : 10)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">10</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">10. Key Component Patterns</span>
                </div>
                {expandedSection === 10 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 10 && (
                <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Card Style</label>
                      <input
                        type="text"
                        value={system.components.cardStyle.value}
                        onChange={(e) => updateSystemProp("components", (sec) => ({ ...sec, cardStyle: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Badge Style</label>
                      <input
                        type="text"
                        value={system.components.badgeStyle.value}
                        onChange={(e) => updateSystemProp("components", (sec) => ({ ...sec, badgeStyle: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Modal Backdrop</label>
                      <input
                        type="text"
                        value={system.components.modalBackdrop.value}
                        onChange={(e) => updateSystemProp("components", (sec) => ({ ...sec, modalBackdrop: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Tooltip Style</label>
                      <input
                        type="text"
                        value={system.components.tooltipStyle.value}
                        onChange={(e) => updateSystemProp("components", (sec) => ({ ...sec, tooltipStyle: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 11: Imagery & Iconography */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 11 ? null : 11)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">11</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">11. Imagery, Media & Iconography</span>
                </div>
                {expandedSection === 11 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 11 && (
                <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Icon Library</label>
                      <input
                        type="text"
                        value={system.media.iconSet.value}
                        onChange={(e) => updateSystemProp("media", (sec) => ({ ...sec, iconSet: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Avatar Radius</label>
                      <input
                        type="text"
                        value={system.media.avatarRadius.value}
                        onChange={(e) => updateSystemProp("media", (sec) => ({ ...sec, avatarRadius: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Aspect Ratio</label>
                      <input
                        type="text"
                        value={system.media.defaultAspectRatio.value}
                        onChange={(e) => updateSystemProp("media", (sec) => ({ ...sec, defaultAspectRatio: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 12: Motion & Transitions */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 12 ? null : 12)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">12</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">12. Motion & Transitions</span>
                </div>
                {expandedSection === 12 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 12 && (
                <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Fast (150ms)</label>
                      <input
                        type="text"
                        value={system.motion.durationFast.value}
                        onChange={(e) => updateSystemProp("motion", (sec) => ({ ...sec, durationFast: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Normal (250ms)</label>
                      <input
                        type="text"
                        value={system.motion.durationNormal.value}
                        onChange={(e) => updateSystemProp("motion", (sec) => ({ ...sec, durationNormal: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Slow (400ms)</label>
                      <input
                        type="text"
                        value={system.motion.durationSlow.value}
                        onChange={(e) => updateSystemProp("motion", (sec) => ({ ...sec, durationSlow: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Default Easing Curve</label>
                    <input
                      type="text"
                      value={system.motion.easingDefault.value}
                      onChange={(e) => updateSystemProp("motion", (sec) => ({ ...sec, easingDefault: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 13: Responsive Breakpoints */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === 13 ? null : 13)}
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">13</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">13. Responsive Breakpoints</span>
                </div>
                {expandedSection === 13 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 13 && (
                <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">sm</label>
                      <input
                        type="text"
                        value={system.breakpoints.sm.value}
                        onChange={(e) => updateSystemProp("breakpoints", (sec) => ({ ...sec, sm: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">md</label>
                      <input
                        type="text"
                        value={system.breakpoints.md.value}
                        onChange={(e) => updateSystemProp("breakpoints", (sec) => ({ ...sec, md: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">lg</label>
                      <input
                        type="text"
                        value={system.breakpoints.lg.value}
                        onChange={(e) => updateSystemProp("breakpoints", (sec) => ({ ...sec, lg: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">xl</label>
                      <input
                        type="text"
                        value={system.breakpoints.xl.value}
                        onChange={(e) => updateSystemProp("breakpoints", (sec) => ({ ...sec, xl: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">2xl</label>
                      <input
                        type="text"
                        value={system.breakpoints["2xl"].value}
                        onChange={(e) => updateSystemProp("breakpoints", (sec) => ({ ...sec, "2xl": attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
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
                className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-850/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">14</span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>14. Accessibility & Contrast Audit</span>
                  </span>
                </div>
                {expandedSection === 14 ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
              </button>
              {expandedSection === 14 && (
                <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-2 gap-3 pb-1">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Target WCAG Standard</label>
                      <select
                        value={system.accessibility.targetLevel.value}
                        onChange={(e) => updateSystemProp("accessibility", (sec) => ({ ...sec, targetLevel: attr(e.target.value as any, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      >
                        <option value="WCAG_AA">WCAG 2.1 AA (4.5:1 text, 3:1 UI)</option>
                        <option value="WCAG_AAA">WCAG 2.1 AAA (7:1 text, 4.5:1 UI)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Focus Visible Rule</label>
                      <input
                        type="text"
                        value={system.accessibility.focusVisibleRule.value}
                        onChange={(e) => updateSystemProp("accessibility", (sec) => ({ ...sec, focusVisibleRule: attr(e.target.value, "user-provided", undefined, undefined, undefined, 1, true) }))}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {system.accessibility.verifiedContrastPairs.map((pair, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">{pair.pair}</span>
                          <span className="text-[10px] text-zinc-400">{pair.usage}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{pair.ratio}:1</span>
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

          {/* Token Importer Accordion */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                <span>Import Existing CSS or DTCG JSON</span>
              </span>
            </div>
            <textarea
              value={importSnippet}
              onChange={(e) => setImportSnippet(e.target.value)}
              rows={3}
              placeholder="Paste :root CSS variables or DTCG tokens.json..."
              className="w-full p-2 text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 resize-none focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleImportTokens}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
              >
                Import Tokens
              </button>
              {importStatus && <span className="text-xs text-emerald-600 font-medium">{importStatus}</span>}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Sandbox & Multi-Format Exporter */}
        <div className="lg:col-span-6 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          {/* Live Component Preview Sandbox Card */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Live Component Preview Sandbox</span>
              </span>
              <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 p-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={() => setSandboxViewport("desktop")}
                  className={`px-2 py-0.5 rounded ${sandboxViewport === "desktop" ? "bg-white dark:bg-zinc-700 font-bold" : "text-zinc-500"}`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setSandboxViewport("tablet")}
                  className={`px-2 py-0.5 rounded ${sandboxViewport === "tablet" ? "bg-white dark:bg-zinc-700 font-bold" : "text-zinc-500"}`}
                >
                  Tablet
                </button>
                <button
                  type="button"
                  onClick={() => setSandboxViewport("mobile")}
                  className={`px-2 py-0.5 rounded ${sandboxViewport === "mobile" ? "bg-white dark:bg-zinc-700 font-bold" : "text-zinc-500"}`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Living Component Specimen Box */}
            <div
              className={`p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all ${
                sandboxViewport === "mobile"
                  ? "max-w-[340px] mx-auto"
                  : sandboxViewport === "tablet"
                  ? "max-w-[520px] mx-auto"
                  : "w-full"
              }`}
              style={{
                backgroundColor: system.colors.neutrals.background.value,
                color: system.colors.neutrals.text.value,
                fontFamily: system.typography.bodyFont.value,
              }}
            >
              {/* Navbar specimen */}
              <div
                className="flex items-center justify-between pb-3 mb-3 border-b"
                style={{ borderColor: system.colors.neutrals.border.value }}
              >
                <span className="font-bold text-xs" style={{ fontFamily: system.typography.headingFont.value }}>
                  {system.identity.projectName.value}
                </span>
                <button
                  type="button"
                  className="px-2.5 py-1 text-[11px] font-semibold text-white"
                  style={{
                    backgroundColor: system.colors.primary.value,
                    borderRadius: system.buttons.primary.value.radius,
                  }}
                >
                  Action
                </button>
              </div>

              {/* Hero specimen */}
              <div className="py-2 space-y-1.5">
                <h3
                  className="font-bold tracking-tight text-sm md:text-base leading-tight"
                  style={{ fontFamily: system.typography.headingFont.value }}
                >
                  Craft Interfaces with Precision
                </h3>
                <p className="text-xs opacity-75" style={{ color: system.colors.neutrals.mutedText.value }}>
                  {system.identity.brandTone.value}
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                    style={{
                      backgroundColor: system.colors.primary.value,
                      borderRadius: system.buttons.primary.value.radius,
                      boxShadow: system.surfaces.shadows.subtle.value,
                    }}
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-semibold cursor-pointer border"
                    style={{
                      backgroundColor: system.colors.neutrals.surface.value,
                      color: system.colors.neutrals.text.value,
                      borderColor: system.colors.neutrals.border.value,
                      borderRadius: system.surfaces.baseRadius.value,
                    }}
                  >
                    Secondary
                  </button>
                </div>
              </div>

              {/* Surface card specimen */}
              <div
                className="mt-3 p-3 border space-y-1.5"
                style={{
                  backgroundColor: system.colors.neutrals.surface.value,
                  borderColor: system.colors.neutrals.border.value,
                  borderRadius: system.surfaces.cardRadius.value,
                  boxShadow: system.surfaces.shadows.medium.value,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Interactive Card</span>
                  <span
                    className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold"
                    style={{
                      backgroundColor: system.colors.primaryLadder.value[50],
                      color: system.colors.primary.value,
                      border: `1px solid ${system.colors.primaryLadder.value[200]}`,
                    }}
                  >
                    Badge
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Form input focus state..."
                  className="w-full px-2.5 text-xs border outline-none mt-1"
                  style={{
                    height: system.forms.inputHeight.value,
                    borderRadius: system.forms.inputRadius.value,
                    borderColor: system.colors.neutrals.border.value,
                    backgroundColor: system.colors.neutrals.background.value,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Multi-Format Export Studio */}
          <div className="flex-1 flex flex-col p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                <span>Multi-Format Token Exports</span>
              </span>
              <div className="flex items-center gap-2">
                <CopyButton
                  text={
                    exportTab === "markdown"
                      ? markdownDoc
                      : exportTab === "tokens"
                      ? tokensJson
                      : exportTab === "css"
                      ? tokensCss
                      : exportTab === "tailwindV3"
                      ? tailwindV3
                      : exportTab === "tailwindV4"
                      ? tailwindV4
                      : cheatsheetHtml
                  }
                  label="Copy"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (exportTab === "markdown") downloadFile(markdownDoc, "DESIGN.md", "text/markdown");
                    else if (exportTab === "tokens") downloadFile(tokensJson, "tokens.json", "application/json");
                    else if (exportTab === "css") downloadFile(tokensCss, "tokens.css", "text/css");
                    else if (exportTab === "tailwindV3") downloadFile(tailwindV3, "tailwind.config.ts", "text/typescript");
                    else if (exportTab === "tailwindV4") downloadFile(tailwindV4, "theme.css", "text/css");
                    else downloadFile(cheatsheetHtml, "components.html", "text/html");
                  }}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleExportEvidenceBundle}
                  className="px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                  title="Download Evidence Bundle (Tokens, Evidence & Screenshots)"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Evidence Bundle</span>
                </button>
              </div>
            </div>

            {/* Sub-Tabs for Exports */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: "markdown", label: "DESIGN.md" },
                { id: "tokens", label: "DTCG JSON" },
                { id: "css", label: "CSS :root" },
                { id: "tailwindV3", label: "Tailwind v3" },
                { id: "tailwindV4", label: "Tailwind v4" },
                { id: "cheatsheetHtml", label: "HTML Cheatsheet" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setExportTab(tab.id as any)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                    exportTab === tab.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Export Code Viewer */}
            <div className="flex-1 min-h-[300px] max-h-[360px] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 p-3 text-zinc-100 font-mono text-xs">
              <pre className="whitespace-pre-wrap">
                {exportTab === "markdown"
                  ? markdownDoc
                  : exportTab === "tokens"
                  ? tokensJson
                  : exportTab === "css"
                  ? tokensCss
                  : exportTab === "tailwindV3"
                  ? tailwindV3
                  : exportTab === "tailwindV4"
                  ? tailwindV4
                  : cheatsheetHtml}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
