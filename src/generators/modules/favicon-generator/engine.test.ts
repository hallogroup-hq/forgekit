import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FAVICON_SPECS,
  createIcoFromPngBuffers,
  generateWebManifest,
  generateHtmlHeadSnippet,
} from "./engine";

describe("Favicon & App Icon Pack Builder Engine", () => {
  it("should list essential web and PWA icon sizes", () => {
    assert.ok(FAVICON_SPECS.some((s) => s.width === 16 && s.height === 16));
    assert.ok(FAVICON_SPECS.some((s) => s.width === 32 && s.height === 32));
    assert.ok(FAVICON_SPECS.some((s) => s.width === 180 && s.height === 180));
    assert.ok(FAVICON_SPECS.some((s) => s.width === 192 && s.height === 192));
    assert.ok(FAVICON_SPECS.some((s) => s.width === 512 && s.height === 512));
  });

  it("should construct a valid multi-resolution ICO binary buffer", () => {
    const dummyPng16 = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2, 3]);
    const dummyPng32 = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 4, 5, 6, 7]);

    const ico = createIcoFromPngBuffers([
      { width: 16, height: 16, pngData: dummyPng16 },
      { width: 32, height: 32, pngData: dummyPng32 },
    ]);

    // Check header
    const view = new DataView(ico.buffer);
    assert.equal(view.getUint16(0, true), 0); // Reserved
    assert.equal(view.getUint16(2, true), 1); // Type = ICO
    assert.equal(view.getUint16(4, true), 2); // 2 images

    // Check first entry
    assert.equal(view.getUint8(6), 16); // Width 16
    assert.equal(view.getUint8(7), 16); // Height 16
    assert.equal(view.getUint32(14, true), dummyPng16.length); // Size

    // Check second entry
    assert.equal(view.getUint8(22), 32); // Width 32
    assert.equal(view.getUint8(23), 32); // Height 32
    assert.equal(view.getUint32(30, true), dummyPng32.length); // Size

    assert.ok(ico.length > 38);
  });

  it("should generate valid PWA webmanifest JSON", () => {
    const jsonStr = generateWebManifest("My ForgeKit App", "ForgeKit");
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.name, "My ForgeKit App");
    assert.equal(parsed.short_name, "ForgeKit");
    assert.equal(parsed.icons.length, 2);
    assert.equal(parsed.display, "standalone");
  });

  it("should generate HTML head tags snippet containing standard link relations", () => {
    const html = generateHtmlHeadSnippet();
    assert.ok(html.includes('rel="icon"'));
    assert.ok(html.includes('rel="apple-touch-icon"'));
    assert.ok(html.includes('rel="manifest"'));
  });
});
