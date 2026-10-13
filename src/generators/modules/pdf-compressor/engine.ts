import { PDFDocument } from "pdf-lib";

export type CompressionPreset = "25" | "50" | "75" | "custom";

export interface CompressionOptions {
  preset: CompressionPreset;
  scale: number; // Render resolution multiplier (e.g. 0.9 to 1.8)
  quality: number; // JPEG quality factor (0.40 to 0.92)
}

export interface PresetDetails {
  id: CompressionPreset;
  title: string;
  badge: string;
  description: string;
  scale: number;
  quality: number;
  targetReduction: string;
  recommendedFor: string;
}

export const COMPRESSION_PRESETS: Record<Exclude<CompressionPreset, "custom">, PresetDetails> = {
  "75": {
    id: "75",
    title: "75% Kualitas Tinggi",
    badge: "Ringan",
    description: "Kompresi ringan dengan detail gambar & teks hampir identik dengan aslinya.",
    scale: 1.5,
    quality: 0.82,
    targetReduction: "±25-35%",
    recommendedFor: "Portofolio, proposal desain, dan dokumen cetak",
  },
  "50": {
    id: "50",
    title: "50% Seimbang",
    badge: "Rekomendasi",
    description: "Ukuran file terpangkas signifikan, teks tetap tajam dan gambar sangat nyaman dibaca.",
    scale: 1.25,
    quality: 0.68,
    targetReduction: "±50-65%",
    recommendedFor: "Dokumen kantor, laporan kerja, invoice & surat resmi",
  },
  "25": {
    id: "25",
    title: "25% Kompak Maksimal",
    badge: "Minimum",
    description: "Ukuran sekecil mungkin agar lolos batas upload form tanpa membuat teks pecah.",
    scale: 1.0,
    quality: 0.52,
    targetReduction: "±70-85%",
    recommendedFor: "Upload portal beasiswa, CPNS, dan batas attachment email (1-2 MB)",
  },
};

export interface CompressionProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
  phase: "reading" | "rendering" | "encoding" | "assembling" | "done";
}

export interface CompressionResult {
  compressedBytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savingsBytes: number;
  savingsPercent: number;
  numPages: number;
  firstPageOriginalUrl?: string;
  firstPageCompressedUrl?: string;
}

/**
 * Format bytes to readable human unit (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Dynamically loads pdfjs-dist on client
 */
export async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

/**
 * Converts data URL or base64 to Uint8Array safely in any environment
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64Part = dataUrl.split(",")[1] || dataUrl;
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64Part, "base64"));
  }
  const binaryString = atob(base64Part);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Renders a PDF page to canvas and returns JPEG data URL
 */
export async function renderPageToJpeg(
  page: any,
  scale: number,
  quality: number
): Promise<{ dataUrl: string; width: number; height: number; origWidth: number; origHeight: number }> {
  if (typeof document === "undefined") {
    return { dataUrl: "", width: 0, height: 0, origWidth: 0, origHeight: 0 };
  }

  const origViewport = page.getViewport({ scale: 1.0 });
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: false });
  if (!ctx) throw new Error("Could not acquire 2D rendering context");

  // Fill pure white background for crisp rendering before PDF render
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await (page.render as any)({
    canvasContext: ctx,
    viewport,
    canvas,
  }).promise;

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return {
    dataUrl,
    width: canvas.width,
    height: canvas.height,
    origWidth: origViewport.width,
    origHeight: origViewport.height,
  };
}

/**
 * Full client-side PDF compression pipeline:
 * 1. Reads pages via pdfjs-dist
 * 2. Renders pages at calibrated DPI scale with progressive JPEG compression
 * 3. Reassembles vector-compatible multi-page PDF preserving exact page dimensions
 */
export async function compressPdfDocument(
  pdfBytes: Uint8Array,
  options: CompressionOptions,
  onProgress?: (progress: CompressionProgress) => void
): Promise<CompressionResult> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: pdfBytes });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const newPdfDoc = await PDFDocument.create();
  let firstPageOriginalUrl: string | undefined;
  let firstPageCompressedUrl: string | undefined;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.({
      currentPage: pageNum,
      totalPages: numPages,
      percent: Math.round(((pageNum - 1) / numPages) * 90),
      phase: "rendering",
    });

    const page = await pdfDoc.getPage(pageNum);

    // If page 1, optionally render a 1.0 scale snapshot for before/after comparison
    if (pageNum === 1) {
      try {
        const origRender = await renderPageToJpeg(page, 1.0, 0.85);
        firstPageOriginalUrl = origRender.dataUrl;
      } catch {}
    }

    // Render target compressed page
    const { dataUrl, origWidth, origHeight } = await renderPageToJpeg(
      page,
      options.scale,
      options.quality
    );

    if (pageNum === 1) {
      firstPageCompressedUrl = dataUrl;
    }

    onProgress?.({
      currentPage: pageNum,
      totalPages: numPages,
      percent: Math.round((pageNum / numPages) * 90),
      phase: "assembling",
    });

    // Embed into output PDF preserving original point coordinates
    const jpgBytes = dataUrlToUint8Array(dataUrl);
    const embeddedImage = await newPdfDoc.embedJpg(jpgBytes);

    const newPage = newPdfDoc.addPage([origWidth, origHeight]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: origWidth,
      height: origHeight,
    });
  }

  onProgress?.({
    currentPage: numPages,
    totalPages: numPages,
    percent: 96,
    phase: "encoding",
  });

  const compressedBytes = await newPdfDoc.save({ useObjectStreams: true });

  const originalSize = pdfBytes.length;
  const compressedSize = compressedBytes.length;
  const savingsBytes = Math.max(0, originalSize - compressedSize);
  const savingsPercent =
    originalSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  onProgress?.({
    currentPage: numPages,
    totalPages: numPages,
    percent: 100,
    phase: "done",
  });

  return {
    compressedBytes,
    originalSize,
    compressedSize,
    savingsBytes,
    savingsPercent,
    numPages,
    firstPageOriginalUrl,
    firstPageCompressedUrl,
  };
}
