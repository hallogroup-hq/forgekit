import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  distance,
  getDefaultQuad,
} from "../src/generators/modules/document-scanner/engine";
import { PDFDocument } from "pdf-lib";

describe("Document Scanner Engine", () => {
  it("should calculate correct Euclidean distance between two points", () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    assert.equal(distance(p1, p2), 5);
  });

  it("should generate default quad with proper inset proportions", () => {
    const width = 1000;
    const height = 1500;
    const quad = getDefaultQuad(width, height, 0.05);

    assert.equal(quad.tl.x, 50);
    assert.equal(quad.tl.y, 75);
    assert.equal(quad.tr.x, 950);
    assert.equal(quad.tr.y, 75);
    assert.equal(quad.br.x, 950);
    assert.equal(quad.br.y, 1425);
    assert.equal(quad.bl.x, 50);
    assert.equal(quad.bl.y, 1425);
  });

  it("should construct a valid PDF document with pdf-lib", async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    assert.equal(page.getWidth(), 595.28);
    assert.equal(page.getHeight(), 841.89);

    const pdfBytes = await pdfDoc.save();
    assert.ok(pdfBytes.length > 0);
    assert.equal(pdfBytes[0], 0x25); // '%PDF' header check
    assert.equal(pdfBytes[1], 0x50);
    assert.equal(pdfBytes[2], 0x44);
    assert.equal(pdfBytes[3], 0x46);
  });
});
