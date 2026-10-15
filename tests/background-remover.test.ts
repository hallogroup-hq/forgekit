import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  colorDistanceRedmean,
  detectDominantCornerColor,
  processBackgroundRemovalGlobal,
  processBackgroundRemovalContiguous,
  applyBrushStroke,
  autoCropTransparentEdges,
  RemovalOptions,
} from "../src/generators/modules/background-remover/engine";

// Polyfill ImageData for Node test environment
if (typeof (globalThis as any).ImageData === "undefined") {
  class MockImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, maybeHeight?: number) {
      if (typeof dataOrWidth === "number") {
        this.width = dataOrWidth;
        this.height = widthOrHeight;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        this.data = dataOrWidth;
        this.width = widthOrHeight;
        this.height = maybeHeight!;
      }
    }
  }
  (globalThis as any).ImageData = MockImageData;
}

describe("Background Remover Engine (Non-AI)", () => {
  it("should calculate correct perceptual Redmean color distance", () => {
    // Identical colors must have 0 distance
    assert.equal(colorDistanceRedmean(255, 255, 255, 255, 255, 255), 0);
    assert.equal(colorDistanceRedmean(120, 80, 200, 120, 80, 200), 0);

    // White vs Black must be maximum distance ~100
    const whiteBlackDist = colorDistanceRedmean(255, 255, 255, 0, 0, 0);
    assert.ok(whiteBlackDist >= 99);

    // Subtle difference should be small distance
    const subtle = colorDistanceRedmean(255, 255, 255, 248, 248, 248);
    assert.ok(subtle < 5);
  });

  it("should detect dominant corner/perimeter color accurately", () => {
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);

    // Fill with green background (0, 255, 0, 255)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 0;
      data[i * 4 + 1] = 255;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 255;
    }

    const detected = detectDominantCornerColor(data, width, height);
    assert.deepEqual(detected, { r: 0, g: 255, b: 0 });
  });

  it("should remove background globally based on color distance and tolerance", () => {
    const width = 2;
    const height = 2;
    // 2x2 image:
    // [White, White]
    // [Red,   White]
    const data = new Uint8ClampedArray([
      255, 255, 255, 255,   255, 255, 255, 255,
      255, 0,   0,   255,   255, 255, 255, 255,
    ]);

    const sourceData = new ImageData(data, width, height);
    const options: RemovalOptions = {
      mode: "global",
      targetColor: { r: 255, g: 255, b: 255 },
      tolerance: 10,
      feather: 0,
      defringe: false,
    };

    const result = processBackgroundRemovalGlobal(sourceData, options);

    // White pixels should be transparent (alpha = 0)
    assert.equal(result.data[3], 0); // (0,0)
    assert.equal(result.data[7], 0); // (1,0)
    assert.equal(result.data[15], 0); // (1,1)

    // Red pixel must remain fully opaque (alpha = 255)
    assert.equal(result.data[11], 255); // (0,1)
    assert.equal(result.data[8], 255); // Red R
    assert.equal(result.data[9], 0);   // Red G
  });

  it("should protect interior subject colors in contiguous flood-fill mode", () => {
    // 5x5 image with white background, black ring, and white center:
    // W W W W W
    // W B B B W
    // W B W B W  <-- Center (2,2) is white, but surrounded by black!
    // W B B B W
    // W W W W W
    const width = 5;
    const height = 5;
    const data = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const isBlackRing =
          (x >= 1 && x <= 3 && y >= 1 && y <= 3) && !(x === 2 && y === 2);

        if (isBlackRing) {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        } else {
          // White
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        }
      }
    }

    const sourceData = new ImageData(data, width, height);
    const options: RemovalOptions = {
      mode: "contiguous",
      targetColor: { r: 255, g: 255, b: 255 },
      tolerance: 10,
      feather: 0,
      defringe: false,
    };

    const result = processBackgroundRemovalContiguous(sourceData, options);

    // Perimeter white pixels must be transparent
    assert.equal(result.data[0 * 4 + 3], 0); // (0,0)
    assert.equal(result.data[(0 * width + 4) * 4 + 3], 0); // (4,0)

    // Black ring pixels must remain opaque
    const blackIdx = (1 * width + 1) * 4;
    assert.equal(result.data[blackIdx + 3], 255);

    // CRITICAL: The interior white pixel at (2,2) MUST BE PRESERVED (alpha = 255)
    // because contiguous fill cannot cross the black boundary!
    const centerIdx = (2 * width + 2) * 4;
    assert.equal(result.data[centerIdx + 3], 255);
  });

  it("should apply manual eraser and restore brush strokes properly", () => {
    const width = 10;
    const height = 10;
    const origData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      origData[i * 4] = 255; // Red
      origData[i * 4 + 3] = 255;
    }

    const original = new ImageData(new Uint8ClampedArray(origData), width, height);
    const current = new ImageData(new Uint8ClampedArray(origData), width, height);

    // Erase center (5, 5) with radius 3
    applyBrushStroke(current, original, 5, 5, 3, "erase");
    const centerIdx = (5 * width + 5) * 4;
    assert.equal(current.data[centerIdx + 3], 0);

    // Restore center (5, 5)
    applyBrushStroke(current, original, 5, 5, 3, "restore");
    assert.equal(current.data[centerIdx + 3], 255);
  });

  it("should auto-crop transparent edges to tight bounding box", () => {
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4); // all transparent alpha = 0

    // Put a 2x2 solid pixel in the center (4,4) to (5,5)
    for (let y = 4; y <= 5; y++) {
      for (let x = 4; x <= 5; x++) {
        const idx = (y * width + x) * 4;
        data[idx] = 200;
        data[idx + 3] = 255;
      }
    }

    const sourceData = new ImageData(data, width, height);
    const cropped = autoCropTransparentEdges(sourceData, 0);

    assert.equal(cropped.width, 2);
    assert.equal(cropped.height, 2);
    assert.equal(cropped.data[3], 255);
  });
});
