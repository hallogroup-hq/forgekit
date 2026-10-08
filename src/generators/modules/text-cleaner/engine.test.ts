import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cleanText,
  toSentenceCase,
  toTitleCase,
  toCamelCase,
  toSnakeCase,
  toKebabCase,
  computeTextStats,
} from "./engine";

describe("Text Cleaner & Formatter Engine", () => {
  describe("cleanText whitespace & line operations", () => {
    it("should collapse multiple spaces into single space", () => {
      const input = "This   has    way  too   many    spaces.";
      const out = cleanText(input, { normalizeWhitespace: true });
      assert.equal(out, "This has way too many spaces.");
    });

    it("should remove empty lines and trim lines", () => {
      const input = "  Line 1  \n\n\n   Line 2   \n\n Line 3 ";
      const out = cleanText(input, { trimLines: true, removeEmptyLines: true });
      assert.equal(out, "Line 1\nLine 2\nLine 3");
    });

    it("should remove duplicate lines", () => {
      const input = "Apple\nBanana\nApple\nOrange\nBanana";
      const out = cleanText(input, { removeDuplicateLines: true });
      assert.equal(out, "Apple\nBanana\nOrange");
    });

    it("should sort lines alphabetically", () => {
      const input = "Zebra\nApple\nMango";
      const asc = cleanText(input, { sortLines: "asc" });
      assert.equal(asc, "Apple\nMango\nZebra");

      const desc = cleanText(input, { sortLines: "desc" });
      assert.equal(desc, "Zebra\nMango\nApple");
    });

    it("should strip HTML tags", () => {
      const input = "<p>Hello <strong>World</strong>!</p>";
      const out = cleanText(input, { stripHtml: true });
      assert.equal(out, "Hello World!");
    });
  });

  describe("Case Transformations", () => {
    it("toSentenceCase should capitalize first letter of sentences", () => {
      const input = "hello world. how are you? i am great! nice.";
      assert.equal(toSentenceCase(input), "Hello world. How are you? I am great! Nice.");
    });

    it("toTitleCase should format title casing", () => {
      const input = "the quick brown fox jumps over the lazy dog";
      assert.equal(toTitleCase(input), "The Quick Brown Fox Jumps Over the Lazy Dog");
    });

    it("toCamelCase should convert string to camelCase", () => {
      assert.equal(toCamelCase("hello world test"), "helloWorldTest");
      assert.equal(toCamelCase("user-profile_photo"), "userProfilePhoto");
    });

    it("toSnakeCase should convert string to snake_case", () => {
      assert.equal(toSnakeCase("Hello World Test"), "hello_world_test");
      assert.equal(toSnakeCase("userProfileAvatar"), "user_profile_avatar");
    });

    it("toKebabCase should convert string to kebab-case", () => {
      assert.equal(toKebabCase("Hello World Test"), "hello-world-test");
      assert.equal(toKebabCase("userProfileAvatar"), "user-profile-avatar");
    });
  });

  describe("computeTextStats", () => {
    it("should compute accurate text statistics", () => {
      const text = "Hello world.\nThis is ForgeKit.";
      const stats = computeTextStats(text);
      assert.equal(stats.characters, 30);
      assert.equal(stats.words, 5);
      assert.equal(stats.lines, 2);
      assert.equal(stats.nonEmptyLines, 2);
      assert.ok(stats.bytes >= 30);
      assert.equal(stats.readingTimeMinutes, 1);
    });
  });
});
