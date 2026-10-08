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
} from "lucide-react";
import { registry } from "@/generators/registry";
import { CATEGORIES } from "@/generators/types";
import { Icon } from "@/components/shared/Icon";
import { usePreferences } from "@/lib/hooks/usePreferences";
import { soundManager } from "@/lib/sound";
import { CommandPalette } from "@/components/shared/CommandPalette";

// Thematic atmosphere profiles for the PS5 dynamic background
const TOOL_BACKDROPS: Record<
  string,
  {
    gradient: string;
    glowColor: string;
    accentGlow: string;
    kicker: string;
    activities: { title: string; subtitle: string; icon: string }[];
  }
> = {
  "qr-code": {
    gradient: "from-emerald-950/80 via-teal-950/40 to-[#07090e]",
    glowColor: "rgba(16, 185, 129, 0.22)",
    accentGlow: "#10b981",
    kicker: "FLAGSHIP PRO // ULTRA HD VECTOR SUITE",
    activities: [
      { title: "Center Brand Logo", subtitle: "WhatsApp, WiFi, GitHub & Custom PNG", icon: "Sparkles" },
      { title: "2,000px Ultra HD", subtitle: "Lossless canvas PNG & vector SVG", icon: "Maximize2" },
      { title: "Multi-Channel Payloads", subtitle: "WiFi WPA3, WhatsApp direct, vCard, Crypto", icon: "Radio" },
    ],
  },
  "design-md": {
    gradient: "from-blue-950/80 via-indigo-950/40 to-[#07090e]",
    glowColor: "rgba(59, 130, 246, 0.22)",
    accentGlow: "#3b82f6",
    kicker: "LIVE INSPECTOR // DESIGN TOKENS ARCHITECT",
    activities: [
      { title: "Live Website Scanner", subtitle: "Scan linear.app, stripe.com, apple.com", icon: "Search" },
      { title: "10-Step Color Ramp", subtitle: "50-950 tint & shade palette math", icon: "Palette" },
      { title: "4 Export Formats", subtitle: "DESIGN.md, tailwind.config.ts, CSS, JSON", icon: "Code2" },
    ],
  },
  "prompt-optimizer": {
    gradient: "from-violet-950/80 via-purple-950/40 to-[#07090e]",
    glowColor: "rgba(139, 92, 246, 0.25)",
    accentGlow: "#8b5cf6",
    kicker: "VIBE CODER // REASONING SYSTEM PROMPT ARCHITECT",
    activities: [
      { title: "XML Guardrails", subtitle: "<role>, <thinking_process>, <anti_patterns>", icon: "Terminal" },
      { title: "Few-Shot Exemplars", subtitle: "Inject concrete input-output demonstrations", icon: "Sparkles" },
      { title: "Token Budget Counter", subtitle: "Live token & word count estimation", icon: "Cpu" },
    ],
  },
  "webhook-payload": {
    gradient: "from-indigo-950/80 via-blue-950/40 to-[#07090e]",
    glowColor: "rgba(99, 102, 241, 0.22)",
    accentGlow: "#6366f1",
    kicker: "TECH & DEVOPS // LIVE DISPATCH TEST RUNNER",
    activities: [
      { title: "Live POST Dispatcher", subtitle: "Fire real HTTP requests to your webhook", icon: "Terminal" },
      { title: "Roundtrip Latency", subtitle: "Real ms duration & response body inspection", icon: "Zap" },
      { title: "Signed Signatures", subtitle: "Stripe-Signature, GitHub sha256, Clerk svix", icon: "KeyRound" },
    ],
  },
  "curl-converter": {
    gradient: "from-amber-950/80 via-yellow-950/30 to-[#07090e]",
    glowColor: "rgba(245, 158, 11, 0.20)",
    accentGlow: "#f59e0b",
    kicker: "DEVELOPER UTILITY // MULTI-LANG API CODE GENERATOR",
    activities: [
      { title: "Paste Chrome cURL", subtitle: "Instant network request parsing", icon: "Terminal" },
      { title: "5 Languages Ready", subtitle: "Fetch, Axios, Python Requests, Go net/http", icon: "Code2" },
      { title: "Auth & Header Parsing", subtitle: "Basic auth, Bearer tokens, JSON bodies", icon: "ShieldCheck" },
    ],
  },
  "jwt-inspector": {
    gradient: "from-rose-950/80 via-red-950/30 to-[#07090e]",
    glowColor: "rgba(244, 63, 94, 0.22)",
    accentGlow: "#f43f5e",
    kicker: "SECURITY SUITE // 100% PRIVATE CLIENT-SIDE TOKEN DEBUGGER",
    activities: [
      { title: "Zero Network Leaks", subtitle: "Tokens never leave your local browser sandbox", icon: "ShieldCheck" },
      { title: "Expiration Countdown", subtitle: "Live validity countdown & expired alerts", icon: "Clock" },
      { title: "Mock Token Generator", subtitle: "Craft custom HS256 JWT claims for testing", icon: "KeyRound" },
    ],
  },
  "svg-blob": {
    gradient: "from-fuchsia-950/80 via-pink-950/40 to-[#07090e]",
    glowColor: "rgba(236, 72, 153, 0.22)",
    accentGlow: "#ec4899",
    kicker: "CREATIVE & UI/UX // GENERATIVE BEZIER SHAPE STUDIO",
    activities: [
      { title: "Organic Morphing Blobs", subtitle: "3 to 16 anchor points with tension slider", icon: "Sparkles" },
      { title: "Section Wave Dividers", subtitle: "Fluid landing page responsive transitions", icon: "Layers" },
      { title: "Multi-Stop Gradients", subtitle: "Linear & radial angle color stops", icon: "Palette" },
    ],
  },
};

