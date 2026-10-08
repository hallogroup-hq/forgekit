"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Volume2,
  VolumeX,
  Grid,
  ChevronLeft,
  ChevronRight,
  Play,
  X,
  Heart,
  ArrowRight,
  Info,
  SlidersHorizontal,
  LayoutGrid,
  Film,
} from "lucide-react";
import { registry } from "@/generators/registry";
import { GeneratorModule } from "@/generators/types";
import { Icon } from "@/components/shared/Icon";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { soundManager } from "@/lib/sound";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { getConsoleAsset } from "@/data/consoleAssets";

const CATEGORY_TABS = [
  { id: "all", label: "All Utilities" },
  { id: "productivity", label: "Productivity" },
  { id: "sales", label: "Business & Sales" },
  { id: "marketing", label: "Marketing & Growth" },
  { id: "creative", label: "Creative & Design" },
  { id: "vibe-coder", label: "Vibe Coder & DevOps" },
  { id: "pinned", label: "Favorites" },
];

function matchesCategory(tool: GeneratorModule, categoryId: string): boolean {
  if (categoryId === "all") return true;
  const slug = tool.meta.slug;
  const cat = tool.meta.category;

  if (categoryId === "productivity") {
    return [
      "csv-cleaner",
      "text-cleaner",
      "bulk-filename-builder",
      "meeting-agenda",
      "markdown-table",
    ].includes(slug);
  }

  if (categoryId === "sales") {
    return [
      "invoice-receipt",
      "quotation-generator",
      "email-signature",
    ].includes(slug);
  }

  if (categoryId === "marketing") {
    return (
      [
        "qr-code",
        "whatsapp-link",
        "utm-builder",
        "campaign-url-qa",
        "opengraph-preview",
        "social-bio",
        "copywriting-framework",
      ].includes(slug) || cat === "growth"
    );
  }

  if (categoryId === "creative") {
    return (
      [
        "batch-image-resizer",
        "image-converter",
        "aspect-ratio",
        "color-contrast",
        "contrast-checker",
        "design-md",
        "mesh-gradient",
        "svg-blob",
        "css-glass-shadow",
      ].includes(slug) || cat === "design"
    );
  }

  if (categoryId === "vibe-coder") {
    return (
      [
        "ai-rules",
        "app-prd",
        "prompt-optimizer",
        "webhook-payload",
        "sql-schema",
        "curl-converter",
        "regex-cheat",
        "jwt-inspector",
        "docker-gitignore",
        "uuid-nanoid",
        "password-passphrase",
        "hash-secret",
        "crontab",
        "mock-data",
        "character",
        "readme-badge",
      ].includes(slug) ||
      cat === "vibe-coder" ||
      cat === "developer"
    );
  }

  return cat === categoryId;
}

