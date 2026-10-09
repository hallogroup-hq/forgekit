"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { ToolMeta, CATEGORIES } from "@/generators/types";
import { Icon } from "./Icon";
import { usePreferences } from "@/lib/hooks/usePreferences";

interface GeneratorHarnessProps {
  meta: ToolMeta;
  children: React.ReactNode;
}

export function GeneratorHarness({ meta, children }: GeneratorHarnessProps) {
  const { isFavorite, toggleFavorite } = usePreferences();
  const category = CATEGORIES[meta.category];
  const favorite = isFavorite(meta.slug);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          window.location.href = "/";
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-zinc-50/50 dark:bg-zinc-950 py-4 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Compact Tool Header & Controls */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shrink-0 group shadow-2xs"
              title="Return to Console (Esc)"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-semibold">Console</span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                Esc
              </span>
            </Link>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />

            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${
                  category?.badgeColor || "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                }`}
              >
                <Icon name={meta.icon} size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                    {meta.title}
                  </h1>
                  <span className="hidden md:inline-flex text-[10px] font-mono px-1.5 py-0.2 rounded-full border bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 capitalize">
                    {category?.name || meta.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xl">
                  {meta.description}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleFavorite(meta.slug)}
              title={favorite ? "Remove from favorites" : "Add to favorites"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                favorite
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  favorite ? "fill-amber-400 text-amber-500" : ""
                }`}
              />
              <span className="hidden sm:inline">{favorite ? "Favorited" : "Favorite"}</span>
            </button>
          </div>
        </div>

        {/* Generator Main Content */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
