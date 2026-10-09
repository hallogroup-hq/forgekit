"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Download,
  Table,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  FileText,
  Trash2,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile, formatFileSize } from "@/lib/utils";
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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [trimCells, setTrimCells] = useState(true);
  const [removeEmptyRows, setRemoveEmptyRows] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [headerFormat, setHeaderFormat] = useState<CsvCleanOptions["headerFormat"]>("snake_case");
  const [emptyValueReplacement, setEmptyValueReplacement] = useState("");
  const [outputDelimiter, setOutputDelimiter] = useState<"," | ";" | "\t">(",");
  const [activeTab, setActiveTab] = useState<"table" | "raw">("table");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanResult = useMemo(() => {
    return cleanCsv(inputCsv, {
      trimCells,
      removeEmptyRows,
      removeDuplicates,
      headerFormat,
      emptyValueReplacement,
      outputDelimiter,
    });
  }, [
    inputCsv,
    trimCells,
    removeEmptyRows,
    removeDuplicates,
    headerFormat,
    emptyValueReplacement,
    outputDelimiter,
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setUploadedFileSize(file.size);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setInputCsv(content);
          confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearFile = () => {
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setInputCsv(SAMPLE_DIRTY_CSV);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = () => {
    const filename = uploadedFileName
      ? uploadedFileName.replace(/\.csv$/i, "-cleaned.csv")
      : "cleaned-data.csv";
    downloadFile(cleanResult.outputCsv, filename, "text/csv");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  const handleLoadSample = () => {
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setInputCsv(SAMPLE_DIRTY_CSV);
  };

  return (
    <div className="space-y-6">
      {/* File Upload Banner */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              CSV Data Source
            </span>
            {uploadedFileName && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                📄 {uploadedFileName} ({uploadedFileSize ? formatFileSize(uploadedFileSize) : ""})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {uploadedFileName ? (
              <button
                type="button"
                onClick={handleClearFile}
                className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove File</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to Dirty Sample</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain,text/tab-separated-values"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-file-upload-input"
          />
          <label
            htmlFor="csv-file-upload-input"
            className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-colors text-center"
          >
            <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {uploadedFileName ? "Replace CSV File" : "Upload Local .CSV File"}
              </div>
              <div className="text-[11px] text-zinc-500">
                Drag and drop or browse from your device. Cleaned locally in your browser.
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Top Configuration & Operations Toolbar */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4 flex-wrap text-xs">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">Cleaning Rules:</span>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={trimCells}
                onChange={(e) => setTrimCells(e.target.checked)}
                className="rounded text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500 w-4 h-4"
              />
              <span className="font-medium">Trim Whitespace</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={removeEmptyRows}
                onChange={(e) => setRemoveEmptyRows(e.target.checked)}
                className="rounded text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500 w-4 h-4"
              />
              <span className="font-medium">Drop Empty Rows</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
                className="rounded text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500 w-4 h-4"
              />
              <span className="font-medium">Deduplicate Records</span>
            </label>
          </div>
        </div>

        {/* Casing & Delimiters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">Header Casing</label>
            <select
              value={headerFormat}
              onChange={(e) => setHeaderFormat(e.target.value as CsvCleanOptions["headerFormat"])}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            >
              <option value="original">Preserve Original Headers</option>
              <option value="snake_case">Convert to snake_case</option>
              <option value="kebab_case">Convert to kebab-case</option>
              <option value="lowercase">Convert to lowercase</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">Output Delimiter</label>
            <select
              value={outputDelimiter}
              onChange={(e) => setOutputDelimiter(e.target.value as "," | ";" | "\t")}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            >
              <option value=",">Standard Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="&#9;">Tab-Separated (\t)</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">Fill Empty Cells (Optional)</label>
            <input
              type="text"
              value={emptyValueReplacement}
              onChange={(e) => setEmptyValueReplacement(e.target.value)}
              placeholder="e.g. N/A or leave empty"
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>
      </div>

      {/* Hygiene Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center shadow-xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Input Rows</div>
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">
            {cleanResult.stats.initialRowCount}
          </div>
        </div>
        <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center shadow-xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Clean Rows</div>
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">
            {cleanResult.stats.finalRowCount}
          </div>
        </div>
        <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center shadow-xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Duplicates Dropped</div>
          <div className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
            {cleanResult.stats.duplicatesRemoved}
          </div>
        </div>
        <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center shadow-xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Empty Rows Removed</div>
          <div className="text-base font-bold text-rose-500 font-mono mt-0.5">
            {cleanResult.stats.emptyRowsRemoved}
          </div>
        </div>
        <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center col-span-2 sm:col-span-1 shadow-xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">Format Detected</div>
          <div className="text-base font-bold text-zinc-800 dark:text-zinc-200 font-mono mt-0.5">
            {cleanResult.stats.detectedDelimiter === "\t"
              ? "TSV (Tab)"
              : cleanResult.stats.detectedDelimiter === ";"
              ? "Semicolon"
              : "CSV (Comma)"}
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
            onChange={(e) => {
              setInputCsv(e.target.value);
              setUploadedFileName(null);
            }}
            placeholder="Paste your unformatted CSV here..."
            className="w-full p-3 font-mono text-xs rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        {/* Output (Right) */}
        <div className="lg:col-span-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("table")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTab === "table"
                    ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all ${
                  activeTab === "raw"
                    ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-xs"
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .csv</span>
              </button>
            </div>
          </div>

          {activeTab === "table" ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-auto max-h-[350px] shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 sticky top-0">
                    {cleanResult.rows[0]?.map((header, i) => (
                      <th key={i} className="px-3 py-2.5 font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
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
