"use client";

import React, { useState, useMemo } from "react";
import { Download, Table, FileSpreadsheet, Sparkles, Filter, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import { cleanCsv, CsvCleanOptions } from "./engine";

const SAMPLE_DIRTY_CSV = `User ID , Full Name , Email Address , Status , Role 
 101 , Alice Walker , alice@example.com , Active , Admin 
 102 , Bob Miller , bob@example.com , Pending , Member 
 101 , Alice Walker , alice@example.com , Active , Admin 
 , , , , 
 103 , Charlie Davis , charlie@example.com , Active , Viewer 
 104 , "Diane, Senior Architect" , diane@example.com , Active , Lead 
 102 , Bob Miller , bob@example.com , Pending , Member `;

export default function CsvCleanerGenerator() {
  const [inputCsv, setInputCsv] = useState(SAMPLE_DIRTY_CSV);
  const [trimCells, setTrimCells] = useState(true);
  const [removeEmptyRows, setRemoveEmptyRows] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [headerFormat, setHeaderFormat] = useState<CsvCleanOptions["headerFormat"]>("snake_case");
  const [emptyValueReplacement, setEmptyValueReplacement] = useState("");
  const [outputDelimiter, setOutputDelimiter] = useState<"," | ";" | "\t">(",");
  const [activeTab, setActiveTab] = useState<"table" | "raw">("table");

  const cleanResult = useMemo(() => {
    return cleanCsv(inputCsv, {
      trimCells,
      removeEmptyRows,
      removeDuplicates,
      headerFormat,
      emptyValueReplacement,
      outputDelimiter,
    });
  }, [inputCsv, trimCells, removeEmptyRows, removeDuplicates, headerFormat, emptyValueReplacement, outputDelimiter]);

  const handleDownload = () => {
    downloadFile(cleanResult.outputCsv, "cleaned-data.csv", "text/csv");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  const handleLoadSample = () => {
    setInputCsv(SAMPLE_DIRTY_CSV);
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration & Operations Toolbar */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Cleaning Rules:</span>

            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={trimCells}
                onChange={(e) => setTrimCells(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Trim Whitespace</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={removeEmptyRows}
                onChange={(e) => setRemoveEmptyRows(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Drop Empty Rows</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Deduplicate Records</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Sample</span>
            </button>
          </div>
        </div>

        {/* Casing & Delimiters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-zinc-500 text-[11px] mb-1 font-medium">Header Casing</label>
            <select
              value={headerFormat}
              onChange={(e) => setHeaderFormat(e.target.value as CsvCleanOptions["headerFormat"])}
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            >
              <option value="original">Preserve Original Headers</option>
              <option value="snake_case">Convert to snake_case</option>
              <option value="kebab_case">Convert to kebab-case</option>
              <option value="lowercase">Convert to lowercase</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-500 text-[11px] mb-1 font-medium">Output Delimiter</label>
            <select
              value={outputDelimiter}
              onChange={(e) => setOutputDelimiter(e.target.value as "," | ";" | "\t")}
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            >
              <option value=",">Standard Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="&#9;">Tab-Separated (\t)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-500 text-[11px] mb-1 font-medium">Fill Empty Cells (Optional)</label>
            <input
              type="text"
              value={emptyValueReplacement}
              onChange={(e) => setEmptyValueReplacement(e.target.value)}
              placeholder="e.g. N/A or leave empty"
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>
      </div>

      {/* Hygiene Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Input Rows</div>
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">
            {cleanResult.stats.initialRowCount}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Clean Rows</div>
          <div className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
            {cleanResult.stats.finalRowCount}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Duplicates Dropped</div>
          <div className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
            {cleanResult.stats.duplicatesRemoved}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Empty Rows Removed</div>
          <div className="text-base font-bold text-rose-500 font-mono mt-0.5">
            {cleanResult.stats.emptyRowsRemoved}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center col-span-2 sm:col-span-1">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Format Detected</div>
          <div className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono mt-0.5">
            {cleanResult.stats.detectedDelimiter === "\t" ? "TSV (Tab)" : cleanResult.stats.detectedDelimiter === ";" ? "Semicolon" : "CSV (Comma)"}
          </div>
        </div>
      </div>

      {/* Editor & Output Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input (Left) */}
        <div className="lg:col-span-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Raw CSV / TSV Input</span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {inputCsv.length} chars
            </span>
          </div>
          <textarea
            rows={14}
            value={inputCsv}
            onChange={(e) => setInputCsv(e.target.value)}
            placeholder="Paste your unformatted CSV here..."
            className="w-full p-3 font-mono text-xs rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Output (Right) */}
        <div className="lg:col-span-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab("table")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === "table"
                    ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === "raw"
                    ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Raw Clean CSV</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <CopyButton
                text={cleanResult.outputCsv}
                label="Copy Clean CSV"
                size="sm"
                variant="secondary"
                triggerConfetti
              />
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .csv</span>
              </button>
            </div>
          </div>

          {activeTab === "table" ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-auto max-h-[350px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 sticky top-0">
                    {cleanResult.rows[0]?.map((header, i) => (
                      <th key={i} className="px-3 py-2 font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cleanResult.rows.slice(1).map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 font-mono text-[11px]"
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <textarea
              readOnly
              rows={14}
              value={cleanResult.outputCsv}
              className="w-full p-3 font-mono text-xs rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  );
}
