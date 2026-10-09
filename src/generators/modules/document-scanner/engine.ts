import { PDFDocument } from "pdf-lib";

export interface Point {
  x: number;
  y: number;
}

export interface PerspectiveQuad {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
}

export type ScanFilterMode =
  | "magic-color"
  | "bw-clean"
  | "grayscale"
  | "enhanced"
  | "original";

export interface FilterSettings {
  mode: ScanFilterMode;
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  shadowSuppression: number; // 0 to 100
  rotation: number; // 0, 90, 180, 270
}

export interface ScannedPage {
  id: string;
  originalImage: HTMLImageElement;
  originalDataUrl: string;
  originalWidth: number;
  originalHeight: number;
  quad: PerspectiveQuad;
  filters: FilterSettings;
  processedCanvas?: HTMLCanvasElement;
  processedDataUrl?: string;
}

export interface PdfExportOptions {
  pageSize: "a4" | "letter" | "fit";
  quality: number; // 0.6 to 1.0
  documentTitle?: string;
}

/**
 * Calculates Euclidean distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Calculates default 4 corners for an image with an optional inset margin
 */
export function getDefaultQuad(width: number, height: number, insetPercent = 0.05): PerspectiveQuad {
  const mx = width * insetPercent;
  const my = height * insetPercent;
  return {
    tl: { x: mx, y: my },
    tr: { x: width - mx, y: my },
    br: { x: width - mx, y: height - my },
    bl: { x: mx, y: height - my },
  };
}

/**
 * Solves 8x8 linear system to compute 3x3 homography matrix (mapping dst -> src)
 */
function getPerspectiveMatrix(src: Point[], dst: Point[]): number[] {
  const a: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x: sx, y: sy } = dst[i]; // destination point
    const { x: dx, y: dy } = src[i]; // source point
    a.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);
    a.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) maxRow = k;
    }
    const tmpA = a[i]; a[i] = a[maxRow]; a[maxRow] = tmpA;
    const tmpB = b[i]; b[i] = b[maxRow]; b[maxRow] = tmpB;

    const pivot = a[i][i];
    if (Math.abs(pivot) < 1e-10) continue;
    for (let j = i; j < n; j++) a[i][j] /= pivot;
    b[i] /= pivot;

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = a[k][i];
        for (let j = i; j < n; j++) a[k][j] -= factor * a[i][j];
        b[k] -= factor * b[i];
      }
    }
  }

  return [b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], 1];
}

/**
 * Warps a 4-point quadrilateral from the source image into an unrolled rectangular canvas
 */
