"use client";

import React, { useState, useMemo } from "react";
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight, FileSpreadsheet, Download, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type Alignment = "left" | "center" | "right";

export default function MarkdownTableGenerator() {
  const [headers, setHeaders] = useState<string[]>(["Feature", "Starter Tier", "Pro Workstation", "Status"]);
  const [alignments, setAlignments] = useState<Alignment[]>(["left", "center", "center", "right"]);
  const [rows, setRows] = useState<string[][]>([
    ["Client-Side Privacy", "Yes", "Yes (Unlimited)", "Active"],
    ["High-Res Export", "512px", "4096px Ultra", "Active"],
    ["Custom Presets", "3 slots", "Unlimited", "Active"],
    ["API Bridges", "Community", "Dedicated", "Beta"],
  ]);
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
      const cur = copy[colIdx];
      copy[colIdx] = cur === "left" ? "center" : cur === "center" ? "right" : "left";
      return copy;
    });
  };

  // Generate GitHub-flavored markdown table with aligned padding
  const markdownTable = useMemo(() => {
    const colWidths = headers.map((h, i) => {
      const maxRowLen = rows.reduce((max, r) => Math.max(max, (r[i] || "").length), 0);
      return Math.max(h.length, maxRowLen, 3);
    });

    const formatRow = (cells: string[]) => {
      const padded = cells.map((cell, i) => {
        const width = colWidths[i];
        const val = cell || "";
        const align = alignments[i];
        if (align === "right") return val.padStart(width, " ");
        if (align === "center") {
          const totalPad = width - val.length;
          const leftPad = Math.floor(totalPad / 2);
          const rightPad = totalPad - leftPad;
          return " ".repeat(leftPad) + val + " ".repeat(rightPad);
        }
        return val.padEnd(width, " ");
      });
      return `| ${padded.join(" | ")} |`;
    };

    const headerLine = formatRow(headers);
    const separatorLine = `| ${colWidths
      .map((w, i) => {
        const align = alignments[i];
        if (align === "center") return `:${"-".repeat(w - 2)}:`;
        if (align === "right") return `${"-".repeat(w - 1)}:`;
        return `:${"-".repeat(w - 1)}`;
      })
      .join(" | ")} |`;

    const bodyLines = rows.map(formatRow).join("\n");

    return `${headerLine}\n${separatorLine}\n${bodyLines}`;
  }, [headers, alignments, rows]);

  // Handle CSV import
  const handleImportCsv = () => {
    if (!csvInput.trim()) return;
    const lines = csvInput.trim().split("\n");
    if (lines.length === 0) return;

    const parsed = lines.map((l) => l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
    const newHeaders = parsed[0];
    const newRows = parsed.slice(1);

    if (newHeaders.length > 0) {
      setHeaders(newHeaders);
      setAlignments(new Array(newHeaders.length).fill("left"));
      setRows(newRows.length > 0 ? newRows : [new Array(newHeaders.length).fill("")]);
      setShowCsvModal(false);
      setCsvInput("");
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
    }
  };

  const handleDownload = () => {
    downloadFile(markdownTable, "table.md", "text/markdown");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
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
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500" />
            <span>Import CSV</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <CopyButton
            text={markdownTable}
            label="Copy Markdown Table"
            variant="primary"
            size="sm"
            triggerConfetti
          />
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      {/* CSV Import Drawer */}
      {showCsvModal && (
        <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-3">
          <label className="block text-xs font-semibold text-purple-900 dark:text-purple-300">
            Paste CSV Text to Convert
          </label>
          <textarea
            rows={3}
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder="Name, Role, Location&#10;Alice, Engineer, NYC&#10;Bob, Designer, SF"
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-zinc-900"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCsvModal(false)}
              className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleImportCsv}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white"
            >
              Import CSV
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
                <th key={cIdx} className="p-2 min-w-[140px]">
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
                      title={`Alignment: ${alignments[cIdx]}`}
                      className="p-1 text-zinc-400 hover:text-blue-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                    >
                      {alignments[cIdx] === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                      {alignments[cIdx] === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                      {alignments[cIdx] === "right" && <AlignRight className="w-3.5 h-3.5" />}
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
          <CopyButton text={markdownTable} label="Copy Raw Markdown" size="sm" variant="ghost" />
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
