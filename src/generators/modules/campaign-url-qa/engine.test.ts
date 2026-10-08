import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { auditCampaignUrl, auditUrlBatch, exportQaReportToCsv } from "./engine";

describe("Campaign URL QA & UTM Auditor Engine", () => {
  describe("auditCampaignUrl", () => {
    it("should mark perfectly configured URL as valid", () => {
      const res = auditCampaignUrl(
        "https://example.com/landing?utm_source=google&utm_medium=cpc&utm_campaign=spring-2026"
      );
      assert.equal(res.status, "valid");
      assert.equal(res.issues.length, 0);
      assert.equal(res.utm.source, "google");
      assert.equal(res.utm.medium, "cpc");
      assert.equal(res.utm.campaign, "spring-2026");
    });

    it("should flag missing mandatory UTM parameters as errors", () => {
      const res = auditCampaignUrl("https://example.com/landing?utm_source=google");
      assert.equal(res.status, "error");
      assert.ok(res.issues.some((i) => i.code === "MISSING_UTM_MEDIUM"));
      assert.ok(res.issues.some((i) => i.code === "MISSING_UTM_CAMPAIGN"));
    });

    it("should flag uppercase letters in UTM tags as warning", () => {
      const res = auditCampaignUrl(
        "https://example.com/?utm_source=Facebook&utm_medium=paid-social&utm_campaign=Launch"
      );
      assert.equal(res.status, "warning");
      assert.ok(res.issues.some((i) => i.code === "UPPERCASE_PARAM"));
      // Check that normalizedUrl lowercases them
      assert.ok(res.normalizedUrl.includes("utm_source=facebook"));
      assert.ok(res.normalizedUrl.includes("utm_campaign=launch"));
    });

    it("should flag duplicate query parameters as error", () => {
      const res = auditCampaignUrl(
        "https://example.com/?utm_source=google&utm_medium=cpc&utm_campaign=promo&utm_source=meta"
      );
      assert.equal(res.status, "error");
      assert.ok(res.issues.some((i) => i.code === "DUPLICATE_PARAM"));
    });
  });

  describe("auditUrlBatch & exportQaReportToCsv", () => {
    it("should audit multiple lines and compute health score", () => {
      const batchInput = `
https://example.com/?utm_source=google&utm_medium=cpc&utm_campaign=good
https://example.com/?utm_source=Google&utm_medium=cpc&utm_campaign=mixed
https://example.com/?broken=true
      `;
      const summary = auditUrlBatch(batchInput);
      assert.equal(summary.total, 3);
      assert.equal(summary.validCount, 1);
      assert.equal(summary.warningCount, 1);
      assert.equal(summary.errorCount, 1);
      assert.ok(summary.healthScorePercent < 100);
    });

    it("should export audit findings to CSV format", () => {
      const summary = auditUrlBatch(
        "https://example.com/?utm_source=google&utm_medium=cpc&utm_campaign=demo"
      );
      const csv = exportQaReportToCsv(summary.items);
      assert.ok(csv.startsWith("ID,Status,Original URL"));
      assert.ok(csv.includes("VALID"));
      assert.ok(csv.includes("google"));
    });
  });
});
