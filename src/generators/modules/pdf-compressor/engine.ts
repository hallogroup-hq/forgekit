import { PDFDocument } from "pdf-lib";

export type CompressionPreset = "25" | "50" | "75" | "custom";
export type ImageFormat = "jpg" | "png";

export interface CompressionOptions {
  preset: CompressionPreset;
  scale: number; // Render resolution multiplier (e.g. 0.9 to 1.8)
  quality: number; // Quality factor (0.50 to 0.95)
  format?: ImageFormat; // 'jpg' (standard high-efficiency) or 'png' (100% lossless colors)
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
    description: "Kompresi ringan dengan detail gambar & teks tajam mendekati asli, warna 100% terjaga.",
    scale: 1.5,
    quality: 0.88,
    targetReduction: "±25-35%",
    recommendedFor: "Portofolio, proposal desain, foto warna & dokumen cetak",
  },
  "50": {
    id: "50",
    title: "50% Seimbang",
    badge: "Rekomendasi",
    description: "Ukuran file terpangkas signifikan, akurasi warna tetap natural dan teks sangat jernih.",
    scale: 1.25,
    quality: 0.78,
    targetReduction: "±50-65%",
    recommendedFor: "Dokumen kantor, laporan kerja, invoice & surat resmi",
  },
  "25": {
    id: "25",
    title: "25% Kompak Maksimal",
    badge: "Minimum",
    description: "Ukuran sekecil mungkin agar lolos batas upload form tanpa membuat warna pudar/bergeser.",
    scale: 1.0,
    quality: 0.68,
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

export interface RenderedPageImage {
  dataUrl: string;
  bytes: Uint8Array;
  format: ImageFormat;
  origWidth: number;
  origHeight: number;
}

/**
 * Renders a PDF page to canvas with strict color preservation:
 * - Locks canvas to standard sRGB colorSpace (prevents Mac Display-P3 desaturation/tint shifts)
 * - Uses 'print' rendering intent for full color accuracy
 * - Renders transparency groups naturally, then fills background white via 'destination-over'
 *   to avoid pre-fill blend mode contamination
 */
export async function renderPageToImage(
  page: any,
  scale: number,
  quality: number,
  format: ImageFormat = "jpg"
): Promise<RenderedPageImage> {
  if (typeof document === "undefined") {
    return { dataUrl: "", bytes: new Uint8Array(), format, origWidth: 0, origHeight: 0 };
  }

  const origViewport = page.getViewport({ scale: 1.0 });
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  // Explicit sRGB colorSpace prevents Mac Display-P3 wide-gamut mismatch
  const ctx = canvas.getContext("2d", {
    colorSpace: "srgb",
    willReadFrequently: false,
  });
  if (!ctx) throw new Error("Could not acquire 2D rendering context");

  // Render PDF page with print intent to guarantee color accuracy
  await (page.render as any)({
    canvasContext: ctx,
    viewport,
    canvas,
    intent: "print",
  }).promise;

  // Fill transparent paper background with white BEHIND the rendered PDF content
  // using 'destination-over' so it never corrupts PDF.js blend modes or image colors
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const mimeType = format === "png" ? "image/png" : "image/jpeg";
  const dataUrl = canvas.toDataURL(mimeType, format === "png" ? undefined : quality);
  const bytes = dataUrlToUint8Array(dataUrl);

  return {
    dataUrl,
    bytes,
    format,
    origWidth: origViewport.width,
    origHeight: origViewport.height,
  };
}

/**
 * Full client-side PDF compression pipeline:
 * 1. Reads pages via pdfjs-dist
 * 2. Renders pages at calibrated DPI scale with sRGB-locked color preservation
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

  const targetFormat: ImageFormat = options.format || "jpg";

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.({
      currentPage: pageNum,
      totalPages: numPages,
      percent: Math.round(((pageNum - 1) / numPages) * 90),
      phase: "rendering",
    });

    const page = await pdfDoc.getPage(pageNum);

    // If page 1, render a 1.0 scale snapshot for before/after comparison
    if (pageNum === 1) {
      try {
        const origRender = await renderPageToImage(page, 1.0, 0.92, "png");
        firstPageOriginalUrl = origRender.dataUrl;
      } catch {}
    }

    // Render target compressed page with sRGB color preservation
    const pageImage = await renderPageToImage(
      page,
      options.scale,
      options.quality,
      targetFormat
    );

    if (pageNum === 1) {
      firstPageCompressedUrl = pageImage.dataUrl;
    }

    onProgress?.({
      currentPage: pageNum,
      totalPages: numPages,
      percent: Math.round((pageNum / numPages) * 90),
      phase: "assembling",
    });

    // Embed into output PDF preserving original point coordinates
    const embeddedImage =
      pageImage.format === "png"
        ? await newPdfDoc.embedPng(pageImage.bytes)
        : await newPdfDoc.embedJpg(pageImage.bytes);

    const newPage = newPdfDoc.addPage([pageImage.origWidth, pageImage.origHeight]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: pageImage.origWidth,
      height: pageImage.origHeight,
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
