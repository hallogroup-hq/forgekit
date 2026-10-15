import { PDFDocument } from "pdf-lib";

export type CompressionPreset = "25" | "50" | "75" | "target" | "custom";
export type ImageFormat = "jpg" | "png";

export interface CompressionOptions {
  preset: CompressionPreset;
  scale: number; // Render resolution multiplier (e.g. 0.9 to 1.8)
  quality: number; // Quality factor (0.50 to 0.95)
  format?: ImageFormat; // 'jpg' (standard high-efficiency) or 'png' (100% lossless colors)
  targetSizeBytes?: number; // Target compressed size in bytes (when preset === 'target')
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

export const COMPRESSION_PRESETS: Record<Exclude<CompressionPreset, "custom" | "target">, PresetDetails> = {
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

export interface TargetPresetOption {
  label: string;
  bytes: number;
  description: string;
}

export const TARGET_SIZE_PRESETS: TargetPresetOption[] = [
  { label: "300 KB", bytes: 300 * 1024, description: "Batas ketat portal instansi/foto KTP" },
  { label: "500 KB", bytes: 500 * 1024, description: "Standar pendaftaran seleksi & form online" },
  { label: "1 MB", bytes: 1024 * 1024, description: "Batas upload CV & berkas lamaran kerja" },
  { label: "2 MB", bytes: 2 * 1024 * 1024, description: "Batas attachment dokumen email & LMS" },
  { label: "5 MB", bytes: 5 * 1024 * 1024, description: "Batas dokumen kontrak & portofolio cetak" },
];

export interface TargetCalibrationResult {
  scale: number;
  quality: number;
  estimatedSizeBytes: number;
}

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
  targetSizeBytes?: number;
  effectiveScale?: number;
  effectiveQuality?: number;
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
 * Calculates optimal scale and JPEG quality to hit an exact target byte size.
 * Uses empirical page budget estimation and multi-point probe calibration.
 */
export function estimateTargetCompressionParams(
  targetBytes: number,
  numPages: number,
  sampleProbe?: {
    sampleScale: number;
    bytesAtQ85: number;
    bytesAtQ65: number;
    bytesAtQ45: number;
  }
): TargetCalibrationResult {
  // Approximate PDF container overhead
  const overhead = 3500 + numPages * 400;

  // Apply safety buffer (0.92) so stream packing and PDF dictionary overhead never exceed hard target
  const availableBudget = Math.max(numPages * 5000, (targetBytes - overhead) * 0.92);
  const targetPerPage = availableBudget / Math.max(1, numPages);

  if (sampleProbe && sampleProbe.bytesAtQ65 > 0) {
    const { sampleScale, bytesAtQ85, bytesAtQ65, bytesAtQ45 } = sampleProbe;

    if (targetPerPage >= bytesAtQ85) {
      // Generous budget: scale up resolution and retain crisp quality
      const scaleMultiplier = Math.min(1.4, Math.sqrt(targetPerPage / Math.max(1, bytesAtQ85)));
      const finalScale = Math.min(1.7, Math.max(1.0, sampleScale * scaleMultiplier));
      return {
        scale: Number(finalScale.toFixed(2)),
        quality: 0.88,
        estimatedSizeBytes: Math.round(targetBytes * 0.94),
      };
    } else if (targetPerPage >= bytesAtQ65) {
      // Medium-high budget: interpolate quality between 0.65 and 0.85
      const span = Math.max(1, bytesAtQ85 - bytesAtQ65);
      const t = Math.max(0, Math.min(1, (targetPerPage - bytesAtQ65) / span));
      const q = 0.65 + t * 0.20;
      return {
        scale: sampleScale,
        quality: Number(q.toFixed(2)),
        estimatedSizeBytes: Math.round(targetBytes * 0.93),
      };
    } else if (targetPerPage >= bytesAtQ45) {
      // Moderate budget: interpolate quality between 0.45 and 0.65 with slight scale tweak
      const span = Math.max(1, bytesAtQ65 - bytesAtQ45);
      const t = Math.max(0, Math.min(1, (targetPerPage - bytesAtQ45) / span));
      const q = 0.45 + t * 0.20;
      return {
        scale: Math.max(0.9, Number((sampleScale * 0.95).toFixed(2))),
        quality: Number(q.toFixed(2)),
        estimatedSizeBytes: Math.round(targetBytes * 0.92),
      };
    } else {
      // Tight budget: reduce scale and quality to guarantee fitting under target limit
      const scaleReduction = Math.max(0.5, Math.min(0.9, Math.sqrt(targetPerPage / Math.max(1, bytesAtQ65))));
      const finalScale = Math.max(0.65, Math.min(1.1, sampleScale * scaleReduction));
      const qRatio = Math.max(0.32, Math.min(0.55, 0.45 * (targetPerPage / Math.max(1, bytesAtQ45))));
      return {
        scale: Number(finalScale.toFixed(2)),
        quality: Number(qRatio.toFixed(2)),
        estimatedSizeBytes: Math.round(targetBytes * 0.90),
      };
    }
  }

  // Fallback heuristic if no sample canvas probe is provided (e.g. unit test or quick preview)
  const baseline65KB = 65 * 1024;
  if (targetPerPage >= 140 * 1024) {
    return { scale: 1.5, quality: 0.88, estimatedSizeBytes: Math.round(targetBytes * 0.92) };
  } else if (targetPerPage >= 85 * 1024) {
    return { scale: 1.3, quality: 0.80, estimatedSizeBytes: Math.round(targetBytes * 0.92) };
  } else if (targetPerPage >= 50 * 1024) {
    return { scale: 1.1, quality: 0.72, estimatedSizeBytes: Math.round(targetBytes * 0.92) };
  } else if (targetPerPage >= 28 * 1024) {
    return { scale: 0.95, quality: 0.60, estimatedSizeBytes: Math.round(targetBytes * 0.90) };
  } else {
    const scale = Math.max(0.65, Math.min(0.85, Math.sqrt(targetPerPage / baseline65KB)));
    return { scale: Number(scale.toFixed(2)), quality: 0.45, estimatedSizeBytes: Math.round(targetBytes * 0.88) };
  }
}

/**
 * Full client-side PDF compression pipeline:
 * 1. Reads pages via pdfjs-dist
 * 2. If 'target' preset is selected, runs fast single-page probe to calibrate scale and quality
 * 3. Renders pages at calibrated DPI scale with sRGB-locked color preservation
 * 4. Reassembles vector-compatible multi-page PDF preserving exact page dimensions
 * 5. Validates final size against target limit with automatic corrective pass if needed
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

  let effectiveScale = options.scale;
  let effectiveQuality = options.quality;
  const targetFormat: ImageFormat = options.format || "jpg";

  // Calibrate parameters if target size is set
  if (options.preset === "target" && options.targetSizeBytes && options.targetSizeBytes > 0) {
    onProgress?.({
      currentPage: 1,
      totalPages: numPages,
      percent: 3,
      phase: "reading",
    });

    try {
      if (typeof document !== "undefined") {
        const page1 = await pdfDoc.getPage(1);
        const probeScale = 1.25;
        const vp = page1.getViewport({ scale: probeScale });
        const probeCanvas = document.createElement("canvas");
        probeCanvas.width = Math.round(vp.width);
        probeCanvas.height = Math.round(vp.height);
        const probeCtx = probeCanvas.getContext("2d", { colorSpace: "srgb" });

        if (probeCtx) {
          await (page1.render as any)({
            canvasContext: probeCtx,
            viewport: vp,
            canvas: probeCanvas,
            intent: "print",
          }).promise;
          probeCtx.save();
          probeCtx.globalCompositeOperation = "destination-over";
          probeCtx.fillStyle = "#ffffff";
          probeCtx.fillRect(0, 0, probeCanvas.width, probeCanvas.height);
          probeCtx.restore();

          const data85 = probeCanvas.toDataURL("image/jpeg", 0.85);
          const data65 = probeCanvas.toDataURL("image/jpeg", 0.65);
          const data45 = probeCanvas.toDataURL("image/jpeg", 0.45);

          const bytes85 = Math.round((data85.length - 23) * 0.75);
          const bytes65 = Math.round((data65.length - 23) * 0.75);
          const bytes45 = Math.round((data45.length - 23) * 0.75);

          const calibrated = estimateTargetCompressionParams(options.targetSizeBytes, numPages, {
            sampleScale: probeScale,
            bytesAtQ85: bytes85,
            bytesAtQ65: bytes65,
            bytesAtQ45: bytes45,
          });

          effectiveScale = calibrated.scale;
          effectiveQuality = calibrated.quality;
        }
      } else {
        const calibrated = estimateTargetCompressionParams(options.targetSizeBytes, numPages);
        effectiveScale = calibrated.scale;
        effectiveQuality = calibrated.quality;
      }
    } catch {
      const calibrated = estimateTargetCompressionParams(options.targetSizeBytes, numPages);
      effectiveScale = calibrated.scale;
      effectiveQuality = calibrated.quality;
    }
  }

  // Inner builder to render and assemble all pages into PDF
  const renderAndAssemble = async (scale: number, quality: number, isRetry = false) => {
    const newPdfDoc = await PDFDocument.create();
    let firstPageOrig: string | undefined;
    let firstPageComp: string | undefined;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.({
        currentPage: pageNum,
        totalPages: numPages,
        percent: Math.min(92, Math.round(((pageNum - 1) / numPages) * (isRetry ? 95 : 90))),
        phase: "rendering",
      });

      const page = await pdfDoc.getPage(pageNum);

      if (pageNum === 1) {
        try {
          const origRender = await renderPageToImage(page, 1.0, 0.92, "png");
          firstPageOrig = origRender.dataUrl;
        } catch {}
      }

      const pageImage = await renderPageToImage(page, scale, quality, targetFormat);

      if (pageNum === 1) {
        firstPageComp = pageImage.dataUrl;
      }

      onProgress?.({
        currentPage: pageNum,
        totalPages: numPages,
        percent: Math.min(94, Math.round((pageNum / numPages) * (isRetry ? 95 : 90))),
        phase: "assembling",
      });

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

    const bytes = await newPdfDoc.save({ useObjectStreams: true });
    return { bytes, firstPageOrig, firstPageComp };
  };

  let pass1 = await renderAndAssemble(effectiveScale, effectiveQuality);
  let compressedBytes = pass1.bytes;
  let firstPageOriginalUrl = pass1.firstPageOrig;
  let firstPageCompressedUrl = pass1.firstPageComp;

  // Secondary corrective pass safeguard IF target was set and exceeded by > 2%
  if (
    options.preset === "target" &&
    options.targetSizeBytes &&
    compressedBytes.length > options.targetSizeBytes &&
    effectiveQuality > 0.35
  ) {
    const ratio = options.targetSizeBytes / compressedBytes.length;
    effectiveScale = Math.max(0.60, Number((effectiveScale * Math.sqrt(ratio) * 0.96).toFixed(2)));
    effectiveQuality = Math.max(0.32, Number((effectiveQuality * ratio * 0.94).toFixed(2)));

    const retryPass = await renderAndAssemble(effectiveScale, effectiveQuality, true);
    compressedBytes = retryPass.bytes;
    if (retryPass.firstPageComp) {
      firstPageCompressedUrl = retryPass.firstPageComp;
    }
  }

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
    targetSizeBytes: options.targetSizeBytes,
    effectiveScale,
    effectiveQuality,
    firstPageOriginalUrl,
    firstPageCompressedUrl,
  };
}
