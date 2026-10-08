"use client";

import React, { useState, useMemo } from "react";
import { RefreshCw, Download } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type IdType = "uuid4" | "uuid7" | "nanoid";

export default function UuidNanoidGenerator() {
  const [type, setType] = useState<IdType>("uuid4");
  const [count, setCount] = useState(10);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [format, setFormat] = useState<"lines" | "json">("lines");
  const [nanoidLength, setNanoidLength] = useState(21);
  const [seed, setSeed] = useState(0);

  // Generate UUID v7 (timestamp ordered)
  const generateUuidV7 = (): string => {
    const timestamp = typeof window !== "undefined" ? Date.now() : 1775600000000;
    const timeHex = timestamp.toString(16).padStart(12, "0");
    const randPart1 = Math.floor(Math.random() * 0x0fff).toString(16).padStart(3, "0");
    const randPart2 = (Math.floor(Math.random() * 0x3fff) | 0x8000).toString(16).padStart(4, "0");
    const randPart3 = Math.floor(Math.random() * 0xffffffffffff).toString(16).padStart(12, "0");
    return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7${randPart1}-${randPart2}-${randPart3}`;
  };

  // Generate UUID v4 (random)
  const generateUuidV4 = (): string => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Generate NanoID
  const generateNanoId = (len: number): string => {
    const alphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWQGZ_cfghjklqvwyzECT";
    let id = "";
    for (let i = 0; i < len; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
  };

  const generatedList = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      let raw = "";
      if (type === "uuid4") raw = generateUuidV4();
      else if (type === "uuid7") raw = generateUuidV7();
      else raw = generateNanoId(nanoidLength);

      if (!hyphens && (type === "uuid4" || type === "uuid7")) {
        raw = raw.replace(/-/g, "");
      }
      if (uppercase) {
        raw = raw.toUpperCase();
      } else if (type !== "nanoid") {
        raw = raw.toLowerCase();
      }
      list.push(raw);
    }
    return list;
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
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                }`}
              >
                <div className="font-semibold text-xs">{item.label}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
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
              className="w-full accent-blue-600"
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
                className="w-full accent-blue-600"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Uppercase (A-Z)</span>
            </label>

            {type !== "nanoid" && (
              <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hyphens}
                  onChange={(e) => setHyphens(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
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
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border ${
                  format === "lines"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Line-by-Line
              </button>
              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border ${
                  format === "json"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 max-h-[460px] overflow-y-auto">
          <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre selection:bg-blue-500/20 leading-relaxed">
            {outputText}
          </pre>
        </div>
      </div>
    </div>
  );
}
