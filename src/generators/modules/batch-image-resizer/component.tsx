"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Upload,
  Download,
  FolderArchive,
  Loader2,
  Trash2,
  Maximize2,
  Lock,
  Unlock,
  RefreshCw,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import JSZip from "jszip";
import { formatFileSize } from "@/lib/utils";
import {
  calculateNewDimensions,
  ResizeMode,
  AspectFitMode,
  computeCanvasDrawParams,
  RESIZE_PRESETS,
  ResizeOptions,
} from "./engine";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  originalWidth: number;
  originalHeight: number;
}

export default function BatchImageResizerGenerator() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [mode, setMode] = useState<ResizeMode>("dimensions");
  const [fitMode, setFitMode] = useState<AspectFitMode>("fit-with-padding");
  const [paddingBg, setPaddingBg] = useState<string>("transparent");
  const [targetWidth, setTargetWidth] = useState<number>(1200);
  const [targetHeight, setTargetHeight] = useState<number>(800);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [percentage, setPercentage] = useState<number>(50);
  const [maxFitDim, setMaxFitDim] = useState<number>(1080);
  const [presetKey, setPresetKey] = useState<string>("social-landscape");
  const [format, setFormat] = useState<"original" | "image/webp" | "image/jpeg" | "image/png">("original");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const options: ResizeOptions = useMemo(
    () => ({
      mode,
      targetWidth,
      targetHeight,
      maintainAspectRatio: maintainAspect,
      fitMode: mode === "preset" || (mode === "dimensions" && targetWidth && targetHeight) ? fitMode : undefined,
      paddingBackground: paddingBg,
      percentage,
      maxFitDimension: maxFitDim,
      preset: presetKey,
    }),
    [mode, fitMode, paddingBg, targetWidth, targetHeight, maintainAspect, percentage, maxFitDim, presetKey]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setItems((prev) => [
          ...prev,
          {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            previewUrl,
            name: file.name,
            size: file.size,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
          },
        ]);
      };
      img.src = previewUrl;
    });

    confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
  };

  const handleClearAll = () => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const renderResizedBlob = async (item: ImageItem): Promise<{ blob: Blob; filename: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const dims = calculateNewDimensions(item.originalWidth, item.originalHeight, options);
        const activeFitMode = options.fitMode || (maintainAspect ? "fit-with-padding" : "stretch");
        const drawParams = computeCanvasDrawParams(
          item.originalWidth,
          item.originalHeight,
          dims.width,
          dims.height,
          activeFitMode,
          paddingBg
        );

        const canvas = document.createElement("canvas");
        canvas.width = drawParams.canvasWidth;
        canvas.height = drawParams.canvasHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Handle background color for padded regions or JPEG opacity
        if (drawParams.backgroundColor && drawParams.backgroundColor !== "transparent") {
          ctx.fillStyle = drawParams.backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (format === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, drawParams.drawX, drawParams.drawY, drawParams.drawWidth, drawParams.drawHeight);

        let mimeType = item.file.type || "image/png";
        let ext = item.name.split(".").pop() || "png";

        if (format === "image/webp") {
          mimeType = "image/webp";
          ext = "webp";
        } else if (format === "image/jpeg") {
          mimeType = "image/jpeg";
          ext = "jpg";
        } else if (format === "image/png") {
          mimeType = "image/png";
          ext = "png";
        }

        const baseName = item.name.substring(0, item.name.lastIndexOf(".")) || item.name;
        const filename = `${baseName}-${drawParams.canvasWidth}x${drawParams.canvasHeight}.${ext}`;

        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ blob, filename });
            else reject(new Error("toBlob failed"));
          },
          mimeType,
          0.92
        );
      };
      img.onerror = reject;
      img.src = item.previewUrl;
    });
  };

  const handleDownloadSingle = async (item: ImageItem) => {
    try {
      const { blob, filename } = await renderResizedBlob(item);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
    } catch (err) {
      console.error("Resize failed", err);
    }
  };

  const handleDownloadAllZip = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      for (const item of items) {
        const { blob, filename } = await renderResizedBlob(item);
        zip.file(filename, blob);
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resized-images-${Date.now().toString().slice(-4)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch (err) {
      console.error("ZIP failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Image Batch Files
            </span>
            {items.length > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 font-medium">
                {items.length} images loaded
              </span>
            )}
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="batch-image-upload"
          />
          <label
            htmlFor="batch-image-upload"
            className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center"
          >
            <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {items.length > 0 ? "Click to Add More Images" : "Drop Images Here or Click to Browse"}
            </div>
            <p className="text-xs text-zinc-500 max-w-sm">
              Supports PNG, JPG, WebP. High-fidelity canvas bicubic downscaling and upscaling in your browser.
            </p>
          </label>
        </div>
      </div>

      {/* Resizing Configuration Controls */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Resizing Options
          </span>

          <div className="flex rounded-xl bg-zinc-200/60 dark:bg-zinc-800 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("dimensions")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                mode === "dimensions"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Exact Dimensions
            </button>
            <button
              type="button"
              onClick={() => setMode("percentage")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                mode === "percentage"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Percentage %
            </button>
            <button
              type="button"
              onClick={() => setMode("fit-box")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                mode === "fit-box"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Fit Within Box
            </button>
            <button
              type="button"
              onClick={() => setMode("preset")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                mode === "preset"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Presets
            </button>
          </div>
        </div>

        {/* Dynamic Controls per Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {mode === "dimensions" && (
            <>
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">
                  Target Width (px)
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">
                  Target Height (px)
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(Number(e.target.value))}
                  disabled={maintainAspect}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-mono disabled:opacity-50"
                />
              </div>

              <div className="flex items-center pt-6">
                <button
                  type="button"
                  onClick={() => setMaintainAspect(!maintainAspect)}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  {maintainAspect ? (
                    <Lock className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
                  ) : (
                    <Unlock className="w-4 h-4 text-zinc-400" />
                  )}
                  <span>Lock Aspect Ratio</span>
                </button>
              </div>
            </>
          )}

          {mode === "percentage" && (
            <div className="sm:col-span-2">
              <div className="flex justify-between text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                <span className="font-medium">Scale Percentage</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{percentage}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full accent-zinc-900 dark:accent-zinc-100"
              />
              <div className="flex gap-2 mt-2">
                {[25, 50, 75, 100, 150, 200].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPercentage(p)}
                    className="px-2 py-0.5 rounded text-[10px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 font-mono cursor-pointer transition-colors"
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "fit-box" && (
            <div className="sm:col-span-2">
              <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">
                Max Dimension Boundary (px)
              </label>
              <input
                type="number"
                min="50"
                max="8000"
                value={maxFitDim}
                onChange={(e) => setMaxFitDim(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                Images larger than this will be proportionately shrunk to fit within a {maxFitDim}×{maxFitDim} box.
              </span>
            </div>
          )}

          {mode === "preset" && (
            <div className="sm:col-span-2">
              <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">
                Social & Display Preset
              </label>
              <select
                value={presetKey}
                onChange={(e) => setPresetKey(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
              >
                {Object.entries(RESIZE_PRESETS).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(mode === "preset" || (mode === "dimensions" && maintainAspect)) && (
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">
                Fit Strategy
              </label>
              <select
                value={fitMode}
                onChange={(e) => setFitMode(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
              >
                <option value="fit-with-padding">Fit with Padding (Contain)</option>
                <option value="crop-to-fill">Crop to Fill (Cover)</option>
                <option value="stretch">Stretch to Fit</option>
              </select>
            </div>
          )}

          {fitMode === "fit-with-padding" && (mode === "preset" || mode === "dimensions") && (
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">
                Padding Background
              </label>
              <select
                value={paddingBg}
                onChange={(e) => setPaddingBg(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
              >
                <option value="transparent">Transparent (PNG / WebP)</option>
                <option value="#ffffff">White (#ffffff)</option>
                <option value="#000000">Black (#000000)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 text-[11px] mb-1 font-medium">
              Output Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            >
              <option value="original">Keep Original Format</option>
              <option value="image/webp">Convert to WebP (Recommended)</option>
              <option value="image/jpeg">Convert to JPEG</option>
              <option value="image/png">Convert to PNG</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Preview Table & Actions */}
      {items.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Ready to Process {items.length} Images
              </h3>
              <p className="text-xs text-zinc-500">
                Review the new calculated dimensions below. Download all as a single ZIP bundle or save individually.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 text-white dark:text-zinc-950 shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resizing & Zipping...</span>
                </>
              ) : (
                <>
                  <FolderArchive className="w-4 h-4" />
                  <span>Download All as ZIP ({items.length})</span>
                </>
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-auto max-h-[460px] shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 font-semibold text-zinc-500 text-[10px] uppercase">
                  <th className="px-3 py-2.5 w-14">Preview</th>
                  <th className="px-3 py-2.5">Original File</th>
                  <th className="px-3 py-2.5">Original Dimensions</th>
                  <th className="px-3 py-2.5">New Dimensions</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const newDims = calculateNewDimensions(item.originalWidth, item.originalHeight, options);
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                    >
                      <td className="px-3 py-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {formatFileSize(item.size)}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-zinc-500">
                        {item.originalWidth} × {item.originalHeight} px
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                        {newDims.width} × {newDims.height} px
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(item)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
          <span>Upload images above to configure batch resizing dimensions and download outputs.</span>
        </div>
      )}
    </div>
  );
}
