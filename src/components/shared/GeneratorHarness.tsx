"use client";

import React from "react";
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-50/50 dark:bg-zinc-950 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="space-y-2">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Link
                href="/"
                className="hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1.5 transition-colors font-semibold group"
              >
                <span className="w-5 h-5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-[9px] font-black flex items-center justify-center tracking-tighter shadow-2xs group-hover:scale-105 transition-transform">
                  FK
                </span>
                <span>ForgeKit Home</span>
              </Link>
              <span>/</span>
              <span className="capitalize">{category?.name || meta.category}</span>
              <span>/</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                {meta.title}
              </span>
            </div>

            {/* Title & Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-2xs ${category?.badgeColor || "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"}`}>
                <Icon name={meta.icon} size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {meta.title}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  {meta.description}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
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
              <span>{favorite ? "Favorited" : "Favorite"}</span>
            </button>
          </div>
        </div>

        {/* Generator Main Content */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
