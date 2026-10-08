"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Sparkles, ArrowRight, CornerDownLeft } from "lucide-react";
import { registry } from "@/generators/registry";
import { CATEGORIES } from "@/generators/types";
import { Icon } from "./Icon";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredTools = useMemo(() => {
    const publicRegistry = registry.filter(
      (t) => t.meta.lifecycle === "ready"
    );
    if (!query.trim()) return publicRegistry.slice(0, 8);
    const q = query.toLowerCase();
    return publicRegistry.filter((tool) => {
      const matchTitle = tool.meta.title.toLowerCase().includes(q);
      const matchDesc = tool.meta.description.toLowerCase().includes(q);
      const matchTags = tool.meta.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchCategory = CATEGORIES[tool.meta.category]?.name.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTags || matchCategory;
    });
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (slug: string) => {
    onClose();
    router.push(`/tools/${slug}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredTools.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % (filteredTools.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredTools[selectedIndex]) {
          handleSelect(filteredTools[selectedIndex].meta.slug);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredTools, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10 transition-all animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a generator name, tag, or topic... (e.g. qr, invoice, css)"
            className="w-full bg-transparent text-sm md:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center ml-2 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
              <p>No generators found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-zinc-400 mt-1">Try searching by category or keywords.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold tracking-wider uppercase text-zinc-400">
                {query ? "Search Results" : "Featured & Fast Access"}
              </div>
              {filteredTools.map((tool, idx) => {
                const isSelected = idx === selectedIndex;
                const category = CATEGORIES[tool.meta.category];

                return (
                  <div
                    key={tool.meta.slug}
                    onClick={() => handleSelect(tool.meta.slug)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors ${
                      isSelected
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/15"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <Icon name={tool.meta.icon} size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate flex items-center gap-2">
                          <span>{tool.meta.title}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full border ${category.badgeColor}`}
                          >
                            {category.name}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                          {tool.meta.description}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 pl-2">
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-xs font-mono font-medium opacity-80">
                          <span>Open</span>
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <ArrowRight className="w-4 h-4 opacity-30" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-zinc-600 dark:text-zinc-300">↑</kbd>{" "}
              <kbd className="font-mono bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-zinc-600 dark:text-zinc-300">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="font-mono bg-zinc-200 dark:bg-zinc-700 px-1 rounded text-zinc-600 dark:text-zinc-300">↵</kbd> Select
            </span>
          </div>
          <span>100% Client-Side Fast</span>
        </div>
      </div>
    </div>
  );
}
