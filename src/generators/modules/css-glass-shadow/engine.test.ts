import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hexToRgb,
  getElevationShadow,
  generateGlassmorphismCss,
  generateGlassmorphismTailwind,
} from "./engine";

describe("CSS Glass & Shadow Engine", () => {
  describe("hexToRgb", () => {
    it("should convert hex colors to RGB values", () => {
      assert.deepEqual(hexToRgb("#ffffff"), { r: 255, g: 255, b: 255, stringVal: "255, 255, 255" });
      assert.deepEqual(hexToRgb("#000000"), { r: 0, g: 0, b: 0, stringVal: "0, 0, 0" });
      assert.deepEqual(hexToRgb("#2563eb"), { r: 37, g: 99, b: 235, stringVal: "37, 99, 235" });
    });
  });

  describe("getElevationShadow", () => {
    it("should return distinct shadow strings across 5 levels", () => {
      const s1 = getElevationShadow(1);
      const s3 = getElevationShadow(3);
      const s5 = getElevationShadow(5);
      assert.notEqual(s1, s3);
      assert.notEqual(s3, s5);
      assert.ok(s3.includes("10px 15px"));
    });
  });

  describe("generateGlassmorphismCss & Tailwind", () => {
    it("should produce valid backdrop-filter and box-shadow declarations", () => {
      const css = generateGlassmorphismCss({
        blur: 16,
        opacity: 25,
        borderOpacity: 20,
        elevation: 3,
        surfaceColor: "#ffffff",
      });

      assert.ok(css.includes("backdrop-filter: blur(16px);"));
      assert.ok(css.includes("background: rgba(255, 255, 255, 0.25);"));
      assert.ok(css.includes("border: 1px solid rgba(255, 255, 255, 0.2);"));
    });

    it("should produce Tailwind utility string", () => {
      const tw = generateGlassmorphismTailwind({
        blur: 12,
        opacity: 30,
        borderOpacity: 15,
        elevation: 2,
        surfaceColor: "#000000",
      });

      assert.ok(tw.includes("backdrop-blur-[12px]"));
    });
  });
});
