"use client";

import React, { useState, useMemo } from "react";
import { RefreshCw, Download } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

import { IdType, generateBatchIds } from "./engine";

export default function UuidNanoidGenerator() {
  const [type, setType] = useState<IdType>("uuid4");
  const [count, setCount] = useState(10);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [format, setFormat] = useState<"lines" | "json">("lines");
  const [nanoidLength, setNanoidLength] = useState(21);
  const [seed, setSeed] = useState(0);

  const generatedList = useMemo(() => {
    try {
      return generateBatchIds({
        type,
        count,
        uppercase,
        hyphens,
        nanoidLength,
      });
    } catch (err) {
      console.error("CSPRNG batch generation error", err);
      return [];
    }
  }, [type, count, uppercase, hyphens, nanoidLength, seed]);

  const outputText = useMemo(() => {
    if (format === "json") {
      return JSON.stringify(generatedList, null, 2);
    }
    return generatedList.join("\n");
  }, [generatedList, format]);

  const handleDownload = () => {
    const ext = format === "json" ? "json" : "txt";
    downloadFile(outputText, `identifiers-${type}-${Date.now()}.${ext}`, ext === "json" ? "application/json" : "text/plain");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Panel (Left) */}
      <div className="lg:col-span-5 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
            Identifier Standard
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "uuid4", label: "UUID v4", desc: "Random Standard" },
              { id: "uuid7", label: "UUID v7", desc: "Timestamp Ordered" },
              { id: "nanoid", label: "NanoID", desc: "Compact & URL-safe" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id as IdType)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  type === item.id
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold shadow-2xs"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="font-semibold text-xs">{item.label}</div>
                <div className={`text-[10px] mt-0.5 ${type === item.id ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500"}`}>
                  {item.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <span>Batch Quantity</span>
              <span className="font-mono text-zinc-400">{count} IDs</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-zinc-100"
            />
          </div>

          {type === "nanoid" && (
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                <span>NanoID Length</span>
                <span className="font-mono text-zinc-400">{nanoidLength} chars</span>
              </div>
              <input
                type="range"
                min="8"
                max="36"
                value={nanoidLength}
                onChange={(e) => setNanoidLength(Number(e.target.value))}
                className="w-full accent-zinc-900 dark:accent-zinc-100"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="rounded text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
              />
              <span>Uppercase (A-Z)</span>
            </label>

            {type !== "nanoid" && (
              <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hyphens}
                  onChange={(e) => setHyphens(e.target.checked)}
                  className="rounded text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
                />
                <span>Include Hyphens</span>
              </label>
            )}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Output Structure
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("lines")}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  format === "lines"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-zinc-100"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Line-by-Line
              </button>
              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  format === "json"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-zinc-100"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                JSON Array
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSeed((prev) => prev + 1)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Regenerate IDs</span>
        </button>
      </div>

      {/* Output Panel (Right) */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {count} Identifiers Ready
          </span>

          <div className="flex items-center gap-2">
            <CopyButton
              text={outputText}
              label="Copy All"
              size="sm"
              variant="secondary"
              triggerConfetti
            />
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 max-h-[460px] overflow-y-auto">
          <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre selection:bg-zinc-200 dark:selection:bg-zinc-800 leading-relaxed">
            {outputText}
          </pre>
        </div>
      </div>
    </div>
  );
}
