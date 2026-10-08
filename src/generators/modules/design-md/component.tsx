"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Download, Eye, Code, Globe, ArrowRight, Loader2, Check, FileJson, Layers, Palette, Sliders } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  if (isNaN(num)) return [94, 106, 210];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function tintColor(hex: string, factor: number): string {
  try {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor);
  } catch {
    return hex;
  }
}

function shadeColor(hex: string, factor: number): string {
  try {
    const [r, g, b] = hexToRgb(hex);
    return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor));
  } catch {
    return hex;
  }
}

export default function DesignMdGenerator() {
  const [urlInput, setUrlInput] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState<string | null>(null);

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

  const handleExtractFromUrl = async (targetUrl?: string) => {
    const raw = targetUrl || urlInput;
    if (!raw.trim()) return;

    setIsExtracting(true);
    setExtractSuccess(null);

    try {
      const res = await fetch("/api/extract-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
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

        setExtractSuccess(`Successfully extracted design specs for ${data.domain}!`);
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      }
    } catch (err) {
      console.error("Extraction error", err);
    } finally {
      setIsExtracting(false);
      setTimeout(() => setExtractSuccess(null), 4000);
    }
  };

  const markdownContent = useMemo(() => {
    return `# DESIGN.md: Design System and UI Specifications

> **Project:** ${projectName}  
> **Target Platform:** ${platform}  
> **Brand Tone & Aesthetic:** ${brandTone}  
> **Last Updated:** ${dateString}

---

## 1. Design Principles & Guidelines
1. **Clarity & Intention**: Every element serves an explicit user purpose with zero visual clutter.
2. **Tactile Feedback**: Subtle hover transitions (150ms-200ms ease-out) and active scale feedback (98%) on interactive surfaces.
3. **Accessibility**: All text color combinations adhere strictly to WCAG AA (minimum 4.5:1 contrast ratio).
4. **Consistency**: Use standardized spacing scales and tokenized semantic colors across every view.

---

## 2. Color Palette & Semantic Tokens

### Brand & Accents
- **Primary Brand**: \`${primaryColor}\` (Buttons, active states, key interactive indicators)
- **Accent Highlight**: \`${accentColor}\` (Badges, special highlights, gradient pairings)
- **Neutral Scale**: ${neutralType} (Borders, card surfaces, secondary text)

### Functional & Semantic Colors
- **Success**: \`#10b981\` (Green 500)
- **Warning**: \`#f59e0b\` (Amber 500)
- **Destructive / Error**: \`#ef4444\` (Red 500)
- **Info**: \`#3b82f6\` (Blue 500)

### Surface & Elevation Tokens
| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| \`bg-background\` | \`#ffffff\` | \`#09090b\` | Root app canvas |
| \`bg-card\` | \`#f8fafc\` | \`#18181b\` | Card & panel backgrounds |
| \`border-border\` | \`#e2e8f0\` | \`#27272a\` | Subtle structural borders |
| \`text-foreground\` | \`#0f172a\` | \`#f8fafc\` | Primary high-contrast text |
| \`text-muted\` | \`#64748b\` | \`#a1a1aa\` | Secondary descriptions & captions |

---

## 3. Typography Scale & Fonts

- **Heading Font**: \`${headingFont}\` (Weights: 600 SemiBold, 700 Bold)
- **Body Font**: \`${bodyFont}\` (Weights: 400 Regular, 500 Medium)
- **Monospace Font**: \`${monoFont}\` (Code snippets, counters, hashes)

### Type Hierarchy
| Level | Font Size | Line Height | Tracking | Weight |
| :--- | :--- | :--- | :--- | :--- |
| **Display 1** | \`36px (2.25rem)\` | \`1.2\` | \`-0.025em\` | Bold (700) |
| **Heading 1** | \`28px (1.75rem)\` | \`1.25\` | \`-0.02em\` | SemiBold (600) |
| **Heading 2** | \`22px (1.375rem)\` | \`1.3\` | \`-0.015em\` | SemiBold (600) |
| **Subheading**| \`18px (1.125rem)\` | \`1.4\` | \`-0.01em\` | Medium (500) |
| **Body (Base)**| \`14px / 16px\` | \`1.5\` | \`normal\` | Regular (400) |
| **Small / Caption**| \`12px (0.75rem)\` | \`1.4\` | \`+0.01em\` | Regular / Medium |

---

## 4. Spacing, Geometry & Shadows

### Spacing Scale (4px Base Grid)
\`4px (xs)\`, \`8px (sm)\`, \`12px (md)\`, \`16px (base)\`, \`24px (lg)\`, \`32px (xl)\`, \`48px (2xl)\`

### Border Radii
- **Default Base Radius**: \`${baseRadius}\`
- Buttons & Badges: \`8px\` - \`12px\`
- Cards & Modals: \`16px\` - \`20px\`
- Pills / Avatars: \`9999px (full)\`

### Shadows & Elevation
- **Elevation Style**: ${elevationStyle}
- **Card Shadow**: \`0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)\`
- **Dropdown / Dialog**: \`0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)\`

---

## 5. Component Patterns & Rules

### Interactive Buttons
- Standard Height: \`36px\` (compact) / \`42px\` (default)
- Active State: \`transform: scale(0.98)\` with \`transition: all 150ms ease\`
- Focus Visible: \`outline: 2px solid ${primaryColor}\` with \`2px offset\`

### Forms & Inputs
- Border: 1px solid \`border-border\`, transitions to 2px focus ring in \`${primaryColor}\`
- Padding: \`8px 12px\` for clean breathing room

---
*Generated with ForgeKit Design.md Spec Studio*
`;
  }, [projectName, platform, brandTone, primaryColor, accentColor, neutralType, headingFont, bodyFont, monoFont, baseRadius, elevationStyle, dateString]);

  const tailwindCode = useMemo(() => {
    const rawRad = baseRadius.split(" ")[0] || "8px";
    return `// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "${tintColor(primaryColor, 0.92)}",
          100: "${tintColor(primaryColor, 0.8)}",
          200: "${tintColor(primaryColor, 0.6)}",
          300: "${tintColor(primaryColor, 0.4)}",
          400: "${tintColor(primaryColor, 0.2)}",
          500: "${primaryColor}",
          600: "${shadeColor(primaryColor, 0.15)}",
          700: "${shadeColor(primaryColor, 0.3)}",
          800: "${shadeColor(primaryColor, 0.5)}",
          900: "${shadeColor(primaryColor, 0.7)}",
          950: "${shadeColor(primaryColor, 0.85)}",
        },
        accent: {
          500: "${accentColor}",
          hover: "${shadeColor(accentColor, 0.15)}",
        },
      },
      borderRadius: {
        brand: "${rawRad}",
      },
      fontFamily: {
        heading: ["'${headingFont}'", "system-ui", "sans-serif"],
        sans: ["'${bodyFont}'", "system-ui", "sans-serif"],
        mono: ["'${monoFont}'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
`;
  }, [primaryColor, accentColor, baseRadius, headingFont, bodyFont, monoFont]);

  const cssCode = useMemo(() => {
    const rawRad = baseRadius.split(" ")[0] || "8px";
    return `/* Design Tokens & CSS Variables */
:root {
  /* Typography */
  --font-heading: '${headingFont}', system-ui, -apple-system, sans-serif;
  --font-body: '${bodyFont}', system-ui, -apple-system, sans-serif;
  --font-mono: '${monoFont}', monospace;

  /* Brand Palette (10-step ramp) */
  --color-brand-50: ${tintColor(primaryColor, 0.92)};
  --color-brand-100: ${tintColor(primaryColor, 0.8)};
  --color-brand-200: ${tintColor(primaryColor, 0.6)};
  --color-brand-300: ${tintColor(primaryColor, 0.4)};
  --color-brand-400: ${tintColor(primaryColor, 0.2)};
  --color-brand-500: ${primaryColor};
  --color-brand-600: ${shadeColor(primaryColor, 0.15)};
  --color-brand-700: ${shadeColor(primaryColor, 0.3)};
  --color-brand-800: ${shadeColor(primaryColor, 0.5)};
  --color-brand-900: ${shadeColor(primaryColor, 0.7)};
  --color-brand-950: ${shadeColor(primaryColor, 0.85)};

  /* Accent Highlight */
  --color-accent: ${accentColor};

  /* Radii & Elevation */
  --radius-brand: ${rawRad};
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-overlay: 0 12px 30px -10px rgba(0, 0, 0, 0.15);

  /* Transitions */
  --ease-spring: cubic-bezier(0.23, 1, 0.32, 1);
  --duration-interactive: 150ms;
}
`;
  }, [primaryColor, accentColor, baseRadius, headingFont, bodyFont, monoFont]);

  const tokensJson = useMemo(() => {
    const rawRad = baseRadius.split(" ")[0] || "8px";
    const data = {
      $schema: "https://tokens.studio/schema.json",
      name: projectName,
      color: {
        brand: {
          50: { value: tintColor(primaryColor, 0.92), type: "color" },
          100: { value: tintColor(primaryColor, 0.8), type: "color" },
          500: { value: primaryColor, type: "color" },
          900: { value: shadeColor(primaryColor, 0.7), type: "color" },
        },
        accent: {
          500: { value: accentColor, type: "color" },
        },
      },
      font: {
        heading: { value: headingFont, type: "fontFamilies" },
        body: { value: bodyFont, type: "fontFamilies" },
        mono: { value: monoFont, type: "fontFamilies" },
      },
      radius: {
        base: { value: rawRad, type: "borderRadius" },
      },
    };
    return JSON.stringify(data, null, 2);
  }, [projectName, primaryColor, accentColor, baseRadius, headingFont, bodyFont, monoFont]);

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
