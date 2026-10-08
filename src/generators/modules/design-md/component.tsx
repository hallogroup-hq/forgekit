"use client";

import React, { useState, useMemo } from "react";
import { Download, Sliders, Eye, Code } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

export default function DesignMdGenerator() {
  const [projectName, setProjectName] = useState("Acme Studio");
  const [platform, setPlatform] = useState("Web (Responsive)");
  const [brandTone, setBrandTone] = useState("Modern, Clean, Developer-First");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [accentColor, setAccentColor] = useState("#8b5cf6");
  const [neutralType, setNeutralType] = useState("Zinc (Neutral Cool)");
  const [headingFont, setHeadingFont] = useState("Inter");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [monoFont, setMonoFont] = useState("JetBrains Mono");
  const [baseRadius, setBaseRadius] = useState("12px (Soft Modern)");
  const [elevationStyle, setElevationStyle] = useState("Subtle Multi-layer (Linear style)");
  const [previewTab, setPreviewTab] = useState<"code" | "preview">("preview");
  const [dateString, setDateString] = useState("2026-10-08");

  React.useEffect(() => {
    setDateString(new Date().toISOString().split("T")[0]);
  }, []);

  const markdownContent = useMemo(() => {
    return `# DESIGN.md — Design System & UI Specifications

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

  const handleDownload = () => {
    downloadFile(markdownContent, "DESIGN.md", "text/markdown");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Form (Left) */}
      <div className="lg:col-span-5 space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Sliders className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            System Parameters
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Project / Product Name
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
              <select
                value={brandTone}
                onChange={(e) => setBrandTone(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="Modern, Clean, Developer-First">Modern & Developer-First</option>
                <option value="Minimalist & Apple HIG Soft">Apple HIG Soft & Elegant</option>
                <option value="Vibrant & High Energy">Vibrant & High Energy</option>
                <option value="Enterprise & Trustworthy">Enterprise & Trustworthy</option>
              </select>
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
              <select
                value={neutralType}
                onChange={(e) => setNeutralType(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="Zinc (Neutral Cool)">Zinc (Modern Cool Grey)</option>
                <option value="Slate (Deep Blue Grey)">Slate (Blue Tint Grey)</option>
                <option value="Neutral (True Pure Grey)">Neutral (Pure Monochrome)</option>
                <option value="Stone (Warm Earthy Grey)">Stone (Warm Grey)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Primary Font
              </label>
              <select
                value={headingFont}
                onChange={(e) => {
                  setHeadingFont(e.target.value);
                  setBodyFont(e.target.value);
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="Inter">Inter</option>
                <option value="Geist Sans">Geist Sans</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="Roboto">Roboto</option>
                <option value="System UI Native">System UI Native</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Monospace Font
              </label>
              <select
                value={monoFont}
                onChange={(e) => setMonoFont(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="JetBrains Mono">JetBrains Mono</option>
                <option value="Geist Mono">Geist Mono</option>
                <option value="Fira Code">Fira Code</option>
                <option value="SF Mono">SF Mono</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Border Radius
              </label>
              <select
                value={baseRadius}
                onChange={(e) => setBaseRadius(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="8px (Clean & Subtle)">8px (Clean)</option>
                <option value="12px (Soft Modern)">12px (Modern)</option>
                <option value="16px (Apple Rounded)">16px (Apple Soft)</option>
                <option value="4px (Sharp Tech)">4px (Sharp)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Elevation
              </label>
              <select
                value={elevationStyle}
                onChange={(e) => setElevationStyle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value="Subtle Multi-layer (Linear style)">Linear Multi-layer</option>
                <option value="Soft Floating (Apple style)">Apple Soft Floating</option>
                <option value="Flat with Borders (Vercel style)">Vercel Sharp Borders</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Output Panel (Right) */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPreviewTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                previewTab === "preview"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setPreviewTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                previewTab === "code"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw Markdown</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={markdownContent}
              label="Copy Spec"
              size="sm"
              variant="secondary"
              triggerConfetti
            />
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="p-5 flex-1 max-h-[560px] overflow-y-auto">
          {previewTab === "code" ? (
            <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-blue-500/20">
              {markdownContent}
            </pre>
          ) : (
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
                  Color Token Sample
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg shadow-sm border border-black/10"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <div>
                      <div className="font-medium text-[11px]">Primary</div>
                      <div className="font-mono text-[10px] text-zinc-400">{primaryColor}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg shadow-sm border border-black/10"
                      style={{ backgroundColor: accentColor }}
                    />
                    <div>
                      <div className="font-medium text-[11px]">Accent</div>
                      <div className="font-mono text-[10px] text-zinc-400">{accentColor}</div>
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
                  const tokens = &#123; primary: &quot;{primaryColor}&quot; &#125;;
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
