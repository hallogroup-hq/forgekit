"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, ShieldCheck, Zap, Lock } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                ForgeKit
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
              The extensible workstation of modern generators. Built to speed up your everyday workflows across design, development, writing, and productivity.
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant Client Execution
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-500" /> 100% Private & Local
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Generator Categories
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link href="/?category=developer" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Developer & DevOps
                </Link>
              </li>
              <li>
                <Link href="/?category=vibe-coder" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Architecture & Prompts
                </Link>
              </li>
              <li>
                <Link href="/?category=design" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Design & UI/UX
                </Link>
              </li>
              <li>
                <Link href="/?category=growth" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Marketing & Growth
                </Link>
              </li>
              <li>
                <Link href="/?category=content" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  Content & Documents
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Zero Data Telemetry
              </li>
              <li>No Account Required</li>
              <li>High Resolution Exports</li>
              <li>Open Architecture Ready</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>© 2026 ForgeKit. Empowering digital workflows.</p>
          <p className="font-mono text-[11px]">
            Designed for Speed, Privacy & Precision
          </p>
        </div>
      </div>
    </footer>
  );
}
