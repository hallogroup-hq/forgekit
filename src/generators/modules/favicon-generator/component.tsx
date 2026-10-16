"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Download,
  Copy,
  Check,
  Globe,
  Smartphone,
  Layers,
  Sparkles,
  FileCode,
  Archive,
} from "lucide-react";
import JSZip from "jszip";
import {
  FAVICON_SPECS,
  IconShape,
  createIcoFromPngBuffers,
  generateWebManifest,
  generateHtmlHeadSnippet,
} from "./engine";

const DEFAULT_LOGO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'><rect width='512' height='512' rx='115' fill='%2309090b'/><path d='M140 180 L372 180 L372 230 L220 230 L220 270 L340 270 L340 320 L220 320 L220 400 L140 400 Z' fill='%23fafafa'/></svg>";

export default function FaviconGenerator() {
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_LOGO);
  const [appName, setAppName] = useState("ForgeKit App");
  const [shortName, setShortName] = useState("ForgeKit");
  const [shape, setShape] = useState<IconShape>("rounded");
  const [bgColor, setBgColor] = useState("#09090b");
  const [isTransparent, setIsTransparent] = useState(false);
  const [paddingPercent, setPaddingPercent] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const renderIconToCanvas = useCallback(
    (width: number, height: number): Promise<HTMLCanvasElement> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(canvas);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.clearRect(0, 0, width, height);

          // Apply shape clipping
          ctx.save();
          ctx.beginPath();
          if (shape === "circle") {
            ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
          } else if (shape === "rounded") {
            const radius = Math.round(width * 0.22);
            ctx.roundRect(0, 0, width, height, radius);
          } else {
            ctx.rect(0, 0, width, height);
          }
          ctx.clip();

          // Background
          if (!isTransparent) {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);
          }

          // Inner image with padding
          const pad = Math.round((width * paddingPercent) / 100);
          const innerW = width - pad * 2;
          const innerH = height - pad * 2;
          ctx.drawImage(img, pad, pad, innerW, innerH);
          ctx.restore();

          resolve(canvas);
        };
        img.src = imageSrc;
      });
    },
    [imageSrc, shape, bgColor, isTransparent, paddingPercent]
  );

  const getCanvasPngBytes = (canvas: HTMLCanvasElement): Promise<Uint8Array> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(new Uint8Array(0));
        const reader = new FileReader();
        reader.onload = () => {
          resolve(new Uint8Array(reader.result as ArrayBuffer));
        };
        reader.readAsArrayBuffer(blob);
      }, "image/png");
    });
  };

  const handleDownloadZip = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();

      // Render all PNG sizes
      const pngBuffers: { width: number; height: number; bytes: Uint8Array; name: string }[] = [];

      for (const spec of FAVICON_SPECS) {
        const c = await renderIconToCanvas(spec.width, spec.height);
        const bytes = await getCanvasPngBytes(c);
        pngBuffers.push({ width: spec.width, height: spec.height, bytes, name: spec.name });
        zip.file(spec.name, bytes);
      }

      // Generate multi-resolution favicon.ico (16, 32, 48)
      const icoSources = pngBuffers
        .filter((b) => [16, 32, 48].includes(b.width))
        .map((b) => ({ width: b.width, height: b.height, pngData: b.bytes }));

      const icoBytes = createIcoFromPngBuffers(icoSources);
      zip.file("favicon.ico", icoBytes);

      // Webmanifest & HTML snippet
      const manifestStr = generateWebManifest(appName, shortName, bgColor, isTransparent ? "#ffffff" : bgColor);
      zip.file("site.webmanifest", manifestStr);

      const htmlSnippet = generateHtmlHeadSnippet();
      zip.file("html-tags.html", htmlSnippet);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `favicon-pack-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to generate zip", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSingle = async (width: number, height: number, filename: string) => {
    const c = await renderIconToCanvas(width, height);
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const handleCopyHtml = async () => {
    const html = generateHtmlHeadSnippet();
    await navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Favicon & App Icon Pack Builder
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Build multi-resolution favicon.ico, Apple touch icons, PWA manifests, and HTML tags in one package.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            <Upload size={14} />
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={handleCopyHtml}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            {copiedHtml ? <Check size={14} /> : <Copy size={14} />}
            {copiedHtml ? "Copied" : "Copy HTML"}
          </button>
          <button
            onClick={handleDownloadZip}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:opacity-90 transition shadow-sm"
          >
            <Archive size={14} />
            {isGenerating ? "Building ZIP..." : "Download Pack (.ZIP)"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="space-y-5 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
          {/* App Metadata */}
          <div className="space-y-2">
            <label className="font-medium text-zinc-900 dark:text-zinc-200 block">
              PWA Application Info
            </label>
            <div className="space-y-1.5">
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Full App Name"
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="Short Name"
                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Icon Shape */}
          <div>
            <label className="font-medium text-zinc-900 dark:text-zinc-200 block mb-1.5">
              Icon Silhouette
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: "rounded", label: "Squircle" },
                  { id: "circle", label: "Circle" },
                  { id: "square", label: "Square" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setShape(s.id)}
                  className={`py-1.5 rounded-lg border text-center transition ${
                    shape === s.id
                      ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-medium"
                      : "bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Fill */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-900 dark:text-zinc-200">
                Background Fill
              </label>
              <label className="flex items-center gap-1.5 text-zinc-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTransparent}
                  onChange={(e) => setIsTransparent(e.target.checked)}
                  className="rounded border-zinc-300 dark:border-zinc-700"
                />
                <span>Transparent</span>
              </label>
            </div>
            {!isTransparent && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}
          </div>

          {/* Inset / Padding Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-zinc-900 dark:text-zinc-200">
                Icon Inset Margin
              </label>
              <span className="text-zinc-500 font-mono">{paddingPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={paddingPercent}
              onChange={(e) => setPaddingPercent(Number(e.target.value))}
              className="w-full accent-zinc-900 dark:accent-zinc-100"
            />
          </div>

          {/* HTML Snippet preview */}
          <div>
            <label className="font-medium text-zinc-900 dark:text-zinc-200 block mb-1">
              Generated HTML Code
            </label>
            <pre className="p-2.5 rounded-lg bg-zinc-900 text-zinc-300 font-mono text-[11px] overflow-x-auto select-all">
              {generateHtmlHeadSnippet()}
            </pre>
          </div>
        </div>

        {/* Live Simulator Preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Simulated Browser Tab */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <Globe size={14} />
              <span>Simulated Browser Tab (favicon.ico / 16x16)</span>
            </div>
            <div className="bg-zinc-900 rounded-lg p-2.5 flex items-center gap-2 max-w-sm border border-zinc-800">
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  background: isTransparent ? "transparent" : bgColor,
                  borderRadius: shape === "circle" ? "50%" : shape === "rounded" ? "3px" : "0",
                  padding: `${paddingPercent * 0.16}px`,
                }}
                className="overflow-hidden flex items-center justify-center shrink-0"
              >
                <img src={imageSrc} alt="Tab icon" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs text-zinc-300 font-medium truncate">
                {appName} — Modern App
              </span>
            </div>
          </div>

          {/* Simulated iPhone Home Screen */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <Smartphone size={14} />
              <span>Simulated iOS Home Screen (apple-touch-icon / 180x180)</span>
            </div>
            <div className="bg-zinc-950 p-6 rounded-2xl flex items-center gap-6 border border-zinc-800">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    background: isTransparent ? "transparent" : bgColor,
                    borderRadius: "14px",
                    padding: `${(paddingPercent * 60) / 100}px`,
                  }}
                  className="overflow-hidden flex items-center justify-center shadow-lg border border-white/10"
                >
                  <img src={imageSrc} alt="iOS icon" className="w-full h-full object-contain" />
                </div>
                <span className="text-[11px] text-zinc-300 font-medium">{shortName}</span>
              </div>
            </div>
          </div>

          {/* Generated Assets Table */}
          <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                <Layers size={14} />
                <span>Generated File Inventory</span>
              </div>
              <span className="text-xs text-zinc-500">6 images + 2 manifests</span>
            </div>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {FAVICON_SPECS.map((spec) => (
                <div key={spec.name} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">
                      {spec.name}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      ({spec.width}×{spec.height}) • {spec.description}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownloadSingle(spec.width, spec.height, spec.name)}
                    className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
                    title="Download individual file"
                  >
                    <Download size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
