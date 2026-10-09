"use client";

import React from "react";
import { Icon } from "./Icon";

interface ConsoleCartridgeCoverProps {
  slug: string;
  title: string;
  category: string;
  iconName: string;
  compact?: boolean;
}

export function ConsoleCartridgeCover({
  slug,
  title,
  category,
  iconName,
  compact = false,
}: ConsoleCartridgeCoverProps) {
  // Normalize category styling
  const cat = category.toLowerCase();
  const isDev = cat.includes("dev") || cat.includes("code") || cat.includes("vibe");
  const isDesign = cat.includes("design") || cat.includes("creat");
  const isGrowth = cat.includes("growth") || cat.includes("market");

  let theme = {
    bg: "from-[#131620] via-[#0c0e16] to-[#040508]",
    border: "border-white/10 group-hover:border-white/30",
    badgeBg: "bg-white/10 text-white/80 border-white/15",
    accent: "text-zinc-200",
    glow: "bg-white/10",
    label: "DOCS",
  };

  if (isDev) {
    theme = {
      bg: "from-[#0c1426] via-[#070d1a] to-[#03050a]",
      border: "border-blue-500/20 group-hover:border-blue-400/40",
      badgeBg: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      accent: "text-blue-400",
      glow: "bg-blue-500/20",
      label: "DEV",
    };
  } else if (isDesign) {
    theme = {
      bg: "from-[#1c0e2a] via-[#10081a] to-[#050208]",
      border: "border-purple-500/20 group-hover:border-purple-400/40",
      badgeBg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      accent: "text-purple-400",
      glow: "bg-purple-500/20",
      label: "DESIGN",
    };
  } else if (isGrowth) {
    theme = {
      bg: "from-[#071912] via-[#04100c] to-[#020504]",
      border: "border-emerald-500/20 group-hover:border-emerald-400/40",
      badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      accent: "text-emerald-400",
      glow: "bg-emerald-500/20",
      label: "GROWTH",
    };
  }

  if (compact) {
    return (
      <div
        className={`relative w-full h-full bg-gradient-to-br ${theme.bg} flex flex-col items-center justify-center p-1.5 select-none overflow-hidden`}
      >
        <div className={`w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center ${theme.accent}`}>
          <Icon name={iconName} size={16} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br ${theme.bg} flex flex-col justify-between p-3 select-none overflow-hidden group`}
    >
      {/* Subtle PlayStation geometric background micro-texture */}
      <div className="absolute inset-0 bg-radial-at-t from-white/[0.04] to-transparent pointer-events-none" />
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-xl opacity-40 pointer-events-none transition-all duration-300 group-hover:scale-125 group-hover:opacity-70" />

      {/* Top Header Strip */}
      <div className="relative z-10 flex items-center justify-between gap-1">
        <span
          className={`text-[9px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded border ${theme.badgeBg}`}
        >
          {theme.label}
        </span>
        <div className="flex items-center gap-0.5 text-[7px] font-mono tracking-widest text-white/30">
          <span>○</span>
          <span>✕</span>
          <span>△</span>
          <span>□</span>
        </div>
      </div>

      {/* Center Utility Icon Emblem */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center py-1">
        <div
          className={`relative w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300 ${theme.accent}`}
        >
          <div className={`absolute inset-0 rounded-2xl blur-md opacity-25 ${theme.glow}`} />
          <Icon name={iconName} size={24} className="relative z-10" />
        </div>
      </div>

      {/* Bottom Title & Specs */}
      <div className="relative z-10 space-y-0.5 pt-1">
        <div className="text-[8px] font-mono tracking-widest uppercase text-white/40 truncate">
          IN-BROWSER · LOCAL
        </div>
        <h4 className="text-[11px] sm:text-xs font-bold text-white tracking-tight leading-tight line-clamp-1 group-hover:text-white transition-colors">
          {title}
        </h4>
      </div>
    </div>
  );
}
