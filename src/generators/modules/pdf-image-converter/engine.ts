import { PDFDocument } from "pdf-lib";

export type PageSizeOption = "a4-portrait" | "a4-landscape" | "fit";
export type MarginOption = "none" | "small" | "normal";

export interface ImageToPdfItem {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
}

export const PAGE_DIMENSIONS = {
  "a4-portrait": { width: 595.28, height: 841.89 },
  "a4-landscape": { width: 841.89, height: 595.28 },
};

export const MARGIN_VALUES: Record<MarginOption, number> = {
  none: 0,
  small: 24,
  normal: 48,
};

/**
 * Calculates scaling and offsets to preserve image aspect ratio inside bounded page box
 */
export function calculateFitDimensions(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number
): { width: number; height: number; x: number; y: number } {
  const scale = Math.min(boxW / imgW, boxH / imgH);
  const width = imgW * scale;
  const height = imgH * scale;
  const x = (boxW - width) / 2;
  const y = (boxH - height) / 2;
  return { width, height, x, y };
}

/**
 * Compiles a list of image items into a single PDF document
 */
export async function compileImagesToPdf(
  items: ImageToPdfItem[],
  options: {
    pageSize: PageSizeOption;
    margin: MarginOption;
  }
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const margin = MARGIN_VALUES[options.margin];

  for (const item of items) {
    // Determine page width and height
    let pageW: number;
    let pageH: number;

    if (options.pageSize === "fit") {
      pageW = item.width + margin * 2;
      pageH = item.height + margin * 2;
    } else {
      const dim = PAGE_DIMENSIONS[options.pageSize];
      pageW = dim.width;
      pageH = dim.height;
    }

    const page = doc.addPage([pageW, pageH]);
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2;

    const fit = calculateFitDimensions(item.width, item.height, usableW, usableH);

    // Embed image
    let embeddedImg;
    const base64Data = item.dataUrl.split(",")[1];
    const binary = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    if (item.dataUrl.startsWith("data:image/png")) {
      embeddedImg = await doc.embedPng(binary);
    } else {
      // JPEG or WebP converted to JPEG
      embeddedImg = await doc.embedJpg(binary);
    }

    page.drawImage(embeddedImg, {
      x: margin + fit.x,
      y: margin + fit.y,
      width: fit.width,
      height: fit.height,
    });
  }

  return doc.save();
}
