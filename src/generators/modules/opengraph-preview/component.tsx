"use client";

import React, { useState, useMemo } from "react";
import { Globe, Share2 } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";

function TwitterIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function OpenGraphPreviewGenerator() {
  const [title, setTitle] = useState("ForgeKit — The Ultimate Workstation of Modern Generators");
  const [description, setDescription] = useState("Instant client-side generators for developers, designers, and creators. QR codes, design specs, dummy data, CSS glass, and productivity tools.");
  const [url, setUrl] = useState("https://forgekit.dev");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80");
  const [siteName, setSiteName] = useState("ForgeKit");
  const [twitterHandle, setTwitterHandle] = useState("@forgekit_app");
  const [previewPlatform, setPreviewPlatform] = useState<"google" | "twitter" | "linkedin">("twitter");

  const cleanDomain = useMemo(() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "example.com";
    }
  }, [url]);

  const htmlMetaTags = useMemo(() => {
    return `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}">
<meta name="description" content="${description}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="${siteName}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${imageUrl}">

<!-- Twitter / X -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${url}">
<meta property="twitter:title" content="${title}">
<meta property="twitter:description" content="${description}">
<meta property="twitter:image" content="${imageUrl}">
<meta name="twitter:creator" content="${twitterHandle}">`;
  }, [title, description, url, siteName, imageUrl, twitterHandle]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Config Form (Left) */}
      <div className="lg:col-span-5 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          SEO & Social Metadata
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              <span>Page Title</span>
              <span className={`text-[10px] ${title.length > 60 ? "text-amber-500 font-semibold" : "text-zinc-400"}`}>
                {title.length}/60 chars
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              <span>Meta Description</span>
              <span className={`text-[10px] ${description.length > 160 ? "text-amber-500 font-semibold" : "text-zinc-400"}`}>
                {description.length}/160 chars
              </span>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Canonical URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Social Image URL (1200x630px recommended)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Twitter / X Handle
            </label>
            <input
              type="text"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>
        </div>
      </div>

      {/* Live Preview (Right) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Platform Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          {[
            { id: "twitter", label: "Twitter / X Card", icon: TwitterIcon },
            { id: "linkedin", label: "LinkedIn / Social", icon: Share2 },
            { id: "google", label: "Google SERP", icon: Globe },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isCurrent = previewPlatform === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPreviewPlatform(tab.id as "google" | "twitter" | "linkedin")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  isCurrent
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Preview Cards */}
        <div className="p-6 rounded-2xl bg-zinc-100/60 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center min-h-[280px]">
          {previewPlatform === "twitter" && (
            <div className="w-full max-w-md bg-black text-white rounded-2xl overflow-hidden border border-zinc-800 shadow-md">
              <div className="h-44 w-full bg-zinc-800 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Card preview" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] text-white/90">
                  {cleanDomain}
                </div>
              </div>
              <div className="p-3.5 space-y-1">
                <div className="font-bold text-sm leading-snug line-clamp-1">{title}</div>
                <div className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{description}</div>
              </div>
            </div>
          )}

          {previewPlatform === "linkedin" && (
            <div className="w-full max-w-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md">
              <div className="h-44 w-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="LinkedIn preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 space-y-0.5 border-t border-zinc-200 dark:border-zinc-800">
                <div className="font-semibold text-xs leading-snug line-clamp-1">{title}</div>
                <div className="text-[10px] text-zinc-400">{cleanDomain}</div>
              </div>
            </div>
          )}

          {previewPlatform === "google" && (
            <div className="w-full max-w-md p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-1 text-left font-sans">
              <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                  G
                </div>
                <span className="truncate">{url}</span>
              </div>
              <div className="text-blue-600 dark:text-blue-400 font-medium text-base hover:underline cursor-pointer leading-tight">
                {title}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed pt-0.5">
                {description}
              </div>
            </div>
          )}
        </div>

        {/* HTML Meta Tag Code */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <span className="text-xs font-mono text-zinc-500">HTML &lt;head&gt; Tags</span>
            <CopyButton
              text={htmlMetaTags}
              label="Copy Meta Tags"
              size="sm"
              variant="secondary"
              triggerConfetti
            />
          </div>
          <div className="p-4 max-h-[160px] overflow-y-auto">
            <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre">
              {htmlMetaTags}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