const CATEGORY_TABS = [
  { id: "all", label: "ALL", countKey: "all" },
  { id: "vibe-coder", label: "VIBE CODER", countKey: "vibe-coder" },
  { id: "developer", label: "DEVOPS", countKey: "developer" },
  { id: "design", label: "DESIGN", countKey: "design" },
  { id: "growth", label: "GROWTH", countKey: "growth" },
  { id: "content", label: "CREATIVE", countKey: "content" },
  { id: "pinned", label: "PINNED", countKey: "pinned" },
];

export default function PS5HomePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"shelf" | "grid">("shelf");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const { isFavorite, toggleFavorite, favorites, isLoaded } = usePreferences();

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter tools based on category
  const visibleTools = useMemo(() => {
    if (selectedCategory === "pinned") {
      if (!isLoaded || favorites.length === 0) return [];
      return registry.filter((t) => favorites.includes(t.meta.slug));
    }
    if (selectedCategory === "all") return registry;
    return registry.filter((t) => t.meta.category === selectedCategory);
  }, [selectedCategory, favorites, isLoaded]);

  // Ensure active index is bounded
  useEffect(() => {
    if (activeIndex >= visibleTools.length) {
      setActiveIndex(Math.max(0, visibleTools.length - 1));
    }
  }, [visibleTools.length, activeIndex]);

  const activeTool = visibleTools[activeIndex] || registry[0];

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

  // Switch category bumper (L1 / R1)
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

  // Keyboard navigation for console controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or command palette
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, activeTool, isCommandOpen, router, toggleFavorite, handleNavigate, handleSwitchCategory]);

  const activeBackdrop =
    (activeTool && TOOL_BACKDROPS[activeTool.meta.slug]) || {
      gradient: "from-blue-950/60 via-zinc-950/80 to-[#07090e]",
      glowColor: "rgba(59, 130, 246, 0.15)",
      accentGlow: "#3b82f6",
      kicker: "WORKSTATION MODULE // 100% PRIVATE CLIENT-SIDE",
      activities: [
        { title: "Zero Latency", subtitle: "Instant local JavaScript execution", icon: "Zap" },
        { title: "No Server Uploads", subtitle: "Your data stays 100% in your browser", icon: "ShieldCheck" },
        { title: "Offline Resilient", subtitle: "Works without an internet connection", icon: "Radio" },
      ],
    };

  const isFav = activeTool ? isFavorite(activeTool.meta.slug) : false;

  return (
    <div className="relative min-h-screen bg-[#07090e] text-white flex flex-col justify-between overflow-x-hidden font-sans select-none selection:bg-white/20">
      {/* Dynamic Ambient Cinematic Backdrop */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${activeBackdrop.gradient} transition-all duration-700 pointer-events-none opacity-90`}
      />
      <div
        className="absolute top-0 right-0 w-[600px] h-[500px] rounded-full blur-[130px] transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: activeBackdrop.glowColor }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* 1. TOP HUD / STATUS BAR (PlayStation 5 Header) */}
      <header className="relative z-30 pt-6 px-6 sm:px-10 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        {/* Left: Console Logo & System Mode */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-white text-black font-black text-xs flex items-center justify-center tracking-tighter shadow-md group-hover:scale-105 transition-transform">
              PS5
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider uppercase text-white/90">
                FORGEKIT OS
              </span>
              <span className="text-[10px] font-mono text-white/40 tracking-wider">
                CONSOLE EDITION
              </span>
            </div>
          </Link>

          {/* Quick Mode Indicators */}
          <div className="hidden md:flex items-center gap-4 text-xs font-semibold tracking-wider text-white/50 pl-4 border-l border-white/10">
            <span className="text-white border-b-2 border-white pb-0.5 cursor-default">
              WORKSTATION
            </span>
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              DIRECTORY
            </button>
          </div>
        </div>

        {/* Center: L1 / R1 Controller Category Bar */}
        <div className="hidden lg:flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => handleSwitchCategory("left")}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white/10 text-white/70 hover:bg-white/20 transition-colors cursor-pointer"
            title="Press Q or Click to go left"
          >
            <span>[L1]</span>
          </button>

          <div className="flex items-center gap-1">
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
                  className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-all cursor-pointer ${
                    active
                      ? "bg-white text-black shadow-lg scale-105"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleSwitchCategory("right")}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white/10 text-white/70 hover:bg-white/20 transition-colors cursor-pointer"
            title="Press E or Click to go right"
          >
            <span>[R1]</span>
          </button>
        </div>

        {/* Right: Clock, Sound Toggle, Search & Profile */}
        <div className="flex items-center gap-4 text-white/80">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              const res = soundManager.toggleSound();
              setSoundEnabled(res);
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Console Audio" : "Enable Console Audio"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/40" />}
          </button>

          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            title="Quick Search (⌘K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Shelf / Grid View Toggle */}
          <button
            type="button"
            onClick={() => {
              setViewMode(viewMode === "shelf" ? "grid" : "shelf");
              soundManager.playNavigate();
            }}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              viewMode === "grid" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/70"
            }`}
            title="Toggle Library View (V)"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Profile Badge */}
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                AK
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold leading-none">Developer</span>
              <span className="text-[10px] font-mono text-white/40 leading-none mt-0.5">Lv. 99</span>
            </div>
          </div>

          {/* Digital Clock */}
          <span className="text-xs font-mono font-bold tracking-wider text-white/70 min-w-[70px] text-right">
            {currentTime || "12:00 PM"}
          </span>
        </div>
      </header>

      {/* 2. THE SIGNATURE HORIZONTAL CONSOLE TILE ROW (PS5 Shelf) */}
      <section className="relative z-20 pt-6 px-6 sm:px-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-white/40">
              INSTALLED GENERATORS ({visibleTools.length})
            </span>
            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-white/10 text-white/60">
              100% Client Offline
            </span>
          </div>

          {/* Navigation Arrows for mouse */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleNavigate(activeIndex - 1)}
              disabled={activeIndex <= 0}
              className="p-1 rounded-full bg-white/5 hover:bg-white/15 disabled:opacity-20 text-white transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate(activeIndex + 1)}
              disabled={activeIndex >= visibleTools.length - 1}
              className="p-1 rounded-full bg-white/5 hover:bg-white/15 disabled:opacity-20 text-white transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === "shelf" ? (
          /* Horizontal Shelf Carousel */
          <div
            ref={carouselRef}
            className="flex items-center gap-4 overflow-x-auto pt-3 pb-6 scrollbar-none scroll-smooth"
            style={{ perspective: "1000px" }}
          >
            {visibleTools.map((tool, idx) => {
              const isSelected = idx === activeIndex;
              const cat = CATEGORIES[tool.meta.category];

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
                  className={`group relative shrink-0 flex flex-col items-center transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "-translate-y-2.5 scale-105 z-20"
                      : "hover:-translate-y-1 opacity-70 hover:opacity-95"
                  }`}
                >
                  {/* Square App Icon Tile (PS5 Game Box) */}
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden transition-all duration-200 ${
                      isSelected
                        ? "bg-zinc-800 text-white ring-2 ring-white ps-active-tile"
                        : "bg-zinc-900/80 border border-white/10 text-white/80 hover:border-white/30"
                    }`}
                  >
                    <Icon name={tool.meta.icon} size={32} />

                    {/* Version or Popular badge */}
                    {tool.meta.isPopular && (
                      <span className="absolute top-1.5 right-1.5 text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        PRO
                      </span>
                    )}

                    {/* Tool Category pip */}
                    <span
                      className="absolute bottom-1.5 left-2 text-[8px] font-mono text-white/40 uppercase tracking-tighter truncate max-w-[70px]"
                    >
                      {cat.name.split(" ")[0]}
                    </span>
                  </div>

                  {/* Active Tool Label with Indicator Pip directly below */}
                  <div
                    className={`mt-2 flex items-center gap-1.5 transition-all text-center max-w-[110px] ${
                      isSelected ? "opacity-100" : "opacity-0 scale-95"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                    <span className="text-[11px] font-bold text-white tracking-wide truncate">
                      {tool.meta.shortTitle || tool.meta.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Grid View Mode */
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[380px] overflow-y-auto pr-2 pb-4">
            {visibleTools.map((tool, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={tool.meta.slug}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    soundManager.playNavigate();
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-white text-black ring-2 ring-blue-400 font-bold scale-105"
                      : "bg-zinc-900/60 border-white/10 hover:border-white/30 text-white"
                  }`}
                >
                  <Icon name={tool.meta.icon} size={24} />
                  <span className="text-xs truncate w-full">{tool.meta.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. CENTER STAGE HERO DETAIL & ACTIVITY CARDS (PS5 Game Page) */}
      <section className="relative z-20 flex-1 px-6 sm:px-10 pb-6 flex flex-col justify-end">
        <div className="max-w-5xl space-y-5">
          {/* Micro Kicker */}
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold tracking-wider bg-white/10 text-white/80 border border-white/10">
              {activeBackdrop.kicker}
            </span>
            <span className="text-xs font-mono text-white/40">
              INDEX [{activeIndex + 1}/{visibleTools.length}]
            </span>
          </div>

          {/* Giant Title & Description */}
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
              {activeTool ? activeTool.meta.title : "ForgeKit Workstation"}
            </h1>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">
              {activeTool ? activeTool.meta.description : "Select any generator to begin."}
            </p>
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                soundManager.playConfirm();
                if (activeTool) router.push(`/tools/${activeTool.meta.slug}`);
              }}
              className="px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm tracking-wider uppercase flex items-center gap-2.5 shadow-[0_0_30px_rgba(255,255,255,0.35)] transition-all transform active:scale-95 cursor-pointer"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white font-black text-[11px]">
                ✕
              </span>
              <span>PLAY GENERATOR (ENTER)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeTool) {
                  toggleFavorite(activeTool.meta.slug);
                  soundManager.playConfirm();
                }
              }}
              className={`px-4 py-3 rounded-full border text-xs font-bold tracking-wider uppercase flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
                isFav
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                  : "bg-black/40 border-white/15 text-white hover:border-white/30"
              }`}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] border border-emerald-500/30">
                △
              </span>
              <span>{isFav ? "PINNED FAVORITE" : "PIN TO FAVORITES (F)"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className="px-4 py-3 rounded-full border border-white/15 bg-black/40 hover:border-white/30 text-white text-xs font-bold tracking-wider uppercase flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 font-black text-[11px] border border-pink-500/30">
                □
              </span>
              <span>SPEC DETAILS (SPACE)</span>
            </button>
          </div>

          {/* Activity Cards (As seen in Image 2 of PS5) */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeBackdrop.activities.map((act, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/20 transition-colors flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Icon name={act.icon} size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white tracking-wide truncate">
                    {act.title}
                  </div>
                  <div className="text-[11px] text-white/50 leading-snug mt-0.5 line-clamp-2">
                    {act.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BOTTOM CONTROLLER LEGEND / PROMPT HUD (Image 1) */}
      <footer className="relative z-30 py-3.5 px-6 sm:px-10 border-t border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between flex-wrap gap-4 text-xs font-medium text-white/70">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/30 text-blue-300 font-bold text-[10px] border border-blue-400/40">
              ✕
            </span>
            <span>PLAY</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-pink-500/30 text-pink-300 font-bold text-[10px] border border-pink-400/40">
              □
            </span>
            <span>DETAILS</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-[10px] border border-emerald-400/40">
              △
            </span>
            <span>FAVORITE</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500/30 text-red-300 font-bold text-[10px] border border-red-400/40">
              ○
            </span>
            <span>SEARCH ⌘K</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-white/50">
            <span className="px-1.5 py-0.2 rounded bg-white/10 font-mono text-[10px]">Q / E</span>
            <span>CATEGORIES</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-white/50">
            <span className="px-1.5 py-0.2 rounded bg-white/10 font-mono text-[10px]">← / →</span>
            <span>SELECT</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-white/40">
          FORGEKIT CONSOLE • ALL RIGHTS RESERVED
        </div>
      </footer>

      {/* Details Quick Modal */}
      {showDetailsModal && activeTool && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-zinc-900 border border-white/20 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <Icon name={activeTool.meta.icon} size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{activeTool.meta.title}</h3>
                  <span className="text-xs text-blue-400 font-mono">
                    Category: {CATEGORIES[activeTool.meta.category].name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="text-white/40 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              {activeTool.meta.description}
            </p>

            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-bold text-white/50 uppercase tracking-wider block">
                Tags & Capabilities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeTool.meta.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-mono text-[10px]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-white/60 hover:text-white"
              >
                Close (Esc)
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playConfirm();
                  router.push(`/tools/${activeTool.meta.slug}`);
                }}
                className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200"
              >
                Launch Generator &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Command Palette */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
