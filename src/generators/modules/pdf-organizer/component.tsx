"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  RotateCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Files,
  FileText,
  Scissors,
  Check,
  AlertCircle,
  FileUp,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import {
  PageItem,
  reorderPages,
  rotatePage,
  parsePageRangeString,
  compileOrganizedPdf,
} from "./engine";

export default function PdfOrganizer() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [fileBuffers, setFileBuffers] = useState<Record<string, Uint8Array>>({});
  const [fileList, setFileList] = useState<{ id: string; name: string; pageCount: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rangeInput, setRangeInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const newBuffers = { ...fileBuffers };
      const newFileList = [...fileList];
      const newPages: PageItem[] = [...pages];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) continue;

        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const fileId = "f_" + Date.now() + "_" + i;

        const doc = await PDFDocument.load(bytes);
        const count = doc.getPageCount();

        newBuffers[fileId] = bytes;
        newFileList.push({ id: fileId, name: file.name, pageCount: count });

        for (let pageIdx = 0; pageIdx < count; pageIdx++) {
          newPages.push({
            id: `p_${fileId}_${pageIdx}`,
            fileId,
            sourceFileName: file.name,
            sourcePageIndex: pageIdx,
            rotation: 0,
          });
        }
      }

      setFileBuffers(newBuffers);
      setFileList(newFileList);
      setPages(newPages);
    } catch (err) {
      console.error("PDF load error", err);
      setErrorMsg("Gagal membaca file PDF. Pastikan file tidak terkunci password.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRotate = (pageId: string) => {
    setPages((prev) => rotatePage(prev, pageId, 90));
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    setPages((prev) => reorderPages(prev, index, targetIndex));
  };

  const handleDelete = (pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  };

  const handleApplyRangeFilter = () => {
    if (!rangeInput.trim()) return;
    const indices = parsePageRangeString(rangeInput, pages.length);
    if (indices.length === 0) {
      setErrorMsg("Format range halaman tidak valid. Contoh: 1-3, 5");
      return;
    }
    setErrorMsg(null);
    setPages((prev) => indices.map((idx) => prev[idx]).filter(Boolean));
    setRangeInput("");
  };

  const handleCompileAndDownload = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    try {
      const compiledBytes = await compileOrganizedPdf(pages, fileBuffers);
      const blob = new Blob([compiledBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `organized-document-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Compile error", err);
      setErrorMsg("Gagal menyusun PDF. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setPages([]);
    setFileBuffers({});
    setFileList([]);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            PDF Merge, Split & Page Organizer
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gabungkan dokumen PDF, atur urutan halaman, rotasi, atau hapus halaman secara visual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            <Plus size={14} />
            Tambah File PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          {pages.length > 0 && (
            <>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
              >
                Reset
              </button>
              <button
                onClick={handleCompileAndDownload}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:opacity-90 transition shadow-sm"
              >
                <Download size={14} />
                {isProcessing ? "Menyusun..." : `Download PDF (${pages.length} Hal)`}
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700">
          <AlertCircle size={14} className="text-zinc-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Dropzone if empty */}
      {pages.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3 transition bg-zinc-50/50 dark:bg-zinc-900/20"
        >
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shadow-inner">
            <FileUp size={26} />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Pilih atau Drag & Drop file PDF di sini
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Bisa upload multiple PDF sekaligus untuk digabungkan dan diatur halamannya.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Files size={14} />
              <span>
                Total: <strong className="text-zinc-900 dark:text-zinc-100">{pages.length}</strong> Halaman
                dari <strong className="text-zinc-900 dark:text-zinc-100">{fileList.length}</strong> Dokumen
              </span>
            </div>

            {/* Split / Range Extractor Input */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Ekstrak Range:</span>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="Contoh: 1-3, 5"
                className="w-32 px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
              />
              <button
                onClick={handleApplyRangeFilter}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium"
              >
                <Scissors size={12} />
                Filter
              </button>
            </div>
          </div>

          {/* Visual Page Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {pages.map((page, index) => (
              <div
                key={page.id}
                className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:border-zinc-400 dark:hover:border-zinc-700 transition"
              >
                {/* Simulated Paper Graphic with rotation */}
                <div className="aspect-[3/4] bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-3 text-center overflow-hidden relative">
                  <div
                    style={{
                      transform: `rotate(${page.rotation}deg)`,
                      transition: "transform 0.2s ease",
                    }}
                    className="flex flex-col items-center justify-center gap-1.5"
                  >
                    <FileText size={24} className="text-zinc-400" />
                    <span className="text-[10px] text-zinc-400 truncate max-w-[90px]">
                      {page.sourceFileName}
                    </span>
                    <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Hal {page.sourcePageIndex + 1}
                    </span>
                  </div>

                  {/* Absolute Badge Order Number */}
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-mono font-bold flex items-center justify-center shadow">
                    {index + 1}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 mt-2 text-zinc-500">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMove(index, "left")}
                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                      title="Geser Kiri"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      disabled={index === pages.length - 1}
                      onClick={() => handleMove(index, "right")}
                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                      title="Geser Kanan"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRotate(page.id)}
                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                      title="Rotasi 90°"
                    >
                      <RotateCw size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                      title="Hapus Halaman"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
