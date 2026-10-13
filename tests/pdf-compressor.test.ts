import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import {
  COMPRESSION_PRESETS,
  formatBytes,
  dataUrlToUint8Array,
} from "../src/generators/modules/pdf-compressor/engine";

describe("PDF Compressor Engine", () => {
  it("should have calibrated compression presets with logical scales and quality values", () => {
    const p75 = COMPRESSION_PRESETS["75"];
    const p50 = COMPRESSION_PRESETS["50"];
    const p25 = COMPRESSION_PRESETS["25"];

    assert.ok(p75 && p50 && p25);

    // 75% preset should retain highest quality and scale
    assert.ok(p75.quality > p50.quality);
    assert.ok(p50.quality > p25.quality);

    assert.ok(p75.scale > p50.scale);
    assert.ok(p50.scale >= p25.scale);

    assert.equal(p75.scale, 1.5);
    assert.equal(p75.quality, 0.88);

    assert.equal(p50.scale, 1.25);
    assert.equal(p50.quality, 0.78);

    assert.equal(p25.scale, 1.0);
    assert.equal(p25.quality, 0.68);
  });

  it("should format file sizes accurately into human-readable strings", () => {
    assert.equal(formatBytes(0), "0 B");
    assert.equal(formatBytes(500), "500 B");
    assert.equal(formatBytes(1024), "1 KB");
    assert.equal(formatBytes(1024 * 1024), "1 MB");
    assert.equal(formatBytes(2.5 * 1024 * 1024), "2.5 MB");
    assert.equal(formatBytes(10 * 1024 * 1024 * 1024), "10 GB");
  });

  it("should convert data URLs to Uint8Array safely", () => {
    const sampleDataUrl = "data:text/plain;base64,SGVsbG8gV29ybGQ=";
    const bytes = dataUrlToUint8Array(sampleDataUrl);
    const decoded = Buffer.from(bytes).toString("utf-8");
    assert.equal(decoded, "Hello World");
  });

  it("should create and assemble multi-page compressed PDF documents with pdf-lib", async () => {
    const doc = await PDFDocument.create();
    const page1 = doc.addPage([595.28, 841.89]); // A4
    const page2 = doc.addPage([612, 792]); // Letter

    assert.equal(doc.getPageCount(), 2);
    assert.equal(page1.getWidth(), 595.28);
    assert.equal(page2.getWidth(), 612);

    const savedBytes = await doc.save({ useObjectStreams: true });
    assert.ok(savedBytes.length > 0);

    // Verify valid PDF header
    assert.equal(savedBytes[0], 0x25); // %
    assert.equal(savedBytes[1], 0x50); // P
    assert.equal(savedBytes[2], 0x44); // D
    assert.equal(savedBytes[3], 0x46); // F
  });
});
