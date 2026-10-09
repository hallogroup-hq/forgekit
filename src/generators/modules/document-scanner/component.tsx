"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Camera,
  Upload,
  FileText,
  RotateCw,
  Crop,
  Sliders,
  Check,
  Plus,
  Trash2,
  Download,
  FileImage,
  RefreshCw,
  Layers,
  Sparkles,
  Maximize2,
  ZoomIn,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  PerspectiveQuad,
  Point,
  ScanFilterMode,
  ScannedPage,
  getDefaultQuad,
  warpPerspective,
  applyScanFilters,
  exportPagesToPdf,
} from "./engine";

export default function DocumentScannerGenerator() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"crop" | "filter">("crop");
  const [draggingCorner, setDraggingCorner] = useState<keyof PerspectiveQuad | null>(null);
  const [loupePos, setLoupePos] = useState<Point | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [pdfPageSize, setPdfPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [pdfQuality, setPdfQuality] = useState<number>(0.9);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const filterCanvasRef = useRef<HTMLCanvasElement>(null);

  const currentPage = pages[activePageIndex] || null;

  // Handle image files from upload or camera
  const handleAddFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const newQuad = getDefaultQuad(img.naturalWidth, img.naturalHeight, 0.04);
          const newPage: ScannedPage = {
            id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            originalImage: img,
            originalDataUrl: dataUrl,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            quad: newQuad,
            filters: {
              mode: "magic-color",
              brightness: 0,
              contrast: 15,
              shadowSuppression: 45,
              rotation: 0,
            },
          };

          // Automatically pre-process initial warp & filter
          const warped = warpPerspective(newPage.originalImage, newPage.quad);
          const filtered = applyScanFilters(warped, newPage.filters);
          newPage.processedCanvas = filtered;
          newPage.processedDataUrl = filtered.toDataURL("image/jpeg", 0.9);

          setPages((prev) => {
            const nextPages = [...prev, newPage];
            return nextPages;
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Update warped/filtered output when quad or filters change
  const refreshProcessedPage = useCallback(
    (page: ScannedPage) => {
      try {
        const warped = warpPerspective(page.originalImage, page.quad);
        const filtered = applyScanFilters(warped, page.filters);
        page.processedCanvas = filtered;
        page.processedDataUrl = filtered.toDataURL("image/jpeg", 0.92);

        setPages((prev) =>
          prev.map((p) => (p.id === page.id ? { ...page } : p))
        );
      } catch (err) {
        console.error("Failed to process page filters", err);
      }
    },
    []
  );

  // Render crop canvas with quad handles
  useEffect(() => {
    if (activeTab !== "crop" || !currentPage || !cropCanvasRef.current) return;

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = currentPage.originalImage;
    const containerWidth = canvas.parentElement?.clientWidth || 600;
    const maxDisplayHeight = 520;

    // Calculate canvas display scale
    const scale = Math.min(
      containerWidth / img.naturalWidth,
      maxDisplayHeight / img.naturalHeight
    );

    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const quad = currentPage.quad;
    const tl = { x: quad.tl.x * scale, y: quad.tl.y * scale };
    const tr = { x: quad.tr.x * scale, y: quad.tr.y * scale };
    const br = { x: quad.br.x * scale, y: quad.br.y * scale };
    const bl = { x: quad.bl.x * scale, y: quad.bl.y * scale };

    // Dim background outside quad
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cutout / highlight quad interior
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Quad interior subtle tint
    ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
    ctx.fill();
    ctx.restore();

    // Quad border lines
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#38bdf8"; // bright sky-400
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.stroke();

    // Draw 4 corner handles
    const handleRadius = 11;
    const corners = [
      { key: "tl", pt: tl },
      { key: "tr", pt: tr },
      { key: "br", pt: br },
      { key: "bl", pt: bl },
    ];

    corners.forEach(({ pt, key }) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = draggingCorner === key ? "#38bdf8" : "#ffffff";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#0284c7";
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#0369a1";
      ctx.fill();
    });

    // Draw magnifier loupe if dragging
    if (draggingCorner && loupePos) {
      const loupeRadius = 45;
      const cornerPt =
        draggingCorner === "tl" ? tl :
        draggingCorner === "tr" ? tr :
        draggingCorner === "br" ? br : bl;

      // Position loupe offset to avoid finger occlusion
      const lx = Math.min(Math.max(loupeRadius + 10, cornerPt.x), canvas.width - loupeRadius - 10);
      const ly = Math.max(loupeRadius + 15, cornerPt.y - 75);

      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, loupeRadius, 0, Math.PI * 2);
      ctx.clip();

      // Zoom factor: 2.2x
      const zoom = 2.2;
      const rawCorner = currentPage.quad[draggingCorner];
      ctx.drawImage(
        img,
        rawCorner.x - loupeRadius / (scale * zoom),
        rawCorner.y - loupeRadius / (scale * zoom),
        (loupeRadius * 2) / (scale * zoom),
        (loupeRadius * 2) / (scale * zoom),
        lx - loupeRadius,
        ly - loupeRadius,
        loupeRadius * 2,
        loupeRadius * 2
      );

      // Loupe crosshair
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
      ctx.beginPath();
      ctx.moveTo(lx - loupeRadius, ly);
      ctx.lineTo(lx + loupeRadius, ly);
      ctx.moveTo(lx, ly - loupeRadius);
      ctx.lineTo(lx, ly + loupeRadius);
      ctx.stroke();

      ctx.restore();

      // Loupe border & shadow
      ctx.beginPath();
      ctx.arc(lx, ly, loupeRadius, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }
  }, [currentPage, activeTab, draggingCorner, loupePos]);

  // Render filter preview
  useEffect(() => {
    if (activeTab !== "filter" || !currentPage || !filterCanvasRef.current) return;
    const canvas = filterCanvasRef.current;
    if (currentPage.processedCanvas) {
      canvas.width = currentPage.processedCanvas.width;
      canvas.height = currentPage.processedCanvas.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(currentPage.processedCanvas, 0, 0);
    }
  }, [currentPage, activeTab, currentPage?.processedCanvas]);

  // Dragging corner points on the canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentPage || !cropCanvasRef.current) return;
    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const scale = canvas.width / currentPage.originalWidth;
    const quad = currentPage.quad;

    const corners: { key: keyof PerspectiveQuad; x: number; y: number }[] = [
      { key: "tl", x: quad.tl.x * scale, y: quad.tl.y * scale },
      { key: "tr", x: quad.tr.x * scale, y: quad.tr.y * scale },
      { key: "br", x: quad.br.x * scale, y: quad.br.y * scale },
      { key: "bl", x: quad.bl.x * scale, y: quad.bl.y * scale },
    ];

    // Detection radius: 35px for easy finger touch on mobile
    const hit = corners.find((c) => Math.hypot(c.x - clickX, c.y - clickY) < 36);
    if (hit) {
      setDraggingCorner(hit.key);
      setLoupePos({ x: clickX, y: clickY });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingCorner || !currentPage || !cropCanvasRef.current) return;
    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const currX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const currY = (e.clientY - rect.top) * (canvas.height / rect.height);

    setLoupePos({ x: currX, y: currY });

    const scale = canvas.width / currentPage.originalWidth;
    const rawX = Math.max(0, Math.min(currentPage.originalWidth, currX / scale));
    const rawY = Math.max(0, Math.min(currentPage.originalHeight, currY / scale));

    const updatedQuad: PerspectiveQuad = {
      ...currentPage.quad,
      [draggingCorner]: { x: rawX, y: rawY },
    };

    const updatedPage: ScannedPage = {
      ...currentPage,
      quad: updatedQuad,
    };

    setPages((prev) =>
      prev.map((p) => (p.id === updatedPage.id ? updatedPage : p))
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingCorner && currentPage) {
      setDraggingCorner(null);
      setLoupePos(null);
      refreshProcessedPage(currentPage);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Preset Corners
  const setPresetQuad = (mode: "full" | "inset") => {
    if (!currentPage) return;
    const margin = mode === "full" ? 0 : 0.05;
    const newQuad = getDefaultQuad(currentPage.originalWidth, currentPage.originalHeight, margin);
    const updated = { ...currentPage, quad: newQuad };
    setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    refreshProcessedPage(updated);
  };

  // Change filter mode or slider
  const handleUpdateFilter = (key: keyof ScannedPage["filters"], value: any) => {
    if (!currentPage) return;
    const updated: ScannedPage = {
      ...currentPage,
      filters: {
        ...currentPage.filters,
        [key]: value,
      },
    };
    refreshProcessedPage(updated);
  };

  const handleRotate = () => {
    if (!currentPage) return;
    const nextRot = (currentPage.filters.rotation + 90) % 360;
    handleUpdateFilter("rotation", nextRot);
  };

  const handleDeletePage = (index: number) => {
    setPages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (activePageIndex >= next.length) {
        setActivePageIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  // Export to PDF
  const handleExportPdf = async () => {
    if (pages.length === 0) return;
    setIsExporting(true);
    try {
      const processedList = pages.map((p) => {
        if (!p.processedCanvas) {
          const warped = warpPerspective(p.originalImage, p.quad);
          return { canvas: applyScanFilters(warped, p.filters) };
        }
        return { canvas: p.processedCanvas };
      });

      const pdfBytes = await exportPagesToPdf(processedList, {
        pageSize: pdfPageSize,
        quality: pdfQuality,
        documentTitle: `Scanned_Document_${Date.now()}`,
      });

      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Document_Scan_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 },
      });
    } catch (err) {
      console.error("PDF Export error:", err);
      alert("Gagal mengekspor PDF. Pastikan gambar terbaca dengan benar.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export current page as JPEG
  const handleExportSingleImage = () => {
    if (!currentPage?.processedCanvas) return;
    const url = currentPage.processedCanvas.toDataURL("image/jpeg", 0.95);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Scan_Page_${activePageIndex + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16">
      {/* Hidden File / Camera Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
      />

      {/* Top Welcome / Empty State if no pages */}
      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-14 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700 text-sky-400 shadow-inner">
            <Camera className="h-8 w-8" />
          </div>

          <div className="max-w-md">
            <h2 className="text-lg font-bold text-white">
              Scan Dokumen & Kertas ke PDF
            </h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Foto dokumen langsung pakai kamera HP atau upload dari galeri.
              Sudut kertas otomatis diluruskan, bayangan dibersihkan, dan diubah
              menjadi file PDF resolusi tinggi.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <span>Buka Kamera HP</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs border border-zinc-700 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Foto</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/80 w-full max-w-md">
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Auto Perspective
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Shadow Remover
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Multi-Halaman PDF
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Top Multi-page Strip & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            {/* Page thumbnails strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => setActivePageIndex(idx)}
                  className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    idx === activePageIndex
                      ? "bg-zinc-800 border-sky-400 text-white font-bold"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-sky-400" />
                  <span>Hal {idx + 1}</span>
                  {pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(idx);
                      }}
                      className="text-zinc-500 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                      title="Hapus Halaman"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add Page Button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 cursor-pointer whitespace-nowrap"
                title="Tambah Halaman Baru"
              >
                <Plus className="h-3.5 w-3.5 text-sky-400" />
                <span>Tambah</span>
              </button>
            </div>

            {/* Quick Upload More */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium border border-zinc-700 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload</span>
              </button>
            </div>
          </div>

          {/* Main Stage Grid: Workspace & Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Interactive Canvas Workspace */}
            <div className="lg:col-span-8 flex flex-col gap-3">
              {/* Workspace Tab Selector */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab("crop")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "crop"
                        ? "bg-sky-500/10 border border-sky-500/30 text-sky-400"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Crop className="h-3.5 w-3.5" />
                    <span>1. Atur Sudut & Crop</span>
                  </button>
                  <button
                    onClick={() => {
                      if (currentPage) refreshProcessedPage(currentPage);
                      setActiveTab("filter");
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "filter"
                        ? "bg-sky-500/10 border border-sky-500/30 text-sky-400"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>2. Filter Scanner</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span>Halaman {activePageIndex + 1} dari {pages.length}</span>
                </div>
              </div>

              {/* Canvas Container */}
              <div className="relative min-h-[380px] sm:min-h-[460px] bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden p-2">
                {activeTab === "crop" ? (
                  <div className="relative flex items-center justify-center w-full touch-none select-none">
                    <canvas
                      ref={cropCanvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="cursor-crosshair max-w-full rounded shadow-xl touch-none"
                    />
                    {/* Helper guide badge */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900/90 border border-zinc-700/80 px-3 py-1 text-[11px] text-zinc-300 font-medium pointer-events-none shadow-md backdrop-blur-sm">
                      Geser 4 titik sudut biru ke ujung kertas
                    </div>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center w-full max-h-[520px] overflow-auto">
                    <canvas
                      ref={filterCanvasRef}
                      className="max-w-full max-h-[500px] object-contain rounded shadow-xl border border-zinc-800"
                    />
                  </div>
                )}
              </div>

              {/* Crop Stage Quick Toolbar */}
              {activeTab === "crop" && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPresetQuad("full")}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    >
                      Penuh (100%)
                    </button>
                    <button
                      onClick={() => setPresetQuad("inset")}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    >
                      Reset Sudut
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (currentPage) refreshProcessedPage(currentPage);
                      setActiveTab("filter");
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold cursor-pointer"
                  >
                    <span>Lanjut ke Filter</span>
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Adjustments & Filter Panel */}
            <div className="lg:col-span-4 flex flex-col gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  <span>Koreksi Scanner</span>
                </h3>
                <button
                  onClick={handleRotate}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 font-medium cursor-pointer"
                  title="Putar 90 Derajat"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Putar</span>
                </button>
              </div>

              {/* Filter Preset Buttons */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-zinc-400">
                  Mode Dokumen
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: "magic-color", label: "Magic Color", sub: "Putihkan kertas" },
                    { id: "bw-clean", label: "Hitam Putih", sub: "Teks tajam" },
                    { id: "grayscale", label: "Grayscale", sub: "Monokrom halus" },
                    { id: "enhanced", label: "Warna Cerah", sub: "Pertahankan foto" },
                    { id: "original", label: "Original", sub: "Tanpa filter" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        handleUpdateFilter("mode", f.id);
                        if (activeTab === "crop") setActiveTab("filter");
                      }}
                      className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        currentPage?.filters.mode === f.id
                          ? "bg-sky-500/10 border-sky-400 text-white"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span className="font-bold text-xs">{f.label}</span>
                      <span className="text-[10px] text-zinc-500">{f.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fine Tuning Sliders */}
              <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
                {/* Shadow Suppression */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-medium">Hapus Bayangan</span>
                    <span className="text-zinc-300 font-mono">
                      {currentPage?.filters.shadowSuppression || 0}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={currentPage?.filters.shadowSuppression || 0}
                    onChange={(e) =>
                      handleUpdateFilter("shadowSuppression", Number(e.target.value))
                    }
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>

                {/* Brightness */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-medium">Kecerahan</span>
                    <span className="text-zinc-300 font-mono">
                      {currentPage?.filters.brightness || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={currentPage?.filters.brightness || 0}
                    onChange={(e) =>
                      handleUpdateFilter("brightness", Number(e.target.value))
                    }
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>

                {/* Contrast */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-medium">Kontras</span>
                    <span className="text-zinc-300 font-mono">
                      {currentPage?.filters.contrast || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={currentPage?.filters.contrast || 0}
                    onChange={(e) =>
                      handleUpdateFilter("contrast", Number(e.target.value))
                    }
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
              </div>

              {/* Single Image Quick Download */}
              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={handleExportSingleImage}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 cursor-pointer"
                >
                  <FileImage className="h-3.5 w-3.5" />
                  <span>Download JPEG Halaman Ini</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Export Bar: PDF Settings & Final Download */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 mt-2">
            <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-medium">Ukuran Kertas:</span>
                <select
                  value={pdfPageSize}
                  onChange={(e) => setPdfPageSize(e.target.value as any)}
                  className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-zinc-200 text-xs cursor-pointer"
                >
                  <option value="a4">A4 Standar</option>
                  <option value="letter">Letter</option>
                  <option value="fit">Sesuai Asli (Fit)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-medium">Kualitas:</span>
                <select
                  value={pdfQuality}
                  onChange={(e) => setPdfQuality(Number(e.target.value))}
                  className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-zinc-200 text-xs cursor-pointer"
                >
                  <option value={0.92}>Tinggi (Cetak)</option>
                  <option value={0.8}>Standar</option>
                  <option value={0.65}>Kompresi Kecil</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExportPdf}
              disabled={isExporting || pages.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>
                {isExporting
                  ? "Menyusun PDF..."
                  : `Unduh Dokumen PDF (${pages.length} Halaman)`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
