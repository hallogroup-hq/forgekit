"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Layers,
  Sparkles,
  Eye,
  FileCheck,
  Minimize2,
  ArrowRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  CompressionPreset,
  CompressionOptions,
  COMPRESSION_PRESETS,
  CompressionResult,
  ImageFormat,
  formatBytes,
  compressPdfDocument,
  loadPdfJs,
} from "./engine";

export default function PdfCompressorGenerator() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [firstPageThumb, setFirstPageThumb] = useState<string>("");

  // Compression configuration
  const [selectedPreset, setSelectedPreset] = useState<CompressionPreset>("50");
  const [colorFormat, setColorFormat] = useState<ImageFormat>("jpg");
  const [customQuality, setCustomQuality] = useState<number>(75);
  const [customScale, setCustomScale] = useState<number>(1.25);

  // Compression state
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>("");
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  // Preview tab
  const [previewMode, setPreviewMode] = useState<"compressed" | "original">("compressed");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load and inspect PDF when file is selected
  const handleFileChange = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Harap pilih file berformat PDF.");
      return;
    }

    setErrorMsg("");
    setPdfFile(file);
    setCompressionResult(null);
    setProgressPercent(0);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setPdfBytes(bytes);

      // Inspect page count and render quick thumbnail
      const pdfjs = await loadPdfJs();
      const doc = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
      setPageCount(doc.numPages);

      // Render thumbnail of page 1 with strict sRGB color preservation
      const page1 = await doc.getPage(1);
      const vp = page1.getViewport({ scale: 0.6 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(vp.width);
      canvas.height = Math.round(vp.height);
      const ctx = canvas.getContext("2d", { colorSpace: "srgb" });
      if (ctx) {
        await (page1.render as any)({
          canvasContext: ctx,
          viewport: vp,
          canvas,
          intent: "print",
        }).promise;
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        setFirstPageThumb(canvas.toDataURL("image/png"));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal membaca file PDF. Pastikan file tidak terkunci dengan password.");
    }
  };

  // Execute compression
  const handleStartCompression = async () => {
    if (!pdfBytes) return;

    setIsCompressing(true);
    setProgressPercent(5);
    setProgressText("Mempersiapkan dokumen...");
    setErrorMsg("");

    try {
      let options: CompressionOptions;

      if (selectedPreset === "custom") {
        options = {
          preset: "custom",
          scale: customScale,
          quality: customQuality / 100,
          format: colorFormat,
        };
      } else {
        const p = COMPRESSION_PRESETS[selectedPreset];
        options = {
          preset: selectedPreset,
          scale: p.scale,
          quality: p.quality,
          format: colorFormat,
        };
      }

      const result = await compressPdfDocument(pdfBytes, options, (p) => {
        setProgressPercent(p.percent);
        if (p.phase === "rendering") {
          setProgressText(`Memproses & mereduksi halaman ${p.currentPage} dari ${p.totalPages}...`);
        } else if (p.phase === "assembling") {
          setProgressText(`Menyusun ulang halaman ${p.currentPage} dari ${p.totalPages}...`);
        } else if (p.phase === "encoding") {
          setProgressText("Mengompresi data stream & mengoptimalkan struktur PDF...");
        }
      });

      setCompressionResult(result);
      setIsCompressing(false);

      if (result.savingsPercent > 0) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err: any) {
      console.error(err);
      setIsCompressing(false);
      setErrorMsg("Terjadi kendala saat mengompresi PDF: " + (err.message || "Unknown error"));
    }
  };

  // Download compressed PDF
  const handleDownload = () => {
    if (!compressionResult) return;
    const blob = new Blob([compressionResult.compressedBytes as any], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const originalName = pdfFile ? pdfFile.name.replace(/\.[^/.]+$/, "") : "document";
    a.href = url;
    a.download = `${originalName}-compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPdfFile(null);
    setPdfBytes(null);
    setPageCount(0);
    setFirstPageThumb("");
    setCompressionResult(null);
    setProgressPercent(0);
    setErrorMsg("");
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 py-2">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileChange(f);
        }}
      />

      {/* STATE 1: UPLOAD PROMPT (No PDF loaded) */}
      {!pdfFile && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFileChange(f);
          }}
          className="relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 text-center transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-sky-400 group-hover:scale-105 transition-transform mb-4">
            <Minimize2 className="h-8 w-8" />
          </div>

          <h3 className="text-base font-semibold text-zinc-100 mb-1">
            Pilih atau Tarik File PDF ke Sini
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
            Kompres ukuran dokumen PDF tanpa mengorbankan ketajaman teks dan gambar. 100% diproses langsung di perambanmu secara privat.
          </p>

          <button
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-sky-500/20"
          >
            <Upload className="h-4 w-4" />
            <span>Pilih File PDF</span>
          </button>
        </div>
      )}

      {/* STATE 2: ACTIVE WORKSTATION (PDF Loaded) */}
      {pdfFile && (
        <div className="flex flex-col gap-6">
          {/* Top Bar Info & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-sky-400">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-100 max-w-xs sm:max-w-md truncate">
                  {pdfFile.name}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Ukuran Asli: <strong className="text-zinc-200">{formatBytes(pdfFile.size)}</strong> • {pageCount} Halaman
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition-colors cursor-pointer"
              >
                Ganti PDF
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Preset & Settings */}
            <div className="lg:col-span-7 flex flex-col gap-4 p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                  <Sliders className="h-4 w-4 text-sky-400" />
                  <span>Pilihan Tingkat Kompresi</span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  Presisi Visual & Penghematan Size
                </span>
              </div>

              {/* Presets Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["75", "50", "25"] as const).map((pid) => {
                  const p = COMPRESSION_PRESETS[pid];
                  const isSelected = selectedPreset === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setSelectedPreset(pid)}
                      className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-zinc-800/90 border-sky-500/70 ring-1 ring-sky-500/30"
                          : "bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/80"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-zinc-100">
                          {p.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            isSelected
                              ? "bg-sky-500/20 text-sky-300"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {p.targetReduction}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug mb-2">
                        {p.description}
                      </p>
                      <span className="text-[10px] text-zinc-500 mt-auto pt-1 border-t border-zinc-800/50">
                        {p.recommendedFor}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Color Preservation Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs">
                <div className="flex flex-col">
                  <span className="font-semibold text-zinc-200">Akurasi Warna Dokumen</span>
                  <span className="text-[11px] text-zinc-400">
                    Kunci gamut sRGB & eliminasi pergeseran warna pada gambar/stempel
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setColorFormat("jpg")}
                    className={`px-3 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                      colorFormat === "jpg"
                        ? "bg-zinc-800 text-sky-400 font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Otomatis sRGB (Hemat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorFormat("png")}
                    className={`px-3 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                      colorFormat === "png"
                        ? "bg-zinc-800 text-sky-400 font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                    title="100% warna identik tanpa kompresi warna yang hilang"
                  >
                    100% Lossless Warna (PNG)
                  </button>
                </div>
              </div>

              {/* Custom Sliders Toggle */}
              <div className="border-t border-zinc-800/80 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPreset(selectedPreset === "custom" ? "50" : "custom")
                  }
                  className="flex items-center justify-between w-full text-xs font-medium text-zinc-300 hover:text-white cursor-pointer py-1"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Mode Kustom (Manual Tuning)</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {selectedPreset === "custom" ? "Aktif" : "Buka Slider"}
                  </span>
                </button>

                {selectedPreset === "custom" && (
                  <div className="flex flex-col gap-3.5 p-3.5 mt-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                    {/* Quality Slider */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Kualitas Kompresi JPEG:</span>
                        <span className="font-mono text-sky-400 font-semibold">{customQuality}%</span>
                      </div>
                      <input
                        type="range"
                        min="35"
                        max="90"
                        step="1"
                        value={customQuality}
                        onChange={(e) => setCustomQuality(Number(e.target.value))}
                        className="w-full accent-sky-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Lebih Padat (35%)</span>
                        <span>Seimbang (65%)</span>
                        <span>Maksimal (90%)</span>
                      </div>
                    </div>

                    {/* Scale/DPI Slider */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400">Resolusi / Skala Rendering:</span>
                        <span className="font-mono text-sky-400 font-semibold">{customScale.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="1.8"
                        step="0.05"
                        value={customScale}
                        onChange={(e) => setCustomScale(Number(e.target.value))}
                        className="w-full accent-sky-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Ringkas (0.8x)</span>
                        <span>Standar (1.2x)</span>
                        <span>Sangat Tajam (1.8x)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button & Progress */}
              <div className="pt-2 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleStartCompression}
                  disabled={isCompressing}
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-all shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isCompressing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{progressText || "Mengompresi Dokumen..."}</span>
                    </>
                  ) : (
                    <>
                      <Minimize2 className="h-4 w-4" />
                      <span>Mulai Kompres PDF Sekarang</span>
                    </>
                  )}
                </button>

                {isCompressing && (
                  <div className="flex flex-col gap-1.5">
                    <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-sky-400 transition-all duration-200"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-400 text-center font-mono">
                      {progressPercent}% • {progressText}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Result / Preview Comparison */}
            <div className="lg:col-span-5 flex flex-col gap-4 p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                  <Eye className="h-4 w-4 text-sky-400" />
                  <span>Hasil & Visual Preview</span>
                </div>
                {compressionResult && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    Selesai
                  </span>
                )}
              </div>

              {/* RESULT STATS CARD (When finished) */}
              {compressionResult && (
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex flex-col">
                      <span className="text-[10px] text-zinc-400">Ukuran Awal</span>
                      <span className="font-mono text-sm font-semibold text-zinc-300">
                        {formatBytes(compressionResult.originalSize)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex flex-col">
                      <span className="text-[10px] text-zinc-400">Ukuran Baru</span>
                      <span className="font-mono text-sm font-bold text-sky-400">
                        {formatBytes(compressionResult.compressedSize)}
                      </span>
                    </div>
                  </div>

                  {/* Savings pill */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                    <div className="flex items-center gap-2 text-zinc-200 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-sky-400" />
                      <span>
                        {compressionResult.savingsPercent > 0
                          ? `Hemat ${compressionResult.savingsPercent}%`
                          : "File Asli Sudah Optimal"}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-400">
                      -{formatBytes(compressionResult.savingsBytes)}
                    </span>
                  </div>

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-sky-500/20 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF Terkompresi</span>
                  </button>
                </div>
              )}

              {/* VISUAL PREVIEW OF PAGE 1 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-400">Pratinjau Halaman 1:</span>
                  {compressionResult && (
                    <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded border border-zinc-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setPreviewMode("compressed")}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          previewMode === "compressed"
                            ? "bg-zinc-800 text-sky-300 font-semibold"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Hasil Kompres
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("original")}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          previewMode === "original"
                            ? "bg-zinc-800 text-sky-300 font-semibold"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Asli
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative aspect-[3/4] w-full max-h-72 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center p-2 shadow-inner">
                  {compressionResult ? (
                    <img
                      src={
                        previewMode === "compressed"
                          ? compressionResult.firstPageCompressedUrl
                          : compressionResult.firstPageOriginalUrl
                      }
                      alt="PDF Page Preview"
                      className="max-h-full max-w-full object-contain rounded shadow"
                    />
                  ) : firstPageThumb ? (
                    <img
                      src={firstPageThumb}
                      alt="Original PDF Thumbnail"
                      className="max-h-full max-w-full object-contain rounded shadow opacity-90"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-500 text-xs">
                      <FileCheck className="h-6 w-6" />
                      <span>Memuat pratinjau...</span>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                  Pratinjau memastikan kejelasan teks & ketajaman elemen gambar sebelum diunduh.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
