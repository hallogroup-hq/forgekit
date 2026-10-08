import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORMS,
  compileBio,
  validateBioLength,
  extractEntities,
} from "./engine";

describe("Social Bio Studio Engine", () => {
  describe("compileBio", () => {
    it("should join parts with custom separator when inline", () => {
      const bio = compileBio("Builder", "10k users", "Try now", "|", false);
      assert.equal(bio, "Builder | 10k users | Try now");
    });

    it("should join parts with newlines when multiline", () => {
      const bio = compileBio("Builder", "10k users", "Try now", "|", true);
      assert.equal(bio, "Builder\n10k users\nTry now");
    });
  });

  describe("validateBioLength", () => {
    it("should report remaining characters within platform budget", () => {
      const val = validateBioLength("Hello world", "x");
      assert.equal(val.charCount, 11);
      assert.equal(val.maxChars, 160);
      assert.equal(val.remainingChars, 149);
      assert.equal(val.isOverBudget, false);
    });

    it("should flag when text exceeds TikTok 80-character limit", () => {
      const longBio = "A".repeat(85);
      const val = validateBioLength(longBio, "tiktok");
      assert.equal(val.isOverBudget, true);
      assert.equal(val.remainingChars, -5);
    });
  });

  describe("extractEntities", () => {
    it("should parse handles and hashtags", () => {
      const bio = "Founder @ForgeKit building #AI and #NextJS";
      const { mentions, hashtags } = extractEntities(bio);
      assert.deepEqual(mentions, ["@forgekit"]);
      assert.deepEqual(hashtags, ["#ai", "#nextjs"]);
    });
  });
});
