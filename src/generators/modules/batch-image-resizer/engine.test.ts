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
    it("should fit within social landscape box without distortion when fitMode is not set", () => {
      const res = calculateNewDimensions(1920, 1080, {
        mode: "preset",
        preset: "social-landscape",
        maintainAspectRatio: true,
      });
      assert.ok(res.width <= 1200);
      assert.ok(res.height <= 630);
      assert.equal(res.height, 630);
      assert.equal(res.width, 1120);
    });

    it("should return exact preset dimensions when fitMode is specified", () => {
      const resCover = calculateNewDimensions(1920, 1080, {
        mode: "preset",
        preset: "social-landscape",
        maintainAspectRatio: true,
        fitMode: "crop-to-fill",
      });
      assert.equal(resCover.width, 1200);
      assert.equal(resCover.height, 630);

      const resPadding = calculateNewDimensions(1920, 1080, {
        mode: "preset",
        preset: "social-landscape",
        maintainAspectRatio: true,
        fitMode: "fit-with-padding",
      });
      assert.equal(resPadding.width, 1200);
      assert.equal(resPadding.height, 630);
    });
  });

  describe("computeCanvasDrawParams", () => {
    it("should compute centered crop coordinates for Crop to Fill (Cover)", async () => {
      const { computeCanvasDrawParams } = await import("./engine");
      const params = computeCanvasDrawParams(1920, 1080, 1200, 630, "crop-to-fill");
      assert.equal(params.canvasWidth, 1200);
      assert.equal(params.canvasHeight, 630);
      // For 16:9 source in ~1.90:1 target:
      assert.ok(params.drawWidth >= 1200);
      assert.ok(params.drawHeight >= 630);
    });

    it("should compute padded contain coordinates for Fit with Padding (Contain)", async () => {
      const { computeCanvasDrawParams } = await import("./engine");
      const params = computeCanvasDrawParams(1920, 1080, 1200, 630, "fit-with-padding", "#ffffff");
      assert.equal(params.canvasWidth, 1200);
      assert.equal(params.canvasHeight, 630);
      assert.equal(params.backgroundColor, "#ffffff");
      assert.equal(params.drawHeight, 630);
      assert.equal(params.drawWidth, 1120);
      assert.equal(params.drawX, 40); // (1200 - 1120) / 2
      assert.equal(params.drawY, 0);
    });
  });
});
