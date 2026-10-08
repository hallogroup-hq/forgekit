import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateNewDimensions, RESIZE_PRESETS } from "./engine";

describe("Batch Image Resizer Engine", () => {
  describe("Percentage Scaling", () => {
    it("should halve dimensions when percentage is 50%", () => {
      const res = calculateNewDimensions(1920, 1080, {
        mode: "percentage",
        percentage: 50,
        maintainAspectRatio: true,
      });
      assert.equal(res.width, 960);
      assert.equal(res.height, 540);
    });

    it("should double dimensions when percentage is 200%", () => {
      const res = calculateNewDimensions(800, 600, {
        mode: "percentage",
        percentage: 200,
        maintainAspectRatio: true,
      });
      assert.equal(res.width, 1600);
      assert.equal(res.height, 1200);
    });
  });

  describe("Exact Dimensions & Aspect Ratio Lock", () => {
    it("should preserve aspect ratio when only width is provided", () => {
      const res = calculateNewDimensions(1000, 500, {
        mode: "dimensions",
        targetWidth: 500,
        maintainAspectRatio: true,
      });
      assert.equal(res.width, 500);
      assert.equal(res.height, 250);
    });

    it("should allow arbitrary stretch when maintainAspectRatio is false", () => {
      const res = calculateNewDimensions(1000, 500, {
        mode: "dimensions",
        targetWidth: 300,
        targetHeight: 300,
        maintainAspectRatio: false,
      });
      assert.equal(res.width, 300);
      assert.equal(res.height, 300);
    });
  });

  describe("Fit-Box Max Dimension", () => {
    it("should downscale landscape image to fit max dimension box", () => {
      const res = calculateNewDimensions(4000, 2000, {
        mode: "fit-box",
        maxFitDimension: 1000,
        maintainAspectRatio: true,
      });
      assert.equal(res.width, 1000);
      assert.equal(res.height, 500);
    });

    it("should downscale portrait image to fit max dimension box", () => {
      const res = calculateNewDimensions(2000, 4000, {
        mode: "fit-box",
        maxFitDimension: 1000,
        maintainAspectRatio: true,
      });
      assert.equal(res.width, 500);
      assert.equal(res.height, 1000);
    });

    it("should leave images smaller than maxFitDimension unchanged", () => {
      const res = calculateNewDimensions(800, 600, {
        mode: "fit-box",
        maxFitDimension: 1200,
        maintainAspectRatio: true,
      });
      assert.equal(res.width, 800);
      assert.equal(res.height, 600);
    });
  });

  describe("Preset Resizing", () => {
    it("should fit within social landscape box without distortion", () => {
      const res = calculateNewDimensions(1920, 1080, {
        mode: "preset",
        preset: "social-landscape",
        maintainAspectRatio: true,
      });
      assert.ok(res.width <= 1200);
      assert.ok(res.height <= 630);
      // 16:9 ratio in 1200x630 -> width 1120, height 630
      assert.equal(res.height, 630);
      assert.equal(res.width, 1120);
    });
  });
});
