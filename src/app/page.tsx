"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Star, ArrowRight, Zap, ShieldCheck, Wrench, X } from "lucide-react";
import { registry } from "@/generators/registry";
import { CATEGORIES, ToolCategory } from "@/generators/types";
import { Icon } from "@/components/shared/Icon";
import { usePreferences } from "@/lib/hooks/usePreferences";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { isFavorite, toggleFavorite, favorites, isLoaded } = usePreferences();

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
      <section className="pt-14 pb-12 px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono font-medium bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
            <span>forgekit // 24 generators online</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Precision Generators for Modern Workflows.
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            High-craft offline workstation built for vibe coders, developers, designers, and growth teams. Every tool runs 100% client-side in your browser for zero latency and complete data privacy.
          </p>

          {/* Quick Metrics */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 pt-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <strong className="text-zinc-900 dark:text-zinc-100">24</strong> Built-In Generators
            </span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              100% Private Client Execution
            </span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Wrench className="w-3.5 h-3.5 text-blue-500" />
              5 Workflow Personas
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-8">
        {/* Filter Controls & Search */}
        <div className="space-y-4">
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

          {/* Persona Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "All Generators" },
              { id: "featured", label: "Featured" },
              { id: "vibe-coder", label: "Vibe Coder & AI" },
              { id: "developer", label: "Tech & DevOps" },
              { id: "design", label: "Design & UI/UX" },
              { id: "growth", label: "Marketer & Growth" },
              { id: "content", label: "Creative & Story" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-2xs"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <span>{cat.label}</span>
                <span className="ml-1.5 font-mono text-[10px] opacity-60">
                  ({categoryCounts[cat.id] || 0})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Favorited Tools Section (if any) */}
        {favoriteTools.length > 0 && selectedCategory === "all" && !searchQuery && (
          <div className="space-y-3">
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
          </div>
        )}

        {/* All Filtered Tools Grid */}
        <div className="space-y-4">
          {favoriteTools.length > 0 && selectedCategory === "all" && !searchQuery && (
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 pt-2 font-mono">
              All Available Generators
            </div>
          )}

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
        </div>
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
    <div className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <Link href={`/tools/${tool.meta.slug}`} className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-150 ${iconStyle}`}
            >
              <Icon name={tool.meta.icon} size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {tool.meta.title}
              </h3>
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
