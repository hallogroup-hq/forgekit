"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Download,
  Pipette,
  Sliders,
  Sparkles,
  Eraser,
  RotateCcw,
  Undo2,
  Copy,
  Check,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crop,
  ShieldAlert,
  Scissors,
  Brush,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  ColorRGB,
  RemovalOptions,
  colorDistanceRedmean,
  detectDominantCornerColor,
  processBackgroundRemovalGlobal,
  processBackgroundRemovalContiguous,
  applyBrushStroke,
  autoCropTransparentEdges,
} from "./engine";

type ToolMode = "select" | "eyedropper" | "brush-erase" | "brush-restore";
type BackdropMode = "checker" | "dark" | "light" | "blue";

export default function BackgroundRemoverGenerator() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);

  // Core Processing Settings
  const [removalMode, setRemovalMode] = useState<"contiguous" | "global">("contiguous");
  const [targetColor, setTargetColor] = useState<ColorRGB>({ r: 255, g: 255, b: 255 });
  const [tolerance, setTolerance] = useState<number>(22);
  const [feather, setFeather] = useState<number>(6);
  const [defringe, setDefringe] = useState<boolean>(true);
  const [autoTrim, setAutoTrim] = useState<boolean>(false);

  // Active Tool & Brush Settings
  const [activeTool, setActiveTool] = useState<ToolMode>("select");
  const [brushSize, setBrushSize] = useState<number>(24);

  // Viewport Settings
  const [backdrop, setBackdrop] = useState<BackdropMode>("checker");
  const [zoom, setZoom] = useState<number>(1);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // History for Undo
  const [history, setHistory] = useState<ImageData[]>([]);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const currentImageDataRef = useRef<ImageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isPainting = useRef<boolean>(false);

  // Convert ColorRGB to hex string
  const hexColor = `#${((1 << 24) + (targetColor.r << 16) + (targetColor.g << 8) + targetColor.b)
    .toString(16)
    .slice(1)}`;

  // Handle uploaded file
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSourceFile(file);
        setSourceImage(img);
        setHistory([]);

        // Create initial offscreen canvas to analyze colors and store original ImageData
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        originalImageDataRef.current = imgData;

        // Auto-detect dominant background color from image perimeter
        const detectedColor = detectDominantCornerColor(imgData.data, tempCanvas.width, tempCanvas.height);
        setTargetColor(detectedColor);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Re-run the background removal pipeline
  const executeRemoval = useCallback(
    (customStartPoint?: { x: number; y: number } | null) => {
      const original = originalImageDataRef.current;
      const canvas = canvasRef.current;
      if (!original || !canvas) return;

      const options: RemovalOptions = {
        mode: removalMode,
        targetColor,
        tolerance,
        feather,
        defringe,
        startPoint: customStartPoint || null,
      };

      const processed =
        removalMode === "contiguous"
          ? processBackgroundRemovalContiguous(original, options)
          : processBackgroundRemovalGlobal(original, options);

      currentImageDataRef.current = processed;

      // Draw to visible canvas
      canvas.width = original.width;
      canvas.height = original.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.putImageData(processed, 0, 0);
      }
    },
    [removalMode, targetColor, tolerance, feather, defringe]
  );

  // Trigger processing whenever settings change
  useEffect(() => {
    if (sourceImage && originalImageDataRef.current) {
      executeRemoval();
    }
  }, [sourceImage, executeRemoval]);

  // Canvas Mouse Interactions: Eyedropper & Manual Brush
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (activeTool === "eyedropper") {
      const original = originalImageDataRef.current;
      if (!original) return;
      const idx = (coords.y * original.width + coords.x) * 4;
      const sampled: ColorRGB = {
        r: original.data[idx],
        g: original.data[idx + 1],
        b: original.data[idx + 2],
      };
      setTargetColor(sampled);

      if (removalMode === "contiguous") {
        // Trigger flood fill specifically from the clicked point
        executeRemoval(coords);
      }
      setActiveTool("select");
      return;
    }

    if (activeTool === "brush-erase" || activeTool === "brush-restore") {
      isPainting.current = true;
      const ctx = canvas.getContext("2d");
      const current = currentImageDataRef.current;
      const original = originalImageDataRef.current;
      if (!ctx || !current || !original) return;

      // Save undo snapshot before manual brush stroke
      setHistory((prev) => [...prev.slice(-15), new ImageData(new Uint8ClampedArray(current.data), current.width, current.height)]);

      applyBrushStroke(
        current,
        original,
        coords.x,
        coords.y,
        brushSize,
        activeTool === "brush-erase" ? "erase" : "restore"
      );
      ctx.putImageData(current, 0, 0);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting.current) return;
    if (activeTool !== "brush-erase" && activeTool !== "brush-restore") return;

    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const current = currentImageDataRef.current;
    const original = originalImageDataRef.current;
    if (!canvas || !current || !original) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    applyBrushStroke(
      current,
      original,
      coords.x,
      coords.y,
      brushSize,
      activeTool === "brush-erase" ? "erase" : "restore"
    );
    ctx.putImageData(current, 0, 0);
  };

  const handleCanvasMouseUp = () => {
    isPainting.current = false;
  };

  // Undo manual brush action
  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    currentImageDataRef.current = prev;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.putImageData(prev, 0, 0);
    }
  };

  // Download Transparent PNG
  const handleDownload = () => {
    const current = currentImageDataRef.current;
    if (!current) return;

    let finalData = current;
    if (autoTrim) {
      finalData = autoCropTransparentEdges(current, 6);
    }

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = finalData.width;
    exportCanvas.height = finalData.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(finalData, 0, 0);

    const url = exportCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    const origName = sourceFile ? sourceFile.name.replace(/\.[^/.]+$/, "") : "cutout";
    a.href = url;
    a.download = `${origName}-transparent.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  // Copy transparent PNG to clipboard
  const handleCopyClipboard = async () => {
    const current = currentImageDataRef.current;
    if (!current) return;

    let finalData = current;
    if (autoTrim) {
      finalData = autoCropTransparentEdges(current, 6);
    }

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = finalData.width;
    exportCanvas.height = finalData.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(finalData, 0, 0);

    exportCanvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Clipboard copy failed", err);
      }
    }, "image/png");
  };

  // Reset to original state
  const handleReset = () => {
    setSourceFile(null);
    setSourceImage(null);
    setHistory([]);
    originalImageDataRef.current = null;
    currentImageDataRef.current = null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 py-2">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileUpload(f);
        }}
      />

      {/* STATE 1: UPLOAD SCREEN (No file loaded) */}
      {!sourceFile && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFileUpload(f);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="relative flex flex-col items-center justify-center p-14 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 text-center transition-all cursor-pointer group"
        >
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-sky-400 group-hover:scale-105 transition-transform mb-4 shadow-sm">
            <Scissors className="h-8 w-8" />
          </div>

          <h3 className="text-base font-semibold text-zinc-100 mb-1">
            Pilih atau Tarik Gambar ke Sini
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
            Hapus background foto produk, logo, tanda tangan, atau grafik menjadi transparan (.PNG) secara murni di browser tanpa mengirim data ke AI luar.
          </p>

          <button
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition-colors shadow-lg shadow-sky-500/20"
          >
            <Upload className="h-4 w-4" />
            <span>Pilih Gambar</span>
          </button>
        </div>
      )}

      {/* STATE 2: INTERACTIVE WORKSTATION (File Loaded) */}
      {sourceFile && (
        <div className="flex flex-col gap-5">
          {/* Top Bar: File Info, Quick Actions & Export */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sky-400">
                <Scissors className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-zinc-100 max-w-xs sm:max-w-md truncate">
                  {sourceFile.name}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {sourceImage?.naturalWidth} × {sourceImage?.naturalHeight} px • Algoritmik Murni (100% Privat)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition-colors cursor-pointer"
              >
                Ganti Foto
              </button>
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium border border-zinc-700/60 transition-colors cursor-pointer"
                title="Salin PNG transparan langsung ke clipboard"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-sky-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Disalin!" : "Salin PNG"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download PNG Transparan</span>
              </button>
            </div>
          </div>

          {/* Main Workspace 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left 4 Columns: Removal Controls & Tools */}
            <div className="lg:col-span-4 flex flex-col gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              {/* SECTION 1: MODE TABS */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-200">Mode Penghapusan</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setRemovalMode("contiguous")}
                    className={`py-1.5 px-2 rounded font-medium text-center transition-all cursor-pointer ${
                      removalMode === "contiguous"
                        ? "bg-zinc-800 text-sky-400 shadow font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Tersambung (Wand)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemovalMode("global")}
                    className={`py-1.5 px-2 rounded font-medium text-center transition-all cursor-pointer ${
                      removalMode === "global"
                        ? "bg-zinc-800 text-sky-400 shadow font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Semua Warna (Global)
                  </button>
                </div>
                <span className="text-[10px] text-zinc-500 leading-tight">
                  {removalMode === "contiguous"
                    ? "Menghapus background dari tepi luar tanpa merusak elemen warna serupa di dalam objek."
                    : "Menghapus warna background di seluruh gambar (cocok untuk logo, teks, & stempel)."}
                </span>
              </div>

              {/* SECTION 2: TARGET COLOR & EYEDROPPER */}
              <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Warna Background</span>
                  <button
                    type="button"
                    onClick={() => setActiveTool(activeTool === "eyedropper" ? "select" : "eyedropper")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      activeTool === "eyedropper"
                        ? "bg-sky-500 text-zinc-950 font-bold"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    <Pipette className="h-3 w-3" />
                    <span>{activeTool === "eyedropper" ? "Klik Foto..." : "Pipet Warna"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div
                    className="h-7 w-7 rounded-md border border-zinc-700 shadow-sm shrink-0"
                    style={{ backgroundColor: hexColor }}
                  />
                  <div className="flex flex-col text-xs font-mono">
                    <span className="font-semibold text-zinc-200 uppercase">{hexColor}</span>
                    <span className="text-[10px] text-zinc-500">
                      RGB({targetColor.r}, {targetColor.g}, {targetColor.b})
                    </span>
                  </div>
                  {/* Preset quick swatches */}
                  <div className="ml-auto flex items-center gap-1">
                    {[
                      { r: 255, g: 255, b: 255, label: "Putih" },
                      { r: 0, g: 0, b: 0, label: "Hitam" },
                      { r: 0, g: 177, b: 64, label: "Green" },
                      { r: 245, g: 245, b: 245, label: "Abu" },
                    ].map((sw, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTargetColor({ r: sw.r, g: sw.g, b: sw.b })}
                        className="h-4 w-4 rounded-full border border-zinc-700 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: `rgb(${sw.r},${sw.g},${sw.b})` }}
                        title={sw.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3: TOLERANCE & FEATHER SLIDERS */}
              <div className="flex flex-col gap-3.5 pt-2 border-t border-zinc-800/80">
                {/* Tolerance Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-medium">Toleransi Warna</span>
                    <span className="font-mono text-sky-400 font-semibold">{tolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="75"
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Sangat Ketat (1%)</span>
                    <span>Standar (22%)</span>
                    <span>Lebar (75%)</span>
                  </div>
                </div>

                {/* Feathering / Smoothness Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-medium">Kelembutan Tepi (Anti-Alias)</span>
                    <span className="font-mono text-sky-400 font-semibold">{feather} px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    value={feather}
                    onChange={(e) => setFeather(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Tegas (0px)</span>
                    <span>Halus (6px)</span>
                    <span>Blur (25px)</span>
                  </div>
                </div>

                {/* Defringe & Auto-trim Toggles */}
                <div className="flex flex-col gap-2 pt-1">
                  <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                    <span>Bersihkan Bias Warna Tepi (Defringe)</span>
                    <input
                      type="checkbox"
                      checked={defringe}
                      onChange={(e) => setDefringe(e.target.checked)}
                      className="accent-sky-400 h-4 w-4 rounded cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                    <span>Auto-Trim Margin Kosong</span>
                    <input
                      type="checkbox"
                      checked={autoTrim}
                      onChange={(e) => setAutoTrim(e.target.checked)}
                      className="accent-sky-400 h-4 w-4 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* SECTION 4: MANUAL TOUCH-UP BRUSH */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Kuas Touch-Up Manual</span>
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Undo</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTool(activeTool === "brush-erase" ? "select" : "brush-erase")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                      activeTool === "brush-erase"
                        ? "bg-zinc-800 text-sky-400 border-sky-500/50 font-semibold"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <Eraser className="h-3.5 w-3.5" />
                    <span>Hapus Sisa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool(activeTool === "brush-restore" ? "select" : "brush-restore")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
                      activeTool === "brush-restore"
                        ? "bg-zinc-800 text-sky-400 border-sky-500/50 font-semibold"
                        : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <Brush className="h-3.5 w-3.5" />
                    <span>Pulihkan Objek</span>
                  </button>
                </div>

                {(activeTool === "brush-erase" || activeTool === "brush-restore") && (
                  <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                    <span className="text-[11px] text-zinc-400">Ukuran Kuas:</span>
                    <input
                      type="range"
                      min="6"
                      max="80"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="flex-1 accent-sky-400 cursor-pointer"
                    />
                    <span className="font-mono text-zinc-300 text-[11px]">{brushSize}px</span>
                  </div>
                )}
              </div>

              {/* Reset Tool Action */}
              <button
                type="button"
                onClick={handleReset}
                className="mt-1 py-1.5 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs border border-zinc-800 transition-colors cursor-pointer"
              >
                Reset Semua Pengaturan
              </button>
            </div>

            {/* Right 8 Columns: Live Preview Viewport */}
            <div className="lg:col-span-8 flex flex-col gap-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              {/* Viewport Toolbar: Backdrop & Zoom */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                {/* Backdrop selector */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="text-[11px]">Latar Pratinjau:</span>
                  {[
                    { id: "checker", label: "Papan Catur (Transparan)" },
                    { id: "dark", label: "Gelap" },
                    { id: "light", label: "Terang" },
                    { id: "blue", label: "Kontras Biru" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBackdrop(b.id as BackdropMode)}
                      className={`h-5 w-5 rounded border cursor-pointer transition-all ${
                        backdrop === b.id ? "ring-2 ring-sky-400 scale-110" : "border-zinc-700 opacity-80"
                      }`}
                      style={{
                        background:
                          b.id === "checker"
                            ? "conic-gradient(#52525b 90deg, #27272a 90deg 180deg, #52525b 180deg 270deg, #27272a 270deg)"
                            : b.id === "dark"
                            ? "#09090b"
                            : b.id === "light"
                            ? "#ffffff"
                            : "#0284c7",
                      }}
                      title={b.label}
                    />
                  ))}
                </div>

                {/* Original Toggle & Zoom Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onMouseDown={() => setShowOriginal(true)}
                    onMouseUp={() => setShowOriginal(false)}
                    onTouchStart={() => setShowOriginal(true)}
                    onTouchEnd={() => setShowOriginal(false)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 font-medium select-none cursor-pointer"
                    title="Tekan dan tahan untuk melihat gambar asli"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Tahan untuk Gambar Asli</span>
                  </button>

                  <div className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
                      className="p-1 hover:text-white cursor-pointer"
                      title="Perkecil"
                    >
                      <ZoomOut className="h-3 w-3" />
                    </button>
                    <span className="font-mono text-[10px] px-1">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(3.0, z + 0.2))}
                      className="p-1 hover:text-white cursor-pointer"
                      title="Perbesar"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Canvas Stage */}
              <div
                className={`relative w-full h-[480px] rounded-xl border border-zinc-800 overflow-auto flex items-center justify-center p-4 select-none ${
                  activeTool === "eyedropper"
                    ? "cursor-crosshair"
                    : activeTool === "brush-erase" || activeTool === "brush-restore"
                    ? "cursor-cell"
                    : "cursor-default"
                }`}
                style={{
                  background:
                    backdrop === "checker"
                      ? "repeating-conic-gradient(#27272a 0% 25%, #18181b 0% 50%) 50% / 20px 20px"
                      : backdrop === "dark"
                      ? "#09090b"
                      : backdrop === "light"
                      ? "#ffffff"
                      : "#0284c7",
                }}
              >
                {/* Processed Transparent Canvas */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className={`max-w-none transition-transform duration-75 origin-center shadow-lg rounded ${
                    showOriginal ? "hidden" : "block"
                  }`}
                  style={{
                    transform: `scale(${zoom})`,
                  }}
                />

                {/* Original View Overlay (when toggled) */}
                {showOriginal && sourceImage && (
                  <img
                    src={sourceImage.src}
                    alt="Original"
                    className="max-w-none transition-transform duration-75 origin-center shadow-lg rounded"
                    style={{
                      transform: `scale(${zoom})`,
                    }}
                  />
                )}
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                <span>
                  {activeTool === "eyedropper"
                    ? "Mode Pipet: Klik pada warna yang ingin dihapus."
                    : activeTool === "brush-erase"
                    ? `Mode Kuas Hapus (${brushSize}px): Sapu pada sisa background.`
                    : activeTool === "brush-restore"
                    ? `Mode Kuas Pulihkan (${brushSize}px): Sapu pada bagian objek yang terhapus.`
                    : "Hasil transparan siap diekspor menjadi file .PNG murni."}
                </span>
                <span className="font-mono">100% Client-Side Canvas</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
