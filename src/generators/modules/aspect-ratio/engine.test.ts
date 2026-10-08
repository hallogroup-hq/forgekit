import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateGcd,
  calculateAspectRatioMetrics,
  scalePreservingRatio,
  generateCssSnippet,
  generateTailwindSnippet,
} from "./engine";

describe("Aspect Ratio Engine", () => {
  describe("calculateGcd", () => {
    it("should calculate greatest common divisor accurately", () => {
      assert.equal(calculateGcd(1920, 1080), 120);
      assert.equal(calculateGcd(1080, 1080), 1080);
      assert.equal(calculateGcd(17, 19), 1);
    });
  });

  describe("calculateAspectRatioMetrics", () => {
    it("should simplify standard 1920x1080 to 16:9", () => {
      const metrics = calculateAspectRatioMetrics(1920, 1080);
      assert.equal(metrics.simplifiedW, 16);
      assert.equal(metrics.simplifiedH, 9);
      assert.equal(metrics.ratioString, "16:9");
      assert.equal(metrics.decimalRatioFormatted, "1.778");
      assert.equal(metrics.paddingTopPct, "56.250");
    });

    it("should simplify 1080x1920 vertical video to 9:16", () => {
      const metrics = calculateAspectRatioMetrics(1080, 1920);
      assert.equal(metrics.simplifiedW, 9);
      assert.equal(metrics.simplifiedH, 16);
      assert.equal(metrics.ratioString, "9:16");
    });

    it("should simplify 1024x768 to 4:3", () => {
      const metrics = calculateAspectRatioMetrics(1024, 768);
      assert.equal(metrics.simplifiedW, 4);
      assert.equal(metrics.simplifiedH, 3);
      assert.equal(metrics.ratioString, "4:3");
    });

    it("should handle edge case minimum bounds (0 or negative input)", () => {
      const metrics = calculateAspectRatioMetrics(0, 0);
      assert.equal(metrics.width, 1);
      assert.equal(metrics.height, 1);
      assert.equal(metrics.simplifiedW, 1);
      assert.equal(metrics.simplifiedH, 1);
    });
  });

  describe("scalePreservingRatio", () => {
    it("should scale height when width changes for 16:9", () => {
      // 1920x1080 scaled to width 1280 -> height 720
      const scaledH = scalePreservingRatio(1280, "width", 1920, 1080);
      assert.equal(scaledH, 720);
    });

    it("should scale width when height changes for 16:9", () => {
      // height 720 -> width 1280
      const scaledW = scalePreservingRatio(720, "height", 1920, 1080);
      assert.equal(scaledW, 1280);
    });
  });

  describe("generateCssSnippet & generateTailwindSnippet", () => {
    it("should generate CSS snippet with aspect-ratio property and intrinsic padding", () => {
      const metrics = calculateAspectRatioMetrics(1920, 1080);
      const css = generateCssSnippet(metrics);
      assert.ok(css.includes("aspect-ratio: 16 / 9;"));
      assert.ok(css.includes("padding-top: 56.250%;"));
      assert.ok(css.includes("max-width: 1920px;"));
    });

    it("should generate Tailwind snippet with aspect-video shortcut", () => {
      const metrics = calculateAspectRatioMetrics(1920, 1080);
      const tw = generateTailwindSnippet(metrics);
      assert.ok(tw.includes("aspect-video"));
    });
  });
});
