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
  ScreenRatioMode,
  ImageFitMode,
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
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 800, height: 500 });
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Measure uploaded image natural dimensions
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

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

  const spec = DEVICE_SPECS[config.device];
  const devW = spec.screenWidth;

  // Calculate dynamic screen height based on ratioMode and device
  let effectiveScreenHeight = spec.screenHeight;
  if (config.device === "browser" || config.device === "macbook") {
    const ratioMode = config.ratioMode || "auto";
    if (ratioMode === "auto" && imageSize.width > 0 && imageSize.height > 0) {
      const imgRatio = imageSize.width / imageSize.height;
      effectiveScreenHeight = Math.round(devW / imgRatio);
      effectiveScreenHeight = Math.max(280, Math.min(1600, effectiveScreenHeight));
    } else if (ratioMode === "16:10") {
      effectiveScreenHeight = Math.round(devW / 1.6);
    } else if (ratioMode === "16:9") {
      effectiveScreenHeight = Math.round(devW / (16 / 9));
    }
  }

  const exportCanvasBlob = useCallback(
    async (scale: number = 2): Promise<Blob | null> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const imgW = img.naturalWidth || img.width;
          const imgH = img.naturalHeight || img.height;

          // Compute effective screen height
          let screenH = spec.screenHeight;
          if (config.device === "browser" || config.device === "macbook") {
            const ratioMode = config.ratioMode || "auto";
            if (ratioMode === "auto" && imgW > 0 && imgH > 0) {
              const imgRatio = imgW / imgH;
              screenH = Math.round(devW / imgRatio);
              screenH = Math.max(280, Math.min(1600, screenH));
            } else if (ratioMode === "16:10") {
              screenH = Math.round(devW / 1.6);
            } else if (ratioMode === "16:9") {
              screenH = Math.round(devW / (16 / 9));
            }
          }

          let extraHeight = 0;
          let extraWidth = 0;
          if (config.device === "macbook") {
            extraHeight = 36; // lid bezel (20) + base (16)
            extraWidth = 60; // base overhang
          }
          if (config.device === "browser") extraHeight = 38; // titlebar

          const totalDevW = devW + extraWidth;
          const totalDevH = screenH + extraHeight;

          canvas.width = Math.round((totalDevW + config.padding * 2) * scale);
          canvas.height = Math.round((totalDevH + config.padding * 2) * scale);

          ctx.scale(scale, scale);

          const canvasW = totalDevW + config.padding * 2;
          const canvasH = totalDevH + config.padding * 2;

          // Draw background
          if (config.background === "zinc-gradient") {
            const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
            grad.addColorStop(0, "#18181b");
            grad.addColorStop(1, "#09090b");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvasW, canvasH);
          } else if (config.background === "slate-gradient") {
            const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
            grad.addColorStop(0, "#1e293b");
            grad.addColorStop(1, "#0f172a");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvasW, canvasH);
          } else if (config.background === "dark-radial") {
            const grad = ctx.createRadialGradient(
              canvasW / 2,
              canvasH * 0.4,
              20,
              canvasW / 2,
              canvasH / 2,
              canvasW
            );
            grad.addColorStop(0, "#27272a");
            grad.addColorStop(1, "#09090b");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvasW, canvasH);
          } else if (config.background === "pearl-soft") {
            const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
            grad.addColorStop(0, "#f4f4f5");
            grad.addColorStop(1, "#e4e4e7");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvasW, canvasH);
          } else if (config.background === "pure-black") {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, canvasW, canvasH);
          } else if (config.background === "pure-white") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvasW, canvasH);
          }

          // Safe roundRect helper
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
              ctx.rect(rx, ry, rw, rh);
            }
          };

          // Apply shadow
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

          const originX = config.padding;
          const originY = config.padding;

          if (config.device === "macbook") {
            // Authentic MacBook Pro Hardware Rendering
            const lidW = devW + 16;
            const lidH = screenH + 20;
            const lidX = originX + 22;
            const lidY = originY;

            // 1. Outer Aluminum Lid
            ctx.beginPath();
            safeRoundRect(lidX, lidY, lidW, lidH, [16, 16, 2, 2]);
            ctx.fillStyle = config.deviceColor === "dark" ? "#1e1e20" : "#d4d4d8";
            ctx.fill();

            // 2. Base Chassis below Lid
            const baseX = originX;
            const baseY = lidY + lidH;
            const baseW = totalDevW;
            const baseH = 16;

            ctx.beginPath();
            safeRoundRect(baseX, baseY, baseW, baseH, [2, 2, 8, 8]);
            ctx.fillStyle = config.deviceColor === "dark" ? "#27272a" : "#e4e4e7";
            ctx.fill();

            // Reset shadow
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Thumb cutout on base
            const thumbW = 76;
            const thumbH = 4;
            const thumbX = baseX + (baseW - thumbW) / 2;
            ctx.beginPath();
            safeRoundRect(thumbX, baseY, thumbW, thumbH, [0, 0, 4, 4]);
            ctx.fillStyle = config.deviceColor === "dark" ? "#09090b" : "#71717a";
            ctx.fill();

            // Display Screen Area
            const screenX = lidX + 8;
            const screenY = lidY + 8;

            ctx.fillStyle = "#000000";
            ctx.fillRect(screenX, screenY, devW, screenH);

            ctx.save();
            ctx.beginPath();
            ctx.rect(screenX, screenY, devW, screenH);
            ctx.clip();

            const imgAspect = imgW / imgH;
            const screenAspect = devW / screenH;

            if (config.fitMode === "contain") {
              const scaleFit = Math.min(devW / imgW, screenH / imgH);
              const drawW = imgW * scaleFit;
              const drawH = imgH * scaleFit;
              const drawX = screenX + (devW - drawW) / 2;
              const drawY = screenY + (screenH - drawH) / 2;
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
            } else {
              const scaleCover = Math.max(devW / imgW, screenH / imgH);
              const drawW = imgW * scaleCover;
              const drawH = imgH * scaleCover;
              const drawX = screenX + (devW - drawW) / 2;
              const drawY = screenY;
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }
            ctx.restore();

            // Top Camera Notch
            const notchW = 48;
            const notchH = 10;
            const notchX = screenX + (devW - notchW) / 2;
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            safeRoundRect(notchX, screenY, notchW, notchH, [0, 0, 5, 5]);
            ctx.fill();

            // Camera lens dot
            ctx.fillStyle = "#27272a";
            ctx.beginPath();
            ctx.arc(notchX + notchW / 2, screenY + 5, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (config.device === "browser") {
            // Authentic Browser Window Rendering
            const winX = originX;
            const winY = originY;
            const winW = devW;
            const winH = screenH + 38;

            ctx.beginPath();
            safeRoundRect(winX, winY, winW, winH, spec.borderRadius);
            ctx.fillStyle = config.deviceColor === "dark" ? "#18181b" : "#f4f4f5";
            ctx.fill();

            // Reset shadow
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Titlebar chrome
            ctx.fillStyle = config.deviceColor === "dark" ? "#27272a" : "#e4e4e7";
            ctx.beginPath();
            safeRoundRect(winX, winY, winW, 38, [spec.borderRadius, spec.borderRadius, 0, 0]);
            ctx.fill();

            // Authentic Mac traffic lights
            ctx.beginPath();
            ctx.arc(winX + 18, winY + 19, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#ff5f56";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(winX + 34, winY + 19, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#ffbd2e";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(winX + 50, winY + 19, 5, 0, Math.PI * 2);
            ctx.fillStyle = "#27c93f";
            ctx.fill();

            // Address bar
            if (config.showAddressBar) {
              ctx.fillStyle = config.deviceColor === "dark" ? "#18181b" : "#ffffff";
              ctx.beginPath();
              safeRoundRect(winX + 75, winY + 8, winW - 150, 22, 6);
              ctx.fill();

              ctx.font = "11px system-ui, sans-serif";
              ctx.fillStyle = "#a1a1aa";
              ctx.textAlign = "center";
              ctx.fillText(config.browserUrl || "https://forgekit.dev", winX + winW / 2, winY + 23);
            }

            // Clip screen area
            const screenY = winY + 38;
            ctx.save();
            ctx.beginPath();
            safeRoundRect(winX, screenY, winW, screenH, [0, 0, spec.borderRadius, spec.borderRadius]);
            ctx.clip();

            const imgAspect = imgW / imgH;
            const screenAspect = winW / screenH;

            if (config.fitMode === "contain") {
              const scaleFit = Math.min(winW / imgW, screenH / imgH);
              const drawW = imgW * scaleFit;
              const drawH = imgH * scaleFit;
              const drawX = winX + (winW - drawW) / 2;
              const drawY = screenY + (screenH - drawH) / 2;
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
            } else {
              const scaleCover = Math.max(winW / imgW, screenH / imgH);
              const drawW = imgW * scaleCover;
              const drawH = imgH * scaleCover;
              const drawX = winX + (winW - drawW) / 2;
              const drawY = screenY;
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }
            ctx.restore();
          } else {
            // iPhone, Android, Minimal Clay
            const devX = originX;
            const devY = originY;

            ctx.beginPath();
            safeRoundRect(devX, devY, devW, screenH, spec.borderRadius);
            ctx.fillStyle = config.deviceColor === "dark" ? "#18181b" : "#e4e4e7";
            ctx.fill();

            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            ctx.save();
            ctx.beginPath();
            safeRoundRect(devX + 4, devY + 4, devW - 8, screenH - 8, Math.max(4, spec.borderRadius - 4));
            ctx.clip();

            const imgAspect = imgW / imgH;
            if (config.fitMode === "contain") {
              const scaleFit = Math.min((devW - 8) / imgW, (screenH - 8) / imgH);
              const drawW = imgW * scaleFit;
              const drawH = imgH * scaleFit;
              const drawX = devX + 4 + ((devW - 8) - drawW) / 2;
              const drawY = devY + 4 + ((screenH - 8) - drawH) / 2;
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
            } else {
              const scaleCover = Math.max((devW - 8) / imgW, (screenH - 8) / imgH);
              const drawW = imgW * scaleCover;
              const drawH = imgH * scaleCover;
              const drawX = devX + 4 + ((devW - 8) - drawW) / 2;
              const drawY = devY + 4;
              ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }
            ctx.restore();

            if (config.device === "iphone") {
              ctx.fillStyle = "#000000";
              ctx.beginPath();
              safeRoundRect(devX + devW / 2 - 45, devY + 12, 90, 24, 12);
              ctx.fill();
            }
          }

          canvas.toBlob((blob) => resolve(blob), "image/png");
        };
        img.src = imageSrc;
      });
    },
    [config, imageSrc, imageSize, devW, spec]
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

          {/* Screen Ratio & Height for Desktop / Browser */}
          {(config.device === "browser" || config.device === "macbook") && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-medium text-zinc-900 dark:text-zinc-200">
                  Screen Proportion
                </label>
                <span className="text-zinc-500 font-mono text-[10px]">
                  {config.ratioMode === "auto" ? "Auto-Fit" : config.ratioMode}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: "auto", label: "Auto (Full)" },
                  { id: "16:10", label: "16:10 Mac" },
                  { id: "16:9", label: "16:9 Wide" },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setConfig((prev) => ({ ...prev, ratioMode: r.id as ScreenRatioMode }))}
                    className={`py-1 rounded border text-center transition ${
                      (config.ratioMode || "auto") === r.id
                        ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-medium"
                        : "bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                {(config.ratioMode || "auto") === "auto"
                  ? "Menyesuaikan tinggi gambar asli secara utuh tanpa terpotong (anti-crop)."
                  : config.ratioMode === "16:10"
                  ? "Proporsi layar standar MacBook Pro (16:10)."
                  : "Proporsi desktop widescreen 16:9."}
              </p>
            </div>
          )}

          {/* Image Fit Mode */}
          <div>
            <label className="font-medium text-zinc-900 dark:text-zinc-200 block mb-1.5">
              Image Scaling
            </label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: "cover", label: "Fill / Cover" },
                { id: "contain", label: "Fit / Utuh" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setConfig((prev) => ({ ...prev, fitMode: f.id as ImageFitMode }))}
                  className={`py-1 rounded border text-center transition ${
                    (config.fitMode || "cover") === f.id
                      ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 border-transparent font-medium"
                      : "bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {f.label}
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
            {config.device === "macbook" ? (
              /* Authentic MacBook Pro Hardware Frame */
              <div
                style={{
                  boxShadow: SHADOW_PRESETS[config.shadow],
                  maxWidth: "100%",
                }}
                className="flex flex-col items-center select-none"
              >
                {/* MacBook Display Lid */}
                <div
                  style={{
                    width: `${devW}px`,
                  }}
                  className={`relative rounded-t-2xl p-2.5 sm:p-3 border-t border-x border-zinc-700/60 transition-all ${
                    config.deviceColor === "dark" ? "bg-[#18181b]" : "bg-[#e4e4e7]"
                  }`}
                >
                  {/* Black Display Bezel */}
                  <div className="relative bg-black rounded-t-xl overflow-hidden shadow-inner">
                    {/* Camera Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-3 bg-black rounded-b-md z-30 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 border border-zinc-700 inline-block" />
                    </div>

                    {/* Display Screen */}
                    <div
                      style={{
                        width: "100%",
                        height: `${effectiveScreenHeight}px`,
                      }}
                      className="bg-zinc-950 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={imageSrc}
                        alt="Mockup Screen"
                        style={{
                          objectFit: config.fitMode === "contain" ? "contain" : "cover",
                        }}
                        className="w-full h-full object-top select-none pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* MacBook Base / Chassis (Extends wider than screen) */}
                <div
                  style={{
                    width: `${devW + 50}px`,
                    maxWidth: "calc(100% + 50px)",
                  }}
                  className={`h-4 rounded-b-xl border-b border-zinc-950 relative flex items-start justify-center shadow-2xl transition-all ${
                    config.deviceColor === "dark"
                      ? "bg-gradient-to-b from-[#27272a] to-[#18181b]"
                      : "bg-gradient-to-b from-[#e4e4e7] to-[#d4d4d8]"
                  }`}
                >
                  {/* Thumb Cutout Notch */}
                  <div className="w-20 h-1.5 bg-zinc-950 rounded-b-md shadow-inner" />
                </div>
              </div>
            ) : (
              /* Browser, iPhone, Android, Clay */
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
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block shadow-sm" />
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
                    width: `${devW}px`,
                    height: `${effectiveScreenHeight}px`,
                  }}
                  className="overflow-hidden bg-zinc-950 flex items-center justify-center"
                >
                  <img
                    src={imageSrc}
                    alt="Mockup Screen"
                    style={{
                      objectFit: config.fitMode === "contain" ? "contain" : "cover",
                    }}
                    className="w-full h-full object-top select-none pointer-events-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
