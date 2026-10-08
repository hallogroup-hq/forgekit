"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type BadgeStyle = "flat" | "flat-square" | "for-the-badge" | "plastic";

interface BadgeItem {
  id: string;
  label: string;
  message: string;
  color: string;
  logo?: string;
  link?: string;
  enabled: boolean;
}

const DEFAULT_BADGES: BadgeItem[] = [
  { id: "1", label: "license", message: "MIT", color: "blue", logo: "", enabled: true },
  { id: "2", label: "version", message: "1.0.0", color: "green", logo: "npm", enabled: true },
  { id: "3", label: "build", message: "passing", color: "brightgreen", logo: "githubactions", enabled: true },
  { id: "4", label: "typescript", message: "v5.5", color: "3178C6", logo: "typescript", enabled: true },
  { id: "5", label: "next.js", message: "v15", color: "000000", logo: "nextdotjs", enabled: true },
  { id: "6", label: "tailwind", message: "v4", color: "38B2AC", logo: "tailwindcss", enabled: true },
  { id: "7", label: "PRs", message: "welcome", color: "orange", enabled: true },
];

export default function ReadmeBadgeGenerator() {
  const [repoName, setRepoName] = useState("forgekit");
  const [repoTagline, setRepoTagline] = useState("The extensible all-in-one generator workstation for developers and creators.");
  const [badgeStyle, setBadgeStyle] = useState<BadgeStyle>("flat-square");
  const [badges, setBadges] = useState<BadgeItem[]>(DEFAULT_BADGES);

  // Custom badge inputs
  const [newLabel, setNewLabel] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [newLogo, setNewLogo] = useState("");

  const toggleBadge = (id: string) => {
    setBadges((prev) => prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  };

  const removeBadge = (id: string) => {
    setBadges((prev) => prev.filter((b) => b.id !== id));
  };

  const addCustomBadge = () => {
    if (!newLabel.trim() || !newMessage.trim()) return;
    const newBadge: BadgeItem = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      message: newMessage.trim(),
      color: newColor.trim() || "blue",
      logo: newLogo.trim() || undefined,
      enabled: true,
    };
    setBadges((prev) => [...prev, newBadge]);
    setNewLabel("");
    setNewMessage("");
    setNewLogo("");
  };

  // Build Shields.io URL for a badge
  const getBadgeUrl = useCallback(
    (b: BadgeItem): string => {
      const encodedLabel = encodeURIComponent(b.label.replace(/-/g, "--"));
      const encodedMsg = encodeURIComponent(b.message.replace(/-/g, "--"));
      let url = `https://img.shields.io/badge/${encodedLabel}-${encodedMsg}-${b.color}?style=${badgeStyle}`;
      if (b.logo) {
        url += `&logo=${encodeURIComponent(b.logo)}&logoColor=white`;
      }
      return url;
    },
    [badgeStyle]
  );

  // Generate README Hero Markdown
  const readmeMarkdown = useMemo(() => {
    const enabledBadges = badges.filter((b) => b.enabled);
    const badgeMarkdownLines = enabledBadges.map((b) => {
      const imgUrl = getBadgeUrl(b);
      return `![${b.label}: ${b.message}](${imgUrl})`;
    });

    return `# ${repoName}

> ${repoTagline}

<p align="left">
  ${badgeMarkdownLines.join("\n  ")}
</p>

---

## Features
- Client-side execution with zero latency
- No telemetry or external server tracking
- Responsive across mobile and desktop
- Modular plugin architecture

## Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/your-username/${repoName}.git

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`
`;
  }, [repoName, repoTagline, badges, getBadgeUrl]);

  const handleDownload = () => {
    downloadFile(readmeMarkdown, "README.md", "text/markdown");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Repo Info */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Repository Name
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Project Tagline
            </label>
            <input
              type="text"
              value={repoTagline}
              onChange={(e) => setRepoTagline(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Badge Visual Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(["flat", "flat-square", "for-the-badge", "plastic"] as BadgeStyle[]).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setBadgeStyle(style)}
                  className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-colors capitalize ${
                    badgeStyle === style
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Badge Toggles List */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-3">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
            Active Badges ({badges.filter((b) => b.enabled).length}/{badges.length})
          </label>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-xs"
              >
                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={b.enabled}
                    onChange={() => toggleBadge(b.id)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate">
                    {b.label}: {b.message}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => removeBadge(b.id)}
                  className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Custom Badge */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase">
              Add Custom Badge
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Label (e.g. coverage)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
              <input
                type="text"
                placeholder="Message (e.g. 98%)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Color (e.g. green or 4f46e5)"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
              <input
                type="text"
                placeholder="Logo slug (optional)"
                value={newLogo}
                onChange={(e) => setNewLogo(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <button
              type="button"
              onClick={addCustomBadge}
              className="w-full py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 flex items-center justify-center gap-1 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Badge
            </button>
          </div>
        </div>
      </div>

      {/* Output & Preview Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-5">
        {/* Visual Live Badges Strip */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Live Badge Preview
          </span>
          <div className="flex flex-wrap items-center gap-2 min-h-10 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80">
            {badges
              .filter((b) => b.enabled)
              .map((b) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={b.id}
                  src={getBadgeUrl(b)}
                  alt={`${b.label}: ${b.message}`}
                  className="inline-block"
                />
              ))}
          </div>
        </div>

        {/* Markdown Output */}
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs p-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-mono text-zinc-400">README.md Header</span>
            <div className="flex items-center gap-2">
              <CopyButton text={readmeMarkdown} label="Copy Markdown" />
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                Download README.md
              </button>
            </div>
          </div>

          <pre className="flex-1 font-mono text-xs text-zinc-800 dark:text-zinc-200 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-200/60 dark:border-zinc-800/60 max-h-[450px] overflow-y-auto">
            {readmeMarkdown}
          </pre>
        </div>
      </div>
    </div>
  );
}
