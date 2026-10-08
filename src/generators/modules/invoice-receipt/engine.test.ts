import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  roundCurrency,
  calculateInvoiceTotals,
  formatCurrencyAmount,
  generateInvoiceSummaryText,
  InvoiceData,
} from "./engine";

describe("Invoice & Receipt Engine", () => {
  describe("roundCurrency", () => {
    it("should round float values to 2 decimal places properly", () => {
      assert.equal(roundCurrency(10.555), 10.56);
      assert.equal(roundCurrency(10.554), 10.55);
      assert.equal(roundCurrency(0.1 + 0.2), 0.3);
    });
  });

  describe("calculateInvoiceTotals", () => {
    it("should calculate line item totals and subtotal correctly", () => {
      const items = [
        { id: "1", description: "Design", quantity: 2, unitPrice: 50 },
        { id: "2", description: "Development", quantity: 10, unitPrice: 100 },
      ];
      const totals = calculateInvoiceTotals(items, 10, 50);

      assert.equal(totals.lineTotals[0].amount, 100);
      assert.equal(totals.lineTotals[1].amount, 1000);
      assert.equal(totals.subtotal, 1100);
      assert.equal(totals.taxAmount, 110); // 10% of 1100
      assert.equal(totals.discountAmount, 50);
      assert.equal(totals.total, 1160); // 1100 + 110 - 50 = 1160
    });

    it("should floor total balance due at 0 if discount exceeds total", () => {
      const items = [{ id: "1", description: "Small task", quantity: 1, unitPrice: 20 }];
      const totals = calculateInvoiceTotals(items, 0, 100); // 20 - 100
      assert.equal(totals.total, 0);
    });

    it("should handle empty line items gracefully", () => {
      const totals = calculateInvoiceTotals([], 10, 0);
      assert.equal(totals.subtotal, 0);
      assert.equal(totals.taxAmount, 0);
      assert.equal(totals.total, 0);
    });
  });

  describe("formatCurrencyAmount", () => {
    it("should format currency with commas and 2 decimals", () => {
      assert.equal(formatCurrencyAmount(1234.5, "$"), "$1,234.50");
      assert.equal(formatCurrencyAmount(0, "€"), "€0.00");
    });
  });

  describe("generateInvoiceSummaryText", () => {
    it("should generate formatted plain-text summary", () => {
      const invoiceData: InvoiceData = {
        invoiceNumber: "INV-001",
        issueDate: "2026-10-08",
        dueDate: "2026-10-22",
        currencySymbol: "$",
        sender: { name: "Studio", email: "a@b.com", address: "SF" },
        client: { name: "Client", email: "c@d.com", address: "NYC" },
        items: [{ id: "1", description: "Item 1", quantity: 1, unitPrice: 100 }],
        taxPercent: 5,
        discountAmount: 10,
        notes: "Pay within 14 days",
      };
      const totals = calculateInvoiceTotals(invoiceData.items, 5, 10);
      const text = generateInvoiceSummaryText(invoiceData, totals);

      assert.ok(text.includes("INVOICE INV-001"));
      assert.ok(text.includes("Subtotal: $100.00"));
      assert.ok(text.includes("TOTAL BALANCE DUE: $95.00"));
    });
  });
});
