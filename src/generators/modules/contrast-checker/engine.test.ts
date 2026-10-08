import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hexToRgb,
  getRelativeLuminance,
  calculateContrastRatio,
} from "./engine";

describe("Color Contrast Engine", () => {
  describe("hexToRgb & luminance", () => {
    it("should parse 3-digit and 6-digit hex values", () => {
      assert.deepEqual(hexToRgb("#fff"), { r: 255, g: 255, b: 255 });
      assert.deepEqual(hexToRgb("#000000"), { r: 0, g: 0, b: 0 });
    });

    it("should compute luminance 1.0 for pure white and 0.0 for pure black", () => {
      assert.equal(getRelativeLuminance(255, 255, 255), 1);
      assert.equal(getRelativeLuminance(0, 0, 0), 0);
    });
  });

  describe("calculateContrastRatio", () => {
    it("should calculate exact 21:1 for black on white", () => {
      const res = calculateContrastRatio("#000000", "#ffffff");
      assert.equal(res.ratio, 21);
      assert.equal(res.aaNormal, true);
      assert.equal(res.aaaNormal, true);
    });

    it("should calculate exact 1:1 for identical colors", () => {
      const res = calculateContrastRatio("#3b82f6", "#3b82f6");
      assert.equal(res.ratio, 1);
      assert.equal(res.aaNormal, false);
      assert.equal(res.aaLarge, false);
    });

    it("should check AA Large passing threshold (3:1)", () => {
      // #767676 on #ffffff is approx 4.54:1 (passes AA Normal)
      const res = calculateContrastRatio("#767676", "#ffffff");
      assert.ok(res.ratio >= 4.5);
      assert.equal(res.aaNormal, true);
    });
  });
});
