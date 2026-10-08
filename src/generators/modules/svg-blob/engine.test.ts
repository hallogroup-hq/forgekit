import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateBlobPath,
  generateWavePath,
  generateSvgMarkup,
} from "./engine";

describe("SVG Blob & Wave Engine", () => {
  describe("generateBlobPath", () => {
    it("should generate closed SVG path string starting with M and ending with Z", () => {
      const path = generateBlobPath(6, 40, 1337);
      assert.ok(path.startsWith("M "));
      assert.ok(path.endsWith(" Z"));
      assert.ok(path.includes(" Q "));
    });

    it("should produce deterministic paths for same seed", () => {
      const path1 = generateBlobPath(6, 40, 42);
      const path2 = generateBlobPath(6, 40, 42);
      assert.equal(path1, path2);
    });
  });

  describe("generateWavePath", () => {
    it("should generate valid wave section path", () => {
      const path = generateWavePath(5, 50, 999);
      assert.ok(path.startsWith("M 0 400"));
      assert.ok(path.endsWith(" L 1200 400 Z"));
    });
  });

  describe("generateSvgMarkup", () => {
    it("should generate complete SVG with linearGradient defs", () => {
      const svg = generateSvgMarkup({
        shapeKind: "blob",
        pointsCount: 6,
        randomness: 30,
        seed: 123,
        fillType: "linear",
        color1: "#ff0000",
        color2: "#0000ff",
      });

      assert.ok(svg.includes("<svg xmlns=\"http://www.w3.org/2000/svg\""));
      assert.ok(svg.includes("<linearGradient id=\"forgekit-blob-grad\""));
      assert.ok(svg.includes("fill=\"url(#forgekit-blob-grad)\""));
      assert.ok(svg.includes("stop-color=\"#ff0000\""));
    });

    it("should generate solid fill without defs when fillType is solid", () => {
      const svg = generateSvgMarkup({
        shapeKind: "wave",
        pointsCount: 6,
        randomness: 30,
        seed: 123,
        fillType: "solid",
        color1: "#3b82f6",
        color2: "#1d4ed8",
      });

      assert.ok(!svg.includes("<defs>"));
      assert.ok(svg.includes("fill=\"#3b82f6\""));
    });
  });
});
