import { PDFDocument, degrees } from "pdf-lib";

export interface PageItem {
  id: string;
  fileId: string;
  sourceFileName: string;
  sourcePageIndex: number; // 0-based index in the source file
  rotation: number; // 0, 90, 180, 270
}

/**
 * Reorders a page within the list
 */
export function reorderPages(
  pages: PageItem[],
  fromIndex: number,
  toIndex: number
): PageItem[] {
  if (fromIndex < 0 || fromIndex >= pages.length || toIndex < 0 || toIndex >= pages.length) {
    return pages;
  }
  const result = [...pages];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Rotates a specific page by delta degrees (e.g. 90, 180, -90)
 */
export function rotatePage(
  pages: PageItem[],
  pageId: string,
  delta: number = 90
): PageItem[] {
  return pages.map((page) => {
    if (page.id !== pageId) return page;
    let newRotation = (page.rotation + delta) % 360;
    if (newRotation < 0) newRotation += 360;
    return { ...page, rotation: newRotation };
  });
}

/**
 * Parses user range strings (e.g., "1-3, 5, 8") into 0-based page indices
 */
export function parsePageRangeString(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr.trim()) return [];
  const indices = new Set<number>();
  const parts = rangeStr.split(",");

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Compiles selected pages from source PDFs into a single merged and rotated PDF
 */
export async function compileOrganizedPdf(
  pages: PageItem[],
  fileBuffers: Record<string, Uint8Array>
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  // Cache loaded source documents to avoid repeated parsing
  const loadedDocs: Record<string, PDFDocument> = {};
  for (const fileId of Object.keys(fileBuffers)) {
    loadedDocs[fileId] = await PDFDocument.load(fileBuffers[fileId]);
  }

  for (const pageItem of pages) {
    const srcDoc = loadedDocs[pageItem.fileId];
    if (!srcDoc) continue;

    const [copiedPage] = await mergedPdf.copyPages(srcDoc, [pageItem.sourcePageIndex]);

    // Apply rotation
    if (pageItem.rotation !== 0) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRotation + pageItem.rotation) % 360));
    }

    mergedPdf.addPage(copiedPage);
  }

  return mergedPdf.save();
}
