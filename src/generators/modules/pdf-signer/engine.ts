import { PDFDocument } from "pdf-lib";

export interface PlacedElement {
  id: string;
  type: "signature" | "stamp";
  pageNumber: number; // 1-indexed
  x: number; // in percentage (0 to 100) of page width
  y: number; // in percentage (0 to 100) of page height from top
  width: number; // in percentage of page width
  height: number; // in percentage of page height
  dataUrl: string; // PNG with alpha
  opacity: number; // 0.1 to 1.0
  rotation: number; // degrees
}

export type StampInkColor = "blue" | "red" | "purple" | "green" | "original";

export const STAMP_COLOR_MAP: Record<StampInkColor, [number, number, number]> = {
  blue: [26, 68, 160], // Classic deep official stamp blue
  red: [185, 28, 28],  // Official department seal red
  purple: [109, 40, 217], // Traditional government violet
  green: [21, 128, 61],  // Islamic / corporate green
  original: [0, 0, 0], // Keeps original color
};

export interface StampEffectOptions {
  color: StampInkColor;
  textureIntensity: number; // 0 to 1 (0 = solid digital, 1 = heavy authentic rubber stamp)
  pressureIrregularity: number; // 0 to 1
  inkBleed: number; // 0 to 1
  opacity: number; // 0.6 to 1.0
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
 * Automatically removes white/light paper background and applies physical "wet ink" texture
 */
export function processWetInkStamp(
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  options: StampEffectOptions
): string {
  const canvas = document.createElement("canvas");
  const w = sourceImg.width;
  const h = sourceImg.height;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";

  ctx.drawImage(sourceImg, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const pixels = imgData.data;

  const [targetR, targetG, targetB] = STAMP_COLOR_MAP[options.color];
  const isRecolor = options.color !== "original";

  // Pseudo-random seed for organic texture
  for (let y = 0; y < h; y++) {
    const yNorm = y / h;
    // Slight pressure gradient across vertical & diagonal angle
    const pressureGradient = 0.82 + 0.18 * Math.cos((yNorm + 0.2) * Math.PI) * options.pressureIrregularity;

    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      if (a === 0) continue;

      // Calculate luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // If paper background (white or near-white), knockout to transparent
      if (lum > 225) {
        pixels[idx + 3] = 0;
        continue;
      }

      // Smooth alpha ramp for anti-aliasing edges
      let inkAlpha = a;
      if (lum > 170) {
        // Feather edge
        inkAlpha = Math.round(a * (1 - (lum - 170) / 55));
      }

      // Paper fiber / rubber porosity texture (micro-variation)
      if (options.textureIntensity > 0) {
        const noise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
        const fiberFactor = 1.0 - Math.abs(noise) * (0.28 * options.textureIntensity);
        inkAlpha = Math.round(inkAlpha * fiberFactor * pressureGradient);
      }

      if (isRecolor) {
        pixels[idx] = targetR;
        pixels[idx + 1] = targetG;
        pixels[idx + 2] = targetB;
      }
      pixels[idx + 3] = Math.max(0, Math.min(255, inkAlpha));
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Apply subtle ink bleed (micro-softness around stamped edges)
  if (options.inkBleed > 0) {
    const bleedCanvas = document.createElement("canvas");
    bleedCanvas.width = w;
    bleedCanvas.height = h;
    const bCtx = bleedCanvas.getContext("2d");
    if (bCtx) {
      bCtx.drawImage(canvas, 0, 0);
      ctx.globalAlpha = 0.3 * options.inkBleed;
      ctx.filter = `blur(${0.6 * options.inkBleed}px)`;
      ctx.drawImage(bleedCanvas, 0, 0);
      ctx.filter = "none";
      ctx.globalAlpha = 1.0;
    }
  }

  return canvas.toDataURL("image/png");
}

/**
 * Removes white paper background from an uploaded signature photo
 */
export function removeSignatureBackground(sourceImg: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = sourceImg.naturalWidth;
  canvas.height = sourceImg.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";

  ctx.drawImage(sourceImg, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum > 210) {
      // Paper background
      data[i + 3] = 0;
    } else {
      // Deepen pen ink to clean dark blue-black
      const darkFactor = Math.min(1, (210 - lum) / 120);
      data[i] = Math.round(data[i] * 0.4);
      data[i + 1] = Math.round(data[i + 1] * 0.45);
      data[i + 2] = Math.round(data[i + 2] * 0.6); // slight pen ink tint
      data[i + 3] = Math.round(255 * darkFactor);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

/**
 * Generates an official round company seal with curved text
 */
export function generateOfficialRoundStamp(
  companyName: string,
  centerText: string,
  cityOrDate: string,
  options: StampEffectOptions
): string {
  const size = 500;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.42;

  ctx.clearRect(0, 0, size, size);

  const [r, g, b] = STAMP_COLOR_MAP[options.color === "original" ? "blue" : options.color];
  const inkHex = `rgb(${r}, ${g}, ${b})`;
  ctx.strokeStyle = inkHex;
  ctx.fillStyle = inkHex;

  // Outer double circle border
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 10, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circle
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  // Helper to draw text along an arc
  const drawCurvedText = (
    text: string,
    arcRadius: number,
    startAngle: number,
    endAngle: number,
    inward = false
  ) => {
    ctx.save();
    ctx.font = "bold 20px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const totalAngle = endAngle - startAngle;
    const len = text.length;
    const angleStep = totalAngle / (len - 1 || 1);

    for (let i = 0; i < len; i++) {
      const angle = startAngle + i * angleStep;
      ctx.save();
      ctx.translate(cx + arcRadius * Math.cos(angle), cy + arcRadius * Math.sin(angle));
      ctx.rotate(angle + (inward ? -Math.PI / 2 : Math.PI / 2));
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };

  // Top company name arc
  drawCurvedText(
    companyName.toUpperCase(),
    radius - 28,
    Math.PI * 1.15,
    Math.PI * 1.85,
    false
  );

  // Bottom city / date arc
  drawCurvedText(
    cityOrDate.toUpperCase(),
    radius - 28,
    Math.PI * 0.85,
    Math.PI * 0.15,
    true
  );

  // Star icons separating top and bottom
  ctx.font = "18px sans-serif";
  ctx.fillText("★", cx - radius + 22, cy);
  ctx.fillText("★", cx + radius - 22, cy);

  // Center text (e.g. "LUNAS", "APPROVED", "DISETUJUI")
  ctx.font = "900 32px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(centerText.toUpperCase(), cx, cy);

  // Pass through physical wet ink filter
  return processWetInkStamp(canvas, options);
}

/**
 * Embeds all placed signatures and stamps onto original PDF pages and exports final PDF
 */
export async function bakeElementsIntoPdf(
  originalPdfBytes: Uint8Array,
  elements: PlacedElement[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pageCount = pdfDoc.getPageCount();

  for (const el of elements) {
    if (el.pageNumber < 1 || el.pageNumber > pageCount) continue;

    const page = pdfDoc.getPage(el.pageNumber - 1);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Fetch and embed PNG image with alpha
    let pngBytes: Uint8Array;
    if (el.dataUrl.startsWith("data:")) {
      const base64Part = el.dataUrl.split(",")[1];
      if (base64Part && typeof Buffer !== "undefined") {
        pngBytes = new Uint8Array(Buffer.from(base64Part, "base64"));
      } else if (base64Part) {
        const binStr = atob(base64Part);
        pngBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          pngBytes[i] = binStr.charCodeAt(i);
        }
      } else {
        pngBytes = new Uint8Array(await (await fetch(el.dataUrl)).arrayBuffer());
      }
    } else {
      pngBytes = new Uint8Array(await (await fetch(el.dataUrl)).arrayBuffer());
    }
    const embeddedImage = await pdfDoc.embedPng(pngBytes);

    // Convert percentage coordinates to PDF points
    const drawWidth = (el.width / 100) * pageWidth;
    const drawHeight = (el.height / 100) * pageHeight;
    const drawX = (el.x / 100) * pageWidth;
    // PDF coordinate system has Y=0 at the bottom!
    const drawY = pageHeight - ((el.y / 100) * pageHeight) - drawHeight;

    page.drawImage(embeddedImage, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
      opacity: el.opacity,
    });
  }

  return await pdfDoc.save();
}
