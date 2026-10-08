"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  Trash2,
  RotateCcw,
  Sparkles,
  AlignLeft,
  ArrowRightLeft,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  cleanText,
  computeTextStats,
  CaseTransform,
  TextCleanOptions,
} from "./engine";

const SAMPLE_TEXT = `   ForgeKit is a collection of   practical workstation utilities.  

Our guiding core philosophy:
- Simple UI
- Powerful functionality
- Real usable outputs
- Real usable outputs

   Notice the broken line wraps,   duplicate lines, and extra spaces!
`;

export default function TextCleanerGenerator() {
  const [inputText, setInputText] = useState(SAMPLE_TEXT);
  const [normalizeWhitespace, setNormalizeWhitespace] = useState(true);
  const [trimLines, setTrimLines] = useState(true);
  const [removeEmptyLines, setRemoveEmptyLines] = useState(true);
  const [removeDuplicateLines, setRemoveDuplicateLines] = useState(false);
  const [stripHtml, setStripHtml] = useState(false);
  const [sortLines, setSortLines] = useState<"none" | "asc" | "desc">("none");
  const [caseTransform, setCaseTransform] = useState<CaseTransform>("none");

  const cleanOptions: TextCleanOptions = useMemo(
    () => ({
      normalizeWhitespace,
      trimLines,
      removeEmptyLines,
      removeDuplicateLines,
      stripHtml,
      sortLines,
      caseTransform,
    }),
    [
      normalizeWhitespace,
      trimLines,
      removeEmptyLines,
      removeDuplicateLines,
      stripHtml,
      sortLines,
      caseTransform,
    ]
  );

  const outputText = useMemo(() => {
    return cleanText(inputText, cleanOptions);
  }, [inputText, cleanOptions]);

  const inputStats = useMemo(() => computeTextStats(inputText), [inputText]);
  const outputStats = useMemo(() => computeTextStats(outputText), [outputText]);

  const handleDownload = () => {
    downloadFile(outputText, `cleaned-text-${Date.now()}.txt`, "text/plain");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  const handleSwap = () => {
    setInputText(outputText);
    confetti({ particleCount: 15, spread: 40, origin: { y: 0.8 } });
  };

  const handleReset = () => {
    setInputText(SAMPLE_TEXT);
    setNormalizeWhitespace(true);
    setTrimLines(true);
    setRemoveEmptyLines(true);
    setRemoveDuplicateLines(false);
    setStripHtml(false);
    setSortLines("none");
    setCaseTransform("none");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Options & Input (Left) */}
      <div className="lg:col-span-6 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Source Text
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => setInputText("")}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={10}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your unformatted text, PDF excerpt, or spreadsheet list here..."
            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pt-1">
            <span>
              {inputStats.characters} chars • {inputStats.words} words • {inputStats.lines} lines
            </span>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
            Cleaning Rules
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={normalizeWhitespace}
                onChange={(e) => setNormalizeWhitespace(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Normalize Spaces
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={trimLines}
                onChange={(e) => setTrimLines(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Trim Line Margins
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={removeEmptyLines}
                onChange={(e) => setRemoveEmptyLines(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Strip Blank Lines
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer">
              <input
                type="checkbox"
                checked={removeDuplicateLines}
                onChange={(e) => setRemoveDuplicateLines(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Deduplicate Lines
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer sm:col-span-2">
              <input
                type="checkbox"
                checked={stripHtml}
                onChange={(e) => setStripHtml(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Strip HTML Tags (&lt;p&gt;, &lt;div&gt;, etc.)
              </span>
            </label>
          </div>

          {/* Case Converter Selection */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Case Format
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "none", label: "Preserve" },
                { id: "sentence", label: "Sentence case" },
                { id: "title", label: "Title Case" },
                { id: "upper", label: "UPPERCASE" },
                { id: "lower", label: "lowercase" },
                { id: "camel", label: "camelCase" },
                { id: "snake", label: "snake_case" },
                { id: "kebab", label: "kebab-case" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCaseTransform(c.id as CaseTransform)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors ${
                    caseTransform === c.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Lines Selection */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Line Sorting
            </span>
            <div className="flex gap-2">
              {[
                { id: "none", label: "Original Order" },
                { id: "asc", label: "Alphabetical (A → Z)" },
                { id: "desc", label: "Reverse (Z → A)" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSortLines(s.id as "none" | "asc" | "desc")}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors ${
                    sortLines === s.id
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clean Output Panel (Right) */}
      <div className="lg:col-span-6 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clean Output</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSwap}
              title="Use output as new input for further chained transformations"
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Use as Input</span>
            </button>
            <CopyButton text={outputText} label="Copy Output" />
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            readOnly
            rows={10}
            value={outputText}
            placeholder="Cleaned output will appear here in real-time..."
            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-mono leading-relaxed focus:outline-none resize-y select-all"
          />
        </div>

        {/* Live Metrics Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
              Words
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {outputStats.words}
            </span>
            <span className="text-[10px] text-zinc-400 block">
              {outputStats.words - inputStats.words < 0
                ? `${outputStats.words - inputStats.words}`
                : "No delta"}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
              Characters
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {outputStats.characters}
            </span>
            <span className="text-[10px] text-zinc-400 block">
              {outputStats.charactersNoSpaces} without spaces
            </span>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
              Lines
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {outputStats.lines}
            </span>
            <span className="text-[10px] text-zinc-400 block">
              {outputStats.nonEmptyLines} non-empty
            </span>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
              Reading Time
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              ~{outputStats.readingTimeMinutes}m
            </span>
            <span className="text-[10px] text-zinc-400 block">
              {outputStats.bytes} bytes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
