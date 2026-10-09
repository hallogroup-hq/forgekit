"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  RotateCcw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Filter,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  auditUrlBatch,
  exportQaReportToCsv,
  QaSeverity,
} from "./engine";

const SAMPLE_BATCH = `https://myapp.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=q4-brand-search
https://myapp.com/signup?utm_source=Facebook&utm_medium=paid-social&utm_campaign=Launch-Early-Bird
https://myapp.com/blog/v2-announcement?utm_source=newsletter
https://myapp.com/store?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_source=google_ads
https://myapp.com/whitepaper?utm_source=linkedin&utm_medium=sponsored-content&utm_campaign=enterprise-2026
https://myapp.com/partner?utm_source=affiliate&utm_medium=partner-referral&utm_campaign=influencer-deal`;

export default function CampaignUrlQaGenerator() {
  const [inputText, setInputText] = useState(SAMPLE_BATCH);
  const [filterStatus, setFilterStatus] = useState<"all" | QaSeverity>("all");

  const summary = useMemo(() => {
    return auditUrlBatch(inputText);
  }, [inputText]);

  const filteredItems = useMemo(() => {
    if (filterStatus === "all") return summary.items;
    return summary.items.filter((i) => i.status === filterStatus);
  }, [summary.items, filterStatus]);

  const fixedUrlsText = useMemo(() => {
    return summary.items.map((i) => i.normalizedUrl).join("\n");
  }, [summary.items]);

  const handleDownloadCsv = () => {
    const csv = exportQaReportToCsv(summary.items);
    downloadFile(csv, `utm-qa-report-${Date.now()}.csv`, "text/csv");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  const handleReset = () => {
    setInputText(SAMPLE_BATCH);
  };

  return (
    <div className="space-y-8">
      {/* Top Health Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Overall Health Score Card */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Batch Health Score
          </span>
          <div className="flex items-baseline gap-2 my-2">
            <span
              className={`text-3xl font-black ${
                summary.healthScorePercent >= 90
                  ? "text-emerald-500"
                  : summary.healthScorePercent >= 70
                  ? "text-amber-500"
                  : "text-rose-500"
              }`}
            >
              {summary.healthScorePercent}%
            </span>
            <span className="text-xs text-zinc-400">clean</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                summary.healthScorePercent >= 90
                  ? "bg-emerald-500"
                  : summary.healthScorePercent >= 70
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${summary.healthScorePercent}%` }}
            />
          </div>
        </div>

        {/* Total URLs */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Audited Links
          </span>
          <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 my-1">
            {summary.total}
          </span>
          <span className="text-[11px] text-zinc-400">Pasted in batch</span>
        </div>

        {/* Valid Count */}
        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 flex flex-col justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Valid
          </span>
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 my-1">
            {summary.validCount}
          </span>
          <span className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
            Passes all standards
          </span>
        </div>

        {/* Warning Count */}
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col justify-between">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Warnings
          </span>
          <span className="text-3xl font-bold text-amber-600 dark:text-amber-400 my-1">
            {summary.warningCount}
          </span>
          <span className="text-[11px] text-amber-600/70 dark:text-amber-400/70">
            Uppercase / non-standard
          </span>
        </div>

        {/* Error Count */}
        <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 flex flex-col justify-between">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
            Errors
          </span>
          <span className="text-3xl font-bold text-rose-600 dark:text-rose-400 my-1">
            {summary.errorCount}
          </span>
          <span className="text-[11px] text-rose-600/70 dark:text-rose-400/70">
            Missing UTMs / duplicates
          </span>
        </div>
      </div>

      {/* Input Batch Section */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
              Pasted URLs (One per line)
            </label>
            <p className="text-xs text-zinc-400 mt-0.5">
              Copy an entire column from Google Sheets, Excel, or CSV and paste below.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Sample
          </button>
        </div>

        <textarea
          rows={6}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste URLs here..."
          className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Filter:
            </span>
            {(["all", "error", "warning", "valid"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize border transition-colors ${
                  filterStatus === st
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                {st === "all" ? `All (${summary.total})` : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={fixedUrlsText}
              label="Copy All Auto-Fixed URLs"
              size="sm"
            />
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detailed QA Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            QA Findings ({filteredItems.length} items)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 font-semibold">
              <tr>
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4">Original URL & Tracking Tags</th>
                <th className="py-3 px-4">Issues Detected</th>
                <th className="py-3 px-4 w-40">Clean Candidate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-850/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-zinc-400">{item.id}</td>
                  <td className="py-3.5 px-4">
                    {item.status === "valid" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-[10px] uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        Valid
                      </span>
                    )}
                    {item.status === "warning" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold text-[10px] uppercase">
                        <AlertTriangle className="w-3 h-3" />
                        Warning
                      </span>
                    )}
                    {item.status === "error" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold text-[10px] uppercase">
                        <XCircle className="w-3 h-3" />
                        Error
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 max-w-md">
                    <p className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate select-all" title={item.originalUrl}>
                      {item.originalUrl}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                      {item.utm.source && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          src: {item.utm.source}
                        </span>
                      )}
                      {item.utm.medium && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          med: {item.utm.medium}
                        </span>
                      )}
                      {item.utm.campaign && (
                        <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          cmp: {item.utm.campaign}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    {item.issues.length === 0 ? (
                      <span className="text-zinc-400 text-[11px]">No issues detected</span>
                    ) : (
                      <ul className="space-y-1">
                        {item.issues.map((issue, idx) => (
                          <li
                            key={idx}
                            className={`text-[11px] flex items-start gap-1 ${
                              issue.severity === "error"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            <span>•</span>
                            <span>{issue.message}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <CopyButton
                        text={item.normalizedUrl}
                        label="Copy Clean"
                        size="sm"
                        variant="ghost"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
