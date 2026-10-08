"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Sparkles, Star, ArrowRight, Zap, ShieldCheck, Wrench } from "lucide-react";
import { registry } from "@/generators/registry";
import { CATEGORIES } from "@/generators/types";
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

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 flex flex-col transition-colors">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
        {/* Subtle ambient light gradient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Extensible Generator Workstation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            One Hub. Every Generator.{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Zero Friction.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            A growing suite of precision generator tools built for developers, designers, writers, and digital teams. Processed 100% locally in your browser for zero latency and complete privacy.
          </p>

          {/* Quick Metrics Pills */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <strong className="text-zinc-800 dark:text-zinc-200">15+</strong> Ready-to-Use Generators
            </span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              100% Private Client-Side
            </span>
            <span className="hidden sm:inline opacity-30">•</span>
            <span className="flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-blue-500" />
              Modular Plugin Architecture
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full flex-1 space-y-10">
        {/* Search & Category Filter Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tools by keyword, tag, or function..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Total Count Badge */}
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Showing <strong className="text-zinc-800 dark:text-zinc-200">{filteredTools.length}</strong> of{" "}
              {registry.length} tools
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: "all", label: "All Generators", count: registry.length },
              { id: "featured", label: "Featured Picks", count: registry.filter((t) => t.meta.isPopular).length },
              { id: "developer", label: "Tech & Dev", count: registry.filter((t) => t.meta.category === "developer").length },
              { id: "design", label: "Design & UI", count: registry.filter((t) => t.meta.category === "design").length },
              { id: "content", label: "Creative & Content", count: registry.filter((t) => t.meta.category === "content").length },
              { id: "productivity", label: "Productivity", count: registry.filter((t) => t.meta.category === "productivity").length },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <span>{cat.label}</span>
                <span className="ml-1.5 text-[10px] opacity-60">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Favorited Tools Section (if any) */}
        {favoriteTools.length > 0 && selectedCategory === "all" && !searchQuery && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
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
            <div className="text-sm font-bold uppercase tracking-wider text-zinc-400 pt-2">
              All Available Generators
            </div>
          )}

          {filteredTools.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-zinc-400 opacity-40" />
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No generators matched &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="text-xs text-zinc-400">
                Try searching for another keyword or select a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
  const category = CATEGORIES[tool.meta.category];

  return (
    <div className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-5 shadow-2xs hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <Link href={`/tools/${tool.meta.slug}`} className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-2xs">
              <Icon name={tool.meta.icon} size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {tool.meta.title}
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${category.badgeColor}`}>
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
            title={isFav ? "Unfavorite" : "Favorite"}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Star className={`w-4 h-4 ${isFav ? "fill-amber-400 text-amber-500" : ""}`} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {tool.meta.description}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
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
      <div className="pt-4 mt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
        <Link
          href={`/tools/${tool.meta.slug}`}
          className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Open Generator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <span className="text-[10px] font-normal text-zinc-400">Client-Side</span>
      </div>
    </div>
  );
}
