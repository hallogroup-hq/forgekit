"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Smartphone,
  Laptop,
  Globe,
  Sliders,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  DeviceType,
  BackgroundPreset,
  ShadowStyle,
  MockupConfig,
  DEVICE_SPECS,
  BACKGROUND_PRESETS,
  SHADOW_PRESETS,
  getDefaultMockupConfig,
} from "./engine";

const DEMO_PLACEHOLDER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'><rect width='100%25' height='100%25' fill='%2318181b'/><circle cx='400' cy='220' r='50' fill='%2327272a'/><path d='M380 220 L420 220 M400 200 L400 240' stroke='%2371717a' stroke-width='4' stroke-linecap='round'/><text x='400' y='320' font-family='system-ui, sans-serif' font-size='20' font-weight='500' fill='%23a1a1aa' text-anchor='middle'>Drop or paste your screenshot here</text><text x='400' y='350' font-family='system-ui, sans-serif' font-size='14' fill='%2352525b' text-anchor='middle'>Supports PNG, JPG, WebP</text></svg>";

export default function DeviceMockupStudio() {
  const [config, setConfig] = useState<MockupConfig>(getDefaultMockupConfig());
  const [imageSrc, setImageSrc] = useState<string>(DEMO_PLACEHOLDER);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setImageSrc(event.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const exportCanvasBlob = useCallback(
    async (scale: number = 2): Promise<Blob | null> => {
      return new Promise((resolve) => {
        const spec = DEVICE_SPECS[config.device];
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          let extraHeight = 0;
          if (config.device === "macbook") extraHeight = 44;
          if (config.device === "browser") extraHeight = 38;

          const devW = spec.screenWidth;
          const devH = spec.screenHeight + extraHeight;

          canvas.width = Math.round((devW + config.padding * 2) * scale);
          canvas.height = Math.round((devH + config.padding * 2) * scale);

          ctx.scale(scale, scale);

          // Draw background
          if (config.background === "zinc-gradient") {
            const grad = ctx.createLinearGradient(0, 0, devW + config.padding * 2, devH + config.padding * 2);
            grad.addColorStop(0, "#18181b");
            grad.addColorStop(1, "#09090b");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, devW + config.padding * 2, devH + config.padding * 2);
          } else if (config.background === "slate-gradient") {
            const grad = ctx.createLinearGradient(0, 0, devW + config.padding * 2, devH + config.padding * 2);
            grad.addColorStop(0, "#1e293b");
            grad.addColorStop(1, "#0f172a");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, devW + config.padding * 2, devH + config.padding * 2);
          } else if (config.background === "dark-radial") {
            const grad = ctx.createRadialGradient(
              (devW + config.padding * 2) / 2,
              (devH + config.padding * 2) * 0.4,
              20,
              (devW + config.padding * 2) / 2,
              (devH + config.padding * 2) / 2,
              devW
            );
            grad.addColorStop(0, "#27272a");
            grad.addColorStop(1, "#09090b");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, devW + config.padding * 2, devH + config.padding * 2);
          } else if (config.background === "pearl-soft") {
            const grad = ctx.createLinearGradient(0, 0, devW + config.padding * 2, devH + config.padding * 2);
            grad.addColorStop(0, "#f4f4f5");
            grad.addColorStop(1, "#e4e4e7");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, devW + config.padding * 2, devH + config.padding * 2);
          } else if (config.background === "pure-black") {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, devW + config.padding * 2, devH + config.padding * 2);
          } else if (config.background === "pure-white") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, devW + config.padding * 2, devH + config.padding * 2);
          }

          // Device positioning
          const x = config.padding;
          const y = config.padding;

          // Shadow
          if (config.shadow === "deep") {
            ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
            ctx.shadowBlur = 40;
            ctx.shadowOffsetY = 20;
          } else if (config.shadow === "subtle") {
            ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;
          } else if (config.shadow === "crisp") {
            ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 16;
          }

          // Helper for safe roundRect
          const safeRoundRect = (
            rx: number,
            ry: number,
            rw: number,
            rh: number,
            radii: number | number[]
          ) => {
            if (typeof ctx.roundRect === "function") {
              ctx.roundRect(rx, ry, rw, rh, radii);
            } else {
              const rad = typeof radii === "number" ? radii : radii[0] || 0;
              ctx.rect(rx, ry, rw, rh);
            }
          };

          // Device outline shape
          ctx.beginPath();
          safeRoundRect(x, y, devW, devH, spec.borderRadius);
          ctx.fillStyle = config.deviceColor === "dark" ? "#18181b" : "#e4e4e7";
          ctx.fill();

          // Reset shadow for content inside
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          // Header for browser or macbook
          let screenOffsetY = y;
          if (config.device === "browser") {
            screenOffsetY += 38;
            // Draw browser chrome
            ctx.fillStyle = config.deviceColor === "dark" ? "#27272a" : "#f4f4f5";
            ctx.beginPath();
            safeRoundRect(x, y, devW, 38, [spec.borderRadius, spec.borderRadius, 0, 0]);
            ctx.fill();

            // Traffic light buttons
            ctx.fillStyle = "#71717a";
            ctx.beginPath();
            ctx.arc(x + 18, y + 19, 5, 0, Math.PI * 2);
            ctx.arc(x + 34, y + 19, 5, 0, Math.PI * 2);
            ctx.arc(x + 50, y + 19, 5, 0, Math.PI * 2);
            ctx.fill();

            // Address bar pill
            if (config.showAddressBar) {
              ctx.fillStyle = config.deviceColor === "dark" ? "#18181b" : "#ffffff";
              ctx.beginPath();
              safeRoundRect(x + 75, y + 8, devW - 150, 22, 6);
              ctx.fill();

              ctx.font = "11px system-ui, sans-serif";
              ctx.fillStyle = "#a1a1aa";
              ctx.textAlign = "center";
              ctx.fillText(config.browserUrl || "https://forgekit.dev", x + devW / 2, y + 23);
            }
          }

          // Draw the screenshot clipped into device screen
          ctx.save();
          ctx.beginPath();
          if (config.device === "browser") {
            safeRoundRect(x, screenOffsetY, devW, spec.screenHeight, [0, 0, spec.borderRadius, spec.borderRadius]);
          } else {
            safeRoundRect(x + 4, y + 4, devW - 8, devH - 8, Math.max(4, spec.borderRadius - 4));
          }
          ctx.clip();

          // Aspect-ratio cover to prevent image stretching
          const targetW = devW;
          const targetH = spec.screenHeight;
          const imgAspect = img.width / img.height;
          const targetAspect = targetW / targetH;
          let drawW = targetW;
          let drawH = targetH;
          let drawX = x;
          let drawY = screenOffsetY;

          if (imgAspect > targetAspect) {
            drawH = targetH;
            drawW = targetH * imgAspect;
            drawX = x + (targetW - drawW) / 2;
          } else {
            drawW = targetW;
            drawH = targetW / imgAspect;
            drawY = screenOffsetY; // align top
          }

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.restore();

          // Dynamic Island for iPhone
          if (config.device === "iphone") {
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            safeRoundRect(x + devW / 2 - 45, y + 12, 90, 24, 12);
            ctx.fill();
          }

          canvas.toBlob((blob) => resolve(blob), "image/png");
        };
        img.src = imageSrc;
      });
    },
    [config, imageSrc]
  );

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const blob = await exportCanvasBlob(2);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mockup-${config.device}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    setIsExporting(true);
    try {
      const blob = await exportCanvasBlob(2);
      if (!blob) return;
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const activeBg = BACKGROUND_PRESETS.find((b) => b.id === config.background)?.css || "#09090b";

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Device Mockup Studio
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Frame product screenshots inside responsive hardware silhouettes with 4K export.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            <Upload size={14} />
            Replace Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={handleCopyClipboard}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy PNG"}
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:opacity-90 transition shadow-sm"
          >
            <Download size={14} />
            Download 2x PNG
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-5 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
          {/* Device Frame */}
          <div>
            <label className="font-medium text-zinc-900 dark:text-zinc-200 block mb-2">
              Device Frame
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: "browser", label: "Browser", icon: Globe },
                  { id: "macbook", label: "MacBook", icon: Laptop },
                  { id: "iphone", label: "iPhone", icon: Smartphone },
                  { id: "android", label: "Android", icon: Smartphone },
                  { id: "clay", label: "Minimal Clay", icon: Sliders },
                ] as const
              ).map((dev) => {
                const IconComponent = dev.icon;
                const active = config.device === dev.id;
                return (
                  <button
                    key={dev.id}
                    onClick={() => setConfig((prev) => ({ ...prev, device: dev.id }))}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition ${
                      active
                        ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-medium"
                        : "bg-white dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    <IconComponent size={14} />
                    <span>{dev.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Preset */}
          <div>
            <label className="font-medium text-zinc-900 dark:text-zinc-200 block mb-2">
              Backdrop Style
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {BACKGROUND_PRESETS.map((bg) => {
                const active = config.background === bg.id;
                return (
                  <button
                    key={bg.id}
                    onClick={() => setConfig((prev) => ({ ...prev, background: bg.id }))}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition ${
                      active
                        ? "border-zinc-900 dark:border-zinc-100 font-medium"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-zinc-400/40 shrink-0"
                      style={{ background: bg.css }}
                    />
                    <span className="truncate">{bg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Padding */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-medium text-zinc-900 dark:text-zinc-200">Padding</label>
              <span className="text-zinc-500 font-mono">{config.padding}px</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[24, 48, 64, 80].map((p) => (
                <button
                  key={p}
                  onClick={() => setConfig((prev) => ({ ...prev, padding: p }))}
                  className={`py-1 rounded border text-center transition ${
                    config.padding === p
                      ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-medium"
                      : "bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {p}px
                </button>
              ))}
            </div>
          </div>

          {/* Shadow */}
          <div>
            <label className="font-medium text-zinc-900 dark:text-zinc-200 block mb-1.5">
              Elevation & Shadow
            </label>
            <div className="grid grid-cols-4 gap-1">
              {(["none", "subtle", "deep", "crisp"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig((prev) => ({ ...prev, shadow: s }))}
                  className={`py-1 rounded border text-center capitalize transition ${
                    config.shadow === s
                      ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-medium"
                      : "bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Browser URL Input if browser frame */}
          {config.device === "browser" && (
            <div>
              <label className="font-medium text-zinc-900 dark:text-zinc-200 block mb-1">
                Address Bar URL
              </label>
              <input
                type="text"
                value={config.browserUrl || ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, browserUrl: e.target.value }))}
                placeholder="https://forgekit.dev"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          )}
        </div>

        {/* Right Canvas / Preview Stage */}
        <div
          ref={previewRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="lg:col-span-3 min-h-[500px] flex items-center justify-center rounded-xl p-4 sm:p-8 overflow-auto border border-zinc-200 dark:border-zinc-800"
          style={{ background: activeBg }}
        >
          <div
            style={{
              padding: `${config.padding}px`,
              transition: "all 0.2s ease-out",
            }}
            className="flex items-center justify-center max-w-full"
          >
            {/* Device Frame Wrapper */}
            <div
              style={{
                boxShadow: SHADOW_PRESETS[config.shadow],
                borderRadius: `${DEVICE_SPECS[config.device].borderRadius}px`,
                maxWidth: "100%",
              }}
              className={`relative overflow-hidden transition-all ${
                config.deviceColor === "dark" ? "bg-zinc-900" : "bg-zinc-100"
              }`}
            >
              {/* Browser Window Chrome */}
              {config.device === "browser" && (
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800/40 bg-zinc-900/90 text-zinc-400 text-xs select-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 inline-block" />
                  </div>
                  {config.showAddressBar && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono text-zinc-300 max-w-[280px] truncate">
                      <Lock size={10} className="text-zinc-400" />
                      <span>{config.browserUrl || "https://forgekit.dev"}</span>
                    </div>
                  )}
                  <div className="w-8" />
                </div>
              )}

              {/* iPhone Dynamic Island */}
              {config.device === "iphone" && (
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20 flex items-center justify-end pr-2 pointer-events-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800 inline-block" />
                </div>
              )}

              {/* Android Hole Punch */}
              {config.device === "android" && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-20 pointer-events-none" />
              )}

              {/* Inner Screenshot Content */}
              <div
                style={{
                  width: `${DEVICE_SPECS[config.device].screenWidth}px`,
                  height: `${DEVICE_SPECS[config.device].screenHeight}px`,
                }}
                className="overflow-hidden bg-zinc-950"
              >
                <img
                  src={imageSrc}
                  alt="Mockup Screen"
                  className="w-full h-full object-cover object-top select-none pointer-events-none"
                />
              </div>

              {/* MacBook Base Chin */}
              {config.device === "macbook" && (
                <div className="h-4 bg-zinc-800 border-t border-zinc-700/60 flex items-center justify-center">
                  <div className="w-16 h-1 bg-zinc-900 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
