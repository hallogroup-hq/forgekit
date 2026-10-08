import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeWhatsappPhone, buildWhatsappLink, generateHtmlButtonCode } from "./engine";

describe("WhatsApp Link Builder Engine", () => {
  describe("normalizeWhatsappPhone", () => {
    it("should strip leading 0 when combined with country code", () => {
      // Indonesia 081234567890 -> 6281234567890
      const phone = normalizeWhatsappPhone("62", "0812-3456-7890");
      assert.equal(phone, "6281234567890");
    });

    it("should strip non-numeric characters like spaces, dashes, parentheses", () => {
      const phone = normalizeWhatsappPhone("1", "(555) 123-4567");
      assert.equal(phone, "15551234567");
    });

    it("should not duplicate country code if user already included it", () => {
      const phone = normalizeWhatsappPhone("62", "628123456789");
      assert.equal(phone, "628123456789");
    });
  });

  describe("buildWhatsappLink", () => {
    it("should build valid wa.me link with URL-encoded message", () => {
      const res = buildWhatsappLink({
        countryCode: "62",
        phoneNumber: "0812-3456-7890",
        message: "Hello! Can I order product #1?",
      });
      assert.equal(res.isValid, true);
      assert.equal(res.fullPhone, "6281234567890");
      assert.equal(
        res.url,
        "https://wa.me/6281234567890?text=Hello!%20Can%20I%20order%20product%20%231%3F"
      );
    });

    it("should build link without text parameter if message is empty", () => {
      const res = buildWhatsappLink({
        countryCode: "44",
        phoneNumber: "7911 123456",
        message: "",
      });
      assert.equal(res.isValid, true);
      assert.equal(res.url, "https://wa.me/447911123456");
    });

    it("should return invalid for numbers that are too short", () => {
      const res = buildWhatsappLink({
        countryCode: "1",
        phoneNumber: "123",
      });
      assert.equal(res.isValid, false);
      assert.ok(res.validationError);
    });
  });

  describe("generateHtmlButtonCode", () => {
    it("should generate valid anchor markup with SVG icon", () => {
      const html = generateHtmlButtonCode("https://wa.me/6281234567890", "Chat with Us");
      assert.ok(html.startsWith("<a href="));
      assert.ok(html.includes("https://wa.me/6281234567890"));
      assert.ok(html.includes("Chat with Us"));
      assert.ok(html.includes("<svg"));
    });
  });
});