export default function PS5InspiredHomePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"shelf" | "grid">("shelf");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isFavorite, toggleFavorite, favorites, isLoaded } = usePreferences();

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter tools based on category, search query, and lifecycle
  const visibleTools = useMemo(() => {
    const publicRegistry = registry.filter(
      (t) => !t.meta.lifecycle || t.meta.lifecycle === "ready" || t.meta.lifecycle === "qa"
    );

    let tools = publicRegistry;

    if (selectedCategory === "pinned") {
      if (!isLoaded || favorites.length === 0) return [];
      tools = tools.filter((t) => favorites.includes(t.meta.slug));
    } else {
      tools = tools.filter((t) => matchesCategory(t, selectedCategory));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      tools = tools.filter((t) => {
        const titleMatch = t.meta.title.toLowerCase().includes(q);
        const descMatch = t.meta.description.toLowerCase().includes(q);
        const tagMatch = t.meta.tags.some((tag) => tag.toLowerCase().includes(q));
        return titleMatch || descMatch || tagMatch;
      });
    }

    return tools;
  }, [selectedCategory, searchQuery, favorites, isLoaded]);

  // Ensure active index is bounded
  useEffect(() => {
    if (activeIndex >= visibleTools.length) {
      setActiveIndex(Math.max(0, visibleTools.length - 1));
    }
  }, [visibleTools.length, activeIndex]);

  const activeTool = visibleTools[activeIndex] || registry[0];
  const activeAsset = activeTool ? getConsoleAsset(activeTool.meta.slug) : getConsoleAsset("qr-code");

  // Auto-scroll active item into view
  useEffect(() => {
    if (carouselRef.current && viewMode === "shelf") {
      const activeEl = carouselRef.current.children[activeIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [activeIndex, viewMode]);

  // Navigate next/prev with audio
  const handleNavigate = useCallback(
    (newIndex: number) => {
      if (newIndex < 0 || newIndex >= visibleTools.length) return;
      setActiveIndex(newIndex);
      soundManager.playNavigate();
    },
    [visibleTools.length]
  );

  // Switch category tabs
  const handleSwitchCategory = useCallback(
    (direction: "left" | "right") => {
      const currentIndex = CATEGORY_TABS.findIndex((c) => c.id === selectedCategory);
      let nextIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0) nextIndex = CATEGORY_TABS.length - 1;
      if (nextIndex >= CATEGORY_TABS.length) nextIndex = 0;
      setSelectedCategory(CATEGORY_TABS[nextIndex].id);
      setActiveIndex(0);
      soundManager.playNavigate();
    },
    [selectedCategory]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        isCommandOpen
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNavigate(activeIndex + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleNavigate(activeIndex - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeTool) {
          soundManager.playConfirm();
          router.push(`/tools/${activeTool.meta.slug}`);
        }
      } else if (e.key.toLowerCase() === "q") {
        e.preventDefault();
        handleSwitchCategory("left");
      } else if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        handleSwitchCategory("right");
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (activeTool) {
          toggleFavorite(activeTool.meta.slug);
          soundManager.playConfirm();
        }
      } else if (e.key === " " || e.key.toLowerCase() === "d") {
        e.preventDefault();
        setShowDetailsModal((prev) => !prev);
      } else if (e.key.toLowerCase() === "v") {
        e.preventDefault();
        setViewMode((prev) => (prev === "shelf" ? "grid" : "shelf"));
        soundManager.playNavigate();
      } else if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, activeTool, isCommandOpen, router, toggleFavorite, handleNavigate, handleSwitchCategory]);

  const isFav = activeTool ? isFavorite(activeTool.meta.slug) : false;

  return (
    <div className="relative min-h-screen w-full bg-[#05070b] text-white flex flex-col justify-between overflow-x-hidden font-sans select-none selection:bg-white/20">
      {/* 1. CINEMATIC FULL-SCREEN KEY ART BACKDROP */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          key={activeAsset.backdropImage}
          src={activeAsset.backdropImage}
          alt={activeAsset.title}
          className="w-full h-full object-cover object-center absolute inset-0 opacity-40 scale-105 transition-all duration-700 ease-out animate-in fade-in"
        />

        {/* Cinematic Vignette Overlays for crisp contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070b] via-[#05070b]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070b]/90 via-[#05070b]/40 to-transparent" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#05070b]/30 to-[#05070b]/80" />
      </div>

      {/* 2. TOP HUD: BRAND & PRIMARY CONTROLS */}
      <header className="relative z-30 pt-6 px-6 sm:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Brand Identity & Instant Search */}
        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white text-black font-black text-sm flex items-center justify-center tracking-tighter shadow-md group-hover:scale-105 transition-transform">
              FK
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider uppercase text-white">
                ForgeKit
              </span>
              <span className="text-[10px] font-mono text-white/40 tracking-wider">
                Generator Suite
              </span>
            </div>
          </Link>

          {/* Instant Search Bar (Always visible for fast discovery) */}
          <div className="relative flex-1 sm:w-72 md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() && viewMode !== "grid") {
                  setViewMode("grid"); // auto-switch to grid on search for fastest discovery
                }
              }}
              placeholder="Quick search 28+ tools (invoice, QR, resize)..."
              className="w-full pl-8 pr-8 py-1.5 rounded-full bg-black/40 hover:bg-black/60 focus:bg-black/80 backdrop-blur-md border border-white/10 focus:border-white/30 text-xs text-white placeholder-white/40 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Center/Right: Category Pills & View Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-1 rounded-full border border-white/10 shadow-inner overflow-x-auto max-w-full">
            {CATEGORY_TABS.map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setActiveIndex(0);
                    soundManager.playNavigate();
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-white text-black shadow-md scale-105"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Shelf vs Grid */}
          <div className="flex items-center bg-black/40 backdrop-blur-md p-0.5 rounded-full border border-white/10">
            <button
              type="button"
              onClick={() => {
                setViewMode("shelf");
                soundManager.playNavigate();
              }}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === "shelf" ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
              title="Console Shelf Mode"
            >
              <Film className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                soundManager.playNavigate();
              }}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
              title="Full Grid Mode"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              const res = soundManager.toggleSound();
              setSoundEnabled(res);
            }}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/40" />}
          </button>
        </div>
      </header>

      {/* 3. MAIN WORKSTATION DISCOVERY VIEW */}
      <main className="relative z-20 flex-1 px-6 sm:px-12 flex flex-col justify-end pb-4 pt-6">
        <div className="space-y-4">
          {/* Active Tool Headline (Clean & High Contrast) */}
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
                {activeAsset.category}
              </span>
              <span className="text-xs font-mono text-white/40">
                Showing {visibleTools.length} {visibleTools.length === 1 ? "tool" : "tools"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg uppercase">
              {activeAsset.title}
            </h1>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed font-normal max-w-2xl">
              {activeAsset.tagline}
            </p>
          </div>

          {/* VIEW MODE 1: CONSOLE SHELF CAROUSEL */}
          {viewMode === "shelf" ? (
            <div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-white/40">
                  Featured Carousel ({activeIndex + 1} of {visibleTools.length})
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate(activeIndex - 1)}
                    disabled={activeIndex <= 0}
                    className="p-1 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white transition-all cursor-pointer"
                    title="Previous"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate(activeIndex + 1)}
                    disabled={activeIndex >= visibleTools.length - 1}
                    className="p-1 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 text-white transition-all cursor-pointer"
                    title="Next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                ref={carouselRef}
                className="flex items-center gap-5 overflow-x-auto pt-8 pb-6 scrollbar-none scroll-smooth"
              >
                {visibleTools.map((tool, idx) => {
                  const isSelected = idx === activeIndex;
                  const asset = getConsoleAsset(tool.meta.slug);

                  return (
                    <button
                      key={tool.meta.slug}
                      type="button"
                      onClick={() => {
                        setActiveIndex(idx);
                        soundManager.playNavigate();
                      }}
                      onDoubleClick={() => {
                        soundManager.playConfirm();
                        router.push(`/tools/${tool.meta.slug}`);
                      }}
                      className={`group relative shrink-0 flex flex-col items-center transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? "-translate-y-2 scale-105 z-20"
                          : "hover:-translate-y-1 opacity-75 hover:opacity-100"
                      }`}
                    >
                      {/* Box Tile */}
                      <div
                        className={`w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl relative overflow-hidden transition-all duration-300 ${
                          isSelected
                            ? "ring-2 ring-white shadow-[0_0_25px_rgba(255,255,255,0.4)]"
                            : "border border-white/10 hover:border-white/30"
                        }`}
                      >
                        <img
                          src={asset.coverImage}
                          alt={asset.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
                        <div className="absolute top-2.5 left-2.5 p-1 rounded-md bg-black/50 backdrop-blur-md text-white/90">
                          <Icon name={tool.meta.icon} size={14} />
                        </div>
                        <span className="absolute bottom-2 left-2 right-2 text-[10px] font-bold tracking-wide uppercase text-white/95 truncate drop-shadow">
                          {asset.title}
                        </span>
                      </div>

                      <div
                        className={`mt-2 flex items-center gap-1.5 transition-all ${
                          isSelected ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                        <span className="text-[11px] font-semibold text-white/90 tracking-wide truncate max-w-[120px]">
                          {asset.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: HIGH-EFFICIENCY FAST DISCOVERY GRID */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="font-mono font-bold uppercase tracking-wider">
                  Full Catalog ({visibleTools.length} Utilities Available)
                </span>
                <span className="text-[11px]">Click any card to open directly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 max-h-[440px] overflow-y-auto pr-2 pb-4 scrollbar-thin">
                {visibleTools.map((tool) => {
                  const asset = getConsoleAsset(tool.meta.slug);
                  const fav = isFavorite(tool.meta.slug);

                  return (
                    <div
                      key={tool.meta.slug}
                      className="group relative rounded-2xl border border-white/10 hover:border-white/30 bg-black/50 hover:bg-black/70 backdrop-blur-md overflow-hidden flex flex-col justify-between transition-all hover:-translate-y-1 p-3.5 space-y-3 shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                          <img
                            src={asset.coverImage}
                            alt={asset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 truncate">
                              {tool.meta.category}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(tool.meta.slug);
                                soundManager.playConfirm();
                              }}
                              className="text-white/40 hover:text-rose-400 cursor-pointer"
                            >
                              <Heart className={`w-3.5 h-3.5 ${fav ? "fill-rose-400 text-rose-400" : ""}`} />
                            </button>
                          </div>
                          <h3 className="font-bold text-sm text-white truncate leading-tight group-hover:text-blue-400 transition-colors">
                            {tool.meta.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                        {tool.meta.description}
                      </p>

                      <Link
                        href={`/tools/${tool.meta.slug}`}
                        onClick={() => soundManager.playConfirm()}
                        className="w-full py-2 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                      >
                        <span>Open Utility</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. PRIMARY ACTION BAR & ACTIVITY CARDS */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundManager.playConfirm();
                  if (activeTool) router.push(`/tools/${activeTool.meta.slug}`);
                }}
                className="px-7 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm tracking-wide flex items-center gap-2.5 shadow-[0_0_25px_rgba(255,255,255,0.35)] transition-all transform active:scale-95 cursor-pointer"
              >
                <span>Launch {activeAsset.title}</span>
                <ArrowRight className="w-4 h-4" />
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/10 text-black/70">
                  ↵
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeTool) {
                    toggleFavorite(activeTool.meta.slug);
                    soundManager.playConfirm();
                  }
                }}
                className={`px-4 py-3 rounded-full border text-xs font-bold tracking-wide flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                  isFav
                    ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                    : "bg-black/40 border-white/15 text-white hover:border-white/30"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-rose-400 text-rose-400" : "text-white/70"}`} />
                <span>{isFav ? "Saved" : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDetailsModal(true)}
                className="px-4 py-3 rounded-full border border-white/15 bg-black/40 hover:border-white/30 text-white text-xs font-bold tracking-wide flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-white/70" />
                <span>Details</span>
              </button>
            </div>

            {/* Feature Activity Cards with Real Photo Thumbnails */}
            <div className="hidden xl:flex items-center gap-3">
              {activeAsset.activities.map((act, i) => (
                <div
                  key={i}
                  className="w-56 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 overflow-hidden flex flex-col group hover:border-white/20 transition-all"
                >
                  <div className="h-20 w-full relative overflow-hidden">
                    <img
                      src={act.image}
                      alt={act.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                        <Play className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                      <span className="text-[10px] font-bold text-white truncate max-w-[170px]">
                        {act.title}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 text-[10px] text-white/60 leading-tight truncate">
                    {act.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 5. CLEAN FOOTER */}
      <footer className="relative z-30 py-3 px-6 sm:px-12 border-t border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between text-xs text-white/70">
        <div className="flex items-center gap-2 text-white/50">
          <span className="font-bold text-white/80">ForgeKit</span>
          <span>·</span>
          <span>Simple UI · Powerful Functionality · Real Usable Outputs</span>
        </div>

        <div className="flex items-center gap-5 text-white/60">
          <span className="hidden sm:flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white/80">← / →</kbd>
            <span>Navigate</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white/80">V</kbd>
            <span>Toggle Grid</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white/80">/</kbd>
            <span>Search</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white/80">⌘K</kbd>
            <span>Palette</span>
          </span>
        </div>
      </footer>

      {/* 6. QUICK DETAILS MODAL */}
      {showDetailsModal && activeTool && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-[#0c0f17] border border-white/20 rounded-3xl max-w-lg w-full p-6 space-y-5 text-white shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowDetailsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-white/20 shrink-0">
                <img
                  src={activeAsset.coverImage}
                  alt={activeAsset.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-black">{activeAsset.title}</h3>
                <span className="text-xs font-mono text-white/50 uppercase">
                  {activeAsset.category}
                </span>
              </div>
            </div>

            <p className="text-sm text-white/70 leading-relaxed font-normal">
              {activeAsset.tagline}
            </p>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-white/90">Keyboard Shortcuts</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                <div>[Enter] : Open Generator</div>
                <div>[F] : Toggle Favorite</div>
                <div>[Q / E] : Switch Category</div>
                <div>[V] : Toggle Grid View</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundManager.playConfirm();
                  router.push(`/tools/${activeTool.meta.slug}`);
                }}
                className="flex-1 py-3 rounded-full bg-white text-black font-extrabold text-sm tracking-wide text-center hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Launch Utility (Enter)
              </button>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-3 rounded-full border border-white/20 hover:bg-white/10 text-xs font-bold uppercase transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Search Command Palette (⌘K) */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
