"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Upload,
  Download,
  PenTool,
  Stamp,
  Eraser,
  RotateCw,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Layers,
  Move,
  CornerDownLeft,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  PlacedElement,
  StampInkColor,
  StampEffectOptions,
  loadPdfJs,
  processWetInkStamp,
  removeSignatureBackground,
  generateOfficialRoundStamp,
  bakeElementsIntoPdf,
} from "./engine";

export default function PdfSignerGenerator() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.2);
  const [placedElements, setPlacedElements] = useState<PlacedElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Active Tool Panel: 'signature' | 'stamp'
  const [activeToolTab, setActiveToolTab] = useState<"signature" | "stamp">("signature");

  // Signature Draw State
  const [sigMode, setSigMode] = useState<"draw" | "upload">("draw");
  const [sigPenColor, setSigPenColor] = useState<string>("#1e3a8a"); // pen blue
  const [sigPenWidth, setSigPenWidth] = useState<number>(2.5);
  const [hasDrawnSig, setHasDrawnSig] = useState<boolean>(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);

  // Stamp State
  const [stampSourceMode, setStampSourceMode] = useState<"upload" | "generate">("generate");
  const [companyName, setCompanyName] = useState<string>("PT KARYA NUSANTARA GEMILANG");
  const [stampCenterText, setStampCenterText] = useState<string>("DISETUJUI");
  const [stampSubText, setStampSubText] = useState<string>("JAKARTA - 10 OKTOBER 2026");
  const [stampInkColor, setStampInkColor] = useState<StampInkColor>("blue");
  const [stampTexture, setStampTexture] = useState<number>(0.65);
  const [stampOpacity, setStampOpacity] = useState<number>(0.88);
  const [uploadedStampImg, setUploadedStampImg] = useState<HTMLImageElement | null>(null);
  const [stampPreviewUrl, setStampPreviewUrl] = useState<string>("");

  // Dragging & Resizing elements on PDF overlay
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureUploadInputRef = useRef<HTMLInputElement>(null);
  const stampUploadInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Load and parse PDF file
  const handlePdfUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") return;
    setPdfFile(file);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    setPdfBytes(bytes);

    try {
      const pdfjs = await loadPdfJs();
      const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
      const doc = await loadingTask.promise;
      setPdfDocProxy(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
      setPlacedElements([]);
    } catch (err) {
      console.error("Failed to load PDF with pdfjs", err);
      alert("Gagal membaca file PDF. Pastikan file valid.");
    }
  };

  // Render current PDF page
  useEffect(() => {
    if (!pdfDocProxy || !pdfCanvasRef.current) return;

    let isCancelled = false;
    const renderPage = async () => {
      try {
        const page = await pdfDocProxy.getPage(currentPage);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: zoomScale });
        const canvas = pdfCanvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        console.error("Error rendering PDF page", err);
      }
    };

    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [pdfDocProxy, currentPage, zoomScale]);

  // Update Stamp Preview
  useEffect(() => {
    const stampOpts: StampEffectOptions = {
      color: stampInkColor,
      textureIntensity: stampTexture,
      pressureIrregularity: 0.7,
      inkBleed: 0.6,
      opacity: stampOpacity,
    };

    if (stampSourceMode === "generate") {
      const generatedUrl = generateOfficialRoundStamp(
        companyName,
        stampCenterText,
        stampSubText,
        stampOpts
      );
      setStampPreviewUrl(generatedUrl);
    } else if (uploadedStampImg) {
      const processedUrl = processWetInkStamp(uploadedStampImg, stampOpts);
      setStampPreviewUrl(processedUrl);
    }
  }, [
    stampSourceMode,
    companyName,
    stampCenterText,
    stampSubText,
    stampInkColor,
    stampTexture,
    stampOpacity,
    uploadedStampImg,
  ]);

  // Signature Pad Drawing Handling
  const isDrawingSig = useRef(false);
  const lastSigPoint = useRef<{ x: number; y: number } | null>(null);

  const startSigDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    isDrawingSig.current = true;
    lastSigPoint.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const drawSig = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig.current || !lastSigPoint.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.strokeStyle = sigPenColor;
    ctx.lineWidth = sigPenWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Quadratic curve for natural smoothness
    ctx.beginPath();
    ctx.moveTo(lastSigPoint.current.x, lastSigPoint.current.y);
    const midX = (lastSigPoint.current.x + currentX) / 2;
    const midY = (lastSigPoint.current.y + currentY) / 2;
    ctx.quadraticCurveTo(lastSigPoint.current.x, lastSigPoint.current.y, midX, midY);
    ctx.stroke();

    lastSigPoint.current = { x: currentX, y: currentY };
    setHasDrawnSig(true);
  };

  const stopSigDraw = () => {
    isDrawingSig.current = false;
    lastSigPoint.current = null;
  };

  const clearSigPad = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSig(false);
  };

  // Add Signature to Document
  const handlePlaceSignature = () => {
    let dataUrl = "";
    if (sigMode === "draw") {
      const canvas = sigCanvasRef.current;
      if (!canvas || !hasDrawnSig) return;
      dataUrl = canvas.toDataURL("image/png");
    }

    if (!dataUrl) return;

    const newEl: PlacedElement = {
      id: `sig-${Date.now()}`,
      type: "signature",
      pageNumber: currentPage,
      x: 35, // centered horizontally
      y: 65, // bottom area
      width: 28,
      height: 14,
      dataUrl,
      opacity: 0.95,
      rotation: 0,
    };

    setPlacedElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  };

  // Handle Uploaded Signature Image
  const handleSignatureUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Auto remove paper background
        const cutOutUrl = removeSignatureBackground(img);
        const newEl: PlacedElement = {
          id: `sig-${Date.now()}`,
          type: "signature",
          pageNumber: currentPage,
          x: 35,
          y: 65,
          width: 28,
          height: 14,
          dataUrl: cutOutUrl,
          opacity: 0.95,
          rotation: 0,
        };
        setPlacedElements((prev) => [...prev, newEl]);
        setSelectedElementId(newEl.id);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Uploaded Stamp Image
  const handleStampUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setUploadedStampImg(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Add Stamp to Document
  const handlePlaceStamp = () => {
    if (!stampPreviewUrl) return;

    const newEl: PlacedElement = {
      id: `stamp-${Date.now()}`,
      type: "stamp",
      pageNumber: currentPage,
      x: 48,
      y: 62,
      width: 22,
      height: 22,
      dataUrl: stampPreviewUrl,
      opacity: stampOpacity,
      rotation: 0,
    };

    setPlacedElements((prev) => [...prev, newEl]);
    setSelectedElementId(newEl.id);
  };

  // Delete placed element
  const handleDeleteElement = (id: string) => {
    setPlacedElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Handle Dragging an element on the PDF stage
  const handleElementPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    elementId: string,
    action: "drag" | "resize"
  ) => {
    e.stopPropagation();
    setSelectedElementId(elementId);
    if (action === "drag") {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    setDragStartPos({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((!isDragging && !isResizing) || !selectedElementId || !pdfCanvasRef.current) return;

    const canvas = pdfCanvasRef.current;
    const deltaX = ((e.clientX - dragStartPos.x) / canvas.width) * 100;
    const deltaY = ((e.clientY - dragStartPos.y) / canvas.height) * 100;

    setPlacedElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedElementId) return el;

        if (isDragging) {
          return {
            ...el,
            x: Math.max(0, Math.min(100 - el.width, el.x + deltaX)),
            y: Math.max(0, Math.min(100 - el.height, el.y + deltaY)),
          };
        } else if (isResizing) {
          const newW = Math.max(6, Math.min(80, el.width + deltaX));
          const newH = Math.max(6, Math.min(80, el.height + deltaY));
          return {
            ...el,
            width: newW,
            height: newH,
          };
        }
        return el;
      })
    );

    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleStagePointerUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Export Signed PDF
  const handleExportSignedPdf = async () => {
    if (!pdfBytes || placedElements.length === 0) return;
    setIsExporting(true);
    try {
      const signedBytes = await bakeElementsIntoPdf(pdfBytes, placedElements);
      const blob = new Blob([signedBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Signed_${pdfFile?.name || "document.pdf"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error("Failed to export signed PDF", err);
      alert("Gagal membubuhkan tanda tangan ke PDF. Pastikan file valid.");
    } finally {
      setIsExporting(false);
    }
  };

  const currentPageElements = useMemo(() => {
    return placedElements.filter((el) => el.pageNumber === currentPage);
  }, [placedElements, currentPage]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-16">
      {/* Hidden PDF Upload Input */}
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
      />
      <input
        ref={signatureUploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) =>
          e.target.files?.[0] && handleSignatureUpload(e.target.files[0])
        }
      />
      <input
        ref={stampUploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleStampUpload(e.target.files[0])}
      />

      {!pdfFile ? (
        /* Empty State: PDF Upload Dropzone */
        <div className="flex flex-col items-center justify-center p-8 sm:p-14 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center gap-6">
          <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center border border-zinc-700 text-sky-400 shadow-inner">
            <FileText className="h-8 w-8" />
          </div>

          <div className="max-w-md">
            <h2 className="text-lg font-bold text-white">
              Tanda Tangan & Cap Basah PDF
            </h2>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
              Buka dokumen PDF kamu, bubuhkan tanda tangan (bisa gambar langsung
              atau upload), dan tambahkan cap perusahaan dengan tekstur tinta basah
              autentik.
            </p>
          </div>

          <button
            onClick={() => pdfInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Pilih File Dokumen PDF</span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/80 w-full max-w-md">
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> TTD Pulpen Halus
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Efek Cap Basah Nyata
            </span>
            <span className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> 100% Aman di Browser
            </span>
          </div>
        </div>
      ) : (
        /* Active PDF Signing Workspace */
        <div className="flex flex-col gap-5">
          {/* Top Control Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-zinc-200">
                Hal {currentPage} dari {numPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 cursor-pointer"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <button
                onClick={() => setZoomScale((z) => Math.max(0.8, z - 0.2))}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                title="Perkecil"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 font-mono text-[11px]">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((z) => Math.min(2.0, z + 0.2))}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                title="Perbesar"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Change File & Download Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => pdfInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 border border-zinc-700 cursor-pointer"
              >
                Ganti PDF
              </button>
              <button
                onClick={handleExportSignedPdf}
                disabled={isExporting || placedElements.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>
                  {isExporting ? "Menyusun PDF..." : "Download PDF Bertanda Tangan"}
                </span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: Interactive Tools Drawer (Signature & Stamp) */}
            <div className="lg:col-span-5 flex flex-col gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              {/* Tool Mode Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-zinc-950 border border-zinc-800">
                <button
                  onClick={() => setActiveToolTab("signature")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    activeToolTab === "signature"
                      ? "bg-zinc-800 text-sky-400 shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <PenTool className="h-3.5 w-3.5" />
                  <span>Tanda Tangan</span>
                </button>
                <button
                  onClick={() => setActiveToolTab("stamp")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    activeToolTab === "stamp"
                      ? "bg-zinc-800 text-sky-400 shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Stamp className="h-3.5 w-3.5" />
                  <span>Cap Perusahaan</span>
                </button>
              </div>

              {/* TAB 1: SIGNATURE CONTROLS */}
              {activeToolTab === "signature" && (
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSigMode("draw")}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          sigMode === "draw"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Gambar Langsung
                      </button>
                      <button
                        onClick={() => {
                          setSigMode("upload");
                          signatureUploadInputRef.current?.click();
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          sigMode === "upload"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Upload Foto TTD
                      </button>
                    </div>

                    {sigMode === "draw" && (
                      <button
                        onClick={clearSigPad}
                        className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-rose-400 cursor-pointer"
                        title="Hapus Goresan"
                      >
                        <Eraser className="h-3 w-3" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  {/* Draw Signature Pad */}
                  {sigMode === "draw" && (
                    <div className="flex flex-col gap-2">
                      <div className="relative h-40 w-full rounded-xl bg-white border border-zinc-700 overflow-hidden shadow-inner touch-none">
                        <canvas
                          ref={sigCanvasRef}
                          width={440}
                          height={160}
                          onPointerDown={startSigDraw}
                          onPointerMove={drawSig}
                          onPointerUp={stopSigDraw}
                          className="w-full h-full cursor-crosshair touch-none"
                        />
                        {!hasDrawnSig && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-400 text-xs italic">
                            Tanda tangan di sini dengan jari / mouse
                          </div>
                        )}
                      </div>

                      {/* Pen Options */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-zinc-400">Tinta:</span>
                          {[
                            { color: "#1e3a8a", label: "Biru" },
                            { color: "#09090b", label: "Hitam" },
                          ].map((c) => (
                            <button
                              key={c.color}
                              onClick={() => setSigPenColor(c.color)}
                              className={`h-5 w-5 rounded-full border-2 cursor-pointer transition-all ${
                                sigPenColor === c.color
                                  ? "border-sky-400 scale-110"
                                  : "border-transparent"
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.label}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-zinc-400">Tebal:</span>
                          {[1.8, 2.5, 3.5].map((w) => (
                            <button
                              key={w}
                              onClick={() => setSigPenWidth(w)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                                sigPenWidth === w
                                  ? "bg-sky-500/20 text-sky-400 font-bold"
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              {w}px
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handlePlaceSignature}
                        disabled={!hasDrawnSig}
                        className="mt-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs cursor-pointer disabled:opacity-40 transition-all"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Tempelkan TTD ke Halaman Dokumen</span>
                      </button>
                    </div>
                  )}

                  {sigMode === "upload" && (
                    <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 text-center gap-2">
                      <p className="text-xs text-zinc-300 font-medium">
                        Upload foto tanda tangan dari kertas
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Background kertas otomatis dibersihkan dan dibuat transparan
                      </p>
                      <button
                        onClick={() => signatureUploadInputRef.current?.click()}
                        className="mt-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white border border-zinc-700 cursor-pointer"
                      >
                        Pilih Gambar TTD
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: STAMP / CAP PERUSAHAAN (CAP BASAH) CONTROLS */}
              {activeToolTab === "stamp" && (
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      onClick={() => setStampSourceMode("generate")}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        stampSourceMode === "generate"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Buat Stempel Resmi
                    </button>
                    <button
                      onClick={() => {
                        setStampSourceMode("upload");
                        stampUploadInputRef.current?.click();
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        stampSourceMode === "upload"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Upload Gambar Cap
                    </button>
                  </div>

                  {/* Stamp Generator Inputs */}
                  {stampSourceMode === "generate" ? (
                    <div className="flex flex-col gap-2.5 text-xs">
                      <div>
                        <label className="text-[11px] font-medium text-zinc-400">
                          Nama Perusahaan / Organisasi
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-zinc-100 text-xs font-medium focus:border-sky-500 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-medium text-zinc-400">
                            Teks Tengah
                          </label>
                          <input
                            type="text"
                            value={stampCenterText}
                            onChange={(e) => setStampCenterText(e.target.value)}
                            className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-zinc-100 text-xs font-bold focus:border-sky-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-zinc-400">
                            Kota / Keterangan
                          </label>
                          <input
                            type="text"
                            value={stampSubText}
                            onChange={(e) => setStampSubText(e.target.value)}
                            className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 text-zinc-100 text-xs font-medium focus:border-sky-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                      <span className="text-zinc-400">
                        {uploadedStampImg
                          ? "Gambar cap berhasil dimuat"
                          : "Belum ada gambar cap"}
                      </span>
                      <button
                        onClick={() => stampUploadInputRef.current?.click()}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-white cursor-pointer"
                      >
                        Pilih Gambar
                      </button>
                    </div>
                  )}

                  {/* Physical Wet Ink Effects Options */}
                  <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-800">
                    <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-sky-400" />
                      <span>Efek Cap Basah Autentik</span>
                    </span>

                    {/* Color Presets */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] text-zinc-400">Warna Tinta:</span>
                      {[
                        { id: "blue", label: "Biru Stempel", color: "#1e40af" },
                        { id: "red", label: "Merah Dinas", color: "#b91c1c" },
                        { id: "purple", label: "Ungu", color: "#6d28d9" },
                        { id: "green", label: "Hijau", color: "#15803d" },
                      ].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setStampInkColor(c.id as StampInkColor)}
                          className={`h-5 w-5 rounded-full border-2 cursor-pointer transition-all ${
                            stampInkColor === c.id
                              ? "border-sky-400 scale-110"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                      ))}
                    </div>

                    {/* Texture & Porosity Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-medium">Tekstur Tinta Meresap</span>
                        <span className="text-zinc-300 font-mono">
                          {Math.round(stampTexture * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={stampTexture}
                        onChange={(e) => setStampTexture(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                      />
                    </div>

                    {/* Opacity Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-medium">Transparansi Alami Cap</span>
                        <span className="text-zinc-300 font-mono">
                          {Math.round(stampOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.6}
                        max={1.0}
                        step={0.02}
                        value={stampOpacity}
                        onChange={(e) => setStampOpacity(Number(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                      />
                    </div>
                  </div>

                  {/* Stamp Live Preview Box */}
                  {stampPreviewUrl && (
                    <div className="flex items-center justify-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <img
                        src={stampPreviewUrl}
                        alt="Stamp Preview"
                        className="h-28 w-28 object-contain filter drop-shadow-sm"
                      />
                    </div>
                  )}

                  <button
                    onClick={handlePlaceStamp}
                    disabled={!stampPreviewUrl}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs cursor-pointer disabled:opacity-40 transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Tempelkan Cap ke Halaman Dokumen</span>
                  </button>
                </div>
              )}

              {/* Placed Elements List / Quick Remover */}
              {placedElements.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
                  <span className="text-[11px] font-semibold text-zinc-400">
                    Elemen Tertempel ({placedElements.length})
                  </span>
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                    {placedElements.map((el, i) => (
                      <div
                        key={el.id}
                        onClick={() => {
                          setCurrentPage(el.pageNumber);
                          setSelectedElementId(el.id);
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedElementId === el.id
                            ? "bg-sky-500/10 border-sky-400 text-white"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {el.type === "signature" ? (
                            <PenTool className="h-3.5 w-3.5 text-sky-400" />
                          ) : (
                            <Stamp className="h-3.5 w-3.5 text-amber-400" />
                          )}
                          <span>
                            {el.type === "signature" ? "Tanda Tangan" : "Cap Perusahaan"}{" "}
                            (Hal {el.pageNumber})
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteElement(el.id);
                          }}
                          className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: PDF Viewer Stage & Movable Overlays */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div
                ref={pdfContainerRef}
                onPointerMove={handleStagePointerMove}
                onPointerUp={handleStagePointerUp}
                className="relative bg-zinc-950 rounded-xl border border-zinc-800 p-2 sm:p-4 overflow-auto max-h-[720px] flex items-center justify-center select-none shadow-2xl"
              >
                <div className="relative inline-block border border-zinc-700/60 shadow-xl bg-white">
                  {/* PDF Canvas */}
                  <canvas ref={pdfCanvasRef} className="block max-w-full" />

                  {/* Overlaid Placed Elements on Current Page */}
                  {currentPageElements.map((el) => {
                    const isSelected = selectedElementId === el.id;
                    return (
                      <div
                        key={el.id}
                        onPointerDown={(e) => handleElementPointerDown(e, el.id, "drag")}
                        style={{
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          width: `${el.width}%`,
                          height: `${el.height}%`,
                          opacity: el.opacity,
                          transform: `rotate(${el.rotation}deg)`,
                        }}
                        className={`absolute touch-none select-none cursor-move flex items-center justify-center group ${
                          isSelected
                            ? "ring-2 ring-sky-400 ring-offset-1 ring-offset-black/50"
                            : "hover:ring-1 hover:ring-sky-400/50"
                        }`}
                      >
                        <img
                          src={el.dataUrl}
                          alt={el.type}
                          className="h-full w-full object-contain pointer-events-none"
                        />

                        {/* Selected Controls */}
                        {isSelected && (
                          <>
                            {/* Resize Handle on bottom-right */}
                            <div
                              onPointerDown={(e) =>
                                handleElementPointerDown(e, el.id, "resize")
                              }
                              className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-sky-400 border-2 border-white cursor-se-resize shadow-md"
                              title="Tarik untuk Ubah Ukuran"
                            />

                            {/* Delete Button on top-right */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteElement(el.id);
                              }}
                              className="absolute -top-3 -right-3 h-5 w-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md cursor-pointer hover:bg-rose-400"
                              title="Hapus Elemen Ini"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Helper footnote */}
              <p className="text-[11px] text-zinc-500 text-center">
                Klik dan seret tanda tangan / cap di atas dokumen untuk memindahkannya.
                Gunakan titik biru di sudut kanan-bawah untuk mengubah ukuran.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
