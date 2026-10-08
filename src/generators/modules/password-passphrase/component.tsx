"use client";

import React, { useState, useMemo, useEffect } from "react";
import { RefreshCw, ShieldCheck, ShieldAlert, Sparkles, Key, BookOpen, Layers } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";

import {
  generatePassword,
  generatePassphrase,
  calculateEntropy,
  EFF_WORDLIST,
} from "./engine";

export default function PasswordGenerator() {
  const [mode, setMode] = useState<"password" | "passphrase">("password");

  // Password Options
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);

  // Passphrase Options
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [capitalize, setCapitalize] = useState(true);
  const [includeNumber, setIncludeNumber] = useState(true);

  // Bulk options
  const [quantity, setQuantity] = useState(1);
  const [seed, setSeed] = useState(0);

  // Cryptographically secure generator
  const [generatedItems, setGeneratedItems] = useState<string[]>(["k8#P9!mX2$vL5@wQ"]);
  const [cryptoError, setCryptoError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const results: string[] = [];
      for (let q = 0; q < quantity; q++) {
        if (mode === "password") {
          results.push(
            generatePassword({
              length,
              useUpper,
              useLower,
              useNumbers,
              useSymbols,
              excludeAmbiguous,
            })
          );
        } else {
          results.push(
            generatePassphrase({
              wordCount,
              separator,
              capitalize,
              includeNumber,
            })
          );
        }
      }
      setGeneratedItems(results);
      setCryptoError(null);
    } catch (err) {
      setCryptoError(err instanceof Error ? err.message : "CSPRNG generation error");
    }
  }, [mode, length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous, wordCount, separator, capitalize, includeNumber, quantity, seed]);

  // Entropy calculation
  const primaryPassword = generatedItems[0] || "";
  const entropyBits = useMemo(() => {
    if (!primaryPassword) return 0;
    if (mode === "password") {
      let poolSize = 0;
      if (useUpper) poolSize += excludeAmbiguous ? 24 : 26;
      if (useLower) poolSize += excludeAmbiguous ? 24 : 26;
      if (useNumbers) poolSize += excludeAmbiguous ? 8 : 10;
      if (useSymbols) poolSize += 26;
      return calculateEntropy(primaryPassword, false, 0, poolSize);
    } else {
      return calculateEntropy(primaryPassword, true, wordCount);
    }
  }, [primaryPassword, mode, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous, wordCount, includeNumber]);

  const strength = useMemo(() => {
    if (entropyBits < 40) return { label: "Weak", color: "text-rose-500", bar: "bg-rose-500", pct: 25 };
    if (entropyBits < 60) return { label: "Fair", color: "text-amber-500", bar: "bg-amber-500", pct: 50 };
    if (entropyBits < 80) return { label: "Strong", color: "text-blue-500", bar: "bg-blue-500", pct: 75 };
    return { label: "Extremely Secure", color: "text-emerald-500", bar: "bg-emerald-500", pct: 100 };
  }, [entropyBits]);

  const handleRegenerate = () => {
    setSeed((prev) => prev + 1);
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
  };

  return (
    <div className="space-y-6">
      {/* Primary Result Card */}
      <div className="p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            <Key className="w-3.5 h-3.5 text-blue-500" />
            <span>Generated Secret</span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${strength.color}`}>
              {strength.label} ({entropyBits} bits)
            </span>
            <button
              onClick={handleRegenerate}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:rotate-180"
              title="Generate New"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big Password Output */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="font-mono text-base md:text-xl font-bold tracking-wider text-zinc-900 dark:text-zinc-50 break-all select-all">
            {primaryPassword}
          </div>
          <CopyButton
            text={primaryPassword}
            label="Copy"
            variant="primary"
            size="md"
            triggerConfetti
          />
        </div>

        {/* Strength Meter Bar */}
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.bar} transition-all duration-300`}
            style={{ width: `${strength.pct}%` }}
          />
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mode & Parameters */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === "password"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Random Password
            </button>
            <button
              type="button"
              onClick={() => setMode("passphrase")}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                mode === "passphrase"
                  ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Memorable Passphrase (XKCD)
            </button>
          </div>

          {mode === "password" ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  <span>Password Length</span>
                  <span className="font-mono text-zinc-400">{length} characters</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useUpper}
                    onChange={(e) => setUseUpper(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Uppercase (A-Z)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useLower}
                    onChange={(e) => setUseLower(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Lowercase (a-z)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useNumbers}
                    onChange={(e) => setUseNumbers(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Numbers (0-9)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSymbols}
                    onChange={(e) => setUseSymbols(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Symbols (!@#$)</span>
                </label>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeAmbiguous}
                    onChange={(e) => setExcludeAmbiguous(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Avoid ambiguous characters (1, l, I, 0, O)</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  <span>Number of Words</span>
                  <span className="font-mono text-zinc-400">{wordCount} words</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="7"
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Separator
                  </label>
                  <select
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  >
                    <option value="-">Hyphen (-)</option>
                    <option value="_">Underscore (_)</option>
                    <option value=".">Period (.)</option>
                    <option value=" ">Space ( )</option>
                  </select>
                </div>

                <div className="space-y-2 pt-4">
                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={capitalize}
                      onChange={(e) => setCapitalize(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Capitalize Words</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeNumber}
                      onChange={(e) => setIncludeNumber(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Append Number</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Generation List */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Bulk Batch Generation
            </span>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            >
              <option value={1}>1 item</option>
              <option value={5}>5 items</option>
              <option value={10}>10 items</option>
              <option value={20}>20 items</option>
            </select>
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {generatedItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              >
                <span className="truncate pr-2 text-zinc-800 dark:text-zinc-200">{item}</span>
                <CopyButton text={item} label="Copy" size="sm" variant="ghost" />
              </div>
            ))}
          </div>

          {quantity > 1 && (
            <div className="pt-2">
              <CopyButton
                text={generatedItems.join("\n")}
                label={`Copy All ${quantity} Secrets`}
                size="sm"
                variant="outline"
                className="w-full"
                triggerConfetti
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
