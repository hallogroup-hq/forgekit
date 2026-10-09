"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FileSpreadsheet,
  Download,
  FileText,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  TableAlignment,
  parseDelimitedTextToGrid,
  generateMarkdownTable,
  exportGridToCsv,
} from "./engine";

const PRESETS = [
  {
    name: "Feature Matrix",
    headers: ["Feature", "Starter Tier", "Pro Workstation", "Status"],
    alignments: ["left" as const, "center" as const, "center" as const, "right" as const],
    rows: [
      ["Client-Side Privacy", "Yes", "Yes (Unlimited)", "Active"],
      ["High-Res Export", "512px", "4096px Ultra", "Active"],
      ["Custom Presets", "3 slots", "Unlimited", "Active"],
      ["API Bridges", "Community", "Dedicated", "Beta"],
    ],
  },
  {
    name: "API Endpoints",
    headers: ["Method", "Endpoint", "Auth", "Description"],
    alignments: ["left" as const, "left" as const, "center" as const, "left" as const],
    rows: [
      ["GET", "/api/v1/projects", "Bearer", "List active user projects"],
      ["POST", "/api/v1/projects", "Bearer", "Create new workspace project"],
      ["DELETE", "/api/v1/projects/:id", "Bearer", "Archive project by ID"],
    ],
  },
  {
    name: "Comparison Table",
    headers: ["Criterion", "Option A", "Option B", "Winner"],
    alignments: ["left" as const, "left" as const, "left" as const, "center" as const],
    rows: [
      ["Setup Complexity", "Zero config", "Requires CLI install", "Option A"],
      ["Runtime Speed", "Native Rust (0.4ms)", "V8 Node (12ms)", "Option A"],
      ["Ecosystem Plugins", "Growing (150+)", "Mature (3,000+)", "Option B"],
    ],
  },
];

export default function MarkdownTableGenerator() {
  const [headers, setHeaders] = useState<string[]>(PRESETS[0].headers);
  const [alignments, setAlignments] = useState<TableAlignment[]>(PRESETS[0].alignments);
  const [rows, setRows] = useState<string[][]>(PRESETS[0].rows);

  const [csvInput, setCsvInput] = useState("");
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Add column
  const addColumn = () => {
    setHeaders((prev) => [...prev, `Column ${prev.length + 1}`]);
    setAlignments((prev) => [...prev, "left"]);
    setRows((prev) => prev.map((r) => [...r, "Data"]));
  };

  // Remove column
  const removeColumn = (colIdx: number) => {
    if (headers.length <= 1) return;
    setHeaders((prev) => prev.filter((_, i) => i !== colIdx));
    setAlignments((prev) => prev.filter((_, i) => i !== colIdx));
    setRows((prev) => prev.map((r) => r.filter((_, i) => i !== colIdx)));
  };

  // Add row
  const addRow = () => {
    setRows((prev) => [...prev, new Array(headers.length).fill("Data")]);
  };

  // Remove row
  const removeRow = (rowIdx: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== rowIdx));
  };

  // Toggle alignment
  const toggleAlignment = (colIdx: number) => {
    setAlignments((prev) => {
      const copy = [...prev];
      const cur = copy[colIdx] || "left";
      copy[colIdx] = cur === "left" ? "center" : cur === "center" ? "right" : "left";
      return copy;
    });
  };

  // Apply preset
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setHeaders(preset.headers);
    setAlignments(preset.alignments);
    setRows(preset.rows);
  };

  // Generate GitHub-flavored markdown table via engine
  const markdownTable = useMemo(() => {
    return generateMarkdownTable(headers, alignments, rows);
  }, [headers, alignments, rows]);

  // Handle CSV/TSV import via engine
  const handleImportCsv = () => {
    if (!csvInput.trim()) return;
    const parsed = parseDelimitedTextToGrid(csvInput);
    if (parsed.headers.length > 0) {
      setHeaders(parsed.headers);
      setAlignments(parsed.alignments);
      setRows(parsed.rows);
      setShowCsvModal(false);
      setCsvInput("");
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
    }
  };

  const handleDownloadMd = () => {
    downloadFile(markdownTable, "table.md", "text/markdown");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  const handleDownloadCsv = () => {
    const csvContent = exportGridToCsv(headers, rows);
    downloadFile(csvContent, "table.csv", "text/csv");
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            <span>Add Row</span>
          </button>
          <button
            type="button"
            onClick={addColumn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span>Add Column</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCsvModal((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Import CSV/TSV</span>
          </button>

          {/* Quick Presets Dropdown/Pills */}
          <div className="hidden md:flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-2">
            <span className="text-[11px] text-zinc-400 mr-1">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="px-2 py-1 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton
            text={markdownTable}
            label="Copy Markdown"
            variant="primary"
            size="sm"
            triggerConfetti
          />
          <button
            type="button"
            onClick={handleDownloadMd}
            title="Download .md file"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>.md</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            title="Export CSV file"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.csv</span>
          </button>
        </div>
      </div>

      {/* CSV Import Modal / Drawer */}
      {showCsvModal && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Paste CSV or TSV (Tab-separated) Data
            </label>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Supports quoted fields and auto-detects delimiter
            </span>
          </div>
          <textarea
            rows={4}
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder={'Feature,"Starter Tier","Pro Tier",Status\n"Privacy Shield",Yes,Yes,Active\n"Max Export",512px,4096px,Active'}
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCsvModal(false)}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleImportCsv}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 transition-colors cursor-pointer"
            >
              Parse & Load Grid
            </button>
          </div>
        </div>
      )}

      {/* Visual Table Editor Grid */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto bg-white dark:bg-zinc-950">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
              <th className="p-2 w-10 text-center font-mono text-zinc-400 text-[10px]">#</th>
              {headers.map((header, cIdx) => (
                <th key={cIdx} className="p-2 min-w-[150px]">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => {
                        const copy = [...headers];
                        copy[cIdx] = e.target.value;
                        setHeaders(copy);
                      }}
                      className="w-full px-2 py-1 text-xs font-semibold rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => toggleAlignment(cIdx)}
                      title={`Alignment: ${alignments[cIdx] || "left"} (click to toggle)`}
                      className="p-1 text-zinc-400 hover:text-blue-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                    >
                      {alignments[cIdx] === "center" ? (
                        <AlignCenter className="w-3.5 h-3.5 text-blue-500" />
                      ) : alignments[cIdx] === "right" ? (
                        <AlignRight className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <AlignLeft className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeColumn(cIdx)}
                      disabled={headers.length <= 1}
                      className="p-1 text-zinc-400 hover:text-rose-500 disabled:opacity-20 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
              >
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(rIdx)}
                    disabled={rows.length <= 1}
                    className="p-1 text-zinc-300 hover:text-rose-500 disabled:opacity-20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => {
                        const copy = [...rows];
                        copy[rIdx][cIdx] = e.target.value;
                        setRows(copy);
                      }}
                      className="w-full px-2 py-1 text-xs rounded border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-blue-500 bg-transparent text-zinc-800 dark:text-zinc-200"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Real-time Formatted Markdown Output */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <span className="text-xs font-mono text-zinc-500">Live Markdown Preview</span>
          <CopyButton text={markdownTable} label="Copy Markdown" size="sm" variant="ghost" />
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre">
            {markdownTable}
          </pre>
        </div>
      </div>
    </div>
  );
}
