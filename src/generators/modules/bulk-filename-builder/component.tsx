"use client";

import React, { useState, useMemo } from "react";
import { Download, Terminal, RefreshCw, FileText, Check, ArrowRight, Hash } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  RenameRuleOptions,
  batchRenameFiles,
  generateShellScript,
  generateMappingCsv,
} from "./engine";

const SAMPLE_FILES = `DSC_0042.JPG
DSC_0043.JPG
Screenshot 2026-10-08 at 14.22.01.png
Company Pitch Deck (Final Draft v3).pdf
Product Hero Banner [High-Res].webp
DSC_0044.JPG`;

export default function BulkFilenameBuilderGenerator() {
  const [inputFiles, setInputFiles] = useState(SAMPLE_FILES);

  // Transformation rules
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [casing, setCasing] = useState<RenameRuleOptions["casing"]>("kebab-case");
  const [slugify, setSlugify] = useState(true);
  const [numbering, setNumbering] = useState(true);
  const [numberingStart, setNumberingStart] = useState(1);
  const [numberingDigits, setNumberingDigits] = useState(3);
  const [numberingPosition, setNumberingPosition] = useState<"prefix" | "suffix">("suffix");
  const [changeExtension, setChangeExtension] = useState("");

  const filenamesList = useMemo(() => {
    return inputFiles
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  }, [inputFiles]);

  const options: RenameRuleOptions = useMemo(() => ({
    prefix: prefix || undefined,
    suffix: suffix || undefined,
    findText: findText || undefined,
    replaceText: replaceText || undefined,
    casing,
    slugify,
    numbering,
    numberingStart,
    numberingDigits,
    numberingPosition,
    changeExtension: changeExtension || undefined,
  }), [prefix, suffix, findText, replaceText, casing, slugify, numbering, numberingStart, numberingDigits, numberingPosition, changeExtension]);

  const mappings = useMemo(() => {
    return batchRenameFiles(filenamesList, options);
  }, [filenamesList, options]);

  const newNamesText = useMemo(() => {
    return mappings.map((m) => m.newName).join("\n");
  }, [mappings]);

  const handleDownloadSh = () => {
    const script = generateShellScript(mappings, "sh");
    downloadFile(script, "rename.sh", "text/x-sh");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  const handleDownloadBat = () => {
    const script = generateShellScript(mappings, "bat");
    downloadFile(script, "rename.bat", "application/x-bat");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  const handleDownloadCsv = () => {
    const csv = generateMappingCsv(mappings);
    downloadFile(csv, "filename-mapping.csv", "text/csv");
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
  };

  const handleResetSample = () => {
    setInputFiles(SAMPLE_FILES);
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration & Rules Panel */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Batch Renaming Pipeline Rules
          </span>
          <button
            type="button"
            onClick={handleResetSample}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Sample Files</span>
          </button>
        </div>

        {/* Rule Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-zinc-500 text-[11px] mb-1 font-medium">Add Prefix</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g. 2026_trip_"
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-500 text-[11px] mb-1 font-medium">Add Suffix</label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              placeholder="e.g. _web"
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-500 text-[11px] mb-1 font-medium">Find Text</label>
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Text to replace..."
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-500 text-[11px] mb-1 font-medium">Replace With</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replacement..."
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-500 text-[11px] mb-1 font-medium">Casing Normalization</label>
            <select
              value={casing}
              onChange={(e) => setCasing(e.target.value as RenameRuleOptions["casing"])}
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            >
              <option value="preserve">Preserve Original Casing</option>
              <option value="lowercase">lowercase</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="kebab-case">kebab-case (web friendly)</option>
              <option value="snake_case">snake_case (code friendly)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-500 text-[11px] mb-1 font-medium">Change Extension (Optional)</label>
            <input
              type="text"
              value={changeExtension}
              onChange={(e) => setChangeExtension(e.target.value)}
              placeholder="e.g. webp (or leave empty)"
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={slugify}
                onChange={(e) => setSlugify(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Slugify Spaces & Symbols</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-5">
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={numbering}
                onChange={(e) => setNumbering(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Zero-Padded Sequence</span>
            </label>
          </div>
        </div>

        {/* Numbering Extra Controls */}
        {numbering && (
          <div className="flex items-center gap-4 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span>Start Index:</span>
              <input
                type="number"
                min="0"
                value={numberingStart}
                onChange={(e) => setNumberingStart(Number(e.target.value))}
                className="w-14 text-center px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>Padding Digits:</span>
              <input
                type="number"
                min="1"
                max="6"
                value={numberingDigits}
                onChange={(e) => setNumberingDigits(Number(e.target.value))}
                className="w-12 text-center px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
              />
              <span className="text-zinc-400 font-mono">(e.g. 001)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Position:</span>
              <select
                value={numberingPosition}
                onChange={(e) => setNumberingPosition(e.target.value as "prefix" | "suffix")}
                className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
              >
                <option value="suffix">End of Name (photo_001)</option>
                <option value="prefix">Start of Name (001_photo)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Input List vs Before/After Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Textarea */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Original Filenames ({filenamesList.length} files)</span>
            <span className="text-[11px] text-zinc-400 font-normal">One per line</span>
          </div>
          <textarea
            rows={15}
            value={inputFiles}
            onChange={(e) => setInputFiles(e.target.value)}
            placeholder="Paste list of filenames here..."
            className="w-full p-3 font-mono text-xs rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Right: Live Rename Preview & Script Exporters */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Live Rename Comparison
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <CopyButton text={newNamesText} label="Copy Names" size="sm" variant="secondary" />
              <button
                type="button"
                onClick={handleDownloadCsv}
                title="Download CSV mapping"
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                CSV Map
              </button>
              <button
                type="button"
                onClick={handleDownloadSh}
                title="Download Bash script for macOS & Linux"
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>rename.sh</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadBat}
                title="Download Batch script for Windows"
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                rename.bat
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-auto max-h-[380px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 font-semibold text-zinc-500 text-[10px] uppercase">
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2">Original Filename</th>
                  <th className="px-2 py-2 w-6 text-center"></th>
                  <th className="px-3 py-2">New Target Filename</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 font-mono text-[11px]"
                  >
                    <td className="px-3 py-2 text-center text-zinc-400 text-[10px]">{idx + 1}</td>
                    <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]" title={m.oldName}>
                      {m.oldName}
                    </td>
                    <td className="px-2 py-2 text-center text-zinc-300">
                      <ArrowRight className="w-3 h-3 inline text-zinc-400" />
                    </td>
                    <td className="px-3 py-2 font-medium text-blue-600 dark:text-blue-400 truncate max-w-[220px]" title={m.newName}>
                      {m.newName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
