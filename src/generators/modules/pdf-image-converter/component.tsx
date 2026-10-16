"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Download,
  Image as ImageIcon,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Archive,
  AlertCircle,
  FileImage,
} from "lucide-react";
import JSZip from "jszip";
import {
  ImageToPdfItem,
  PageSizeOption,
  MarginOption,
  compileImagesToPdf,
} from "./engine";

export default function PdfImageConverter() {
  const [mode, setMode] = useState<"image-to-pdf" | "pdf-to-image">("image-to-pdf");

  // Mode 1: Image to PDF state
  const [imageItems, setImageItems] = useState<ImageToPdfItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>("a4-portrait");
  const [margin, setMargin] = useState<MarginOption>("small");
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);

  // Mode 2: PDF to Image state
  const [extractedPages, setExtractedPages] = useState<{ pageNumber: number; dataUrl: string }[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");
  const [pdfFileName, setPdfFileName] = useState("document");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const imgInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers for Mode 1: Image to PDF ---
  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) return;
        const dataUrl = event.target.result as string;

        const img = new Image();
        img.onload = () => {
          setImageItems((prev) => [
            ...prev,
            {
              id: "img_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
              name: file.name,
              dataUrl,
              width: img.width,
              height: img.height,
            },
          ]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });

    if (imgInputRef.current) imgInputRef.current.value = "";
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    const targetIdx = direction === "left" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= imageItems.length) return;
    const items = [...imageItems];
    const [moved] = items.splice(index, 1);
    items.splice(targetIdx, 0, moved);
    setImageItems(items);
  };

  const handleDeleteImage = (id: string) => {
    setImageItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDownloadPdf = async () => {
    if (imageItems.length === 0) return;
    setIsCompilingPdf(true);
    try {
      const pdfBytes = await compileImagesToPdf(imageItems, { pageSize, margin });
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `images-compiled-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed", err);
      setErrorMsg("Gagal membuat PDF dari gambar. Pastikan gambar valid.");
    } finally {
      setIsCompilingPdf(false);
    }
  };

  // --- Handlers for Mode 2: PDF to Image ---
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setErrorMsg(null);
    setPdfFileName(file.name.replace(/\.[^/.]+$/, ""));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjs = await import("pdfjs-dist");
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      }

      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const totalPages = pdfDoc.numPages;

      const results: { pageNumber: number; dataUrl: string }[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x sharp scale

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // @ts-expect-error - canvas render context
        await page.render({ canvasContext: ctx, viewport }).promise;

        const mime = exportFormat === "png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mime, 0.92);
        results.push({ pageNumber: pageNum, dataUrl });
      }

      setExtractedPages(results);
    } catch (err) {
      console.error("PDF extraction error", err);
      setErrorMsg("Gagal mengekstrak halaman PDF. Pastikan file valid.");
    } finally {
      setIsExtracting(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  const handleDownloadAllImagesZip = async () => {
    if (extractedPages.length === 0) return;
    const zip = new JSZip();
    const ext = exportFormat === "png" ? "png" : "jpg";

    extractedPages.forEach((p) => {
      const base64 = p.dataUrl.split(",")[1];
      zip.file(`${pdfFileName}-page-${p.pageNumber}.${ext}`, base64, { base64: true });
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pdfFileName}-images.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSinglePage = (pageNumber: number, dataUrl: string) => {
    const ext = exportFormat === "png" ? "png" : "jpg";
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${pdfFileName}-page-${pageNumber}.${ext}`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Image to PDF & PDF to Image
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Konversi kumpulan foto ke dokumen PDF A4, atau ekstrak seluruh halaman PDF menjadi gambar resolusi tinggi.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 p-0.5 text-xs">
          <button
            onClick={() => setMode("image-to-pdf")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              mode === "image-to-pdf"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <ImageIcon size={13} />
            Images to PDF
          </button>
          <button
            onClick={() => setMode("pdf-to-image")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              mode === "pdf-to-image"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <FileImage size={13} />
            PDF to Images
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
          <AlertCircle size={14} className="text-zinc-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* MODE 1: IMAGES TO PDF */}
      {mode === "image-to-pdf" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => imgInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-medium hover:opacity-90 transition"
              >
                <Plus size={13} />
                Tambah Gambar
              </button>
              <input
                ref={imgInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImagesUpload}
              />
              <span className="text-zinc-500 ml-2">
                {imageItems.length} gambar dipilih
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Ukuran Kertas:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                  className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                >
                  <option value="a4-portrait">A4 Portrait</option>
                  <option value="a4-landscape">A4 Landscape</option>
                  <option value="fit">Fit Sesuai Gambar</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Margin:</span>
                <select
                  value={margin}
                  onChange={(e) => setMargin(e.target.value as MarginOption)}
                  className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                >
                  <option value="none">Tanpa Margin</option>
                  <option value="small">Sedang (10mm)</option>
                  <option value="normal">Normal (20mm)</option>
                </select>
              </div>

              {imageItems.length > 0 && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={isCompilingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-semibold shadow-sm hover:opacity-90 transition"
                >
                  <Download size={13} />
                  {isCompilingPdf ? "Mengompilasi..." : "Download PDF"}
                </button>
              )}
            </div>
          </div>

          {/* Grid of uploaded images */}
          {imageItems.length === 0 ? (
            <div
              onClick={() => imgInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3 transition bg-zinc-50/50 dark:bg-zinc-900/20"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <ImageIcon size={24} />
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Pilih atau seret gambar ke sini
              </p>
              <p className="text-xs text-zinc-500">
                Mendukung format PNG, JPG, JPEG, WebP
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {imageItems.map((item, index) => (
                <div
                  key={item.id}
                  className="relative group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between shadow-sm"
                >
                  <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-950 rounded overflow-hidden flex items-center justify-center relative">
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-mono font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <button
                        disabled={index === 0}
                        onClick={() => handleMoveImage(index, "left")}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        disabled={index === imageItems.length - 1}
                        onClick={() => handleMoveImage(index, "right")}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteImage(item.id)}
                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 2: PDF TO IMAGES */}
      {mode === "pdf-to-image" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => pdfInputRef.current?.click()}
                disabled={isExtracting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-medium hover:opacity-90 transition"
              >
                <Upload size={13} />
                Pilih File PDF
              </button>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
              {isExtracting && (
                <span className="text-zinc-500 animate-pulse ml-2">
                  Mengekstrak halaman PDF...
                </span>
              )}
            </div>

            {extractedPages.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500">Format Gambar:</span>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as "png" | "jpeg")}
                    className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 uppercase"
                  >
                    <option value="png">PNG (Lossless)</option>
                    <option value="jpeg">JPG (Kompak)</option>
                  </select>
                </div>
                <button
                  onClick={handleDownloadAllImagesZip}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-semibold shadow-sm hover:opacity-90 transition"
                >
                  <Archive size={13} />
                  Download Semua (.ZIP)
                </button>
              </div>
            )}
          </div>

          {/* Grid of extracted pages */}
          {extractedPages.length === 0 ? (
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3 transition bg-zinc-50/50 dark:bg-zinc-900/20"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <FileImage size={24} />
              </div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Pilih atau seret file PDF ke sini
              </p>
              <p className="text-xs text-zinc-500">
                Setiap halaman akan diekstrak menjadi gambar tajam resolusi 2x
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {extractedPages.map((page) => (
                <div
                  key={page.pageNumber}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between shadow-sm"
                >
                  <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-950 rounded overflow-hidden flex items-center justify-center relative">
                    <img
                      src={page.dataUrl}
                      alt={`Halaman ${page.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-mono font-bold flex items-center justify-center">
                      {page.pageNumber}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="font-mono text-[11px] text-zinc-500">
                      Hal {page.pageNumber}
                    </span>
                    <button
                      onClick={() => handleDownloadSinglePage(page.pageNumber, page.dataUrl)}
                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      title="Download gambar halaman ini"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
