import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getExtensionForMime,
  calculateEstimatedSavings,
  COMPRESSION_PROFILES,
} from "./engine";

describe("Image Converter & Compressor Engine", () => {
  describe("MIME Extension Resolution", () => {
    it("should return webp extension for image/webp", () => {
      assert.equal(getExtensionForMime("image/webp"), "webp");
    });

    it("should return jpg extension for image/jpeg", () => {
      assert.equal(getExtensionForMime("image/jpeg"), "jpg");
    });

    it("should return png extension for image/png", () => {
      assert.equal(getExtensionForMime("image/png"), "png");
    });
  });

  describe("calculateEstimatedSavings", () => {
    it("should calculate correct percentage savings when file is compressed", () => {
      const original = 1000000; // 1 MB
      const compressed = 250000; // 250 KB
      const res = calculateEstimatedSavings(original, compressed);
      assert.equal(res.savedBytes, 750000);
      assert.equal(res.savingsPercentage, 75);
      assert.equal(res.isSmaller, true);
    });

    it("should handle identical size gracefully", () => {
      const res = calculateEstimatedSavings(5000, 5000);
      assert.equal(res.savedBytes, 0);
      assert.equal(res.savingsPercentage, 0);
      assert.equal(res.isSmaller, false);
    });
  });

  describe("Compression Profiles", () => {
    it("should provide valid quality scale between 0.1 and 1.0", () => {
      assert.ok(COMPRESSION_PROFILES.balanced.quality >= 0.1 && COMPRESSION_PROFILES.balanced.quality <= 1.0);
      assert.ok(COMPRESSION_PROFILES.high.quality > COMPRESSION_PROFILES.balanced.quality);
      assert.ok(COMPRESSION_PROFILES.aggressive.quality < COMPRESSION_PROFILES.balanced.quality);
    });
  });
});
