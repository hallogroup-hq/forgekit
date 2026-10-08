"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Upload,
  Download,
  FolderArchive,
  Loader2,
  Trash2,
  FileImage,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import JSZip from "jszip";
import { formatFileSize } from "@/lib/utils";
import {
  ImageTargetFormat,
  getExtensionForMime,
  calculateEstimatedSavings,
  COMPRESSION_PROFILES,
} from "./engine";

interface ConvertedItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  originalSize: number;
  originalType: string;
  convertedBlob?: Blob;
  convertedSize?: number;
  convertedFilename?: string;
  isConverting: boolean;
}

export default function ImageConverterGenerator() {
  const [items, setItems] = useState<ConvertedItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<ImageTargetFormat>("image/webp");
  const [quality, setQuality] = useState<number>(0.75); // 0.1 to 1.0
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert a single image using offscreen Canvas
  const processImage = async (
    item: ConvertedItem,
    format: ImageTargetFormat,
    q: number
  ): Promise<{ blob: Blob; size: number; filename: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));

        // If target is JPEG and image has transparency, paint white background
        if (format === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const ext = getExtensionForMime(format);
        const baseName = item.name.substring(0, item.name.lastIndexOf(".")) || item.name;
        const filename = `${baseName}.${ext}`;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, size: blob.size, filename });
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          format,
          q
        );
      };
      img.onerror = reject;
      img.src = item.previewUrl;
    });
  };

  // Re-run conversions whenever format or quality changes
  useEffect(() => {
    if (items.length === 0) return;

    let isCancelled = false;

    const convertAll = async () => {
      const updated = await Promise.all(
        items.map(async (item) => {
          try {
            const res = await processImage(item, targetFormat, quality);
            if (isCancelled) return item;
            return {
              ...item,
              convertedBlob: res.blob,
              convertedSize: res.size,
              convertedFilename: res.filename,
              isConverting: false,
            };
          } catch (e) {
            console.error("Conversion error", e);
            return { ...item, isConverting: false };
          }
        })
      );
      if (!isCancelled) {
        setItems(updated);
      }
    };

    convertAll();

    return () => {
      isCancelled = true;
    };
  }, [targetFormat, quality, items.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const newItems: ConvertedItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      originalSize: file.size,
      originalType: file.type,
      isConverting: true,
    }));

    setItems((prev) => [...prev, ...newItems]);
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
  };

  const handleClearAll = () => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadSingle = (item: ConvertedItem) => {
    if (!item.convertedBlob || !item.convertedFilename) return;
    const url = URL.createObjectURL(item.convertedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.convertedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
  };

  const handleDownloadAllZip = async () => {
    if (items.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const item of items) {
        if (item.convertedBlob && item.convertedFilename) {
          zip.file(item.convertedFilename, item.convertedBlob);
        }
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `converted-images-${Date.now().toString().slice(-4)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } catch (err) {
      console.error("ZIP creation failed", err);
    } finally {
      setIsZipping(false);
    }
  };

  const totalOriginalBytes = useMemo(
    () => items.reduce((sum, item) => sum + item.originalSize, 0),
    [items]
  );

  const totalConvertedBytes = useMemo(
    () => items.reduce((sum, item) => sum + (item.convertedSize || item.originalSize), 0),
    [items]
  );

  const overallSavings = useMemo(
    () => calculateEstimatedSavings(totalOriginalBytes, totalConvertedBytes),
    [totalOriginalBytes, totalConvertedBytes]
  );

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-850">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Input Images
            </span>
            {items.length > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
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
            id="converter-file-upload"
          />
          <label
            htmlFor="converter-file-upload"
            className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center"
          >
            <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {items.length > 0 ? "Click to Add More Images" : "Drop Images Here or Click to Browse"}
            </div>
            <p className="text-xs text-zinc-500 max-w-sm">
              Convert and compress PNG, JPG, or WebP files locally with instant browser canvas encoding.
            </p>
          </label>
        </div>
      </div>

      {/* Target Format & Quality Controls */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
          Compression & Format Settings
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="block text-zinc-600 dark:text-zinc-400 font-medium">Target Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mime: "image/webp", label: "WebP", desc: "Best for Web" },
                { mime: "image/jpeg", label: "JPEG", desc: "Universal" },
                { mime: "image/png", label: "PNG", desc: "Lossless" },
              ].map((f) => (
                <button
                  key={f.mime}
                  type="button"
                  onClick={() => setTargetFormat(f.mime as ImageTargetFormat)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    targetFormat === f.mime
                      ? "border-blue-500 bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500"
                      : "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                  }`}
                >
                  <div className="font-bold text-sm">{f.label}</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-zinc-600 dark:text-zinc-400 font-medium">
                Compression Quality
              </label>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {targetFormat === "image/png" ? "Lossless (100%)" : `${Math.round(quality * 100)}%`}
              </span>
            </div>

            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={quality}
              disabled={targetFormat === "image/png"}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full accent-blue-600 disabled:opacity-40"
            />

            <div className="flex gap-2 pt-1">
              {Object.values(COMPRESSION_PROFILES).map((p) => (
                <button
                  key={p.name}
                  type="button"
                  disabled={targetFormat === "image/png"}
                  onClick={() => setQuality(p.quality)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium transition-all ${
                    Math.abs(quality - p.quality) < 0.01 && targetFormat !== "image/png"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                  } disabled:opacity-40`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Savings Banner */}
      {items.length > 0 && (
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Total Payload Reduction: </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                  {overallSavings.isSmaller
                    ? `-${overallSavings.savingsPercentage}% (${formatFileSize(overallSavings.savedBytes)} saved)`
                    : "Ready to export"}
                </span>
              </div>
              <div className="text-zinc-500 text-[11px]">
                Original: {formatFileSize(totalOriginalBytes)} → Converted: {formatFileSize(totalConvertedBytes)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={isZipping}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-xs cursor-pointer transition-all self-start sm:self-auto"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Packing ZIP...</span>
              </>
            ) : (
              <>
                <FolderArchive className="w-4 h-4" />
                <span>Download All as ZIP ({items.length})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Comparison Table */}
      {items.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-x-auto max-h-[460px] shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 font-semibold text-zinc-500 text-[10px] uppercase">
                <th className="px-3 py-2.5 w-14">Preview</th>
                <th className="px-3 py-2.5">Original File</th>
                <th className="px-3 py-2.5">Converted Format</th>
                <th className="px-3 py-2.5">Size Comparison</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const savings = item.convertedSize
                  ? calculateEstimatedSavings(item.originalSize, item.convertedSize)
                  : null;
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
                        {formatFileSize(item.originalSize)}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                      {item.convertedFilename || "Processing..."}
                    </td>
                    <td className="px-3 py-2">
                      {item.convertedSize ? (
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {formatFileSize(item.convertedSize)}
                          </span>
                          {savings && savings.isSmaller && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                              -{savings.savingsPercentage}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-400 text-xs">Converting...</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(item)}
                        disabled={!item.convertedBlob}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 transition-colors cursor-pointer"
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
      ) : (
        <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
          <FileImage className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
          <span>Upload images above to convert formats and inspect size compression stats.</span>
        </div>
      )}
    </div>
  );
}
