"use client";

import React, { useState, useMemo, useCallback } from "react";
import { FileSpreadsheet, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

import {
  buildUtmUrl,
  buildUtmMatrix,
  exportMatrixToCsv,
  DEFAULT_CHANNELS,
} from "./engine";

interface UtmPreset {
  name: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
}

const PRESETS: UtmPreset[] = [
  { name: "Google Search Ads", source: "google", medium: "cpc", campaign: "q4-brand-search", term: "best-developer-tools" },
  { name: "Meta / Instagram Ads", source: "facebook", medium: "paid-social", campaign: "black-friday-early-access", content: "carousel-ad-v2" },
  { name: "Email Newsletter", source: "newsletter", medium: "email", campaign: "weekly-roundup-issue-42", content: "cta-hero-button" },
  { name: "LinkedIn Sponsored", source: "linkedin", medium: "paid-social", campaign: "b2b-engineering-leaders", content: "case-study-whitepaper" },
  { name: "Twitter / X Organic", source: "twitter", medium: "organic-social", campaign: "product-v2-launch", content: "thread-link" },
  { name: "Product Hunt Launch", source: "producthunt", medium: "referral", campaign: "launch-day-special" },
];

export default function UtmBuilderGenerator() {
  const [baseUrl, setBaseUrl] = useState("https://myapp.com/pricing");
  const [source, setSource] = useState("google");
  const [medium, setMedium] = useState("cpc");
  const [campaign, setCampaign] = useState("spring-sale-2026");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("hero-cta");
  const [autoLowercase, setAutoLowercase] = useState(true);

  const loadPreset = (p: UtmPreset) => {
    setSource(p.source);
    setMedium(p.medium);
    setCampaign(p.campaign);
    setContent(p.content || "");
    setTerm(p.term || "");
    confetti({ particleCount: 20, spread: 50, origin: { y: 0.8 } });
  };

  // Generate Single Tagged URL via pure engine
  const generatedResult = useMemo(() => {
    return buildUtmUrl(
      baseUrl,
      { source, medium, campaign, term, content },
      { autoLowercase }
    );
  }, [baseUrl, source, medium, campaign, term, content, autoLowercase]);

  const generatedUrl = generatedResult.url;

  // Generate Multi-Channel Campaign Matrix via pure engine
  const channelMatrix = useMemo(() => {
    return buildUtmMatrix(
      baseUrl,
      DEFAULT_CHANNELS,
      campaign,
      content,
      { autoLowercase }
    );
  }, [baseUrl, campaign, content, autoLowercase]);

  // CSV export
  const handleExportCsv = () => {
    const csv = exportMatrixToCsv(channelMatrix);
    downloadFile(csv, `utm-campaign-matrix-${Date.now()}.csv`, "text/csv");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Preset Chips */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Channel Campaign Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => loadPreset(p)}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs Form */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Destination URL (Required)
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com/landing"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                utm_source (Referrer)
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="google, newsletter, twitter"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                utm_medium (Marketing Medium)
              </label>
              <input
                type="text"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="cpc, email, banner"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              utm_campaign (Campaign Name)
            </label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="spring_sale, product_launch"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                utm_content (Ad / Variant)
              </label>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="sidebar_cta, video_ad_v1"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                utm_term (Paid Keyword)
              </label>
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="developer tools"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoLowercase}
                onChange={(e) => setAutoLowercase(e.target.checked)}
                className="rounded accent-zinc-900 dark:accent-zinc-100 text-zinc-900 dark:text-zinc-100 focus:ring-0"
              />
              <span>Auto-lowercase and hyphenate spaces (recommended for analytics)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        {/* Main Generated Link Box */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Active Tracking URL
            </span>
            <div className="flex items-center gap-2">
              <CopyButton text={generatedUrl} label="Copy Link" />
              <a
                href={generatedUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Test in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all select-all leading-relaxed">
            {generatedUrl}
          </div>
        </div>

        {/* Multi-Channel Matrix Grid */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Multi-Channel Campaign Matrix
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Pre-configured tracking links for all major ad and content platforms.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              Export CSV
            </button>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {channelMatrix.map((item) => (
              <div
                key={item.channel}
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {item.channel}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400">
                      ({item.source} / {item.medium})
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 select-all">
                    {item.url}
                  </div>
                </div>
                <CopyButton text={item.url} label="Copy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