export function warpPerspective(
  sourceImg: HTMLImageElement,
  quad: PerspectiveQuad
): HTMLCanvasElement {
  // Determine output rectangular dimensions
  const topWidth = distance(quad.tl, quad.tr);
  const bottomWidth = distance(quad.bl, quad.br);
  const leftHeight = distance(quad.tl, quad.bl);
  const rightHeight = distance(quad.tr, quad.br);

  const dstWidth = Math.max(100, Math.round(Math.max(topWidth, bottomWidth)));
  const dstHeight = Math.max(100, Math.round(Math.max(leftHeight, rightHeight)));

  // Source canvas to read pixel data
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = sourceImg.naturalWidth;
  srcCanvas.height = sourceImg.naturalHeight;
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
  if (!srcCtx) throw new Error("Could not create 2D canvas context");
  srcCtx.drawImage(sourceImg, 0, 0);

  const srcImageData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const srcPixels = srcImageData.data;
  const sw = srcCanvas.width;
  const sh = srcCanvas.height;

  // Destination canvas
  const dstCanvas = document.createElement("canvas");
  dstCanvas.width = dstWidth;
  dstCanvas.height = dstHeight;
  const dstCtx = dstCanvas.getContext("2d");
  if (!dstCtx) throw new Error("Could not create output canvas context");

  const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
  const dstPixels = dstImageData.data;

  // Source quad points in TL, TR, BR, BL order
  const srcPoints = [quad.tl, quad.tr, quad.br, quad.bl];
  const dstPoints = [
    { x: 0, y: 0 },
    { x: dstWidth, y: 0 },
    { x: dstWidth, y: dstHeight },
    { x: 0, y: dstHeight },
  ];

  // Inverse mapping matrix: dst -> src
  const matrix = getPerspectiveMatrix(srcPoints, dstPoints);

  // Backward mapping with bilinear interpolation
  const m0 = matrix[0], m1 = matrix[1], m2 = matrix[2];
  const m3 = matrix[3], m4 = matrix[4], m5 = matrix[5];
  const m6 = matrix[6], m7 = matrix[7], m8 = matrix[8];

  let dstOffset = 0;
  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const denom = m6 * x + m7 * y + m8;
      const sx = (m0 * x + m1 * y + m2) / denom;
      const sy = (m3 * x + m4 * y + m5) / denom;

      if (sx >= 0 && sx < sw - 1 && sy >= 0 && sy < sh - 1) {
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const wx = sx - x0;
        const wy = sy - y0;
        const w00 = (1 - wx) * (1 - wy);
        const w10 = wx * (1 - wy);
        const w01 = (1 - wx) * wy;
        const w11 = wx * wy;

        const idx00 = (y0 * sw + x0) * 4;
        const idx10 = (y0 * sw + x1) * 4;
        const idx01 = (y1 * sw + x0) * 4;
        const idx11 = (y1 * sw + x1) * 4;

        dstPixels[dstOffset] =
          w00 * srcPixels[idx00] +
          w10 * srcPixels[idx10] +
          w01 * srcPixels[idx01] +
          w11 * srcPixels[idx11];
        dstPixels[dstOffset + 1] =
          w00 * srcPixels[idx00 + 1] +
          w10 * srcPixels[idx10 + 1] +
          w01 * srcPixels[idx01 + 1] +
          w11 * srcPixels[idx11 + 1];
        dstPixels[dstOffset + 2] =
          w00 * srcPixels[idx00 + 2] +
          w10 * srcPixels[idx10 + 2] +
          w01 * srcPixels[idx01 + 2] +
          w11 * srcPixels[idx11 + 2];
        dstPixels[dstOffset + 3] = 255;
      } else {
        // Edge fallback
        dstPixels[dstOffset] = 255;
        dstPixels[dstOffset + 1] = 255;
        dstPixels[dstOffset + 2] = 255;
        dstPixels[dstOffset + 3] = 255;
      }
      dstOffset += 4;
    }
  }

  dstCtx.putImageData(dstImageData, 0, 0);
  return dstCanvas;
}

/**
 * Applies scanner enhancements (Magic Color, B&W Clean, Grayscale, etc.)
 */
export function applyScanFilters(
  inputCanvas: HTMLCanvasElement,
  settings: FilterSettings
): HTMLCanvasElement {
  const { mode, brightness, contrast, shadowSuppression, rotation } = settings;

  // Handle rotation first
  let workingCanvas = inputCanvas;
  if (rotation % 360 !== 0) {
    const rot = (rotation % 360 + 360) % 360;
    const rotCanvas = document.createElement("canvas");
    if (rot === 90 || rot === 270) {
      rotCanvas.width = inputCanvas.height;
      rotCanvas.height = inputCanvas.width;
    } else {
      rotCanvas.width = inputCanvas.width;
      rotCanvas.height = inputCanvas.height;
    }
    const rCtx = rotCanvas.getContext("2d");
    if (rCtx) {
      rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rCtx.rotate((rot * Math.PI) / 180);
      rCtx.drawImage(inputCanvas, -inputCanvas.width / 2, -inputCanvas.height / 2);
      workingCanvas = rotCanvas;
    }
  }

  const outCanvas = document.createElement("canvas");
  outCanvas.width = workingCanvas.width;
  outCanvas.height = workingCanvas.height;
  const ctx = outCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return workingCanvas;

  ctx.drawImage(workingCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, outCanvas.width, outCanvas.height);
  const data = imgData.data;
  const len = data.length;

  // Contrast multiplier
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const brightnessOffset = brightness * 1.5;

  if (mode === "bw-clean") {
    // Pure B&W document thresholding (Otsu-style with shadow suppression)
    const shadowCutoff = 130 + shadowSuppression * 0.4;
    for (let i = 0; i < len; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = lum + brightnessOffset;
      const isBlack = val < shadowCutoff;
      const out = isBlack ? 0 : 255;
      data[i] = out;
      data[i + 1] = out;
      data[i + 2] = out;
    }
  } else if (mode === "grayscale") {
    // Monochrome document with expanded range
    for (let i = 0; i < len; i += 4) {
      let lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Apply shadow suppression (lift paper background)
      if (shadowSuppression > 0) {
        lum = lum + (255 - lum) * (shadowSuppression / 180);
      }
      lum = contrastFactor * (lum - 128) + 128 + brightnessOffset;
      const finalLum = Math.min(255, Math.max(0, lum));
      data[i] = finalLum;
      data[i + 1] = finalLum;
      data[i + 2] = finalLum;
    }
  } else if (mode === "magic-color") {
    // Classic CamScanner Magic Color:
    // 1. Whitens paper background without killing colors
    // 2. Sharpens text contrast
    const liftFactor = (shadowSuppression + 30) / 100;
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // If near paper tone, bleach toward pure white
      if (lum > 110) {
        const bleach = Math.min(1, (lum - 110) / 110) * liftFactor;
        r = r + (255 - r) * bleach;
        g = g + (255 - g) * bleach;
        b = b + (255 - b) * bleach;
      } else {
        // Deepen dark text
        r = r * 0.85;
        g = g * 0.85;
        b = b * 0.85;
      }

      // Apply contrast & brightness
      r = contrastFactor * (r - 128) + 128 + brightnessOffset;
      g = contrastFactor * (g - 128) + 128 + brightnessOffset;
      b = contrastFactor * (b - 128) + 128 + brightnessOffset;

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
  } else if (mode === "enhanced") {
    // Color enhancement (vivid colors for cards, photos, seals)
    const liftFactor = shadowSuppression / 150;
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (shadowSuppression > 0) {
        r = r + (255 - r) * liftFactor;
        g = g + (255 - g) * liftFactor;
        b = b + (255 - b) * liftFactor;
      }

      r = contrastFactor * (r - 128) + 128 + brightnessOffset;
      g = contrastFactor * (g - 128) + 128 + brightnessOffset;
      b = contrastFactor * (b - 128) + 128 + brightnessOffset;

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
  } else {
    // Original with basic sliders
    if (brightness !== 0 || contrast !== 0) {
      for (let i = 0; i < len; i += 4) {
        data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128 + brightnessOffset));
        data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128 + brightnessOffset));
        data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128 + brightnessOffset));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outCanvas;
}

