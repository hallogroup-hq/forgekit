import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateTotalEarnings,
  calculateTotalDeductions,
  calculateNetSalary,
  terbilangIndonesian,
  formatCurrencyIDR,
} from "./engine";

describe("Slip Gaji (Payslip) Generator Engine", () => {
  it("should calculate earnings, deductions, and net salary accurately", () => {
    const earnings = [
      { id: "1", label: "Gaji Pokok", amount: 10000000 },
      { id: "2", label: "Tunjangan", amount: 2000000 },
    ];
    const deductions = [
      { id: "1", label: "BPJS", amount: 500000 },
      { id: "2", label: "PPh 21", amount: 300000 },
    ];

    assert.equal(calculateTotalEarnings(earnings), 12000000);
    assert.equal(calculateTotalDeductions(deductions), 800000);
    assert.equal(calculateNetSalary(earnings, deductions), 11200000);
  });

  it("should convert amounts into correct Indonesian words (Terbilang)", () => {
    assert.equal(terbilangIndonesian(0), "Nol Rupiah");
    assert.equal(terbilangIndonesian(50000), "Lima Puluh Ribu Rupiah");
    assert.equal(terbilangIndonesian(1500000), "Satu Juta Lima Ratus Ribu Rupiah");
    assert.equal(
      terbilangIndonesian(11200000),
      "Sebelas Juta Dua Ratus Ribu Rupiah"
    );
  });

  it("should format IDR currency cleanly", () => {
    const formatted = formatCurrencyIDR(10000000);
    assert.ok(formatted.includes("10.000.000") || formatted.includes("Rp"));
  });
});
