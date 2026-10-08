import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateQuotationTotals,
  formatPrice,
  formatQuotationMarkdown,
  QuotationData,
} from "./engine";

describe("Quotation & Cost Estimate Engine", () => {
  describe("calculateQuotationTotals", () => {
    it("should compute line items, taxes, discounts, and milestone amounts", () => {
      const items = [
        { id: "1", deliverable: "Wireframes", units: 10, rate: 80 },
        { id: "2", deliverable: "Prototypes", units: 1, rate: 1200 },
      ];
      const milestones = [
        { id: "1", name: "Deposit", percentage: 50 },
        { id: "2", name: "Delivery", percentage: 50 },
      ];
      const totals = calculateQuotationTotals(items, 10, 100, milestones);

      assert.equal(totals.lineTotals[0].amount, 800);
      assert.equal(totals.lineTotals[1].amount, 1200);
      assert.equal(totals.subtotal, 2000);
      assert.equal(totals.taxAmount, 200); // 10% of 2000
      assert.equal(totals.discountAmount, 100);
      assert.equal(totals.total, 2100); // 2000 + 200 - 100 = 2100

      // Milestone allocations
      assert.equal(totals.milestoneAllocations[0].amount, 1050); // 50% of 2100
      assert.equal(totals.milestoneAllocations[1].amount, 1050);
    });

    it("should handle empty or negative entries cleanly", () => {
      const totals = calculateQuotationTotals([], 0, 0, []);
      assert.equal(totals.subtotal, 0);
      assert.equal(totals.total, 0);
      assert.equal(totals.milestoneAllocations.length, 0);
    });
  });

  describe("formatPrice", () => {
    it("should format dollar and other currency symbols", () => {
      assert.equal(formatPrice(5000, "$"), "$5,000.00");
      assert.equal(formatPrice(250.75, "€"), "€250.75");
    });
  });

  describe("formatQuotationMarkdown", () => {
    it("should output valid markdown with quote details and milestones", () => {
      const quote: QuotationData = {
        quotationNumber: "EST-2026-001",
        title: "Mobile App Redesign",
        issueDate: "2026-10-08",
        validUntil: "2026-11-08",
        currencySymbol: "$",
        provider: { name: "Studio", email: "info@studio.com", company: "Studio Inc", address: "SF" },
        client: { name: "Client", email: "client@corp.com", company: "Corp", address: "NYC" },
        scopeSummary: "Complete redesign of mobile iOS application.",
        items: [{ id: "1", deliverable: "Design Sprint", units: 1, rate: 3000 }],
        milestones: [{ id: "1", name: "Initial Deposit", percentage: 50 }],
        taxPercent: 10,
        discountAmount: 0,
        terms: "50% upfront before work commences.",
      };
      const totals = calculateQuotationTotals(quote.items, quote.taxPercent, quote.discountAmount, quote.milestones);
      const md = formatQuotationMarkdown(quote, totals);

      assert.ok(md.includes("# Project Quotation: Mobile App Redesign"));
      assert.ok(md.includes("EST-2026-001"));
      assert.ok(md.includes("Design Sprint"));
      assert.ok(md.includes("Initial Deposit"));
      assert.ok(md.includes("$3,300.00"));
    });
  });
});
