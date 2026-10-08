"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Wrench, Search, Command } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "../shared/CommandPalette";

export function Navbar() {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                  ForgeKit
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  v1.0
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono -mt-1 hidden sm:inline">
                The Workstation of Generators
              </span>
            </div>
          </Link>

          {/* Search Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex-1 max-w-md hidden md:flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-sm group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
              <span>Search any generator...</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] bg-zinc-200/60 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-300/40 dark:border-zinc-700/60 text-zinc-500 dark:text-zinc-400">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </button>

          {/* Actions & Theme */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="md:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </>
  );
}
