"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Star,
  ArrowRight,
  Zap,
  ShieldCheck,
  Wrench,
  X,
  QrCode,
  FileCode,
  Sparkles,
  Terminal,
  KeyRound,
  Layers,
} from "lucide-react";
import { registry } from "@/generators/registry";
import { CATEGORIES, ToolCategory } from "@/generators/types";
import { Icon } from "@/components/shared/Icon";
import { usePreferences } from "@/lib/hooks/usePreferences";

const FLAGSHIPS = [
  {
    slug: "qr-code",
    title: "QR Code Studio Pro",
    badge: "Flagship Pro",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    description: "Center brand logos, frame banners, WiFi/WhatsApp payloads, and 2000px Ultra HD export.",
    icon: QrCode,
    accent: "from-emerald-500/10 via-emerald-500/5 to-transparent",
  },
  {
    slug: "design-md",
    title: "Design.md Spec Studio",
    badge: "Live Extractor",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    description: "Live website inspector, 10-step CSS ramp, tokens.json, and Tailwind theme config generator.",
    icon: FileCode,
    accent: "from-blue-500/10 via-blue-500/5 to-transparent",
  },
  {
    slug: "prompt-optimizer",
    title: "Prompt Optimizer Studio",
    badge: "Vibe Coder",
    badgeColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    description: "Architect razor-sharp system prompts with XML guardrails, reasoning chains, and few-shot exemplars.",
    icon: Sparkles,
    accent: "from-violet-500/10 via-violet-500/5 to-transparent",
  },
  {
    slug: "webhook-payload",
    title: "Webhook Simulator",
    badge: "Live Runner",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    description: "Signed Stripe/GitHub payloads with real HTTP POST dispatcher and roundtrip ms latency tracking.",
    icon: Terminal,
    accent: "from-indigo-500/10 via-indigo-500/5 to-transparent",
  },
  {
    slug: "curl-converter",
    title: "cURL to Code Converter",
    badge: "Multi-Lang",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    description: "Convert raw Chrome/Postman cURL commands into native Fetch, Axios, Python Requests, and Go.",
    icon: Layers,
    accent: "from-amber-500/10 via-amber-500/5 to-transparent",
  },
  {
    slug: "jwt-inspector",
    title: "JWT Debugger & Mock Signer",
    badge: "100% Private",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    description: "Client-side token inspection, expiration countdown, and mock JWT generation with custom claims.",
    icon: KeyRound,
    accent: "from-rose-500/10 via-rose-500/5 to-transparent",
  },
];

