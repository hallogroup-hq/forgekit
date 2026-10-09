import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {
  STAMP_COLOR_MAP,
  bakeElementsIntoPdf,
  PlacedElement,
} from "../src/generators/modules/pdf-signer/engine";

describe("PDF Signer Engine", () => {
  it("should have correct stamp ink color mappings", () => {
    assert.deepEqual(STAMP_COLOR_MAP.blue, [26, 68, 160]);
    assert.deepEqual(STAMP_COLOR_MAP.red, [185, 28, 28]);
    assert.deepEqual(STAMP_COLOR_MAP.purple, [109, 40, 217]);
    assert.deepEqual(STAMP_COLOR_MAP.green, [21, 128, 61]);
  });

  it("should bake signature and stamp overlays onto a PDF without errors", async () => {
    // 1. Create a dummy single-page PDF
    const sourcePdf = await PDFDocument.create();
    sourcePdf.addPage([600, 800]);
    const sourcePdfBytes = await sourcePdf.save();

    // 2. Create a minimal 1x1 transparent PNG data URL
    // Minimal valid 1x1 PNG base64
    const samplePngDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const elements: PlacedElement[] = [
      {
        id: "sig-1",
        type: "signature",
        pageNumber: 1,
        x: 60,
        y: 75,
        width: 25,
        height: 10,
        dataUrl: samplePngDataUrl,
        opacity: 0.95,
        rotation: 0,
      },
      {
        id: "stamp-1",
        type: "stamp",
        pageNumber: 1,
        x: 55,
        y: 70,
        width: 20,
        height: 15,
        dataUrl: samplePngDataUrl,
        opacity: 0.85,
        rotation: -4,
      },
    ];

    // 3. Bake elements into PDF
    const outputPdfBytes = await bakeElementsIntoPdf(sourcePdfBytes, elements);
    assert.ok(outputPdfBytes.length > 0);

    // 4. Verify output is a valid PDF that can be parsed
    const verifiedPdf = await PDFDocument.load(outputPdfBytes);
    assert.equal(verifiedPdf.getPageCount(), 1);
    const page = verifiedPdf.getPage(0);
    assert.equal(page.getWidth(), 600);
    assert.equal(page.getHeight(), 800);
  });
});
