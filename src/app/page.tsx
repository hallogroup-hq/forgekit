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
  { id: "developer", label: "Developer" },
  { id: "creative", label: "Design" },
  { id: "productivity", label: "Productivity" },
  { id: "marketing", label: "Marketing" },
  { id: "sales", label: "Sales & Docs" },
  { id: "pinned", label: "Saved" },
];

function matchesCategory(tool: GeneratorModule, categoryId: string): boolean {
  if (categoryId === "all") return true;
  const slug = tool.meta.slug;
  const cat = tool.meta.category;

  if (categoryId === "productivity") {
    return (
      [
        "csv-cleaner",
        "text-cleaner",
        "bulk-filename-builder",
        "meeting-agenda",
        "markdown-table",
      ].includes(slug) || cat === "content"
    );
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

  if (categoryId === "developer" || categoryId === "vibe-coder") {
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
      (t) => t.meta.lifecycle === "ready"
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
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <img
          key={activeAsset.backdropImage}
          src={activeAsset.backdropImage}
          alt={activeAsset.title}
          className="w-full h-full object-cover object-center absolute inset-0 opacity-35 scale-105 transition-all duration-700 ease-out animate-in fade-in"
        />

        {/* Dynamic Category Ambient Glow Tint */}
        <div
          className={`absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full blur-[140px] opacity-20 transition-all duration-1000 ${
            activeTool.meta.category === "developer" || activeTool.meta.category === "vibe-coder"
              ? "bg-blue-600"
              : activeTool.meta.category === "design"
              ? "bg-purple-600"
              : activeTool.meta.category === "growth"
              ? "bg-emerald-600"
              : "bg-slate-400"
          }`}
        />

        {/* Vignette Overlays for Crisp Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070b] via-[#05070b]/75 to-[#05070b]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05070b]/90 via-[#05070b]/50 to-transparent" />
      </div>

      {/* 2. TOP HUD: BRAND & PRIMARY CONTROLS (UNBREAKABLE SINGLE ROW) */}
      <header className="relative z-30 pt-6 px-6 sm:px-10 flex items-center justify-between gap-4 flex-nowrap w-full">
        {/* Left: Brand Identity & Category Navigation */}
        <div className="flex items-center gap-5 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white text-black font-black text-sm flex items-center justify-center tracking-tighter shadow-md group-hover:scale-105 transition-transform">
              FK
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider uppercase text-white leading-none">
                ForgeKit
              </span>
              <span className="text-[10px] font-mono text-white/40 tracking-wider mt-0.5">
                Suite
              </span>
            </div>
          </Link>

          {/* Clean Category Navigation Pills (Horizontally scrollable if tight) */}
          <nav className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-1 rounded-full border border-white/10 shadow-inner overflow-x-auto scrollbar-none flex-nowrap">
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
          </nav>
        </div>

        {/* Right Utilities (Strictly unbreakable single group, never leaks/wraps) */}
        <div className="flex items-center gap-2.5 shrink-0 flex-nowrap">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
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
              placeholder="Search tools..."
              className="w-32 sm:w-44 md:w-52 focus:w-60 pl-8 pr-7 py-1.5 rounded-full bg-black/40 hover:bg-black/60 focus:bg-black/80 backdrop-blur-md border border-white/10 focus:border-white/30 text-xs text-white placeholder-white/40 focus:outline-none transition-all duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Shelf vs Grid */}
          <div className="flex items-center bg-black/40 backdrop-blur-md p-0.5 rounded-full border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode("shelf");
                soundManager.playNavigate();
              }}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === "shelf" ? "bg-white text-black shadow-xs" : "text-white/60 hover:text-white"
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
                viewMode === "grid" ? "bg-white text-black shadow-xs" : "text-white/60 hover:text-white"
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
            className="p-1.5 rounded-full bg-black/40 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-white/40" />}
          </button>

          {/* System Time */}
          <span className="hidden xl:inline-block text-xs font-mono text-white/40 border-l border-white/10 pl-2.5 shrink-0">
            {currentTime || "00:14"}
          </span>
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
                            ? "ring-2 ring-white scale-105 shadow-2xl shadow-black/80 z-10"
                            : "border border-white/10 hover:border-white/30 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={asset.coverImage}
                          alt={asset.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                        <div className="absolute top-2.5 left-2.5 p-1 rounded-md bg-black/60 backdrop-blur-md text-white/90 border border-white/10">
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
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
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
                            loading="lazy"
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
                className="px-7 py-3 rounded-full bg-white hover:bg-zinc-100 text-black font-extrabold text-sm tracking-wide flex items-center gap-2.5 shadow-lg shadow-black/60 transition-all transform active:scale-95 cursor-pointer"
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

            {/* Feature Activity Cards: Real Technical Capabilities */}
            <div className="hidden xl:flex items-center gap-3">
              {activeAsset.activities.map((act, i) => (
                <div
                  key={i}
                  className="w-56 p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-2 select-none"
                >
                  {act.image && (
                    <div className="w-full h-20 rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={act.image}
                        alt={act.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                      FEATURE 0{i + 1}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {i === 0 ? "SPEC" : "CAPABILITY"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight truncate">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2 mt-0.5">
                      {act.description}
                    </p>
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
          <span>Offline-first developer & creative utilities</span>
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
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-white/20 shrink-0 relative">
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