const PERSONA_TABS = [
  { id: "all", label: "All Generators", key: "1" },
  { id: "vibe-coder", label: "Vibe Coder & AI", key: "2" },
  { id: "developer", label: "Tech & DevOps", key: "3" },
  { id: "design", label: "Design & UI/UX", key: "4" },
  { id: "growth", label: "Marketer & Growth", key: "5" },
  { id: "content", label: "Creative & Story", key: "6" },
  { id: "featured", label: "Featured", key: "7" },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { isFavorite, toggleFavorite, favorites, isLoaded } = usePreferences();

  // Keyboard navigation for categories (1-7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }

      const match = PERSONA_TABS.find((t) => t.key === e.key);
      if (match) {
        e.preventDefault();
        setSelectedCategory(match.id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered tools
  const filteredTools = useMemo(() => {
    return registry.filter((tool) => {
      const matchCat =
        selectedCategory === "all" ||
        (selectedCategory === "featured" && tool.meta.isPopular) ||
        tool.meta.category === selectedCategory;

      if (!searchQuery.trim()) return matchCat;

      const q = searchQuery.toLowerCase();
      const matchTitle = tool.meta.title.toLowerCase().includes(q);
      const matchDesc = tool.meta.description.toLowerCase().includes(q);
      const matchTags = tool.meta.tags.some((tag) => tag.toLowerCase().includes(q));

      return matchCat && (matchTitle || matchDesc || matchTags);
    });
  }, [selectedCategory, searchQuery]);

  // Favorite tools list
  const favoriteTools = useMemo(() => {
    if (!isLoaded || favorites.length === 0) return [];
    return registry.filter((t) => favorites.includes(t.meta.slug));
  }, [favorites, isLoaded]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: registry.length,
      featured: registry.filter((t) => t.meta.isPopular).length,
      "vibe-coder": registry.filter((t) => t.meta.category === "vibe-coder").length,
      developer: registry.filter((t) => t.meta.category === "developer").length,
      design: registry.filter((t) => t.meta.category === "design").length,
      growth: registry.filter((t) => t.meta.category === "growth").length,
      content: registry.filter((t) => t.meta.category === "content").length,
    };
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50/70 dark:bg-zinc-950 flex flex-col transition-colors">
      {/* Precision Workstation Header */}
      <section className="pt-12 pb-10 px-4 sm:px-6 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>forgekit // {registry.length} generators online</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            Precision Generators for Modern Creators.
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            High-craft workstation built for vibe coders, developers, designers, and growth teams. Every tool runs 100% client-side in your browser with zero latency, zero telemetry, and complete data privacy.
          </p>

          {/* Quick Metrics */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <strong className="text-zinc-900 dark:text-zinc-100">{registry.length}</strong> Built-In Generators
            </span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              100% Private Client Execution
            </span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Wrench className="w-3.5 h-3.5 text-blue-500" />
              5 Deep Persona Workflows
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-10">
        {/* Curated Flagship Workstation Dock */}
        {!searchQuery && selectedCategory === "all" && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Featured Workstation Flagships
                </h2>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                Deep production utilities
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {FLAGSHIPS.map((f) => {
                const IconComponent = f.icon;
                return (
                  <Link
                    key={f.slug}
                    href={`/tools/${f.slug}`}
                    className={`group relative p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between overflow-hidden active:scale-[0.98] bg-gradient-to-br ${f.accent}`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center text-zinc-900 dark:text-zinc-100 group-hover:scale-105 transition-transform duration-150 shadow-2xs">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${f.badgeColor}`}>
                          {f.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
                          <span>{f.title}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {f.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-medium text-zinc-400">
                      <span>Instant offline preview</span>
                      <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 group-hover:underline">Launch Tool &rarr;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Filter Controls & Search */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tools by keyword, stack, or persona..."
                className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Total Count */}
            <div className="text-xs text-zinc-500 dark:text-zinc-400 self-center sm:self-auto font-mono">
              Showing <strong className="text-zinc-900 dark:text-zinc-100">{filteredTools.length}</strong> / {registry.length} tools
            </div>
          </div>

          {/* Persona Filter Tabs with Keyboard Shortcuts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PERSONA_TABS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-2xs font-bold"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <span className="w-4 h-4 rounded bg-zinc-200/60 dark:bg-zinc-800 text-[10px] font-mono flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                  {cat.key}
                </span>
                <span>{cat.label}</span>
                <span className="font-mono text-[10px] opacity-60">
                  ({categoryCounts[cat.id] || 0})
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Favorited Tools Section (if any) */}
        {favoriteTools.length > 0 && selectedCategory === "all" && !searchQuery && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Pinned Favorites
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteTools.map((tool) => (
                <ToolCard
                  key={tool.meta.slug}
                  tool={tool}
                  isFav={true}
                  onToggleFav={() => toggleFavorite(tool.meta.slug)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Filtered Tools Grid */}
        <section className="space-y-4">
          {filteredTools.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
              <Wrench className="w-8 h-8 mx-auto text-zinc-400 opacity-40" />
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No generators matched &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-zinc-400">
                Try searching for another keyword or select a different persona category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.meta.slug}
                  tool={tool}
                  isFav={isFavorite(tool.meta.slug)}
                  onToggleFav={() => toggleFavorite(tool.meta.slug)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Category Color Helper for Card Icons
function getCategoryIconStyle(cat: ToolCategory) {
  switch (cat) {
    case "vibe-coder":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
    case "developer":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "design":
      return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
    case "growth":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "content":
    default:
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  }
}

// Tool Card Component
function ToolCard({
  tool,
  isFav,
  onToggleFav,
}: {
  tool: (typeof registry)[0];
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const category = CATEGORIES[tool.meta.category] || CATEGORIES.developer;
  const iconStyle = getCategoryIconStyle(tool.meta.category);

  return (
    <div className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <Link href={`/tools/${tool.meta.slug}`} className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-150 ${iconStyle}`}
            >
              <Icon name={tool.meta.icon} size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {tool.meta.title}
                </h3>
                {tool.meta.version && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {tool.meta.version}
                  </span>
                )}
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${category.badgeColor}`}>
                {category.name}
              </span>
            </div>
          </Link>

          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFav();
            }}
            title={isFav ? "Unpin tool" : "Pin tool"}
            className="p-1 rounded-md text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Star className={`w-3.5 h-3.5 ${isFav ? "fill-amber-400 text-amber-500" : ""}`} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {tool.meta.description}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {tool.meta.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer Action */}
      <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        <Link
          href={`/tools/${tool.meta.slug}`}
          className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform active:scale-[0.98]"
        >
          <span>Open Generator</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
        </Link>
        <span className="text-[10px] font-mono font-normal text-zinc-400">100% Client</span>
      </div>
    </div>
  );
}
