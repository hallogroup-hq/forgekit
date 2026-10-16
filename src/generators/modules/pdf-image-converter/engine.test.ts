import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateFitDimensions, PAGE_DIMENSIONS, MARGIN_VALUES } from "./engine";

describe("Image to PDF & PDF to Image Engine", () => {
  it("should calculate aspect-fit dimensions properly", () => {
    // 1000x500 image in a 500x500 box -> scale should be 0.5 -> width 500, height 250
    const fit = calculateFitDimensions(1000, 500, 500, 500);
    assert.equal(fit.width, 500);
    assert.equal(fit.height, 250);
    assert.equal(fit.x, 0);
    assert.equal(fit.y, 125); // centered vertically
  });

  it("should have standard A4 dimensions", () => {
    assert.ok(Math.abs(PAGE_DIMENSIONS["a4-portrait"].width - 595.28) < 0.1);
    assert.ok(Math.abs(PAGE_DIMENSIONS["a4-portrait"].height - 841.89) < 0.1);
  });

  it("should define standard margin values", () => {
    assert.equal(MARGIN_VALUES.none, 0);
    assert.equal(MARGIN_VALUES.small, 24);
    assert.equal(MARGIN_VALUES.normal, 48);
  });
});
