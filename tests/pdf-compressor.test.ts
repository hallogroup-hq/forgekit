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

  it("should estimate optimal target compression parameters based on target size and page count", async () => {
    const { estimateTargetCompressionParams, TARGET_SIZE_PRESETS } = await import(
      "../src/generators/modules/pdf-compressor/engine"
    );

    // Verify presets
    assert.equal(TARGET_SIZE_PRESETS.length, 5);
    assert.equal(TARGET_SIZE_PRESETS[0].bytes, 300 * 1024);
    assert.equal(TARGET_SIZE_PRESETS[2].bytes, 1024 * 1024);

    // Large budget for 1 page (e.g. 5 MB target) -> should assign high scale and quality
    const highBudget = estimateTargetCompressionParams(5 * 1024 * 1024, 1);
    assert.ok(highBudget.scale >= 1.4);
    assert.ok(highBudget.quality >= 0.85);

    // Moderate budget (e.g. 1 MB target for 5 pages = ~190KB/page)
    const midBudget = estimateTargetCompressionParams(1024 * 1024, 5);
    assert.ok(midBudget.scale >= 1.0 && midBudget.scale <= 1.6);
    assert.ok(midBudget.quality >= 0.70 && midBudget.quality <= 0.90);

    // Tight budget (e.g. 300 KB target for 10 pages = ~30KB/page)
    const tightBudget = estimateTargetCompressionParams(300 * 1024, 10);
    assert.ok(tightBudget.scale <= 1.0);
    assert.ok(tightBudget.quality <= 0.65);
  });

  it("should calibrate target parameters with sample page probe data accurately", async () => {
    const { estimateTargetCompressionParams } = await import(
      "../src/generators/modules/pdf-compressor/engine"
    );

    // Simulated probe on page 1 at scale 1.25:
    // Q85 = 120 KB, Q65 = 70 KB, Q45 = 40 KB
    const probe = {
      sampleScale: 1.25,
      bytesAtQ85: 120 * 1024,
      bytesAtQ65: 70 * 1024,
      bytesAtQ45: 40 * 1024,
    };

    // If target is 2 MB for 2 pages = 1 MB / page (targetPerPage >> bytesAtQ85)
    const generousResult = estimateTargetCompressionParams(2 * 1024 * 1024, 2, probe);
    assert.ok(generousResult.scale >= 1.25);
    assert.equal(generousResult.quality, 0.88);

    // If target is 200 KB for 2 pages = 100 KB / page (between Q65 and Q85)
    const interpResult = estimateTargetCompressionParams(200 * 1024, 2, probe);
    assert.equal(interpResult.scale, 1.25);
    assert.ok(interpResult.quality >= 0.65 && interpResult.quality <= 0.85);

    // If target is 60 KB for 2 pages = 30 KB / page (below Q45)
    const constrainedResult = estimateTargetCompressionParams(60 * 1024, 2, probe);
    assert.ok(constrainedResult.scale < 1.25);
    assert.ok(constrainedResult.quality < 0.60);
  });
});