/**
 * Compiles an array of processed canvas pages into a single high-resolution PDF
 */
export async function exportPagesToPdf(
  pages: { canvas: HTMLCanvasElement }[],
  options: PdfExportOptions = { pageSize: "a4", quality: 0.9 }
): Promise<Uint8Array> {
  if (pages.length === 0) {
    throw new Error("No pages provided for PDF export");
  }

  const pdfDoc = await PDFDocument.create();
  if (options.documentTitle) {
    pdfDoc.setTitle(options.documentTitle);
  }

  // Standard dimensions in points (72 points = 1 inch)
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const LETTER_WIDTH = 612.0;
  const LETTER_HEIGHT = 792.0;

  for (const pageItem of pages) {
    const canvas = pageItem.canvas;
    const imgDataUrl = canvas.toDataURL("image/jpeg", options.quality);
    const imgBytes = await (await fetch(imgDataUrl)).arrayBuffer();
    const embeddedImage = await pdfDoc.embedJpg(imgBytes);

    let pageWidth = A4_WIDTH;
    let pageHeight = A4_HEIGHT;

    if (options.pageSize === "letter") {
      pageWidth = LETTER_WIDTH;
      pageHeight = LETTER_HEIGHT;
    } else if (options.pageSize === "fit") {
      // Fit page size exactly to canvas aspect ratio (scaling down if too huge)
      const maxDim = 1200;
      const scale = Math.min(1, maxDim / Math.max(canvas.width, canvas.height));
      pageWidth = canvas.width * scale;
      pageHeight = canvas.height * scale;
    }

    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate fitted bounding box while preserving aspect ratio
    const imgAspect = canvas.width / canvas.height;
    const pageAspect = pageWidth / pageHeight;

    let drawWidth = pageWidth;
    let drawHeight = pageHeight;
    let drawX = 0;
    let drawY = 0;

    if (options.pageSize !== "fit") {
      // Add safe printable margin (15pt ~ 5mm)
      const margin = 20;
      const targetW = pageWidth - margin * 2;
      const targetH = pageHeight - margin * 2;

      if (imgAspect > targetW / targetH) {
        drawWidth = targetW;
        drawHeight = targetW / imgAspect;
        drawX = margin;
        drawY = margin + (targetH - drawHeight) / 2;
      } else {
        drawHeight = targetH;
        drawWidth = targetH * imgAspect;
        drawX = margin + (targetW - drawWidth) / 2;
        drawY = margin;
      }
    }

    pdfPage.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}
