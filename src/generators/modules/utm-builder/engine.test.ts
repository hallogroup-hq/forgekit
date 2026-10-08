import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildUtmUrl,
  sanitizeUtmValue,
  buildUtmMatrix,
  exportMatrixToCsv,
  DEFAULT_CHANNELS,
} from "./engine";

describe("UTM Campaign Builder Engine", () => {
  describe("sanitizeUtmValue", () => {
    it("should convert spaces to hyphens and lowercase by default", () => {
      const sanitized = sanitizeUtmValue("Black Friday 2026 Sale");
      assert.equal(sanitized, "black-friday-2026-sale");
    });

    it("should support underscore space replacement", () => {
      const sanitized = sanitizeUtmValue("Summer Promo", {
        spaceReplacement: "_",
        autoLowercase: true,
      });
      assert.equal(sanitized, "summer_promo");
    });
  });

  describe("buildUtmUrl", () => {
    it("should build valid tagged URL from clean base URL", () => {
      const res = buildUtmUrl("https://example.com/pricing", {
        source: "google",
        medium: "cpc",
        campaign: "spring-promo",
        term: "developer tools",
        content: "banner-v1",
      });

      assert.equal(res.isValid, true);
      assert.equal(
        res.url,
        "https://example.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=spring-promo&utm_term=developer-tools&utm_content=banner-v1"
      );
    });

    it("should preserve existing query parameters and hash fragment", () => {
      const res = buildUtmUrl("https://shop.com/item?id=42&coupon=SAVE10#reviews", {
        source: "newsletter",
        medium: "email",
        campaign: "weekly-roundup",
      });

      assert.equal(res.isValid, true);
      assert.ok(res.url.includes("id=42"));
      assert.ok(res.url.includes("coupon=SAVE10"));
      assert.ok(res.url.includes("utm_source=newsletter"));
      assert.ok(res.url.endsWith("#reviews"));
    });

    it("should report missing recommended parameters", () => {
      const res = buildUtmUrl("https://example.com", {
        source: "twitter",
        medium: "",
        campaign: "",
      });

      assert.equal(res.isValid, false);
      assert.ok(res.errors.includes("utm_medium is recommended for standard tracking"));
      assert.ok(res.errors.includes("utm_campaign is recommended for standard tracking"));
    });
  });

  describe("buildUtmMatrix & exportMatrixToCsv", () => {
    it("should generate matrix rows for all channels", () => {
      const matrix = buildUtmMatrix(
        "https://forgekit.dev",
        DEFAULT_CHANNELS,
        "v2-launch",
        "header-cta"
      );

      assert.equal(matrix.length, DEFAULT_CHANNELS.length);
      assert.equal(matrix[0].source, "google");
      assert.ok(matrix[0].url.includes("utm_source=google"));
    });

    it("should export matrix to standard RFC 4180 CSV", () => {
      const matrix = buildUtmMatrix(
        "https://forgekit.dev",
        DEFAULT_CHANNELS.slice(0, 2),
        "launch"
      );
      const csv = exportMatrixToCsv(matrix);

      assert.ok(csv.startsWith("Channel,Source,Medium,Campaign,Target URL"));
      assert.ok(csv.includes("Google Ads"));
      assert.ok(csv.includes("Meta (FB / IG)"));
    });
  });
});
